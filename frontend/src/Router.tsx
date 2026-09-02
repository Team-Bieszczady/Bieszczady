import { BrowserRouter, Routes, Route } from 'react-router';
import AuthLayout from './layouts/AuthLayout';
import LoginPage from './features/auth/pages/LoginPage';
import SetPasswordPage from './features/auth/pages/SetPasswordPage';
import RequireAuth from './components/RequireAuth';
import RequireModule from './components/RequireModule';
import MainLayout from './layouts/MainLayout';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import NotificationsPage from './pages/NotificationsPage';
import PersonDetailPage from './pages/PersonDetailPage';
import ProjectsPage from './pages/ProjectsPage';
import PeoplePage from './pages/PeoplePage';
import CalendarPage from './pages/CalendarPage';
import DecisionsPage from './pages/DecisionsPage';
import SettingsPage from './pages/SettingsPage';
import ProjectOverviewPage from './pages/ProjectOverviewPage';
import ProjectTasksPage from './pages/ProjectTasksPage';
import ProjectBudgetPage from './pages/ProjectBudgetPage';
import ProjectDocumentsPage from './pages/ProjectDocumentsPage';
import NotFoundPage from './pages/NotFoundPage';
import ForgotPasswordPage from './features/auth/pages/ForgotPasswordPage';
import ResetPasswordPage from './features/auth/pages/ResetPasswordPage';

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/set-password" element={<SetPasswordPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>

        <Route element={<RequireAuth />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />

            <Route path="/notifications" element={<NotificationsPage />} />
            <Route element={<RequireModule module="PROJECTS" />}>
              <Route path="/projects" element={<ProjectsPage />} />
            </Route>
            <Route element={<RequireModule module="PEOPLE" />}>
              <Route path="/people" element={<PeoplePage />} />
              <Route path="/people/:id" element={<PersonDetailPage />} />
            </Route>
            <Route element={<RequireModule module="CALENDAR" />}>
              <Route path="/calendar" element={<CalendarPage />} />
            </Route>
            <Route element={<RequireModule module="DECISIONS" />}>
              <Route path="/decisions" element={<DecisionsPage />} />
            </Route>
            <Route element={<RequireModule module="SETTINGS" />}>
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
            <Route element={<RequireModule module="OVERVIEW" />}>
              <Route
                path="/project/overview"
                element={<ProjectOverviewPage />}
              />
            </Route>
            <Route element={<RequireModule module="TASKS" />}>
              <Route path="/project/tasks" element={<ProjectTasksPage />} />
            </Route>
            <Route element={<RequireModule module="BUDGET" />}>
              <Route path="/project/budget" element={<ProjectBudgetPage />} />
            </Route>
            <Route element={<RequireModule module="DOCUMENTS" />}>
              <Route
                path="/project/documents"
                element={<ProjectDocumentsPage />}
              />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
