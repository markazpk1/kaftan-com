import CatalogPage from "@/components/CatalogPage";
import { saleProducts } from "@/lib/products";
import { useCatalogPageContent } from "@/hooks/usePageContent";

const Sale = () => {
  const cmsContent = useCatalogPageContent("sale");
  // Since we removed sale functionality, just use empty array
  const products: any[] = [];

  return (
    <CatalogPage
      title="Summer Sale"
      subtitle="Limited time offers on select styles"
      products={products}
      cmsContent={cmsContent}
    />
  );
};

export default Sale;
