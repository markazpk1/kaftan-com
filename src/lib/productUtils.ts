import { newArrivals, saleProducts, bestSellers, type Product } from "./products";
import { paradiseProducts } from "./paradiseProducts";
import { safariProducts } from "./safariProducts";

const allProducts: Product[] = [...newArrivals, ...saleProducts, ...bestSellers, ...safariProducts, ...paradiseProducts];

export const getProductBySlug = (slug: string): Product | undefined => {
  return allProducts.find((p) => slugify(p.name) === slug);
};

export const getProductById = (id: string): Product | undefined => {
  return allProducts.find((p) => p.id === id);
};

export const slugify = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
};

export const getRelatedProducts = (product: Product, count = 4): Product[] => {
  return allProducts
    .filter((p) => p.id !== product.id && p.category === product.category)
    .slice(0, count);
};

export const getAllProducts = (): Product[] => {
  // Deduplicate by id
  const seen = new Set<string>();
  return allProducts.filter((p) => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });
};
