import { useRef, useEffect, useState, useCallback } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Star } from "lucide-react";
import { HeroContent, HeroSlide } from "@/hooks/usePageContent";

// Default imports as fallback
import heroKaftan1 from "@/assets/hero-kaftan-1.jpg";
import heroKaftan2 from "@/assets/hero-kaftan-2.jpg";
import heroKaftan3 from "@/assets/hero-kaftan-3.jpg";

const defaultSlides: HeroSlide[] = [
  { src: heroKaftan1, alt: "Safari Collection - Premium Kaftans" },
  { src: heroKaftan2, alt: "Elegant Fashion Collection" },
  { src: heroKaftan3, alt: "Luxury Resort Wear" },
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
          className="absolute inset-0 w-full h-full object-cover object-center"
          style={{ y }}
        />
      ))}
      {/* Hero Content Overlay */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-transparent z-10"
        style={{ opacity }}
      />
      
      <motion.div 
        className="absolute inset-0 flex items-center justify-center z-20 px-6"
        style={{ opacity }}
      >
        <div className="text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-4"
          >
            <div className="flex items-center justify-center gap-1 mb-6">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={16} className="fill-yellow-400 text-yellow-400" />
              ))}
              <span className="ml-2 text-white/90 text-sm font-body">4.9/5 from 2,847 reviews</span>
            </div>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="font-heading text-4xl md:text-6xl lg:text-7xl font-light text-white mb-6 leading-tight"
          >
            <span className="block">{titleLine1}</span>
            <span className="block">{titleLine2}</span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="font-body text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed"
          >
            {subtitle}
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              to={ctaLink}
              className="group bg-white text-black px-8 py-4 font-body text-sm tracking-[0.2em] uppercase hover:bg-gray-100 transition-all duration-300 flex items-center gap-2"
            >
              {ctaText}
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/collections"
              className="border border-white text-white px-8 py-4 font-body text-sm tracking-[0.2em] uppercase hover:bg-white hover:text-black transition-all duration-300"
            >
              View Collections
            </Link>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-8 text-white/80 text-sm font-body"
          >
            <p>✓ Free Shipping on Orders Over $150</p>
            <p>✓ 30-Day Return Policy</p>
          </motion.div>
        </div>
      </motion.div>

      {/* Slide indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {activeSlides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              i === current ? "bg-white w-6" : "bg-white/40"
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroSection;
