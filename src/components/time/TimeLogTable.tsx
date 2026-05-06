import { useState } from 'react';
import { useTimeEntries, useLogManualTime, useDeleteTimeEntry } from '@/hooks/useTimeEntries';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Plus, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface TimeLogTableProps {
  taskId: string;
  readOnly?: boolean;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  if (m > 0) return `${m}m`;
  return `${seconds}s`;
}

export function TimeLogTable({ taskId, readOnly }: TimeLogTableProps) {
  const { user } = useAuth();
  const { data: entries = [], isLoading } = useTimeEntries(taskId);
  const logManual = useLogManualTime();
  const deleteEntry = useDeleteTimeEntry();
  const [showManual, setShowManual] = useState(false);
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [description, setDescription] = useState('');

  const completedEntries = entries.filter(e => e.end_time);
  const totalSeconds = completedEntries.reduce((sum, e) => sum + e.duration, 0);

  const handleLogManual = async () => {
    const h = parseInt(hours) || 0;
    const m = parseInt(minutes) || 0;
    const totalMins = h * 60 + m;
    if (totalMins <= 0) { toast.error('Enter a valid duration'); return; }
    try {
      await logManual.mutateAsync({ taskId, durationMinutes: totalMins, description: description.trim() || undefined });
      toast.success('Time logged');
      setHours(''); setMinutes(''); setDescription(''); setShowManual(false);
    } catch {
      toast.error('Failed to log time');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteEntry.mutateAsync(id);
      toast.success('Entry deleted');
    } catch {
      toast.error('Failed to delete entry');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Time Tracking</span>
          {totalSeconds > 0 && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              Total: {formatDuration(totalSeconds)}
            </span>
          )}
        </div>
        {!readOnly && (
          <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setShowManual(!showManual)}>
            <Plus size={12} className="mr-1" /> Log Time
          </Button>
        )}
      </div>

      {showManual && (
        <div className="p-3 rounded-lg border border-border bg-muted/30 space-y-3">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label className="text-xs">Hours</Label>
              <Input type="number" min="0" value={hours} onChange={(e) => setHours(e.target.value)} placeholder="0" className="h-8" />
            </div>
            <div className="flex-1">
              <Label className="text-xs">Minutes</Label>
              <Input type="number" min="0" max="59" value={minutes} onChange={(e) => setMinutes(e.target.value)} placeholder="0" className="h-8" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Description (optional)</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What did you work on?" className="h-8" />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowManual(false)}>Cancel</Button>
            <Button size="sm" onClick={handleLogManual} disabled={logManual.isPending}>Log</Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-8 bg-muted rounded animate-pulse" />)}</div>
      ) : completedEntries.length === 0 ? (
        <p className="text-xs text-muted-foreground">No time logged yet</p>
      ) : (
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {completedEntries.map((entry) => (
            <div key={entry.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50 group text-xs">
              <span className="font-mono font-medium text-foreground w-14 shrink-0">
                {formatDuration(entry.duration)}
              </span>
              <span className="text-muted-foreground truncate flex-1">
                {entry.description || format(new Date(entry.start_time), 'MMM d, h:mm a')}
              </span>
              {!readOnly && entry.user_id === user?.id && (
                <button
                  onClick={() => handleDelete(entry.id)}
                  className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive/80 transition-opacity"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
