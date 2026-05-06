import { ReactNode } from 'react';
import { AppSidebar } from './AppSidebar';

interface AppLayoutProps {
  children: ReactNode;
  /** When true, removes the opaque background so a page-level background can show through. */
  transparentBackground?: boolean;
}

export function AppLayout({ children, transparentBackground = false }: AppLayoutProps) {
  return (
    <div
      className={`flex min-h-screen w-full ${
        transparentBackground ? 'bg-transparent' : 'bg-background premium-bg'
      }`}
    >
      <AppSidebar />
      <main className="flex-1 overflow-auto">
        <div className="container max-w-7xl py-8 px-6 animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
