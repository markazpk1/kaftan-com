import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, Trash2 } from "lucide-react";
import AnnouncementBar from "@/components/AnnouncementBar";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { useWishlist } from "@/contexts/WishlistContext";

const Wishlist = () => {
  const { items, clearWishlist } = useWishlist();

  return (
    <div className="min-h-screen bg-background pb-mobile-nav">
      <AnnouncementBar />
      <Navbar />

      {/* Header */}
      <div className="py-12 md:py-16 px-6 md:px-16 text-center border-b border-border">
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-heading text-4xl md:text-6xl text-foreground font-light"
        >
          Wishlist
        </motion.h1>
        <p className="font-body text-sm text-muted-foreground mt-3 tracking-wide">
          {items.length} item{items.length !== 1 ? "s" : ""} saved
        </p>
      </div>

      {/* Breadcrumb */}
      <div className="px-6 md:px-16 py-4 border-b border-border">
        <div className="flex items-center gap-2 font-body text-[10px] tracking-[0.15em] uppercase text-muted-foreground">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span>/</span>
          <span className="text-foreground">Wishlist</span>
        </div>
      </div>

      <div className="px-6 md:px-16 py-8 md:py-12">
        {items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <Heart size={48} className="mx-auto text-muted-foreground/30 mb-4" />
            <h2 className="font-heading text-2xl text-foreground mb-2">Your wishlist is empty</h2>
            <p className="font-body text-xs text-muted-foreground tracking-wide mb-8">
              Save your favourite pieces by clicking the heart icon.
            </p>
            <Link
              to="/shop"
              className="inline-block font-body text-xs tracking-[0.2em] uppercase bg-primary text-primary-foreground px-8 py-4 hover:bg-charcoal transition-colors"
            >
              Explore Shop
            </Link>
          </motion.div>
        ) : (
          <>
            <div className="flex justify-end mb-6">
              <button
                onClick={clearWishlist}
                className="flex items-center gap-2 font-body text-xs tracking-wider uppercase text-muted-foreground hover:text-sale transition-colors"
              >
                <Trash2 size={14} />
                Clear All
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {items.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Wishlist;
