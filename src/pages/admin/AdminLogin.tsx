import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, Shield, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useAdminAuth } from "@/hooks/useAdminAuth";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { isAdmin, loading } = useAdminAuth();

  useEffect(() => {
    if (!loading && isAdmin) {
      navigate("/admin", { replace: true });
    }
  }, [loading, isAdmin, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { useAdminAuth: _ } = await import("@/hooks/useAdminAuth");
      const { supabase } = await import("@/integrations/supabase/client");
      
      // Try to sign in with admin bypass for unconfirmed emails
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        // If email not confirmed, still try to proceed
        if (error.message.includes('Email not confirmed')) {
          console.log('Email not confirmed but proceeding...');
          // Continue with the login process even if email not confirmed
        } else {
          throw error;
        }
      }

      // Get user session
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Authentication failed");

      // Check admin role from user metadata
      const isAdminUser = user.user_metadata?.role === 'admin';

      if (!isAdminUser) {
        await supabase.auth.signOut();
        toast({ title: "Access denied", description: "You don't have admin privileges.", variant: "destructive" });
      } else {
        // Force session persistence
        localStorage.setItem('admin-session', 'true');
        navigate("/admin");
      }
    } catch (err: any) {
      toast({ title: "Login failed", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="font-body text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Shield size={32} className="text-primary" />
          </div>
          <h1 className="font-heading text-3xl font-semibold text-foreground">Admin Access</h1>
          <p className="font-body text-sm text-muted-foreground mt-1">Sign in with your admin account</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="font-body text-xs uppercase tracking-wider text-muted-foreground">Email</Label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter admin email"
                className="pl-9 h-11 bg-card border-border font-body"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="font-body text-xs uppercase tracking-wider text-muted-foreground">Password</Label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter password"
                className="pl-9 pr-10 h-11 bg-card border-border font-body"
                required
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full h-11 font-body text-xs tracking-wider uppercase" disabled={submitting}>
            {submitting ? "Verifying..." : "Access Admin Panel"}
          </Button>
        </form>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
