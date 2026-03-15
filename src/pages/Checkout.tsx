import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, Lock, Truck, CreditCard, User, Eye, EyeOff } from "lucide-react";
import { z } from "zod";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { settingsService } from "@/lib/settingsService";
import AnnouncementBar from "@/components/AnnouncementBar";
import Navbar from "@/components/Navbar";
import React from "react";

const shippingSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(50),
  lastName: z.string().trim().min(1, "Last name is required").max(50),
  email: z.string().trim().email("Invalid email address").max(255),
  phone: z.string().trim().min(7, "Valid phone number required").max(20),
  address: z.string().trim().min(5, "Address is required").max(200),
  apartment: z.string().trim().max(100).optional(),
  city: z.string().trim().min(1, "City is required").max(100),
  state: z.string().trim().min(1, "State is required").max(100),
  zip: z.string().trim().min(3, "ZIP code is required").max(20),
  country: z.string().trim().min(1, "Country is required").max(100),
});

const accountSchema = z.object({
  createAccount: z.boolean(),
  password: z.string().min(6, "Password must be at least 6 characters").max(100).optional(),
  confirmPassword: z.string().optional(),
}).refine((data) => {
  if (data.createAccount && !data.password) return false;
  return true;
}, { message: "Password is required", path: ["password"] })
.refine((data) => {
  if (data.createAccount && data.password !== data.confirmPassword) return false;
  return true;
}, { message: "Passwords do not match", path: ["confirmPassword"] });

const paymentSchema = z.object({
  cardNumber: z.string().trim().min(13, "Valid card number required").max(19),
  cardName: z.string().trim().min(1, "Cardholder name is required").max(100),
  expiry: z.string().trim().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "Use MM/YY format"),
  cvv: z.string().trim().min(3, "Valid CVV required").max(4),
});

type ShippingForm = z.infer<typeof shippingSchema>;
type PaymentForm = z.infer<typeof paymentSchema>;

const initialShipping: ShippingForm = {
  firstName: "", lastName: "", email: "", phone: "",
  address: "", apartment: "", city: "", state: "", zip: "", country: "United States",
};

const initialPayment: PaymentForm = {
  cardNumber: "", cardName: "", expiry: "", cvv: "",
};

const SHIPPING_COST = 15;
const FREE_SHIPPING_THRESHOLD = 300;
const TAX_RATE = 0.08;

type Step = "shipping" | "payment" | "confirmation";

const Checkout = () => {
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<ShippingForm>(initialShipping);
  const [payment, setPayment] = useState<PaymentForm>(initialPayment);
  const [createAccount, setCreateAccount] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState<Step>("shipping");
  const [submitting, setSubmitting] = useState(false);
  const [savedCards, setSavedCards] = useState<any[]>([]);
  const [useNewCard, setUseNewCard] = useState(true);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [storeSettings, setStoreSettings] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cod">("card");
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [orderDetailsLoading, setOrderDetailsLoading] = useState(false);

  // Auto-fill form with user data when logged in
  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        firstName: user?.user_metadata?.first_name || "",
        lastName: user?.user_metadata?.last_name || "",
        email: user?.email || "",
        phone: user?.user_metadata?.phone || "",
        address: user?.user_metadata?.address || "",
        apartment: user?.user_metadata?.apartment || "",
        city: user?.user_metadata?.city || "",
        state: user?.user_metadata?.state || "",
        zip: user?.user_metadata?.zip || "",
        country: user?.user_metadata?.country || "United States",
      }));
    }
  }, [user]);

  // Load store settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await settingsService.getSettings();
        console.log('Store settings loaded:', settings);
        if (settings) {
          setStoreSettings(settings);
        } else {
          console.log('No settings found, using defaults');
          // Set default settings if none found
          setStoreSettings({
            enable_cod: true,
            enable_reviews: true,
            enable_wishlist: true,
            currency: 'AUD',
            tax_rate: 10,
            free_shipping_min: 100,
            shipping_fee: 15
          });
        }
      } catch (error) {
        console.error('Error loading store settings:', error);
        // Set default settings on error
        setStoreSettings({
          enable_cod: true,
          enable_reviews: true,
          enable_wishlist: true,
          currency: 'AUD',
          tax_rate: 10,
          free_shipping_min: 100,
          shipping_fee: 15
        });
      }
    };
    loadSettings();
  }, []);

  // Calculate totals
  const shippingCost = totalPrice >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const taxAmount = +(totalPrice * TAX_RATE).toFixed(2);
  const grandTotal = totalPrice + shippingCost + taxAmount - discountAmount;

  // Fetch order details when in confirmation step
  useEffect(() => {
    if (step === "confirmation") {
      setOrderDetailsLoading(true);
      const fetchOrderDetails = async () => {
        try {
          console.log('Fetching order details for email:', form.email);
          
          // Get the most recent order for this email/session
          const { data: order, error } = await supabase
            .from("orders")
            .select("*, order_items(*)")
            .eq("customer_email", form.email)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          
          if (error) {
            console.error("Supabase error fetching order:", error);
            // Set a fallback order details to prevent infinite loading
            setOrderDetails({
              order_number: 'FS-' + Date.now(),
              total: grandTotal,
              customer_email: form.email,
              order_items: items.map(item => ({
                product_name: item.product.name,
                size: item.size,
                quantity: item.quantity,
                unit_price: item.product.price
              }))
            });
            setOrderDetailsLoading(false);
            return;
          }
          
          if (order) {
            console.log("Order details found:", order);
            setOrderDetails(order);
          } else {
            console.log("No order found, using fallback");
            // Set a fallback order details to prevent infinite loading
            setOrderDetails({
              order_number: 'FS-' + Date.now(),
              total: grandTotal,
              customer_email: form.email,
              order_items: items.map(item => ({
                product_name: item.product.name,
                size: item.size,
                quantity: item.quantity,
                unit_price: item.product.price
              }))
            });
          }
        } catch (error) {
          console.error("Error fetching order details:", error);
          // Set a fallback order details to prevent infinite loading
          setOrderDetails({
            order_number: 'FS-' + Date.now(),
            total: grandTotal,
            customer_email: form.email,
            order_items: items.map(item => ({
              product_name: item.product.name,
              size: item.size,
              quantity: item.quantity,
              unit_price: item.product.price
            }))
          });
        } finally {
          setOrderDetailsLoading(false);
        }
      };
      
      // Add a small delay to ensure order is created
      const timer = setTimeout(fetchOrderDetails, 1000);
      return () => {
        clearTimeout(timer);
        setOrderDetailsLoading(false);
      };
    }
  }, [form.email, step, grandTotal, items]);

  // Fetch saved cards and handle user state changes
  useEffect(() => {
    const fetchSavedCards = async () => {
      if (!user) {
        // User is logged out, reset everything
        setSavedCards([]);
        setUseNewCard(true);
        setSelectedCardId(null);
        setPayment(initialPayment);
        return;
      }
      
      try {
        // In a real implementation, this would fetch from a 'saved_cards' table
        // For now, we'll set it to empty since no cards are saved
        const userSavedCards = [];
        
        setSavedCards(userSavedCards);
        
        // Only auto-select a card if there are saved cards
        if (userSavedCards.length > 0) {
          setSelectedCardId(userSavedCards[0].id);
          setUseNewCard(false);
          // Pre-fill payment form with selected card data
          const selectedCard = userSavedCards[0];
          setPayment({
            cardNumber: `••••• ${selectedCard.last4}`,
            cardName: selectedCard.cardholder,
            expiry: selectedCard.expiry,
            cvv: '',
          });
        } else {
          // No saved cards, ensure new card form is shown
          setUseNewCard(true);
          setSelectedCardId(null);
          setPayment(initialPayment);
        }
      } catch (error) {
        console.error('Error fetching saved cards:', error);
        // On error, default to new card form
        setSavedCards([]);
        setUseNewCard(true);
        setSelectedCardId(null);
        setPayment(initialPayment);
      }
    };

    fetchSavedCards();
  }, [user]);

  // Monitor discountAmount changes
  useEffect(() => {
    console.log('Discount applied:', discountAmount);
  }, [discountAmount]);

  const updateField = (field: keyof ShippingForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const updatePaymentField = (field: keyof PaymentForm, value: string) => {
    // Format card number with spaces
    if (field === "cardNumber") {
      value = value.replace(/\D/g, "").replace(/(.{4})/g, "$1 ").trim().slice(0, 19);
    }
    // Format expiry
    if (field === "expiry") {
      value = value.replace(/\D/g, "");
      if (value.length >= 2) value = value.slice(0, 2) + "/" + value.slice(2, 4);
      else value = value.slice(0, 2);
    }
    // Format CVV
    if (field === "cvv") {
      value = value.replace(/\D/g, "").slice(0, 4);
    }
    setPayment((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validateCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code");
      return;
    }

    try {
      const { data, error } = await (supabase.rpc as any)('validate_coupon', {
        coupon_code: couponCode.toUpperCase().trim(),
        cart_total: grandTotal
      });

      if (error) throw error;

      if (data && data.length > 0) {
        const coupon = data[0];
        if (coupon.is_valid) {
          const newDiscountAmount = Number(coupon.discount_amount);
          setAppliedCoupon(coupon);
          setDiscountAmount(newDiscountAmount);
          setCouponError("");
          toast.success(`Coupon applied! You saved $${coupon.discount_amount}`);
        } else {
          setCouponError(coupon.message || "Invalid coupon code");
          setDiscountAmount(0);
          setAppliedCoupon(null);
        }
      } else {
        setCouponError("Invalid coupon code");
        setDiscountAmount(0);
        setAppliedCoupon(null);
      }
    } catch (error: any) {
      console.error('Coupon validation error:', error);
      setCouponError(error.message || "Failed to validate coupon");
      setDiscountAmount(0);
      setAppliedCoupon(null);
    }
  };

  const removeCoupon = () => {
    setCouponCode("");
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setCouponError("");
  };

  const handleShippingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const shippingResult = shippingSchema.safeParse(form);
    const newErrors: Record<string, string> = {};

    if (!shippingResult.success) {
      shippingResult.error.errors.forEach((err) => {
        const key = err.path[0] as string;
        if (!newErrors[key]) newErrors[key] = err.message;
      });
    }

    if (createAccount) {
      const accountResult = accountSchema.safeParse({ createAccount, password, confirmPassword });
      if (!accountResult.success) {
        accountResult.error.errors.forEach((err) => {
          const key = err.path[0] as string;
          if (!newErrors[key]) newErrors[key] = err.message;
        });
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    // Save shipping information to user profile if logged in
    if (user) {
      try {
        const { error } = await supabase.auth.updateUser({
          data: {
            first_name: form.firstName,
            last_name: form.lastName,
            phone: form.phone,
            address: form.address,
            apartment: form.apartment,
            city: form.city,
            state: form.state,
            zip: form.zip,
            country: form.country,
          }
        });

        if (error) {
          console.error('Error saving shipping info:', error);
          toast.error("Failed to save shipping information");
        } else {
          console.log('Shipping info saved to profile');
          toast.success("Shipping information saved to profile");
        }
      } catch (error) {
        console.error('Error saving shipping info:', error);
      }
    }

    setStep("payment");
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Only validate card details if card payment is selected
    if (paymentMethod === "card") {
      const cleanCard = payment.cardNumber.replace(/\s/g, "");
      const result = paymentSchema.safeParse({ ...payment, cardNumber: cleanCard });

      if (!result.success) {
        const newErrors: Record<string, string> = {};
        result.error.errors.forEach((err) => {
          const key = err.path[0] as string;
          if (!newErrors[key]) newErrors[key] = err.message;
        });
        setErrors(newErrors);
        return;
      }
    }

    setErrors({});
    setSubmitting(true);

    try {
      // Create order in database
      const orderData = {
        customer_name: `${form.firstName} ${form.lastName}`,
        customer_email: form.email,
        customer_phone: form.phone || null,
        shipping_address: [form.address, form.apartment].filter(Boolean).join(", "),
        shipping_city: form.city,
        shipping_country: form.country,
        subtotal: totalPrice,
        shipping_cost: shippingCost,
        discount: discountAmount,
        total: grandTotal,
        payment_method: paymentMethod, // Add payment method
        user_id: user?.id || null,
        order_number: "TEMP", // trigger will generate real one
      };

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert(orderData)
        .select("id, order_number")
        .single();

      if (orderError) {
        console.error("Order creation failed:", orderError);
        throw orderError;
      }

      // Increment coupon usage if a coupon was applied
      if (appliedCoupon) {
        try {
          await (supabase.rpc as any)('increment_coupon_usage', {
            coupon_code: appliedCoupon.code
          });
        } catch (error) {
          console.error('Failed to increment coupon usage:', error);
        }
      }

      // Create order items
      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_name: item.product.name,
        product_id: null as string | null,
        unit_price: item.product.price,
        quantity: item.quantity,
        total_price: item.product.price * item.quantity,
        size: item.size,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) {
        console.error("Order items creation failed:", itemsError);
        throw itemsError;
      }

      // Handle optional account creation
      let userId = user?.id || null;
      if (createAccount) {
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: form.email,
          password,
        });
        if (signUpError) {
          console.warn("Account creation failed:", signUpError.message);
          toast.error(signUpError.message || "Failed to create account. Please try again.");
          setSubmitting(false);
          return;
        } else if (authData.user) {
          userId = authData.user.id;
          
          // Create customer profile for new account
          const { error: customerError } = await supabase
            .from('customers')
            .insert({
              user_id: authData.user.id,
              full_name: `${form.firstName} ${form.lastName}`,
              email: form.email,
              phone: form.phone,
              address_line1: form.address,
              city: form.city,
              state: form.state,
              postal_code: form.zip,
              country: form.country,
            });

          if (customerError) {
            console.error('Error creating customer profile:', customerError);
          }
          
          console.log("Account created successfully, user ID:", userId);
          
          // Auto-login the user immediately (no email confirmation required)
          setTimeout(async () => {
            const { error: signInError } = await supabase.auth.signInWithPassword({
              email: form.email,
              password,
            });
            
            if (signInError) {
              console.error("Auto-login failed:", signInError);
            } else {
              console.log("Auto-login successful");
            }
          }, 500); // 0.5 second delay
        }
      } else if (user && !userId) {
        // If user is logged in but no user_id, create customer profile
        const { error: customerError } = await supabase
          .from('customers')
          .insert({
            user_id: user.id,
            full_name: `${form.firstName} ${form.lastName}`,
            email: form.email,
            phone: form.phone,
            address_line1: form.address,
            city: form.city,
            state: form.state,
            postal_code: form.zip,
            country: form.country,
          });

        if (customerError) {
          console.error('Error creating customer profile:', customerError);
        }
      }

      // Update order with user ID if account was created
      if (userId && order) {
        const { error: updateError } = await supabase
          .from("orders")
          .update({ user_id: userId })
          .eq("id", order.id);
        
        if (updateError) {
          console.error("Failed to link user to order:", updateError);
        }
      }

      clearCart();
      setStep("confirmation");
      toast.success("Order placed successfully!");
    } catch (err: any) {
      console.error("Order failed:", err);
      toast.error(err.message || "Failed to place order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0 && step !== "confirmation") {
    return (
      <div className="min-h-screen bg-background pb-mobile-nav">
        <AnnouncementBar />
        <Navbar />
        <div className="flex flex-col items-center justify-center py-32 px-6 text-center">
          <h1 className="font-heading text-4xl text-foreground mb-4">Your cart is empty</h1>
          <p className="font-body text-sm text-muted-foreground mb-8">Add some items before checking out.</p>
          <Link to="/" className="font-body text-xs tracking-[0.2em] uppercase bg-primary text-primary-foreground px-8 py-4 hover:bg-charcoal transition-colors">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  if (step === "confirmation") {
    if (!orderDetails && !orderDetailsLoading) {
      return (
        <div className="min-h-screen bg-background pb-mobile-nav">
          <AnnouncementBar />
          <Navbar />
          <div className="flex items-center justify-center py-32">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <div className="w-8 h-8 rounded-full bg-primary/20 animate-spin"></div>
              </div>
              <h1 className="font-heading text-4xl text-foreground mb-3">Loading order details...</h1>
              <p className="font-body text-sm text-muted-foreground mb-4">Please wait while we confirm your order.</p>
              <button 
                onClick={() => setOrderDetails({
                  order_number: 'FS-' + Date.now(),
                  total: grandTotal,
                  customer_email: form.email,
                  order_items: items.map(item => ({
                    product_name: item.product.name,
                    size: item.size,
                    quantity: item.quantity,
                    unit_price: item.product.price
                  }))
                })}
                className="font-body text-xs bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90 transition-colors"
              >
                Continue Anyway
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background pb-mobile-nav">
        <AnnouncementBar />
        <Navbar />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-32 px-6 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <Lock className="text-primary" size={28} />
          </div>
          <h1 className="font-heading text-4xl md:text-5xl text-foreground mb-3">Order Confirmed</h1>
          <p className="font-body text-sm text-muted-foreground mb-2 max-w-md">
            Thank you for your order! A confirmation email has been sent to <strong className="text-foreground">{form.email}</strong>.
          </p>
          <p className="font-body text-xs text-muted-foreground mb-8">
            Order Number: <strong className="text-foreground">{orderDetails?.order_number || 'FS-PLACEHOLDER'}</strong>
          </p>
          <p className="font-body text-xs text-muted-foreground mb-8">
            Total: <strong className="text-foreground">${orderDetails?.total?.toFixed(2) || grandTotal.toFixed(2)}</strong>
          </p>
          <div className="space-y-2 mb-8">
            <h3 className="font-body text-sm font-medium text-foreground mb-2">Order Items</h3>
            {orderDetails?.order_items?.map((item: any, index: number) => (
              <div key={index} className="flex justify-between items-start py-2 border-b border-border">
                <div className="flex-1">
                  <p className="font-body text-sm text-foreground">{item.product_name || 'Product'}</p>
                  <p className="font-body text-xs text-muted-foreground">Size: {item.size || 'N/A'}</p>
                  <p className="font-body text-xs text-muted-foreground">Qty: {item.quantity || 0}</p>
                  <p className="font-body text-xs text-muted-foreground">Price: ${(item.unit_price || 0).toFixed(2)}</p>
                </div>
                <p className="font-body text-sm text-foreground font-medium">${((item.unit_price || 0) * (item.quantity || 0)).toFixed(2)}</p>
              </div>
            )) || []}
          </div>
          <div className="flex flex-col md:flex-row gap-4 mt-8">
            <Link to="/account/orders" className="px-6 py-3 bg-primary text-primary-foreground rounded-md font-body text-sm hover:bg-primary/90 transition-colors">My Orders</Link>
            <Link to="/" className="px-6 py-3 border border-border text-foreground rounded-md font-body text-sm hover:bg-muted transition-colors">Continue Shopping</Link>
          </div>
        </motion.div>
      </div>
    );
  }

  const InputField = React.memo(({ label, field, type = "text", required = true, colSpan = false, value, onChange }: {
    label: string; field: string; type?: string; required?: boolean; colSpan?: boolean;
    value: string; onChange: (val: string) => void;
  }) => (
    <div className={colSpan ? "md:col-span-2" : ""}>
      <label className="block font-body text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-1.5">
        {label} {required && <span className="text-sale">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full bg-transparent border px-4 py-3 font-body text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none transition-colors ${
          errors[field] ? "border-sale focus:border-sale" : "border-border focus:border-primary"
        }`}
        placeholder={label}
      />
      {errors[field] && <p className="font-body text-[10px] text-sale mt-1">{errors[field]}</p>}
    </div>
  ));

  const steps: { icon: typeof Truck; label: string; key: Step }[] = [
    { icon: User, label: "Shipping", key: "shipping" },
    { icon: CreditCard, label: "Payment", key: "payment" },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === step);

  return (
    <div className="min-h-screen bg-background pb-mobile-nav">
      <AnnouncementBar />
      <Navbar />

      <div className="px-6 md:px-16 py-4">
        <Link to="/" className="inline-flex items-center gap-1 font-body text-[10px] tracking-[0.15em] uppercase text-muted-foreground hover:text-primary transition-colors">
          <ChevronLeft size={14} /> Back to Shop
        </Link>
      </div>

      <div className="px-6 md:px-16 pb-16 md:pb-24">
        <div className="grid lg:grid-cols-5 gap-10 md:gap-16 max-w-7xl mx-auto">

          {/* Form Column */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-3"
          >
            <h1 className="font-heading text-3xl md:text-4xl text-foreground mb-8">Checkout</h1>

            {/* Progress */}
            <div className="flex items-center gap-4 mb-10">
              {steps.map(({ icon: Icon, label, key }, i) => (
                <div key={label} className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    i <= currentStepIndex ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                  }`}>
                    <Icon size={14} />
                  </div>
                  <span className={`font-body text-xs tracking-wider uppercase ${
                    i <= currentStepIndex ? "text-foreground" : "text-muted-foreground"
                  }`}>
                    {label}
                  </span>
                  {i < steps.length - 1 && <div className="w-8 h-px bg-border mx-1" />}
                </div>
              ))}
            </div>

            {/* SHIPPING STEP */}
            {step === "shipping" && (
              <motion.form
                key="shipping"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                onSubmit={handleShippingSubmit}
                className="space-y-8"
              >
                {/* Contact */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-heading text-xl text-foreground">Contact Information</h2>
                    {user && (
                      <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                        <User size={14} />
                        <span>Auto-filled from your profile</span>
                      </div>
                    )}
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-body text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-1.5">
                        Email <span className="text-sale">*</span>
                      </label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => updateField("email", e.target.value)}
                        className={`w-full bg-transparent border px-4 py-3 font-body text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none transition-colors ${
                          errors.email ? "border-sale focus:border-sale" : "border-border focus:border-primary"
                        }`}
                        placeholder="Email"
                      />
                      {errors.email && <p className="font-body text-[10px] text-sale mt-1">{errors.email}</p>}
                    </div>
                    <div>
                      <label className="block font-body text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-1.5">
                        Phone <span className="text-sale">*</span>
                      </label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => updateField("phone", e.target.value)}
                        className={`w-full bg-transparent border px-4 py-3 font-body text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none transition-colors ${
                          errors.phone ? "border-sale focus:border-sale" : "border-border focus:border-primary"
                        }`}
                        placeholder="Phone"
                      />
                      {errors.phone && <p className="font-body text-[10px] text-sale mt-1">{errors.phone}</p>}
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-heading text-xl text-foreground">Shipping Address</h2>
                    {user && (
                      <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                        <Truck size={14} />
                        <span>Auto-filled from your profile</span>
                      </div>
                    )}
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-body text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-1.5">
                        First Name <span className="text-sale">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.firstName}
                        onChange={(e) => updateField("firstName", e.target.value)}
                        className={`w-full bg-transparent border px-4 py-3 font-body text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none transition-colors ${
                          errors.firstName ? "border-sale focus:border-sale" : "border-border focus:border-primary"
                        }`}
                        placeholder="First Name"
                      />
                      {errors.firstName && <p className="font-body text-[10px] text-sale mt-1">{errors.firstName}</p>}
                    </div>
                    <div>
                      <label className="block font-body text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-1.5">
                        Last Name <span className="text-sale">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.lastName}
                        onChange={(e) => updateField("lastName", e.target.value)}
                        className={`w-full bg-transparent border px-4 py-3 font-body text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none transition-colors ${
                          errors.lastName ? "border-sale focus:border-sale" : "border-border focus:border-primary"
                        }`}
                        placeholder="Last Name"
                      />
                      {errors.lastName && <p className="font-body text-[10px] text-sale mt-1">{errors.lastName}</p>}
                    </div>
                    <div className="md:col-span-2">
                      <label className="block font-body text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-1.5">
                        Address <span className="text-sale">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.address}
                        onChange={(e) => updateField("address", e.target.value)}
                        className={`w-full bg-transparent border px-4 py-3 font-body text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none transition-colors ${
                          errors.address ? "border-sale focus:border-sale" : "border-border focus:border-primary"
                        }`}
                        placeholder="Address"
                      />
                      {errors.address && <p className="font-body text-[10px] text-sale mt-1">{errors.address}</p>}
                    </div>
                    <div className="md:col-span-2">
                      <label className="block font-body text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-1.5">
                        Apartment, suite, etc.
                      </label>
                      <input
                        type="text"
                        value={form.apartment || ""}
                        onChange={(e) => updateField("apartment", e.target.value)}
                        className={`w-full bg-transparent border px-4 py-3 font-body text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none transition-colors ${
                          errors.apartment ? "border-sale focus:border-sale" : "border-border focus:border-primary"
                        }`}
                        placeholder="Apartment, suite, etc."
                      />
                      {errors.apartment && <p className="font-body text-[10px] text-sale mt-1">{errors.apartment}</p>}
                    </div>
                    <div>
                      <label className="block font-body text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-1.5">
                        City <span className="text-sale">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.city}
                        onChange={(e) => updateField("city", e.target.value)}
                        className={`w-full bg-transparent border px-4 py-3 font-body text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none transition-colors ${
                          errors.city ? "border-sale focus:border-sale" : "border-border focus:border-primary"
                        }`}
                        placeholder="City"
                      />
                      {errors.city && <p className="font-body text-[10px] text-sale mt-1">{errors.city}</p>}
                    </div>
                    <div>
                      <label className="block font-body text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-1.5">
                        State / Province <span className="text-sale">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.state}
                        onChange={(e) => updateField("state", e.target.value)}
                        className={`w-full bg-transparent border px-4 py-3 font-body text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none transition-colors ${
                          errors.state ? "border-sale focus:border-sale" : "border-border focus:border-primary"
                        }`}
                        placeholder="State / Province"
                      />
                      {errors.state && <p className="font-body text-[10px] text-sale mt-1">{errors.state}</p>}
                    </div>
                    <div>
                      <label className="block font-body text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-1.5">
                        ZIP / Postal Code <span className="text-sale">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.zip}
                        onChange={(e) => updateField("zip", e.target.value)}
                        className={`w-full bg-transparent border px-4 py-3 font-body text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none transition-colors ${
                          errors.zip ? "border-sale focus:border-sale" : "border-border focus:border-primary"
                        }`}
                        placeholder="ZIP / Postal Code"
                      />
                      {errors.zip && <p className="font-body text-[10px] text-sale mt-1">{errors.zip}</p>}
                    </div>
                    <div>
                      <label className="block font-body text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-1.5">
                        Country <span className="text-sale">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.country}
                        onChange={(e) => updateField("country", e.target.value)}
                        className={`w-full bg-transparent border px-4 py-3 font-body text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none transition-colors ${
                          errors.country ? "border-sale focus:border-sale" : "border-border focus:border-primary"
                        }`}
                        placeholder="Country"
                      />
                      {errors.country && <p className="font-body text-[10px] text-sale mt-1">{errors.country}</p>}
                    </div>
                  </div>
                </div>

                {/* Create Account */}
                <div className="border border-border p-5">
                  <label className="flex items-center gap-3 cursor-pointer">
                    {!user && (
                      <>
                        <input
                          type="checkbox"
                          id="createAccount"
                          checked={createAccount}
                          onChange={(e) => {
                            setCreateAccount(e.target.checked);
                            if (!e.target.checked) {
                              setPassword("");
                              setConfirmPassword("");
                              setErrors((prev) => ({ ...prev, password: undefined, confirmPassword: undefined }));
                            }
                          }}
                          className="w-4 h-4 accent-primary"
                        />
                        <span className="font-body text-sm text-foreground">Create an account for faster checkout next time</span>
                      </>
                    )}
                  </label>
                  {createAccount && !user && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-4 grid md:grid-cols-2 gap-4"
                    >
                      <div>
                        <label className="block font-body text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-1.5">
                          Password <span className="text-sale">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => {
                              setPassword(e.target.value);
                              if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                            }}
                            className={`w-full bg-transparent border px-4 py-3 pr-10 font-body text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none transition-colors ${
                              errors.password ? "border-sale focus:border-sale" : "border-border focus:border-primary"
                            }`}
                            placeholder="Min. 6 characters"
                          />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        {errors.password && <p className="font-body text-[10px] text-sale mt-1">{errors.password}</p>}
                      </div>
                      <div>
                        <label className="block font-body text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-1.5">
                          Confirm Password <span className="text-sale">*</span>
                        </label>
                        <input
                          type={showPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => {
                            setConfirmPassword(e.target.value);
                            if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                          }}
                          className={`w-full bg-transparent border px-4 py-3 font-body text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none transition-colors ${
                            errors.confirmPassword ? "border-sale focus:border-sale" : "border-border focus:border-primary"
                          }`}
                          placeholder="Re-enter password"
                        />
                        {errors.confirmPassword && <p className="font-body text-[10px] text-sale mt-1">{errors.confirmPassword}</p>}
                      </div>
                    </motion.div>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full bg-primary text-primary-foreground font-body text-xs tracking-[0.2em] uppercase py-4 hover:bg-charcoal transition-colors duration-300 active:scale-[0.99]"
                >
                  Continue to Payment
                </button>
              </motion.form>
            )}

            {/* PAYMENT STEP */}
            {step === "payment" && (
              <motion.form
                key="payment"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                onSubmit={handlePaymentSubmit}
                className="space-y-8"
              >
                <div>
                  <h2 className="font-heading text-xl text-foreground mb-4">Payment Details</h2>
                  
                  {/* Payment Method Selection */}
                  <div className="mb-6">
                    <h3 className="font-heading text-lg text-foreground mb-4">Choose Payment Method</h3>
                    <div className="space-y-3">
                      {/* Credit Card Option */}
                      <label className="flex items-center p-4 border rounded-lg cursor-pointer transition-colors border-border hover:border-primary/50">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="card"
                          checked={paymentMethod === "card"}
                          onChange={(e) => setPaymentMethod(e.target.value as "card" | "cod")}
                          className="mr-3"
                        />
                        <CreditCard size={20} className="mr-3 text-primary" />
                        <div>
                          <p className="font-medium text-foreground">Credit/Debit Card</p>
                          <p className="text-sm text-muted-foreground">Pay securely with your card</p>
                        </div>
                      </label>

                      {/* Cash on Delivery Option */}
                      {storeSettings?.enable_cod && (
                        <label className="flex items-center p-4 border rounded-lg cursor-pointer transition-colors border-border hover:border-primary/50">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="cod"
                            checked={paymentMethod === "cod"}
                            onChange={(e) => setPaymentMethod(e.target.value as "card" | "cod")}
                            className="mr-3"
                          />
                          <Truck size={20} className="mr-3 text-primary" />
                          <div>
                            <p className="font-medium text-foreground">Cash on Delivery</p>
                            <p className="text-sm text-muted-foreground">Pay when you receive your order</p>
                          </div>
                        </label>
                      )}
                    </div>
                  </div>
                  
                  {/* Card Payment Sections - Only show when card is selected */}
                  {paymentMethod === "card" && (
                    <>
                      {/* Saved Cards Section - Only show for logged-in users */}
                      {user && savedCards.length > 0 && (
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-heading text-lg text-foreground">Saved Cards</h3>
                        <button
                          type="button"
                          onClick={() => setUseNewCard(!useNewCard)}
                          className="text-sm text-primary hover:text-primary/80 font-body"
                        >
                          {useNewCard ? "Use a new card" : "Select a saved card"}
                        </button>
                      </div>
                      
                      {!useNewCard && (
                        <div className="grid gap-3">
                          {savedCards.map((card) => (
                            <div
                              key={card.id}
                              onClick={() => {
                                setSelectedCardId(card.id);
                                setPayment({
                                  cardNumber: `••••• ${card.last4}`,
                                  cardName: card.cardholder,
                                  expiry: card.expiry,
                                  cvv: '',
                                });
                              }}
                              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                                selectedCardId === card.id
                                  ? 'border-primary bg-primary/10'
                                  : 'border-border hover:border-primary/50'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-foreground">{card.brand} •••• {card.last4}</p>
                                  <p className="text-sm text-muted-foreground">{card.cardholder}</p>
                                  <p className="text-sm text-muted-foreground">Expires {card.expiry}</p>
                                </div>
                                {card.isDefault && (
                                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                    Default
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* New Card Form or Selected Card Display */}
                  <div className="grid md:grid-cols-2 gap-4">
                    {(!useNewCard && selectedCardId) ? (
                      /* Show Selected Card Details */
                      <div className="md:col-span-2">
                        <div className="p-4 border border-border rounded-lg bg-secondary/30">
                          <h4 className="font-medium text-foreground mb-2">Selected Card</h4>
                          <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">Card ending in {savedCards.find(c => c.id === selectedCardId)?.brand || '••••'}</p>
                            <p className="text-sm text-muted-foreground">Cardholder: {payment.cardName}</p>
                            <p className="text-sm text-muted-foreground">Expires: {payment.expiry}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setUseNewCard(true);
                              setSelectedCardId(null);
                              setPayment(initialPayment);
                            }}
                            className="w-full mt-4 text-sm text-primary hover:text-primary/80 font-body"
                          >
                            Change Card
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Show New Card Form */
                      <>
                        <div className="md:col-span-2">
                          <label className="block font-body text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-1.5">
                            Card Number <span className="text-sale">*</span>
                          </label>
                          <input
                            type="text"
                            value={payment.cardNumber}
                            onChange={(e) => updatePaymentField("cardNumber", e.target.value)}
                            className={`w-full bg-transparent border px-4 py-3 font-body text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none transition-colors ${
                              errors.cardNumber ? "border-sale focus:border-sale" : "border-border focus:border-primary"
                            }`}
                            placeholder="Card Number"
                          />
                          {errors.cardNumber && <p className="font-body text-[10px] text-sale mt-1">{errors.cardNumber}</p>}
                        </div>
                        <div className="md:col-span-2">
                          <label className="block font-body text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-1.5">
                            Cardholder Name <span className="text-sale">*</span>
                          </label>
                          <input
                            type="text"
                            value={payment.cardName}
                            onChange={(e) => updatePaymentField("cardName", e.target.value)}
                            className={`w-full bg-transparent border px-4 py-3 font-body text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none transition-colors ${
                              errors.cardName ? "border-sale focus:border-sale" : "border-border focus:border-primary"
                            }`}
                            placeholder="Cardholder Name"
                          />
                          {errors.cardName && <p className="font-body text-[10px] text-sale mt-1">{errors.cardName}</p>}
                        </div>
                        <div className="md:col-span-2">
                          <label className="block font-body text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-1.5">
                            Expiry (MM/YY) <span className="text-sale">*</span>
                          </label>
                          <input
                            type="text"
                            value={payment.expiry}
                            onChange={(e) => updatePaymentField("expiry", e.target.value)}
                            className={`w-full bg-transparent border px-4 py-3 font-body text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none transition-colors ${
                              errors.expiry ? "border-sale focus:border-sale" : "border-border focus:border-primary"
                            }`}
                            placeholder="MM/YY"
                          />
                          {errors.expiry && <p className="font-body text-[10px] text-sale mt-1">{errors.expiry}</p>}
                        </div>
                        <div className="md:col-span-2">
                          <label className="block font-body text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-1.5">
                            CVV <span className="text-sale">*</span>
                          </label>
                          <input
                            type="text"
                            value={payment.cvv}
                            onChange={(e) => updatePaymentField("cvv", e.target.value)}
                            className={`w-full bg-transparent border px-4 py-3 font-body text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none transition-colors ${
                              errors.cvv ? "border-sale focus:border-sale" : "border-border focus:border-primary"
                            }`}
                            placeholder="CVV"
                          />
                          {errors.cvv && <p className="font-body text-[10px] text-sale mt-1">{errors.cvv}</p>}
                        </div>
                      </>
                    )}
                  </div>
                    </>
                  )}

                  {/* COD Information - Only show when COD is selected */}
                  {paymentMethod === "cod" && (
                    <div className="p-6 border border-border rounded-lg bg-secondary/30">
                      <div className="flex items-center gap-3 mb-4">
                        <Truck size={24} className="text-primary" />
                        <div>
                          <h4 className="font-heading text-lg text-foreground">Cash on Delivery</h4>
                          <p className="text-sm text-muted-foreground">Pay when you receive your order</p>
                        </div>
                      </div>
                      <div className="space-y-3 text-sm text-muted-foreground">
                        <p>• Please have the exact amount ready</p>
                        <p>• Our delivery partner will accept cash only</p>
                        <p>• Please check your order before payment</p>
                        <p>• Delivery timeframe: 3-5 business days</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setStep("shipping"); setErrors({}); }}
                    className="flex-1 border border-border text-foreground font-body text-xs tracking-[0.2em] uppercase py-4 hover:bg-secondary transition-colors duration-300"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-[2] bg-primary text-primary-foreground font-body text-xs tracking-[0.2em] uppercase py-4 hover:bg-charcoal transition-colors duration-300 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? "Processing..." : `Place Order — A$${grandTotal.toFixed(2)}`}
                  </button>
                </div>

                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Lock size={14} />
                  <span className="font-body text-[10px] tracking-wider">Secure & encrypted checkout</span>
                </div>
              </motion.form>
            )}
          </motion.div>

          {/* Order Summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-2"
          >
            <div className="sticky top-28 bg-secondary/50 p-6 md:p-8">
              <h2 className="font-heading text-xl text-foreground mb-6">Order Summary</h2>

              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div key={`${item.product.id}-${item.size}`} className="flex gap-3">
                    <div className="relative flex-shrink-0">
                      <img src={item.product.image || "/placeholder.svg"} alt={item.product.name} className="w-16 h-20 object-cover" />
                      <span className="absolute -top-1.5 -right-1.5 bg-charcoal text-primary-foreground text-[9px] w-5 h-5 rounded-full flex items-center justify-center font-body">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-body text-[10px] tracking-[0.1em] uppercase text-foreground truncate">{item.product.name}</h3>
                      <p className="font-body text-[9px] text-muted-foreground mt-0.5">Size: {item.size}</p>
                      <p className="font-body text-xs font-medium text-foreground mt-1">${(item.product.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupon Section */}
              <div className="mb-6">
                <h3 className="font-body text-xs tracking-[0.15em] uppercase text-foreground mb-3">Coupon Code</h3>
                {!appliedCoupon ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => {
                          setCouponCode(e.target.value);
                          setCouponError("");
                        }}
                        placeholder="Enter coupon code"
                        className="flex-1 bg-transparent border px-3 py-2 font-body text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary"
                      />
                      <button
                        type="button"
                        onClick={validateCoupon}
                        className="bg-primary text-primary-foreground font-body text-xs tracking-[0.15em] uppercase px-4 py-2 hover:bg-charcoal transition-colors"
                      >
                        Apply
                      </button>
                    </div>
                    {couponError && (
                      <p className="font-body text-[10px] text-sale">{couponError}</p>
                    )}
                  </div>
                ) : discountAmount > 0 ? (
                  <div className="bg-primary/10 border border-primary/20 p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-body text-xs font-medium text-foreground">{appliedCoupon.code}</p>
                        <p className="font-body text-[10px] text-primary">-A${discountAmount.toFixed(2)} discount applied</p>
                      </div>
                      <button
                        type="button"
                        onClick={removeCoupon}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-sale/10 border border-sale/20 p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-body text-xs font-medium text-foreground">{appliedCoupon.code}</p>
                        <p className="font-body text-[10px] text-sale">{couponError || "Discount not applicable"}</p>
                      </div>
                      <button
                        type="button"
                        onClick={removeCoupon}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-border pt-4 space-y-3">
                <div className="flex justify-between font-body text-xs text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="text-foreground">A${totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-body text-xs text-muted-foreground">
                  <span>Shipping</span>
                  <span className={shippingCost === 0 ? "text-primary font-medium" : "text-foreground"}>
                    {shippingCost === 0 ? "Free" : `A${shippingCost.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between font-body text-xs text-muted-foreground">
                  <span>Tax (est.)</span>
                  <span className="text-foreground">A${taxAmount.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div key={`discount-${discountAmount}`} className="flex justify-between font-body text-xs text-primary">
                    <span>Discount</span>
                    <span>-A${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-3 border-t border-border">
                  <span className="font-body text-xs tracking-[0.15em] uppercase text-foreground">Total</span>
                  <span className="font-heading text-xl text-foreground">A${grandTotal.toFixed(2)}</span>
                </div>
              </div>

              {totalPrice < FREE_SHIPPING_THRESHOLD && (
                <div className="mt-4 bg-background p-3 text-center">
                  <p className="font-body text-[10px] text-muted-foreground">
                    Add <strong className="text-primary">A${(FREE_SHIPPING_THRESHOLD - totalPrice).toFixed(2)}</strong> more for free shipping
                  </p>
                  <div className="w-full bg-border h-1 mt-2 overflow-hidden">
                    <div className="h-full bg-primary transition-all duration-500" style={{ width: `${Math.min((totalPrice / FREE_SHIPPING_THRESHOLD) * 100, 100)}%` }} />
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
