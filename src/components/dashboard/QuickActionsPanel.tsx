import { useNavigate } from 'react-router-dom';
import { Plus, UserPlus, CalendarDays } from 'lucide-react';

const actions = [
  {
    label: 'New Project',
    icon: Plus,
    color: 'bg-primary/10 text-primary',
    event: 'shortcut:new-project',
    navigate: '/projects',
  },
  {
    label: 'New Task',
    icon: Plus,
    color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    event: 'shortcut:new-task',
    navigate: '/tasks',
  },
  {
    label: 'Invite Member',
    icon: UserPlus,
    color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    event: null,
    navigate: '/workspace-settings',
  },
  {
    label: 'View Calendar',
    icon: CalendarDays,
    color: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
    event: null,
    navigate: '/tasks',
  },
] as const;

export function QuickActionsPanel() {
  const navigate = useNavigate();

  const handleAction = (action: (typeof actions)[number]) => {
    if (action.event) {
      // Navigate first, then dispatch event after a short delay so the page mounts
      navigate(action.navigate);
      setTimeout(() => window.dispatchEvent(new CustomEvent(action.event!)), 150);
    } else {
      navigate(action.navigate);
    }
  };

  return (
    <div>
      <h2 className="font-heading text-lg font-semibold text-foreground mb-3">Quick Actions</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              onClick={() => handleAction(action)}
              className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 transition-all hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5 active:translate-y-0"
            >
              <div className={`rounded-lg p-2.5 ${action.color} transition-transform group-hover:scale-110`}>
                <Icon size={20} />
              </div>
              <span className="text-sm font-medium text-foreground qa-text">{action.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
