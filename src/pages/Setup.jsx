import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConnection } from '../contexts/ConnectionContext';
import { useAuth } from '../contexts/AuthContext';
import { SETUP_SQL, REQUIRED_TABLES } from '../lib/setupSql';
import { toast } from 'sonner';
import {
  FileText, Copy, CheckCircle, AlertCircle,
  Loader2, ArrowRight, RefreshCw, ExternalLink, UserPlus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { trackInstall } from '../lib/tracking';

export default function Setup() {
  const { supabase, connected, disconnect } = useConnection();
  const { user, signUp } = useAuth();
  const navigate = useNavigate();

  const [checking, setChecking] = useState(true);
  const [tablesReady, setTablesReady] = useState(false);
  const [missingTables, setMissingTables] = useState([]);
  const [copied, setCopied] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [creatingAccount, setCreatingAccount] = useState(false);

  useEffect(() => {
    if (connected && supabase) checkTables();
  }, [connected, supabase]);

  useEffect(() => {
    if (user && tablesReady) navigate('/', { replace: true });
  }, [user, tablesReady, navigate]);

  async function checkTables() {
    setChecking(true);
    const missing = [];

    for (const table of REQUIRED_TABLES) {
      const { error } = await supabase.from(table).select('id').limit(1);
      if (error && (error.code === '42P01' || error.code === 'PGRST116' || error.message?.includes('does not exist'))) {
        missing.push(table);
      }
    }

    setMissingTables(missing);
    setTablesReady(missing.length === 0);
    setChecking(false);
  }

  async function handleCopySQL() {
    await navigator.clipboard.writeText(SETUP_SQL);
    setCopied(true);
    toast.success('SQL copied to clipboard');
    setTimeout(() => setCopied(false), 3000);
  }

  async function handleCreateAccount(e) {
    e.preventDefault();
    setCreatingAccount(true);
    const { error } = await signUp(email.trim(), password);
    setCreatingAccount(false);

    if (error) {
      toast.error(error.message);
    } else {
      // Track BYO install (fire-and-forget)
      const conn = JSON.parse(localStorage.getItem('blog-cms-connection') || '{}');
      if (conn.url) trackInstall(conn.url);

      toast.success('Account created! You can now sign in.');
      navigate('/login');
    }
  }

  if (!connected) {
    navigate('/connect', { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Set Up Your CMS</h1>
          <p className="text-sm text-slate-500 mt-2">Two quick steps and you're in.</p>
        </div>

        {/* Step 1: Database tables */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              tablesReady ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
            }`}>
              {tablesReady ? <CheckCircle className="w-4 h-4" /> : '1'}
            </div>
            <div>
              <h2 className="font-semibold text-slate-900 text-sm">Create Database Tables</h2>
              <p className="text-xs text-slate-500">
                {tablesReady ? 'All tables found' : 'Run the SQL below in your Supabase SQL Editor'}
              </p>
            </div>
          </div>

          {checking ? (
            <div className="flex items-center gap-2 text-sm text-slate-400 py-4 justify-center">
              <Loader2 className="w-4 h-4 animate-spin" />
              Checking database...
            </div>
          ) : tablesReady ? (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-sm text-emerald-700">
              <CheckCircle className="w-4 h-4" />
              All required tables exist. You're good!
            </div>
          ) : (
            <>
              {missingTables.length > 0 && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-lg text-sm text-amber-700 mb-4">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Missing tables: <strong>{missingTables.join(', ')}</strong></span>
                </div>
              )}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Button onClick={handleCopySQL} variant="outline" size="sm">
                    {copied ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied!' : 'Copy SQL to clipboard'}
                  </Button>
                  <a
                    href="https://supabase.com/dashboard"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    Open SQL Editor <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <details className="group">
                  <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-600">Preview SQL</summary>
                  <pre className="mt-2 bg-slate-800 text-slate-200 p-4 rounded-lg text-xs leading-relaxed overflow-x-auto max-h-64 overflow-y-auto">
                    {SETUP_SQL}
                  </pre>
                </details>
                <Button onClick={checkTables} variant="outline" size="sm">
                  <RefreshCw className="w-3.5 h-3.5" />
                  I've run it — check again
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Step 2: Create account */}
        <div className={`bg-white rounded-xl border border-slate-200 p-6 shadow-sm mb-4 ${
          !tablesReady ? 'opacity-50 pointer-events-none' : ''
        }`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              user ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
            }`}>
              {user ? <CheckCircle className="w-4 h-4" /> : '2'}
            </div>
            <div>
              <h2 className="font-semibold text-slate-900 text-sm">Create Your Account</h2>
              <p className="text-xs text-slate-500">
                {user ? 'Signed in' : 'Set up your login credentials'}
              </p>
            </div>
          </div>

          {user ? (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-sm text-emerald-700">
              <CheckCircle className="w-4 h-4" />
              Signed in as {user.email}
            </div>
          ) : (
            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div>
                <Label className="text-sm text-slate-700 mb-1.5">Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
              </div>
              <div>
                <Label className="text-sm text-slate-700 mb-1.5">Password</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="At least 6 characters" minLength={6} />
              </div>
              <Button type="submit" disabled={creatingAccount} className="w-full">
                {creatingAccount ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
                ) : (
                  <><UserPlus className="w-4 h-4" /> Create Account</>
                )}
              </Button>
              <p className="text-xs text-slate-400 text-center">
                Already have an account?{' '}
                <button type="button" onClick={() => navigate('/login')} className="text-blue-600 hover:text-blue-700">Sign in</button>
              </p>
            </form>
          )}
        </div>

        {tablesReady && user && (
          <Button onClick={() => navigate('/')} className="w-full" size="lg">
            <ArrowRight className="w-4 h-4" /> Go to Dashboard
          </Button>
        )}

        <div className="text-center mt-6">
          <button
            onClick={() => { disconnect(); navigate('/welcome'); }}
            className="text-xs text-slate-400 hover:text-slate-600"
          >
            Disconnect and use a different Supabase project
          </button>
        </div>
      </div>
    </div>
  );
}
