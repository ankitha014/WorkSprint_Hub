import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchTasks, fetchAllTasks, createTask, updateTask, updateTaskStatus, deleteTask } from '@/services/api/tasks';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import type { TaskStatus } from '@/types';

export function useTasks(projectId: string) {
  useRealtimeSubscription({
    table: 'tasks',
    filter: `project_id=eq.${projectId}`,
    queryKeys: [['tasks', projectId], ['all-tasks']],
  });

  return useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => fetchTasks(projectId),
    enabled: !!projectId,
  });
}

export function useAllTasks() {
  useRealtimeSubscription({
    table: 'tasks',
    queryKeys: [['all-tasks']],
  });

  return useQuery({
    queryKey: ['all-tasks'],
    queryFn: fetchAllTasks,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['all-tasks'] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...updates }: { id: string } & Partial<Record<string, unknown>>) =>
      updateTask(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['all-tasks'] });
    },
  });
}

export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) =>
      updateTaskStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['all-tasks'] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['all-tasks'] });
    },
  });
}
