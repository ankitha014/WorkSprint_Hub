import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchWorkspaces,
  fetchWorkspaceMembers,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
  inviteWorkspaceMember,
  removeWorkspaceMember,
  updateMemberRole,
} from '@/services/api/workspaces';
import { useAuth } from '@/contexts/AuthContext';

export function useWorkspaces() {
  return useQuery({
    queryKey: ['workspaces'],
    queryFn: fetchWorkspaces,
  });
}

export function useWorkspaceMembers(workspaceId: string) {
  return useQuery({
    queryKey: ['workspace-members', workspaceId],
    queryFn: () => fetchWorkspaceMembers(workspaceId),
    enabled: !!workspaceId,
  });
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (name: string) => createWorkspace(name, user!.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workspaces'] }),
  });
}

export function useUpdateWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => updateWorkspace(id, { name }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workspaces'] }),
  });
}

export function useDeleteWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteWorkspace,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workspaces'] }),
  });
}

export function useInviteWorkspaceMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ workspaceId, email }: { workspaceId: string; email: string }) =>
      inviteWorkspaceMember(workspaceId, email),
    onSuccess: (_, { workspaceId }) =>
      queryClient.invalidateQueries({ queryKey: ['workspace-members', workspaceId] }),
  });
}

export function useRemoveWorkspaceMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ workspaceId, userId }: { workspaceId: string; userId: string }) =>
      removeWorkspaceMember(workspaceId, userId),
    onSuccess: (_, { workspaceId }) =>
      queryClient.invalidateQueries({ queryKey: ['workspace-members', workspaceId] }),
  });
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ workspaceId, userId, role }: { workspaceId: string; userId: string; role: string }) =>
      updateMemberRole(workspaceId, userId, role),
    onSuccess: (_, { workspaceId }) =>
      queryClient.invalidateQueries({ queryKey: ['workspace-members', workspaceId] }),
  });
}
