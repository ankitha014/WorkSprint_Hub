import { cn } from '@/lib/utils';
import type { Task } from '@/types';

interface CalendarTaskCardProps {
  task: Task;
  onClick?: (task: Task) => void;
  compact?: boolean;
}

const PRIORITY_DOT: Record<string, string> = {
  urgent: 'bg-destructive',
  high: 'bg-warning',
  medium: 'bg-primary',
  low: 'bg-muted-foreground',
};

const STATUS_STYLE: Record<string, string> = {
  completed: 'line-through opacity-60',
  'in-progress': '',
  todo: '',
};

export function CalendarTaskCard({ task, onClick, compact }: CalendarTaskCardProps) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick?.(task); }}
      className={cn(
        'w-full text-left rounded-md px-1.5 py-0.5 text-[11px] leading-tight truncate transition-colors',
        'hover:bg-primary/10 group cursor-pointer',
        task.status === 'completed' && 'opacity-60',
      )}
    >
      <span className="flex items-center gap-1 min-w-0">
        <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', PRIORITY_DOT[task.priority] || PRIORITY_DOT.medium)} />
        <span className={cn('truncate', STATUS_STYLE[task.status])}>
          {task.title}
        </span>
      </span>
    </button>
  );
}
