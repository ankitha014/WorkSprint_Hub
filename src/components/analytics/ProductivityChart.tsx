import { useMemo } from 'react';
import type { Task } from '@/types';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format, subDays, startOfDay, isAfter } from 'date-fns';

interface Props {
  tasks: Task[];
}

export function ProductivityChart({ tasks }: Props) {
  const data = useMemo(() => {
    const days = 14;
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const day = startOfDay(subDays(new Date(), i));
      const nextDay = startOfDay(subDays(new Date(), i - 1));
      const created = tasks.filter(t => {
        const d = new Date(t.created_at);
        return d >= day && d < nextDay;
      }).length;
      const completed = tasks.filter(t => {
        if (t.status !== 'completed') return false;
        const d = new Date(t.updated_at);
        return d >= day && d < nextDay;
      }).length;
      result.push({
        date: format(day, 'MMM d'),
        created,
        completed,
      });
    }
    return result;
  }, [tasks]);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(220, 10%, 46%)' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: 'hsl(220, 10%, 46%)' }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip
          contentStyle={{
            background: 'hsl(0, 0%, 100%)',
            border: '1px solid hsl(220, 13%, 91%)',
            borderRadius: '0.75rem',
            fontSize: 13,
          }}
        />
        <Line type="monotone" dataKey="created" stroke="hsl(245, 58%, 51%)" strokeWidth={2} dot={false} name="Created" />
        <Line type="monotone" dataKey="completed" stroke="hsl(142, 71%, 45%)" strokeWidth={2} dot={false} name="Completed" />
      </LineChart>
    </ResponsiveContainer>
  );
}
