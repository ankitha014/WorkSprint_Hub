import type { Project } from '@/types';
import { FolderKanban, MoreHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface ProjectCardProps {
  project: Project;
  taskCount?: number;
}

export function ProjectCard({ project, taskCount = 0 }: ProjectCardProps) {
  return (
    <Link to={`/projects/${project.id}`} className="block animate-fade-up">
      <div className="glass-card rounded-2xl p-6 hover-tilt hover:border-primary/40 group">
        <div className="flex items-start justify-between mb-4">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: project.color + '33', color: '#fff' }}
          >
            <FolderKanban size={20} />
          </div>
          <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-white/10">
            <MoreHorizontal size={16} className="text-white/70" />
          </button>
        </div>
        <h3 className="font-heading font-semibold text-card-foreground mb-1">{project.name}</h3>
        <p className="text-sm text-white/70 line-clamp-2 mb-4">{project.description || 'No description'}</p>
        <div className="flex items-center justify-between">
          <span className={cn(
            "text-xs font-medium px-2.5 py-1 rounded-full",
            project.status === 'active' && "bg-success/30 text-white",
            project.status === 'completed' && "bg-primary/30 text-white",
            project.status === 'archived' && "bg-white/10 text-white/70",
          )}>
            {project.status}
          </span>
          <span className="text-xs text-white/70">{taskCount} tasks</span>
        </div>
      </div>
    </Link>
  );
}
