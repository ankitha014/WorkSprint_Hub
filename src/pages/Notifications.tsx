import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageBackground } from '@/components/layout/PageBackground';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllRead,
  useDeleteNotification,
  useDeleteAllRead,
} from '@/hooks/useNotifications';
import type { Notification, NotificationType } from '@/services/api/notifications';
import { Bell, CheckCheck, Trash2, Filter, UserPlus, MessageSquare, RefreshCw, Clock, Users, FolderPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';
import { TypingText } from '@/components/ui/typing-text';

const typeConfig: Record<string, { emoji: string; label: string; color: string }> = {
  task_assigned: { emoji: '👤', label: 'Task Assigned', color: 'bg-primary/10 text-primary' },
  task_updated: { emoji: '✏️', label: 'Task Updated', color: 'bg-amber-500/10 text-amber-600' },
  task_completed: { emoji: '✅', label: 'Task Completed', color: 'bg-green-500/10 text-green-600' },
  task_due_soon: { emoji: '⏰', label: 'Due Soon', color: 'bg-orange-500/10 text-orange-600' },
  comment_added: { emoji: '💬', label: 'Comment', color: 'bg-blue-500/10 text-blue-600' },
  comment_mention: { emoji: '📣', label: 'Mention', color: 'bg-purple-500/10 text-purple-600' },
  workspace_invite: { emoji: '🏢', label: 'Workspace Invite', color: 'bg-primary/10 text-primary' },
  project_invite: { emoji: '📁', label: 'Project Invite', color: 'bg-primary/10 text-primary' },
};

const filterOptions: { value: string; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'task_assigned', label: 'Assignments' },
  { value: 'task_due_soon', label: 'Due Soon' },
  { value: 'comment_added', label: 'Comments' },
  { value: 'comment_mention', label: 'Mentions' },
  { value: 'workspace_invite', label: 'Invites' },
];

export default function Notifications() {
  const navigate = useNavigate();
  const { data: notifications = [], isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllRead();
  const deleteOne = useDeleteNotification();
  const deleteAllRead = useDeleteAllRead();
  const [filter, setFilter] = useState('all');

  const filtered = notifications.filter((n) => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.read;
    return n.type === filter;
  });

  const unreadCount = notifications.filter(n => !n.read).length;
  const readCount = notifications.filter(n => n.read).length;

  // Group by date
  const grouped = filtered.reduce<Record<string, Notification[]>>((acc, n) => {
    const day = format(new Date(n.created_at), 'yyyy-MM-dd');
    if (!acc[day]) acc[day] = [];
    acc[day].push(n);
    return acc;
  }, {});

  const dayLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return format(d, 'EEEE, MMMM d');
  };

  const handleClick = (n: Notification) => {
    if (!n.read) markRead.mutate(n.id);
    if (n.entity_id && (n.type.startsWith('task') || n.type.startsWith('comment'))) {
      if (n.project_id) navigate(`/projects/${n.project_id}`);
    } else if (n.type === 'workspace_invite') {
      navigate('/workspace-settings');
    } else if (n.type === 'project_invite' && n.project_id) {
      navigate(`/projects/${n.project_id}`);
    }
  };

  return (
    <AppLayout transparentBackground><PageBackground />
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Bell size={20} className="text-primary" />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-bold text-foreground"><TypingText text="Notifications" /></h1>
              <p className="text-sm text-muted-foreground">
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={() => markAll.mutate()}>
                <CheckCheck size={14} className="mr-1" /> Mark all read
              </Button>
            )}
            {readCount > 0 && (
              <Button variant="ghost" size="sm" onClick={() => deleteAllRead.mutate()} className="text-muted-foreground">
                <Trash2 size={14} className="mr-1" /> Clear read
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                filter === opt.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {opt.label}
              {opt.value === 'unread' && unreadCount > 0 && (
                <span className="ml-1.5 bg-destructive text-destructive-foreground rounded-full px-1.5 text-[10px]">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Notification List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Bell className="mx-auto mb-3 text-muted-foreground" size={32} />
            <p className="text-muted-foreground font-medium">No notifications</p>
            <p className="text-sm text-muted-foreground mt-1">
              {filter !== 'all' ? 'Try a different filter' : 'You\'re all caught up!'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([day, items]) => (
              <div key={day}>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  {dayLabel(day)}
                </h3>
                <div className="space-y-1 stagger">
                  {items.map((n) => {
                    const config = typeConfig[n.type] || typeConfig.task_updated;
                    return (
                      <div
                        key={n.id}
                        className={cn(
                          "group flex items-start gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer animate-slide-in-right hover:translate-x-0.5",
                          !n.read ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/50"
                        )}
                        onClick={() => handleClick(n)}
                      >
                        <span className="text-lg mt-0.5 shrink-0">{config.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className={cn(
                              "text-sm leading-snug",
                              !n.read ? "font-semibold text-foreground" : "text-foreground"
                            )}>
                              {n.title}
                            </p>
                            <Badge variant="secondary" className={cn("text-[10px] px-1.5 py-0", config.color)}>
                              {config.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{n.message}</p>
                          <p className="text-[11px] text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!n.read && (
                            <button
                              onClick={(e) => { e.stopPropagation(); markRead.mutate(n.id); }}
                              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground press-bounce"
                              title="Mark as read"
                            >
                              <CheckCheck size={14} />
                            </button>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteOne.mutate(n.id); }}
                            className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive press-bounce"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        {!n.read && (
                          <div className="relative w-2 h-2 rounded-full bg-primary shrink-0 mt-2 pulse-dot" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
