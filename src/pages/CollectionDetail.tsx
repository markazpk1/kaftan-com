import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AnnouncementBar from "@/components/AnnouncementBar";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

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
  description: string;
  images?: string[];
  category: string;
  in_stock: boolean;
}

const CollectionDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCollection = async () => {
      if (!slug) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch collection
        const { data: collectionData, error: collectionError } = await (supabase as any)
          .from('collections')
          .select('*')
          .eq('slug', slug)
          .eq('status', 'published')
          .single();

        if (collectionError) throw collectionError;

        setCollection(collectionData);

        // Fetch products in this collection
        const { data: productData, error: productError } = await (supabase as any)
          .from('collection_products')
          .select(`
            products!inner(
              id, name, slug, price, description, images, category, in_stock
            )
          `)
          .eq('collection_id', collectionData.id);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-mobile-nav">
        <AnnouncementBar />
        <Navbar />
        <div className="container mx-auto px-4 py-16">
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
        <AnnouncementBar />
        <Navbar />
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <p className="font-heading text-xl text-destructive">Collection not found</p>
            <Link to="/collections" className="text-primary hover:underline mt-4 inline-block">
              ← Back to Collections
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-mobile-nav">
      <AnnouncementBar />
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Link 
          to="/collections" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8"
        >
          <ArrowLeft size={16} />
          Back to Collections
        </Link>

        {/* Collection Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {collection.featured && (
              <span className="inline-block bg-primary text-primary-foreground text-xs font-body uppercase tracking-wider px-3 py-1 rounded-full mb-4">
                Featured Collection
              </span>
            )}
            <h1 className="font-heading text-4xl md:text-5xl font-semibold text-foreground mb-4">
              {collection.name}
            </h1>
            <p className="font-body text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
              {collection.description || 'Discover this beautiful collection.'}
            </p>
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground font-body">
              <span className="flex items-center gap-1">
                <Calendar size={14} />
                Created {new Date(collection.created_at).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1">
                <Package size={14} />
                {products.length} Products
              </span>
            </div>
          </motion.div>
        </div>

        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="text-center py-16">
            <p className="font-heading text-xl text-muted-foreground">No products in this collection yet</p>
            <p className="font-body text-muted-foreground mt-2">
              Check back soon for new additions.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group"
              >
                <Link to={`/product/${product.slug}`} className="block">
                  <div className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 group-hover:border-primary/50">
                    {/* Product Image */}
                    <div className="h-64 bg-secondary/50 flex items-center justify-center relative">
                      {product.images && product.images.length > 0 ? (
                        <img 
                          src={product.images[0]} 
                          alt={product.name} 
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="text-muted-foreground/30">
                          <Package size={48} />
                        </div>
                      )}
                    </div>

                    {/* Product Content */}
                    <div className="p-4">
                      <div className="mb-2">
                        <h3 className="font-heading text-lg font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                          {product.name}
                        </h3>
                        <p className="font-body text-sm text-muted-foreground line-clamp-2">
                          {product.description}
                        </p>
                      </div>

                      {/* Product Price */}
                      <div className="flex items-center justify-between">
                        <span className="font-heading text-lg font-semibold text-primary">
                          ${product.price.toFixed(2)}
                        </span>
                        <span className="text-primary font-medium text-sm uppercase tracking-wider">
                          View Details →
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default CollectionDetail;
