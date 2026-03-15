import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { SlidersHorizontal, X } from "lucide-react";
import { Link } from "react-router-dom";
import type { Product } from "@/lib/products";
import ProductCard from "./ProductCard";
import AnnouncementBar from "./AnnouncementBar";
import Navbar from "./Navbar";
import Footer from "./Footer";
import type { CatalogPageContent } from "@/hooks/usePageContent";

interface CatalogPageProps {
  title: string;
  subtitle?: string;
  products: Product[];
  bannerImage?: string;
  cmsContent?: CatalogPageContent | null;
}

type SortOption = "featured" | "price-low" | "price-high" | "name-az" | "name-za";

const CatalogPage = ({ title, subtitle, products, bannerImage, cmsContent }: CatalogPageProps) => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [sortBy, setSortBy] = useState<SortOption>("featured");
  const [showFilters, setShowFilters] = useState(false);

  // Use CMS content if available, otherwise fall back to props
  const displayTitle = cmsContent?.title || title;
  const displaySubtitle = cmsContent?.subtitle || subtitle;
  const displayBanner = cmsContent?.bannerImage || bannerImage;

  const announcementContent = cmsContent ? {
    text: cmsContent.announcementText,
    enabled: cmsContent.announcementEnabled,
  } : undefined;

  const footerContent = cmsContent ? {
    newsletterTitle: cmsContent.footerNewsletterTitle,
    newsletterSubtitle: cmsContent.footerNewsletterSubtitle,
    ctaText: cmsContent.footerCtaText,
    copyright: cmsContent.footerCopyright,
  } : undefined;

  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map((p) => p.category)));
    return ["All", ...cats.sort()];
  }, [products]);

  const filtered = useMemo(() => {
    let result = activeCategory === "All" ? products : products.filter((p) => p.category === activeCategory);
    switch (sortBy) {
      case "price-low": return [...result].sort((a, b) => a.price - b.price);
      case "price-high": return [...result].sort((a, b) => b.price - a.price);
      case "name-az": return [...result].sort((a, b) => a.name.localeCompare(b.name));
      case "name-za": return [...result].sort((a, b) => b.name.localeCompare(a.name));
      default: return result;
    }
  }, [products, activeCategory, sortBy]);

  return (
    <div className="min-h-screen bg-background pb-mobile-nav">
      <AnnouncementBar content={announcementContent} />
      <Navbar />

      {/* Banner */}
      {displayBanner ? (
        <div className="relative h-[25vh] sm:h-[30vh] md:h-[40vh] overflow-hidden">
          <img src={displayBanner} alt={displayTitle} className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-charcoal/40" />
          <div className="relative h-full flex items-center justify-center text-center px-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <h1 className="font-heading text-4xl md:text-6xl text-primary-foreground font-light">{displayTitle}</h1>
              {displaySubtitle && <p className="font-body text-sm text-primary-foreground/70 mt-3 tracking-wide">{displaySubtitle}</p>}
            </motion.div>
          </div>
        </div>
      ) : (
        <div className="py-12 md:py-16 px-6 md:px-16 text-center border-b border-border">
          <motion.h1 initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="font-heading text-4xl md:text-6xl text-foreground font-light">
            {displayTitle}
          </motion.h1>
          {displaySubtitle && <p className="font-body text-sm text-muted-foreground mt-3 tracking-wide">{displaySubtitle}</p>}
        </div>
      )}

      {/* Breadcrumb */}
      <div className="px-6 md:px-16 py-4 border-b border-border">
        <div className="flex items-center gap-2 font-body text-[10px] tracking-[0.15em] uppercase text-muted-foreground">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span>/</span>
          <span className="text-foreground">{displayTitle}</span>
        </div>
      </div>

      <div className="px-4 sm:px-6 md:px-16 py-8 md:py-12">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden flex items-center gap-2 border border-border px-4 py-2 font-body text-xs tracking-wider uppercase hover:border-primary transition-colors"
            >
              <SlidersHorizontal size={14} />
              Filters
            </button>
            <p className="font-body text-xs text-muted-foreground tracking-wide">
              {filtered.length} product{filtered.length !== 1 ? "s" : ""}
            </p>
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="bg-transparent border border-border px-4 py-2 font-body text-xs tracking-wider uppercase text-foreground focus:outline-none focus:border-primary cursor-pointer"
          >
            <option value="featured">Featured</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="name-az">Name: A–Z</option>
            <option value="name-za">Name: Z–A</option>
          </select>
        </div>

        <div className="flex gap-8">
          {/* Sidebar filters */}
          <aside className={`${showFilters ? "block" : "hidden"} md:block w-full md:w-48 flex-shrink-0`}>
            <div className="flex items-center justify-between mb-4 md:hidden">
              <h3 className="font-body text-xs tracking-[0.2em] uppercase">Filters</h3>
              <button onClick={() => setShowFilters(false)}><X size={18} /></button>
            </div>
            <h3 className="font-body text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-3">Category</h3>
            <div className="space-y-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`block w-full text-left font-body text-xs tracking-wider py-1.5 transition-colors ${
                    activeCategory === cat ? "text-primary font-medium" : "text-foreground hover:text-primary"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </aside>

          {/* Product Grid */}
          <div className="flex-1">
            {filtered.length === 0 ? (
              <div className="text-center py-20">
                <p className="font-heading text-2xl text-foreground mb-2">No products found</p>
                <p className="font-body text-xs text-muted-foreground">Try a different category or filter.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {filtered.map((product, i) => (
                  <ProductCard key={product.id} product={product} index={i} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer content={footerContent} />
    </div>
  );
};

export default CatalogPage;
