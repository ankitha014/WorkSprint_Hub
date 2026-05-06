import { useMemo } from 'react';
import { format, addDays, startOfDay, differenceInDays, isWeekend } from 'date-fns';

interface TimelineHeaderProps {
  startDate: Date;
  totalDays: number;
  dayWidth: number;
}

export function TimelineHeader({ startDate, totalDays, dayWidth }: TimelineHeaderProps) {
  const days = useMemo(() => {
    return Array.from({ length: totalDays }, (_, i) => addDays(startDate, i));
  }, [startDate, totalDays]);

  // Group days by month
  const months = useMemo(() => {
    const map: { label: string; startIdx: number; count: number }[] = [];
    days.forEach((day, i) => {
      const label = format(day, 'MMM yyyy');
      const last = map[map.length - 1];
      if (last && last.label === label) {
        last.count++;
      } else {
        map.push({ label, startIdx: i, count: 1 });
      }
    });
    return map;
  }, [days]);

  return (
    <div className="sticky top-0 z-10 bg-card border-b border-border">
      {/* Month row */}
      <div className="flex" style={{ width: totalDays * dayWidth }}>
        {months.map((m) => (
          <div
            key={m.label + m.startIdx}
            className="text-xs font-semibold text-foreground px-2 py-1 border-r border-border truncate"
            style={{ width: m.count * dayWidth }}
          >
            {m.label}
          </div>
        ))}
      </div>
      {/* Day row */}
      <div className="flex" style={{ width: totalDays * dayWidth }}>
        {days.map((day, i) => (
          <div
            key={i}
            className={`text-[10px] text-center py-1 border-r border-border/50 ${
              isWeekend(day) ? 'bg-muted/50 text-muted-foreground' : 'text-muted-foreground'
            }`}
            style={{ width: dayWidth }}
          >
            {format(day, 'd')}
          </div>
        ))}
      </div>
    </div>
  );
}
