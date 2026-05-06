import { AppLayout } from '@/components/layout/AppLayout';
import { PageBackground } from '@/components/layout/PageBackground';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { RecentProjects } from '@/components/dashboard/RecentProjects';
import { QuickActionsPanel } from '@/components/dashboard/QuickActionsPanel';
import { useProjects } from '@/hooks/useProjects';
import { useAllTasks } from '@/hooks/useTasks';
import { FolderKanban, ListTodo, CheckCircle2, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { TypingText } from '@/components/ui/typing-text';

export default function Dashboard() {
  const { user } = useAuth();
  const { data: projects = [] } = useProjects();
  const { data: tasks = [] } = useAllTasks();

  const completedTasks = tasks.filter(t => t.status === 'completed');
  const pendingTasks = tasks.filter(t => t.status !== 'completed');

  return (
    <AppLayout transparentBackground><PageBackground />
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-foreground">
          <TypingText text={`Welcome back${user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ''}`} />
        </h1>
        <p className="text-muted-foreground mt-1">Here's what's happening across your projects.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 stagger">
        <StatsCard label="Total Projects" value={projects.length} icon={FolderKanban} />
        <StatsCard label="Total Tasks" value={tasks.length} icon={ListTodo} />
        <StatsCard
          label="Completed"
          value={completedTasks.length}
          icon={CheckCircle2}
          trend={tasks.length > 0 ? `${Math.round((completedTasks.length / tasks.length) * 100)}%` : undefined}
        />
        <StatsCard label="Pending" value={pendingTasks.length} icon={Clock} />
      </div>

      <div className="mb-8 animate-fade-up" style={{ animationDelay: '120ms' }}>
        <QuickActionsPanel />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 animate-fade-up" style={{ animationDelay: '180ms' }}>
          <RecentProjects />
        </div>
        <div className="animate-fade-up" style={{ animationDelay: '240ms' }}>
          <ActivityFeed />
        </div>
      </div>
    </AppLayout>
  );
}
