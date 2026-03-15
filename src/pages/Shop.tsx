import CatalogPage from "@/components/CatalogPage";
import { getAllProducts } from "@/lib/productUtils";
import collectionBanner from "@/assets/collection-banner.jpg";
import { useCatalogPageContent } from "@/hooks/usePageContent";
import { useProducts } from "@/hooks/useProducts";

const Shop = () => {
  const cmsContent = useCatalogPageContent("shop");
  const { data: dbProducts } = useProducts();
  const products = dbProducts && dbProducts.length > 0 ? dbProducts : getAllProducts();

  return (
    <CatalogPage
      title="Shop All"
      subtitle="Explore our complete collection of luxury resort wear"
      products={products}
      bannerImage={collectionBanner}
      cmsContent={cmsContent}
    />
  );
};

export default Shop;
