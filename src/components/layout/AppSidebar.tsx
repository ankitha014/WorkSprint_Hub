import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, CheckSquare, Settings, LogOut, ChevronLeft, ChevronRight, Building2, Bell, BarChart3 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { WorkspaceSwitcher } from '@/components/workspace/WorkspaceSwitcher';
import { TimerWidget } from '@/components/time/TimerWidget';
import { ProjectFlowLogo } from '@/components/branding/ProjectFlowLogo';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Projects', icon: FolderKanban, path: '/projects' },
  { label: 'Tasks', icon: CheckSquare, path: '/tasks' },
  { label: 'Analytics', icon: BarChart3, path: '/analytics' },
  { label: 'Notifications', icon: Bell, path: '/notifications' },
  { label: 'Workspace', icon: Building2, path: '/workspace-settings' },
  { label: 'Settings', icon: Settings, path: '/settings' },
];

export function AppSidebar() {
  const location = useLocation();
  const { signOut, user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={cn(
      "h-screen sticky top-0 flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {!collapsed && (
          <Link to="/dashboard" className="flex items-center gap-2">
            <ProjectFlowLogo
              showWordmark
              iconWrapClassName="h-8 w-8 rounded-lg"
              iconClassName="h-4 w-4"
              containerClassName="gap-2"
              wordmarkClassName="text-lg text-sidebar-foreground"
            />
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <div className="px-3 py-2 border-b border-sidebar-border">
        <WorkspaceSwitcher collapsed={collapsed} />
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const active = location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn("sidebar-link", active && "sidebar-link-active")}
            >
              <item.icon size={20} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border space-y-2">
        {!collapsed && <TimerWidget />}
        <div className={cn("flex items-center", collapsed ? "justify-center" : "justify-between px-3")}>
          {!collapsed && user && (
            <p className="text-sm font-medium text-sidebar-foreground truncate flex-1 mr-2">{user.email}</p>
          )}
          <NotificationBell />
        </div>
        <button
          onClick={signOut}
          className="sidebar-link w-full text-destructive hover:bg-destructive/10"
        >
          <LogOut size={20} />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
