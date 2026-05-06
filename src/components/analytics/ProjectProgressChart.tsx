import { useMemo } from 'react';
import type { Task, Project } from '@/types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';

interface Props {
  tasks: Task[];
  projects: Project[];
}

export function ProjectProgressChart({ tasks, projects }: Props) {
  const data = useMemo(() => {
    return projects
      .map(p => {
        const projectTasks = tasks.filter(t => t.project_id === p.id);
        const total = projectTasks.length;
        const completed = projectTasks.filter(t => t.status === 'completed').length;
        const inProgress = projectTasks.filter(t => t.status === 'in-progress').length;
        const todo = projectTasks.filter(t => t.status === 'todo').length;
        return {
          name: p.name.length > 14 ? p.name.slice(0, 14) + '…' : p.name,
          completed,
          inProgress,
          todo,
          total,
          progress: total > 0 ? Math.round((completed / total) * 100) : 0,
        };
      })
      .filter(d => d.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [tasks, projects]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        No project data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: -16 }} layout="horizontal">
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(220, 10%, 46%)' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: 'hsl(220, 10%, 46%)' }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip
          contentStyle={{
            background: 'hsl(0, 0%, 100%)',
            border: '1px solid hsl(220, 13%, 91%)',
            borderRadius: '0.75rem',
            fontSize: 13,
          }}
        />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="completed" stackId="a" fill="hsl(142, 71%, 45%)" radius={[0, 0, 0, 0]} maxBarSize={40} name="Done" />
        <Bar dataKey="inProgress" stackId="a" fill="hsl(38, 92%, 50%)" radius={[0, 0, 0, 0]} maxBarSize={40} name="In Progress" />
        <Bar dataKey="todo" stackId="a" fill="hsl(220, 15%, 92%)" radius={[6, 6, 0, 0]} maxBarSize={40} name="To Do" />
      </BarChart>
    </ResponsiveContainer>
  );
}
