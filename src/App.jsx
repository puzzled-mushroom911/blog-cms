import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { useConnection } from './contexts/ConnectionContext';
import { Toaster } from "@/components/ui/sonner";
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Welcome from './pages/Welcome';
import Connect from './pages/Connect';
import Setup from './pages/Setup';
import Login from './pages/Login';
import Signup from './pages/Signup';
import CreateWorkspace from './pages/CreateWorkspace';
import Dashboard from './pages/Dashboard';
import PostEditor from './pages/PostEditor';
import Topics from './pages/Topics';
import TopicDetail from './pages/TopicDetail';
import Settings from './pages/Settings';
import SeoPages from './pages/SeoPages';
import SeoPageEditor from './pages/SeoPageEditor';
import ApprovalQueue from './pages/ApprovalQueue';
import Calendar from './pages/Calendar';
import SeoDashboard from './pages/SeoDashboard';
import Docs from './pages/Docs';

export default function App() {
  const { loading } = useAuth();
  const { connected } = useConnection();

  if (loading && connected) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Routes>
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/connect" element={<Connect />} />
        <Route path="/setup" element={connected ? <Setup /> : <Navigate to="/connect" replace />} />
        <Route path="/create-workspace" element={<CreateWorkspace />} />

        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="posts/:id" element={<PostEditor />} />
          <Route path="topics" element={<Topics />} />
          <Route path="topics/:id" element={<TopicDetail />} />
          <Route path="settings" element={<Settings />} />
          <Route path="seo-pages" element={<SeoPages />} />
          <Route path="seo-pages/:id" element={<SeoPageEditor />} />
          <Route path="approval" element={<ApprovalQueue />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="seo" element={<SeoDashboard />} />
          <Route path="docs" element={<Docs />} />
        </Route>

        <Route path="*" element={
          connected ? <Navigate to="/" replace /> : <Navigate to="/welcome" replace />
        } />
      </Routes>
      <Toaster richColors position="bottom-right" />
    </>
  );
}
