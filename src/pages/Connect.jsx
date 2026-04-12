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

        {/* GitHub link */}
        <a
          href="https://github.com/puzzled-mushroom911/blog-cms"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
          Setup guide, prompts & docs on GitHub
          <ExternalLink className="w-3 h-3 text-slate-400" />
        </a>

        {/* Help text */}
        <div className="mt-4 bg-white rounded-xl border border-slate-200 p-5">
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
