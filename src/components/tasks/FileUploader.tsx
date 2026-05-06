import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchTaskAttachments,
  uploadTaskAttachment,
  deleteTaskAttachment,
  getAttachmentSignedUrl,
  type TaskAttachment,
} from '@/services/api/attachments';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Paperclip, Upload, Trash2, Download, FileText, Image, File, Loader2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface FileUploaderProps {
  taskId: string;
}

const FILE_ICONS: Record<string, typeof FileText> = {
  image: Image,
  default: File,
  text: FileText,
};

function getFileIcon(contentType: string | null) {
  if (!contentType) return FILE_ICONS.default;
  if (contentType.startsWith('image/')) return FILE_ICONS.image;
  if (contentType.startsWith('text/') || contentType.includes('pdf')) return FILE_ICONS.text;
  return FILE_ICONS.default;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileUploader({ taskId }: FileUploaderProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: attachments = [], isLoading } = useQuery({
    queryKey: ['task-attachments', taskId],
    queryFn: () => fetchTaskAttachments(taskId),
    enabled: !!taskId,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTaskAttachment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-attachments', taskId] });
      toast.success('File deleted');
    },
    onError: () => toast.error('Failed to delete file'),
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length || !user) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (file.size > 20 * 1024 * 1024) {
          toast.error(`${file.name} exceeds 20MB limit`);
          continue;
        }
        await uploadTaskAttachment(taskId, user.id, file);
      }
      queryClient.invalidateQueries({ queryKey: ['task-attachments', taskId] });
      toast.success('File(s) uploaded');
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDownload = async (attachment: TaskAttachment) => {
    try {
      const url = await getAttachmentSignedUrl(attachment.file_path);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.file_name;
      a.target = '_blank';
      a.click();
    } catch {
      toast.error('Failed to get download link');
    }
  };

  const handlePreview = async (attachment: TaskAttachment) => {
    try {
      const url = await getAttachmentSignedUrl(attachment.file_path);
      if (attachment.content_type?.startsWith('image/')) {
        setPreviewUrl(url);
      } else {
        window.open(url, '_blank');
      }
    } catch {
      toast.error('Failed to get preview link');
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Paperclip size={16} className="text-muted-foreground" />
        <h3 className="font-heading font-semibold text-sm text-foreground">
          Attachments ({attachments.length})
        </h3>
      </div>

      {/* File list */}
      <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-3">
            <Loader2 size={16} className="animate-spin text-muted-foreground" />
          </div>
        ) : attachments.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-3">No files attached yet.</p>
        ) : (
          attachments.map((att) => {
            const IconComp = getFileIcon(att.content_type);
            const isImage = att.content_type?.startsWith('image/');
            return (
              <div
                key={att.id}
                className="group flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2"
              >
                <IconComp size={16} className="text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{att.file_name}</p>
                  <p className="text-[10px] text-muted-foreground">{formatFileSize(att.file_size)}</p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {isImage && (
                    <button
                      onClick={() => handlePreview(att)}
                      className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
                      title="Preview"
                    >
                      <Eye size={12} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDownload(att)}
                    className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
                    title="Download"
                  >
                    <Download size={12} />
                  </button>
                  {att.user_id === user?.id && (
                    <button
                      onClick={() => deleteMutation.mutate(att)}
                      className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                      title="Delete"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Upload button */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleUpload}
        className="hidden"
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={uploading}
        onClick={() => fileInputRef.current?.click()}
        className="w-full gap-1.5 text-xs"
      >
        {uploading ? (
          <><Loader2 size={14} className="animate-spin" /> Uploading...</>
        ) : (
          <><Upload size={14} /> Attach files</>
        )}
      </Button>

      {/* Image preview dialog */}
      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="sm:max-w-[600px] p-2">
          {previewUrl && (
            <img src={previewUrl} alt="Preview" className="w-full h-auto rounded-lg" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
