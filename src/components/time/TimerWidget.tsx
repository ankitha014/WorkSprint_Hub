import { useEffect, useState } from 'react';
import { useActiveTimer, useStopTimer } from '@/hooks/useTimeEntries';
import { Clock, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function TimerWidget() {
  const { data: activeTimer } = useActiveTimer();
  const stopTimer = useStopTimer();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!activeTimer) { setElapsed(0); return; }

    const startTime = new Date(activeTimer.start_time).getTime();
    const update = () => setElapsed(Math.floor((Date.now() - startTime) / 1000));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [activeTimer]);

  if (!activeTimer) return null;

  const handleStop = async () => {
    try {
      await stopTimer.mutateAsync(activeTimer.id);
      toast.success('Timer stopped');
    } catch {
      toast.error('Failed to stop timer');
    }
  };

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
      <Clock size={14} className="text-primary animate-pulse" />
      <span className="text-sm font-mono font-semibold text-primary tabular-nums">
        {formatElapsed(elapsed)}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 text-destructive hover:bg-destructive/10"
        onClick={handleStop}
      >
        <Square size={10} className="fill-current" />
      </Button>
    </div>
  );
}
