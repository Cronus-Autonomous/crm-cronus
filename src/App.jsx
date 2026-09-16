import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "sonner";
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import { ThemeProvider } from 'next-themes';
// Page imports
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Kanban from '@/pages/Kanban';
import WhatsApp from '@/pages/WhatsApp';
import Layout from '@/components/Layout';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/" element={<Navigate to="/kanban" replace />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<Layout />}>
          <Route path="/kanban" element={<Kanban />} />
          <Route path="/whatsapp" element={<WhatsApp />} />
        </Route>
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <ScrollToTop />
            <AuthenticatedApp />
          </Router>
          <Toaster />
          <Sonner position="top-right" richColors closeButton />
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;