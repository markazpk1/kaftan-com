import CatalogPage from "@/components/CatalogPage";
import { getAllProducts } from "@/lib/productUtils";
import heroBanner from "@/assets/hero-banner.jpg";
import { useCatalogPageContent } from "@/hooks/usePageContent";

const Collections = () => {
  const cmsContent = useCatalogPageContent("collections");
  return (
    <CatalogPage
      title="Collections"
      subtitle="Curated collections for every occasion"
      products={getAllProducts()}
      bannerImage={heroBanner}
      cmsContent={cmsContent}
    />
  );
};

export default Collections;
