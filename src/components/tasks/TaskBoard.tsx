import type { Task, TaskStatus } from '@/types';
import { TaskColumn } from './TaskColumn';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';

interface TaskBoardProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onAddTask?: (status: TaskStatus) => void;
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
  readOnly?: boolean;
}

const columns: { status: TaskStatus; label: string; color: string }[] = [
  { status: 'todo', label: 'To Do', color: 'bg-muted-foreground' },
  { status: 'in-progress', label: 'In Progress', color: 'bg-warning' },
  { status: 'completed', label: 'Completed', color: 'bg-success' },
];

export function TaskBoard({ tasks, onTaskClick, onAddTask, onStatusChange, readOnly }: TaskBoardProps) {
  const handleDragEnd = (result: DropResult) => {
    if (readOnly || !result.destination) return;

    const sourceStatus = result.source.droppableId as TaskStatus;
    const destStatus = result.destination.droppableId as TaskStatus;

    if (sourceStatus === destStatus) return;

    const taskId = result.draggableId;
    onStatusChange?.(taskId, destStatus);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columns.map((col) => {
          const columnTasks = tasks.filter((t) => t.status === col.status);
          return (
            <TaskColumn
              key={col.status}
              status={col.status}
              label={col.label}
              color={col.color}
              tasks={columnTasks}
              onTaskClick={onTaskClick}
              onAddTask={readOnly ? undefined : onAddTask}
            />
          );
        })}
      </div>
    </DragDropContext>
  );
}
