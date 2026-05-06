import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Trash2 } from 'lucide-react';
import { TaskComments } from './TaskComments';
import { FileUploader } from './FileUploader';
import { StartTimerButton } from '@/components/time/StartTimerButton';
import { TimeLogTable } from '@/components/time/TimeLogTable';
import type { TaskStatus, TaskPriority } from '@/types';

interface Member {
  user_id: string;
  profiles?: {
    full_name: string | null;
    email: string | null;
  } | null;
}

interface TaskModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description: string;
    priority: TaskPriority;
    status: TaskStatus;
    due_date: string | null;
    assignee_id: string | null;
  }) => void;
  onDelete?: () => void;
  defaultStatus?: TaskStatus;
  members?: Member[];
  taskId?: string;
  projectId?: string;
  readOnly?: boolean;
  initialData?: {
    title: string;
    description: string;
    priority: TaskPriority;
    status: TaskStatus;
    due_date: string | null;
    assignee_id: string | null;
  };
}

export function TaskModal({ open, onClose, onSubmit, onDelete, defaultStatus = 'todo', members = [], taskId, projectId, readOnly, initialData }: TaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [status, setStatus] = useState<TaskStatus>(defaultStatus);
  const [dueDate, setDueDate] = useState('');
  const [assigneeId, setAssigneeId] = useState<string>('unassigned');

  useEffect(() => {
    if (open) {
      setTitle(initialData?.title ?? '');
      setDescription(initialData?.description ?? '');
      setPriority(initialData?.priority ?? 'medium');
      setStatus(initialData?.status ?? defaultStatus);
      setDueDate(initialData?.due_date ?? '');
      setAssigneeId(initialData?.assignee_id ?? 'unassigned');
    }
  }, [open, initialData, defaultStatus]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      priority,
      status,
      due_date: dueDate || null,
      assignee_id: assigneeId === 'unassigned' ? null : assigneeId,
    });
    onClose();
  };

  const isEditing = !!initialData;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DialogTitle className="font-heading">{isEditing ? 'Edit Task' : 'New Task'}</DialogTitle>
              {isEditing && taskId && !readOnly && (
                <StartTimerButton taskId={taskId} readOnly={readOnly} />
              )}
            </div>
            {isEditing && onDelete && (
              <Button variant="ghost" size="sm" onClick={onDelete} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                <Trash2 size={14} className="mr-1" /> Delete
              </Button>
            )}
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <Label htmlFor="task-title">Title</Label>
            <Input id="task-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What needs to be done?" />
          </div>
          <div>
            <Label htmlFor="task-desc">Description</Label>
            <Textarea id="task-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add details, context, or notes..." rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">🟢 Low</SelectItem>
                  <SelectItem value="medium">🟡 Medium</SelectItem>
                  <SelectItem value="high">🟠 High</SelectItem>
                  <SelectItem value="urgent">🔴 Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="task-due">Due Date</Label>
              <Input id="task-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div>
              <Label>Assign To</Label>
              <Select value={assigneeId} onValueChange={setAssigneeId}>
                <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {members.map((m) => (
                    <SelectItem key={m.user_id} value={m.user_id}>
                      {m.profiles?.full_name || m.profiles?.email || 'Unknown'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">{isEditing ? 'Save Changes' : 'Create Task'}</Button>
          </div>
        </form>

        {isEditing && taskId && (
          <>
            <Separator className="my-2" />
            <TimeLogTable taskId={taskId} readOnly={readOnly} />
            <Separator className="my-2" />
            <FileUploader taskId={taskId} />
            <Separator className="my-2" />
            <TaskComments
              taskId={taskId}
              taskTitle={title}
              assigneeId={assigneeId === 'unassigned' ? null : assigneeId}
              projectId={projectId}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
