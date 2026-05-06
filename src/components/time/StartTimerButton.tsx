import { Play, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStartTimer, useStopTimer, useActiveTimer } from '@/hooks/useTimeEntries';
import { toast } from 'sonner';

interface StartTimerButtonProps {
  taskId: string;
  readOnly?: boolean;
}

export function StartTimerButton({ taskId, readOnly }: StartTimerButtonProps) {
  const { data: activeTimer } = useActiveTimer();
  const startTimer = useStartTimer();
  const stopTimer = useStopTimer();

  const isRunningForThis = activeTimer && activeTimer.task_id === taskId;
  const isRunningForOther = activeTimer && activeTimer.task_id !== taskId;

  const handleStart = async () => {
    if (isRunningForOther) {
      // Stop current timer first
      try {
        await stopTimer.mutateAsync(activeTimer!.id);
      } catch {
        toast.error('Failed to stop current timer');
        return;
      }
    }
    try {
      await startTimer.mutateAsync(taskId);
      toast.success('Timer started');
    } catch {
      toast.error('Failed to start timer');
    }
  };

  const handleStop = async () => {
    if (!activeTimer) return;
    try {
      await stopTimer.mutateAsync(activeTimer.id);
      toast.success('Timer stopped');
    } catch {
      toast.error('Failed to stop timer');
    }
  };

  if (readOnly) return null;

  if (isRunningForThis) {
    return (
      <Button variant="destructive" size="sm" onClick={handleStop} className="gap-1.5">
        <Square size={12} className="fill-current" />
        Stop
      </Button>
    );
  }

  return (
    <Button variant="outline" size="sm" onClick={handleStart} className="gap-1.5">
      <Play size={12} className="fill-current" />
      {isRunningForOther ? 'Switch' : 'Start Timer'}
    </Button>
  );
}
