import { supabase } from '@/integrations/supabase/client';
import type { ActivityLog } from '@/types';

export async function fetchActivityLog(projectId: string, limit = 50) {
  const { data, error } = await supabase
    .from('activity_log')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;

  // Fetch profiles for user_ids
  const userIds = [...new Set((data || []).map(a => a.user_id))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .in('user_id', userIds);

  const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

  return (data || []).map(a => ({
    ...a,
    profiles: profileMap.get(a.user_id) || undefined,
  })) as unknown as ActivityLog[];
}

export async function logActivity(entry: {
  project_id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  metadata?: Record<string, unknown>;
}) {
  const { error } = await supabase.from('activity_log').insert([{
    project_id: entry.project_id,
    user_id: entry.user_id,
    action: entry.action,
    entity_type: entry.entity_type,
    entity_id: entry.entity_id ?? null,
    metadata: (entry.metadata ?? {}) as unknown as Record<string, never>,
  }]);
  if (error) console.error('Failed to log activity:', error);
}
