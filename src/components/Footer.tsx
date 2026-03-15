import { useState } from "react";
import { Instagram, Facebook, Twitter, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { FooterContent } from "@/hooks/usePageContent";

const footerSections = [
  {
    title: "Menu",
    items: ["Home", "Safari Collection", "Paradise Collection", "Where to Buy", "Contact Us", "Our Story"],
  },
  {
    title: "Know Us",
    items: ["About Us", "Contact", "Sizing Guide", "Boutique Locations"],
  },
  {
    title: "Policies",
    items: ["Privacy Policy", "Shipping", "Returns", "Terms & Conditions"],
  },
];

const CollapsibleSection = ({ title, children }: { title: string; children: React.ReactNode }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-primary-foreground/10 md:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full py-4 md:hidden"
      >
        <h4 className="font-body text-xs tracking-[0.2em] uppercase text-primary-foreground/80">
          {title}
        </h4>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={16} className="text-primary-foreground/50" />
        </motion.span>
      </button>
      <h4 className="hidden md:block font-body text-xs tracking-[0.2em] uppercase mb-4 text-primary-foreground/80">
        {title}
      </h4>
      <div className="hidden md:block">{children}</div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden md:hidden pb-4"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface Props {
  content?: FooterContent;
}

const Footer = ({ content }: Props) => {
  const newsletterTitle = content?.newsletterTitle || "Join the FashionSpectrum World";
  const newsletterSubtitle = content?.newsletterSubtitle || "Subscribe for exclusive access to new collections, special offers & more.";
  const ctaText = content?.ctaText || "Subscribe";
  const copyright = content?.copyright || "© 2026 FashionSpectrum. All Rights Reserved.";

  return (
    <footer className="bg-charcoal text-primary-foreground">
      {/* Newsletter */}
      <div className="border-b border-primary-foreground/10 py-12 px-6 md:px-16">
        <div className="max-w-md mx-auto text-center">
          <h3 className="font-heading text-2xl md:text-3xl mb-3">{newsletterTitle}</h3>
          <p className="font-body text-xs text-primary-foreground/60 tracking-wide mb-6">
            {newsletterSubtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-0">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 bg-transparent border border-primary-foreground/20 px-4 py-3 font-body text-xs tracking-wider text-primary-foreground placeholder:text-primary-foreground/40 focus:outline-none focus:border-gold"
            />
            <button className="bg-primary text-primary-foreground px-6 py-3 font-body text-xs tracking-[0.2em] uppercase hover:bg-gold transition-colors duration-300">
              {ctaText}
            </button>
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 md:gap-16 py-4 md:py-16 px-6 md:px-16 lg:px-24 max-w-5xl mx-auto">
        {footerSections.map((section) => (
          <CollapsibleSection key={section.title} title={section.title}>
            <ul className="space-y-3">
              {section.items.map((item) => (
                <li key={item}>
                  <a href="#" className="font-body text-sm text-primary-foreground/50 hover:text-gold transition-colors duration-300">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </CollapsibleSection>
        ))}
      </div>

      {/* Social Icons */}
      <div className="flex flex-col items-center gap-3 py-8 px-6">
        <h4 className="font-body text-xs tracking-[0.2em] uppercase text-primary-foreground/80">Follow Us</h4>
        <div className="flex gap-5">
          <a href="#" className="text-primary-foreground/50 hover:text-gold transition-colors duration-300" aria-label="Instagram">
            <Instagram size={20} />
          </a>
          <a href="#" className="text-primary-foreground/50 hover:text-gold transition-colors duration-300" aria-label="Facebook">
            <Facebook size={20} />
          </a>
          <a href="#" className="text-primary-foreground/50 hover:text-gold transition-colors duration-300" aria-label="Twitter">
            <Twitter size={20} />
          </a>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-primary-foreground/10 py-6 px-6 text-center">
        <p className="font-body text-[10px] text-primary-foreground/40 tracking-wider">
          {copyright}
        </p>
      </div>
    </footer>
  );
};

export default Footer;
