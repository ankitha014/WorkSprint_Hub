import { useState } from 'react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useCreateWorkspace } from '@/hooks/useWorkspaces';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export function WorkspaceSwitcher({ collapsed }: { collapsed?: boolean }) {
  const { workspaces, currentWorkspace, setCurrentWorkspace, refreshWorkspaces } = useWorkspace();
  const createWorkspace = useCreateWorkspace();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      const ws = await createWorkspace.mutateAsync(newName.trim());
      await refreshWorkspaces();
      setCurrentWorkspace(ws);
      setNewName('');
      setCreating(false);
      toast.success('Workspace created!');
    } catch {
      toast.error('Failed to create workspace');
    }
  };

  if (collapsed) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
            {currentWorkspace?.name?.charAt(0).toUpperCase() || 'W'}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2" side="right" align="start">
          <WorkspaceList
            workspaces={workspaces}
            currentWorkspace={currentWorkspace}
            onSelect={(ws) => { setCurrentWorkspace(ws); setOpen(false); }}
            creating={creating}
            setCreating={setCreating}
            newName={newName}
            setNewName={setNewName}
            onCreateSubmit={handleCreate}
          />
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="w-full justify-between px-3 py-2 h-auto font-medium text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">
              {currentWorkspace?.name?.charAt(0).toUpperCase() || 'W'}
            </div>
            <span className="truncate text-sm">{currentWorkspace?.name || 'Select workspace'}</span>
          </div>
          <ChevronsUpDown size={14} className="text-sidebar-foreground/70 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start">
        <WorkspaceList
          workspaces={workspaces}
          currentWorkspace={currentWorkspace}
          onSelect={(ws) => { setCurrentWorkspace(ws); setOpen(false); }}
          creating={creating}
          setCreating={setCreating}
          newName={newName}
          setNewName={setNewName}
          onCreateSubmit={handleCreate}
        />
      </PopoverContent>
    </Popover>
  );
}

function WorkspaceList({
  workspaces,
  currentWorkspace,
  onSelect,
  creating,
  setCreating,
  newName,
  setNewName,
  onCreateSubmit,
}: {
  workspaces: any[];
  currentWorkspace: any;
  onSelect: (ws: any) => void;
  creating: boolean;
  setCreating: (v: boolean) => void;
  newName: string;
  setNewName: (v: string) => void;
  onCreateSubmit: () => void;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground px-2 py-1">Workspaces</p>
      {workspaces.map((ws) => (
        <button
          key={ws.id}
          onClick={() => onSelect(ws)}
          className={cn(
            'flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm transition-colors',
            ws.id === currentWorkspace?.id
              ? 'bg-accent/20 text-accent-foreground'
              : 'hover:bg-muted text-foreground'
          )}
        >
          <div className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
            {ws.name.charAt(0).toUpperCase()}
          </div>
          <span className="truncate flex-1 text-left">{ws.name}</span>
          {ws.id === currentWorkspace?.id && <Check size={14} className="text-primary shrink-0" />}
        </button>
      ))}

      <div className="border-t border-border my-1" />

      {creating ? (
        <div className="flex gap-1 px-1">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Workspace name"
            className="h-8 text-sm"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && onCreateSubmit()}
          />
          <Button size="sm" className="h-8 px-2" onClick={onCreateSubmit}>
            Add
          </Button>
        </div>
      ) : (
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <Plus size={14} />
          <span>New workspace</span>
        </button>
      )}
    </div>
  );
}
