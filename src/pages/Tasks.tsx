import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageBackground } from '@/components/layout/PageBackground';
import { useAllTasks, useCreateTask } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/contexts/AuthContext';
import { TaskCard } from '@/components/tasks/TaskCard';
import { TaskFilters, useTaskFilters, applyTaskFilters } from '@/components/tasks/TaskFilters';
import { TaskModal } from '@/components/tasks/TaskModal';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import type { TaskPriority, TaskStatus } from '@/types';
import { TypingText } from '@/components/ui/typing-text';

export default function Tasks() {
  const { data: tasks = [], isLoading } = useAllTasks();
  const { data: projects = [] } = useProjects();
  const createTask = useCreateTask();
  const { user } = useAuth();
  const { filters, setFilters } = useTaskFilters();
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const handler = () => setModalOpen(true);
    window.addEventListener('shortcut:new-task', handler);
    return () => window.removeEventListener('shortcut:new-task', handler);
  }, []);

  const filtered = applyTaskFilters(tasks, filters);

  const handleCreateTask = async (data: {
    title: string;
    description: string;
    priority: TaskPriority;
    status: TaskStatus;
    assignee_id?: string;
    due_date?: string;
  }) => {
    if (!user || projects.length === 0) {
      toast.error('You need at least one project to create a task');
      return;
    }
    try {
      await createTask.mutateAsync({
        ...data,
        project_id: projects[0].id,
        created_by: user.id,
      });
      toast.success('Task created!');
      setModalOpen(false);
    } catch {
      toast.error('Failed to create task');
    }
  };

  return (
    <AppLayout transparentBackground><PageBackground />
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground"><TypingText text="All Tasks" /></h1>
          <p className="text-muted-foreground mt-1">View tasks across all projects</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={16} className="mr-2" /> New Task
        </Button>
      </div>

      <div className="mb-6">
        <TaskFilters filters={filters} onFiltersChange={setFilters} showAssigneeFilter={false} />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="glass-card rounded-xl h-24 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <p className="text-muted-foreground">No tasks found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
          {filtered.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}

      <TaskModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreateTask}
        members={[]}
      />
    </AppLayout>
  );
}
