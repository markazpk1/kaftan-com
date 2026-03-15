import { useState, useEffect } from "react";
import AnnouncementBar from "@/components/AnnouncementBar";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ProductSection from "@/components/ProductSection";
import CollectionBanner from "@/components/CollectionBanner";
import AboutBrand from "@/components/AboutBrand";
import Footer from "@/components/Footer";
import { productService } from "@/lib/productService";
import { useHomePageContent, isSectionEnabled } from "@/hooks/usePageContent";
import type { Product as DBProduct } from "@/lib/productService";
import type { Product } from "@/lib/products";

const Index = () => {
  const content = useHomePageContent();
  const [products, setProducts] = useState<DBProduct[]>([]);
  const [loading, setLoading] = useState(true);
  
  const isEnabled = (id: string) => isSectionEnabled(content.sections, id);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await productService.getProducts();
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
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
    badge: p.original_price ? "Sale" : p.in_stock ? undefined : "Sold out",
    category: p.category || "",
    style: undefined,
    color: p.colors?.[0],
  });

  // Get featured products
  const featuredProducts = products.filter(p => p.featured && p.in_stock).map(convertToProduct);
  
  // Get sale products
  const saleProducts = products.filter(p => p.original_price && p.in_stock).map(convertToProduct);
  
  // Get new arrivals (latest products, limit to 8)
  const newArrivals = products
    .filter(p => p.in_stock)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 8)
    .map(convertToProduct);

  return (
    <div className="min-h-screen bg-background pb-mobile-nav">
      {isEnabled("announcement") && (
        <AnnouncementBar content={content.announcement} />
      )}
      <Navbar />
      {isEnabled("hero") && (
        <HeroSection content={content.hero} slides={content.heroSlides} />
      )}

      {isEnabled("newArrivals") && (
        <ProductSection
          id="new-arrivals"
          title="New Arrivals"
          products={newArrivals}
          viewAllLink="/new-arrivals"
        />
      )}

      {isEnabled("collectionBanner") && (
        <CollectionBanner content={content.collectionBanner} image={content.collectionImage} />
      )}

      {isEnabled("saleBanner") && (
        <ProductSection
          id="sale"
          title="Summer Sale"
          products={saleProducts}
          viewAllLink="/sale"
        />
      )}

      {isEnabled("about") && (
        <AboutBrand content={content.about} image={content.aboutImage} />
      )}
      {isEnabled("footer") && (
        <Footer content={content.footer} />
      )}
    </div>
  );
};

export default Index;
