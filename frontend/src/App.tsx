import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AccessibilityProvider } from "@/contexts/AccessibilityContext";
import { Header } from "@/components/Header";
import Index from "./pages/Index";
import SearchPage from "./pages/SearchPage";
import DocumentsPage from "./pages/DocumentsPage";
import FormsPage from "./pages/FormsPage";
import TranscribePage from "./pages/TranscribePage";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "@/contexts/AuthContext";
import PrivateRoute from "@/components/PrivateRoute";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import VerifyEmailPage from "./pages/auth/VerifyEmailPage";
import { Navigate } from "react-router-dom";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AccessibilityProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <div className="min-h-screen bg-background text-foreground">
              <Header />
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/verify-email" element={<VerifyEmailPage />} />

                {/* Protected Routes */}
                <Route element={<PrivateRoute />}>
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/documents" element={<DocumentsPage />} />
                  <Route path="/forms" element={<FormsPage />} />
                  <Route path="/transcribe" element={<TranscribePage />} />
                  <Route path="/dashboard" element={<Navigate to="/" replace />} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </BrowserRouter>
        </TooltipProvider>
      </AccessibilityProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
