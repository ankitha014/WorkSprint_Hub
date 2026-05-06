
DROP POLICY "Authenticated users can insert notifications" ON public.notifications;

CREATE POLICY "Project members can insert notifications" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (
    project_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.project_members
      WHERE project_members.project_id = notifications.project_id
        AND project_members.user_id = auth.uid()
    )
  );
