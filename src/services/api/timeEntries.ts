import { supabase } from '@/integrations/supabase/client';

export interface TimeEntry {
  id: string;
  task_id: string;
  user_id: string;
  start_time: string;
  end_time: string | null;
  duration: number;
  description: string | null;
  created_at: string;
}

export async function fetchTimeEntries(taskId: string) {
  const { data, error } = await supabase
    .from('time_entries')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as TimeEntry[];
}

export async function startTimer(taskId: string, userId: string) {
  const { data, error } = await supabase
    .from('time_entries')
    .insert({ task_id: taskId, user_id: userId, start_time: new Date().toISOString(), duration: 0 })
    .select()
    .single();
  if (error) throw error;
  return data as TimeEntry;
}

export async function stopTimer(entryId: string) {
  const endTime = new Date();
  // First get the entry to calculate duration
  const { data: entry, error: fetchErr } = await supabase
    .from('time_entries')
    .select('start_time')
    .eq('id', entryId)
    .single();
  if (fetchErr) throw fetchErr;

  const startTime = new Date(entry.start_time);
  const duration = Math.round((endTime.getTime() - startTime.getTime()) / 1000);

  const { data, error } = await supabase
    .from('time_entries')
    .update({ end_time: endTime.toISOString(), duration })
    .eq('id', entryId)
    .select()
    .single();
  if (error) throw error;
  return data as TimeEntry;
}

export async function logManualTime(taskId: string, userId: string, durationMinutes: number, description?: string) {
  const endTime = new Date();
  const startTime = new Date(endTime.getTime() - durationMinutes * 60 * 1000);

  const { data, error } = await supabase
    .from('time_entries')
    .insert({
      task_id: taskId,
      user_id: userId,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      duration: durationMinutes * 60,
      description: description || null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as TimeEntry;
}

export async function deleteTimeEntry(id: string) {
  const { error } = await supabase.from('time_entries').delete().eq('id', id);
  if (error) throw error;
}

export async function getActiveTimer(userId: string) {
  const { data, error } = await supabase
    .from('time_entries')
    .select('*')
    .eq('user_id', userId)
    .is('end_time', null)
    .order('start_time', { ascending: false })
    .limit(1);
  if (error) throw error;
  return (data && data.length > 0 ? data[0] : null) as TimeEntry | null;
}
