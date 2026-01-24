
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LoginPage from "./components/auth/LoginPage";
import { AuthProvider } from "./contexts/AuthContext";
import SignupPage from "./components/auth/SignupPage";
import ForgotPasswordPage from "./components/auth/ForgotPasswordPage";
import AdminPanel from "./AdminPanel";
import SuperAdminPanel from "./components/super-admin/SuperAdminPanel";
import TeacherPanel from "./components/teacher-panel/TeacherPanel";
import UserAppLayout from "./components/app/dashboard/UserAppLayout";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider defaultTheme="light">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<LoginPage />} /> {/* Add this route */}
              <Route path="/signup" element={<SignupPage />} /> {/* Add this route */}
              <Route path="/forgot-password" element={<ForgotPasswordPage />} /> {/* Add this line */}
              {/* User / Parent dashboard */}
              <Route path="/dashboard" element={<UserAppLayout />} />
              <Route path="/admin" element={<AdminPanel onBack={() => window.history.back()} />} /> {/* ADD THIS LINE */}
              <Route path="/teacher" element={<TeacherPanel onBack={() => window.history.back()} />} />
              <Route path="/super-admin" element={<SuperAdminPanel onBack={() => window.history.back()} />} /> {/* ADD THIS LINE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
