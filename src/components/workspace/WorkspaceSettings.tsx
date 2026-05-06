import { useState } from 'react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useAuth } from '@/contexts/AuthContext';
import { useUpdateWorkspace, useDeleteWorkspace } from '@/hooks/useWorkspaces';
import { usePermissions } from '@/hooks/usePermissions';
import { WorkspaceMembersList } from './WorkspaceMembersList';
import { InviteWorkspaceMemberModal } from './InviteWorkspaceMemberModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Settings, UserPlus, Trash2, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const ROLE_DESCRIPTIONS = [
  { role: 'Owner', permissions: 'Full control — delete workspace, manage billing, manage members' },
  { role: 'Admin', permissions: 'Create/edit/delete projects, manage tasks' },
  { role: 'Member', permissions: 'Create and update tasks' },
  { role: 'Viewer', permissions: 'Read-only access to all workspace data' },
];

export function WorkspaceSettings() {
  const { currentWorkspace, refreshWorkspaces, workspaces, setCurrentWorkspace } = useWorkspace();
  const { user } = useAuth();
  const permissions = usePermissions();
  const updateWorkspace = useUpdateWorkspace();
  const deleteWorkspace = useDeleteWorkspace();
  const navigate = useNavigate();
  const [name, setName] = useState(currentWorkspace?.name || '');
  const [inviteOpen, setInviteOpen] = useState(false);

  const handleSave = async () => {
    if (!currentWorkspace || !name.trim()) return;
    try {
      await updateWorkspace.mutateAsync({ id: currentWorkspace.id, name: name.trim() });
      await refreshWorkspaces();
      toast.success('Workspace updated');
    } catch {
      toast.error('Failed to update workspace');
    }
  };

  const handleDelete = async () => {
    if (!currentWorkspace) return;
    try {
      await deleteWorkspace.mutateAsync(currentWorkspace.id);
      await refreshWorkspaces();
      const remaining = workspaces.filter(w => w.id !== currentWorkspace.id);
      if (remaining.length > 0) setCurrentWorkspace(remaining[0]);
      navigate('/dashboard');
      toast.success('Workspace deleted');
    } catch {
      toast.error('Failed to delete workspace');
    }
  };

  if (!currentWorkspace) return null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-heading">
            <Settings size={18} />
            Workspace Settings
          </CardTitle>
          <CardDescription>Manage your workspace</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground">Name</label>
            <div className="flex gap-2 mt-1">
              <Input value={name} onChange={(e) => setName(e.target.value)} disabled={!permissions.canDeleteWorkspace} />
              {permissions.canDeleteWorkspace && (
                <Button onClick={handleSave} disabled={updateWorkspace.isPending}>Save</Button>
              )}
            </div>
          </div>
          {permissions.role && (
            <div className="text-sm text-muted-foreground">
              Your role: <span className="font-medium text-foreground capitalize">{permissions.role}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-heading">
            <Shield size={18} />
            Roles & Permissions
          </CardTitle>
          <CardDescription>Role hierarchy for this workspace</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {ROLE_DESCRIPTIONS.map(r => (
              <div key={r.role} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card">
                <span className="text-sm font-semibold text-foreground w-16 shrink-0">{r.role}</span>
                <span className="text-sm text-muted-foreground">{r.permissions}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-heading">Members</CardTitle>
              <CardDescription>People in this workspace</CardDescription>
            </div>
            {permissions.canManageMembers && (
              <Button size="sm" onClick={() => setInviteOpen(true)}>
                <UserPlus size={14} className="mr-1" /> Invite
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <WorkspaceMembersList />
        </CardContent>
      </Card>

      {permissions.canDeleteWorkspace && (
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-destructive font-heading">Danger Zone</CardTitle>
            <CardDescription>Permanently delete this workspace and all its data</CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 size={14} className="mr-1" /> Delete Workspace
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete "{currentWorkspace.name}" and all its projects.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      )}

      <InviteWorkspaceMemberModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </div>
  );
}
