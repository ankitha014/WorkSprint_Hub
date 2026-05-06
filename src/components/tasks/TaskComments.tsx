import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchTaskComments, createTaskComment, deleteTaskComment } from '@/services/api/comments';
import { createNotification } from '@/services/api/notifications';
import type { NotificationType } from '@/services/api/notifications';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Send, Trash2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface TaskCommentsProps {
  taskId: string;
  taskTitle?: string;
  assigneeId?: string | null;
  projectId?: string;
}

export function TaskComments({ taskId, taskTitle, assigneeId, projectId }: TaskCommentsProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState('');

  useRealtimeSubscription({
    table: 'task_comments',
    filter: `task_id=eq.${taskId}`,
    queryKeys: [['task-comments', taskId]],
  });

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['task-comments', taskId],
    queryFn: () => fetchTaskComments(taskId),
    enabled: !!taskId,
  });

  const addComment = useMutation({
    mutationFn: (comment: string) =>
      createTaskComment({ task_id: taskId, user_id: user!.id, comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-comments', taskId] });
      setNewComment('');
      // Notify task assignee about the comment
      if (assigneeId && assigneeId !== user!.id && projectId) {
        createNotification({
          user_id: assigneeId,
          project_id: projectId,
          type: 'comment_added',
          title: 'New Comment',
          message: `Someone commented on "${taskTitle || 'a task'}"`,
          entity_id: taskId,
        });
      }
    },
    onError: () => toast.error('Failed to add comment'),
  });

  const removeComment = useMutation({
    mutationFn: deleteTaskComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-comments', taskId] });
    },
    onError: () => toast.error('Failed to delete comment'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    addComment.mutate(newComment.trim());
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare size={16} className="text-muted-foreground" />
        <h3 className="font-heading font-semibold text-sm text-foreground">
          Comments ({comments.length})
        </h3>
      </div>

      <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 size={16} className="animate-spin text-muted-foreground" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">No comments yet. Be the first to add one.</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="group rounded-lg bg-muted/50 p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-foreground">
                  {comment.user_id === user?.id ? 'You' : 'Team member'}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">
                    {format(new Date(comment.created_at), 'MMM d, h:mm a')}
                  </span>
                  {comment.user_id === user?.id && (
                    <button
                      onClick={() => removeComment.mutate(comment.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-sm text-foreground leading-relaxed">{comment.comment}</p>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          rows={2}
          className="flex-1 resize-none text-sm"
        />
        <Button
          type="submit"
          size="sm"
          disabled={!newComment.trim() || addComment.isPending}
          className="self-end"
        >
          <Send size={14} />
        </Button>
      </form>
    </div>
  );
}
