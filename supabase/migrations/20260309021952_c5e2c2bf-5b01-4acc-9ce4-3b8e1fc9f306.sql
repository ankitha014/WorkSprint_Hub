
-- Create a security definer function to check project membership without RLS recursion
CREATE OR REPLACE FUNCTION public.is_project_member(_user_id uuid, _project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_members
    WHERE user_id = _user_id AND project_id = _project_id
  )
$$;

-- Drop the recursive SELECT policy on project_members
DROP POLICY IF EXISTS "Members can view project members" ON public.project_members;

-- Recreate using the security definer function
CREATE POLICY "Members can view project members"
ON public.project_members FOR SELECT TO authenticated
USING (public.is_project_member(auth.uid(), project_id));

-- Fix tasks SELECT policy to use the new function
DROP POLICY IF EXISTS "Workspace viewers can view tasks" ON public.tasks;
CREATE POLICY "Workspace viewers can view tasks"
ON public.tasks FOR SELECT TO authenticated
USING (
  public.is_project_member(auth.uid(), project_id)
  OR has_workspace_role_level(auth.uid(), get_project_workspace_id(project_id), 'viewer'::text)
);

-- Fix tasks INSERT policy
DROP POLICY IF EXISTS "Members can create tasks" ON public.tasks;
CREATE POLICY "Members can create tasks"
ON public.tasks FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = created_by
  AND (
    public.is_project_member(auth.uid(), project_id)
    OR has_workspace_role_level(auth.uid(), get_project_workspace_id(project_id), 'member'::text)
  )
);

-- Fix tasks UPDATE policy
DROP POLICY IF EXISTS "Members can update tasks" ON public.tasks;
CREATE POLICY "Members can update tasks"
ON public.tasks FOR UPDATE TO authenticated
USING (
  public.is_project_member(auth.uid(), project_id)
  OR has_workspace_role_level(auth.uid(), get_project_workspace_id(project_id), 'member'::text)
);

-- Fix tasks DELETE policy
DROP POLICY IF EXISTS "Admins can delete tasks" ON public.tasks;
CREATE POLICY "Admins can delete tasks"
ON public.tasks FOR DELETE TO authenticated
USING (
  public.is_project_member(auth.uid(), project_id)
  OR has_workspace_role_level(auth.uid(), get_project_workspace_id(project_id), 'admin'::text)
);

-- Fix activity_log policies
DROP POLICY IF EXISTS "Members can view activity" ON public.activity_log;
CREATE POLICY "Members can view activity"
ON public.activity_log FOR SELECT TO authenticated
USING (public.is_project_member(auth.uid(), project_id));

DROP POLICY IF EXISTS "Members can insert activity" ON public.activity_log;
CREATE POLICY "Members can insert activity"
ON public.activity_log FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND public.is_project_member(auth.uid(), project_id));

-- Fix notifications INSERT policy
DROP POLICY IF EXISTS "Project members can insert notifications" ON public.notifications;
CREATE POLICY "Project members can insert notifications"
ON public.notifications FOR INSERT TO authenticated
WITH CHECK (project_id IS NULL OR public.is_project_member(auth.uid(), project_id));

-- Fix task_attachments policies
DROP POLICY IF EXISTS "Members can view attachments" ON public.task_attachments;
CREATE POLICY "Members can view attachments"
ON public.task_attachments FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM tasks t WHERE t.id = task_attachments.task_id AND public.is_project_member(auth.uid(), t.project_id)
));

DROP POLICY IF EXISTS "Members can insert attachments" ON public.task_attachments;
CREATE POLICY "Members can insert attachments"
ON public.task_attachments FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND EXISTS (
  SELECT 1 FROM tasks t WHERE t.id = task_attachments.task_id AND public.is_project_member(auth.uid(), t.project_id)
));

-- Fix task_comments policies
DROP POLICY IF EXISTS "Members can view comments" ON public.task_comments;
CREATE POLICY "Members can view comments"
ON public.task_comments FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM tasks t WHERE t.id = task_comments.task_id AND public.is_project_member(auth.uid(), t.project_id)
));

DROP POLICY IF EXISTS "Members can insert comments" ON public.task_comments;
CREATE POLICY "Members can insert comments"
ON public.task_comments FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND EXISTS (
  SELECT 1 FROM tasks t WHERE t.id = task_comments.task_id AND public.is_project_member(auth.uid(), t.project_id)
));

-- Fix time_entries SELECT policy
DROP POLICY IF EXISTS "Members can view time entries" ON public.time_entries;
CREATE POLICY "Members can view time entries"
ON public.time_entries FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM tasks t WHERE t.id = time_entries.task_id AND public.is_project_member(auth.uid(), t.project_id)
  )
  OR has_workspace_role_level(auth.uid(), get_project_workspace_id((SELECT tasks.project_id FROM tasks WHERE tasks.id = time_entries.task_id)), 'viewer'::text)
);

-- Fix time_entries INSERT policy
DROP POLICY IF EXISTS "Members can insert time entries" ON public.time_entries;
CREATE POLICY "Members can insert time entries"
ON public.time_entries FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND (
    EXISTS (
      SELECT 1 FROM tasks t WHERE t.id = time_entries.task_id AND public.is_project_member(auth.uid(), t.project_id)
    )
    OR has_workspace_role_level(auth.uid(), get_project_workspace_id((SELECT tasks.project_id FROM tasks WHERE tasks.id = time_entries.task_id)), 'member'::text)
  )
);

-- Fix projects SELECT policy
DROP POLICY IF EXISTS "Workspace members can view projects" ON public.projects;
CREATE POLICY "Workspace members can view projects"
ON public.projects FOR SELECT TO authenticated
USING (
  (workspace_id IS NULL AND public.is_project_member(auth.uid(), id))
  OR has_workspace_role_level(auth.uid(), workspace_id, 'viewer'::text)
);

-- Fix project_members INSERT policy
DROP POLICY IF EXISTS "Owners can manage members" ON public.project_members;
CREATE POLICY "Owners can manage members"
ON public.project_members FOR INSERT TO authenticated
WITH CHECK (
  (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_members.project_id AND projects.owner_id = auth.uid()))
  OR (user_id = auth.uid())
);

-- Fix project_members DELETE policy
DROP POLICY IF EXISTS "Owners can delete members" ON public.project_members;
CREATE POLICY "Owners can delete members"
ON public.project_members FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_members.project_id AND projects.owner_id = auth.uid()));
