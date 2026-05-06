import { supabase } from '@/integrations/supabase/client';
import type { Workspace, WorkspaceMember } from '@/types';

export async function fetchWorkspaces() {
  const { data, error } = await supabase
    .from('workspaces')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Workspace[];
}

export async function fetchWorkspace(id: string) {
  const { data, error } = await supabase
    .from('workspaces')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as Workspace;
}

export async function createWorkspace(name: string, userId: string) {
  const { data, error } = await supabase
    .from('workspaces')
    .insert({ name, owner_id: userId })
    .select()
    .single();
  if (error) throw error;

  // Add creator as owner member
  await supabase.from('workspace_members').insert({
    workspace_id: data.id,
    user_id: userId,
    role: 'owner',
  });

  return data as Workspace;
}

export async function updateWorkspace(id: string, updates: Partial<Workspace>) {
  const { data, error } = await supabase
    .from('workspaces')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Workspace;
}

export async function deleteWorkspace(id: string) {
  const { error } = await supabase.from('workspaces').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchWorkspaceMembers(workspaceId: string) {
  const { data, error } = await supabase
    .from('workspace_members')
    .select('*')
    .eq('workspace_id', workspaceId);
  if (error) throw error;

  // Fetch profiles for all member user_ids
  const userIds = (data || []).map(m => m.user_id);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .in('user_id', userIds);

  const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

  return (data || []).map(m => ({
    ...m,
    profiles: profileMap.get(m.user_id) || undefined,
  })) as WorkspaceMember[];
}

export async function inviteWorkspaceMember(workspaceId: string, email: string) {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('email', email)
    .single();
  if (profileError) throw new Error('User not found with that email');

  const { error } = await supabase.from('workspace_members').insert({
    workspace_id: workspaceId,
    user_id: profile.user_id,
    role: 'member',
  });
  if (error) {
    if (error.code === '23505') throw new Error('User is already a member');
    throw error;
  }
}

export async function removeWorkspaceMember(workspaceId: string, userId: string) {
  const { error } = await supabase
    .from('workspace_members')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function updateMemberRole(workspaceId: string, userId: string, role: string) {
  const { error } = await supabase
    .from('workspace_members')
    .update({ role })
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId);
  if (error) throw error;
}
