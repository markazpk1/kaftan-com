import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Mail, Lock, Eye, EyeOff, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const AdminSetup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-admin", {
        body: { email, password },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: "Admin account created!", description: "You can now sign in." });
      navigate("/admin/login");
    } catch (err: any) {
      toast({ title: "Setup failed", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <UserPlus size={32} className="text-primary" />
          </div>
          <h1 className="font-heading text-3xl font-semibold text-foreground">Admin Setup</h1>
          <p className="font-body text-sm text-muted-foreground mt-1">Create the first admin account</p>
        </div>

        <form onSubmit={handleSetup} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="font-body text-xs uppercase tracking-wider text-muted-foreground">Email</Label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@yourstore.com" className="pl-9 h-11 bg-card border-border font-body" required />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="font-body text-xs uppercase tracking-wider text-muted-foreground">Password</Label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters" className="pl-9 pr-10 h-11 bg-card border-border font-body" required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full h-11 font-body text-xs tracking-wider uppercase" disabled={submitting}>
            {submitting ? "Creating..." : "Create Admin Account"}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground font-body mt-6">
          Already have an admin account?{" "}
          <a href="/admin/login" className="text-primary hover:underline">Sign in</a>
        </p>
      </motion.div>
    </div>
  );
};

export default AdminSetup;
