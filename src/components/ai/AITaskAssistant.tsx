import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Wand2, ListChecks, BarChart3, Loader2, Copy, Plus, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

interface SuggestedTask {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
}

interface AITaskAssistantProps {
  projectName?: string;
  projectDescription?: string;
  projectContext?: string; // summary of tasks/progress
  onGenerateDescription?: (description: string) => void;
  onCreateTasks?: (tasks: SuggestedTask[]) => void;
  triggerClassName?: string;
}

const priorityColors: Record<string, string> = {
  high: 'bg-destructive/10 text-destructive',
  medium: 'bg-warning/10 text-amber-600',
  low: 'bg-muted text-muted-foreground',
};

export function AITaskAssistant({
  projectName,
  projectDescription,
  projectContext,
  onGenerateDescription,
  onCreateTasks,
  triggerClassName,
}: AITaskAssistantProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('generate');

  // Generate description state
  const [taskTitle, setTaskTitle] = useState('');
  const [generatedDesc, setGeneratedDesc] = useState('');

  // Break into tasks state
  const [suggestedTasks, setSuggestedTasks] = useState<SuggestedTask[]>([]);
  const [addedTasks, setAddedTasks] = useState<Set<number>>(new Set());

  // Summarize state
  const [summary, setSummary] = useState('');

  const callAI = async (type: string, prompt: string, context?: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-task-assistant', {
        body: { type, prompt, context },
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return null;
      }
      return data;
    } catch (e: any) {
      toast.error(e.message || 'AI request failed');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!taskTitle.trim()) return;
    const result = await callAI('generate-description', taskTitle.trim());
    if (result?.content) setGeneratedDesc(result.content);
  };

  const handleBreakIntoTasks = async () => {
    const prompt = `Project: ${projectName || 'Untitled'}\nDescription: ${projectDescription || 'No description'}`;
    const result = await callAI('break-into-tasks', prompt);
    if (result?.tasks) {
      setSuggestedTasks(result.tasks);
      setAddedTasks(new Set());
    }
  };

  const handleSummarize = async () => {
    if (!projectContext) {
      toast.error('No project data available to summarize');
      return;
    }
    const result = await callAI('summarize-progress', `Project: ${projectName}`, projectContext);
    if (result?.content) setSummary(result.content);
  };

  const handleUseDescription = () => {
    if (generatedDesc && onGenerateDescription) {
      onGenerateDescription(generatedDesc);
      toast.success('Description applied');
    }
  };

  const handleAddTask = (index: number) => {
    if (onCreateTasks && !addedTasks.has(index)) {
      onCreateTasks([suggestedTasks[index]]);
      setAddedTasks(prev => new Set(prev).add(index));
      toast.success(`Task "${suggestedTasks[index].title}" added`);
    }
  };

  const handleAddAllTasks = () => {
    if (onCreateTasks) {
      const unadded = suggestedTasks.filter((_, i) => !addedTasks.has(i));
      if (unadded.length > 0) {
        onCreateTasks(unadded);
        setAddedTasks(new Set(suggestedTasks.map((_, i) => i)));
        toast.success(`${unadded.length} tasks added`);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={cn("gap-1.5", triggerClassName)}>
          <Sparkles size={14} className="text-primary" />
          AI Assistant
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            <Sparkles size={18} className="text-primary" />
            AI Task Assistant
          </DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="generate" className="gap-1.5 text-xs">
              <Wand2 size={13} /> Describe
            </TabsTrigger>
            <TabsTrigger value="breakdown" className="gap-1.5 text-xs">
              <ListChecks size={13} /> Breakdown
            </TabsTrigger>
            <TabsTrigger value="summarize" className="gap-1.5 text-xs">
              <BarChart3 size={13} /> Summarize
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-4">
            {/* Generate Description */}
            <TabsContent value="generate" className="m-0 space-y-3">
              <p className="text-sm text-muted-foreground">Enter a task title and AI will generate a detailed description.</p>
              <Textarea
                placeholder="e.g., Implement user onboarding flow"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                rows={2}
                className="resize-none"
              />
              <Button onClick={handleGenerate} disabled={loading || !taskTitle.trim()} className="w-full">
                {loading ? <Loader2 size={14} className="animate-spin mr-2" /> : <Wand2 size={14} className="mr-2" />}
                Generate Description
              </Button>
              {generatedDesc && (
                <div className="rounded-xl bg-muted/50 border border-border p-4 space-y-3">
                  <div className="prose prose-sm text-sm text-foreground max-w-none">
                    <ReactMarkdown>{generatedDesc}</ReactMarkdown>
                  </div>
                  <div className="flex gap-2">
                    {onGenerateDescription && (
                      <Button size="sm" onClick={handleUseDescription}>
                        <CheckCircle2 size={13} className="mr-1" /> Use this
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(generatedDesc); toast.success('Copied!'); }}>
                      <Copy size={13} className="mr-1" /> Copy
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Break into Tasks */}
            <TabsContent value="breakdown" className="m-0 space-y-3">
              <p className="text-sm text-muted-foreground">
                AI will analyze <span className="font-medium text-foreground">{projectName || 'your project'}</span> and suggest actionable tasks.
              </p>
              <Button onClick={handleBreakIntoTasks} disabled={loading} className="w-full">
                {loading ? <Loader2 size={14} className="animate-spin mr-2" /> : <ListChecks size={14} className="mr-2" />}
                Generate Tasks
              </Button>
              {suggestedTasks.length > 0 && (
                <div className="space-y-2">
                  {onCreateTasks && (
                    <div className="flex justify-end">
                      <Button size="sm" variant="outline" onClick={handleAddAllTasks} disabled={addedTasks.size === suggestedTasks.length}>
                        <Plus size={13} className="mr-1" /> Add all tasks
                      </Button>
                    </div>
                  )}
                  {suggestedTasks.map((task, i) => (
                    <div key={i} className="rounded-lg border border-border p-3 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-foreground">{task.title}</span>
                        <div className="flex items-center gap-1.5">
                          <Badge variant="secondary" className={cn("text-[10px]", priorityColors[task.priority])}>
                            {task.priority}
                          </Badge>
                          {onCreateTasks && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              disabled={addedTasks.has(i)}
                              onClick={() => handleAddTask(i)}
                            >
                              {addedTasks.has(i) ? <CheckCircle2 size={14} className="text-green-500" /> : <Plus size={14} />}
                            </Button>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">{task.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Summarize Progress */}
            <TabsContent value="summarize" className="m-0 space-y-3">
              <p className="text-sm text-muted-foreground">Get an AI-powered summary of project progress and recommendations.</p>
              <Button onClick={handleSummarize} disabled={loading || !projectContext} className="w-full">
                {loading ? <Loader2 size={14} className="animate-spin mr-2" /> : <BarChart3 size={14} className="mr-2" />}
                Summarize Progress
              </Button>
              {!projectContext && (
                <p className="text-xs text-muted-foreground text-center">Open this from a project page to summarize its progress.</p>
              )}
              {summary && (
                <div className="rounded-xl bg-muted/50 border border-border p-4">
                  <div className="prose prose-sm text-sm text-foreground max-w-none">
                    <ReactMarkdown>{summary}</ReactMarkdown>
                  </div>
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
