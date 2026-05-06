import { supabase } from '@/integrations/supabase/client';
import type { TaskComment } from '@/types';

export async function fetchTaskComments(taskId: string) {
  const { data, error } = await supabase
    .from('task_comments')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data as unknown as TaskComment[];
}

export async function createTaskComment(comment: {
  task_id: string;
  user_id: string;
  comment: string;
}) {
  const { data, error } = await supabase
    .from('task_comments')
    .insert([comment])
    .select()
    .single();
  if (error) throw error;
  return data as unknown as TaskComment;
}

export async function deleteTaskComment(id: string) {
  const { error } = await supabase.from('task_comments').delete().eq('id', id);
  if (error) throw error;
}
