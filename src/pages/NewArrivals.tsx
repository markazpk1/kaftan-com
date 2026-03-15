import CatalogPage from "@/components/CatalogPage";
import { newArrivals } from "@/lib/products";
import { useCatalogPageContent } from "@/hooks/usePageContent";
import { useProducts } from "@/hooks/useProducts";

const NewArrivals = () => {
  const cmsContent = useCatalogPageContent("new-arrivals");
  const { data: dbProducts } = useProducts({ featured: true });
  const products = dbProducts && dbProducts.length > 0 ? dbProducts : newArrivals;

  return (
    <CatalogPage
      title="New Arrivals"
      subtitle="The latest additions to our collection"
      products={products}
      cmsContent={cmsContent}
    />
  );
};

export default NewArrivals;
