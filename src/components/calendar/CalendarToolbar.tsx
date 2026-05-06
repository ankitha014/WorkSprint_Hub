import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

type ViewMode = 'month' | 'week';

interface CalendarToolbarProps {
  currentDate: Date;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

export function CalendarToolbar({ currentDate, viewMode, onViewModeChange, onPrev, onNext, onToday }: CalendarToolbarProps) {
  const label = viewMode === 'month'
    ? format(currentDate, 'MMMM yyyy')
    : `Week of ${format(currentDate, 'MMM d, yyyy')}`;

  return (
    <div className="flex items-center justify-between gap-4 mb-4">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onToday} className="text-xs">
          Today
        </Button>
        <div className="flex items-center">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onPrev}>
            <ChevronLeft size={16} />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onNext}>
            <ChevronRight size={16} />
          </Button>
        </div>
        <h3 className="text-sm font-semibold text-foreground min-w-[160px]">{label}</h3>
      </div>

      <div className="flex rounded-lg border border-border overflow-hidden">
        <button
          onClick={() => onViewModeChange('month')}
          className={cn(
            'px-3 py-1.5 text-xs font-medium transition-colors',
            viewMode === 'month' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:text-foreground'
          )}
        >
          Month
        </button>
        <button
          onClick={() => onViewModeChange('week')}
          className={cn(
            'px-3 py-1.5 text-xs font-medium transition-colors border-l border-border',
            viewMode === 'week' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:text-foreground'
          )}
        >
          Week
        </button>
      </div>
    </div>
  );
}
