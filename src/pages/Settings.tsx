import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageBackground } from '@/components/layout/PageBackground';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { AvatarUpload } from '@/components/settings/AvatarUpload';
import { ChangePassword } from '@/components/settings/ChangePassword';
import { NotificationPreferences } from '@/components/settings/NotificationPreferences';
import { useKeyboardShortcuts } from '@/components/keyboard/KeyboardShortcutsProvider';
import { Switch } from '@/components/ui/switch';
import { User, Loader2, Keyboard } from 'lucide-react';
import { toast } from 'sonner';
import { TypingText } from '@/components/ui/typing-text';

function KeyboardShortcutsSection() {
  const { enabled, setEnabled, showHelp } = useKeyboardShortcuts();
  return (
    <div className="glass-card rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Keyboard size={16} className="text-muted-foreground" />
        <h2 className="font-heading font-semibold text-lg text-foreground">Keyboard Shortcuts</h2>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm font-medium">Enable keyboard shortcuts</Label>
          <p className="text-xs text-muted-foreground">Use single-key shortcuts for navigation and actions</p>
        </div>
        <Switch checked={enabled} onCheckedChange={setEnabled} />
      </div>
      <button
        onClick={showHelp}
        className="mt-3 text-xs text-primary hover:underline"
      >
        View all shortcuts →
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    if (!user) return;
    const loadProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('user_id', user.id)
        .single();
      if (data) {
        setFullName(data.full_name || '');
        setAvatarUrl(data.avatar_url);
      }
      setLoadingProfile(false);
    };
    loadProfile();
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ data: { full_name: fullName } });
      if (error) throw error;
      await supabase.from('profiles').update({ full_name: fullName }).eq('user_id', user.id);
      toast.success('Profile updated');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loadingProfile) {
    return (
      <AppLayout transparentBackground><PageBackground />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-muted-foreground" size={24} />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout transparentBackground><PageBackground />
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-foreground"><TypingText text="Settings" /></h1>
        <p className="text-muted-foreground mt-1">Manage your account and preferences</p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Profile Section */}
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <User size={16} className="text-muted-foreground" />
            <h2 className="font-heading font-semibold text-lg text-foreground">Profile</h2>
          </div>

          <div className="space-y-6">
            <AvatarUpload
              avatarUrl={avatarUrl}
              fullName={fullName}
              onUploaded={setAvatarUrl}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="settings-email">Email</Label>
                <Input id="settings-email" value={user?.email ?? ''} disabled className="bg-muted" />
              </div>
              <div>
                <Label htmlFor="settings-name">Full Name</Label>
                <Input
                  id="settings-name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                />
              </div>
            </div>

            <Button onClick={handleSaveProfile} disabled={saving}>
              {saving ? (
                <><Loader2 size={14} className="animate-spin mr-2" /> Saving...</>
              ) : (
                'Save Profile'
              )}
            </Button>
          </div>
        </div>

        {/* Password Section */}
        <div className="glass-card rounded-xl p-6">
          <ChangePassword />
        </div>

        {/* Notification Preferences */}
        <div className="glass-card rounded-xl p-6">
          <NotificationPreferences />
        </div>

        {/* Keyboard Shortcuts */}
        <KeyboardShortcutsSection />
      </div>
    </AppLayout>
  );
}
