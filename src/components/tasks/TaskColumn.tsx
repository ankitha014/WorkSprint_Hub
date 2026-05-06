import type { Task, TaskStatus } from '@/types';
import { TaskCard } from './TaskCard';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import { Droppable, Draggable } from '@hello-pangea/dnd';

interface TaskColumnProps {
  status: TaskStatus;
  label: string;
  color: string;
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onAddTask?: (status: TaskStatus) => void;
}

export function TaskColumn({ status, label, color, tasks, onTaskClick, onAddTask }: TaskColumnProps) {
  return (
    <Droppable droppableId={status}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={cn(
            "kanban-column transition-colors duration-200",
            snapshot.isDraggingOver && "bg-primary/5 border-2 border-dashed border-primary/20"
          )}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className={cn("w-2.5 h-2.5 rounded-full", color)} />
              <h3 className="font-heading font-semibold text-sm text-foreground">{label}</h3>
              <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                {tasks.length}
              </span>
            </div>
            <button
              onClick={() => onAddTask?.(status)}
              className="p-1 rounded hover:bg-card text-muted-foreground hover:text-foreground transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>
          <div className="space-y-3 min-h-[60px]">
            {tasks.map((task, index) => (
              <Draggable key={task.id} draggableId={task.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={cn(snapshot.isDragging && "opacity-90 rotate-1")}
                  >
                    <TaskCard task={task} onClick={() => onTaskClick?.(task)} />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
            {tasks.length === 0 && !snapshot.isDraggingOver && (
              <div className="text-center py-8 text-xs text-muted-foreground">
                Drop tasks here or click + to add
              </div>
            )}
          </div>
        </div>
      )}
    </Droppable>
  );
}
