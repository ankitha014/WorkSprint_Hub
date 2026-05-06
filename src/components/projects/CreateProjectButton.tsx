import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { CreateProjectModal } from './CreateProjectModal';
import { useCreateProject } from '@/hooks/useProjects';
import { toast } from 'sonner';
import type { ProjectFormData } from './ProjectForm';

export function CreateProjectButton() {
  const [open, setOpen] = useState(false);
  const createProject = useCreateProject();
  const navigate = useNavigate();

  // Listen for keyboard shortcut event
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener('shortcut:new-project', handler);
    return () => window.removeEventListener('shortcut:new-project', handler);
  }, []);

  const handleSubmit = async (data: ProjectFormData) => {
    try {
      const project = await createProject.mutateAsync(data);
      toast.success('Project created successfully!');
      setOpen(false);
      navigate(`/projects/${project.id}`);
    } catch {
      toast.error('Failed to create project');
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus size={16} className="mr-2" /> New Project
      </Button>
      <CreateProjectModal
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={handleSubmit}
        isSubmitting={createProject.isPending}
      />
    </>
  );
}
