import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Heart, MessageCircle, ExternalLink } from "lucide-react";

// Import actual images for library collection
import library1 from "@/assets/library/library-1.jpg";
import library2 from "@/assets/library/library-2.jpg";
import library3 from "@/assets/library/library-3.jpg";
import library4 from "@/assets/library/library-4.jpg";
import library5 from "@/assets/library/library-5.jpg";
import library6 from "@/assets/library/library-6.jpg";

const SocialProofSection = () => {
  // Library collection items - showcasing design inspiration and styling
  const libraryItems = [
    {
      id: "1",
      image: library5,
      likes: 623,
      comments: 51,
      caption: "Sophisticated design for the discerning woman"
    },
    {
      id: "2", 
      image: library2,
      likes: 567,
      comments: 45,
      caption: "Luxurious fabric and intricate detailing in our signature style"
    },
    {
      id: "3",
      image: library4, 
      likes: 445,
      comments: 32,
      caption: "Exquisite craftsmanship meets modern elegance"
    },
    {
      id: "4",
      image: library6,
      likes: 489,
      comments: 37,
      caption: "Luxurious elegance with intricate handcrafted details"
    },
    {
      id: "5",
      image: library1,
      likes: 342,
      comments: 28,
      caption: "Elegant kaftan design showcasing timeless craftsmanship"
    },
    {
      id: "6",
      image: library3,
      likes: 289,
      comments: 19,
      caption: "Perfect blend of tradition and contemporary fashion"
    }
  ];

  return (
    <section className="py-16 md:py-24 px-6 md:px-16">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="font-heading text-3xl md:text-5xl font-light text-foreground mb-4">
            Library
          </h2>
          <p className="font-body text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore our collection of fashion insights, styling tips, and design inspiration for timeless kaftan elegance
          </p>
        </motion.div>

        {/* Library grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12">
          {libraryItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group relative aspect-[3/4] overflow-hidden rounded-lg cursor-pointer"
            >
              <img
                src={item.image}
                alt={item.caption}
                className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-110"
              />
              
                          </motion.div>
          ))}
        </div>

        
        {/* Call to action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center"
        >
                  </motion.div>
      </div>
    </section>
  );
};

export default SocialProofSection;
