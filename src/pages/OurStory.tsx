import { motion } from "framer-motion";
import AnnouncementBar from "@/components/AnnouncementBar";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import aboutBrandImg from "@/assets/about-brand.jpg";
import heroKaftan1 from "@/assets/hero-kaftan-1.jpg";
import heroKaftan3 from "@/assets/hero-kaftan-3.jpg";

const OurStory = () => {
  return (
    <div className="min-h-screen bg-background pb-mobile-nav">
      <AnnouncementBar />
      <Navbar />

      {/* Hero Banner */}
      <section className="relative h-[40vh] md:h-[50vh] overflow-hidden">
        <img
          src={aboutBrandImg}
          alt="Fashion Spectrum Our Story"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <p className="font-body text-sm tracking-[0.3em] uppercase text-white/80 mb-3">
              Established 2001
            </p>
            <h1 className="font-heading text-4xl md:text-6xl font-light text-white">
              Our Story
            </h1>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 md:py-24 px-6 md:px-16 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="space-y-8 text-center"
        >
          <h2 className="font-heading text-3xl md:text-4xl font-light text-foreground">
            The Art of Luxury Kaftans
          </h2>
          <p className="font-body text-base leading-relaxed text-muted-foreground max-w-3xl mx-auto">
            We are a wholesaler who specializes in kaftans made in floaty silk fabrics. Most of the prints are unique and exclusive to Fashion Spectrum.
          </p>
          <p className="font-body text-base leading-relaxed text-muted-foreground max-w-3xl mx-auto">
            All the kaftans, dresses, tops, camis, ponchos, capes and pants in our latest collection, the Paradiso Collection, are made out of 100% silk fabric exquisitely embellished with colourful sequins, beads and/or embroidered patterns. The fact that they are hand beaded and sequinned enhances the beauty and appeal of the garment and its wearer.
          </p>
        </motion.div>
      </section>

      {/* Two Image Feature */}
      <section className="px-6 md:px-16 pb-16 md:pb-24">
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <img
              src={heroKaftan1}
              alt="Handcrafted silk kaftan"
              className="w-full h-[400px] md:h-[500px] object-cover"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.15 }}
          >
            <img
              src={heroKaftan3}
              alt="Embellished luxury resort wear"
              className="w-full h-[400px] md:h-[500px] object-cover"
            />
          </motion.div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 md:py-24 px-6 md:px-16 bg-muted/30">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-3xl mx-auto text-center space-y-6"
        >
          <h2 className="font-heading text-3xl md:text-4xl font-light text-foreground">
            Over Two Decades of Excellence
          </h2>
          <p className="font-body text-base leading-relaxed text-muted-foreground">
            Welcome to Fashion Spectrum, your go-to destination for all things kaftans in Australia! With over two decades of experience, we offer an extensive range of kaftan dresses, tops and plus size kaftans, made from luxurious silk fabrics.
          </p>
          <p className="font-body text-base leading-relaxed text-muted-foreground">
            Our silk kaftans are handcrafted in Australia and are perfect for the beach or a night out. Every piece reflects our commitment to quality craftsmanship, unique design, and timeless elegance.
          </p>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
};

export default OurStory;
