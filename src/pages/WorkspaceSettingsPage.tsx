import { AppLayout } from '@/components/layout/AppLayout';
import { PageBackground } from '@/components/layout/PageBackground';
import { WorkspaceSettings } from '@/components/workspace/WorkspaceSettings';
import { TypingText } from '@/components/ui/typing-text';

export default function WorkspaceSettingsPage() {
  return (
    <AppLayout transparentBackground><PageBackground />
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold text-foreground"><TypingText text="Workspace Settings" /></h1>
          <p className="text-muted-foreground mt-1">Manage workspace details and members</p>
        </div>
        <WorkspaceSettings />
      </div>
    </AppLayout>
  );
}
