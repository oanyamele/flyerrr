import { Suspense, lazy } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { FollowProvider } from "@/contexts/FollowContext";
import { RepositoryProvider } from "@/repositories/RepositoryProvider";

const Index = lazy(() => import("./pages/Index"));
const EventDetail = lazy(() => import("./pages/EventDetail"));
const Explore = lazy(() => import("./pages/Explore"));
const TapIn = lazy(() => import("./pages/TapIn"));
const Saved = lazy(() => import("./pages/Saved"));
const Profile = lazy(() => import("./pages/Profile"));
const Login = lazy(() => import("./pages/Login"));
const CreateEvent = lazy(() => import("./pages/CreateEvent"));
const AttendanceHistory = lazy(() => import("./pages/AttendanceHistory"));
const RewardsPerks = lazy(() => import("./pages/RewardsPerks"));
const ResumeBuilder = lazy(() => import("./pages/ResumeBuilder"));
const NotificationSettings = lazy(() => import("./pages/NotificationSettings"));
const EventReminders = lazy(() => import("./pages/EventReminders"));
const OrganizationVerificationQueue = lazy(() => import("./pages/OrganizationVerificationQueue"));
const AttendanceReports = lazy(() => import("./pages/AttendanceReports"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const RouteFallback = () => (
  <div role="status" aria-live="polite" className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">
    Loading…
  </div>
);

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
        <Suspense fallback={<RouteFallback />}>
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
        </Suspense>
      </main>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <RepositoryProvider>
          <FollowProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Suspense fallback={<RouteFallback />}>
                  <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/*" element={<ProtectedRoutes />} />
                  </Routes>
                </Suspense>
              </BrowserRouter>
            </TooltipProvider>
          </FollowProvider>
        </RepositoryProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
