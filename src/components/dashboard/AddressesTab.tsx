import { useState, useEffect } from "react";
import { MapPin, Plus, Edit2, Check, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Address {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  created_at: string;
}

const AddressesTab = () => {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "Pakistan"
  });
  
  const emptyForm = {
    full_name: "",
    email: user?.email || "",
    phone: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "Pakistan"
  };

  // Fetch addresses from database
  useEffect(() => {
    const fetchAddresses = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Fetch from customers table (manually added addresses)
        const { data: customerData, error: customerError } = await supabase
          .from('customers')
          .select('*')
          .eq('user_id', user.id);
        
        if (customerError) throw customerError;
        
        // Fetch from orders table (addresses used during checkout)
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', user.id)
          .not('shipping_address', 'is', null);
        
        if (orderError) throw orderError;
        
        // Combine and transform all addresses
        const addressList: Address[] = [];
        
        // Add manually saved addresses from customers table
        (customerData || []).forEach(customer => {
          if (customer.address_line1) { // Only include if there's an address
            addressList.push({
              id: customer.id,
              full_name: customer.full_name,
              email: customer.email,
              phone: customer.phone || '',
              address_line1: customer.address_line1,
              address_line2: customer.address_line2 || '',
              city: customer.city || '',
              state: customer.state || '',
              postal_code: customer.postal_code || '',
              country: customer.country || 'Pakistan',
              created_at: customer.created_at
            });
          }
        });
        
        // Add addresses from orders (checkout addresses)
        (orderData || []).forEach((order, index) => {
          // Parse the shipping address (it might contain multiple lines)
          const addressLines = order.shipping_address.split(',').map(s => s.trim());
          
          addressList.push({
            id: `order-${order.id}`, // Prefix to avoid ID conflicts
            full_name: order.customer_name,
            email: order.customer_email,
            phone: order.customer_phone || '',
            address_line1: addressLines[0] || '',
            address_line2: addressLines[1] || '',
            city: order.shipping_city || '',
            state: '', // Orders table doesn't have state field
            postal_code: '', // Orders table doesn't have postal_code field
            country: order.shipping_country || 'Pakistan',
            created_at: order.created_at
          });
        });
        
        // Sort by creation date (newest first)
        addressList.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
        setAddresses(addressList);
      } catch (error) {
        console.error('Error fetching addresses:', error);
        toast.error("Failed to load addresses");
      } finally {
        setLoading(false);
      }
    };

    fetchAddresses();
  }, [user]);

  const openAdd = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (addr: Address) => {
    setForm({
      full_name: addr.full_name,
      email: addr.email,
      phone: addr.phone,
      address_line1: addr.address_line1,
      address_line2: addr.address_line2 || '',
      city: addr.city,
      state: addr.state,
      postal_code: addr.postal_code,
      country: addr.country
    });
    setEditingId(addr.id);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        // Update existing address
        const { error } = await supabase
          .from('customers')
          .update({
            full_name: form.full_name,
            email: form.email,
            phone: form.phone,
            address_line1: form.address_line1,
            address_line2: form.address_line2,
            city: form.city,
            state: form.state,
            postal_code: form.postal_code,
            country: form.country
          })
          .eq('id', editingId);
        
        if (error) throw error;
        toast.success("Address updated successfully!");
      } else {
        // Add new address
        const { error } = await supabase
          .from('customers')
          .insert({
            user_id: user?.id,
            full_name: form.full_name,
            email: form.email,
            phone: form.phone,
            address_line1: form.address_line1,
            address_line2: form.address_line2,
            city: form.city,
            state: form.state,
            postal_code: form.postal_code,
            country: form.country
          });
        
        if (error) throw error;
        toast.success("Address added successfully!");
      }
      
      // Refresh the addresses list
      const { data: customerData } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', user?.id);
      
      const addressList: Address[] = (customerData || []).map(customer => ({
        id: customer.id,
        full_name: customer.full_name,
        email: customer.email,
        phone: customer.phone || '',
        address_line1: customer.address_line1 || '',
        address_line2: customer.address_line2 || '',
        city: customer.city || '',
        state: customer.state || '',
        postal_code: customer.postal_code || '',
        country: customer.country || 'Pakistan',
        created_at: customer.created_at
      }));
      
      setAddresses(addressList);
      setShowForm(false);
      setEditingId(null);
    } catch (error) {
      console.error('Error saving address:', error);
      toast.error("Failed to save address");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setAddresses(prev => prev.filter(a => a.id !== id));
      setDeleteConfirm(null);
      toast.success("Address removed");
    } catch (error) {
      console.error('Error deleting address:', error);
      toast.error("Failed to delete address");
    }
  };

  const setDefault = async (id: string) => {
    // In the current schema, there's no default flag
    // This would need to be added to the database schema
    toast.info("Default address feature coming soon!");
  };

  const updateField = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-2xl font-semibold text-foreground">Address Book</h2>
        <Button size="sm" className="font-body text-xs tracking-wider uppercase" onClick={openAdd}>
          <Plus size={14} className="mr-1" /> Add Address
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="font-heading text-xl text-muted-foreground">Loading addresses...</p>
        </div>
      ) : addresses.length === 0 ? (
        <div className="text-center py-16">
          <MapPin size={48} className="mx-auto text-muted-foreground/30 mb-4" />
          <p className="font-heading text-xl text-muted-foreground">No addresses yet</p>
          <p className="text-sm text-muted-foreground font-body mt-1">Add your first shipping address</p>
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map(addr => (
            <div key={addr.id} className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-body text-sm font-medium text-foreground">{addr.full_name}</h3>
                    {addr.id.startsWith('order-') && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                        From Order
                      </span>
                    )}
                  </div>
                  <p className="font-body text-sm text-foreground">{addr.email}</p>
                  {addr.phone && <p className="font-body text-sm text-muted-foreground">{addr.phone}</p>}
                  <p className="font-body text-sm text-muted-foreground">{addr.address_line1}</p>
                  {addr.address_line2 && <p className="font-body text-sm text-muted-foreground">{addr.address_line2}</p>}
                  <p className="font-body text-sm text-muted-foreground">
                    {addr.city}{addr.state && `, ${addr.state}`}{addr.postal_code && ` ${addr.postal_code}`}
                  </p>
                  <p className="font-body text-sm text-muted-foreground">{addr.country}</p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => openEdit(addr)}
                    disabled={addr.id.startsWith('order-')}
                    className={addr.id.startsWith('order-') ? 'opacity-50 cursor-not-allowed' : ''}
                  >
                    <Edit2 size={14} className="mr-1" /> Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setDefault(addr.id)}>
                    Set Default
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive border-destructive/30 hover:bg-destructive/5"
                    onClick={() => setDeleteConfirm(addr.id)}
                    disabled={addr.id.startsWith('order-')}
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
                {editingId ? "Edit Address" : "Add New Address"}
              </h3>
              <button onClick={closeForm} className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="font-body text-[10px] tracking-[0.15em] uppercase text-muted-foreground">
                  Full Name
                </Label>
                <Input
                  value={form.full_name}
                  onChange={e => updateField("full_name", e.target.value)}
                  placeholder="Enter your full name"
                  className="bg-card border-border font-body"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-body text-[10px] tracking-[0.15em] uppercase text-muted-foreground">
                    Email
                  </Label>
                  <Input
                    value={form.email}
                    onChange={e => updateField("email", e.target.value)}
                    type="email"
                    className="bg-card border-border font-body"
                  />
                </div>
                <div>
                  <Label className="font-body text-[10px] tracking-[0.15em] uppercase text-muted-foreground">
                    Phone Number
                  </Label>
                  <Input
                    value={form.phone}
                    onChange={e => updateField("phone", e.target.value)}
                    placeholder="Phone number"
                    className="bg-card border-border font-body"
                  />
                </div>
              </div>
              <div>
                <Label className="font-body text-[10px] tracking-[0.15em] uppercase text-muted-foreground">
                  Street Address
                </Label>
                <Input
                  value={form.address_line1}
                  onChange={e => updateField("address_line1", e.target.value)}
                  placeholder="Street address"
                  className="bg-card border-border font-body"
                />
              </div>
              <div>
                <Label className="font-body text-[10px] tracking-[0.15em] uppercase text-muted-foreground">
                  Apartment, suite, etc. (optional)
                </Label>
                <Input
                  value={form.address_line2}
                  onChange={e => updateField("address_line2", e.target.value)}
                  placeholder="Apartment, suite, etc."
                  className="bg-card border-border font-body"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-body text-[10px] tracking-[0.15em] uppercase text-muted-foreground">
                    City
                  </Label>
                  <Input
                    value={form.city}
                    onChange={e => updateField("city", e.target.value)}
                    className="bg-card border-border font-body"
                  />
                </div>
                <div>
                  <Label className="font-body text-[10px] tracking-[0.15em] uppercase text-muted-foreground">
                    State
                  </Label>
                  <Input
                    value={form.state}
                    onChange={e => updateField("state", e.target.value)}
                    className="bg-card border-border font-body"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-body text-[10px] tracking-[0.15em] uppercase text-muted-foreground">
                    ZIP Code
                  </Label>
                  <Input
                    value={form.postal_code}
                    onChange={e => updateField("postal_code", e.target.value)}
                    className="bg-card border-border font-body"
                  />
                </div>
                <div>
                  <Label className="font-body text-[10px] tracking-[0.15em] uppercase text-muted-foreground">
                    Country
                  </Label>
                  <Input
                    value={form.country}
                    onChange={e => updateField("country", e.target.value)}
                    className="bg-card border-border font-body"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={closeForm} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSave} className="flex-1">
                {editingId ? "Update" : "Add"} Address
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
              Delete Address
            </h3>
            <p className="font-body text-sm text-muted-foreground mb-4">
              Are you sure you want to delete this address? This action cannot be undone.
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

export default AddressesTab;
