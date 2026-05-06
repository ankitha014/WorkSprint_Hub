import { useProjects } from '@/hooks/useProjects';
import { useAllTasks } from '@/hooks/useTasks';
import { FolderKanban } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function RecentProjects() {
  const { data: projects = [], isLoading } = useProjects();
  const { data: tasks = [] } = useAllTasks();

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading font-semibold text-lg text-foreground">Recent Projects</h2>
        {projects.length > 0 && (
          <Link to="/projects">
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
              View all →
            </Button>
          </Link>
        )}
      </div>
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card rounded-2xl h-16 animate-pulse" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <FolderKanban className="mx-auto mb-3 text-muted-foreground" size={32} />
          <p className="text-muted-foreground">No projects yet. Create your first one!</p>
        </div>
      ) : (
        <div className="space-y-3 stagger">
          {projects.slice(0, 5).map((p) => {
            const count = tasks.filter((t) => t.project_id === p.id).length;
            return (
              <Link key={p.id} to={`/projects/${p.id}`} className="block group animate-fade-up">
                <div className="flex items-center gap-4 rounded-2xl px-5 py-4 bg-card text-card-foreground border border-[hsl(var(--card-border))] hover-glow">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-white/10 text-card-foreground shrink-0">
                    <FolderKanban size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-heading font-semibold text-card-foreground truncate">
                      {p.name}
                    </h3>
                  </div>
                  <div className="text-sm font-medium text-white/75 shrink-0">
                    {count} {count === 1 ? 'task' : 'tasks'}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
