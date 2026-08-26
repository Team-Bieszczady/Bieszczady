import { BrowserRouter, Routes, Route } from 'react-router';
import AuthLayout from './layouts/AuthLayout';
import LoginPage from './features/auth/pages/LoginPage';
import SetPasswordPage from './features/auth/pages/SetPasswordPage';
import MainLayout from './layouts/MainLayout';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import ProjectsPage from './pages/ProjectsPage';
import PeoplePage from './pages/PeoplePage';
import CalendarPage from './pages/CalendarPage';
import DecisionsPage from './pages/DecisionsPage';
import SettingsPage from './pages/SettingsPage';
import ProjectOverviewPage from './pages/ProjectOverviewPage';
import ProjectTasksPage from './pages/ProjectTasksPage';
import ProjectBudgetPage from './pages/ProjectBudgetPage';
import ProjectDocumentsPage from './pages/ProjectDocumentsPage';

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/set-password" element={<SetPasswordPage />} />
        </Route>

        <Route element={<MainLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/people" element={<PeoplePage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/decisions" element={<DecisionsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/project/overview" element={<ProjectOverviewPage />} />
          <Route path="/project/tasks" element={<ProjectTasksPage />} />
          <Route path="/project/budget" element={<ProjectBudgetPage />} />
          <Route path="/project/documents" element={<ProjectDocumentsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
