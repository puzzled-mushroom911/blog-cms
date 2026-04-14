import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useConnection } from '../contexts/ConnectionContext';
import { useWorkspace } from '../contexts/WorkspaceContext';

export default function ProtectedRoute({ children }) {
  const { connected, isHostedMode } = useConnection();
  const { user } = useAuth();
  const { workspace, loading: wsLoading } = useWorkspace();

  if (!connected) return <Navigate to={isHostedMode ? '/signup' : '/connect'} replace />;
  if (!user) return <Navigate to={isHostedMode ? '/signup' : '/login'} replace />;

  // Wait for workspace to load
  if (wsLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
      </div>
    );
  }

  // If user has no workspace yet, send to create one
  if (!workspace) return <Navigate to="/create-workspace" replace />;

  return children;
}
