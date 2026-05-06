import { useMemo } from 'react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useWorkspaceMembers } from '@/hooks/useWorkspaces';
import { useAuth } from '@/contexts/AuthContext';

export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'viewer';

const ROLE_HIERARCHY: Record<WorkspaceRole, number> = {
  owner: 4,
  admin: 3,
  member: 2,
  viewer: 1,
};

export interface Permissions {
  role: WorkspaceRole | null;
  // Workspace
  canDeleteWorkspace: boolean;
  canManageMembers: boolean;
  canManageBilling: boolean;
  // Projects
  canCreateProject: boolean;
  canEditProject: boolean;
  canDeleteProject: boolean;
  // Tasks
  canCreateTask: boolean;
  canUpdateTask: boolean;
  canDeleteTask: boolean;
  // General
  canEdit: boolean; // member+
  isReadOnly: boolean;
}

function hasMinRole(userRole: WorkspaceRole | null, minRole: WorkspaceRole): boolean {
  if (!userRole) return false;
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minRole];
}

export function usePermissions(): Permissions {
  const { currentWorkspace } = useWorkspace();
  const { user } = useAuth();
  const { data: members = [] } = useWorkspaceMembers(currentWorkspace?.id || '');

  const role = useMemo(() => {
    if (!user || !currentWorkspace) return null;
    const member = members.find(m => m.user_id === user.id);
    return (member?.role as WorkspaceRole) || null;
  }, [user, currentWorkspace, members]);

  return useMemo(() => ({
    role,
    canDeleteWorkspace: hasMinRole(role, 'owner'),
    canManageMembers: hasMinRole(role, 'owner'),
    canManageBilling: hasMinRole(role, 'owner'),
    canCreateProject: hasMinRole(role, 'member'),
    canEditProject: hasMinRole(role, 'member'),
    canDeleteProject: hasMinRole(role, 'owner'),
    canCreateTask: hasMinRole(role, 'member'),
    canUpdateTask: hasMinRole(role, 'member'),
    canDeleteTask: hasMinRole(role, 'admin'),
    canEdit: hasMinRole(role, 'member'),
    isReadOnly: role === 'viewer',
  }), [role]);
}
