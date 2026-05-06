
-- Add 'viewer' role support. Current roles in workspace_members are: owner, admin, member.
-- We just need to allow 'viewer' as a value (it's a text column, no enum constraint).

-- Create a security definer function to get workspace role for a user
CREATE OR REPLACE FUNCTION public.get_workspace_role(_user_id UUID, _workspace_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.workspace_members
  WHERE user_id = _user_id AND workspace_id = _workspace_id
  LIMIT 1
$$;

-- Helper: check if user has at least a certain role level in a workspace
-- Role hierarchy: owner > admin > member > viewer
CREATE OR REPLACE FUNCTION public.has_workspace_role_level(_user_id UUID, _workspace_id UUID, _min_role TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE user_id = _user_id
    AND workspace_id = _workspace_id
    AND CASE
      WHEN _min_role = 'viewer' THEN role IN ('owner', 'admin', 'member', 'viewer')
      WHEN _min_role = 'member' THEN role IN ('owner', 'admin', 'member')
      WHEN _min_role = 'admin' THEN role IN ('owner', 'admin')
      WHEN _min_role = 'owner' THEN role = 'owner'
      ELSE false
    END
  )
$$;

-- Helper: get workspace_id from a project
CREATE OR REPLACE FUNCTION public.get_project_workspace_id(_project_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT workspace_id FROM public.projects WHERE id = _project_id LIMIT 1
$$;

-- Now update projects RLS policies to use workspace roles
-- Drop existing policies
DROP POLICY IF EXISTS "Members can view projects" ON public.projects;
DROP POLICY IF EXISTS "Owners can insert projects" ON public.projects;
DROP POLICY IF EXISTS "Owners can update projects" ON public.projects;
DROP POLICY IF EXISTS "Owners can delete projects" ON public.projects;

-- Viewers and above can view projects in their workspace
CREATE POLICY "Workspace members can view projects"
ON public.projects FOR SELECT
TO authenticated
USING (
  (workspace_id IS NULL AND EXISTS (
    SELECT 1 FROM project_members WHERE project_members.project_id = projects.id AND project_members.user_id = auth.uid()
  ))
  OR public.has_workspace_role_level(auth.uid(), workspace_id, 'viewer')
);

-- Admins and above can create projects
CREATE POLICY "Admins can create projects"
ON public.projects FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = owner_id
  AND (workspace_id IS NULL OR public.has_workspace_role_level(auth.uid(), workspace_id, 'admin'))
);

-- Admins and above can update projects
CREATE POLICY "Admins can update projects"
ON public.projects FOR UPDATE
TO authenticated
USING (
  (workspace_id IS NULL AND auth.uid() = owner_id)
  OR public.has_workspace_role_level(auth.uid(), workspace_id, 'admin')
);

-- Only workspace owner or project owner can delete
CREATE POLICY "Owners can delete projects"
ON public.projects FOR DELETE
TO authenticated
USING (
  auth.uid() = owner_id
  OR (workspace_id IS NOT NULL AND public.has_workspace_role_level(auth.uid(), workspace_id, 'owner'))
);

-- Update tasks RLS to respect workspace roles
DROP POLICY IF EXISTS "Members can view tasks" ON public.tasks;
DROP POLICY IF EXISTS "Members can insert tasks" ON public.tasks;
DROP POLICY IF EXISTS "Members can update tasks" ON public.tasks;
DROP POLICY IF EXISTS "Members can delete tasks" ON public.tasks;

-- Viewers and above can view tasks
CREATE POLICY "Workspace viewers can view tasks"
ON public.tasks FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM project_members WHERE project_members.project_id = tasks.project_id AND project_members.user_id = auth.uid()
  )
  OR public.has_workspace_role_level(auth.uid(), public.get_project_workspace_id(project_id), 'viewer')
);

-- Members and above can create tasks
CREATE POLICY "Members can create tasks"
ON public.tasks FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = created_by
  AND (
    EXISTS (
      SELECT 1 FROM project_members WHERE project_members.project_id = tasks.project_id AND project_members.user_id = auth.uid()
    )
    OR public.has_workspace_role_level(auth.uid(), public.get_project_workspace_id(project_id), 'member')
  )
);

-- Members and above can update tasks
CREATE POLICY "Members can update tasks"
ON public.tasks FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM project_members WHERE project_members.project_id = tasks.project_id AND project_members.user_id = auth.uid()
  )
  OR public.has_workspace_role_level(auth.uid(), public.get_project_workspace_id(project_id), 'member')
);

-- Admins and above can delete tasks
CREATE POLICY "Admins can delete tasks"
ON public.tasks FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM project_members WHERE project_members.project_id = tasks.project_id AND project_members.user_id = auth.uid()
  )
  OR public.has_workspace_role_level(auth.uid(), public.get_project_workspace_id(project_id), 'admin')
);

-- Update workspace_members policies to support viewer role in the insert
DROP POLICY IF EXISTS "Admins can add workspace members" ON public.workspace_members;
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
