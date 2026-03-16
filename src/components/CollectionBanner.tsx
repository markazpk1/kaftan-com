import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import collectionBannerDefault from "@/assets/collection-banner.jpg";
import { CollectionBannerContent } from "@/hooks/usePageContent";

interface Props {
  content?: CollectionBannerContent;
  image?: string;
}

const CollectionBanner = ({ content, image }: Props) => {
  const bannerImage = image || collectionBannerDefault;
  const subtitle = content?.subtitle || "Latest Collection";
  const title = content?.title || "Golden Lady";
  const ctaText = content?.ctaText || "Explore Collection";
  const ctaLink = content?.ctaLink || "#";

  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1.1, 1, 1.1]);

  return (
    <section ref={sectionRef} id="collections" className="relative h-[50vh] md:h-[70vh] overflow-hidden">
      <motion.img
        src={bannerImage}
        alt="FashionSpectrum golden collection"
        className="absolute inset-0 w-full h-full object-contain object-center bg-black"
        style={{ y, scale }}
      />
      <div className="absolute inset-0 bg-charcoal/30" />
      
      <div className="relative h-full flex items-center justify-center text-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          <motion.p
            initial={{ opacity: 0, letterSpacing: "0.1em" }}
            whileInView={{ opacity: 1, letterSpacing: "0.3em" }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, delay: 0.2 }}
            className="font-body text-xs uppercase text-primary-foreground/80 mb-4"
          >
            {subtitle}
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="font-heading text-4xl md:text-6xl lg:text-7xl font-light text-primary-foreground mb-6 italic"
          >
            {title}
          </motion.h2>
          <motion.a
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.7 }}
            whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,1)", color: "#1f1a17" }}
            href={ctaLink}
            className="inline-block font-body text-xs tracking-[0.2em] uppercase border border-primary-foreground text-primary-foreground px-8 py-3 transition-all duration-500"
          >
            {ctaText}
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
};

export default CollectionBanner;
