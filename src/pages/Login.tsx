import { useState } from "react";
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
import { useEffect } from "react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) navigate("/account", { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      console.log("Attempting login with:", email);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error("Login error:", error);
        toast({ title: "Login failed", description: error.message || "Invalid credentials", variant: "destructive" });
      } else {
        console.log("Login successful for user:", email);
        toast({ title: "Login successful!", description: "Welcome back!" });
        navigate("/account");
      }
    } catch (err: any) {
      console.error("Login exception:", err);
      toast({ title: "Login failed", description: "An error occurred. Please try again.", variant: "destructive" });
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
            <h1 className="font-heading text-3xl sm:text-4xl font-semibold text-foreground">Welcome Back</h1>
            <p className="mt-2 text-muted-foreground font-body text-sm">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="font-body text-sm tracking-wide uppercase text-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 border-border bg-card font-body"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="font-body text-sm tracking-wide uppercase text-foreground">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 border-border bg-card font-body pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-12 font-body text-sm tracking-widest uppercase" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground font-body">
            Don't have an account?{" "}
            <Link to="/register" className="text-primary font-medium hover:underline">
              Register
            </Link>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Login;
