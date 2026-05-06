import { supabase } from '@/integrations/supabase/client';

export interface TaskAttachment {
  id: string;
  task_id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  content_type: string | null;
  created_at: string;
}

export async function fetchTaskAttachments(taskId: string): Promise<TaskAttachment[]> {
  const { data, error } = await supabase
    .from('task_attachments')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as unknown as TaskAttachment[];
}

export async function uploadTaskAttachment(
  taskId: string,
  userId: string,
  file: File
): Promise<TaskAttachment> {
  const filePath = `${userId}/${taskId}/${Date.now()}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from('task-attachments')
    .upload(filePath, file);
  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from('task_attachments')
    .insert({
      task_id: taskId,
      user_id: userId,
      file_name: file.name,
      file_path: filePath,
      file_size: file.size,
      content_type: file.type,
    })
    .select()
    .single();
  if (error) throw error;
  return data as unknown as TaskAttachment;
}

export async function deleteTaskAttachment(attachment: TaskAttachment) {
  const { error: storageError } = await supabase.storage
    .from('task-attachments')
    .remove([attachment.file_path]);
  if (storageError) throw storageError;

  const { error } = await supabase
    .from('task_attachments')
    .delete()
    .eq('id', attachment.id);
  if (error) throw error;
}

export async function getAttachmentSignedUrl(filePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('task-attachments')
    .createSignedUrl(filePath, 3600); // 1 hour expiry
  if (error) throw error;
  return data.signedUrl;
}
