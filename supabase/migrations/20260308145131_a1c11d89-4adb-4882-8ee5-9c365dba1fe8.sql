
CREATE TABLE public.time_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_time TIMESTAMP WITH TIME ZONE,
  duration INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;

-- Users can view time entries for tasks they can access (via workspace membership)
CREATE POLICY "Members can view time entries"
ON public.time_entries FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM tasks t
    JOIN project_members pm ON pm.project_id = t.project_id
    WHERE t.id = time_entries.task_id AND pm.user_id = auth.uid()
  )
  OR public.has_workspace_role_level(
    auth.uid(),
    public.get_project_workspace_id(
      (SELECT project_id FROM tasks WHERE id = time_entries.task_id)
    ),
    'viewer'
  )
);

-- Members can insert their own time entries
CREATE POLICY "Members can insert time entries"
ON public.time_entries FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND (
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN project_members pm ON pm.project_id = t.project_id
      WHERE t.id = time_entries.task_id AND pm.user_id = auth.uid()
    )
    OR public.has_workspace_role_level(
      auth.uid(),
      public.get_project_workspace_id(
        (SELECT project_id FROM tasks WHERE id = time_entries.task_id)
      ),
      'member'
    )
  )
);

-- Users can update their own time entries
CREATE POLICY "Users can update own time entries"
ON public.time_entries FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Users can delete their own time entries
CREATE POLICY "Users can delete own time entries"
ON public.time_entries FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
