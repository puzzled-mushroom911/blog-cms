import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConnection } from '../contexts/ConnectionContext';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ForgotPassword() {
  const { supabase } = useConnection();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!supabase) {
      toast.error('Not connected to database');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      setSent(true);
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Mail className="w-6 h-6 text-green-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Check your email</h1>
          <p className="text-sm text-slate-500 mb-6">
            We sent a password reset link to <strong>{email}</strong>. Click the link in the email to reset your password.
          </p>
          <Button variant="outline" onClick={() => navigate('/login')} className="w-full">
            Back to sign in
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
          <h1 className="text-2xl font-bold text-slate-900">Reset your password</h1>
          <p className="text-sm text-slate-500 mt-2">Enter your email and we'll send you a reset link.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div>
            <Label className="text-sm text-slate-700 mb-1.5">Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus placeholder="you@example.com" />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (<><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>) : 'Send reset link'}
          </Button>
        </form>

        <p className="text-xs text-slate-400 text-center mt-4">
          <button type="button" onClick={() => navigate('/login')} className="text-blue-600 hover:text-blue-700 inline-flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" /> Back to sign in
          </button>
        </p>
      </div>
    </div>
  );
}
