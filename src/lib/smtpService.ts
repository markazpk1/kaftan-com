import { supabase } from '@/integrations/supabase/client';

export interface SmtpConfig {
  id?: string;
  host: string;
  port: string;
  username: string;
  password: string;
  encryption: 'tls' | 'ssl' | 'none';
  fromName: string;
  fromEmail: string;
  replyTo: string;
  enabled: boolean;
  created_at?: string;
  updated_at?: string;
}

export const smtpService = {
  // Get current SMTP settings
  async getCurrentSettings(): Promise<SmtpConfig | null> {
    try {
      const { data, error } = await supabase
        .from('smtp_settings' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(); // Use maybeSingle instead of single to handle no results

      if (error) {
        console.error('SMTP settings fetch error:', error);
        
        // Handle 406 and other RLS errors
        if (error.code === 'PGRST116' || error.message?.includes('406')) {
          console.log('No SMTP settings found or RLS not properly configured');
          return null;
        }
        
        throw error;
      }

      return (data as unknown) as SmtpConfig || null;
    } catch (error) {
      console.error('Error fetching SMTP settings:', error);
      return null;
    }
  },

  // Save SMTP settings
  async saveSettings(settings: Omit<SmtpConfig, 'id' | 'created_at' | 'updated_at'>): Promise<SmtpConfig> {
    try {
      // First, get existing settings to replace them
      const existing = await this.getCurrentSettings();
      
      if (existing) {
        // Update existing settings
        const { data, error } = await supabase
          .from('smtp_settings' as any)
          .update({
            host: settings.host,
            port: settings.port,
            username: settings.username,
            password: settings.password,
            encryption: settings.encryption,
            from_name: settings.fromName,
            from_email: settings.fromEmail,
            reply_to: settings.replyTo,
            enabled: settings.enabled,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return (data as unknown) as SmtpConfig;
      } else {
        // Create new settings
        const { data, error } = await supabase
          .from('smtp_settings' as any)
          .insert([{
            host: settings.host,
            port: settings.port,
            username: settings.username,
            password: settings.password,
            encryption: settings.encryption,
            from_name: settings.fromName,
            from_email: settings.fromEmail,
            reply_to: settings.replyTo,
            enabled: settings.enabled
          }])
          .select()
          .single();

        if (error) throw error;
        return (data as unknown) as SmtpConfig;
      }
    } catch (error) {
      console.error('Error saving SMTP settings:', error);
      throw error;
    }
  },

  // Test SMTP connection
  async testConnection(config: SmtpConfig, testEmail: string): Promise<{ success: boolean; message: string }> {
    try {
      // Call the Supabase Edge Function to test SMTP
      const { data, error } = await supabase.functions.invoke('test-smtp', {
        body: {
          smtpConfig: {
            host: config.host,
            port: config.port,
            username: config.username,
            password: config.password,
            encryption: config.encryption,
            fromName: config.fromName,
            fromEmail: config.fromEmail,
            replyTo: config.replyTo
          },
          testEmail: testEmail
        }
      });

      if (error) {
        return {
          success: false,
          message: error.message || 'Failed to test SMTP connection'
        };
      }

      return data as { success: boolean; message: string };
    } catch (error) {
      console.error('Error testing SMTP connection:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  },

  // Send email using current SMTP settings
  async sendEmail(to: string, subject: string, htmlContent: string, textContent?: string): Promise<{ success: boolean; message: string }> {
    try {
      const currentSettings = await this.getCurrentSettings();
      
      if (!currentSettings || !currentSettings.enabled) {
        return {
          success: false,
          message: 'SMTP is not configured or enabled'
        };
      }

      // Call the Supabase Edge Function to send email
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          smtpConfig: {
            host: currentSettings.host,
            port: currentSettings.port,
            username: currentSettings.username,
            password: currentSettings.password,
            encryption: currentSettings.encryption,
            fromName: currentSettings.fromName,
            fromEmail: currentSettings.fromEmail,
            replyTo: currentSettings.replyTo
          },
          to: to,
          subject: subject,
          htmlContent: htmlContent,
          textContent: textContent
        }
      });

      if (error) {
        return {
          success: false,
          message: error.message || 'Failed to send email'
        };
      }

      return data as { success: boolean; message: string };
    } catch (error) {
      console.error('Error sending email:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  },

  // Validate SMTP configuration
  validateConfig(config: Partial<SmtpConfig>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.host?.trim()) {
      errors.push('SMTP host is required');
    }

    if (!config.port?.trim()) {
      errors.push('Port is required');
    } else if (isNaN(Number(config.port)) || Number(config.port) < 1 || Number(config.port) > 65535) {
      errors.push('Port must be a valid number between 1 and 65535');
    }

    if (!config.username?.trim()) {
      errors.push('Username is required');
    }

    if (!config.password?.trim()) {
      errors.push('Password is required');
    }

    if (!config.fromEmail?.trim()) {
      errors.push('From email is required');
    } else if (!this.isValidEmail(config.fromEmail)) {
      errors.push('From email is not valid');
    }

    if (config.replyTo && !this.isValidEmail(config.replyTo)) {
      errors.push('Reply-to email is not valid');
    }

    if (!config.fromName?.trim()) {
      errors.push('From name is required');
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
