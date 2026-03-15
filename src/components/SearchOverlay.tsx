import { useState, useEffect, useRef, useMemo } from "react";
import { Search, X, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { getAllProducts } from "@/lib/productUtils";
import { slugify } from "@/lib/productUtils";
import type { Product } from "@/lib/products";

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const SearchOverlay = ({ isOpen, onClose }: SearchOverlayProps) => {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const allProducts = useMemo(() => getAllProducts(), []);

  const results = useMemo(() => {
    if (query.trim().length < 2) return [];
    const q = query.toLowerCase();
    return allProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [query, allProducts]);

  const categories = useMemo(() => {
    if (query.trim().length < 1) return [];
    const q = query.toLowerCase();
    const cats = Array.from(new Set(allProducts.map((p) => p.category)));
    return cats.filter((c) => c.toLowerCase().includes(q)).slice(0, 4);
  }, [query, allProducts]);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const handleProductClick = () => {
    onClose();
    setQuery("");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[80] bg-charcoal/60 backdrop-blur-md"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed top-0 left-0 right-0 z-[90] bg-background shadow-2xl max-h-[85vh] overflow-hidden flex flex-col"
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 md:px-16 py-4 sm:py-5 border-b border-border">
              <Search size={20} className="text-muted-foreground flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products, categories..."
                className="flex-1 bg-transparent font-body text-lg text-foreground placeholder:text-muted-foreground/50 focus:outline-none tracking-wide"
                autoComplete="off"
              />
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                aria-label="Close search"
              >
                <X size={20} />
              </button>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-16 py-6">
              {query.trim().length < 2 ? (
                <div className="text-center py-12">
                  <p className="font-body text-xs text-muted-foreground tracking-wider">
                    Start typing to search...
                  </p>
                  <div className="mt-8">
                    <p className="font-body text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-4">
                      Popular Searches
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {["Kaftans", "Dresses", "Co-Ords", "Blazers", "Swimwear", "Jumpsuits"].map((term) => (
                        <button
                          key={term}
                          onClick={() => setQuery(term)}
                          className="border border-border px-4 py-2 font-body text-xs tracking-wider text-foreground hover:border-primary hover:text-primary transition-colors"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : results.length === 0 && categories.length === 0 ? (
                <div className="text-center py-12">
                  <p className="font-heading text-xl text-foreground mb-2">No results found</p>
                  <p className="font-body text-xs text-muted-foreground">
                    Try a different search term
                  </p>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Category matches */}
                  {categories.length > 0 && (
                    <div>
                      <h3 className="font-body text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-3">
                        Categories
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {categories.map((cat) => (
                          <Link
                            key={cat}
                            to="/shop"
                            onClick={handleProductClick}
                            className="flex items-center gap-2 border border-border px-4 py-2 font-body text-xs tracking-wider text-foreground hover:border-primary hover:text-primary transition-colors"
                          >
                            {cat}
                            <ArrowRight size={12} />
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Product matches */}
                  {results.length > 0 && (
                    <div>
                      <h3 className="font-body text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-4">
                        Products ({results.length})
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {results.map((product, i) => (
                          <SearchProductCard
                            key={product.id}
                            product={product}
                            index={i}
                            onClick={handleProductClick}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const SearchProductCard = ({ product, index, onClick }: { product: Product; index: number; onClick: () => void }) => {
  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Link to={`/product/${slugify(product.name)}`} onClick={onClick} className="group block">
        <div className="aspect-[3/4] overflow-hidden bg-secondary mb-2">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <h4 className="font-body text-[10px] tracking-[0.1em] uppercase text-foreground group-hover:text-primary transition-colors truncate">
          {product.name}
        </h4>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="font-body text-xs font-medium text-foreground">${product.price.toFixed(2)}</span>
          {product.originalPrice && (
            <>
              <span className="font-body text-[10px] text-muted-foreground line-through">${product.originalPrice.toFixed(2)}</span>
              <span className="font-body text-[10px] text-sale">-{discount}%</span>
            </>
          )}
        </div>
      </Link>
    </motion.div>
  );
};

export default SearchOverlay;
