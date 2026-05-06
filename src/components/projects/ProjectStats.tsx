import { CheckSquare, ListTodo, Users, AlertTriangle } from 'lucide-react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import type { Task } from '@/types';

interface ProjectStatsProps {
  tasks: Task[];
  memberCount: number;
}

export function ProjectStats({ tasks, memberCount }: ProjectStatsProps) {
  const total = tasks.length;
  const completed = tasks.filter(t => t.status === 'completed').length;
  const overdue = tasks.filter(
    t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed'
  ).length;
  const todo = tasks.filter(t => t.status === 'todo').length;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatsCard label="Total Tasks" value={total} icon={ListTodo} />
      <StatsCard label="Completed" value={completed} icon={CheckSquare} trend={total > 0 ? `${Math.round((completed / total) * 100)}%` : undefined} />
      <StatsCard label="Team Members" value={memberCount} icon={Users} />
      <StatsCard label="Overdue" value={overdue} icon={AlertTriangle} />
    </div>
  );
}
