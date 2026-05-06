import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Workspace } from '@/types';

const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6'];

export interface ProjectFormData {
  name: string;
  description: string;
  color: string;
  workspace_id?: string;
  due_date?: string;
  priority: string;
}

interface ProjectFormProps {
  workspaces: Workspace[];
  currentWorkspaceId?: string;
  onSubmit: (data: ProjectFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function ProjectForm({ workspaces, currentWorkspaceId, onSubmit, onCancel, isSubmitting }: ProjectFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#6366f1');
  const [workspaceId, setWorkspaceId] = useState(currentWorkspaceId || '');
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [priority, setPriority] = useState('medium');

  useEffect(() => {
    if (currentWorkspaceId) setWorkspaceId(currentWorkspaceId);
  }, [currentWorkspaceId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      description: description.trim(),
      color,
      workspace_id: workspaceId || undefined,
      due_date: dueDate ? format(dueDate, 'yyyy-MM-dd') : undefined,
      priority,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-2">
      <div>
        <Label htmlFor="proj-name">Project Name *</Label>
        <Input id="proj-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="My Project" required />
      </div>

      <div>
        <Label htmlFor="proj-desc">Description</Label>
        <Textarea id="proj-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's this project about?" rows={3} />
      </div>

      <div>
        <Label>Workspace</Label>
        <Select value={workspaceId} onValueChange={setWorkspaceId}>
          <SelectTrigger className="w-full mt-1">
            <SelectValue placeholder="Select workspace" />
          </SelectTrigger>
          <SelectContent>
            {workspaces.map((ws) => (
              <SelectItem key={ws.id} value={ws.id}>{ws.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Due Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn("w-full mt-1 justify-start text-left font-normal", !dueDate && "text-muted-foreground")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dueDate ? format(dueDate, 'PPP') : 'Pick a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dueDate}
                onSelect={setDueDate}
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <Label>Priority</Label>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger className="w-full mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>Color</Label>
        <div className="flex gap-2 mt-2">
          {colors.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className="w-8 h-8 rounded-full transition-transform hover:scale-110"
              style={{
                backgroundColor: c,
                outline: color === c ? '2px solid currentColor' : 'none',
                outlineOffset: '2px',
              }}
            />
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Create Project'}</Button>
      </div>
    </form>
  );
}
