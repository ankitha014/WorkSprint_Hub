
-- Create workspaces table
CREATE TABLE public.workspaces (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

-- Create workspace_members table
CREATE TABLE public.workspace_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

-- Add workspace_id to projects (nullable initially for existing data)
ALTER TABLE public.projects ADD COLUMN workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- Security definer function to check workspace membership
CREATE OR REPLACE FUNCTION public.is_workspace_member(_user_id UUID, _workspace_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE user_id = _user_id AND workspace_id = _workspace_id
  )
$$;

-- RLS for workspaces: members can view
CREATE POLICY "Members can view workspaces"
ON public.workspaces FOR SELECT
TO authenticated
USING (public.is_workspace_member(auth.uid(), id));

-- RLS for workspaces: authenticated users can create
CREATE POLICY "Users can create workspaces"
ON public.workspaces FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_id);

-- RLS for workspaces: owners can update
CREATE POLICY "Owners can update workspaces"
ON public.workspaces FOR UPDATE
TO authenticated
USING (auth.uid() = owner_id);

-- RLS for workspaces: owners can delete
CREATE POLICY "Owners can delete workspaces"
ON public.workspaces FOR DELETE
TO authenticated
USING (auth.uid() = owner_id);

-- RLS for workspace_members: members can view other members
CREATE POLICY "Members can view workspace members"
ON public.workspace_members FOR SELECT
TO authenticated
USING (public.is_workspace_member(auth.uid(), workspace_id));

-- RLS for workspace_members: workspace owners/admins can add members
CREATE POLICY "Admins can add workspace members"
ON public.workspace_members FOR INSERT
TO authenticated
WITH CHECK (
  (EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = workspace_members.workspace_id
    AND wm.user_id = auth.uid()
    AND wm.role IN ('owner', 'admin')
  ))
  OR (auth.uid() = user_id)
);

-- RLS for workspace_members: owners/admins can remove members
CREATE POLICY "Admins can remove workspace members"
ON public.workspace_members FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = workspace_members.workspace_id
    AND wm.user_id = auth.uid()
    AND wm.role IN ('owner', 'admin')
  )
);

-- RLS for workspace_members: owners can update roles
CREATE POLICY "Owners can update member roles"
ON public.workspace_members FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = workspace_members.workspace_id
    AND wm.user_id = auth.uid()
    AND wm.role = 'owner'
  )
);
