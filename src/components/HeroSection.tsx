import { useRef, useEffect, useState, useCallback } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { HeroContent, HeroSlide } from "@/hooks/usePageContent";

// Default imports as fallback
import heroKaftan1 from "@/assets/hero-kaftan-1.jpg";
import heroKaftan2 from "@/assets/hero-kaftan-2.jpg";
import heroKaftan3 from "@/assets/hero-kaftan-3.jpg";
import heroKaftan4 from "@/assets/hero-kaftan-4.jpg";
import heroKaftan5 from "@/assets/hero-kaftan-5.jpg";

const defaultSlides: HeroSlide[] = [
  { src: heroKaftan1, alt: "Luxurious jewel-toned kaftan collection" },
  { src: heroKaftan2, alt: "Black and gold embroidered kaftan" },
  { src: heroKaftan3, alt: "Turquoise and gold ornate kaftan" },
  { src: heroKaftan4, alt: "White and gold bridal kaftan" },
  { src: heroKaftan5, alt: "Crimson embroidered kaftan" },
];

interface Props {
  content?: HeroContent;
  slides?: HeroSlide[];
}

const HeroSection = ({ content, slides }: Props) => {
  const activeSlides = slides && slides.length > 0 ? slides : defaultSlides;
  const titleLine1 = content?.titleLine1 || "Luxurious";
  const titleLine2 = content?.titleLine2 || "Kaftan Collection";
  const subtitle = content?.subtitle || "Discover our latest collection of handcrafted kaftans, dresses & resort wear designed for the modern woman.";
  const ctaText = content?.ctaText || "Shop Collection";
  const ctaLink = content?.ctaLink || "#new-arrivals";
  const slideInterval = content?.slideInterval || 4500;

  const sectionRef = useRef<HTMLElement>(null);
  const [current, setCurrent] = useState(0);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % activeSlides.length);
  }, [activeSlides.length]);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + activeSlides.length) % activeSlides.length);
  }, [activeSlides.length]);

  useEffect(() => {
    if (content?.autoSlide === false) return;
    const timer = setInterval(next, slideInterval);
    return () => clearInterval(timer);
  }, [next, slideInterval, content?.autoSlide]);

  return (
    <section
      ref={sectionRef}
      className="relative h-[60vh] md:h-[75vh] overflow-hidden touch-pan-y"
      onTouchStart={(e) => {
        const touch = e.touches[0];
        sectionRef.current?.setAttribute("data-touch-x", String(touch.clientX));
      }}
      onTouchEnd={(e) => {
        const startX = Number(sectionRef.current?.getAttribute("data-touch-x") || 0);
        const endX = e.changedTouches[0].clientX;
        const diff = startX - endX;
        if (Math.abs(diff) > 50) {
          diff > 0 ? next() : prev();
        }
      }}
    >
      {activeSlides.map((slide, i) => (
        <motion.img
          key={i}
          src={slide.src}
          alt={slide.alt}
          initial={false}
          animate={{ opacity: i === current ? 1 : 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="absolute inset-0 w-full h-full object-cover object-top"
          style={{ y }}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-r from-charcoal/40 via-transparent to-transparent" />

      <motion.div
        className="relative h-full flex items-end pb-16 md:pb-24 px-6 md:px-16"
        style={{ opacity }}
      >
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
          className="max-w-lg"
        >
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="font-heading text-4xl md:text-6xl lg:text-7xl font-light text-primary-foreground leading-tight mb-4"
          >
            {titleLine1}
            <br />
            <motion.span
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="font-semibold italic"
            >
              {titleLine2}
            </motion.span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="font-body text-sm md:text-base text-primary-foreground/80 tracking-wide mb-8 max-w-sm"
          >
            {subtitle}
          </motion.p>
          <motion.a
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.2 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            href={ctaLink}
            className="inline-block font-body text-xs tracking-[0.2em] uppercase bg-primary-foreground text-charcoal px-8 py-4 hover:bg-gold hover:text-primary-foreground transition-all duration-500"
          >
            {ctaText}
          </motion.a>
        </motion.div>
      </motion.div>

      {/* Slide indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {activeSlides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              i === current ? "bg-primary-foreground w-6" : "bg-primary-foreground/40"
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroSection;
