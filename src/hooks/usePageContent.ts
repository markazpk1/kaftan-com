import { useState, useEffect } from "react";

// Import defaults
import heroKaftan1 from "@/assets/hero-kaftan-1.jpg";
import heroKaftan2 from "@/assets/hero-kaftan-2.jpg";
import heroKaftan3 from "@/assets/hero-kaftan-3.jpg";
import heroKaftan4 from "@/assets/hero-kaftan-4.jpg";
import heroKaftan5 from "@/assets/hero-kaftan-5.jpg";
import collectionBannerImg from "@/assets/collection-banner.jpg";
import aboutBrandImg from "@/assets/about-brand.jpg";

export interface HeroSlide {
  src: string;
  alt: string;
}

export interface HeroContent {
  titleLine1: string;
  titleLine2: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  autoSlide: boolean;
  slideInterval: number;
}

export interface AnnouncementContent {
  text: string;
  enabled: boolean;
}

export interface CollectionBannerContent {
  subtitle: string;
  title: string;
  ctaText: string;
  ctaLink: string;
}

export interface AboutContent {
  title: string;
  paragraph1: string;
  paragraph2: string;
  ctaText: string;
}

export interface FooterContent {
  newsletterTitle: string;
  newsletterSubtitle: string;
  ctaText: string;
  copyright: string;
}

export interface SectionMeta {
  id: string;
  label: string;
  enabled: boolean;
}

export const defaultHeroSlides: HeroSlide[] = [
  { src: heroKaftan1, alt: "Luxurious jewel-toned kaftan collection" },
  { src: heroKaftan2, alt: "Black and gold embroidered kaftan" },
  { src: heroKaftan3, alt: "Turquoise and gold ornate kaftan" },
  { src: heroKaftan4, alt: "White and gold bridal kaftan" },
  { src: heroKaftan5, alt: "Crimson embroidered kaftan" },
];

export const defaultHomeContent = {
  hero: {
    titleLine1: "Luxurious",
    titleLine2: "Kaftan Collection",
    subtitle: "Discover our latest collection of handcrafted kaftans, dresses & resort wear designed for the modern woman.",
    ctaText: "Shop Collection",
    ctaLink: "#new-arrivals",
    autoSlide: true,
    slideInterval: 4500,
  } as HeroContent,
  announcement: { text: "Free Shipping Over $300", enabled: true } as AnnouncementContent,
  collectionBanner: { subtitle: "Latest Collection", title: "Golden Lady", ctaText: "Explore Collection", ctaLink: "#" } as CollectionBannerContent,
  about: {
    title: "About The Brand",
    paragraph1: "FashionSpectrum is the zenith of luxury resort wear, crafted for the modern woman who embraces elegance in every moment. Our collections blend cultural artistry with contemporary design, creating pieces that transcend seasons and boundaries.",
    paragraph2: "Each garment is meticulously designed with premium fabrics and intricate embellishments, ensuring that every piece tells a story of sophistication, comfort, and timeless beauty. From sun-drenched beaches to glamorous evening events, FashionSpectrum dresses you in confidence.",
    ctaText: "Learn More",
  } as AboutContent,
  footer: {
    newsletterTitle: "Join the FashionSpectrum World",
    newsletterSubtitle: "Subscribe for exclusive access to new collections, special offers & more.",
    ctaText: "Subscribe",
    copyright: "© 2026 FashionSpectrum. All Rights Reserved.",
  } as FooterContent,
};

export const defaultSections: SectionMeta[] = [
  { id: "announcement", label: "Announcement Bar", enabled: true },
  { id: "hero", label: "Hero Section", enabled: true },
  { id: "newArrivals", label: "New Arrivals", enabled: true },
  { id: "collectionBanner", label: "Collection Banner", enabled: true },
  { id: "saleBanner", label: "Summer Sale", enabled: true },
  { id: "bestSellers", label: "Best Sellers", enabled: true },
  { id: "about", label: "About Brand", enabled: true },
  { id: "footer", label: "Footer", enabled: true },
];

export interface HomePageContent {
  hero: HeroContent;
  heroSlides: HeroSlide[];
  announcement: AnnouncementContent;
  collectionBanner: CollectionBannerContent;
  collectionImage: string;
  aboutImage: string;
  about: AboutContent;
  footer: FooterContent;
  sections: SectionMeta[];
}

export function useHomePageContent(): HomePageContent {
  const [content, setContent] = useState<HomePageContent>({
    hero: defaultHomeContent.hero,
    heroSlides: defaultHeroSlides,
    announcement: defaultHomeContent.announcement,
    collectionBanner: defaultHomeContent.collectionBanner,
    collectionImage: collectionBannerImg,
    aboutImage: aboutBrandImg,
    about: defaultHomeContent.about,
    footer: defaultHomeContent.footer,
    sections: defaultSections,
  });

  useEffect(() => {
    const saved = localStorage.getItem("page_content_home");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setContent(prev => ({
          hero: data.hero || prev.hero,
          heroSlides: data.heroSlides || prev.heroSlides,
          announcement: data.announcement || prev.announcement,
          collectionBanner: data.collectionBanner || prev.collectionBanner,
          collectionImage: data.collectionImage || prev.collectionImage,
          aboutImage: data.aboutImage || prev.aboutImage,
          about: data.about || prev.about,
          footer: data.footer || prev.footer,
          sections: data.sections || prev.sections,
        }));
      } catch (e) {
        console.error("Failed to parse page content", e);
      }
    }
  }, []);

  return content;
}

export function isSectionEnabled(sections: SectionMeta[], id: string): boolean {
  const section = sections.find(s => s.id === id);
  return section ? section.enabled : true;
}

export interface CatalogPageContent {
  title: string;
  subtitle: string;
  bannerImage: string;
  metaDescription: string;
  ogImage: string;
  announcementText: string;
  announcementEnabled: boolean;
  footerNewsletterTitle: string;
  footerNewsletterSubtitle: string;
  footerCtaText: string;
  footerCopyright: string;
}

export function useCatalogPageContent(pageKey: string): CatalogPageContent | null {
  const [content, setContent] = useState<CatalogPageContent | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(`page_content_${pageKey}`);
    if (saved) {
      try {
        setContent(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse catalog page content", e);
      }
    }
  }, [pageKey]);

  return content;
}
