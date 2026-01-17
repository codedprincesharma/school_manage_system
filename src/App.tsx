import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { SchoolProvider } from "@/contexts/SchoolContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import Schools from "@/pages/Schools";
import Students from "@/pages/Students";
import Teachers from "@/pages/Teachers";
import Classes from "@/pages/Classes";
import LessonPlans from "@/pages/LessonPlans";
import Timetables from "@/pages/Timetables";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function AuthRedirect() {
  const { user, loading } = useAuth();
  
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return <Auth />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <SchoolProvider>
            <Routes>
              <Route path="/auth" element={<AuthRedirect />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/schools"
                element={
                  <ProtectedRoute>
                    <Schools />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/students"
                element={
                  <ProtectedRoute>
                    <Students />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teachers"
                element={
                  <ProtectedRoute>
                    <Teachers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/classes"
                element={
                  <ProtectedRoute>
                    <Classes />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/lesson-plans"
                element={
                  <ProtectedRoute>
                    <LessonPlans />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/timetables"
                element={
                  <ProtectedRoute>
                    <Timetables />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </SchoolProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
