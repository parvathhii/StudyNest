import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) return <div className="center-page"><div className="spinner" /><p>Opening your study space…</p></div>;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}
