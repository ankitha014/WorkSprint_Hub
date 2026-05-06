-- Fix workspace creation/read flow under RLS
-- Owners must be able to read their just-created workspace before membership row exists

DROP POLICY IF EXISTS "Users can create workspaces" ON public.workspaces;
CREATE POLICY "Users can create workspaces"
ON public.workspaces
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Members can view workspaces" ON public.workspaces;
CREATE POLICY "Members can view workspaces"
ON public.workspaces
FOR SELECT
TO authenticated
USING (
  auth.uid() = owner_id
  OR public.is_workspace_member(auth.uid(), id)
);