-- Create storage bucket for task attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('task-attachments', 'task-attachments', true);

-- Create task_attachments table
CREATE TABLE public.task_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint NOT NULL DEFAULT 0,
  content_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.task_attachments ENABLE ROW LEVEL SECURITY;

-- RLS: Members can view attachments for tasks in their projects
CREATE POLICY "Members can view attachments"
ON public.task_attachments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM tasks t
    JOIN project_members pm ON pm.project_id = t.project_id
    WHERE t.id = task_attachments.task_id AND pm.user_id = auth.uid()
  )
);

-- RLS: Members can insert attachments
CREATE POLICY "Members can insert attachments"
ON public.task_attachments
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM tasks t
    JOIN project_members pm ON pm.project_id = t.project_id
    WHERE t.id = task_attachments.task_id AND pm.user_id = auth.uid()
  )
);

-- RLS: Users can delete own attachments
CREATE POLICY "Users can delete own attachments"
ON public.task_attachments
FOR DELETE
USING (auth.uid() = user_id);

-- Storage RLS: Authenticated users can upload to task-attachments bucket
CREATE POLICY "Authenticated users can upload task attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'task-attachments');

-- Storage RLS: Anyone can view task attachments (public bucket)
CREATE POLICY "Anyone can view task attachments"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'task-attachments');

-- Storage RLS: Users can delete their own uploaded files
CREATE POLICY "Users can delete own task attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'task-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);