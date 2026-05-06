import { supabase } from '@/integrations/supabase/client';

export type NotificationType =
  | 'task_assigned'
  | 'task_updated'
  | 'task_completed'
  | 'task_due_soon'
  | 'comment_added'
  | 'comment_mention'
  | 'workspace_invite'
  | 'project_invite';

export interface Notification {
  id: string;
  user_id: string;
  project_id: string | null;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  entity_id: string | null;
  created_at: string;
}

export async function fetchNotifications(limit = 50) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data as unknown as Notification[];
}

export async function markNotificationRead(id: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', id);
  if (error) throw error;
}

export async function markAllNotificationsRead(userId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false);
  if (error) throw error;
}

export async function deleteNotification(id: string) {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function deleteAllReadNotifications(userId: string) {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('user_id', userId)
    .eq('read', true);
  if (error) throw error;
}

export async function createNotification(notification: {
  user_id: string;
  project_id?: string;
  type: NotificationType;
  title: string;
  message: string;
  entity_id?: string;
}) {
  const { error } = await supabase.from('notifications').insert([{
    user_id: notification.user_id,
    project_id: notification.project_id ?? null,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    entity_id: notification.entity_id ?? null,
  }]);
  if (error) console.error('Failed to create notification:', error);
}
