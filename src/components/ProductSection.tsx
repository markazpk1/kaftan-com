import { useRef, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import ProductCard from "./ProductCard";
import type { Product } from "@/lib/products";

interface ProductSectionProps {
  title: string;
  products: Product[];
  id?: string;
  viewAllLabel?: string;
  viewAllLink?: string;
}

const ProductSection = ({ title, products, id, viewAllLabel = "View All", viewAllLink = "/shop" }: ProductSectionProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isTouching = useRef(false);

  const scroll = useCallback((direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const amount = container.clientWidth * 0.7;
    const maxScroll = container.scrollWidth - container.clientWidth;
    const atEnd = container.scrollLeft >= maxScroll - 5;

    if (direction === "right" && atEnd) {
      container.scrollTo({ left: 0, behavior: "smooth" });
    } else {
      container.scrollBy({
        left: direction === "left" ? -amount : amount,
        behavior: "smooth",
      });
    }
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onTouchStart = () => { isTouching.current = true; };
    const onTouchEnd = () => { isTouching.current = false; };
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });

    const timer = setInterval(() => {
      if (!isTouching.current) scroll("right");
    }, 5000);

    return () => {
      clearInterval(timer);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [scroll]);

  return (
    <section id={id} className="py-16 md:py-24 px-6 md:px-16">
      <div className="flex items-end justify-between mb-10">
        <motion.h2
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="font-heading text-3xl md:text-5xl font-light text-foreground"
        >
          {title}
        </motion.h2>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="hidden md:flex items-center gap-2"
        >
          <button
            onClick={() => scroll("left")}
            className="border border-border p-2 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300 active:scale-95"
            aria-label="Previous"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => scroll("right")}
            className="border border-border p-2 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300 active:scale-95"
            aria-label="Next"
          >
            <ChevronRight size={20} />
          </button>
        </motion.div>
      </div>

      {/* Mobile navigation arrows - right aligned */}
      <div className="flex md:hidden items-center justify-end gap-3 mb-4 pr-1">
        <button
          onClick={() => scroll("left")}
          className="border border-border p-2.5 rounded-full hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300 active:scale-95"
          aria-label="Previous"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          onClick={() => scroll("right")}
          className="border border-border p-2.5 rounded-full hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300 active:scale-95"
          aria-label="Next"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide pb-4 snap-x snap-mandatory"
      >
        {products.map((product, i) => (
          <div key={product.id} className="flex-shrink-0 w-[260px] md:w-[300px] snap-start">
            <ProductCard product={product} index={i} />
          </div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="text-center mt-10"
      >
        <Link
          to={viewAllLink}
          className="inline-block font-body text-xs tracking-[0.2em] uppercase border-b border-foreground pb-1 text-foreground hover:text-primary hover:border-primary transition-colors duration-300"
        >
          {viewAllLabel}
        </Link>
      </motion.div>
    </section>
  );
};

export default ProductSection;
