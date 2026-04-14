import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useConnection } from '../contexts/ConnectionContext';
import { toast } from 'sonner';
import { ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Signup() {
  const { user, signUp } = useAuth();
  const { isHostedMode } = useConnection();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // If already signed in, go to dashboard (workspace auto-created)
  if (user) return <Navigate to="/" replace />;
  // If not hosted mode, use self-host flow
  if (!isHostedMode) return <Navigate to="/connect" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: authError } = await signUp(email.trim(), password);
    setLoading(false);

    if (authError) {
      setError(authError.message);
    } else {
      toast.success('Account created!');
      navigate('/');
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img
            src="https://moonify.ai/moonify-logo.svg"
            alt="Moonify"
            className="h-10 mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
          <p className="text-sm text-slate-500 mt-2">
            Get started with your AI-powered blog CMS
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4"
        >
          <div>
            <Label className="text-sm text-slate-700 mb-1.5">Email</Label>
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
            <Label className="text-sm text-slate-700 mb-1.5">Password</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="At least 6 characters"
              minLength={6}
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</>
            ) : (
              <><ArrowRight className="w-4 h-4" /> Sign up</>
            )}
          </Button>
        </form>

        <p className="text-xs text-slate-400 text-center mt-4">
          Already have an account?{' '}
          <button type="button" onClick={() => navigate('/login')} className="text-blue-600 hover:text-blue-700">
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
