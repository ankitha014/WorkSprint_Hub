
-- Fix: task_attachments delete policy should be authenticated only
DROP POLICY IF EXISTS "Users can delete own attachments" ON public.task_attachments;
CREATE POLICY "Users can delete own attachments"
  ON public.task_attachments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Fix: project_members insert - remove self-join clause
DROP POLICY IF EXISTS "Owners can manage members" ON public.project_members;
CREATE POLICY "Owners can manage members"
  ON public.project_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_members.project_id
        AND projects.owner_id = auth.uid()
    )
    OR
    -- Allow project owner to add themselves as initial member
    (
      user_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.projects
        WHERE projects.id = project_members.project_id
          AND projects.owner_id = auth.uid()
      )
    )
  );

-- Fix: Restrict avatars bucket listing to authenticated users
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;

CREATE POLICY "Authenticated users can view avatars"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'avatars');
