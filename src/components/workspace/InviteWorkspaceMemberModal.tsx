import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useInviteWorkspaceMember } from '@/hooks/useWorkspaces';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { createNotification } from '@/services/api/notifications';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Mail } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function InviteWorkspaceMemberModal({ open, onClose }: Props) {
  const { currentWorkspace } = useWorkspace();
  const invite = useInviteWorkspaceMember();
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspace || !email.trim()) return;
    try {
      await invite.mutateAsync({ workspaceId: currentWorkspace.id, email: email.trim() });
      // Send notification to the invited user
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('email', email.trim())
        .single();
      if (profile) {
        createNotification({
          user_id: profile.user_id,
          type: 'workspace_invite',
          title: 'Workspace Invitation',
          message: `You've been invited to join "${currentWorkspace.name}"`,
        });
      }
      toast.success('Member invited!');
      setEmail('');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to invite member');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Invite Member</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="email"
              placeholder="Enter email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-9"
              required
            />
          </div>
          <p className="text-xs text-muted-foreground">The user must already have an account to be invited.</p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={invite.isPending}>
              {invite.isPending ? 'Inviting...' : 'Send Invite'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
