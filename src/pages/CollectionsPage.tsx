import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Layers, Calendar, Package } from "lucide-react";
import { useCollections } from "@/hooks/useCollections";
import AnnouncementBar from "@/components/AnnouncementBar";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Collections = () => {
  const { collections, loading, error } = useCollections();

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-mobile-nav">
        <AnnouncementBar />
        <Navbar />
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="font-heading text-xl text-muted-foreground">Loading collections...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background pb-mobile-nav">
        <AnnouncementBar />
        <Navbar />
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <p className="font-heading text-xl text-destructive">Error loading collections</p>
            <p className="font-body text-muted-foreground mt-2">{error}</p>
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
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-heading text-4xl md:text-5xl font-semibold text-foreground mb-4">
            Collections
          </h1>
          <p className="font-body text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover our curated collections, each telling a unique story through carefully selected pieces.
          </p>
        </div>

        {/* Collections Grid */}
        {collections.length === 0 ? (
          <div className="text-center py-16">
            <Layers size={48} className="mx-auto text-muted-foreground/30 mb-4" />
            <p className="font-heading text-xl text-muted-foreground">No collections available</p>
            <p className="font-body text-muted-foreground mt-2">
              Check back soon for new collections.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {collections.map((collection, index) => (
              <motion.div
                key={collection.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group"
              >
                <Link to={`/collection/${collection.slug}`} className="block">
                  <div className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 group-hover:border-primary/50">
                    {/* Collection Header */}
                    <div className="h-48 bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center relative">
                      <Layers size={48} className="text-muted-foreground/30" />
                      {collection.featured && (
                        <span className="absolute top-4 left-4 bg-primary text-primary-foreground text-xs font-body uppercase tracking-wider px-3 py-1 rounded-full">
                          Featured
                        </span>
                      )}
                    </div>

                    {/* Collection Content */}
                    <div className="p-6">
                      <div className="mb-4">
                        <h3 className="font-heading text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                          {collection.name}
                        </h3>
                        <p className="font-body text-sm text-muted-foreground line-clamp-3">
                          {collection.description || 'Discover this beautiful collection.'}
                        </p>
                      </div>

                      {/* Collection Meta */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground font-body">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            {new Date(collection.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <span className="text-primary font-medium uppercase tracking-wider">
                          View Collection →
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

export default Collections;
