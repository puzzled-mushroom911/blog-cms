import { useState } from 'react';
import { useConnection } from '../contexts/ConnectionContext';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { FileText, ArrowRight, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Connect() {
  const { connect } = useConnection();
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState('');

  async function handleConnect(e) {
    e.preventDefault();
    setError('');
    setTesting(true);

    const trimmedUrl = url.trim().replace(/\/$/, '');
    const trimmedKey = anonKey.trim();

    if (!trimmedUrl || !trimmedKey) {
      setError('Both fields are required.');
      setTesting(false);
      return;
    }

    try {
      const testClient = createClient(trimmedUrl, trimmedKey);
      const { error: authError } = await testClient.auth.getSession();
      if (authError) throw authError;

      connect(trimmedUrl, trimmedKey);
      navigate('/setup');
    } catch (err) {
      setError(
        'Could not connect. Check that your URL and anon key are correct. ' +
        (err.message || '')
      );
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Connect Your Database</h1>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
            This CMS stores all data in your own Supabase project.<br />
            Your content, your data, your control.
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleConnect}
          className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5"
        >
          <div>
            <Label className="text-sm text-slate-700 mb-1.5">Supabase Project URL</Label>
            <Input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://abcdefgh.supabase.co"
              required
              autoFocus
            />
          </div>

          <div>
            <Label className="text-sm text-slate-700 mb-1.5">Anon (Public) Key</Label>
            <Input
              type="password"
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIs..."
              required
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <Button type="submit" disabled={testing} className="w-full">
            {testing ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Testing connection...</>
            ) : (
              <><ArrowRight className="w-4 h-4" /> Connect</>
            )}
          </Button>
        </form>

        {/* Help text */}
        <div className="mt-6 bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Where do I find these?</h3>
          <ol className="space-y-2 text-sm text-slate-600">
            <li className="flex gap-2">
              <span className="font-semibold text-slate-400">1.</span>
              <span>Go to{' '}
              <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 inline-flex items-center gap-1">
                supabase.com/dashboard <ExternalLink className="w-3 h-3" />
              </a></span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold text-slate-400">2.</span>
              <span>Create a new project (or open an existing one)</span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold text-slate-400">3.</span>
              <span>Go to <strong>Settings → API</strong></span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold text-slate-400">4.</span>
              <span>Copy the <strong>Project URL</strong> and <strong>anon public</strong> key</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
