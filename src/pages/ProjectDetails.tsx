import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useProject, useDeleteProject, useUpdateProject, useProjectMembers } from '@/hooks/useProjects';
import { useTasks, useCreateTask, useUpdateTask, useUpdateTaskStatus, useDeleteTask } from '@/hooks/useTasks';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { TaskBoard } from '@/components/tasks/TaskBoard';
import { TaskModal } from '@/components/tasks/TaskModal';
import { TaskFilters, useTaskFilters, applyTaskFilters } from '@/components/tasks/TaskFilters';
import { ProjectHeader } from '@/components/projects/ProjectHeader';
import { ProjectStats } from '@/components/projects/ProjectStats';
import { ProjectModal } from '@/components/projects/ProjectModal';
import { InviteMemberModal } from '@/components/projects/InviteMemberModal';
import { GanttChart } from '@/components/gantt/GanttChart';
import { TaskCalendar } from '@/components/calendar/TaskCalendar';
import { ActivityTimeline } from '@/components/activity/ActivityTimeline';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import type { Task, TaskStatus, TaskPriority } from '@/types';
import { logActivity } from '@/services/api/activity';
import { createNotification } from '@/services/api/notifications';
import { saveProjectAsTemplate } from '@/services/api/templates';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { LayoutGrid, GanttChartSquare, CalendarDays, Activity } from 'lucide-react';
import { AITaskAssistant } from '@/components/ai/AITaskAssistant';

export default function ProjectDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const permissions = usePermissions();
  const { currentWorkspace } = useWorkspace();
  const { data: project, isLoading } = useProject(id!);
  const { data: tasks = [] } = useTasks(id!);
  const { data: members = [] } = useProjectMembers(id!);
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const updateTaskStatus = useUpdateTaskStatus();
  const deleteTaskMutation = useDeleteTask();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();

  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>('todo');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const { filters, setFilters } = useTaskFilters();

  const handleAddTask = (status: TaskStatus) => {
    if (!permissions.canCreateTask) return;
    setDefaultStatus(status);
    setEditingTask(null);
    setTaskModalOpen(true);
  };

  const handleSubmitTask = async (data: {
    title: string;
    description: string;
    priority: TaskPriority;
    status: TaskStatus;
    due_date: string | null;
    assignee_id: string | null;
  }) => {
    if (!user || !id) return;
    try {
      if (editingTask) {
        if (!permissions.canUpdateTask) { toast.error('No permission'); return; }
        await updateTask.mutateAsync({ id: editingTask.id, ...data });
        const action = data.status === 'completed' && editingTask.status !== 'completed' ? 'completed' : 'updated';
        await logActivity({ project_id: id, user_id: user.id, action, entity_type: 'task', entity_id: editingTask.id, metadata: { title: data.title } });
        if (data.assignee_id && data.assignee_id !== editingTask.assignee_id) {
          await logActivity({ project_id: id, user_id: user.id, action: 'assigned', entity_type: 'task', entity_id: editingTask.id, metadata: { title: data.title } });
          await createNotification({
            user_id: data.assignee_id, project_id: id, type: 'task_assigned',
            title: 'Task Assigned', message: `You were assigned "${data.title}"`, entity_id: editingTask.id,
          });
        }
        if (editingTask.assignee_id && editingTask.assignee_id !== user.id) {
          await createNotification({
            user_id: editingTask.assignee_id, project_id: id, type: 'task_updated',
            title: 'Task Updated', message: `"${data.title}" was updated`, entity_id: editingTask.id,
          });
        }
        toast.success('Task updated');
      } else {
        if (!permissions.canCreateTask) { toast.error('No permission'); return; }
        const created = await createTask.mutateAsync({ ...data, project_id: id, created_by: user.id });
        await logActivity({ project_id: id, user_id: user.id, action: 'created', entity_type: 'task', metadata: { title: data.title } });
        if (data.assignee_id && data.assignee_id !== user.id) {
          await createNotification({
            user_id: data.assignee_id, project_id: id, type: 'task_assigned',
            title: 'Task Assigned', message: `You were assigned "${data.title}"`, entity_id: created.id,
          });
        }
        toast.success('Task created');
      }
    } catch {
      toast.error('Operation failed');
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    if (!permissions.canUpdateTask) { toast.error('No permission to move tasks'); return; }
    try {
      const task = tasks.find(t => t.id === taskId);
      await updateTaskStatus.mutateAsync({ id: taskId, status: newStatus });
      if (user && id) {
        const action = newStatus === 'completed' ? 'completed' : 'moved';
        await logActivity({ project_id: id, user_id: user.id, action, entity_type: 'task', entity_id: taskId, metadata: { title: task?.title, from: task?.status, to: newStatus } });
      }
    } catch {
      toast.error('Failed to move task');
    }
  };

  const handleTaskClick = (task: Task) => {
    setEditingTask(task);
    setTaskModalOpen(true);
  };

  const handleDeleteTask = async () => {
    if (!editingTask || !permissions.canDeleteTask) return;
    if (!confirm('Delete this task?')) return;
    try {
      await deleteTaskMutation.mutateAsync(editingTask.id);
      toast.success('Task deleted');
      setTaskModalOpen(false);
      setEditingTask(null);
    } catch {
      toast.error('Failed to delete task');
    }
  };

  const handleEditProject = async (data: { name: string; description: string; color: string }) => {
    if (!id || !permissions.canEditProject) return;
    try {
      await updateProject.mutateAsync({ id, ...data });
      toast.success('Project updated');
    } catch {
      toast.error('Failed to update project');
    }
  };

  const handleDeleteProject = async () => {
    if (!permissions.canDeleteProject) return;
    if (!confirm('Are you sure you want to delete this project and all its tasks?')) return;
    try {
      await deleteProject.mutateAsync(id!);
      toast.success('Project deleted');
      navigate('/projects');
    } catch {
      toast.error('Failed to delete project');
    }
  };

  const handleDueDateChange = async (taskId: string, newDate: string) => {
    if (!permissions.canUpdateTask) { toast.error('No permission'); return; }
    try {
      await updateTask.mutateAsync({ id: taskId, due_date: newDate });
      toast.success('Due date updated');
    } catch {
      toast.error('Failed to update due date');
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-4">
          <div className="animate-pulse h-16 glass-card rounded-xl" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="animate-pulse h-28 glass-card rounded-xl" />)}
          </div>
          <div className="animate-pulse h-64 glass-card rounded-xl" />
        </div>
      </AppLayout>
    );
  }

  if (!project) {
    return <AppLayout><p className="text-muted-foreground">Project not found</p></AppLayout>;
  }

  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;
  const filteredTasks = applyTaskFilters(tasks, filters);

  return (
    <AppLayout>
      <ProjectHeader
        project={project}
        memberCount={members.length}
        onEdit={() => setEditModalOpen(true)}
        onDelete={handleDeleteProject}
        onInvite={() => setInviteModalOpen(true)}
        onSaveAsTemplate={async () => {
          if (!user || !id || !project) return;
          const name = prompt('Template name:', `${project.name} Template`);
          if (!name) return;
          try {
            await saveProjectAsTemplate({
              name,
              description: project.description || '',
              projectId: id,
              workspaceId: currentWorkspace?.id,
              createdBy: user.id,
            });
            toast.success('Project saved as template!');
          } catch {
            toast.error('Failed to save template');
          }
        }}
        canEdit={permissions.canEditProject}
        canDelete={permissions.canDeleteProject}
        canManageMembers={permissions.canManageMembers}
      />

      <div className="flex items-center justify-between mt-4 mb-2">
        <ProjectStats tasks={tasks} memberCount={members.length} />
        <AITaskAssistant
          projectName={project.name}
          projectDescription={project.description || ''}
          projectContext={tasks.length > 0 ? `Total tasks: ${tasks.length}. Completed: ${tasks.filter(t => t.status === 'completed').length}. In progress: ${tasks.filter(t => t.status === 'in-progress').length}. Todo: ${tasks.filter(t => t.status === 'todo').length}. Overdue: ${tasks.filter(t => t.status !== 'completed' && t.due_date && new Date(t.due_date) < new Date()).length}. Tasks: ${tasks.map(t => `"${t.title}" (${t.status}, ${t.priority})`).slice(0, 20).join(', ')}` : undefined}
          onCreateTasks={(newTasks) => {
            if (!user || !id) return;
            newTasks.forEach(t => {
              createTask.mutate({
                project_id: id,
                title: t.title,
                description: t.description,
                priority: t.priority,
                created_by: user.id,
              });
            });
          }}
        />
      </div>

      <div className="glass-card rounded-xl p-4 my-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">Overall Progress</span>
          <span className="text-sm text-muted-foreground">{completedCount}/{tasks.length} tasks · {progress}%</span>
        </div>
        <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {permissions.isReadOnly && (
        <div className="mb-4 px-4 py-2 rounded-lg bg-warning/10 border border-warning/20 text-warning text-sm">
          You have read-only access to this workspace.
        </div>
      )}

      <Tabs defaultValue="board" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="board" className="gap-1.5">
            <LayoutGrid size={14} />
            Board
          </TabsTrigger>
          <TabsTrigger value="timeline" className="gap-1.5">
            <GanttChartSquare size={14} />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="calendar" className="gap-1.5">
            <CalendarDays size={14} />
            Calendar
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-1.5">
            <Activity size={14} />
            Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="board">
          <div className="mb-6">
            <TaskFilters filters={filters} onFiltersChange={setFilters} members={members as any} showAssigneeFilter={true} />
          </div>
          <TaskBoard
            tasks={filteredTasks}
            onTaskClick={handleTaskClick}
            onAddTask={permissions.canCreateTask ? handleAddTask : undefined}
            onStatusChange={handleStatusChange}
            readOnly={permissions.isReadOnly}
          />
        </TabsContent>

        <TabsContent value="timeline">
          <GanttChart
            tasks={filteredTasks}
            onTaskClick={handleTaskClick}
            onDueDateChange={permissions.canUpdateTask ? handleDueDateChange : undefined}
            readOnly={permissions.isReadOnly}
          />
        </TabsContent>

        <TabsContent value="calendar">
          <TaskCalendar
            tasks={filteredTasks}
            onTaskClick={handleTaskClick}
          />
        </TabsContent>

        <TabsContent value="activity">
          <ActivityTimeline projectId={id!} />
        </TabsContent>
      </Tabs>

      <TaskModal
        open={taskModalOpen}
        onClose={() => { setTaskModalOpen(false); setEditingTask(null); }}
        onSubmit={handleSubmitTask}
        onDelete={editingTask && permissions.canDeleteTask ? handleDeleteTask : undefined}
        defaultStatus={defaultStatus}
        members={members as any}
        taskId={editingTask?.id}
        projectId={id}
        readOnly={permissions.isReadOnly}
        initialData={editingTask ? {
          title: editingTask.title,
          description: editingTask.description ?? '',
          priority: editingTask.priority,
          status: editingTask.status,
          due_date: editingTask.due_date,
          assignee_id: editingTask.assignee_id,
        } : undefined}
      />

      <ProjectModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSubmit={handleEditProject}
        initialData={{
          name: project.name,
          description: project.description ?? '',
          color: project.color,
        }}
      />

      <InviteMemberModal
        open={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        projectId={id!}
        members={members as any}
        currentUserId={user?.id ?? ''}
        ownerId={project.owner_id}
      />
    </AppLayout>
  );
}
