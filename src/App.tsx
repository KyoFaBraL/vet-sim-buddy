import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AuthProfessor from "./pages/AuthProfessor";
import AuthAluno from "./pages/AuthAluno";
import ResetPassword from "./pages/ResetPassword";
import ProfessorDashboard from "./pages/ProfessorDashboard";
import PreValidation from "./pages/PreValidation";
import { RoleSelection } from "./components/RoleSelection";
import { useAuth } from "./hooks/useAuth";
import { useUserRole } from "./hooks/useUserRole";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole(user);
  
  if (authLoading || roleLoading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }
  
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Admin tem acesso total - redirecionar para painel de professor
  if (role === 'admin' && window.location.pathname === '/app') {
    return <Navigate to="/professor" replace />;
  }

  // Redirecionar professores para o painel de professor
  if (role === 'professor' && window.location.pathname === '/app') {
    return <Navigate to="/professor" replace />;
  }

  // Redirecionar alunos para o simulador
  if (role === 'aluno' && window.location.pathname === '/professor') {
    return <Navigate to="/app" replace />;
  }
  
  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole(user);
  
  if (authLoading || roleLoading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }
  
  if (user && role) {
    // Admin vai para o painel de professor (invisível)
    if (role === 'admin') return <Navigate to="/professor" replace />;
    // Redirecionar para o painel correto baseado na role
    return <Navigate to={role === 'professor' ? '/professor' : '/app'} replace />;
  }
  
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={
              <PublicRoute>
                <RoleSelection />
              </PublicRoute>
            } />
            <Route path="/auth/professor" element={
              <PublicRoute>
                <AuthProfessor />
              </PublicRoute>
            } />
            <Route path="/auth/aluno" element={
              <PublicRoute>
                <AuthAluno />
              </PublicRoute>
            } />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/app" element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            } />
            <Route path="/professor" element={
              <ProtectedRoute>
                <ProfessorDashboard />
              </ProtectedRoute>
            } />
            <Route path="/pre-validation" element={
              <ProtectedRoute>
                <PreValidation />
              </ProtectedRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
