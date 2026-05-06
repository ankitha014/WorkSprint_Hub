import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, formatDistanceToNow } from 'date-fns';
import { Activity, Loader2 } from 'lucide-react';

interface ActivityItem {
  id: string;
  action: string;
  entity_type: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  project_id: string;
}

async function fetchRecentActivity() {
  const { data, error } = await supabase
    .from('activity_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);
  if (error) throw error;
  return data as unknown as ActivityItem[];
}

function getActivityIcon(action: string) {
  const iconMap: Record<string, string> = {
    created: '✨',
    updated: '✏️',
    deleted: '🗑️',
    completed: '✅',
    assigned: '👤',
    commented: '💬',
  };
  return iconMap[action] || '📋';
}

function getActivityText(item: ActivityItem) {
  const name = (item.metadata as Record<string, string>)?.title || item.entity_type;
  return `${item.action} ${item.entity_type} "${name}"`;
}

export function ActivityFeed() {
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['recent-activity'],
    queryFn: fetchRecentActivity,
  });

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Activity size={18} className="text-primary" />
        <h2 className="font-heading font-semibold text-lg text-foreground">Recent Activity</h2>
      </div>
      <div className="glass-card rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={20} className="animate-spin text-muted-foreground" />
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Activity className="mx-auto mb-3 text-muted-foreground" size={28} />
            <p className="text-sm text-muted-foreground">No activity yet. Start by creating a project!</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {activities.map((item) => (
              <div key={item.id} className="flex items-start gap-3 p-4 hover:bg-muted/30 transition-colors">
                <span className="text-base mt-0.5 shrink-0">{getActivityIcon(item.action)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground capitalize leading-snug">
                    {getActivityText(item)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
