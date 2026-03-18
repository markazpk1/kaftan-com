import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Gift, Tag, Clock, ArrowRight } from "lucide-react";

const PromotionalBanner = () => {
  const promotions = [
    {
      id: "free-shipping",
      title: "Free Shipping",
      subtitle: "On orders over $150",
      description: "Enjoy complimentary shipping on all orders above $150",
      icon: Gift,
      color: "bg-blue-500",
      link: "/shop"
    },
    {
      id: "seasonal-sale",
      title: "Seasonal Sale",
      subtitle: "Up to 40% Off",
      description: "Limited time offer on selected collections",
      icon: Tag,
      color: "bg-red-500",
      link: "/sale"
    },
    {
      id: "new-arrival",
      title: "New Arrivals",
      subtitle: "Just In Store",
      description: "Be the first to shop our latest collection",
      icon: Clock,
      color: "bg-green-500",
      link: "/new-arrivals"
    }
  ];

  return (
    <section className="py-12 md:py-16 px-6 md:px-16">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="font-heading text-2xl md:text-3xl font-light text-foreground mb-4">
            Special Offers
          </h2>
          <p className="font-body text-muted-foreground">
            Don't miss out on these exclusive deals
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {promotions.map((promo, index) => (
            <motion.div
              key={promo.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Link to={promo.link} className="block group">
                <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-background to-secondary border border-border hover:border-primary transition-all duration-300 p-8 h-full">
                  {/* Background decoration */}
                  <div className={`absolute top-0 right-0 w-24 h-24 ${promo.color} opacity-10 rounded-full -translate-y-12 translate-x-12 group-hover:scale-150 transition-transform duration-700`} />
                  
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-12 h-12 ${promo.color} rounded-full flex items-center justify-center`}>
                        <promo.icon size={20} className="text-white" />
                      </div>
                      <div>
                        <h3 className="font-heading text-xl font-light text-foreground group-hover:text-primary transition-colors duration-300">
                          {promo.title}
                        </h3>
                        <p className="font-body text-sm text-primary font-medium">
                          {promo.subtitle}
                        </p>
                      </div>
                    </div>
                    
                    <p className="font-body text-sm text-muted-foreground mb-6 leading-relaxed">
                      {promo.description}
                    </p>
                    
                    <div className="flex items-center gap-2 text-primary font-body text-sm tracking-[0.1em] uppercase group-hover:gap-3 transition-all duration-300">
                      Shop Now
                      <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Additional promotional banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12"
        >
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary/10 to-secondary/20 border border-border p-8 md:p-12">
            <div className="relative z-10 text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Gift className="w-6 h-6 text-primary" />
                <span className="font-body text-sm tracking-[0.2em] uppercase text-primary">Limited Time Offer</span>
                <Gift className="w-6 h-6 text-primary" />
              </div>
              
              <h3 className="font-heading text-2xl md:text-3xl font-light text-foreground mb-4">
                Get 15% Off Your First Order
              </h3>
              
              <p className="font-body text-muted-foreground mb-6 max-w-2xl mx-auto">
                Join our exclusive newsletter and receive a special discount code for your first purchase. Be the first to know about new arrivals and special promotions.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 border border-border rounded-lg font-body text-sm focus:outline-none focus:border-primary transition-colors duration-300"
                />
                <button className="w-full sm:w-auto bg-primary text-primary-foreground px-6 py-3 font-body text-sm tracking-[0.2em] uppercase hover:bg-primary/90 transition-colors duration-300">
                  Subscribe
                </button>
              </div>
              
              <p className="font-body text-xs text-muted-foreground mt-4">
                No spam, unsubscribe anytime. Privacy policy applies.
              </p>
            </div>
            
            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
              <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary/5 rounded-full" />
              <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-secondary/10 rounded-full" />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default PromotionalBanner;
