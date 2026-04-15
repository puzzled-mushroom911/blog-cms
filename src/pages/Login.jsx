import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useConnection } from '../contexts/ConnectionContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Login() {
  const { user, signIn } = useAuth();
  const { connected, disconnect, connectionMode, connectHosted, hasHostedCredentials } = useConnection();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    // If not connected yet, try hosted credentials
    if (!connected && hasHostedCredentials) {
      connectHosted();
      await new Promise(r => setTimeout(r, 100));
    }

    const { error: authError } = await signIn(email, password);
    if (authError) {
      toast.error(authError.message);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src="https://moonify.ai/moonify-logo.svg" alt="Moonify" className="h-12 mx-auto mb-4" />
          <p className="text-sm text-slate-500 mt-1">Sign in to manage content</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="space-y-4">
            <div>
              <Label className="text-sm text-slate-700 mb-1.5">Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus placeholder="you@example.com" />
            </div>
            <div>
              <Label className="text-sm text-slate-700 mb-1.5">Password</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Your password" />
            </div>
            <div className="flex justify-end">
              <button type="button" onClick={() => navigate('/forgot-password')} className="text-xs text-blue-600 hover:text-blue-700">
                Forgot password?
              </button>
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </div>
        </form>

        <div className="mt-4 text-center space-y-2">
          <p className="text-xs text-slate-400">
            Don't have an account?{' '}
            <button type="button" onClick={() => navigate('/welcome')} className="text-blue-600 hover:text-blue-700">Get started</button>
          </p>
          {connectionMode === 'byo' && (
            <p className="text-xs text-slate-400">
              Wrong Supabase project?{' '}
              <button type="button" onClick={() => { disconnect(); navigate('/connect'); }} className="text-blue-600 hover:text-blue-700">Disconnect</button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
