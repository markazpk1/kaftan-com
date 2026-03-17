import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Filter, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import AnnouncementBar from "@/components/AnnouncementBar";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";

interface ClearanceProduct {
  id: string;
  name: string;
  price: number;
  original_price?: number;
  image: string;
  category: string;
  color?: string;
  in_stock: boolean;
  discount_percentage?: number;
  sku?: string;
}

const BuyClearance = () => {
  const [products, setProducts] = useState<ClearanceProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sortBy, setSortBy] = useState("discount-desc");
  const [categories, setCategories] = useState<string[]>(["All"]);

  useEffect(() => {
    fetchClearanceProducts();
  }, []);

  const fetchClearanceProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('in_stock', true)
        .not('original_price', 'is', null)
        .gt('original_price', 0)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching clearance products:', error);
        toast({
          title: "Error",
          description: "Failed to load clearance products",
          variant: "destructive"
        });
      } else {
        const clearanceProducts = data?.map(product => ({
          id: product.id,
          name: product.name,
          price: product.price,
          original_price: product.original_price,
          image: product.images?.[0] || '',
          category: product.category,
          color: product.colors?.[0] || '',
          in_stock: product.in_stock || false,
          discount_percentage: product.original_price && product.price > 0 
            ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
            : 0,
          sku: product.sku || ''
        })).filter(product => product.original_price && product.price > 0 && product.price < product.original_price) || [];
        
        // Sort client-side based on sortBy
        const sortedProducts = [...clearanceProducts].sort((a, b) => {
          switch (sortBy) {
            case "discount-desc":
              return (b.discount_percentage || 0) - (a.discount_percentage || 0);
            case "price-asc":
              return a.price - b.price;
            case "price-desc":
              return b.price - a.price;
            default:
              return 0;
          }
        });
        
        setProducts(sortedProducts);
        
        // Extract unique categories
        const uniqueCategories = Array.from(new Set(clearanceProducts.map(p => p.category)));
        setCategories(["All", ...uniqueCategories]);
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to load clearance products",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "All" || product.category === category;
    return matchesSearch && matchesCategory;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "discount-desc":
        return (b.discount_percentage || 0) - (a.discount_percentage || 0);
      case "price-asc":
        return a.price - b.price;
      case "price-desc":
        return b.price - a.price;
      case "name-asc":
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-mobile-nav">
        <AnnouncementBar />
        <Navbar />
        <div className="container mx-auto px-4 py-16">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="font-body text-sm text-muted-foreground tracking-widest uppercase animate-pulse">Loading clearance deals...</p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-mobile-nav">
      <AnnouncementBar content={{ text: "🔥 Hot Clearance Deals - Limited Time Offers!", enabled: true }} />
      <Navbar />

      {/* Header */}
      <div className="py-12 md:py-20 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-heading text-3xl md:text-5xl text-foreground"
        >
          Buy Clearance
        </motion.h1>
        <p className="font-body text-sm text-muted-foreground mt-3 tracking-wide">
          {filteredProducts.length} Clearance Items Available
        </p>
      </div>

      {/* Filters */}
      <div className="container mx-auto px-4 sm:px-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Search clearance items..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="discount-desc">Biggest Discount</SelectItem>
              <SelectItem value="price-asc">Price: Low to High</SelectItem>
              <SelectItem value="price-desc">Price: High to Low</SelectItem>
              <SelectItem value="name-asc">Name: A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Products Grid */}
      <div className="container mx-auto px-4 sm:px-6 pb-16">
        {sortedProducts.length === 0 ? (
          <div className="text-center py-20">
            <Filter className="mx-auto text-muted-foreground mb-4 h-12 w-12" />
            <p className="font-body text-muted-foreground">
              {search || category !== "All" 
                ? "No clearance items found matching your filters."
                : "No clearance items available at the moment."}
            </p>
            <Button 
              onClick={() => {
                setSearch("");
                setCategory("All");
              }}
              variant="outline"
              className="mt-4"
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {sortedProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link to={`/product/${product.name.toLowerCase().replace(/\s+/g, '-')}`}>
                  <div className="relative overflow-hidden bg-white aspect-[3/4]">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-contain"
                      loading="lazy"
                    />
                    
                    {/* Discount Badge */}
                    {product.discount_percentage && product.discount_percentage > 0 && (
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-red-500 text-white font-bold text-xs">
                          -{product.discount_percentage}%
                        </Badge>
                      </div>
                    )}

                    {/* Original Price Badge */}
                    {product.original_price && product.original_price > product.price && (
                      <div className="absolute top-3 right-3">
                        <Badge className="bg-gray-100 text-gray-700 text-xs">
                          Was ${product.original_price.toFixed(2)}
                        </Badge>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-primary-foreground/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  </div>
                </Link>

                <div className="pt-4 space-y-1">
                  <h3 className="font-body text-xs tracking-[0.1em] uppercase text-foreground group-hover:text-primary transition-colors duration-300">
                    {product.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="font-body text-lg font-bold text-red-600">
                      ${product.price.toFixed(2)}
                    </span>
                    {product.original_price && product.original_price > product.price && (
                      <span className="font-body text-sm text-muted-foreground line-through">
                        ${product.original_price.toFixed(2)}
                      </span>
                    )}
                    {product.discount_percentage && product.discount_percentage > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        Save {product.discount_percentage}%
                      </Badge>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default BuyClearance;
