
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/api-service";
import { NotificationsRepository, Notification, NotificationType, NotificationData } from "../types";

export class SupabaseNotificationsRepository implements NotificationsRepository {
  async getNotifications(userId: string, limit: number): Promise<Notification[]> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('notifications')
      .select(`
        id, type, actor_id, data, read, created_at, user_id,
        actor:users!notifications_actor_id_fkey (
          id, username, display_name, avatar_url
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw new Error(error.message);

    return (data || []).map((n: any) => ({
      ...n,
      actor: n.actor || undefined
    }));
  }

  async getUnreadCount(userId: string): Promise<number> {
    const supabase = await createClient();
    
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw new Error(error.message);

    return count || 0;
  }

  async markAsRead(userId: string, notificationId: string): Promise<Notification> {
    const serviceClient = createServiceClient();
    
    // First verification (optional, but good for security if we trust service client blindly)
    // The service client bypasses RLS, so we must be sure.
    // However, existing route checked user_id ownership manually.
    // Ideally, we do this ownership check here or rely on filters.
    
    const { data: notification, error } = await serviceClient
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .eq('user_id', userId) // Ensure ownership
      .select()
      .single();

    if (error) throw new Error(error.message);
    
    return notification as Notification;
  }

  async markAllAsRead(userId: string): Promise<void> {
    const serviceClient = createServiceClient();
    
    const { error } = await serviceClient
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw new Error(error.message);
  }

  async createNotification(
    userId: string,
    actorId: string,
    type: NotificationType,
    data: NotificationData
  ): Promise<void> {
    const serviceClient = createServiceClient();
    
    await serviceClient.from("notifications").insert({
      user_id: userId,
      actor_id: actorId,
      type,
      data,
      read: false,
    });
  }
}
