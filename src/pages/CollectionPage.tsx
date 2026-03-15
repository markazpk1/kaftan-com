import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { useParams } from "react-router-dom";
import AnnouncementBar from "@/components/AnnouncementBar";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { SlidersHorizontal, ChevronDown, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: "published" | "draft" | "scheduled";
  featured: boolean;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  original_price?: number;
  images: string[];
  badge?: "New in" | "Sold out" | "Sale";
  category: string;
  style?: string;
  color?: string;
  status: string;
  stock: number;
  sku: string;
  in_stock: boolean;
  featured: boolean;
  description?: string;
  colors: string[];
  sizes: string[];
  created_at?: string;
  updated_at?: string;
}

const sortOptions = [
  { label: "Sort by popularity", value: "popular" },
  { label: "Sort by latest", value: "latest" },
  { label: "Price: low to high", value: "price-asc" },
  { label: "Price: high to low", value: "price-desc" },
];

const CollectionPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("popular");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch collection data
  useEffect(() => {
    const fetchCollection = async () => {
      if (!slug) return;
      
      try {
        setLoading(true);
        setError(null);

        // Fetch collection details
        const { data: collectionData, error: collectionError } = await (supabase as any)
          .from('collections')
          .select('*')
          .eq('slug', slug)
          .eq('status', 'published')
          .single();

        if (collectionError) throw collectionError;
        if (!collectionData) {
          setError('Collection not found');
          return;
        }

        setCollection(collectionData);

        // Fetch products in this collection
        const { data: productData, error: productError } = await (supabase as any)
          .from('collection_products')
          .select(`
            products!inner(
              id, name, slug, price, description, image, category, status, stock, sku
            )
          `)
          .eq('collection_id', collectionData.id)
          .eq('products.status', 'Active');

        if (productError) throw productError;
        
        const productsList = productData?.map((item: any) => item.products) || [];
        setProducts(productsList);

      } catch (err) {
        console.error('Error fetching collection:', err);
        setError('Failed to load collection');
      } finally {
        setLoading(false);
      }
    };

    fetchCollection();
  }, [slug]);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map((p) => p.category || 'Uncategorized')));
    return ["All", ...cats.sort()];
  }, [products]);

  const filtered = useMemo(() => {
    let items = selectedCategory === "All"
      ? [...products]
      : products.filter((p) => p.category === selectedCategory);

    switch (sortBy) {
      case "price-asc":
        items.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        items.sort((a, b) => b.price - a.price);
        break;
      case "latest":
        items.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
        break;
      default:
        break;
    }
    return items;
  }, [sortBy, selectedCategory, products]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-mobile-nav">
        <AnnouncementBar content={{ text: "Loading collection...", enabled: true }} />
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="font-heading text-xl text-muted-foreground">Loading collection...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div className="min-h-screen bg-background pb-mobile-nav">
        <AnnouncementBar content={{ text: "Collection not found", enabled: true }} />
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Package size={48} className="mx-auto text-muted-foreground/30 mb-4" />
            <p className="font-heading text-xl text-muted-foreground">Collection not found</p>
            <p className="font-body text-muted-foreground mt-2">
              The collection you're looking for doesn't exist or isn't available.
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-mobile-nav">
      <AnnouncementBar 
        content={{ 
          text: collection.featured ? `Featured: ${collection.name}` : collection.name, 
          enabled: true 
        }} 
      />
      <Navbar />

      {/* Header */}
      <div className="py-12 md:py-20 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-heading text-3xl md:text-5xl text-foreground"
        >
          {collection.name}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-body text-sm text-muted-foreground mt-3 tracking-wide max-w-2xl mx-auto"
        >
          {collection.description || `Discover our ${collection.name.toLowerCase()} with ${products.length} carefully selected pieces.`}
        </motion.p>
        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Package size={14} />
            {products.length} Products
          </div>
          {collection.start_date && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Available from {new Date(collection.start_date).toLocaleDateString()}</span>
              {collection.end_date && (
                <span>to {new Date(collection.end_date).toLocaleDateString()}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="container mx-auto px-4 sm:px-6 mb-8">
        <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 font-body text-sm tracking-wide text-foreground hover:text-primary transition-colors"
          >
            <SlidersHorizontal size={16} />
            Filters
          </button>

          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none bg-transparent font-body text-sm tracking-wide text-foreground pr-6 cursor-pointer focus:outline-none"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
          </div>
        </div>

        {/* Category Filters */}
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden py-4 flex flex-wrap gap-2"
          >
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full font-body text-xs tracking-wider border transition-colors ${
                  selectedCategory === cat
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-foreground hover:border-primary"
                }`}
              >
                {cat}
              </button>
            ))}
          </motion.div>
        )}
      </div>

      {/* Products Grid */}
      <div className="container mx-auto px-4 sm:px-6 pb-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {filtered.map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <ProductCard product={{
                ...product,
                image: product.images?.[0] || "/placeholder.svg"
              }} />
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <Package size={48} className="mx-auto text-muted-foreground/30 mb-4" />
            <p className="font-body text-muted-foreground">No products found in this collection.</p>
            <p className="font-body text-muted-foreground mt-2">
              Check back later or browse other collections.
            </p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default CollectionPage;
