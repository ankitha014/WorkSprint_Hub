ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS due_date date DEFAULT NULL;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'medium';