import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchTimeEntries, startTimer, stopTimer, logManualTime, deleteTimeEntry, getActiveTimer } from '@/services/api/timeEntries';
import { useAuth } from '@/contexts/AuthContext';

export function useTimeEntries(taskId: string) {
  return useQuery({
    queryKey: ['time-entries', taskId],
    queryFn: () => fetchTimeEntries(taskId),
    enabled: !!taskId,
  });
}

export function useActiveTimer() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['active-timer', user?.id],
    queryFn: () => getActiveTimer(user!.id),
    enabled: !!user,
    refetchInterval: 1000, // poll every second for live timer
  });
}

export function useStartTimer() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (taskId: string) => startTimer(taskId, user!.id),
    onSuccess: (_, taskId) => {
      queryClient.invalidateQueries({ queryKey: ['time-entries', taskId] });
      queryClient.invalidateQueries({ queryKey: ['active-timer'] });
    },
  });
}

export function useStopTimer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entryId: string) => stopTimer(entryId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['time-entries', data.task_id] });
      queryClient.invalidateQueries({ queryKey: ['active-timer'] });
    },
  });
}

export function useLogManualTime() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: ({ taskId, durationMinutes, description }: { taskId: string; durationMinutes: number; description?: string }) =>
      logManualTime(taskId, user!.id, durationMinutes, description),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: ['time-entries', taskId] });
    },
  });
}

export function useDeleteTimeEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTimeEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
    },
  });
}
