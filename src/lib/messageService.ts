import { supabase } from '@/integrations/supabase/client';

export interface Message {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  read: boolean;
  starred: boolean;
  created_at: string;
  updated_at: string;
}

export const messageService = {
  // Get all messages
  async getMessages(): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages' as any)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as unknown) as Message[] || [];
  },

  // Get unread messages count
  async getUnreadCount(): Promise<number> {
    const { count, error } = await supabase
      .from('messages' as any)
      .select('*', { count: 'exact', head: true })
      .eq('read', false);

    if (error) throw error;
    return count || 0;
  },

  // Mark message as read
  async markAsRead(messageId: string): Promise<void> {
    const { error } = await supabase
      .from('messages' as any)
      .update({ read: true })
      .eq('id', messageId);

    if (error) throw error;
  },

  // Toggle starred status
  async toggleStarred(messageId: string, starred: boolean): Promise<void> {
    const { error } = await supabase
      .from('messages' as any)
      .update({ starred })
      .eq('id', messageId);

    if (error) throw error;
  },

  // Delete message
  async deleteMessage(messageId: string): Promise<void> {
    const { error } = await supabase
      .from('messages' as any)
      .delete()
      .eq('id', messageId);

    if (error) throw error;
  },

  // Create new message (for contact form)
  async createMessage(message: Omit<Message, 'id' | 'read' | 'starred' | 'created_at' | 'updated_at'>): Promise<Message> {
    const { data, error } = await supabase
      .from('messages' as any)
      .insert([message])
      .select()
      .single();

    if (error) throw error;
    return (data as unknown) as Message;
  }
};
