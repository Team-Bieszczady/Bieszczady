import { BrowserRouter, Routes, Route } from 'react-router';
import AuthLayout from './layouts/AuthLayout';
import MainLayout from './layouts/MainLayout';
import LoginPage from './features/auth/pages/LoginPage';
import SetPasswordPage from './features/auth/pages/SetPasswordPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/set-password" element={<SetPasswordPage />} />
        </Route>

        <Route element={<MainLayout />}>
          <Route path="/profile" element={<ProfilePage />} />
          {/* TODO(projects): project routes go here once built, e.g.
          <Route path="/projects" element={<ProjectsListPage />} />
          <Route path="/projects/:id" element={<ProjectDetailPage />} />
          */}
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
