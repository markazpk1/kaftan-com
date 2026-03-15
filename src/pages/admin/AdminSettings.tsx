import { useState, useEffect } from "react";
import { Save, Globe, Mail, CreditCard, Truck, Shield, Bell, Loader2, Key, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { settingsService, StoreSettings } from "@/lib/settingsService";
import { supabase } from "@/integrations/supabase/client";

const AdminSettings = () => {
  const [settings, setSettings] = useState<StoreSettings>({
    store_name: "Fashion Spectrum",
    store_email: "contact@fashionspectrum.com",
    store_phone: "+61 2 9876 5432",
    currency: "AUD",
    tax_rate: 10,
    free_shipping_min: 100,
    shipping_fee: 15,
    enable_reviews: true,
    enable_wishlist: true,
    enable_cod: true,
    maintenance_mode: false,
    email_notifications: true,
    order_notifications: true,
    low_stock_alerts: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await settingsService.getSettings();
      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({ 
        title: "Error loading settings", 
        description: "Please try again later",
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const update = (key: keyof StoreSettings, value: string | number | boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      
      // Validate settings
      const validation = settingsService.validateSettings(settings);
      if (!validation.isValid) {
        toast({ 
          title: "Validation Error", 
          description: validation.errors.join(", "),
          variant: "destructive" 
        });
        return;
      }

      await settingsService.saveSettings(settings);
      setHasChanges(false);
      toast({ title: "Settings saved successfully!" });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({ 
        title: "Error saving settings", 
        description: "Please try again later",
        variant: "destructive" 
      });
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    try {
      setChangingPassword(true);
      
      // Validate password data
      if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
        toast({ 
          title: "Validation Error", 
          description: "All password fields are required",
          variant: "destructive" 
        });
        return;
      }
      
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        toast({ 
          title: "Password Mismatch", 
          description: "New password and confirmation do not match",
          variant: "destructive" 
        });
        return;
      }
      
      if (passwordData.newPassword.length < 6) {
        toast({ 
          title: "Password Too Short", 
          description: "Password must be at least 6 characters long",
          variant: "destructive" 
        });
        return;
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ 
          title: "Error", 
          description: "No authenticated user found",
          variant: "destructive" 
        });
        return;
      }

      // Change password
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) {
        toast({ 
          title: "Password Change Failed", 
          description: error.message,
          variant: "destructive" 
        });
        return;
      }

      // Reset password form
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
      
      toast({ title: "Password changed successfully!" });
    } catch (error) {
      console.error('Error changing password:', error);
      toast({ 
        title: "Error changing password", 
        description: "Please try again later",
        variant: "destructive" 
      });
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold text-foreground">Settings</h1>
          <p className="font-body text-sm text-muted-foreground">Store configuration</p>
        </div>
        <Button 
          className="font-body text-xs tracking-wider uppercase" 
          onClick={saveSettings}
          disabled={saving || !hasChanges}
        >
          {saving ? (
            <>
              <Loader2 size={14} className="mr-1 animate-spin" /> Saving...
            </>
          ) : (
            <>
              <Save size={14} className="mr-1" /> Save Changes
            </>
          )}
        </Button>
      </div>

      {/* General */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Globe size={18} className="text-primary" />
          <h3 className="font-heading text-lg font-semibold text-foreground">General</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="font-body text-xs uppercase text-muted-foreground">Store Name</Label>
            <Input value={settings.store_name} onChange={e => update("store_name", e.target.value)} className="h-10 bg-card border-border font-body" />
          </div>
          <div className="space-y-1.5">
            <Label className="font-body text-xs uppercase text-muted-foreground">Email</Label>
            <Input value={settings.store_email} onChange={e => update("store_email", e.target.value)} className="h-10 bg-card border-border font-body" />
          </div>
          <div className="space-y-1.5">
            <Label className="font-body text-xs uppercase text-muted-foreground">Phone</Label>
            <Input value={settings.store_phone} onChange={e => update("store_phone", e.target.value)} className="h-10 bg-card border-border font-body" />
          </div>
          <div className="space-y-1.5">
            <Label className="font-body text-xs uppercase text-muted-foreground">Currency</Label>
            <select value={settings.currency} onChange={e => update("currency", e.target.value)} className="w-full h-10 rounded-md border border-border bg-card px-3 font-body text-sm text-foreground">
              <option value="AUD">AUD ($)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Shipping & Tax */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Truck size={18} className="text-primary" />
          <h3 className="font-heading text-lg font-semibold text-foreground">Shipping & Tax</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="font-body text-xs uppercase text-muted-foreground">Tax Rate (%)</Label>
            <Input type="number" value={settings.tax_rate} onChange={e => update("tax_rate", parseFloat(e.target.value) || 0)} className="h-10 bg-card border-border font-body" />
          </div>
          <div className="space-y-1.5">
            <Label className="font-body text-xs uppercase text-muted-foreground">Free Shipping Min</Label>
            <Input type="number" value={settings.free_shipping_min} onChange={e => update("free_shipping_min", parseFloat(e.target.value) || 0)} className="h-10 bg-card border-border font-body" />
          </div>
          <div className="space-y-1.5">
            <Label className="font-body text-xs uppercase text-muted-foreground">Shipping Fee</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-body text-muted-foreground">
                {settings.currency === 'AUD' ? '$' : settings.currency}
              </span>
              <Input 
                type="number" 
                value={settings.shipping_fee} 
                onChange={e => update("shipping_fee", parseFloat(e.target.value) || 0)} 
                className="h-10 bg-card border-border font-body pl-8" 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Shield size={18} className="text-primary" />
          <h3 className="font-heading text-lg font-semibold text-foreground">Features</h3>
        </div>
        {[
          { key: "enable_reviews", label: "Customer Reviews", desc: "Allow customers to leave product reviews" },
          { key: "enable_wishlist", label: "Wishlist", desc: "Enable wishlist functionality" },
          { key: "enable_cod", label: "Cash on Delivery", desc: "Accept COD payments" },
          { key: "maintenance_mode", label: "Maintenance Mode", desc: "Put store in maintenance mode" },
        ].map(f => (
          <div key={f.key} className="flex items-center justify-between py-2">
            <div>
              <p className="font-body text-sm font-medium text-foreground">{f.label}</p>
              <p className="font-body text-xs text-muted-foreground">{f.desc}</p>
            </div>
            <Switch checked={settings[f.key as keyof StoreSettings] as boolean} onCheckedChange={v => update(f.key as keyof StoreSettings, v)} />
          </div>
        ))}
      </div>

      {/* Notifications */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Bell size={18} className="text-primary" />
          <h3 className="font-heading text-lg font-semibold text-foreground">Notifications</h3>
        </div>
        {[
          { key: "email_notifications", label: "Email Notifications", desc: "Receive email for important updates" },
          { key: "order_notifications", label: "Order Notifications", desc: "Get notified for new orders" },
          { key: "low_stock_alerts", label: "Low Stock Alerts", desc: "Alert when products are running low" },
        ].map(f => (
          <div key={f.key} className="flex items-center justify-between py-2">
            <div>
              <p className="font-body text-sm font-medium text-foreground">{f.label}</p>
              <p className="font-body text-xs text-muted-foreground">{f.desc}</p>
            </div>
            <Switch checked={settings[f.key as keyof StoreSettings] as boolean} onCheckedChange={v => update(f.key as keyof StoreSettings, v)} />
          </div>
        ))}
      </div>

      {/* Password Change */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Key size={18} className="text-primary" />
          <h3 className="font-heading text-lg font-semibold text-foreground">Change Password</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="font-body text-xs uppercase text-muted-foreground">Current Password</Label>
            <div className="relative">
              <Input 
                type={showPasswords.current ? "text" : "password"}
                value={passwordData.currentPassword}
                onChange={e => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                className="h-10 bg-card border-border font-body pr-10"
                placeholder="Enter current password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-10 w-10 p-0"
                onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
              >
                {showPasswords.current ? <EyeOff size={14} /> : <Eye size={14} />}
              </Button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="font-body text-xs uppercase text-muted-foreground">New Password</Label>
            <div className="relative">
              <Input 
                type={showPasswords.new ? "text" : "password"}
                value={passwordData.newPassword}
                onChange={e => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                className="h-10 bg-card border-border font-body pr-10"
                placeholder="Enter new password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-10 w-10 p-0"
                onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
              >
                {showPasswords.new ? <EyeOff size={14} /> : <Eye size={14} />}
              </Button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="font-body text-xs uppercase text-muted-foreground">Confirm New Password</Label>
            <div className="relative">
              <Input 
                type={showPasswords.confirm ? "text" : "password"}
                value={passwordData.confirmPassword}
                onChange={e => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className="h-10 bg-card border-border font-body pr-10"
                placeholder="Confirm new password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-10 w-10 p-0"
                onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
              >
                {showPasswords.confirm ? <EyeOff size={14} /> : <Eye size={14} />}
              </Button>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <p className="font-body text-xs text-muted-foreground">
            Password must be at least 6 characters long
          </p>
          <Button 
            onClick={changePassword}
            disabled={changingPassword || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
            className="font-body text-xs"
          >
            {changingPassword ? (
              <>
                <Loader2 size={14} className="mr-1 animate-spin" /> Changing...
              </>
            ) : (
              <>
                <Key size={14} className="mr-1" /> Change Password
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
