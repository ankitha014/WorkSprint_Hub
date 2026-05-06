import type { Task } from '@/types';
import { Calendar, User, GripVertical, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isPast, isToday } from 'date-fns';

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
}

const priorityStyles: Record<string, string> = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-warning/10 text-warning',
  high: 'bg-destructive/10 text-destructive',
  urgent: 'bg-destructive text-destructive-foreground',
};

export function TaskCard({ task, onClick }: TaskCardProps) {
  const isOverdue = task.due_date && isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date)) && task.status !== 'completed';

  const isCompleted = task.status === 'completed';

  return (
    <div className="task-card-item group animate-fade-up press-bounce" onClick={onClick}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full transition-colors duration-300",
            priorityStyles[task.priority]
          )}>
            {task.priority}
          </span>
        </div>
        <GripVertical size={14} className="text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab shrink-0" />
      </div>
      <h4 className={cn(
        "font-medium text-sm text-card-foreground mb-1.5 leading-snug transition-all duration-300",
        isCompleted && "line-through text-card-foreground/50"
      )}>{task.title}</h4>
      {task.description && (
        <p className="text-xs text-white/70 line-clamp-2 mb-3">{task.description}</p>
      )}
      <div className="flex items-center justify-between text-xs text-white/70">
        <div className="flex items-center gap-3">
          {task.due_date && (
            <div className={cn(
              "flex items-center gap-1",
              isOverdue && "text-destructive-foreground font-medium"
            )}>
              <Calendar size={12} />
              <span>{format(new Date(task.due_date), 'MMM d')}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {task.assignee_id && (
            <div className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center" title="Assigned">
              <User size={12} className="text-white" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
