import { lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { ProtectedRoute, RequirePermission } from '../features/auth/ProtectedRoute';

// Route-level code splitting keeps the initial bundle small (charts, grid load on demand).
const LoginPage = lazy(() => import('../features/auth/LoginPage'));
const SignupPage = lazy(() => import('../features/auth/SignupPage'));
const ForgotPasswordPage = lazy(() => import('../features/auth/ForgotPasswordPage'));
const DashboardPage = lazy(() => import('../features/dashboard/DashboardPage'));
const ProjectsPage = lazy(() => import('../features/projects/ProjectsPage'));
const ProjectDetailPage = lazy(() => import('../features/projects/ProjectDetailPage'));
const TasksPage = lazy(() => import('../features/tasks/TasksPage'));
const TeamPage = lazy(() => import('../features/team/TeamPage'));
const ReportsPage = lazy(() => import('../features/reports/ReportsPage'));
const SettingsPage = lazy(() => import('../features/settings/SettingsPage'));

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/:projectId" element={<ProjectDetailPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="team" element={<RequirePermission action="team:view"><TeamPage /></RequirePermission>} />
          <Route path="reports" element={<RequirePermission action="analytics:view"><ReportsPage /></RequirePermission>} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
