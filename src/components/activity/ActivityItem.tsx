import { formatDistanceToNow } from 'date-fns';
import { UserAvatar } from './UserAvatar';
import { cn } from '@/lib/utils';
import type { ActivityLog } from '@/types';
import {
  CheckCircle2, PlusCircle, Edit3, MessageSquare, UserPlus, Trash2, ArrowRightLeft,
} from 'lucide-react';

interface ActivityItemProps {
  activity: ActivityLog;
  isLast?: boolean;
}

const ACTION_CONFIG: Record<string, { icon: typeof PlusCircle; color: string; label: string }> = {
  created: { icon: PlusCircle, color: 'text-success', label: 'created' },
  updated: { icon: Edit3, color: 'text-primary', label: 'updated' },
  completed: { icon: CheckCircle2, color: 'text-success', label: 'completed' },
  deleted: { icon: Trash2, color: 'text-destructive', label: 'deleted' },
  commented: { icon: MessageSquare, color: 'text-accent', label: 'commented on' },
  joined: { icon: UserPlus, color: 'text-primary', label: 'joined' },
  assigned: { icon: ArrowRightLeft, color: 'text-warning', label: 'assigned' },
  moved: { icon: ArrowRightLeft, color: 'text-warning', label: 'moved' },
};

function getConfig(action: string) {
  return ACTION_CONFIG[action] || { icon: PlusCircle, color: 'text-muted-foreground', label: action };
}

export function ActivityItem({ activity, isLast }: ActivityItemProps) {
  const config = getConfig(activity.action);
  const Icon = config.icon;
  const meta = activity.metadata as Record<string, string> | null;
  const entityName = meta?.title || meta?.name || activity.entity_type;
  const userName = activity.profiles?.full_name || activity.profiles?.email || 'Someone';

  return (
    <div className="flex gap-3 relative">
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-[15px] top-8 bottom-0 w-px bg-border" />
      )}

      {/* Icon */}
      <div className={cn('w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-card border border-border z-10', config.color)}>
        <Icon size={14} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pb-6">
        <div className="flex items-start gap-2">
          <UserAvatar profile={activity.profiles} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground leading-snug">
              <span className="font-medium">{userName}</span>
              {' '}
              <span className="text-muted-foreground">{config.label}</span>
              {' '}
              <span className="font-medium">{activity.entity_type}</span>
              {entityName !== activity.entity_type && (
                <span className="text-muted-foreground"> "{entityName}"</span>
              )}
            </p>
            {meta?.from && meta?.to && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {meta.from} → {meta.to}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
