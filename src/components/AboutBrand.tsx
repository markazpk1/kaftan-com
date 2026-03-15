import { motion } from "framer-motion";
import aboutImgDefault from "@/assets/about-brand.jpg";
import { AboutContent } from "@/hooks/usePageContent";

interface Props {
  content?: AboutContent;
  image?: string;
}

const AboutBrand = ({ content, image }: Props) => {
  const aboutImg = image || aboutImgDefault;
  const title = content?.title || "About The Brand";
  const paragraph1 = content?.paragraph1 || "FashionSpectrum is the zenith of luxury resort wear, crafted for the modern woman who embraces elegance in every moment. Our collections blend cultural artistry with contemporary design, creating pieces that transcend seasons and boundaries.";
  const paragraph2 = content?.paragraph2 || "Each garment is meticulously designed with premium fabrics and intricate embellishments, ensuring that every piece tells a story of sophistication, comfort, and timeless beauty. From sun-drenched beaches to glamorous evening events, FashionSpectrum dresses you in confidence.";
  const ctaText = content?.ctaText || "Learn More";

  return (
    <section className="py-16 md:py-24 px-6 md:px-16">
      <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="overflow-hidden"
        >
          <img
            src={aboutImg}
            alt="About FashionSpectrum brand"
            className="w-full h-[500px] md:h-[600px] object-cover"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="space-y-6"
        >
          <h2 className="font-heading text-3xl md:text-5xl font-light text-foreground">
            {title}
          </h2>
          <p className="font-body text-sm leading-relaxed text-muted-foreground">
            {paragraph1}
          </p>
          <p className="font-body text-sm leading-relaxed text-muted-foreground">
            {paragraph2}
          </p>
          <a
            href="#"
            className="inline-block font-body text-xs tracking-[0.2em] uppercase border-b border-foreground pb-1 text-foreground hover:text-primary hover:border-primary transition-colors duration-300 mt-4"
          >
            {ctaText}
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default AboutBrand;
