import { useMemo, useRef, useState } from 'react';
import { startOfDay, addDays, differenceInDays, subDays, isWeekend } from 'date-fns';
import { TimelineHeader } from './TimelineHeader';
import { TaskTimelineBar } from './TaskTimelineBar';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut } from 'lucide-react';
import type { Task } from '@/types';
import { cn } from '@/lib/utils';

interface GanttChartProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onDueDateChange?: (taskId: string, newDate: string) => void;
  readOnly?: boolean;
}

const ROW_HEIGHT = 36;
const MIN_DAY_WIDTH = 20;
const MAX_DAY_WIDTH = 60;

export function GanttChart({ tasks, onTaskClick, onDueDateChange, readOnly }: GanttChartProps) {
  const [dayWidth, setDayWidth] = useState(32);

  const { startDate, totalDays, sortedTasks } = useMemo(() => {
    if (tasks.length === 0) {
      const today = startOfDay(new Date());
      return { startDate: subDays(today, 7), totalDays: 60, sortedTasks: [] };
    }

    const dates = tasks.flatMap(t => {
      const created = new Date(t.created_at);
      const due = t.due_date ? new Date(t.due_date) : addDays(created, 3);
      return [created, due];
    });

    const minDate = subDays(startOfDay(new Date(Math.min(...dates.map(d => d.getTime())))), 3);
    const maxDate = addDays(startOfDay(new Date(Math.max(...dates.map(d => d.getTime())))), 10);
    const totalDays = Math.max(30, differenceInDays(maxDate, minDate) + 1);

    // Sort: by status (in-progress first), then by created_at
    const statusOrder = { 'in-progress': 0, 'todo': 1, 'completed': 2 };
    const sorted = [...tasks].sort((a, b) => {
      const sa = statusOrder[a.status as keyof typeof statusOrder] ?? 1;
      const sb = statusOrder[b.status as keyof typeof statusOrder] ?? 1;
      if (sa !== sb) return sa - sb;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

    return { startDate: minDate, totalDays, sortedTasks: sorted };
  }, [tasks]);

  const handleZoomIn = () => setDayWidth(w => Math.min(MAX_DAY_WIDTH, w + 6));
  const handleZoomOut = () => setDayWidth(w => Math.max(MIN_DAY_WIDTH, w - 6));

  // Today line
  const todayOffset = differenceInDays(startOfDay(new Date()), startDate);

  if (tasks.length === 0) {
    return (
      <div className="glass-card rounded-xl p-12 text-center">
        <p className="text-muted-foreground">No tasks to display on timeline. Create tasks with due dates to see them here.</p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-xl overflow-hidden border border-border">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
        <span className="text-sm font-medium text-foreground">{tasks.length} task{tasks.length !== 1 ? 's' : ''}</span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleZoomOut} disabled={dayWidth <= MIN_DAY_WIDTH}>
            <ZoomOut size={14} />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleZoomIn} disabled={dayWidth >= MAX_DAY_WIDTH}>
            <ZoomIn size={14} />
          </Button>
        </div>
      </div>

      <div className="flex">
        {/* Task labels sidebar */}
        <div className="shrink-0 w-48 border-r border-border bg-card z-10">
          {/* Header spacer */}
          <div className="h-[52px] border-b border-border flex items-end px-3 pb-1">
            <span className="text-xs font-medium text-muted-foreground">Task</span>
          </div>
          {sortedTasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-2 px-3 border-b border-border/30 cursor-pointer hover:bg-muted/50 transition-colors"
              style={{ height: ROW_HEIGHT }}
              onClick={() => onTaskClick?.(task)}
            >
              <div className={cn(
                'w-2 h-2 rounded-full shrink-0',
                task.status === 'completed' && 'bg-success',
                task.status === 'in-progress' && 'bg-warning',
                task.status === 'todo' && 'bg-muted-foreground',
              )} />
              <span className="text-xs text-foreground truncate">{task.title}</span>
            </div>
          ))}
        </div>

        {/* Timeline area */}
        <ScrollArea className="flex-1">
          <div style={{ width: totalDays * dayWidth }}>
            <TimelineHeader startDate={startDate} totalDays={totalDays} dayWidth={dayWidth} />

            <div className="relative">
              {/* Weekend shading + grid */}
              <div className="absolute inset-0 flex pointer-events-none" style={{ width: totalDays * dayWidth }}>
                {Array.from({ length: totalDays }, (_, i) => {
                  const day = addDays(startDate, i);
                  return (
                    <div
                      key={i}
                      className={cn(
                        'border-r border-border/20',
                        isWeekend(day) && 'bg-muted/30'
                      )}
                      style={{ width: dayWidth, height: sortedTasks.length * ROW_HEIGHT }}
                    />
                  );
                })}
              </div>

              {/* Today marker */}
              {todayOffset >= 0 && todayOffset < totalDays && (
                <div
                  className="absolute top-0 w-0.5 bg-destructive z-10"
                  style={{
                    left: todayOffset * dayWidth + dayWidth / 2,
                    height: sortedTasks.length * ROW_HEIGHT,
                  }}
                />
              )}

              {/* Task bars */}
              {sortedTasks.map((task, idx) => (
                <div key={task.id} className="relative border-b border-border/20" style={{ height: ROW_HEIGHT }}>
                  <TaskTimelineBar
                    task={task}
                    startDate={startDate}
                    dayWidth={dayWidth}
                    onDueDateChange={onDueDateChange}
                    onClick={onTaskClick}
                    readOnly={readOnly}
                  />
                </div>
              ))}
            </div>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </div>
  );
}
