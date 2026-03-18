import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { TrendingUp, Star, Heart } from "lucide-react";
import ProductCard from "./ProductCard";
import { productService } from "@/lib/productService";
import type { Product as DBProduct } from "@/lib/productService";
import type { Product } from "@/lib/products";

const BestSellersSection = () => {
  const [products, setProducts] = useState<DBProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBestSellers();
  }, []);

  const loadBestSellers = async () => {
    try {
      const data = await productService.getProducts();
      // Get featured products as best sellers (in a real app, this would be based on sales data)
      const bestSellers = data
        .filter(p => p.featured && p.in_stock)
        .slice(0, 8);
      setProducts(bestSellers);
    } catch (error) {
      console.error('Error loading best sellers:', error);
    } finally {
      setLoading(false);
    }
  };

  // Convert DB products to frontend Product format
  const convertToProduct = (p: DBProduct): Product => ({
    id: p.id,
    name: p.name,
    price: p.price,
    original_price: p.original_price || undefined,
    image: p.images?.[0] || "/placeholder.svg",
    badge: p.original_price && p.price < p.original_price ? "Sale" : undefined,
    category: p.category || "",
    style: undefined,
    color: p.colors?.[0],
  });

  const bestSellerProducts = products.map(convertToProduct);

  return (
    <section className="py-16 md:py-24 px-6 md:px-16 bg-gradient-to-b from-background to-secondary/20">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            <span className="font-body text-sm tracking-[0.2em] uppercase text-primary">Customer Favorites</span>
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <h2 className="font-heading text-3xl md:text-5xl font-light text-foreground mb-4">
            Best Sellers
          </h2>
          <p className="font-body text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
            Our most loved pieces, chosen by thousands of satisfied customers worldwide
          </p>
          
          {/* Social proof indicators */}
          <div className="flex items-center justify-center gap-6 flex-wrap">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} className="fill-yellow-400 text-yellow-400" />
              ))}
              <span className="ml-1 text-sm text-muted-foreground">4.9/5 Rating</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Heart size={14} className="text-red-500 fill-red-500" />
              <span>10K+ Happy Customers</span>
            </div>
            <div className="text-sm text-muted-foreground">
              <span className="font-semibold text-primary">50K+</span> Products Sold
            </div>
          </div>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[3/4] bg-secondary rounded-lg mb-4" />
                <div className="h-4 bg-secondary rounded w-3/4 mb-2" />
                <div className="h-4 bg-secondary rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-12">
              {bestSellerProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <ProductCard product={product} index={index} />
                </motion.div>
              ))}
            </div>

                      </>
        )}

        {/* Customer testimonials mini section */}
              </div>
    </section>
  );
};

export default BestSellersSection;
