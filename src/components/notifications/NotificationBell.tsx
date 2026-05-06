import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications, useMarkNotificationRead, useMarkAllRead } from '@/hooks/useNotifications';
import type { Notification } from '@/services/api/notifications';
import { Bell, CheckCheck, UserPlus, MessageSquare, RefreshCw, Clock, Users, FolderPlus, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

const typeConfig: Record<string, { icon: typeof Bell; color: string; emoji: string }> = {
  task_assigned: { icon: UserPlus, color: 'text-primary', emoji: '👤' },
  task_updated: { icon: RefreshCw, color: 'text-warning', emoji: '✏️' },
  task_completed: { icon: CheckCheck, color: 'text-green-500', emoji: '✅' },
  task_due_soon: { icon: Clock, color: 'text-orange-500', emoji: '⏰' },
  comment_added: { icon: MessageSquare, color: 'text-accent', emoji: '💬' },
  comment_mention: { icon: MessageSquare, color: 'text-primary', emoji: '📣' },
  workspace_invite: { icon: Users, color: 'text-primary', emoji: '🏢' },
  project_invite: { icon: FolderPlus, color: 'text-primary', emoji: '📁' },
};

export function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: notifications = [] } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllRead();

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleClick = (n: Notification) => {
    if (!n.read) markRead.mutate(n.id);
    setOpen(false);
    // Navigate based on type
    if (n.entity_id && (n.type.startsWith('task') || n.type.startsWith('comment'))) {
      if (n.project_id) navigate(`/projects/${n.project_id}`);
    } else if (n.type === 'workspace_invite') {
      navigate('/workspace-settings');
    } else if (n.type === 'project_invite' && n.project_id) {
      navigate(`/projects/${n.project_id}`);
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center animate-fade-in">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden animate-fade-in">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="font-heading font-semibold text-sm text-foreground">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={() => markAll.mutate()}
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <CheckCheck size={12} /> Mark all read
                </button>
              )}
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center py-10 px-4">
                <Bell className="mx-auto mb-2 text-muted-foreground" size={24} />
                <p className="text-sm text-muted-foreground">No notifications yet</p>
              </div>
            ) : (
              notifications.slice(0, 10).map((n) => {
                const config = typeConfig[n.type] || typeConfig.task_updated;
                return (
                  <button
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={cn(
                      "w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0",
                      !n.read && "bg-primary/5"
                    )}
                  >
                    <span className="text-base mt-0.5 shrink-0">{config.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm leading-snug",
                        !n.read ? "font-medium text-foreground" : "text-muted-foreground"
                      )}>
                        {n.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{n.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    {!n.read && (
                      <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {notifications.length > 0 && (
            <div className="border-t border-border px-4 py-2">
              <button
                onClick={() => { setOpen(false); navigate('/notifications'); }}
                className="text-xs text-primary hover:underline w-full text-center"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
