import { supabase } from '@/integrations/supabase/client';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'order' | 'customer' | 'inventory' | 'alert';
  read: boolean;
  created_at: string;
  updated_at: string;
}

export const notificationService = {
  // Get all notifications
  async getNotifications(): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications' as any)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as unknown) as Notification[] || [];
  },

  // Get unread notifications count
  async getUnreadCount(): Promise<number> {
    const { count, error } = await supabase
      .from('notifications' as any)
      .select('*', { count: 'exact', head: true })
      .eq('read', false);

    if (error) throw error;
    return count || 0;
  },

  // Get notifications by type
  async getNotificationsByType(type: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications' as any)
      .select('*')
      .eq('type', type)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as unknown) as Notification[] || [];
  },

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications' as any)
      .update({ read: true })
      .eq('id', notificationId);

    if (error) throw error;
  },

  // Mark multiple notifications as read
  async markMultipleAsRead(notificationIds: string[]): Promise<void> {
    const { error } = await supabase
      .from('notifications' as any)
      .update({ read: true })
      .in('id', notificationIds);

    if (error) throw error;
  },

  // Mark all notifications as read
  async markAllAsRead(): Promise<void> {
    const { error } = await supabase
      .from('notifications' as any)
      .update({ read: true })
      .eq('read', false);

    if (error) throw error;
  },

  // Toggle read status
  async toggleReadStatus(notificationId: string, read: boolean): Promise<void> {
    const { error } = await supabase
      .from('notifications' as any)
      .update({ read })
      .eq('id', notificationId);

    if (error) throw error;
  },

  // Delete notification
  async deleteNotification(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications' as any)
      .delete()
      .eq('id', notificationId);

    if (error) throw error;
  },

  // Delete multiple notifications
  async deleteMultipleNotifications(notificationIds: string[]): Promise<void> {
    const { error } = await supabase
      .from('notifications' as any)
      .delete()
      .in('id', notificationIds);

    if (error) throw error;
  },

  // Delete all notifications
  async deleteAllNotifications(): Promise<void> {
    const { error } = await supabase
      .from('notifications' as any)
      .delete();

    if (error) throw error;
  },

  // Create new notification
  async createNotification(notification: Omit<Notification, 'id' | 'read' | 'created_at' | 'updated_at'>): Promise<Notification> {
    const { data, error } = await supabase
      .from('notifications' as any)
      .insert([notification])
      .select()
      .single();

    if (error) throw error;
    return (data as unknown) as Notification;
  },

  // Subscribe to real-time notifications
  subscribeToNotifications(callback: (payload: any) => void) {
    return supabase
      .channel('notifications')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'notifications' 
        }, 
        callback
      )
      .subscribe();
  }
};
