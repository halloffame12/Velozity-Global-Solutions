import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/features/ProtectedRoute';
import { useAuthBootstrap } from './hooks';
import { ROLES } from '@agency/shared';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetails from './pages/ProjectDetails';
import Tasks from './pages/Tasks';
import Activity from './pages/Activity';
import Clients from './pages/Clients';
import Users from './pages/Users';

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Root />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

function Root() {
  useAuthBootstrap();
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="projects" element={<Projects />} />
        <Route path="projects/:projectId" element={<ProjectDetails />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="activity" element={<Activity />} />
        <Route path="clients" element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.PROJECT_MANAGER]}><Clients /></ProtectedRoute>} />
        <Route path="users" element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]}><Users /></ProtectedRoute>} />
      </Route>
    </Routes>
  );
}