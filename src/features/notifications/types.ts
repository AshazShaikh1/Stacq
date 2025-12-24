
export type NotificationType = 
  | "follow"
  | "upvote"
  | "comment"
  | "clone"
  | "new_card"
  | "new_collection";

export interface NotificationData {
  collection_id?: string;
  stack_id?: string;
  collection_title?: string;
  stack_title?: string;
  card_id?: string;
  card_title?: string;
  comment_id?: string;
  comment_content?: string;
  [key: string]: any;
}

export interface NotificationActor {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string | null;
}

export interface Notification {
  id: string;
  user_id: string;
  actor_id: string;
  type: NotificationType;
  data: NotificationData;
  read: boolean;
  created_at: string;
  actor?: NotificationActor;
}

export interface NotificationsRepository {
  getNotifications(userId: string, limit: number): Promise<Notification[]>;
  getUnreadCount(userId: string): Promise<number>;
  markAsRead(userId: string, notificationId: string): Promise<Notification>;
  markAllAsRead(userId: string): Promise<void>;
  createNotification(
    userId: string, 
    actorId: string, 
    type: NotificationType, 
    data: NotificationData
  ): Promise<void>;
}
