import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Send, CheckCircle } from "lucide-react";

const NewsletterSection = () => {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsSubmitted(true);
    setIsLoading(false);
    setEmail("");
  };

  const benefits = [
    "15% off your first order",
    "Early access to new collections",
    "Exclusive member-only promotions",
    "Style tips and fashion inspiration"
  ];

  return (
    <section className="py-16 md:py-24 px-6 md:px-16 bg-gradient-to-br from-primary/5 to-secondary/10">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Mail className="w-6 h-6 text-primary" />
            <span className="font-body text-sm tracking-[0.2em] uppercase text-primary">Stay Connected</span>
            <Mail className="w-6 h-6 text-primary" />
          </div>
          <h2 className="font-heading text-3xl md:text-5xl font-light text-foreground mb-4">
            Join Our Community
          </h2>
          <p className="font-body text-lg text-muted-foreground max-w-2xl mx-auto">
            Subscribe to our newsletter and be the first to know about new arrivals, exclusive offers, and fashion inspiration.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Benefits list */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h3 className="font-heading text-xl font-light text-foreground mb-6">
              Why Subscribe?
            </h3>
            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                  className="flex items-start gap-3"
                >
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle size={12} className="text-primary" />
                  </div>
                  <p className="font-body text-sm text-foreground">
                    {benefit}
                  </p>
                </motion.div>
              ))}
            </div>
            
            <div className="mt-6 p-4 bg-background rounded-lg border border-border">
              <p className="font-body text-xs text-muted-foreground text-center">
                <span className="font-semibold">10,000+ subscribers</span> already part of our community
              </p>
            </div>
          </motion.div>

          {/* Signup form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="bg-background rounded-lg p-8 border border-border shadow-sm">
              {!isSubmitted ? (
                <>
                  <h3 className="font-heading text-xl font-light text-foreground mb-6">
                    Get Your 15% Off
                  </h3>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email address"
                        className="w-full px-4 py-3 border border-border rounded-lg font-body text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-300"
                        required
                      />
                    </div>
                    
                    <button
                      type="submit"
                      disabled={isLoading || !email}
                      className="w-full bg-primary text-primary-foreground px-6 py-3 font-body text-sm tracking-[0.2em] uppercase hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                          Subscribing...
                        </>
                      ) : (
                        <>
                          Subscribe Now
                          <Send size={16} />
                        </>
                      )}
                    </button>
                  </form>
                  
                  <p className="font-body text-xs text-muted-foreground mt-4 text-center">
                    By subscribing, you agree to our Privacy Policy and Terms of Service.
                  </p>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle size={32} className="text-green-600" />
                  </div>
                  <h3 className="font-heading text-xl font-light text-foreground mb-2">
                    Welcome to the Community!
                  </h3>
                  <p className="font-body text-sm text-muted-foreground mb-4">
                    Check your email for your 15% discount code.
                  </p>
                  <p className="font-body text-xs text-muted-foreground">
                    Don't forget to check your spam folder!
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Social proof */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-16 text-center"
        >
          <div className="flex items-center justify-center gap-8 flex-wrap">
            <div className="text-center">
              <div className="font-heading text-2xl font-light text-foreground">4.9/5</div>
              <div className="font-body text-xs text-muted-foreground">Customer Rating</div>
            </div>
            <div className="text-center">
              <div className="font-heading text-2xl font-light text-foreground">50K+</div>
              <div className="font-body text-xs text-muted-foreground">Happy Customers</div>
            </div>
            <div className="text-center">
              <div className="font-heading text-2xl font-light text-foreground">15%</div>
              <div className="font-body text-xs text-muted-foreground">First Order Discount</div>
            </div>
            <div className="text-center">
              <div className="font-heading text-2xl font-light text-foreground">Free</div>
              <div className="font-body text-xs text-muted-foreground">Shipping Over $150</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default NewsletterSection;
