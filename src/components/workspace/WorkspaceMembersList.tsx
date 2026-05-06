import { useWorkspaceMembers, useRemoveWorkspaceMember, useUpdateMemberRole } from '@/hooks/useWorkspaces';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { usePermissions } from '@/hooks/usePermissions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export function WorkspaceMembersList() {
  const { currentWorkspace } = useWorkspace();
  const { user } = useAuth();
  const permissions = usePermissions();
  const { data: members = [], isLoading } = useWorkspaceMembers(currentWorkspace?.id || '');
  const removeMember = useRemoveWorkspaceMember();
  const updateRole = useUpdateMemberRole();

  const handleRemove = async (userId: string) => {
    if (!currentWorkspace) return;
    try {
      await removeMember.mutateAsync({ workspaceId: currentWorkspace.id, userId });
      toast.success('Member removed');
    } catch {
      toast.error('Failed to remove member');
    }
  };

  const handleRoleChange = async (userId: string, role: string) => {
    if (!currentWorkspace) return;
    try {
      await updateRole.mutateAsync({ workspaceId: currentWorkspace.id, userId, role });
      toast.success('Role updated');
    } catch {
      toast.error('Failed to update role');
    }
  };

  if (isLoading) {
    return <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-12 bg-muted rounded-lg animate-pulse" />)}</div>;
  }

  return (
    <div className="space-y-2">
      {members.map((member) => {
        const profile = member.profiles;
        const isSelf = member.user_id === user?.id;
        const isMemberOwner = member.role === 'owner';

        return (
          <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card">
            <Avatar className="h-8 w-8">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                {(profile?.full_name || profile?.email || '?').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {profile?.full_name || profile?.email || 'Unknown'}
                {isSelf && <span className="text-muted-foreground ml-1">(you)</span>}
              </p>
              <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
            </div>
            {permissions.canManageMembers && !isMemberOwner ? (
              <Select value={member.role} onValueChange={(val) => handleRoleChange(member.user_id, val)}>
                <SelectTrigger className="w-24 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <span className="text-xs text-muted-foreground capitalize px-2 py-1 bg-muted rounded-md">{member.role}</span>
            )}
            {permissions.canManageMembers && !isSelf && !isMemberOwner && (
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleRemove(member.user_id)}>
                <Trash2 size={14} />
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}
