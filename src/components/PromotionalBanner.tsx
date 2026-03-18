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
        
              </div>
    </section>
  );
};

export default PromotionalBanner;
