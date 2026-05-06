import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Bell, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface NotificationPrefs {
  task_assigned: boolean;
  task_updated: boolean;
  comment_added: boolean;
}

const PREFS_KEY = 'notification_preferences';

const defaultPrefs: NotificationPrefs = {
  task_assigned: true,
  task_updated: true,
  comment_added: true,
};

export function NotificationPreferences() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<NotificationPrefs>(defaultPrefs);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    const stored = localStorage.getItem(`${PREFS_KEY}_${user.id}`);
    if (stored) {
      try {
        setPrefs(JSON.parse(stored));
      } catch { /* use defaults */ }
    }
  }, [user]);

  const handleToggle = (key: keyof NotificationPrefs) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    if (!user) return;
    setSaving(true);
    localStorage.setItem(`${PREFS_KEY}_${user.id}`, JSON.stringify(prefs));
    setTimeout(() => {
      setSaving(false);
      toast.success('Notification preferences saved');
    }, 300);
  };

  const items: { key: keyof NotificationPrefs; label: string; description: string }[] = [
    { key: 'task_assigned', label: 'Task Assignments', description: 'When a task is assigned to you' },
    { key: 'task_updated', label: 'Task Updates', description: 'When a task you\'re assigned to is updated' },
    { key: 'comment_added', label: 'New Comments', description: 'When someone comments on your task' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Bell size={16} className="text-muted-foreground" />
        <h2 className="font-heading font-semibold text-lg text-foreground">Notification Preferences</h2>
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.key} className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">{item.label}</Label>
              <p className="text-xs text-muted-foreground">{item.description}</p>
            </div>
            <Switch
              checked={prefs[item.key]}
              onCheckedChange={() => handleToggle(item.key)}
            />
          </div>
        ))}
      </div>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? (
          <><Loader2 size={14} className="animate-spin mr-2" /> Saving...</>
        ) : (
          'Save Preferences'
        )}
      </Button>
    </div>
  );
}
