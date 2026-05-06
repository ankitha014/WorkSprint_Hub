import { useMemo } from 'react';
import type { Task } from '@/types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Props {
  tasks: Task[];
  profiles: { user_id: string; full_name: string | null; email: string | null }[];
}

export function TaskCompletionChart({ tasks, profiles }: Props) {
  const data = useMemo(() => {
    const completedByUser: Record<string, number> = {};
    tasks.filter(t => t.status === 'completed').forEach(t => {
      if (t.assignee_id) {
        completedByUser[t.assignee_id] = (completedByUser[t.assignee_id] || 0) + 1;
      }
    });
    return Object.entries(completedByUser)
      .map(([userId, count]) => {
        const profile = profiles.find(p => p.user_id === userId);
        return {
          name: profile?.full_name || profile?.email?.split('@')[0] || 'Unknown',
          completed: count,
        };
      })
      .sort((a, b) => b.completed - a.completed)
      .slice(0, 8);
  }, [tasks, profiles]);

  const colors = [
    'hsl(245, 58%, 51%)', 'hsl(172, 66%, 50%)', 'hsl(38, 92%, 50%)',
    'hsl(142, 71%, 45%)', 'hsl(0, 72%, 51%)', 'hsl(280, 60%, 55%)',
    'hsl(200, 70%, 50%)', 'hsl(320, 60%, 50%)',
  ];

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        No completed tasks yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: -16 }}>
        <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'hsl(220, 10%, 46%)' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: 'hsl(220, 10%, 46%)' }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip
          contentStyle={{
            background: 'hsl(0, 0%, 100%)',
            border: '1px solid hsl(220, 13%, 91%)',
            borderRadius: '0.75rem',
            fontSize: 13,
          }}
        />
        <Bar dataKey="completed" radius={[6, 6, 0, 0]} maxBarSize={48}>
          {data.map((_, i) => (
            <Cell key={i} fill={colors[i % colors.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
