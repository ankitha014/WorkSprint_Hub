import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchProjects, createProject, updateProject, deleteProject, fetchProject, fetchProjectMembers } from '@/services/api/projects';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';

export function useProjects() {
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id;

  useRealtimeSubscription({
    table: 'projects',
    queryKeys: [['projects', workspaceId]],
  });

  return useQuery({
    queryKey: ['projects', workspaceId],
    queryFn: () => fetchProjects(workspaceId || undefined),
    enabled: !!workspaceId,
  });
}

export function useProject(id: string) {
  useRealtimeSubscription({
    table: 'projects',
    filter: `id=eq.${id}`,
    queryKeys: [['projects', id]],
  });

  return useQuery({
    queryKey: ['projects', id],
    queryFn: () => fetchProject(id),
    enabled: !!id,
  });
}

export function useProjectMembers(projectId: string) {
  useRealtimeSubscription({
    table: 'project_members',
    filter: `project_id=eq.${projectId}`,
    queryKeys: [['project-members', projectId]],
  });

  return useQuery({
    queryKey: ['project-members', projectId],
    queryFn: () => fetchProjectMembers(projectId),
    enabled: !!projectId,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  return useMutation({
    mutationFn: (project: { name: string; description?: string; color?: string; workspace_id?: string; due_date?: string; priority?: string }) =>
      createProject({ ...project, workspace_id: project.workspace_id || currentWorkspace?.id }, user!.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...updates }: { id: string; name?: string; description?: string; status?: 'active' | 'archived' | 'completed'; color?: string }) =>
      updateProject(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteProject,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  });
}
