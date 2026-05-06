import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCountUp } from '@/hooks/useCountUp';

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  className?: string;
}

export function StatsCard({ label, value, icon: Icon, trend, className }: StatsCardProps) {
  // Detect numeric value (allow trailing %) for count-up animation
  const numericMatch = typeof value === 'number'
    ? { num: value, suffix: '' }
    : (() => {
        const m = String(value).match(/^(\d+(?:\.\d+)?)(.*)$/);
        return m ? { num: parseFloat(m[1]), suffix: m[2] } : null;
      })();

  const animated = useCountUp(numericMatch ? numericMatch.num : 0, 900);
  const display = numericMatch
    ? `${Math.round(animated)}${numericMatch.suffix}`
    : value;

  return (
    <div className={cn("stat-card hover-glow press-bounce animate-fade-up", className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="p-2.5 rounded-lg bg-primary/20 transition-transform duration-300 group-hover:scale-110">
          <Icon size={20} className="text-primary" />
        </div>
        {trend && (
          <span className="text-xs font-medium text-success-foreground bg-success/30 px-2 py-0.5 rounded-full">{trend}</span>
        )}
      </div>
      <p className="text-2xl font-heading font-bold text-card-foreground tabular-nums">{display}</p>
      <p className="text-sm text-white/70 mt-1">{label}</p>
    </div>
  );
}
