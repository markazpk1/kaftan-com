import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Instagram, Heart, MessageCircle, ExternalLink } from "lucide-react";

// Import actual images for Instagram posts
import paradise1 from "@/assets/paradise/paradise-3.jpg";
import paradise2 from "@/assets/paradise/paradise-4.jpg";
import safari1 from "@/assets/safari/safari-2.png";
import safari2 from "@/assets/safari/safari-3.png";
import paradise3 from "@/assets/paradise/paradise-5.jpg";
import safari3 from "@/assets/safari/safari-4.png";

const SocialProofSection = () => {
  // Mock Instagram posts - in a real app, this would come from Instagram API
  const instagramPosts = [
    {
      id: "1",
      image: safari1,
      likes: 342,
      comments: 28,
      caption: "Stunning Safari Collection kaftan perfect for your next adventure 🌿"
    },
    {
      id: "2", 
      image: paradise1,
      likes: 567,
      comments: 45,
      caption: "Paradise Collection brings tropical elegance to your wardrobe 🌺"
    },
    {
      id: "3",
      image: safari2, 
      likes: 289,
      comments: 19,
      caption: "Handcrafted with love, designed for you 💫"
    },
    {
      id: "4",
      image: paradise2,
      likes: 445,
      comments: 32,
      caption: "Effortless elegance meets comfort ✨"
    },
    {
      id: "5",
      image: paradise3,
      likes: 623,
      comments: 51,
      caption: "Resort wear that makes you feel extraordinary 🏝️"
    },
    {
      id: "6",
      image: safari3,
      likes: 378,
      comments: 24,
      caption: "Timeless designs for the modern woman 🌸"
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
          <div className="flex items-center justify-center gap-2 mb-4">
            <Instagram className="w-5 h-5 text-primary" />
            <span className="font-body text-sm tracking-[0.2em] uppercase text-primary">@kaftancom</span>
            <Instagram className="w-5 h-5 text-primary" />
          </div>
          <h2 className="font-heading text-3xl md:text-5xl font-light text-foreground mb-4">
            Follow Our Journey
          </h2>
          <p className="font-body text-lg text-muted-foreground max-w-2xl mx-auto">
            Join our community of fashion lovers and get inspired by how our customers style their kaftans around the world
          </p>
        </motion.div>

        {/* Instagram grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12">
          {instagramPosts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group relative aspect-square overflow-hidden rounded-lg cursor-pointer"
            >
              <img
                src={post.image}
                alt={post.caption}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              
              {/* Overlay with engagement metrics */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <p className="font-body text-xs mb-2 line-clamp-2">{post.caption}</p>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <Heart size={12} fill="currentColor" />
                      <span>{post.likes}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle size={12} />
                      <span>{post.comments}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* User-generated content highlight */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-gradient-to-r from-primary/5 to-secondary/10 rounded-lg p-8 border border-border mb-12"
        >
          <div className="text-center mb-8">
            <h3 className="font-heading text-2xl font-light text-foreground mb-4">
              Share Your Style
            </h3>
            <p className="font-body text-muted-foreground max-w-2xl mx-auto">
              Love your kaftan? Share your look with #KaftanCom and tag us for a chance to be featured on our page!
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[
              { handle: "@sarah_travels", location: "Bali, Indonesia", caption: "Perfect for my sunset dinner 🌅" },
              { handle: "@maria_style", location: "Santorini, Greece", caption: "Feeling elegant in Paradise Collection 💙" },
              { handle: "@emma_adventures", location: "Dubai, UAE", caption: "Safari Collection kaftan goals! 🐪" }
            ].map((user, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
                className="text-center"
              >
                <div className="aspect-square rounded-full overflow-hidden mb-4 mx-auto w-24 h-24">
                  <img
                    src={paradise1}
                    alt={user.handle}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="font-body text-sm font-medium text-foreground mb-1">
                  {user.handle}
                </p>
                <p className="font-body text-xs text-muted-foreground mb-2">
                  {user.location}
                </p>
                <p className="font-body text-xs text-muted-foreground italic">
                  "{user.caption}"
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Call to action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center"
        >
          <Link
            to="https://instagram.com/kaftancom"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 font-body text-sm tracking-[0.2em] uppercase hover:from-purple-700 hover:to-pink-700 transition-all duration-300"
          >
            <Instagram size={18} />
            Follow on Instagram
            <ExternalLink size={16} />
          </Link>
          
          <div className="mt-6 flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>25K+ Followers</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart size={14} className="text-red-500 fill-red-500" />
              <span>500K+ Likes</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageCircle size={14} />
              <span>50K+ Comments</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default SocialProofSection;
