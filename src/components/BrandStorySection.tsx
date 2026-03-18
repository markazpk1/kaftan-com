import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Heart, Globe, Users, Award, ArrowRight } from "lucide-react";

// Import actual images
import aboutBrandImage from "@/assets/about-brand.jpg";
import paradiseImage from "@/assets/paradise/paradise-2.jpg";

const BrandStorySection = () => {
  const values = [
    {
      icon: Heart,
      title: "Handcrafted with Love",
      description: "Each piece is carefully crafted by skilled artisans who pour their heart into every stitch."
    },
    {
      icon: Globe,
      title: "Sustainable Fashion",
      description: "We prioritize eco-friendly materials and ethical production practices for a better future."
    },
    {
      icon: Users,
      title: "Empowering Communities",
      description: "Supporting local artisans and their families through fair trade practices."
    },
    {
      icon: Award,
      title: "Quality Guarantee",
      description: "Premium materials and meticulous attention to detail ensure lasting beauty."
    }
  ];

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
            Our Story
          </h2>
          <p className="font-body text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Born from a passion for timeless elegance and cultural heritage, our brand brings together the artistry of traditional kaftan design with contemporary fashion sensibilities. Each piece tells a story of craftsmanship, sustainability, and empowerment.
          </p>
        </motion.div>

        {/* Story content with image */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <div>
              <h3 className="font-heading text-2xl font-light text-foreground mb-4">
                Heritage Meets Modernity
              </h3>
              <p className="font-body text-muted-foreground leading-relaxed mb-4">
                Our journey began with a simple vision: to create beautiful, comfortable kaftans that honor traditional craftsmanship while embracing modern design aesthetics. We work directly with artisans who have inherited their skills through generations, ensuring that every piece carries the essence of cultural heritage.
              </p>
              <p className="font-body text-muted-foreground leading-relaxed">
                From the bustling markets of Marrakech to the serene beaches of the Maldives, our designs are inspired by diverse cultures and landscapes, bringing you versatile pieces that transition seamlessly from day to night, casual to elegant.
              </p>
            </div>
            
            <Link
              to="/our-story"
              className="inline-flex items-center gap-2 font-body text-sm tracking-[0.2em] uppercase text-foreground hover:text-primary transition-colors duration-300 border-b border-foreground hover:border-primary pb-1"
            >
              Learn Our Story
              <ArrowRight size={16} />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="aspect-[4/5] bg-gradient-to-br from-primary/20 to-secondary/40 rounded-lg overflow-hidden">
              <img
                src={aboutBrandImage}
                alt="Artisan crafting kaftan"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            </div>
            
            {/* Floating stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="absolute -bottom-6 -left-6 bg-primary text-primary-foreground p-6 rounded-lg shadow-lg"
            >
              <div className="text-center">
                <div className="font-heading text-3xl font-light mb-1">10+</div>
                <div className="font-body text-sm">Years of Excellence</div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Values grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <h3 className="font-heading text-2xl font-light text-foreground text-center mb-12">
            Our Values
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
                className="text-center group"
              >
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors duration-300">
                  <value.icon size={24} className="text-primary" />
                </div>
                <h4 className="font-heading text-lg font-light text-foreground mb-3">
                  {value.title}
                </h4>
                <p className="font-body text-sm text-muted-foreground leading-relaxed">
                  {value.description}
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
          className="mt-16 text-center"
        >
          <div className="bg-gradient-to-r from-primary/5 to-secondary/10 rounded-lg p-8 border border-border">
            <h3 className="font-heading text-xl font-light text-foreground mb-4">
              Join Our Community
            </h3>
            <p className="font-body text-muted-foreground mb-6 max-w-2xl mx-auto">
              Be part of a movement that celebrates craftsmanship, sustainability, and timeless elegance. Follow our journey and get exclusive insights into our design process.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/contact-us"
                className="bg-primary text-primary-foreground px-6 py-3 font-body text-sm tracking-[0.2em] uppercase hover:bg-primary/90 transition-colors duration-300"
              >
                Get in Touch
              </Link>
              <Link
                to="/collections"
                className="border border-border px-6 py-3 font-body text-sm tracking-[0.2em] uppercase hover:border-primary hover:text-primary transition-all duration-300"
              >
                Explore Collections
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default BrandStorySection;
