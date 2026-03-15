import { supabase } from '@/integrations/supabase/client';

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  stock: number;
  reorder_level: number;
  min_stock_level: number;
  price: number;
  category: string;
  image: string;
  stock_status: 'In Stock' | 'Low Stock' | 'Critical' | 'Out of Stock';
  updated_at: string;
}

export interface InventoryStats {
  total_skus: number;
  low_stock: number;
  out_of_stock: number;
  critical_stock: number;
}

export interface InventoryMovement {
  id: string;
  product_id: string;
  movement_type: 'sale' | 'restock' | 'adjustment' | 'return';
  quantity: number;
  reference_id?: string;
  notes?: string;
  created_at: string;
}

export const inventoryService = {
  // Get all inventory items
  async getInventoryItems(): Promise<InventoryItem[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(product => ({
        id: product.id,
        name: product.name,
        sku: product.sku || 'N/A',
        stock: product.stock || 0,
        reorder_level: 10, // Default values
        min_stock_level: 5,
        price: product.price,
        category: product.category || 'Uncategorized',
        image: product.images?.[0] || '/placeholder.svg',
        stock_status: this.getStockStatus(product.stock || 0),
        updated_at: product.updated_at,
      }));
    } catch (error) {
      console.error('Error fetching inventory items:', error);
      return [];
    }
  },

  // Helper method to determine stock status
  getStockStatus(stock: number): 'In Stock' | 'Low Stock' | 'Critical' | 'Out of Stock' {
    if (stock === 0) return 'Out of Stock';
    if (stock <= 5) return 'Critical';
    if (stock <= 10) return 'Low Stock';
    return 'In Stock';
  },

  // Get inventory statistics
  async getInventoryStats(): Promise<InventoryStats> {
    try {
      const { data: items, error } = await supabase
        .from('products')
        .select('stock');

      if (error) throw error;

      const stats: InventoryStats = {
        total_skus: items?.length || 0,
        low_stock: items?.filter(item => (item.stock || 0) > 0 && (item.stock || 0) <= 10).length || 0,
        out_of_stock: items?.filter(item => (item.stock || 0) === 0).length || 0,
        critical_stock: items?.filter(item => (item.stock || 0) > 0 && (item.stock || 0) <= 5).length || 0,
      };

      return stats;
    } catch (error) {
      console.error('Error fetching inventory stats:', error);
      return {
        total_skus: 0,
        low_stock: 0,
        out_of_stock: 0,
        critical_stock: 0,
      };
    }
  },

  // Search inventory items
  async searchInventoryItems(query: string): Promise<InventoryItem[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .or(`name.ilike.%${query}%,sku.ilike.%${query}%`)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(product => ({
        id: product.id,
        name: product.name,
        sku: product.sku || 'N/A',
        stock: product.stock || 0,
        reorder_level: 10,
        min_stock_level: 5,
        price: product.price,
        category: product.category || 'Uncategorized',
        image: product.images?.[0] || '/placeholder.svg',
        stock_status: this.getStockStatus(product.stock || 0),
        updated_at: product.updated_at,
      }));
    } catch (error) {
      console.error('Error searching inventory items:', error);
      return [];
    }
  },

  // Get filtered inventory items
  async getFilteredInventoryItems(filter: 'All' | 'Low Stock' | 'Out of Stock' | 'Critical'): Promise<InventoryItem[]> {
    try {
      let query = supabase
        .from('products')
        .select('*')
        .order('updated_at', { ascending: false });

      if (filter === 'Low Stock') {
        query = query.gt('stock', 0).lte('stock', 10);
      } else if (filter === 'Out of Stock') {
        query = query.eq('stock', 0);
      } else if (filter === 'Critical') {
        query = query.gt('stock', 0).lte('stock', 5);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map(product => ({
        id: product.id,
        name: product.name,
        sku: product.sku || 'N/A',
        stock: product.stock || 0,
        reorder_level: 10,
        min_stock_level: 5,
        price: product.price,
        category: product.category || 'Uncategorized',
        image: product.images?.[0] || '/placeholder.svg',
        stock_status: this.getStockStatus(product.stock || 0),
        updated_at: product.updated_at,
      }));
    } catch (error) {
      console.error('Error fetching filtered inventory items:', error);
      return [];
    }
  },

  // Update product stock
  async updateStock(
    productId: string,
    quantity: number,
    movementType: 'sale' | 'restock' | 'adjustment' | 'return' = 'adjustment',
    notes?: string
  ): Promise<boolean> {
    try {
      const { data: currentProduct, error: fetchError } = await supabase
        .from('products')
        .select('stock')
        .eq('id', productId)
        .single();

      if (fetchError) throw fetchError;

      const currentStock = currentProduct?.stock || 0;
      const newStock = Math.max(0, currentStock + quantity);

      const { error } = await supabase
        .from('products')
        .update({ 
          stock: newStock,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating stock:', error);
      return false;
    }
  },

  // Restock item (convenience method)
  async restockItem(productId: string, quantity: number = 50): Promise<boolean> {
    try {
      const { data: currentProduct, error: fetchError } = await supabase
        .from('products')
        .select('stock')
        .eq('id', productId)
        .single();

      if (fetchError) throw fetchError;

      const currentStock = currentProduct?.stock || 0;
      const newStock = currentStock + quantity;

      const { error } = await supabase
        .from('products')
        .update({ 
          stock: newStock,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error restocking item:', error);
      return false;
    }
  },

  // Get inventory movements for a product (simplified version)
  async getInventoryMovements(productId: string): Promise<InventoryMovement[]> {
    try {
      // Since we don't have inventory_movements table yet, return empty array
      // This can be implemented later when the table is created
      return [];
    } catch (error) {
      console.error('Error fetching inventory movements:', error);
      return [];
    }
  },

  // Get low stock alerts (simplified version)
  async getLowStockAlerts(): Promise<any[]> {
    try {
      // Since we don't have inventory_alerts table yet, return empty array
      // This can be implemented later when the table is created
      return [];
    } catch (error) {
      console.error('Error fetching low stock alerts:', error);
      return [];
    }
  },

  // Resolve alert (simplified version)
  async resolveAlert(alertId: string): Promise<boolean> {
    try {
      // Since we don't have inventory_alerts table yet, return true
      // This can be implemented later when the table is created
      return true;
    } catch (error) {
      console.error('Error resolving alert:', error);
      return false;
    }
  },
};
