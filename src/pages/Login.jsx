import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useConnection } from '../contexts/ConnectionContext';
import { toast } from 'sonner';
import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getConfig } from '../config';

export default function Login() {
  const { user, signIn } = useAuth();
  const { connected, disconnect } = useConnection();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;
  if (!connected) return <Navigate to="/connect" replace />;

  const config = getConfig();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    const { error: authError } = await signIn(email, password);
    if (authError) {
      toast.error(authError.message);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">{config.cmsTitle}</h1>
          <p className="text-sm text-slate-500 mt-1">Sign in to manage content</p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm"
        >
          <div className="space-y-4">
            <div>
              <Label className="text-sm text-slate-700 mb-1.5">
                Email
              </Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                placeholder="you@example.com"
              />
            </div>

            <div>
              <Label className="text-sm text-slate-700 mb-1.5">
                Password
              </Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Your password"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </div>
        </form>

        <div className="mt-4 text-center space-y-2">
          <p className="text-xs text-slate-400">
            Don't have an account?{' '}
            <a href="/setup" className="text-blue-600 hover:text-blue-700">
              Set up here
            </a>
          </p>
          <p className="text-xs text-slate-400">
            Wrong Supabase project?{' '}
            <button type="button" onClick={() => disconnect()} className="text-blue-600 hover:text-blue-700">
              Disconnect
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
