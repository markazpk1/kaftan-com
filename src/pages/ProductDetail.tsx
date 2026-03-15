import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, Minus, Plus, Truck, RotateCcw, Shield } from "lucide-react";
import { getProductBySlug, getRelatedProducts } from "@/lib/productUtils";
import { useProductBySlug } from "@/hooks/useProducts";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import AnnouncementBar from "@/components/AnnouncementBar";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import ProductReviews from "@/components/ProductReviews";
import ImageZoom from "@/components/ImageZoom";

const ProductDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: dbProduct, isLoading } = useProductBySlug(slug || "");
  const staticProduct = getProductBySlug(slug || "");
  const product = dbProduct || staticProduct;

  const { addItem } = useCart();
  const { toggleItem, isInWishlist } = useWishlist();
  const [quantity, setQuantity] = useState(1);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="font-body text-sm text-muted-foreground tracking-widest uppercase animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="font-heading text-3xl md:text-4xl text-foreground mb-4">Product Not Found</h1>
          <Link to="/" className="font-body text-xs tracking-[0.2em] uppercase text-primary hover:text-foreground transition-colors">
            ← Back to Shop
          </Link>
        </div>
      </div>
    );
  }

  const wishlisted = isInWishlist(product.id);
  const related = staticProduct ? getRelatedProducts(staticProduct) : [];

  const handleAddToCart = () => {
    addItem(product, "One Size", quantity);
  };

  const discount = (product as any).originalPrice && product.price
    ? Math.round((((product as any).originalPrice - product.price) / (product as any).originalPrice) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-background pb-mobile-nav">
      <AnnouncementBar />
      <Navbar />

      {/* Breadcrumb */}
      <div className="px-4 sm:px-6 md:px-16 py-4">
        <div className="flex items-center gap-2 font-body text-[10px] tracking-[0.15em] uppercase text-muted-foreground">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span>/</span>
          <span className="text-foreground truncate">{product.name}</span>
        </div>
      </div>

      {/* Product */}
      <section className="px-4 sm:px-6 md:px-16 pb-16 md:pb-24">
        <div className="grid md:grid-cols-2 gap-6 md:gap-16 max-w-7xl mx-auto">
          {/* Image */}
          <div className="space-y-3 md:space-y-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="aspect-[3/4] overflow-hidden bg-secondary"
            >
              <ImageZoom
                src={product.image}
                alt={product.name}
                className="w-full h-full"
                zoomLevel={2}
              />
            </motion.div>
          </div>

          {/* Product Info */}
          <div className="flex flex-col justify-center">
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <p className="font-body text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-2">
                {product.category}
              </p>
              <h1 className="font-heading text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light text-foreground mb-4">
                {product.name}
              </h1>

              {product.price != null && (
                <div className="flex items-center gap-3 mb-6">
                  <span className="font-heading text-xl sm:text-2xl text-foreground">${product.price.toFixed(2)}</span>
                  {(product as any).originalPrice && (
                    <>
                      <span className="font-body text-base sm:text-lg text-muted-foreground line-through">
                        ${(product as any).originalPrice.toFixed(2)}
                      </span>
                      <span className="font-body text-xs bg-sale text-primary-foreground px-2 py-1">
                        Save {discount}%
                      </span>
                    </>
                  )}
                </div>
              )}

              {/* Description */}
              <div className="mb-8 space-y-2">
                {product.style && (
                  <p className="font-body text-sm text-muted-foreground">
                    <span className="text-foreground font-medium">Style :</span> {product.style}
                  </p>
                )}
                {product.color && (
                  <p className="font-body text-sm text-muted-foreground">
                    <span className="text-foreground font-medium">Color :</span> {product.color}
                  </p>
                )}
                {!product.style && !product.color && (
                  <p className="font-body text-sm leading-relaxed text-muted-foreground">
                    A beautifully crafted piece from FashionSpectrum's latest collection.
                  </p>
                )}
              </div>

              {/* Quantity */}
              <div className="mb-8">
                <span className="font-body text-xs tracking-[0.15em] uppercase text-foreground mb-3 block">
                  Quantity
                </span>
                <div className="inline-flex items-center border border-border">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-3 hover:bg-secondary transition-colors"
                    aria-label="Decrease"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="px-6 font-body text-sm">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-3 hover:bg-secondary transition-colors"
                    aria-label="Increase"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              {/* Add to Cart */}
              <div className="flex gap-3 mb-8">
                <button
                  onClick={handleAddToCart}
                  className="flex-1 bg-primary text-primary-foreground font-body text-xs tracking-[0.2em] uppercase py-4 hover:bg-charcoal transition-all duration-300 active:scale-[0.98]"
                >
                  Add to Cart
                </button>
                <button
                  onClick={() => toggleItem(product)}
                  className={`border p-4 transition-all duration-300 ${
                    wishlisted
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:border-primary hover:text-primary"
                  }`}
                  aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
                >
                  <Heart size={20} fill={wishlisted ? "currentColor" : "none"} />
                </button>
              </div>

              {/* Trust badges */}
              <div className="grid grid-cols-3 gap-3 sm:gap-4 pt-6 border-t border-border">
                {[
                  { icon: Truck, label: "Free Shipping", sub: "Over $300" },
                  { icon: RotateCcw, label: "Easy Returns", sub: "30 Days" },
                  { icon: Shield, label: "Secure Payment", sub: "Encrypted" },
                ].map(({ icon: Icon, label, sub }) => (
                  <div key={label} className="text-center">
                    <Icon size={18} className="mx-auto text-muted-foreground mb-1" />
                    <p className="font-body text-[9px] sm:text-[10px] tracking-wider uppercase text-foreground">{label}</p>
                    <p className="font-body text-[8px] sm:text-[9px] text-muted-foreground">{sub}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      {product && (
        <section className="px-4 sm:px-6 md:px-16 pb-16 md:pb-24 max-w-7xl mx-auto">
          <ProductReviews
            productId={product.id}
            averageRating={(product as any).averageRating}
            reviewCount={(product as any).reviewCount}
          />
        </section>
      )}

      {/* Related Products */}
      {related.length > 0 && (
        <section className="px-4 sm:px-6 md:px-16 pb-16 md:pb-24">
          <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-light text-foreground mb-8 md:mb-10">
            You May Also Like
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
            {related.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
};

export default ProductDetail;
