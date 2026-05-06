import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Keyboard } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ShortcutAction {
  key: string;
  label: string;
  description: string;
  category: 'navigation' | 'actions' | 'general';
  action: () => void;
}

interface KeyboardShortcutsContextType {
  showHelp: () => void;
  enabled: boolean;
  setEnabled: (v: boolean) => void;
}

const KeyboardShortcutsContext = createContext<KeyboardShortcutsContextType>({ showHelp: () => {}, enabled: true, setEnabled: () => {} });

export const useKeyboardShortcuts = () => useContext(KeyboardShortcutsContext);

export function KeyboardShortcutsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [helpOpen, setHelpOpen] = useState(false);
  const [enabled, setEnabledState] = useState(() => {
    const stored = localStorage.getItem('keyboard_shortcuts_enabled');
    return stored !== 'false';
  });

  const setEnabled = (v: boolean) => {
    setEnabledState(v);
    localStorage.setItem('keyboard_shortcuts_enabled', String(v));
  };

  const isAuthed = !!user;
  const isOnAuthPage = location.pathname === '/login' || location.pathname === '/signup';

  const shortcuts: ShortcutAction[] = [
    // Navigation
    { key: 'd', label: 'D', description: 'Go to Dashboard', category: 'navigation', action: () => navigate('/dashboard') },
    { key: 'p', label: 'P', description: 'Go to Projects', category: 'navigation', action: () => navigate('/projects') },
    { key: 't', label: 'T', description: 'Go to Tasks', category: 'navigation', action: () => navigate('/tasks') },
    { key: 'a', label: 'A', description: 'Go to Analytics', category: 'navigation', action: () => navigate('/analytics') },
    { key: 'g', label: 'G', description: 'Go to Settings', category: 'navigation', action: () => navigate('/settings') },
    // Actions — dispatch custom events that pages can listen to
    { key: 'n', label: 'N', description: 'New task', category: 'actions', action: () => window.dispatchEvent(new CustomEvent('shortcut:new-task')) },
    { key: 'c', label: 'C', description: 'New project', category: 'actions', action: () => window.dispatchEvent(new CustomEvent('shortcut:new-project')) },
    { key: 'f', label: 'F', description: 'Focus search', category: 'actions', action: () => window.dispatchEvent(new CustomEvent('shortcut:search')) },
    // General
    { key: '?', label: '?', description: 'Show keyboard shortcuts', category: 'general', action: () => setHelpOpen(true) },
  ];

  useEffect(() => {
    if (!isAuthed || isOnAuthPage || !enabled) return;
    const handler = (e: KeyboardEvent) => {
      // Ignore when typing in inputs
      const tag = (e.target as HTMLElement)?.tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;
      if ((e.target as HTMLElement)?.isContentEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      // Dialog open — only handle Escape
      if (helpOpen) return;

      const shortcut = shortcuts.find(s => s.key === e.key.toLowerCase() || s.key === e.key);
      if (shortcut) {
        e.preventDefault();
        shortcut.action();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isAuthed, isOnAuthPage, helpOpen, enabled, navigate]);

  const categories = [
    { id: 'navigation' as const, label: 'Navigation' },
    { id: 'actions' as const, label: 'Actions' },
    { id: 'general' as const, label: 'General' },
  ];

  return (
    <KeyboardShortcutsContext.Provider value={{ showHelp: () => setHelpOpen(true), enabled, setEnabled }}>
      {children}
      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading flex items-center gap-2">
              <Keyboard size={18} className="text-primary" />
              Keyboard Shortcuts
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 mt-2">
            {categories.map(cat => {
              const items = shortcuts.filter(s => s.category === cat.id);
              return (
                <div key={cat.id}>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    {cat.label}
                  </h3>
                  <div className="space-y-1">
                    {items.map(s => (
                      <div key={s.key} className="flex items-center justify-between py-1.5">
                        <span className="text-sm text-foreground">{s.description}</span>
                        <kbd className={cn(
                          "inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-md",
                          "bg-muted border border-border text-xs font-mono font-semibold text-muted-foreground"
                        )}>
                          {s.label}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </KeyboardShortcutsContext.Provider>
  );
}
