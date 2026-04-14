import { useState } from 'react';
import { useConnection } from '../contexts/ConnectionContext';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { ArrowRight, AlertCircle, Loader2, ExternalLink, CheckCircle, ArrowLeft } from 'lucide-react';
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
      setError('Could not connect. Check that your URL and anon key are correct. ' + (err.message || ''));
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <button onClick={() => navigate('/welcome')} className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="text-center mb-8">
          <img src="https://moonify.ai/moonify-logo.svg" alt="Moonify" className="h-10 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900">Connect Your Database</h1>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
            This CMS stores all data in your own Supabase project.<br />Your content, your data, your control.
          </p>
        </div>

        <div className="bg-blue-50 rounded-xl border border-blue-100 p-5 mb-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-3">What you'll need</h3>
          <ul className="space-y-2">
            <li className="flex items-start gap-2 text-sm text-blue-800">
              <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <span>A free <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="underline">Supabase</a> account (takes 30 seconds)</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-blue-800">
              <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <span>A Supabase project (create one or use an existing one)</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-blue-800">
              <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <span>Your project's <strong>URL</strong> and <strong>anon public key</strong></span>
            </li>
          </ul>
        </div>

        <form onSubmit={handleConnect} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div>
            <Label className="text-sm text-slate-700 mb-1.5">Supabase Project URL</Label>
            <Input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://abcdefgh.supabase.co" required autoFocus />
          </div>
          <div>
            <Label className="text-sm text-slate-700 mb-1.5">Anon (Public) Key</Label>
            <Input type="password" value={anonKey} onChange={(e) => setAnonKey(e.target.value)} placeholder="eyJhbGciOiJIUzI1NiIs..." required />
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <Button type="submit" disabled={testing} className="w-full">
            {testing ? (<><Loader2 className="w-4 h-4 animate-spin" /> Testing connection...</>) : (<><ArrowRight className="w-4 h-4" /> Connect</>)}
          </Button>
        </form>

        <div className="mt-4 bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Where do I find these?</h3>
          <ol className="space-y-3 text-sm text-slate-600">
            <li className="flex gap-3">
              <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 text-xs font-bold text-slate-500">1</span>
              <span>Go to <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 inline-flex items-center gap-1">supabase.com/dashboard <ExternalLink className="w-3 h-3" /></a></span>
            </li>
            <li className="flex gap-3">
              <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 text-xs font-bold text-slate-500">2</span>
              <span>Create a new project (or open an existing one)</span>
            </li>
            <li className="flex gap-3">
              <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 text-xs font-bold text-slate-500">3</span>
              <span>Go to <strong>Settings &rarr; API</strong> in the left sidebar</span>
            </li>
            <li className="flex gap-3">
              <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 text-xs font-bold text-slate-500">4</span>
              <span>Copy the <strong>Project URL</strong> and the <strong>anon public</strong> key (under "Project API keys")</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
