
-- Fix critical privilege escalation in workspace_members INSERT
DROP POLICY IF EXISTS "Admins can add workspace members" ON public.workspace_members;

-- Allow owners/admins to add members
CREATE POLICY "Admins can add workspace members"
  ON public.workspace_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = workspace_members.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin')
    )
  );

-- Allow workspace owner (from workspaces table) to add the first member (themselves)
CREATE POLICY "Workspace owner can self-join"
  ON public.workspace_members FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND role = 'owner'
    AND EXISTS (
      SELECT 1 FROM public.workspaces w
      WHERE w.id = workspace_members.workspace_id
        AND w.owner_id = auth.uid()
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = workspace_members.workspace_id
        AND wm.user_id = auth.uid()
    )
  );
