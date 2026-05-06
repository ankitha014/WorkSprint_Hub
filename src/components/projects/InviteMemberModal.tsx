import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus, X, Crown, User } from 'lucide-react';
import { toast } from 'sonner';
import { addProjectMember, removeProjectMember } from '@/services/api/projects';
import { useQueryClient } from '@tanstack/react-query';

interface Member {
  id: string;
  user_id: string;
  role: string;
  profiles?: {
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
  } | null;
}

interface InviteMemberModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  members: Member[];
  currentUserId: string;
  ownerId: string;
}

export function InviteMemberModal({ open, onClose, projectId, members, currentUserId, ownerId }: InviteMemberModalProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await addProjectMember(projectId, email.trim());
      queryClient.invalidateQueries({ queryKey: ['project-members', projectId] });
      toast.success(`Invited ${email}`);
      setEmail('');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to invite');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (userId: string) => {
    if (!confirm('Remove this member?')) return;
    try {
      await removeProjectMember(projectId, userId);
      queryClient.invalidateQueries({ queryKey: ['project-members', projectId] });
      toast.success('Member removed');
    } catch {
      toast.error('Failed to remove member');
    }
  };

  const isOwner = currentUserId === ownerId;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="font-heading">Team Members</DialogTitle>
        </DialogHeader>

        {isOwner && (
          <form onSubmit={handleInvite} className="flex gap-2 mt-2">
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email to invite..."
              type="email"
              className="flex-1"
            />
            <Button type="submit" size="sm" disabled={loading}>
              <UserPlus size={14} className="mr-1.5" />
              {loading ? '...' : 'Invite'}
            </Button>
          </form>
        )}

        <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
          {members.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No members yet</p>
          ) : (
            members.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    {member.role === 'owner' ? (
                      <Crown size={14} className="text-primary" />
                    ) : (
                      <User size={14} className="text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {member.profiles?.full_name || 'Unknown'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {member.profiles?.email} · {member.role}
                    </p>
                  </div>
                </div>
                {isOwner && member.user_id !== currentUserId && (
                  <button
                    onClick={() => handleRemove(member.user_id)}
                    className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
