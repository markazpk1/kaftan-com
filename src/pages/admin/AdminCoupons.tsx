import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Edit2, X, Copy, Percent, Tag, CalendarIcon } from "lucide-react";
import { format, parse } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "@/hooks/use-toast";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { supabase } from "@/integrations/supabase/client";

interface Coupon {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  minimum_amount: number;
  usage_limit: number | null;
  times_used: number;
  start_date: string;
  end_date: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

const AdminCoupons = () => {
  const { isAdmin } = useAdminAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editCoupon, setEditCoupon] = useState<Coupon | null>(null);
  const [form, setForm] = useState({ 
    code: "", 
    discount_type: "percentage" as "percentage" | "fixed", 
    discount_value: "", 
    minimum_amount: "", 
    usage_limit: "", 
    end_date: "" 
  });

  // Fetch coupons from database
  const fetchCoupons = async () => {
    if (!isAdmin) return;
    
    try {
      const { data, error } = await (supabase.from as any)('coupons')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setCoupons((data || []) as Coupon[]);
    } catch (error: any) {
      console.error('Error fetching coupons:', error);
      toast({ 
        title: "Failed to load coupons", 
        description: error.message,
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, [isAdmin]);

  const openAdd = () => { 
    setEditCoupon(null); 
    setForm({ 
      code: "", 
      discount_type: "percentage", 
      discount_value: "", 
      minimum_amount: "", 
      usage_limit: "", 
      end_date: "" 
    }); 
    setShowModal(true); 
  };
  
  const openEdit = (c: Coupon) => {
    setEditCoupon(c);
    setForm({ 
      code: c.code, 
      discount_type: c.discount_type, 
      discount_value: String(c.discount_value), 
      minimum_amount: String(c.minimum_amount), 
      usage_limit: c.usage_limit ? String(c.usage_limit) : "", 
      end_date: c.end_date ? format(new Date(c.end_date), "yyyy-MM-dd") : ""
    }); 
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.code || !form.discount_value) { 
      toast({ title: "Fill required fields", variant: "destructive" }); 
      return; 
    }
    
    try {
      const couponData = {
        code: form.code.toUpperCase(),
        discount_type: form.discount_type,
        discount_value: Number(form.discount_value),
        minimum_amount: Number(form.minimum_amount) || 0,
        usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
        start_date: new Date().toISOString(),
        end_date: form.end_date ? new Date(form.end_date).toISOString() : null,
      };

      if (editCoupon) {
        const { error } = await (supabase.from as any)('coupons')
          .update(couponData)
          .eq('id', editCoupon.id);
        
        if (error) throw error;
        toast({ title: "Coupon updated!" });
      } else {
        const { error } = await (supabase.from as any)('coupons')
          .insert(couponData);
        
        if (error) throw error;
        toast({ title: "Coupon created!" });
      }
      
      await fetchCoupons();
      setShowModal(false);
    } catch (error: any) {
      console.error('Error saving coupon:', error);
      toast({ 
        title: "Failed to save coupon", 
        description: error.message,
        variant: "destructive" 
      });
    }
  };

  const toggleActive = async (id: string) => {
    try {
      const coupon = coupons.find(c => c.id === id);
      if (!coupon) return;
      
      const { error } = await (supabase.from as any)('coupons')
        .update({ active: !coupon.active })
        .eq('id', id);
      
      if (error) throw error;
      await fetchCoupons();
    } catch (error: any) {
      console.error('Error toggling coupon:', error);
      toast({ 
        title: "Failed to update coupon", 
        description: error.message,
        variant: "destructive" 
      });
    }
  };

  const deleteCoupon = async (id: string) => {
    try {
      const { error } = await (supabase.from as any)('coupons')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      await fetchCoupons();
      toast({ title: "Coupon deleted!" });
    } catch (error: any) {
      console.error('Error deleting coupon:', error);
      toast({ 
        title: "Failed to delete coupon", 
        description: error.message,
        variant: "destructive" 
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-3xl font-semibold text-foreground">Coupons & Discounts</h1>
          <p className="font-body text-sm text-muted-foreground">Loading coupons...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-card border border-border rounded-xl p-5 animate-pulse">
              <div className="w-20 h-4 bg-muted rounded mb-2"></div>
              <div className="w-32 h-3 bg-muted rounded mb-3"></div>
              <div className="w-16 h-3 bg-muted rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold text-foreground">Coupons & Discounts</h1>
          <p className="font-body text-sm text-muted-foreground">{coupons.length} coupons</p>
        </div>
        <Button className="font-body text-xs tracking-wider uppercase" onClick={openAdd}><Plus size={14} className="mr-1" /> Add Coupon</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {coupons.map(c => (
          <div key={c.id} className={`bg-card border rounded-xl p-5 ${c.active ? "border-border" : "border-border opacity-60"}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  {c.discount_type === "percentage" ? <Percent size={18} className="text-primary" /> : <Tag size={18} className="text-primary" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-body text-sm font-bold text-foreground tracking-wider">{c.code}</p>
                    <button onClick={() => { navigator.clipboard.writeText(c.code); toast({ title: "Copied!" }); }}>
                      <Copy size={12} className="text-muted-foreground hover:text-foreground" />
                    </button>
                  </div>
                  <p className="font-body text-xs text-muted-foreground">
                    {c.discount_type === "percentage" ? `${c.discount_value}% off` : `AUD ${c.discount_value} off`}
                    {c.minimum_amount > 0 && ` · Min AUD ${c.minimum_amount.toLocaleString()}`}
                  </p>
                </div>
              </div>
              <Switch checked={c.active} onCheckedChange={() => toggleActive(c.id)} />
            </div>
            <div className="flex items-center justify-between text-xs font-body text-muted-foreground mb-3">
              <span>{c.times_used} / {c.usage_limit || "∞"} uses</span>
              <span>Expires: {c.end_date ? format(new Date(c.end_date), "MMM dd, yyyy") : "No expiry"}</span>
            </div>
            {c.usage_limit && c.usage_limit > 0 && (
              <div className="h-1.5 bg-secondary rounded-full overflow-hidden mb-3">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.min(100, (c.times_used / c.usage_limit) * 100)}%` }} />
              </div>
            )}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="font-body text-xs" onClick={() => openEdit(c)}><Edit2 size={12} className="mr-1" /> Edit</Button>
              <Button variant="ghost" size="sm" className="font-body text-xs text-destructive" onClick={() => deleteCoupon(c.id)}><Trash2 size={12} className="mr-1" /> Delete</Button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/60" onClick={() => setShowModal(false)} />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative z-50 bg-background border border-border rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-heading text-xl font-semibold text-foreground">{editCoupon ? "Edit" : "New"} Coupon</h3>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="font-body text-xs uppercase text-muted-foreground">Code *</Label>
                <Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} className="h-10 bg-card border-border font-body uppercase tracking-wider" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="font-body text-xs uppercase text-muted-foreground">Type</Label>
                  <select value={form.discount_type} onChange={e => setForm(f => ({ ...f, discount_type: e.target.value as "percentage" | "fixed" }))} className="w-full h-10 rounded-md border border-border bg-card px-3 font-body text-sm text-foreground">
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="font-body text-xs uppercase text-muted-foreground">Value *</Label>
                  <Input type="number" value={form.discount_value} onChange={e => setForm(f => ({ ...f, discount_value: e.target.value }))} className="h-10 bg-card border-border font-body" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="font-body text-xs uppercase text-muted-foreground">Min Order (AUD)</Label>
                  <Input type="number" value={form.minimum_amount} onChange={e => setForm(f => ({ ...f, minimum_amount: e.target.value }))} className="h-10 bg-card border-border font-body" />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-body text-xs uppercase text-muted-foreground">Max Uses</Label>
                  <Input type="number" value={form.usage_limit} onChange={e => setForm(f => ({ ...f, usage_limit: e.target.value }))} placeholder="0 = unlimited" className="h-10 bg-card border-border font-body" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="font-body text-xs uppercase text-muted-foreground">Expiry Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full h-10 justify-start text-left font-normal bg-card border-border font-body",
                        !form.end_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {form.end_date ? format(parse(form.end_date, "yyyy-MM-dd", new Date()), "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={form.end_date ? parse(form.end_date, "yyyy-MM-dd", new Date()) : undefined}
                      onSelect={(date) => setForm(f => ({ ...f, end_date: date ? format(date, "yyyy-MM-dd") : "" }))}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" className="flex-1 font-body text-xs tracking-wider uppercase" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button className="flex-1 font-body text-xs tracking-wider uppercase" onClick={handleSave}>{editCoupon ? "Update" : "Create"}</Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminCoupons;
