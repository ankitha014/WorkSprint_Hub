import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { fetchTemplates, createTemplate, deleteTemplate } from '@/services/api/templates';
import type { ProjectTemplate, TemplateTask } from '@/services/api/templates';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { FileText, Plus, Trash2, Loader2, ListChecks, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onClose: () => void;
  onSelectTemplate: (template: ProjectTemplate) => void;
}

const priorityColors: Record<string, string> = {
  high: 'bg-destructive/10 text-destructive',
  medium: 'bg-warning/10 text-amber-600',
  low: 'bg-muted text-muted-foreground',
};

const defaultTasks: TemplateTask[] = [
  { title: '', description: '', priority: 'medium', status: 'todo' },
];

export function TemplatePickerModal({ open, onClose, onSelectTemplate }: Props) {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('browse');

  // Browse tab
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['project-templates', currentWorkspace?.id],
    queryFn: () => fetchTemplates(currentWorkspace?.id),
    enabled: open,
  });

  const deleteMut = useMutation({
    mutationFn: deleteTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-templates'] });
      toast.success('Template deleted');
    },
    onError: () => toast.error('Failed to delete template'),
  });

  // Create tab
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tasks, setTasks] = useState<TemplateTask[]>(defaultTasks);

  const resetCreate = () => {
    setName('');
    setDescription('');
    setTasks([{ title: '', description: '', priority: 'medium', status: 'todo' }]);
  };

  const addTask = () => {
    setTasks(prev => [...prev, { title: '', description: '', priority: 'medium', status: 'todo' }]);
  };

  const removeTask = (i: number) => {
    setTasks(prev => prev.filter((_, idx) => idx !== i));
  };

  const updateTask = (i: number, field: keyof TemplateTask, value: string) => {
    setTasks(prev => prev.map((t, idx) => idx === i ? { ...t, [field]: value } : t));
  };

  const handleCreate = async () => {
    if (!name.trim() || !user) return;
    const validTasks = tasks.filter(t => t.title.trim());
    try {
      await createTemplate({
        name: name.trim(),
        description: description.trim() || undefined,
        template_data: { tasks: validTasks },
        workspace_id: currentWorkspace?.id || null,
        created_by: user.id,
      });
      queryClient.invalidateQueries({ queryKey: ['project-templates'] });
      toast.success('Template created!');
      resetCreate();
      setTab('browse');
    } catch {
      toast.error('Failed to create template');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            <FileText size={18} className="text-primary" />
            Project Templates
          </DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="browse">Browse Templates</TabsTrigger>
            <TabsTrigger value="create">Create Template</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-4">
            <TabsContent value="browse" className="m-0 space-y-2">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 size={20} className="animate-spin text-muted-foreground" />
                </div>
              ) : templates.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="mx-auto mb-2 text-muted-foreground" size={28} />
                  <p className="text-sm text-muted-foreground">No templates yet</p>
                  <Button variant="link" size="sm" onClick={() => setTab('create')}>Create your first template</Button>
                </div>
              ) : (
                templates.map(t => (
                  <div key={t.id} className="rounded-xl border border-border p-4 hover:border-primary/30 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm text-foreground">{t.name}</h3>
                        {t.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{t.description}</p>}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className="text-[10px]">
                            <ListChecks size={10} className="mr-1" />
                            {t.template_data.tasks.length} tasks
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button size="sm" onClick={() => { onSelectTemplate(t); onClose(); }}>
                          Use
                        </Button>
                        {t.created_by === user?.id && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => deleteMut.mutate(t.id)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="create" className="m-0 space-y-4">
              <div>
                <Label>Template Name</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Marketing Campaign" />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What is this template for?" rows={2} className="resize-none" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Template Tasks</Label>
                  <Button type="button" variant="ghost" size="sm" onClick={addTask}>
                    <Plus size={14} className="mr-1" /> Add task
                  </Button>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {tasks.map((task, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Input
                        value={task.title}
                        onChange={e => updateTask(i, 'title', e.target.value)}
                        placeholder={`Task ${i + 1}`}
                        className="flex-1"
                      />
                      <select
                        value={task.priority}
                        onChange={e => updateTask(i, 'priority', e.target.value)}
                        className="h-9 rounded-md border border-input bg-background px-2 text-xs"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                      {tasks.length > 1 && (
                        <button onClick={() => removeTask(i)} className="text-muted-foreground hover:text-destructive p-1">
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <Button onClick={handleCreate} disabled={!name.trim()} className="w-full">
                Create Template
              </Button>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
