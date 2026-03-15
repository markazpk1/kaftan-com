import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Eye, GripVertical, Image as ImageIcon, Type, FileText, Layout, Mail, Globe, Upload, X, Plus, Replace, RotateCcw } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

// Import default hero images
import heroKaftan1 from "@/assets/hero-kaftan-1.jpg";
import heroKaftan2 from "@/assets/hero-kaftan-2.jpg";
import heroKaftan3 from "@/assets/hero-kaftan-3.jpg";
import heroKaftan4 from "@/assets/hero-kaftan-4.jpg";
import heroKaftan5 from "@/assets/hero-kaftan-5.jpg";
import collectionBannerImg from "@/assets/collection-banner.jpg";
import aboutBrandImg from "@/assets/about-brand.jpg";

// ---- Interfaces ----
interface HeroSlide {
  src: string;
  alt: string;
}

interface HeroContent {
  titleLine1: string;
  titleLine2: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  autoSlide: boolean;
  slideInterval: number;
}

interface AnnouncementContent {
  text: string;
  enabled: boolean;
}

interface CollectionBannerContent {
  subtitle: string;
  title: string;
  ctaText: string;
  ctaLink: string;
}

interface AboutContent {
  title: string;
  paragraph1: string;
  paragraph2: string;
  ctaText: string;
}

interface FooterContent {
  newsletterTitle: string;
  newsletterSubtitle: string;
  ctaText: string;
  copyright: string;
}

interface SectionMeta {
  id: string;
  label: string;
  icon: React.ReactNode;
  enabled: boolean;
}

// ---- Defaults ----
const defaultHeroSlides: HeroSlide[] = [
  { src: heroKaftan1, alt: "Luxurious jewel-toned kaftan collection" },
  { src: heroKaftan2, alt: "Black and gold embroidered kaftan" },
  { src: heroKaftan3, alt: "Turquoise and gold ornate kaftan" },
  { src: heroKaftan4, alt: "White and gold bridal kaftan" },
  { src: heroKaftan5, alt: "Crimson embroidered kaftan" },
];

const defaultHomeContent = {
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

const defaultSections: SectionMeta[] = [
  { id: "announcement", label: "Announcement Bar", icon: <Globe size={16} />, enabled: true },
  { id: "hero", label: "Hero Section", icon: <ImageIcon size={16} />, enabled: true },
  { id: "newArrivals", label: "New Arrivals", icon: <Layout size={16} />, enabled: true },
  { id: "collectionBanner", label: "Collection Banner", icon: <ImageIcon size={16} />, enabled: true },
  { id: "saleBanner", label: "Summer Sale", icon: <Layout size={16} />, enabled: true },
  { id: "bestSellers", label: "Best Sellers", icon: <Layout size={16} />, enabled: true },
  { id: "about", label: "About Brand", icon: <FileText size={16} />, enabled: true },
  { id: "footer", label: "Footer", icon: <Mail size={16} />, enabled: true },
];

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

const catalogPageDefaults: Record<string, CatalogPageContent> = {
  shop: {
    title: "Shop All",
    subtitle: "Explore our complete collection of luxury resort wear",
    bannerImage: "",
    metaDescription: "Browse our full collection",
    ogImage: "",
    announcementText: "Free Shipping Over $300",
    announcementEnabled: true,
    footerNewsletterTitle: "Join the FashionSpectrum World",
    footerNewsletterSubtitle: "Subscribe for exclusive access to new collections, special offers & more.",
    footerCtaText: "Subscribe",
    footerCopyright: "© 2026 FashionSpectrum. All Rights Reserved.",
  },
  collections: {
    title: "Collections",
    subtitle: "Curated collections for every occasion",
    bannerImage: "",
    metaDescription: "Browse curated collections",
    ogImage: "",
    announcementText: "Free Shipping Over $300",
    announcementEnabled: true,
    footerNewsletterTitle: "Join the FashionSpectrum World",
    footerNewsletterSubtitle: "Subscribe for exclusive access to new collections, special offers & more.",
    footerCtaText: "Subscribe",
    footerCopyright: "© 2026 FashionSpectrum. All Rights Reserved.",
  },
  "new-arrivals": {
    title: "New Arrivals",
    subtitle: "The latest additions to our collection",
    bannerImage: "",
    metaDescription: "See our latest pieces",
    ogImage: "",
    announcementText: "Free Shipping Over $300",
    announcementEnabled: true,
    footerNewsletterTitle: "Join the FashionSpectrum World",
    footerNewsletterSubtitle: "Subscribe for exclusive access to new collections, special offers & more.",
    footerCtaText: "Subscribe",
    footerCopyright: "© 2026 FashionSpectrum. All Rights Reserved.",
  },
  sale: {
    title: "Summer Sale",
    subtitle: "Limited time offers on select styles",
    bannerImage: "",
    metaDescription: "Shop sale items",
    ogImage: "",
    announcementText: "Free Shipping Over $300",
    announcementEnabled: true,
    footerNewsletterTitle: "Join the FashionSpectrum World",
    footerNewsletterSubtitle: "Subscribe for exclusive access to new collections, special offers & more.",
    footerCtaText: "Subscribe",
    footerCopyright: "© 2026 FashionSpectrum. All Rights Reserved.",
  },
  "best-sellers": {
    title: "Best Sellers",
    subtitle: "Our most loved pieces",
    bannerImage: "",
    metaDescription: "Shop our most popular",
    ogImage: "",
    announcementText: "Free Shipping Over $300",
    announcementEnabled: true,
    footerNewsletterTitle: "Join the FashionSpectrum World",
    footerNewsletterSubtitle: "Subscribe for exclusive access to new collections, special offers & more.",
    footerCtaText: "Subscribe",
    footerCopyright: "© 2026 FashionSpectrum. All Rights Reserved.",
  },
  about: {
    title: "About Us",
    subtitle: "",
    bannerImage: "",
    metaDescription: "Learn about FashionSpectrum",
    ogImage: "",
    announcementText: "Free Shipping Over $300",
    announcementEnabled: true,
    footerNewsletterTitle: "Join the FashionSpectrum World",
    footerNewsletterSubtitle: "Subscribe for exclusive access to new collections, special offers & more.",
    footerCtaText: "Subscribe",
    footerCopyright: "© 2026 FashionSpectrum. All Rights Reserved.",
  },
  contact: {
    title: "Contact Us",
    subtitle: "",
    bannerImage: "",
    metaDescription: "Get in touch",
    ogImage: "",
    announcementText: "Free Shipping Over $300",
    announcementEnabled: true,
    footerNewsletterTitle: "Join the FashionSpectrum World",
    footerNewsletterSubtitle: "Subscribe for exclusive access to new collections, special offers & more.",
    footerCtaText: "Subscribe",
    footerCopyright: "© 2026 FashionSpectrum. All Rights Reserved.",
  },
};

// ---- Image Uploader Component ----
const ImageUploader = ({ src, alt, onUpload, onRemove, onAltChange, className = "" }: {
  src: string;
  alt: string;
  onUpload: (dataUrl: string) => void;
  onRemove?: () => void;
  onAltChange?: (alt: string) => void;
  className?: string;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be under 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) onUpload(e.target.result as string);
    };
    reader.readAsDataURL(file);
  }, [onUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div className={`relative group ${className}`}>
      <div
        className="relative overflow-hidden rounded-lg border border-border bg-secondary/30 cursor-pointer"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <img src={src} alt={alt} className="w-full h-40 object-cover" />
        <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/40 transition-all duration-200 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
            <div className="bg-background/90 rounded-full p-2">
              <Replace size={16} className="text-foreground" />
            </div>
            <span className="font-body text-xs text-background font-medium bg-foreground/70 px-2 py-1 rounded">Replace</span>
          </div>
        </div>
      </div>
      {onRemove && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
        >
          <X size={12} />
        </button>
      )}
      {onAltChange && (
        <Input
          value={alt}
          onChange={(e) => onAltChange(e.target.value)}
          placeholder="Alt text..."
          className="mt-2 text-xs h-8"
        />
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
      />
    </div>
  );
};

// Add new slide placeholder
const AddSlideButton = ({ onAdd }: { onAdd: (dataUrl: string) => void }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div>
      <button
        onClick={() => inputRef.current?.click()}
        className="w-full h-40 rounded-lg border-2 border-dashed border-border hover:border-primary/50 bg-secondary/20 hover:bg-secondary/40 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer"
      >
        <Plus size={24} className="text-muted-foreground" />
        <span className="font-body text-xs text-muted-foreground">Add Slide</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          if (file.size > 5 * 1024 * 1024) { alert("Image must be under 5MB"); return; }
          const reader = new FileReader();
          reader.onload = (ev) => { if (ev.target?.result) onAdd(ev.target.result as string); };
          reader.readAsDataURL(file);
          e.target.value = "";
        }}
      />
    </div>
  );
};

// Single image upload card (for collection banner / about)
const SingleImageUploader = ({ src, label, onUpload }: { src: string; label: string; onUpload: (dataUrl: string) => void }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-2">
      <Label className="font-body text-sm">{label}</Label>
      <div
        className="relative group overflow-hidden rounded-lg border border-border cursor-pointer"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files[0];
          if (!file || !file.type.startsWith("image/")) return;
          if (file.size > 5 * 1024 * 1024) { alert("Image must be under 5MB"); return; }
          const reader = new FileReader();
          reader.onload = (ev) => { if (ev.target?.result) onUpload(ev.target.result as string); };
          reader.readAsDataURL(file);
        }}
      >
        <img src={src} alt={label} className="w-full h-48 object-cover" />
        <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/40 transition-all flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
            <div className="bg-background/90 rounded-full p-2.5">
              <Upload size={18} className="text-foreground" />
            </div>
            <span className="font-body text-sm text-background font-medium bg-foreground/70 px-3 py-1.5 rounded">Upload New Image</span>
          </div>
        </div>
      </div>
      <p className="font-body text-xs text-muted-foreground">Click or drag & drop to replace. Max 5MB.</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          if (file.size > 5 * 1024 * 1024) { alert("Image must be under 5MB"); return; }
          const reader = new FileReader();
          reader.onload = (ev) => { if (ev.target?.result) onUpload(ev.target.result as string); };
          reader.readAsDataURL(file);
          e.target.value = "";
        }}
      />
    </div>
  );
};

// ---- Main Component ----
const AdminPageEditor = () => {
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const isHome = pageId === "home" || pageId === "1";
  const pageKey = isHome ? "home" : (pageId || "");

  const [hero, setHero] = useState<HeroContent>(defaultHomeContent.hero);
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>(defaultHeroSlides);
  const [announcement, setAnnouncement] = useState<AnnouncementContent>(defaultHomeContent.announcement);
  const [collectionBanner, setCollectionBanner] = useState<CollectionBannerContent>(defaultHomeContent.collectionBanner);
  const [collectionImage, setCollectionImage] = useState<string>(collectionBannerImg);
  const [aboutImage, setAboutImage] = useState<string>(aboutBrandImg);
  const [about, setAbout] = useState<AboutContent>(defaultHomeContent.about);
  const [footer, setFooter] = useState<FooterContent>(defaultHomeContent.footer);
  const [sections, setSections] = useState<SectionMeta[]>(defaultSections);
  const [hasChanges, setHasChanges] = useState(false);

  const [catalogPage, setCatalogPage] = useState<CatalogPageContent>(
    catalogPageDefaults[pageKey] || { title: "", subtitle: "", bannerImage: "", metaDescription: "", ogImage: "", announcementText: "Free Shipping Over $300", announcementEnabled: true, footerNewsletterTitle: "Join the FashionSpectrum World", footerNewsletterSubtitle: "Subscribe for exclusive access to new collections, special offers & more.", footerCtaText: "Subscribe", footerCopyright: "© 2026 FashionSpectrum. All Rights Reserved." }
  );

  useEffect(() => {
    const saved = localStorage.getItem(`page_content_${pageKey}`);
    if (saved) {
      const data = JSON.parse(saved);
      if (isHome) {
        if (data.hero) setHero(data.hero);
        if (data.heroSlides) setHeroSlides(data.heroSlides);
        if (data.announcement) setAnnouncement(data.announcement);
        if (data.collectionBanner) setCollectionBanner(data.collectionBanner);
        if (data.collectionImage) setCollectionImage(data.collectionImage);
        if (data.aboutImage) setAboutImage(data.aboutImage);
        if (data.about) setAbout(data.about);
        if (data.footer) setFooter(data.footer);
        if (data.sections) setSections(data.sections);
      } else {
        setCatalogPage(prev => ({ ...prev, ...data }));
      }
    }
  }, [pageKey, isHome]);

  const markChanged = () => setHasChanges(true);

  const handleSave = () => {
    if (isHome) {
      localStorage.setItem(`page_content_${pageKey}`, JSON.stringify({
        hero, heroSlides, announcement, collectionBanner, collectionImage, aboutImage, about, footer, sections,
      }));
    } else {
      localStorage.setItem(`page_content_${pageKey}`, JSON.stringify(catalogPage));
    }
    setHasChanges(false);
    toast({ title: "Page saved successfully" });
  };

  const toggleSection = (id: string) => {
    setSections(s => s.map(sec => sec.id === id ? { ...sec, enabled: !sec.enabled } : sec));
    markChanged();
  };

  const handleReset = () => {
    if (isHome) {
      setHero(defaultHomeContent.hero);
      setHeroSlides(defaultHeroSlides);
      setAnnouncement(defaultHomeContent.announcement);
      setCollectionBanner(defaultHomeContent.collectionBanner);
      setCollectionImage(collectionBannerImg);
      setAboutImage(aboutBrandImg);
      setAbout(defaultHomeContent.about);
      setFooter(defaultHomeContent.footer);
      setSections(defaultSections);
    } else {
      setCatalogPage(catalogPageDefaults[pageKey] || { title: "", subtitle: "", bannerImage: "", metaDescription: "", ogImage: "", announcementText: "Free Shipping Over $300", announcementEnabled: true, footerNewsletterTitle: "Join the FashionSpectrum World", footerNewsletterSubtitle: "Subscribe for exclusive access to new collections, special offers & more.", footerCtaText: "Subscribe", footerCopyright: "© 2026 FashionSpectrum. All Rights Reserved." });
    }
    localStorage.removeItem(`page_content_${pageKey}`);
    setHasChanges(false);
    toast({ title: "Page reset to defaults" });
  };

  const pageName = isHome ? "Home" : (catalogPageDefaults[pageKey]?.title || pageKey);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/pages")}>
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="font-heading text-2xl md:text-3xl font-semibold text-foreground">Edit: {pageName}</h1>
            <p className="font-body text-sm text-muted-foreground">Customize the content of your {pageName.toLowerCase()} page</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 text-destructive hover:text-destructive">
                <RotateCcw size={14} /> Reset
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset to defaults?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will restore all content on the {pageName} page to its original defaults. Any customizations will be lost.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleReset} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Reset
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button variant="outline" size="sm" asChild>
            <a href={isHome ? "/" : `/${pageKey}`} target="_blank" rel="noopener noreferrer" className="gap-2">
              <Eye size={14} /> Preview
            </a>
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!hasChanges} className="gap-2">
            <Save size={14} /> Save Changes
          </Button>
        </div>
      </div>

      {isHome ? (
        <HomePageEditor
          hero={hero} setHero={(v) => { setHero(v); markChanged(); }}
          heroSlides={heroSlides}
          onSlideReplace={(i, src) => { const s = [...heroSlides]; s[i] = { ...s[i], src }; setHeroSlides(s); markChanged(); }}
          onSlideAltChange={(i, alt) => { const s = [...heroSlides]; s[i] = { ...s[i], alt }; setHeroSlides(s); markChanged(); }}
          onSlideRemove={(i) => { setHeroSlides(heroSlides.filter((_, idx) => idx !== i)); markChanged(); }}
          onSlideAdd={(src) => { setHeroSlides([...heroSlides, { src, alt: `Slide ${heroSlides.length + 1}` }]); markChanged(); }}
          announcement={announcement} setAnnouncement={(v) => { setAnnouncement(v); markChanged(); }}
          collectionBanner={collectionBanner} setCollectionBanner={(v) => { setCollectionBanner(v); markChanged(); }}
          collectionImage={collectionImage} onCollectionImageChange={(src) => { setCollectionImage(src); markChanged(); }}
          aboutImage={aboutImage} onAboutImageChange={(src) => { setAboutImage(src); markChanged(); }}
          about={about} setAbout={(v) => { setAbout(v); markChanged(); }}
          footer={footer} setFooter={(v) => { setFooter(v); markChanged(); }}
          sections={sections} toggleSection={toggleSection}
        />
      ) : (
        <CatalogPageEditor page={catalogPage} setPage={(v) => { setCatalogPage(v); markChanged(); }} pageKey={pageKey} />
      )}
    </div>
  );
};

// ---- Home Page Editor ----
interface HomeEditorProps {
  hero: HeroContent; setHero: (v: HeroContent) => void;
  heroSlides: HeroSlide[];
  onSlideReplace: (index: number, src: string) => void;
  onSlideAltChange: (index: number, alt: string) => void;
  onSlideRemove: (index: number) => void;
  onSlideAdd: (src: string) => void;
  announcement: AnnouncementContent; setAnnouncement: (v: AnnouncementContent) => void;
  collectionBanner: CollectionBannerContent; setCollectionBanner: (v: CollectionBannerContent) => void;
  collectionImage: string; onCollectionImageChange: (src: string) => void;
  aboutImage: string; onAboutImageChange: (src: string) => void;
  about: AboutContent; setAbout: (v: AboutContent) => void;
  footer: FooterContent; setFooter: (v: FooterContent) => void;
  sections: SectionMeta[]; toggleSection: (id: string) => void;
}

const HomePageEditor = ({
  hero, setHero, heroSlides, onSlideReplace, onSlideAltChange, onSlideRemove, onSlideAdd,
  announcement, setAnnouncement,
  collectionBanner, setCollectionBanner, collectionImage, onCollectionImageChange,
  aboutImage, onAboutImageChange,
  about, setAbout, footer, setFooter, sections, toggleSection,
}: HomeEditorProps) => (
  <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
    {/* Sidebar */}
    <div className="bg-card border border-border rounded-xl p-4 h-fit">
      <h3 className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-4">Page Sections</h3>
      <div className="space-y-1">
        {sections.map(sec => (
          <div key={sec.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-secondary/50 transition-colors group">
            <div className="flex items-center gap-3">
              <GripVertical size={14} className="text-muted-foreground/40 group-hover:text-muted-foreground cursor-grab" />
              <span className="text-muted-foreground">{sec.icon}</span>
              <span className="font-body text-sm text-foreground">{sec.label}</span>
            </div>
            <Switch checked={sec.enabled} onCheckedChange={() => toggleSection(sec.id)} />
          </div>
        ))}
      </div>
    </div>

    {/* Main Editor */}
    <div className="space-y-6">
      <Tabs defaultValue="hero" className="w-full">
        <TabsList className="w-full justify-start bg-card border border-border h-auto p-1 flex-wrap">
          <TabsTrigger value="announcement" className="font-body text-xs">Announcement</TabsTrigger>
          <TabsTrigger value="hero" className="font-body text-xs">Hero</TabsTrigger>
          <TabsTrigger value="collection" className="font-body text-xs">Collection Banner</TabsTrigger>
          <TabsTrigger value="about" className="font-body text-xs">About</TabsTrigger>
          <TabsTrigger value="footer" className="font-body text-xs">Footer</TabsTrigger>
          <TabsTrigger value="seo" className="font-body text-xs">SEO</TabsTrigger>
        </TabsList>

        {/* Announcement */}
        <TabsContent value="announcement">
          <EditorCard title="Announcement Bar" description="The scrolling bar at the top of the page">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="font-body text-sm">Enabled</Label>
                <Switch checked={announcement.enabled} onCheckedChange={v => setAnnouncement({ ...announcement, enabled: v })} />
              </div>
              <div className="space-y-2">
                <Label className="font-body text-sm">Announcement Text</Label>
                <Input value={announcement.text} onChange={e => setAnnouncement({ ...announcement, text: e.target.value })} placeholder="e.g. Free Shipping Over $300" />
              </div>
              <PreviewBox>
                <div className="bg-primary py-2 px-4 text-center">
                  <span className="text-xs font-body tracking-[0.2em] uppercase text-primary-foreground">{announcement.text}</span>
                </div>
              </PreviewBox>
            </div>
          </EditorCard>
        </TabsContent>

        {/* Hero */}
        <TabsContent value="hero">
          <div className="space-y-6">
            {/* Hero Slides Manager */}
            <EditorCard title="Hero Slides" description="Manage the slideshow images. Click to replace, drag & drop supported.">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {heroSlides.map((slide, i) => (
                  <ImageUploader
                    key={i}
                    src={slide.src}
                    alt={slide.alt}
                    onUpload={(src) => onSlideReplace(i, src)}
                    onRemove={heroSlides.length > 1 ? () => onSlideRemove(i) : undefined}
                    onAltChange={(alt) => onSlideAltChange(i, alt)}
                  />
                ))}
                {heroSlides.length < 10 && (
                  <AddSlideButton onAdd={onSlideAdd} />
                )}
              </div>
              <p className="font-body text-xs text-muted-foreground">{heroSlides.length} slide{heroSlides.length !== 1 ? "s" : ""} · Max 10 slides · Max 5MB per image</p>
            </EditorCard>

            {/* Hero Text */}
            <EditorCard title="Hero Text & CTA" description="Overlay text on the hero banner">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-body text-sm">Title Line 1</Label>
                  <Input value={hero.titleLine1} onChange={e => setHero({ ...hero, titleLine1: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label className="font-body text-sm">Title Line 2 (italic)</Label>
                  <Input value={hero.titleLine2} onChange={e => setHero({ ...hero, titleLine2: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-body text-sm">Subtitle</Label>
                <Textarea value={hero.subtitle} onChange={e => setHero({ ...hero, subtitle: e.target.value })} rows={3} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-body text-sm">CTA Button Text</Label>
                  <Input value={hero.ctaText} onChange={e => setHero({ ...hero, ctaText: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label className="font-body text-sm">CTA Link</Label>
                  <Input value={hero.ctaLink} onChange={e => setHero({ ...hero, ctaLink: e.target.value })} />
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label className="font-body text-sm">Auto-slide</Label>
                  <Switch checked={hero.autoSlide} onCheckedChange={v => setHero({ ...hero, autoSlide: v })} />
                </div>
                <div className="space-y-2">
                  <Label className="font-body text-sm">Slide Interval (ms)</Label>
                  <Input type="number" value={hero.slideInterval} onChange={e => setHero({ ...hero, slideInterval: Number(e.target.value) })} />
                </div>
              </div>
              <PreviewBox>
                <div className="relative rounded-lg overflow-hidden">
                  <img src={heroSlides[0]?.src} alt="" className="w-full h-48 object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-r from-charcoal/50 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    <p className="font-heading text-xl font-light text-primary-foreground leading-tight">
                      {hero.titleLine1}<br />
                      <span className="font-semibold italic">{hero.titleLine2}</span>
                    </p>
                    <p className="font-body text-[10px] text-primary-foreground/70 mt-1 max-w-[200px]">{hero.subtitle}</p>
                    <span className="inline-block mt-2 bg-primary-foreground text-charcoal px-3 py-1.5 font-body text-[9px] tracking-[0.15em] uppercase">{hero.ctaText}</span>
                  </div>
                </div>
              </PreviewBox>
            </EditorCard>
          </div>
        </TabsContent>

        {/* Collection Banner */}
        <TabsContent value="collection">
          <EditorCard title="Collection Banner" description="Full-width parallax banner section">
            <SingleImageUploader src={collectionImage} label="Banner Image" onUpload={onCollectionImageChange} />
            <Separator />
            <div className="space-y-2">
              <Label className="font-body text-sm">Subtitle</Label>
              <Input value={collectionBanner.subtitle} onChange={e => setCollectionBanner({ ...collectionBanner, subtitle: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label className="font-body text-sm">Title</Label>
              <Input value={collectionBanner.title} onChange={e => setCollectionBanner({ ...collectionBanner, title: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-body text-sm">CTA Text</Label>
                <Input value={collectionBanner.ctaText} onChange={e => setCollectionBanner({ ...collectionBanner, ctaText: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label className="font-body text-sm">CTA Link</Label>
                <Input value={collectionBanner.ctaLink} onChange={e => setCollectionBanner({ ...collectionBanner, ctaLink: e.target.value })} />
              </div>
            </div>
            <PreviewBox>
              <div className="relative rounded-lg overflow-hidden">
                <img src={collectionImage} alt="" className="w-full h-48 object-cover" />
                <div className="absolute inset-0 bg-charcoal/40 flex items-center justify-center text-center">
                  <div>
                    <p className="font-body text-[10px] uppercase tracking-[0.3em] text-primary-foreground/70 mb-1">{collectionBanner.subtitle}</p>
                    <p className="font-heading text-2xl font-light text-primary-foreground italic">{collectionBanner.title}</p>
                    <span className="inline-block mt-2 border border-primary-foreground/50 text-primary-foreground px-4 py-1 font-body text-[10px] tracking-[0.15em] uppercase">{collectionBanner.ctaText}</span>
                  </div>
                </div>
              </div>
            </PreviewBox>
          </EditorCard>
        </TabsContent>

        {/* About */}
        <TabsContent value="about">
          <EditorCard title="About Brand" description="Brand story section with image and text">
            <SingleImageUploader src={aboutImage} label="About Section Image" onUpload={onAboutImageChange} />
            <Separator />
            <div className="space-y-2">
              <Label className="font-body text-sm">Section Title</Label>
              <Input value={about.title} onChange={e => setAbout({ ...about, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label className="font-body text-sm">Paragraph 1</Label>
              <Textarea value={about.paragraph1} onChange={e => setAbout({ ...about, paragraph1: e.target.value })} rows={4} />
            </div>
            <div className="space-y-2">
              <Label className="font-body text-sm">Paragraph 2</Label>
              <Textarea value={about.paragraph2} onChange={e => setAbout({ ...about, paragraph2: e.target.value })} rows={4} />
            </div>
            <div className="space-y-2">
              <Label className="font-body text-sm">CTA Text</Label>
              <Input value={about.ctaText} onChange={e => setAbout({ ...about, ctaText: e.target.value })} />
            </div>
          </EditorCard>
        </TabsContent>

        {/* Footer */}
        <TabsContent value="footer">
          <EditorCard title="Footer" description="Newsletter and footer content">
            <div className="space-y-2">
              <Label className="font-body text-sm">Newsletter Title</Label>
              <Input value={footer.newsletterTitle} onChange={e => setFooter({ ...footer, newsletterTitle: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label className="font-body text-sm">Newsletter Subtitle</Label>
              <Textarea value={footer.newsletterSubtitle} onChange={e => setFooter({ ...footer, newsletterSubtitle: e.target.value })} rows={2} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-body text-sm">Button Text</Label>
                <Input value={footer.ctaText} onChange={e => setFooter({ ...footer, ctaText: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label className="font-body text-sm">Copyright</Label>
                <Input value={footer.copyright} onChange={e => setFooter({ ...footer, copyright: e.target.value })} />
              </div>
            </div>
          </EditorCard>
        </TabsContent>

        {/* SEO */}
        <TabsContent value="seo">
          <EditorCard title="SEO Settings" description="Search engine optimization for this page">
            <div className="space-y-2">
              <Label className="font-body text-sm">Page Title</Label>
              <Input defaultValue="FashionSpectrum — Luxury Kaftan & Resort Wear" placeholder="Page title for search engines" />
              <p className="font-body text-xs text-muted-foreground">Recommended: 50-60 characters</p>
            </div>
            <div className="space-y-2">
              <Label className="font-body text-sm">Meta Description</Label>
              <Textarea defaultValue="Discover handcrafted luxury kaftans, dresses & resort wear. Free shipping on orders over $300." rows={3} placeholder="Brief description for search results" />
              <p className="font-body text-xs text-muted-foreground">Recommended: 150-160 characters</p>
            </div>
            <div className="space-y-2">
              <Label className="font-body text-sm">OG Image URL</Label>
              <Input defaultValue="" placeholder="https://example.com/og-image.jpg" />
            </div>
          </EditorCard>
        </TabsContent>
      </Tabs>
    </div>
  </div>
);

// ---- Catalog Page Editor ----
const CatalogPageEditor = ({ page, setPage, pageKey }: { page: CatalogPageContent; setPage: (v: CatalogPageContent) => void; pageKey: string }) => (
  <div className="space-y-6">
    <Tabs defaultValue="banner" className="w-full">
      <TabsList className="w-full justify-start bg-card border border-border h-auto p-1 flex-wrap">
        <TabsTrigger value="banner" className="font-body text-xs">Banner & Content</TabsTrigger>
        <TabsTrigger value="announcement" className="font-body text-xs">Announcement</TabsTrigger>
        <TabsTrigger value="footer" className="font-body text-xs">Footer</TabsTrigger>
        <TabsTrigger value="seo" className="font-body text-xs">SEO</TabsTrigger>
      </TabsList>

      {/* Banner & Content */}
      <TabsContent value="banner">
        <EditorCard title="Page Banner & Content" description="Customize the banner image, title and subtitle">
          <SingleImageUploader
            src={page.bannerImage || "/placeholder.svg"}
            label="Banner Image"
            onUpload={(src) => setPage({ ...page, bannerImage: src })}
          />
          <Separator />
          <div className="space-y-2">
            <Label className="font-body text-sm">Page Title</Label>
            <Input value={page.title} onChange={e => setPage({ ...page, title: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label className="font-body text-sm">Subtitle</Label>
            <Input value={page.subtitle} onChange={e => setPage({ ...page, subtitle: e.target.value })} placeholder="Short description shown below the title" />
          </div>
          <PreviewBox>
            <div className="relative rounded-lg overflow-hidden">
              {page.bannerImage ? (
                <>
                  <img src={page.bannerImage} alt="" className="w-full h-40 object-cover" />
                  <div className="absolute inset-0 bg-charcoal/40 flex items-center justify-center text-center">
                    <div>
                      <p className="font-heading text-2xl font-light text-primary-foreground">{page.title}</p>
                      {page.subtitle && <p className="font-body text-xs text-primary-foreground/70 mt-1">{page.subtitle}</p>}
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-10 text-center border border-dashed border-border bg-secondary/20">
                  <p className="font-heading text-2xl text-foreground font-light">{page.title}</p>
                  {page.subtitle && <p className="font-body text-xs text-muted-foreground mt-1">{page.subtitle}</p>}
                </div>
              )}
            </div>
          </PreviewBox>
        </EditorCard>
      </TabsContent>

      {/* Announcement */}
      <TabsContent value="announcement">
        <EditorCard title="Announcement Bar" description="The scrolling bar at the top of this page">
          <div className="flex items-center justify-between">
            <Label className="font-body text-sm">Enabled</Label>
            <Switch checked={page.announcementEnabled} onCheckedChange={v => setPage({ ...page, announcementEnabled: v })} />
          </div>
          <div className="space-y-2">
            <Label className="font-body text-sm">Announcement Text</Label>
            <Input value={page.announcementText} onChange={e => setPage({ ...page, announcementText: e.target.value })} placeholder="e.g. Free Shipping Over $300" />
          </div>
          <PreviewBox>
            <div className="bg-primary py-2 px-4 text-center">
              <span className="text-xs font-body tracking-[0.2em] uppercase text-primary-foreground">{page.announcementText}</span>
            </div>
          </PreviewBox>
        </EditorCard>
      </TabsContent>

      {/* Footer */}
      <TabsContent value="footer">
        <EditorCard title="Footer" description="Newsletter and footer content for this page">
          <div className="space-y-2">
            <Label className="font-body text-sm">Newsletter Title</Label>
            <Input value={page.footerNewsletterTitle} onChange={e => setPage({ ...page, footerNewsletterTitle: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label className="font-body text-sm">Newsletter Subtitle</Label>
            <Textarea value={page.footerNewsletterSubtitle} onChange={e => setPage({ ...page, footerNewsletterSubtitle: e.target.value })} rows={2} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="font-body text-sm">Button Text</Label>
              <Input value={page.footerCtaText} onChange={e => setPage({ ...page, footerCtaText: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label className="font-body text-sm">Copyright</Label>
              <Input value={page.footerCopyright} onChange={e => setPage({ ...page, footerCopyright: e.target.value })} />
            </div>
          </div>
        </EditorCard>
      </TabsContent>

      {/* SEO */}
      <TabsContent value="seo">
        <EditorCard title="SEO Settings" description="Search engine optimization for this page">
          <div className="space-y-2">
            <Label className="font-body text-sm">Meta Description</Label>
            <Textarea value={page.metaDescription} onChange={e => setPage({ ...page, metaDescription: e.target.value })} rows={3} placeholder="Brief description for search results" />
            <p className="font-body text-xs text-muted-foreground">Recommended: 150-160 characters</p>
          </div>
          <div className="space-y-2">
            <Label className="font-body text-sm">OG Image URL</Label>
            <Input value={page.ogImage} onChange={e => setPage({ ...page, ogImage: e.target.value })} placeholder="https://example.com/og-image.jpg" />
          </div>
        </EditorCard>
      </TabsContent>
    </Tabs>
  </div>
);

// ---- Reusable ----
const EditorCard = ({ title, description, children }: { title: string; description: string; children: React.ReactNode }) => (
  <div className="bg-card border border-border rounded-xl p-6 space-y-5">
    <div>
      <h3 className="font-heading text-lg font-semibold text-foreground">{title}</h3>
      <p className="font-body text-xs text-muted-foreground">{description}</p>
    </div>
    <Separator />
    {children}
  </div>
);

const PreviewBox = ({ children }: { children: React.ReactNode }) => (
  <div className="space-y-2">
    <p className="font-body text-xs text-muted-foreground uppercase tracking-wider">Live Preview</p>
    <div className="border border-dashed border-border rounded-lg overflow-hidden">
      {children}
    </div>
  </div>
);

export default AdminPageEditor;
