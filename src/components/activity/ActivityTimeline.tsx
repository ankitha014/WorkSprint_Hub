import { useQuery } from '@tanstack/react-query';
import { fetchActivityLog } from '@/services/api/activity';
import { ActivityItem } from './ActivityItem';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { Activity, Loader2 } from 'lucide-react';

interface ActivityTimelineProps {
  projectId: string;
}

export function ActivityTimeline({ projectId }: ActivityTimelineProps) {
  useRealtimeSubscription({
    table: 'activity_log',
    filter: `project_id=eq.${projectId}`,
    queryKeys: [['activity-log', projectId]],
  });

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['activity-log', projectId],
    queryFn: () => fetchActivityLog(projectId),
    enabled: !!projectId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={20} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="glass-card rounded-xl p-12 text-center">
        <Activity className="mx-auto mb-3 text-muted-foreground" size={28} />
        <p className="text-sm text-muted-foreground">No activity yet. Actions like creating tasks and adding comments will appear here.</p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-xl p-6">
      <div className="flex items-center gap-2 mb-6">
        <Activity size={16} className="text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Activity Timeline</h3>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {activities.length} events
        </span>
      </div>
      <div>
        {activities.map((activity, idx) => (
          <ActivityItem
            key={activity.id}
            activity={activity}
            isLast={idx === activities.length - 1}
          />
        ))}
      </div>
    </div>
  );
}
