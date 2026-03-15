import { useState, useEffect } from "react";
import { CreditCard, Plus, Edit2, Check, Trash2, Eye, EyeOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PaymentMethod {
  id: string;
  user_id: string;
  type: string;
  last4: string;
  expiry: string;
  cardholder: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

const PaymentsTab = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [form, setForm] = useState({
    type: "",
    cardNumber: "",
    cardholder: "",
    expiry: "",
    cvv: ""
  });
  const emptyForm = {
    type: "",
    cardNumber: "",
    cardholder: "",
    expiry: "",
    cvv: ""
  };

  // Fetch payment methods from database
  useEffect(() => {
    const fetchPaymentMethods = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('payment_methods')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setPayments(data || []);
      } catch (error) {
        console.error('Error fetching payment methods:', error);
        toast.error("Failed to load payment methods");
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentMethods();
  }, [user]);

  const openAdd = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (payment: PaymentMethod) => {
    setForm({
      type: payment.type,
      cardNumber: payment.last4,
      cardholder: payment.cardholder,
      expiry: payment.expiry,
      cvv: ""
    });
    setEditingId(payment.id);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    try {
      // Validate form
      if (!form.cardNumber || !form.cardholder || !form.expiry) {
        toast.error("Please fill all card details correctly");
        return;
      }

      if (editingId) {
        // Update existing payment method
        const { error } = await supabase
          .from('payment_methods')
          .update({
            type: detectCardType(form.cardNumber),
            last4: form.cardNumber.slice(-4),
            expiry: form.expiry,
            cardholder: form.cardholder
          })
          .eq('id', editingId);
        
        if (error) throw error;
        toast.success("Payment method updated successfully!");
      } else {
        // Add new payment method
        const { error } = await supabase
          .from('payment_methods')
          .insert({
            user_id: user?.id,
            type: detectCardType(form.cardNumber),
            last4: form.cardNumber.slice(-4),
            expiry: form.expiry,
            cardholder: form.cardholder,
            is_default: payments.length === 0
          });
        
        if (error) throw error;
        toast.success("Payment method added successfully!");
      }
      
      // Refresh the payment methods list
      const { data: updatedData } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      
      setPayments(updatedData || []);
      setShowForm(false);
      setEditingId(null);
    } catch (error) {
      console.error('Error saving payment method:', error);
      toast.error("Failed to save payment method");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setPayments(prev => prev.filter(p => p.id !== id));
      setDeleteConfirm(null);
      toast.success("Payment method removed");
    } catch (error) {
      console.error('Error deleting payment method:', error);
      toast.error("Failed to delete payment method");
    }
  };

  const setDefault = async (id: string) => {
    try {
      const { error } = await supabase
        .from('payment_methods')
        .update({ is_default: true })
        .eq('id', id);
      
      if (error) throw error;
      
      // Update local state
      setPayments(prev => prev.map(p => ({ ...p, is_default: p.id === id })));
      toast.success("Default payment method updated");
    } catch (error) {
      console.error('Error setting default payment method:', error);
      toast.error("Failed to set default payment method");
    }
  };

  const updateField = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const formatCardNumber = (value: string) => {
    // Remove all non-digits
    const cleaned = value.replace(/\D/g, "");
    // Add spaces every 4 digits
    return cleaned.replace(/(.{4})/g, "$1 ").trim();
  };

  const formatExpiry = (value: string) => {
    // Remove all non-digits
    const cleaned = value.replace(/\D/g, "");
    // Add slash after 2 digits
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + "/" + cleaned.slice(2, 4);
    }
    return cleaned;
  };

  const detectCardType = (number: string) => {
    const clean = number.replace(/\s/g, "");
    if (clean.startsWith("4")) return "visa";
    if (clean.startsWith("5") || clean.startsWith("2")) return "mastercard";
    if (clean.startsWith("34") || clean.startsWith("37")) return "amex";
    return "other";
  };

  const getCardIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "visa":
        return (
          <svg width="32" height="20" viewBox="0 0 32 20" fill="none">
            <rect x="1" y="1" width="30" height="18" rx="2" fill="currentColor" />
            <path d="M4 9h3l2-2m0 0l-2 2m3-2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V9z" fill="currentColor" />
            <circle cx="8" cy="9" r="1" fill="white" />
            <circle cx="16" cy="9" r="1" fill="white" />
            <circle cx="24" cy="9" r="1" fill="white" />
          </svg>
        );
      case "mastercard":
        return (
          <svg width="32" height="20" viewBox="0 0 32 20" fill="none">
            <rect x="1" y="1" width="30" height="18" rx="2" fill="currentColor" />
            <path d="M4 9h3l2-2m0 0l-2 2m3-2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V9z" fill="currentColor" />
            <circle cx="8" cy="9" r="1" fill="white" />
            <circle cx="16" cy="9" r="1" fill="white" />
            <circle cx="24" cy="9" r="1" fill="white" />
            <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" fill="white" />
            <path d="M21 12v1H3v-1h18z" fill="currentColor" />
          </svg>
        );
      case "amex":
        return (
          <svg width="32" height="20" viewBox="0 0 32 20" fill="none">
            <rect x="1" y="1" width="30" height="18" rx="2" fill="currentColor" />
            <path d="M4 9h3l2-2m0 0l-2 2m3-2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V9z" fill="currentColor" />
            <circle cx="8" cy="9" r="1" fill="white" />
            <circle cx="16" cy="9" r="1" fill="white" />
            <circle cx="24" cy="9" r="1" fill="white" />
            <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" fill="white" />
            <path d="M21 12v1H3v-1h18z" fill="currentColor" />
          </svg>
        );
      default:
        return <CreditCard size={32} />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-2xl font-semibold text-foreground">Payment Methods</h2>
        <Button size="sm" className="font-body text-xs tracking-wider uppercase" onClick={openAdd}>
          <Plus size={14} className="mr-1" /> Add Card
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="font-heading text-xl text-muted-foreground">Loading payment methods...</p>
        </div>
      ) : payments.length === 0 ? (
        <div className="text-center py-16">
          <CreditCard size={48} className="mx-auto text-muted-foreground/30 mb-4" />
          <p className="font-heading text-xl text-muted-foreground">No payment methods</p>
          <p className="text-sm text-muted-foreground font-body mt-1">Add your first payment method for faster checkout</p>
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map(payment => (
            <div key={payment.id} className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-8 rounded bg-secondary flex items-center justify-center">
                    {getCardIcon(payment.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-body text-sm font-medium text-foreground">{payment.cardholder}</h3>
                      {payment.is_default && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="font-body text-xs text-muted-foreground">
                      ••••• {payment.last4} · Expires {payment.expiry}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(payment)}>
                    <Edit2 size={14} className="mr-1" /> Edit
                  </Button>
                  {!payment.is_default && (
                    <Button variant="outline" size="sm" onClick={() => setDefault(payment.id)}>
                      Set Default
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive border-destructive/30 hover:bg-destructive/5"
                    onClick={() => setDeleteConfirm(payment.id)}
                  >
                    <Trash2 size={14} className="mr-1" /> Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/60" onClick={closeForm} />
          <div className="relative z-50 bg-background border border-border rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-heading text-xl font-semibold text-foreground">
                {editingId ? "Edit Payment Method" : "Add Payment Method"}
              </h3>
              <button onClick={closeForm} className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="font-body text-[10px] tracking-[0.15em] uppercase text-muted-foreground">
                  Card Type
                </Label>
                <select
                  value={form.type || detectCardType(form.cardNumber)}
                  onChange={e => updateField("type", e.target.value)}
                  className="w-full bg-card border-border font-body"
                >
                  <option value="">Auto-detect</option>
                  <option value="visa">Visa</option>
                  <option value="mastercard">Mastercard</option>
                  <option value="amex">American Express</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <Label className="font-body text-[10px] tracking-[0.15em] uppercase text-muted-foreground">
                  Card Number
                </Label>
                <Input
                  value={formatCardNumber(form.cardNumber)}
                  onChange={e => updateField("cardNumber", formatCardNumber(e.target.value))}
                  placeholder="1234 5678 9012 3456"
                  className="bg-card border-border font-body"
                  maxLength={19}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-body text-[10px] tracking-[0.15em] uppercase text-muted-foreground">
                    Cardholder Name
                  </Label>
                  <Input
                    value={form.cardholder}
                    onChange={e => updateField("cardholder", e.target.value)}
                    placeholder="John Doe"
                    className="bg-card border-border font-body"
                  />
                </div>
                <div>
                  <Label className="font-body text-[10px] tracking-[0.15em] uppercase text-muted-foreground">
                    Expiry (MM/YY)
                  </Label>
                  <Input
                    value={formatExpiry(form.expiry)}
                    onChange={e => updateField("expiry", formatExpiry(e.target.value))}
                    placeholder="12/26"
                    className="bg-card border-border font-body"
                    maxLength={5}
                  />
                </div>
              </div>
              <div>
                <Label className="font-body text-[10px] tracking-[0.15em] uppercase text-muted-foreground">
                  CVV
                </Label>
                <Input
                  value={form.cvv}
                  onChange={e => updateField("cvv", e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="123"
                  className="bg-card border-border font-body"
                  maxLength={4}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={closeForm} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSave} className="flex-1">
                {editingId ? "Update" : "Add"} Payment Method
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/60" onClick={() => setDeleteConfirm(null)} />
          <div className="relative z-50 bg-background border border-border rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
            <h3 className="font-heading text-lg font-semibold text-foreground mb-2">
              Delete Payment Method
            </h3>
            <p className="font-body text-sm text-muted-foreground mb-4">
              Are you sure you want to delete this payment method? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="flex-1">
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentsTab;
