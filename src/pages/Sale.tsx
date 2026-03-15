import CatalogPage from "@/components/CatalogPage";
import { saleProducts } from "@/lib/products";
import { useCatalogPageContent } from "@/hooks/usePageContent";
import { useProducts } from "@/hooks/useProducts";

const Sale = () => {
  const cmsContent = useCatalogPageContent("sale");
  const { data: dbProducts } = useProducts({ onSale: true });
  const products = dbProducts && dbProducts.length > 0 ? dbProducts : saleProducts;

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
