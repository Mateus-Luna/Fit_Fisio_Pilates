import {
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

import Layout from '../components/layout/Layout';
import Login from '../pages/auth/Login';
import Dashboard from '../pages/dashboard/Dashboard';

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
      </Route>
    </Routes>
  );
}