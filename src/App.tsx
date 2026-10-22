import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { FollowProvider } from "@/contexts/FollowContext";
import { RepositoryProvider } from "@/repositories/RepositoryProvider";
import Index from "./pages/Index";
import EventDetail from "./pages/EventDetail";
import Explore from "./pages/Explore";
import TapIn from "./pages/TapIn";
import Saved from "./pages/Saved";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import CreateEvent from "./pages/CreateEvent";
import AttendanceHistory from "./pages/AttendanceHistory";
import RewardsPerks from "./pages/RewardsPerks";
import ResumeBuilder from "./pages/ResumeBuilder";
import NotificationSettings from "./pages/NotificationSettings";
import EventReminders from "./pages/EventReminders";
import OrganizationVerificationQueue from "./pages/OrganizationVerificationQueue";
import AttendanceReports from "./pages/AttendanceReports";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoutes = () => {
  const { auth } = useAuth();
  if (!auth.isLoggedIn) return <Navigate to="/login" replace />;

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-[8px] focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        Skip to main content
      </a>
      <main id="main-content" tabIndex={-1}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/event/:id" element={<EventDetail />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/tap-in" element={<TapIn />} />
          <Route path="/saved" element={<Saved />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/create-event" element={<CreateEvent />} />
          <Route path="/attendance-history" element={<AttendanceHistory />} />
          <Route path="/rewards" element={<RewardsPerks />} />
          <Route path="/resume-builder" element={<ResumeBuilder />} />
          <Route path="/notification-settings" element={<NotificationSettings />} />
          <Route path="/event-reminders" element={<EventReminders />} />
          <Route path="/org-verification-queue" element={<OrganizationVerificationQueue />} />
          <Route path="/attendance-reports" element={<AttendanceReports />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <FollowProvider>
          <RepositoryProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/*" element={<ProtectedRoutes />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </RepositoryProvider>
        </FollowProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
