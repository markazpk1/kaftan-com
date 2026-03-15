import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type CategoryRow = Database['public']['Tables']['categories']['Row'];
type CategoryInsert = Database['public']['Tables']['categories']['Insert'];
type CategoryUpdate = Database['public']['Tables']['categories']['Update'];

export interface Category extends CategoryRow {}

export const categoryService = {
  // Get all categories
  async getCategories(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  // Get category by ID
  async getCategory(id: string): Promise<Category | null> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Create new category
  async createCategory(category: Omit<CategoryInsert, 'id' | 'created_at' | 'updated_at'>): Promise<Category> {
    const { data, error } = await supabase
      .from('categories')
      .insert([category])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update category
  async updateCategory(id: string, updates: CategoryUpdate): Promise<Category> {
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete category
  async deleteCategory(id: string): Promise<void> {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Get product count for each category
  async getCategoryProductCounts(): Promise<Record<string, number>> {
    const { data, error } = await supabase
      .from('products')
      .select('category');
    
    if (error) throw error;
    
    const counts: Record<string, number> = {};
    data?.forEach(p => {
      if (p.category) {
        counts[p.category] = (counts[p.category] || 0) + 1;
      }
    });
    
    return counts;
  }
};
