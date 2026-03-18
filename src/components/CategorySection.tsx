import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { productService } from "@/lib/productService";
import { cloudinaryService } from "@/lib/cloudinaryService";
import type { Product as DBProduct } from "@/lib/productService";

interface Category {
  id: string;
  name: string;
  description: string;
  image: string;
  productCount: number;
  link: string;
}

const CategorySection = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const collectionData = [
    {
      id: "apple",
      name: "Apple Collection",
      description: "Fresh and vibrant designs inspired by nature's beauty",
      link: "/shop?collection=apple"
    },
    {
      id: "clinton",
      name: "Clinton Collection", 
      description: "Sophisticated elegance for the modern professional",
      link: "/shop?collection=clinton"
    },
    {
      id: "midrade",
      name: "Midrade Collection",
      description: "Contemporary designs with a touch of luxury",
      link: "/shop?collection=midrade"
    },
    {
      id: "mailane",
      name: "Mailane Collection",
      description: "Exquisite pieces for special occasions and celebrations",
      link: "/shop?collection=mailane"
    }
  ];

  useEffect(() => {
    loadCollectionData();
  }, []);

  const loadCollectionData = async () => {
    try {
      const allProducts = await productService.getProducts();
      console.log('All products from database:', allProducts);
      console.log('Sample product structure:', allProducts[0]);
      
      // Get products that have images and are in stock
      const availableProducts = allProducts.filter(product => 
        product.in_stock && 
        product.images && 
        product.images.length > 0
      );
      
      console.log('Available products with images:', availableProducts);
      
      const enrichedCategories = collectionData.map((collection, index) => {
        // Try to find products for this collection
        let collectionProducts = allProducts.filter(product => 
          product.collection?.toLowerCase() === collection.id.toLowerCase() ||
          product.category?.toLowerCase() === collection.id.toLowerCase()
        );
        
        // If no specific collection products found, use available products as examples
        if (collectionProducts.length === 0 && availableProducts.length > 0) {
          // Assign different products to each collection for demonstration
          let productIndex = (index * 2) % availableProducts.length; // Skip more to ensure variety
          collectionProducts = [availableProducts[productIndex]];
          console.log(`Using fallback product for ${collection.id}:`, availableProducts[productIndex]);
        }
        
        console.log(`Products for ${collection.id} collection:`, collectionProducts);
        
        // Get the first product's image as collection image
        let collectionImage = "/placeholder.svg";
        
        if (collectionProducts.length > 0 && collectionProducts[0].images?.[0]) {
          const rawImage = collectionProducts[0].images[0];
          console.log(`Raw image for ${collection.id}:`, rawImage);
          
          // Use the image URL directly from Supabase storage
          collectionImage = rawImage;
          
          console.log(`Processed image for ${collection.id}:`, collectionImage);
        }
        
        return {
          ...collection,
          image: collectionImage,
          productCount: collectionProducts.length
        };
      });
      
      console.log('Final enriched categories:', enrichedCategories);
      setCategories(enrichedCategories);
    } catch (error) {
      console.error('Error loading collection data:', error);
      // Fallback to basic categories without images
      setCategories(collectionData.map(c => ({
        ...c,
        image: "/placeholder.svg",
        productCount: 0
      })));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-16 md:py-24 px-6 md:px-16 bg-secondary/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl md:text-5xl font-light text-foreground mb-4">
              Shop by Collection
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[4/3] bg-secondary rounded-lg mb-4" />
                <div className="h-6 bg-secondary rounded w-3/4 mb-2" />
                <div className="h-4 bg-secondary rounded w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 md:py-24 px-6 md:px-16 bg-secondary/30">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-heading text-3xl md:text-5xl font-light text-foreground mb-4">
            Shop by Collection
          </h2>
          <p className="font-body text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover our curated collections designed for every style and occasion
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group cursor-pointer"
            >
              <Link to={category.link} className="block">
                <div className="relative overflow-hidden rounded-lg aspect-[3/4] bg-gray-100">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent z-10" />
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105"
                  />
                  
                  <div className="absolute inset-0 flex flex-col justify-end p-8 z-20">
                    <h3 className="font-heading text-2xl md:text-3xl font-light text-white mb-2">
                      {category.name}
                    </h3>
                    <p className="font-body text-white/90 mb-4">
                      {category.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="font-body text-sm text-white/80">
                        {category.productCount} Products
                      </span>
                      <div className="flex items-center gap-2 text-white font-body text-sm tracking-[0.1em] uppercase group-hover:gap-3 transition-all duration-300">
                        Shop Now
                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-12"
        >
          <Link
            to="/collections"
            className="inline-flex items-center gap-2 font-body text-sm tracking-[0.2em] uppercase text-foreground hover:text-primary transition-colors duration-300"
          >
            View All Collections
            <ArrowRight size={16} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default CategorySection;
