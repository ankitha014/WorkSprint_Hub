import { useRef, useState, useCallback } from 'react';
import { differenceInDays, addDays, format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Task } from '@/types';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface TaskTimelineBarProps {
  task: Task;
  startDate: Date;
  dayWidth: number;
  onDueDateChange?: (taskId: string, newDate: string) => void;
  onClick?: (task: Task) => void;
  readOnly?: boolean;
}

const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'bg-destructive/80 border-destructive',
  high: 'bg-warning/80 border-warning',
  medium: 'bg-primary/70 border-primary',
  low: 'bg-muted-foreground/50 border-muted-foreground',
};

const STATUS_OPACITY: Record<string, string> = {
  completed: 'opacity-60',
  'in-progress': '',
  todo: '',
};

export function TaskTimelineBar({ task, startDate, dayWidth, onDueDateChange, onClick, readOnly }: TaskTimelineBarProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  const taskCreated = new Date(task.created_at);
  const taskDue = task.due_date ? new Date(task.due_date) : addDays(taskCreated, 3);

  const startOffset = Math.max(0, differenceInDays(taskCreated, startDate));
  const duration = Math.max(1, differenceInDays(taskDue, taskCreated) + 1);

  const left = startOffset * dayWidth;
  const width = duration * dayWidth;

  const handleResizeEnd = useCallback((e: React.MouseEvent) => {
    if (readOnly || !onDueDateChange) return;
    e.stopPropagation();

    const startX = e.clientX;
    const startWidth = width;

    const onMouseMove = (ev: MouseEvent) => {
      setDragging(true);
      const delta = ev.clientX - startX;
      const newWidth = Math.max(dayWidth, startWidth + delta);
      if (barRef.current) {
        barRef.current.style.width = `${newWidth}px`;
      }
    };

    const onMouseUp = (ev: MouseEvent) => {
      setDragging(false);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);

      const delta = ev.clientX - startX;
      const daysDelta = Math.round(delta / dayWidth);
      if (daysDelta !== 0) {
        const newDue = addDays(taskDue, daysDelta);
        onDueDateChange(task.id, format(newDue, 'yyyy-MM-dd'));
      } else if (barRef.current) {
        barRef.current.style.width = `${width}px`;
      }
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [readOnly, onDueDateChange, width, dayWidth, taskDue, task.id]);

  const colorClass = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium;
  const opacityClass = STATUS_OPACITY[task.status] || '';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          ref={barRef}
          className={cn(
            'absolute h-7 rounded-md border cursor-pointer transition-shadow flex items-center group',
            colorClass,
            opacityClass,
            dragging ? 'shadow-lg z-20' : 'hover:shadow-md',
            task.status === 'completed' && 'bg-success/60 border-success'
          )}
          style={{ left, width, top: 4 }}
          onClick={() => onClick?.(task)}
        >
          <span className="text-[11px] font-medium text-primary-foreground px-2 truncate select-none">
            {task.title}
          </span>

          {/* Resize handle */}
          {!readOnly && onDueDateChange && (
            <div
              className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover:opacity-100 bg-foreground/20 rounded-r-md"
              onMouseDown={handleResizeEnd}
            />
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        <div className="space-y-0.5">
          <p className="font-medium">{task.title}</p>
          <p>Status: <span className="capitalize">{task.status}</span></p>
          <p>Priority: <span className="capitalize">{task.priority}</span></p>
          <p>Created: {format(taskCreated, 'MMM d')}</p>
          <p>Due: {task.due_date ? format(taskDue, 'MMM d') : 'No due date'}</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
