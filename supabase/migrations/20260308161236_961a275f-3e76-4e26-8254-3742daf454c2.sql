
CREATE TABLE public.project_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  template_data jsonb NOT NULL DEFAULT '{"tasks":[]}'::jsonb,
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.project_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace members can view templates"
  ON public.project_templates FOR SELECT
  TO authenticated
  USING (
    workspace_id IS NULL OR is_workspace_member(auth.uid(), workspace_id)
  );

CREATE POLICY "Users can create templates"
  ON public.project_templates FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creators can update templates"
  ON public.project_templates FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Creators can delete templates"
  ON public.project_templates FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);
