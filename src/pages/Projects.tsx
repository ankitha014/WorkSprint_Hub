import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageBackground } from '@/components/layout/PageBackground';
import { useProjects, useCreateProject } from '@/hooks/useProjects';
import { useCreateTask } from '@/hooks/useTasks';
import { useAllTasks } from '@/hooks/useTasks';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/contexts/AuthContext';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { CreateProjectButton } from '@/components/projects/CreateProjectButton';
import { TemplatePickerModal } from '@/components/projects/TemplatePickerModal';
import type { ProjectTemplate } from '@/services/api/templates';
import { Button } from '@/components/ui/button';
import { Search, X, FileText, ArrowUpDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { TypingText } from '@/components/ui/typing-text';

type SortOption = 'name-asc' | 'name-desc' | 'created-newest' | 'created-oldest' | 'due-date' | 'priority';

const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

export default function Projects() {
  const { data: projects = [], isLoading } = useProjects();
  const { data: tasks = [] } = useAllTasks();
  const createProject = useCreateProject();
  const createTask = useCreateTask();
  const { user } = useAuth();
  const permissions = usePermissions();
  const navigate = useNavigate();
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState<SortOption>('created-newest');

  const filtered = useMemo(() => {
    const result = projects.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.description || '').toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchSearch && matchStatus;
    });

    return result.sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'created-newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'created-oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'due-date': {
          if (!a.due_date && !b.due_date) return 0;
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        }
        case 'priority':
          return (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2);
        default:
          return 0;
      }
    });
  }, [projects, search, statusFilter, sortBy]);

  const handleCreateFromTemplate = async (template: ProjectTemplate) => {
    if (!user) return;
    try {
      const project = await createProject.mutateAsync({
        name: `${template.name}`,
        description: template.description || '',
        color: '#6366f1',
      });
      for (const task of template.template_data.tasks) {
        await createTask.mutateAsync({
          project_id: project.id,
          title: task.title,
          description: task.description || '',
          priority: task.priority,
          created_by: user.id,
        });
      }
      toast.success(`Project created from template with ${template.template_data.tasks.length} tasks!`);
      navigate(`/projects/${project.id}`);
    } catch {
      toast.error('Failed to create project from template');
    }
  };

  return (
    <AppLayout transparentBackground><PageBackground />
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground"><TypingText text="Projects" /></h1>
          <p className="text-muted-foreground mt-1">Manage all your projects</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setTemplateModalOpen(true)}>
            <FileText size={16} className="mr-2" /> From Template
          </Button>
          <CreateProjectButton />
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search projects..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 pr-9" />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X size={14} />
            </button>
          )}
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
          <SelectTrigger className="w-[170px]">
            <ArrowUpDown size={14} className="mr-2 text-muted-foreground" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created-newest">Newest First</SelectItem>
            <SelectItem value="created-oldest">Oldest First</SelectItem>
            <SelectItem value="name-asc">Name A–Z</SelectItem>
            <SelectItem value="name-desc">Name Z–A</SelectItem>
            <SelectItem value="due-date">Due Date</SelectItem>
            <SelectItem value="priority">Priority</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="glass-card rounded-xl h-48 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <p className="text-muted-foreground">No projects found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
          {filtered.map((p) => (
            <ProjectCard key={p.id} project={p} taskCount={tasks.filter(t => t.project_id === p.id).length} />
          ))}
        </div>
      )}

      <TemplatePickerModal open={templateModalOpen} onClose={() => setTemplateModalOpen(false)} onSelectTemplate={handleCreateFromTemplate} />
    </AppLayout>
  );
}
