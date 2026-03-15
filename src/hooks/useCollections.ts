import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: "published" | "draft" | "scheduled";
  featured: boolean;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export const useCollections = () => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error } = await (supabase as any)
          .from('collections')
          .select('*')
          .eq('status', 'published')
          .order('featured', { ascending: false })
          .order('name', { ascending: true });

        if (error) throw error;

        setCollections(data || []);
      } catch (err) {
        console.error('Error fetching collections:', err);
        setError('Failed to load collections');
      } finally {
        setLoading(false);
      }
    };

    fetchCollections();
  }, []);

  return { collections, loading, error };
};
