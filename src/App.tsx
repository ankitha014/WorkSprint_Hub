import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Welcome from "./pages/Welcome";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProjectDetails from "./pages/ProjectDetails";
import Tasks from "./pages/Tasks";
import SettingsPage from "./pages/Settings";
import WorkspaceSettingsPage from "./pages/WorkspaceSettingsPage";
import Notifications from "./pages/Notifications";
import Analytics from "./pages/Analytics";
import NotFound from "./pages/NotFound";
import { KeyboardShortcutsProvider } from "./components/keyboard/KeyboardShortcutsProvider";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
      <Route path="/welcome" element={<ProtectedRoute><WorkspaceProvider><Welcome /></WorkspaceProvider></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><WorkspaceProvider><Dashboard /></WorkspaceProvider></ProtectedRoute>} />
      <Route path="/projects" element={<ProtectedRoute><WorkspaceProvider><Projects /></WorkspaceProvider></ProtectedRoute>} />
      <Route path="/projects/:id" element={<ProtectedRoute><WorkspaceProvider><ProjectDetails /></WorkspaceProvider></ProtectedRoute>} />
      <Route path="/tasks" element={<ProtectedRoute><WorkspaceProvider><Tasks /></WorkspaceProvider></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><WorkspaceProvider><SettingsPage /></WorkspaceProvider></ProtectedRoute>} />
      <Route path="/workspace-settings" element={<ProtectedRoute><WorkspaceProvider><WorkspaceSettingsPage /></WorkspaceProvider></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><WorkspaceProvider><Notifications /></WorkspaceProvider></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute><WorkspaceProvider><Analytics /></WorkspaceProvider></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <KeyboardShortcutsProvider>
            <AppRoutes />
          </KeyboardShortcutsProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
