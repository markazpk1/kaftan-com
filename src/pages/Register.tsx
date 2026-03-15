import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) navigate("/account", { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) throw error;

      // Create customer profile
      if (authData.user) {
        const { error: customerError } = await supabase
          .from('customers')
          .insert({
            user_id: authData.user.id,
            full_name: name,
            email: email,
          });

        if (customerError) {
          console.error('Error creating customer profile:', customerError);
          // Don't fail registration if customer profile creation fails
        }
      }

      toast({ title: "Account created!", description: "You can now sign in." });
      navigate("/account");
    } catch (err: any) {
      toast({ title: "Registration failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="font-heading text-3xl sm:text-4xl font-semibold text-foreground">Create Account</h1>
            <p className="mt-2 text-muted-foreground font-body text-sm">Join FashionSpectrum today</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="font-body text-sm tracking-wide uppercase text-foreground">Full Name</Label>
              <Input id="name" type="text" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} className="h-12 border-border bg-card font-body" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="font-body text-sm tracking-wide uppercase text-foreground">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 border-border bg-card font-body" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="font-body text-sm tracking-wide uppercase text-foreground">Password</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 border-border bg-card font-body pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="font-body text-sm tracking-wide uppercase text-foreground">Confirm Password</Label>
              <Input id="confirmPassword" type={showPassword ? "text" : "password"} placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="h-12 border-border bg-card font-body" />
            </div>

            <Button type="submit" className="w-full h-12 font-body text-sm tracking-widest uppercase" disabled={loading}>
              {loading ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground font-body">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Register;
