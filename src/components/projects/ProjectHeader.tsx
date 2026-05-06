import { ArrowLeft, Edit2, Trash2, UserPlus, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Project } from '@/types';

interface ProjectHeaderProps {
  project: Project;
  memberCount: number;
  onEdit: () => void;
  onDelete: () => void;
  onInvite: () => void;
  onSaveAsTemplate?: () => void;
  canEdit?: boolean;
  canDelete?: boolean;
  canManageMembers?: boolean;
}

export function ProjectHeader({ project, memberCount, onEdit, onDelete, onInvite, onSaveAsTemplate, canEdit = true, canDelete = true, canManageMembers = true }: ProjectHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
      <button onClick={() => navigate('/projects')} className="p-2 rounded-lg hover:bg-muted text-muted-foreground self-start">
        <ArrowLeft size={20} />
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="w-9 h-9 rounded-lg shrink-0" style={{ backgroundColor: project.color }} />
          <h1 className="font-heading text-2xl font-bold text-foreground truncate">{project.name}</h1>
          <span className={cn(
            "text-xs font-medium px-2.5 py-1 rounded-full shrink-0",
            project.status === 'active' && "bg-success/10 text-success",
            project.status === 'completed' && "bg-primary/10 text-primary",
            project.status === 'archived' && "bg-muted text-muted-foreground",
          )}>
            {project.status}
          </span>
        </div>
        {project.description && (
          <p className="text-muted-foreground text-sm mt-1 ml-12">{project.description}</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-12 sm:ml-0">
        {canManageMembers && (
          <Button variant="outline" size="sm" onClick={onInvite}>
            <UserPlus size={14} className="mr-1.5" /> Invite ({memberCount})
          </Button>
        )}
        {canEdit && (
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Edit2 size={14} className="mr-1.5" /> Edit
          </Button>
        )}
        {onSaveAsTemplate && (
          <Button variant="outline" size="sm" onClick={onSaveAsTemplate}>
            <FileText size={14} className="mr-1.5" /> Save as Template
          </Button>
        )}
        {canDelete && (
          <Button variant="destructive" size="sm" onClick={onDelete}>
            <Trash2 size={14} className="mr-1.5" /> Delete
          </Button>
        )}
      </div>
    </div>
  );
}
