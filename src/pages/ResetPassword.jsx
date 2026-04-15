import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConnection } from '../contexts/ConnectionContext';
import { toast } from 'sonner';
import { Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ResetPassword() {
  const { supabase } = useConnection();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Supabase handles the token exchange automatically when the
    // user lands on this page via the reset link (hash fragment).
    // We just need to present the new password form.
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (password !== confirm) {
      toast.error('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (!supabase) {
      toast.error('Not connected to database');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      setDone(true);
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Password updated</h1>
          <p className="text-sm text-slate-500 mb-6">Your password has been reset. You can now sign in.</p>
          <Button onClick={() => navigate('/login')} className="w-full">
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src="https://moonify.ai/moonify-logo.svg" alt="Moonify" className="h-10 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900">Set new password</h1>
          <p className="text-sm text-slate-500 mt-2">Enter your new password below.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div>
            <Label className="text-sm text-slate-700 mb-1.5">New password</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoFocus placeholder="At least 6 characters" minLength={6} />
          </div>
          <div>
            <Label className="text-sm text-slate-700 mb-1.5">Confirm password</Label>
            <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required placeholder="Re-enter password" minLength={6} />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (<><Loader2 className="w-4 h-4 animate-spin" /> Updating...</>) : 'Update password'}
          </Button>
        </form>
      </div>
    </div>
  );
}
