import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Minus, Plus, Truck, RotateCcw, Shield, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import { getProductBySlug, getRelatedProducts } from "@/lib/productUtils";
import { useProductBySlug } from "@/hooks/useProducts";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import AnnouncementBar from "@/components/AnnouncementBar";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import ImageZoom from "@/components/ImageZoom";

const ProductDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: dbProduct, isLoading } = useProductBySlug(slug || "");
  const staticProduct = getProductBySlug(slug || "");
  const product = dbProduct || staticProduct;

  const { addItem } = useCart();
  const { toggleItem, isInWishlist } = useWishlist();
  const [quantity, setQuantity] = useState(1);
  const [activeIdx, setActiveIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

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

  /* ── Build image list from DB (images[]) or static fallback ── */
  const dbImages: string[] = (product as any).images ?? [];
  const fallbackImage: string = (product as any).image ?? "";
  // Merge: use DB images if any, otherwise single fallback
  const allImages: string[] = dbImages.length > 0 ? dbImages : fallbackImage ? [fallbackImage] : [];
  const activeImage = allImages[activeIdx] ?? "";

  const prev = () => setActiveIdx(i => (i === 0 ? allImages.length - 1 : i - 1));
  const next = () => setActiveIdx(i => (i === allImages.length - 1 ? 0 : i + 1));

  const handleAddToCart = () => addItem(product, "One Size", quantity);

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

          {/* ── IMAGE GALLERY ── */}
          <div className="space-y-3">

            {/* Main image */}
            <div className="relative group">
              <motion.div
                key={activeImage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="aspect-[3/4] overflow-hidden bg-secondary relative"
              >
                {activeImage ? (
                  <ImageZoom
                    src={activeImage}
                    alt={`${product.name} — image ${activeIdx + 1}`}
                    className="w-full h-full"
                    zoomLevel={2}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    No image
                  </div>
                )}

                {/* Lightbox trigger */}
                <button
                  onClick={() => setLightboxOpen(true)}
                  className="absolute top-3 right-3 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
                  aria-label="Open fullscreen"
                >
                  <ZoomIn size={16} />
                </button>

                {/* Prev / Next arrows (only when multiple images) */}
                {allImages.length > 1 && (
                  <>
                    <button
                      onClick={prev}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white shadow-md p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
                      aria-label="Previous image"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      onClick={next}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white shadow-md p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
                      aria-label="Next image"
                    >
                      <ChevronRight size={18} />
                    </button>

                    {/* Dot indicator */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
                      {allImages.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setActiveIdx(i)}
                          className={`rounded-full transition-all duration-200 ${i === activeIdx ? "w-4 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/60 hover:bg-white/90"
                            }`}
                          aria-label={`Image ${i + 1}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </motion.div>
            </div>

            {/* Thumbnail strip (only if 2+ images) */}
            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {allImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveIdx(i)}
                    className={`flex-shrink-0 w-16 h-20 sm:w-20 sm:h-24 overflow-hidden border-2 transition-all duration-200 rounded-sm ${i === activeIdx
                        ? "border-primary scale-105 shadow-md"
                        : "border-transparent opacity-60 hover:opacity-90 hover:border-border"
                      }`}
                    aria-label={`Thumbnail ${i + 1}`}
                  >
                    <img
                      src={img}
                      alt={`${product.name} thumbnail ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Image count badge */}
            {allImages.length > 1 && (
              <p className="font-body text-[10px] text-muted-foreground text-right tracking-wider">
                {activeIdx + 1} / {allImages.length} photos
              </p>
            )}
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
                  <span className="font-heading text-xl sm:text-2xl text-foreground">
                    {product.price > 0 ? `$${product.price.toFixed(2)}` : 'Price on Request'}
                  </span>
                  {(product as any).originalPrice && product.price > 0 && (
                    <span className="font-body text-base sm:text-lg text-muted-foreground line-through">
                      ${(product as any).originalPrice.toFixed(2)}
                    </span>
                  )}
                </div>
              )}

              {/* Description */}
              <div className="mb-8 space-y-2">
                {(product as any).description && (
                  <p className="font-body text-sm leading-relaxed text-muted-foreground">
                    {(product as any).description}
                  </p>
                )}
                {(product as any).style && (
                  <p className="font-body text-sm text-muted-foreground">
                    <span className="text-foreground font-medium">Style :</span> {(product as any).style}
                  </p>
                )}
                {(product as any).color && (
                  <p className="font-body text-sm text-muted-foreground">
                    <span className="text-foreground font-medium">Color :</span> {(product as any).color}
                  </p>
                )}
                {!(product as any).description && !(product as any).style && !(product as any).color && (
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
              {product.price != null && product.price > 0 && (
                <div className="flex gap-3 mb-8">
                  <button
                    onClick={handleAddToCart}
                    className="flex-1 bg-primary text-primary-foreground font-body text-xs tracking-[0.2em] uppercase py-4 hover:bg-charcoal transition-all duration-300 active:scale-[0.98]"
                  >
                    Add to Cart
                  </button>
                  <button
                    onClick={() => toggleItem(product)}
                    className={`border p-4 transition-all duration-300 ${wishlisted
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:border-primary hover:text-primary"
                      }`}
                    aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
                  >
                    <Heart size={20} fill={wishlisted ? "currentColor" : "none"} />
                  </button>
                </div>
              )}

              {/* Show wishlist button alone when no price */}
              {(!product.price || product.price === 0) && (
                <div className="flex justify-center mb-8">
                  <button
                    onClick={() => toggleItem(product)}
                    className={`border p-4 transition-all duration-300 ${wishlisted
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:border-primary hover:text-primary"
                      }`}
                    aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
                  >
                    <Heart size={20} fill={wishlisted ? "currentColor" : "none"} />
                  </button>
                </div>
              )}

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

      {/* ── LIGHTBOX ── */}
      <AnimatePresence>
        {lightboxOpen && activeImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-sm"
            onClick={() => setLightboxOpen(false)}
          >
            {/* Close */}
            <button
              className="absolute top-4 right-4 text-white/80 hover:text-white text-3xl font-thin leading-none z-10"
              onClick={() => setLightboxOpen(false)}
              aria-label="Close"
            >
              ×
            </button>

            {/* Counter */}
            <span className="absolute top-5 left-1/2 -translate-x-1/2 font-body text-xs text-white/60 tracking-widest">
              {activeIdx + 1} / {allImages.length}
            </span>

            {/* Image */}
            <motion.img
              key={activeIdx}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.25 }}
              src={activeImage}
              alt={product.name}
              className="max-h-[90vh] max-w-[92vw] object-contain rounded shadow-2xl"
              onClick={e => e.stopPropagation()}
            />

            {/* Prev / Next */}
            {allImages.length > 1 && (
              <>
                <button
                  onClick={e => { e.stopPropagation(); prev(); }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-3 rounded-full transition-all"
                  aria-label="Previous"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={e => { e.stopPropagation(); next(); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-3 rounded-full transition-all"
                  aria-label="Next"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}

            {/* Thumbnail strip in lightbox */}
            {allImages.length > 1 && (
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 overflow-x-auto max-w-[90vw] pb-1">
                {allImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={e => { e.stopPropagation(); setActiveIdx(i); }}
                    className={`flex-shrink-0 w-12 h-14 rounded overflow-hidden border-2 transition-all ${i === activeIdx ? "border-white scale-110" : "border-white/30 opacity-50 hover:opacity-80"
                      }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

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
