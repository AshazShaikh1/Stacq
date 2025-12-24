
import { SupabaseNotificationsRepository } from "../infrastructure/supabase-repository";
import { NotificationType, NotificationData } from "../types";

export async function getNotifications(userId: string, limit: number = 50) {
  const repository = new SupabaseNotificationsRepository();
  return repository.getNotifications(userId, limit);
}

export async function getUnreadCount(userId: string) {
  const repository = new SupabaseNotificationsRepository();
  return repository.getUnreadCount(userId);
}

export async function markAsRead(userId: string, notificationId: string) {
  const repository = new SupabaseNotificationsRepository();
  return repository.markAsRead(userId, notificationId);
}

export async function markAllAsRead(userId: string) {
  const repository = new SupabaseNotificationsRepository();
  return repository.markAllAsRead(userId);
}

export async function createNotification(
  userId: string,
  actorId: string,
  type: NotificationType,
  data: NotificationData
) {
  const repository = new SupabaseNotificationsRepository();
  return repository.createNotification(userId, actorId, type, data);
}
