import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type TableName = 'tasks' | 'task_comments' | 'projects' | 'activity_log' | 'project_members' | 'notifications';

interface UseRealtimeOptions {
  table: TableName;
  queryKeys: string[][];
  filter?: string;
}

export function useRealtimeSubscription({ table, queryKeys, filter }: UseRealtimeOptions) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const uniqueId = Math.random().toString(36).slice(2, 10);
    const channelName = filter
      ? `${table}-${filter}-${uniqueId}`
      : `realtime-${table}-${uniqueId}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          ...(filter ? { filter } : {}),
        },
        () => {
          queryKeys.forEach((key) => {
            queryClient.invalidateQueries({ queryKey: key });
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, filter, queryClient, JSON.stringify(queryKeys)]);
}
