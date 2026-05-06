import { supabase } from '@/integrations/supabase/client';
import type { Task, TaskStatus } from '@/types';

export async function fetchTasks(projectId: string) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('project_id', projectId)
    .order('position', { ascending: true });
  if (error) throw error;
  return data as unknown as Task[];
}

export async function fetchAllTasks() {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as unknown as Task[];
}

export async function createTask(task: {
  project_id: string;
  title: string;
  description?: string;
  priority?: string;
  assignee_id?: string | null;
  due_date?: string | null;
  created_by: string;
}) {
  const { data, error } = await supabase
    .from('tasks')
    .insert(task)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as Task;
}

export async function updateTask(id: string, updates: Record<string, unknown>) {
  const { data, error } = await supabase
    .from('tasks')
    .update(updates as never)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as Task;
}

export async function updateTaskStatus(id: string, status: TaskStatus) {
  return updateTask(id, { status });
}

export async function deleteTask(id: string) {
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) throw error;
}
