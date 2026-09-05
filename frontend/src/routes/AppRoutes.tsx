import {
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

import Layout from '../components/layout/Layout';
import Login from '../pages/auth/Login';
import Dashboard from '../pages/dashboard/Dashboard';
import FamiliesPage from '../pages/families/FamiliesPage';
import StudentsPage from '../pages/students/StudentsPage';
import ModalitiesPage from '../pages/modalities/ModalitiesPage';
import ModalityPage from '../pages/modalities/ModalityPage';
import SettingsPage from '../pages/settings/SettingsPage';

function ProtectedRoutes() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Layout />
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={<Login />}
      />

      <Route element={<ProtectedRoutes />}>
        <Route
          path="/"
          element={<Dashboard />}
        />

        <Route
          path="*"
          element={<Dashboard />}
        />
        <Route path="/families" 
        element={<FamiliesPage />} />
        <Route path="/students"
          element={<StudentsPage />} />
          <Route path="/modalities"
           element={<ModalitiesPage />} />
           <Route path="/modalities/:slug"
            element={<ModalityPage />} />
            <Route
            path="/settings"
            element={<SettingsPage />}
          />
      </Route>

    </Routes>
  );
}