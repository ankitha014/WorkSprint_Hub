
-- =============================================
-- FIX: projects SELECT policy (was comparing wrong columns)
-- =============================================
DROP POLICY IF EXISTS "Members can view projects" ON public.projects;
CREATE POLICY "Members can view projects" ON public.projects
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_members.project_id = projects.id
      AND project_members.user_id = auth.uid()
  ));

-- =============================================
-- FIX: project_members SELECT policy (was self-referencing)
-- =============================================
DROP POLICY IF EXISTS "Members can view project members" ON public.project_members;
CREATE POLICY "Members can view project members" ON public.project_members
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.project_id = project_members.project_id
      AND pm.user_id = auth.uid()
  ));

-- =============================================
-- NEW: task_comments table
-- =============================================
CREATE TABLE public.task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

-- Members of the task's project can view comments
CREATE POLICY "Members can view comments" ON public.task_comments
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.tasks t
    JOIN public.project_members pm ON pm.project_id = t.project_id
    WHERE t.id = task_comments.task_id
      AND pm.user_id = auth.uid()
  ));

-- Members can insert comments (must be own user_id)
CREATE POLICY "Members can insert comments" ON public.task_comments
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.tasks t
      JOIN public.project_members pm ON pm.project_id = t.project_id
      WHERE t.id = task_comments.task_id
        AND pm.user_id = auth.uid()
    )
  );

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments" ON public.task_comments
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX idx_task_comments_task_id ON public.task_comments(task_id);
