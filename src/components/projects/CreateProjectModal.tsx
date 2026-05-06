import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ProjectForm, type ProjectFormData } from './ProjectForm';
import { useWorkspace } from '@/contexts/WorkspaceContext';

interface CreateProjectModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ProjectFormData) => void;
  isSubmitting?: boolean;
}

export function CreateProjectModal({ open, onClose, onSubmit, isSubmitting }: CreateProjectModalProps) {
  const { workspaces, currentWorkspace } = useWorkspace();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="font-heading">Create New Project</DialogTitle>
        </DialogHeader>
        <ProjectForm
          workspaces={workspaces}
          currentWorkspaceId={currentWorkspace?.id}
          onSubmit={onSubmit}
          onCancel={onClose}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
}
