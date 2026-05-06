import { supabase } from '@/integrations/supabase/client';

export interface TemplateTask {
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in-progress' | 'completed';
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string | null;
  template_data: { tasks: TemplateTask[] };
  workspace_id: string | null;
  created_by: string;
  created_at: string;
}

export async function fetchTemplates(workspaceId?: string) {
  let query = supabase.from('project_templates').select('*').order('created_at', { ascending: false });
  if (workspaceId) {
    query = query.or(`workspace_id.eq.${workspaceId},workspace_id.is.null`);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data as unknown as ProjectTemplate[];
}

export async function createTemplate(template: {
  name: string;
  description?: string;
  template_data: { tasks: TemplateTask[] };
  workspace_id?: string | null;
  created_by: string;
}) {
  const { data, error } = await supabase
    .from('project_templates')
    .insert([{
      ...template,
      template_data: template.template_data as any,
    }])
    .select()
    .single();
  if (error) throw error;
  return data as unknown as ProjectTemplate;
}

export async function deleteTemplate(id: string) {
  const { error } = await supabase.from('project_templates').delete().eq('id', id);
  if (error) throw error;
}

export async function saveProjectAsTemplate(params: {
  name: string;
  description?: string;
  projectId: string;
  workspaceId?: string | null;
  createdBy: string;
}) {
  // Fetch tasks from project
  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('title, description, priority, status')
    .eq('project_id', params.projectId)
    .order('position', { ascending: true });
  if (tasksError) throw tasksError;

  return createTemplate({
    name: params.name,
    description: params.description,
    template_data: {
      tasks: (tasks || []).map(t => ({
        title: t.title,
        description: t.description || '',
        priority: t.priority as any,
        status: 'todo' as const,
      })),
    },
    workspace_id: params.workspaceId,
    created_by: params.createdBy,
  });
}
