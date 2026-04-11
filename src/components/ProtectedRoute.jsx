import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useConnection } from '../contexts/ConnectionContext';

export default function ProtectedRoute({ children }) {
  const { connected } = useConnection();
  const { user } = useAuth();

  if (!connected) return <Navigate to="/connect" replace />;
  if (!user) return <Navigate to="/login" replace />;

  return children;
}
