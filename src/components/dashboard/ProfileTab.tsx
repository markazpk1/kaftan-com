import { useState, useEffect } from "react";
import { User, Package, MapPin, Heart, CreditCard, Clock, Star, Edit2, Camera, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { supabase } from "@/integrations/supabase/client";

const ProfileTab = () => {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { totalItems: wishlistCount } = useWishlist();
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    dob: "",
    gender: "",
  });
  const [stats, setStats] = useState({
    totalOrders: 0,
    wishlistCount: wishlistCount,
    reviewsCount: 0,
  });

  // Fetch user profile data and statistics
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Set basic profile data from auth
        setProfile({
          name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || "",
          email: user?.email || "",
          phone: user?.user_metadata?.phone || "",
          dob: user?.user_metadata?.date_of_birth || "",
          gender: user?.user_metadata?.gender || "",
        });

        // Fetch user statistics from database
        const ordersResult = await supabase
          .from('orders')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id);

        // Update statistics
        setStats({
          totalOrders: ordersResult.count || 0,
          wishlistCount: wishlistCount,
          reviewsCount: 0, // TODO: Implement reviews system
        });
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast.error("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  // Update wishlist count when it changes
  useEffect(() => {
    setStats(prev => ({ ...prev, wishlistCount }));
  }, [wishlistCount]);

  // Handle profile update
  const handleSaveProfile = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Update user metadata in Supabase Auth
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: profile.name,
          phone: profile.phone,
          date_of_birth: profile.dob,
          gender: profile.gender,
        }
      });

      if (error) throw error;
      
      setEditing(false);
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="font-heading text-xl text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-2xl font-semibold text-foreground">My Profile</h2>
        <Button variant="outline" size="sm" onClick={() => { if (editing) { handleSaveProfile(); } else { setEditing(true); } }} disabled={loading}>
          <Edit2 size={14} className="mr-1" /> {loading ? "Loading..." : (editing ? "Save" : "Edit")}
        </Button>
      </div>

      {/* Avatar Section */}
      <div className="flex items-center gap-5">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary font-heading text-2xl font-semibold">
            {(profile.name || user?.email?.split('@')[0] || "U").substring(0, 2).toUpperCase()}
          </div>
          <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md">
            <User size={14} />
          </button>
        </div>
        <div>
          <h3 className="font-heading text-xl font-semibold text-foreground">{profile.name || "User"}</h3>
          <p className="text-sm text-muted-foreground font-body">Member since {new Date(user?.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) || "Unknown"}</p>
          <div className="flex items-center gap-1 mt-1">
            <Star size={14} className="text-accent fill-accent" />
            <span className="text-xs font-body text-muted-foreground">Member</span>
          </div>
        </div>
      </div>

      <Separator />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Orders", value: stats.totalOrders.toString(), icon: Package },
          { label: "Wishlist", value: stats.wishlistCount.toString(), icon: Heart },
          { label: "Reviews Given", value: stats.reviewsCount.toString(), icon: Star },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-lg p-4 text-center">
            <s.icon size={20} className="mx-auto text-primary mb-2" />
            <p className="font-heading text-xl font-semibold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground font-body">{s.label}</p>
          </div>
        ))}
      </div>

      <Separator />

      {/* Profile Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { label: "Full Name", key: "name", icon: User },
          { label: "Email Address", key: "email", icon: Mail },
          { label: "Phone Number", key: "phone", icon: Phone },
          { label: "Date of Birth", key: "dob", icon: Clock },
        ].map(f => (
          <div key={f.key} className="space-y-1.5">
            <Label className="font-body text-[10px] tracking-[0.15em] uppercase text-muted-foreground flex items-center gap-1.5">
              <f.icon size={12} /> {f.label}
            </Label>
            {editing ? (
              <Input
                value={profile[f.key as keyof typeof profile]}
                onChange={e => setProfile(p => ({ ...p, [f.key]: e.target.value }))}
                className="h-10 bg-card border-border font-body"
              />
            ) : (
              <p className="font-body text-sm text-foreground py-2">{profile[f.key as keyof typeof profile]}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProfileTab;
