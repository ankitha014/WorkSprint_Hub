import { supabase } from '@/integrations/supabase/client';
import type { Project } from '@/types';

export async function fetchProjects(workspaceId?: string) {
  let query = supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });
  if (workspaceId) {
    query = query.eq('workspace_id', workspaceId);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data as Project[];
}

export async function fetchProject(id: string) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as Project;
}

export async function createProject(project: { name: string; description?: string; color?: string; workspace_id?: string; due_date?: string; priority?: string }, userId: string) {
  const { data, error } = await supabase
    .from('projects')
    .insert({ ...project, owner_id: userId })
    .select()
    .single();
  if (error) throw error;

  // Add creator as owner member
  await supabase.from('project_members').insert({
    project_id: data.id,
    user_id: userId,
    role: 'owner',
  });

  return data as Project;
}

export async function updateProject(id: string, updates: Partial<Project>) {
  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Project;
}

export async function deleteProject(id: string) {
  const { error } = await supabase.from('projects').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchProjectMembers(projectId: string) {
  const { data, error } = await supabase
    .from('project_members')
    .select('*, profiles(*)')
    .eq('project_id', projectId);
  if (error) throw error;
  return data;
}

export async function addProjectMember(projectId: string, email: string) {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('email', email)
    .single();
  if (profileError) throw new Error('User not found');

  const { error } = await supabase.from('project_members').insert({
    project_id: projectId,
    user_id: profile.user_id,
    role: 'member',
  });
  if (error) throw error;
}

export async function removeProjectMember(projectId: string, userId: string) {
  const { error } = await supabase
    .from('project_members')
    .delete()
    .eq('project_id', projectId)
    .eq('user_id', userId);
  if (error) throw error;
}
