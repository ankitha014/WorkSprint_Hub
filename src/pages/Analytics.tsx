import { useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageBackground } from '@/components/layout/PageBackground';
import { useProjects } from '@/hooks/useProjects';
import { useAllTasks } from '@/hooks/useTasks';
import { useAuth } from '@/contexts/AuthContext';
import { TaskCompletionChart } from '@/components/analytics/TaskCompletionChart';
import { ProductivityChart } from '@/components/analytics/ProductivityChart';
import { ProjectProgressChart } from '@/components/analytics/ProjectProgressChart';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { BarChart3, CheckCircle2, AlertTriangle, TrendingUp, Clock, Target } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { isBefore, startOfDay, addDays } from 'date-fns';
import { TypingText } from '@/components/ui/typing-text';

async function fetchProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, full_name, email');
  if (error) throw error;
  return data;
}

export default function Analytics() {
  const { user } = useAuth();
  const { data: projects = [] } = useProjects();
  const { data: tasks = [] } = useAllTasks();
  const { data: profiles = [] } = useQuery({
    queryKey: ['profiles-list'],
    queryFn: fetchProfiles,
  });

  const stats = useMemo(() => {
    const completed = tasks.filter(t => t.status === 'completed').length;
    const total = tasks.length;
    const today = startOfDay(new Date());
    const overdue = tasks.filter(t =>
      t.status !== 'completed' && t.due_date && isBefore(new Date(t.due_date), today)
    ).length;
    const dueSoon = tasks.filter(t =>
      t.status !== 'completed' && t.due_date &&
      !isBefore(new Date(t.due_date), today) &&
      isBefore(new Date(t.due_date), addDays(today, 3))
    ).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Productivity score: weighted metric
    const activeProjects = projects.filter(p => p.status === 'active').length;
    const productivityScore = Math.min(100, Math.round(
      (completionRate * 0.5) +
      (activeProjects > 0 ? 20 : 0) +
      (overdue === 0 ? 20 : Math.max(0, 20 - overdue * 5)) +
      (total > 5 ? 10 : total * 2)
    ));

    return { completed, total, overdue, dueSoon, completionRate, productivityScore };
  }, [tasks, projects]);

  return (
    <AppLayout transparentBackground><PageBackground />
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <BarChart3 size={20} className="text-primary" />
          </div>
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground"><TypingText text="Analytics" /></h1>
            <p className="text-muted-foreground text-sm">Track productivity and project progress.</p>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 stagger">
        <StatsCard
          label="Completion Rate"
          value={`${stats.completionRate}%`}
          icon={CheckCircle2}
          trend={`${stats.completed}/${stats.total}`}
        />
        <StatsCard
          label="Overdue Tasks"
          value={stats.overdue}
          icon={AlertTriangle}
          className={stats.overdue > 0 ? 'border-destructive/30' : ''}
        />
        <StatsCard
          label="Due Soon"
          value={stats.dueSoon}
          icon={Clock}
        />
        <StatsCard
          label="Productivity Score"
          value={stats.productivityScore}
          icon={TrendingUp}
          trend={stats.productivityScore >= 70 ? '🔥 On fire' : stats.productivityScore >= 40 ? '👍 Good' : '📈 Room to grow'}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-card border border-border rounded-xl p-5 animate-fade-up hover-glow" style={{ animationDelay: '120ms' }}>
          <h2 className="font-heading font-semibold text-foreground mb-4">Tasks Completed per User</h2>
          <TaskCompletionChart tasks={tasks} profiles={profiles} />
        </div>
        <div className="bg-card border border-border rounded-xl p-5 animate-fade-up hover-glow" style={{ animationDelay: '180ms' }}>
          <h2 className="font-heading font-semibold text-foreground mb-4">Productivity (Last 14 Days)</h2>
          <ProductivityChart tasks={tasks} />
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5 animate-fade-up hover-glow" style={{ animationDelay: '240ms' }}>
        <h2 className="font-heading font-semibold text-foreground mb-4">Project Progress</h2>
        <ProjectProgressChart tasks={tasks} projects={projects} />
      </div>
    </AppLayout>
  );
}
