import { supabase } from '@/integrations/supabase/client';

export interface StoreSettings {
  id?: string;
  store_name: string;
  store_email: string;
  store_phone: string;
  currency: string;
  tax_rate: number;
  free_shipping_min: number;
  shipping_fee: number;
  enable_reviews: boolean;
  enable_wishlist: boolean;
  enable_cod: boolean;
  maintenance_mode: boolean;
  email_notifications: boolean;
  order_notifications: boolean;
  low_stock_alerts: boolean;
  created_at?: string;
  updated_at?: string;
}

export const settingsService = {
  // Get current settings
  async getSettings(): Promise<StoreSettings | null> {
    try {
      const { data, error } = await supabase
        .from('store_settings' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Settings fetch error:', error);
        
        // Fallback to localStorage if database fails
        const localSettings = localStorage.getItem('store_settings');
        if (localSettings) {
          return JSON.parse(localSettings);
        }
        
        return null;
      }

      // Save to localStorage as cache
      if (data) {
        localStorage.setItem('store_settings', JSON.stringify(data));
      }

      return (data as unknown) as StoreSettings || null;
    } catch (error) {
      console.error('Error fetching settings:', error);
      
      // Fallback to localStorage
      const localSettings = localStorage.getItem('store_settings');
      if (localSettings) {
        return JSON.parse(localSettings);
      }
      
      return null;
    }
  },

  // Save settings
  async saveSettings(settings: Omit<StoreSettings, 'id' | 'created_at' | 'updated_at'>): Promise<StoreSettings> {
    try {
      // First, get existing settings to replace them
      const existing = await this.getSettings();
      
      if (existing) {
        // Update existing settings
        const { data, error } = await supabase
          .from('store_settings' as any)
          .update({
            store_name: settings.store_name,
            store_email: settings.store_email,
            store_phone: settings.store_phone,
            currency: settings.currency,
            tax_rate: settings.tax_rate,
            free_shipping_min: settings.free_shipping_min,
            shipping_fee: settings.shipping_fee,
            enable_reviews: settings.enable_reviews,
            enable_wishlist: settings.enable_wishlist,
            enable_cod: settings.enable_cod,
            maintenance_mode: settings.maintenance_mode,
            email_notifications: settings.email_notifications,
            order_notifications: settings.order_notifications,
            low_stock_alerts: settings.low_stock_alerts,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        
        // Update localStorage cache
        localStorage.setItem('store_settings', JSON.stringify(data));
        return (data as unknown) as StoreSettings;
      } else {
        // Create new settings
        const { data, error } = await supabase
          .from('store_settings' as any)
          .insert([settings])
          .select()
          .single();

        if (error) throw error;
        
        // Update localStorage cache
        localStorage.setItem('store_settings', JSON.stringify(data));
        return (data as unknown) as StoreSettings;
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      
      // Fallback: save to localStorage only
      const localSettings = {
        ...settings,
        id: `local-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      localStorage.setItem('store_settings', JSON.stringify(localSettings));
      
      // Return the settings but show a warning
      console.warn('Settings saved locally only. Database connection failed.');
      return localSettings as StoreSettings;
    }
  },

  // Validate settings
  validateSettings(settings: Partial<StoreSettings>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!settings.store_name?.trim()) {
      errors.push('Store name is required');
    }

    if (!settings.store_email?.trim()) {
      errors.push('Store email is required');
    } else if (!this.isValidEmail(settings.store_email)) {
      errors.push('Store email is not valid');
    }

    if (!settings.store_phone?.trim()) {
      errors.push('Store phone is required');
    }

    if (!settings.currency?.trim()) {
      errors.push('Currency is required');
    }

    if (settings.tax_rate !== undefined && (settings.tax_rate < 0 || settings.tax_rate > 100)) {
      errors.push('Tax rate must be between 0 and 100');
    }

    if (settings.free_shipping_min !== undefined && settings.free_shipping_min < 0) {
      errors.push('Free shipping minimum must be positive');
    }

    if (settings.shipping_fee !== undefined && settings.shipping_fee < 0) {
      errors.push('Shipping fee must be positive');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Email validation helper
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
};
