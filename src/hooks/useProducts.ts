import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Product } from "@/lib/products";

interface UseProductsOptions {
  collection?: string;
  featured?: boolean;
  onSale?: boolean;
}

const mapDbProductToProduct = (dbProduct: any): Product => {
  const isSoldOut = !dbProduct.in_stock;

  return {
    id: dbProduct.id,
    name: dbProduct.name,
    price: Number(dbProduct.price),
    originalPrice: dbProduct.original_price ? Number(dbProduct.original_price) : undefined,
    image: dbProduct.images?.[0] || "/placeholder.svg",
    images: dbProduct.images || [],
    badge: isSoldOut ? "Sold out" : dbProduct.featured ? "New in" : undefined,
    category: dbProduct.category || "Uncategorized",
    style: dbProduct.description || undefined,
    color: dbProduct.colors?.[0] || undefined,
  };
};

export const useProducts = (options?: UseProductsOptions) => {
  return useQuery({
    queryKey: ["products", options],
    queryFn: async () => {
      let query = supabase.from("products").select("*");

      if (options?.collection) {
        query = query.eq("collection", options.collection);
      }
      if (options?.featured) {
        query = query.eq("featured", true);
      }
      if (options?.onSale) {
        query = query.not("original_price", "is", null);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []).map(mapDbProductToProduct);
    },
  });
};

export const useProductBySlug = (slug: string) => {
  return useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      return mapDbProductToProduct(data);
    },
    enabled: !!slug,
  });
};
