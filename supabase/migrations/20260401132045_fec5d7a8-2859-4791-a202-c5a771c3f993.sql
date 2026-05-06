
-- 1. Make task-attachments bucket private
UPDATE storage.buckets SET public = false WHERE id = 'task-attachments';

-- 2. Drop existing permissive storage policies for task-attachments
DROP POLICY IF EXISTS "Anyone can view task attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload task attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own task attachments" ON storage.objects;

-- 3. Create proper storage policies
CREATE POLICY "Project members can view task attachments"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'task-attachments'
    AND EXISTS (
      SELECT 1 FROM public.task_attachments ta
      JOIN public.tasks t ON t.id = ta.task_id
      WHERE ta.file_path = name
        AND public.is_project_member(auth.uid(), t.project_id)
    )
  );

CREATE POLICY "Authenticated users can upload to own folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'task-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own task attachments"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'task-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 4. Fix profiles SELECT policy - restrict to self or workspace peers
DROP POLICY IF EXISTS "Profiles viewable by authenticated users" ON public.profiles;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Workspace peers can view profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm1
      JOIN public.workspace_members wm2 ON wm1.workspace_id = wm2.workspace_id
      WHERE wm1.user_id = auth.uid()
        AND wm2.user_id = profiles.user_id
    )
  );

-- 5. Fix notifications INSERT - scope recipient to self or shared workspace
DROP POLICY IF EXISTS "Project members can insert notifications" ON public.notifications;

CREATE POLICY "Scoped notification insert"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    OR (
      ((project_id IS NULL) OR public.is_project_member(auth.uid(), project_id))
      AND EXISTS (
        SELECT 1 FROM public.workspace_members wm1
        JOIN public.workspace_members wm2 ON wm1.workspace_id = wm2.workspace_id
        WHERE wm1.user_id = auth.uid()
          AND wm2.user_id = notifications.user_id
      )
    )
  );

-- 6. Fix project_templates SELECT - null workspace templates visible only to creator
DROP POLICY IF EXISTS "Workspace members can view templates" ON public.project_templates;

CREATE POLICY "Users can view accessible templates"
  ON public.project_templates FOR SELECT
  TO authenticated
  USING (
    (workspace_id IS NULL AND created_by = auth.uid())
    OR (workspace_id IS NOT NULL AND public.is_workspace_member(auth.uid(), workspace_id))
  );
