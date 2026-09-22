import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/lib/auth";
import { AppShell } from "@/components/layout/app-shell";
import { LoginPage } from "@/pages/auth/login";
import { RegisterPage } from "@/pages/auth/register";
import { OnboardingPage } from "@/pages/onboarding";
import { DashboardPage } from "@/pages/dashboard";
import { CasesPage } from "@/pages/cases/index";
import { CaseDetailPage } from "@/pages/cases/detail";
import { SimulationPage } from "@/pages/simulation";
import { MaterialsPage } from "@/pages/materials/index";
import { MaterialDetailPage } from "@/pages/materials/detail";
import { PretestPage } from "@/pages/quiz/pretest";
import { PosttestPage } from "@/pages/quiz/posttest";
import { AdaptiveQuizPage } from "@/pages/quiz/adaptive";
import { ProgressPage } from "@/pages/progress";
import { AchievementsPage } from "@/pages/achievements";
import { LeaderboardPage } from "@/pages/leaderboard";
import { AdminDashboardPage } from "@/pages/admin/dashboard";
import { AdminUsersPage } from "@/pages/admin/users";
import { AdminUserDetailPage } from "@/pages/admin/user-detail";
import { AdminCasesPage } from "@/pages/admin/cases";
import { AdminQuestionsPage } from "@/pages/admin/questions";
import { AdminMaterialsPage } from "@/pages/admin/materials";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onUnauthorized = () => navigate("/login", { state: { from: location.pathname } });
    window.addEventListener("techtutor:unauthorized", onUnauthorized);
    return () => window.removeEventListener("techtutor:unauthorized", onUnauthorized);
  }, [navigate, location.pathname]);

  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RequireRole({ role, children }: { role: "ADMIN"; children: React.ReactNode }) {
  const { user } = useAuth();
  if (user?.role !== role) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AnonymousOnly({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-center" richColors />
        <Routes>
          <Route path="/login" element={<AnonymousOnly><LoginPage /></AnonymousOnly>} />
          <Route path="/register" element={<AnonymousOnly><RegisterPage /></AnonymousOnly>} />
          <Route path="/onboarding" element={<RequireAuth><OnboardingPage /></RequireAuth>} />
          <Route
            element={
              <RequireAuth>
                <AppShell />
              </RequireAuth>
            }
          >
            <Route path="/" element={<DashboardPage />} />
            <Route path="/cases" element={<CasesPage />} />
            <Route path="/cases/:id" element={<CaseDetailPage />} />
            <Route path="/simulation/:attemptId" element={<SimulationPage />} />
            <Route path="/materials" element={<MaterialsPage />} />
            <Route path="/materials/:id" element={<MaterialDetailPage />} />
            <Route path="/quiz/pretest" element={<PretestPage />} />
            <Route path="/quiz/posttest" element={<PosttestPage />} />
            <Route path="/quiz/adaptive" element={<AdaptiveQuizPage />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/achievements" element={<AchievementsPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/admin" element={<RequireRole role="ADMIN"><AdminDashboardPage /></RequireRole>} />
            <Route path="/admin/users" element={<RequireRole role="ADMIN"><AdminUsersPage /></RequireRole>} />
            <Route path="/admin/users/:id" element={<RequireRole role="ADMIN"><AdminUserDetailPage /></RequireRole>} />
            <Route path="/admin/cases" element={<RequireRole role="ADMIN"><AdminCasesPage /></RequireRole>} />
            <Route path="/admin/questions" element={<RequireRole role="ADMIN"><AdminQuestionsPage /></RequireRole>} />
            <Route path="/admin/materials" element={<RequireRole role="ADMIN"><AdminMaterialsPage /></RequireRole>} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}