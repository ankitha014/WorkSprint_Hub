import { useState, useMemo } from 'react';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addMonths, subMonths, addWeeks, subWeeks,
  eachDayOfInterval, isSameMonth, isSameDay, isToday,
  format, parseISO,
} from 'date-fns';
import { CalendarToolbar } from './CalendarToolbar';
import { CalendarTaskCard } from './CalendarTaskCard';
import { cn } from '@/lib/utils';
import type { Task } from '@/types';

type ViewMode = 'month' | 'week';

interface TaskCalendarProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function TaskCalendar({ tasks, onTaskClick }: TaskCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');

  const days = useMemo(() => {
    if (viewMode === 'month') {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const calStart = startOfWeek(monthStart);
      const calEnd = endOfWeek(monthEnd);
      return eachDayOfInterval({ start: calStart, end: calEnd });
    } else {
      const weekStart = startOfWeek(currentDate);
      const weekEnd = endOfWeek(currentDate);
      return eachDayOfInterval({ start: weekStart, end: weekEnd });
    }
  }, [currentDate, viewMode]);

  // Map tasks to dates by due_date
  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    tasks.forEach(task => {
      if (!task.due_date) return;
      const key = task.due_date; // yyyy-MM-dd
      const existing = map.get(key) || [];
      existing.push(task);
      map.set(key, existing);
    });
    return map;
  }, [tasks]);

  const handlePrev = () => {
    setCurrentDate(prev => viewMode === 'month' ? subMonths(prev, 1) : subWeeks(prev, 1));
  };
  const handleNext = () => {
    setCurrentDate(prev => viewMode === 'month' ? addMonths(prev, 1) : addWeeks(prev, 1));
  };
  const handleToday = () => setCurrentDate(new Date());

  const tasksWithoutDueDate = tasks.filter(t => !t.due_date);

  return (
    <div className="glass-card rounded-xl overflow-hidden border border-border">
      <div className="p-4 bg-card border-b border-border">
        <CalendarToolbar
          currentDate={currentDate}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onPrev={handlePrev}
          onNext={handleNext}
          onToday={handleToday}
        />
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-border bg-muted/30">
        {WEEKDAYS.map(day => (
          <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className={cn(
        'grid grid-cols-7',
        viewMode === 'week' ? 'auto-rows-[200px]' : 'auto-rows-[120px]'
      )}>
        {days.map((day, idx) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayTasks = tasksByDate.get(dateKey) || [];
          const isCurrentMonth = viewMode === 'month' ? isSameMonth(day, currentDate) : true;
          const today = isToday(day);
          const maxVisible = viewMode === 'week' ? 8 : 3;
          const overflow = dayTasks.length - maxVisible;

          return (
            <div
              key={idx}
              className={cn(
                'border-b border-r border-border/50 p-1 overflow-hidden transition-colors',
                !isCurrentMonth && 'bg-muted/20',
                today && 'bg-primary/5',
              )}
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className={cn(
                  'text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full',
                  today && 'bg-primary text-primary-foreground',
                  !today && isCurrentMonth && 'text-foreground',
                  !today && !isCurrentMonth && 'text-muted-foreground',
                )}>
                  {format(day, 'd')}
                </span>
              </div>
              <div className="space-y-0.5">
                {dayTasks.slice(0, maxVisible).map(task => (
                  <CalendarTaskCard key={task.id} task={task} onClick={onTaskClick} />
                ))}
                {overflow > 0 && (
                  <span className="text-[10px] text-muted-foreground px-1.5">
                    +{overflow} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Tasks without due dates */}
      {tasksWithoutDueDate.length > 0 && (
        <div className="p-3 border-t border-border bg-card">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            No due date ({tasksWithoutDueDate.length})
          </p>
          <div className="flex flex-wrap gap-1">
            {tasksWithoutDueDate.slice(0, 10).map(task => (
              <CalendarTaskCard key={task.id} task={task} onClick={onTaskClick} compact />
            ))}
            {tasksWithoutDueDate.length > 10 && (
              <span className="text-[10px] text-muted-foreground self-center">
                +{tasksWithoutDueDate.length - 10} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
