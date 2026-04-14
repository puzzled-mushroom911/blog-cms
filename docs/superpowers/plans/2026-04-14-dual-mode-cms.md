# Dual-Mode CMS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor cms.moonify.ai so both hosted users (sign up with Moonify's Supabase) and BYO users (connect their own Supabase) can use the same deployment.

**Architecture:** Remove the build-time `isHostedMode` boolean. Replace with a runtime `connectionMode` stored in localStorage. Add a new `/welcome` landing page with two equal-weight paths. Add an anonymous tracking ping when BYO users complete setup.

**Tech Stack:** React 19, Vite, Supabase JS SDK, Tailwind CSS 4, React Router DOM 7

**Spec:** `docs/superpowers/specs/2026-04-14-dual-mode-cms-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/lib/supabase.js` | Modify | Remove `isHostedMode`. Add `getConnectionMode()`, `setConnectionMode()`. Support both hosted and BYO clients. |
| `src/contexts/ConnectionContext.jsx` | Modify | Remove `isHostedMode`. Expose `connectionMode` from supabase.js. |
| `src/pages/Welcome.jsx` | Create | New landing page with two cards: hosted signup vs BYO connect. |
| `src/pages/Login.jsx` | Modify | Remove `isHostedMode` guard. Work for both modes. |
| `src/pages/Signup.jsx` | Modify | Remove `isHostedMode` guard. Always accessible. |
| `src/pages/Connect.jsx` | Modify | Remove hosted-mode redirect. Add detailed guidance text. |
| `src/pages/Setup.jsx` | Modify | Add anonymous tracking ping on successful setup. |
| `src/App.jsx` | Modify | Add `/welcome` route. Update fallback redirect. |
| `src/components/ProtectedRoute.jsx` | Modify | Redirect unauthenticated users to `/welcome`. |
| `src/lib/tracking.js` | Create | Fire-and-forget install tracking ping. |

---

### Task 1: Refactor `src/lib/supabase.js` — Remove `isHostedMode`, Add Connection Mode

**Files:**
- Modify: `src/lib/supabase.js`

- [ ] **Step 1: Read the current file**

Read `src/lib/supabase.js` to confirm current content matches this plan.

- [ ] **Step 2: Replace the file with the refactored version**

```js
import { createClient } from '@supabase/supabase-js';

const CONNECTION_KEY = 'blog-cms-connection';
const MODE_KEY = 'blog-cms-mode';
let _client = null;

// Hosted Supabase credentials (baked in at build time, always available)
export const HOSTED_URL = import.meta.env.VITE_SUPABASE_URL || '';
export const HOSTED_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
export const hasHostedCredentials = !!(HOSTED_URL && HOSTED_ANON_KEY);

/**
 * Connection mode:
 *  'hosted' — using Moonify's Supabase (env var credentials)
 *  'byo'    — using the user's own Supabase (localStorage credentials)
 *  null     — not yet chosen
 */
export function getConnectionMode() {
  return localStorage.getItem(MODE_KEY);
}

export function setConnectionMode(mode) {
  localStorage.setItem(MODE_KEY, mode);
  _client = null; // Force client recreation on next getClient()
}

export function getStoredConnection() {
  const mode = getConnectionMode();

  if (mode === 'hosted' && hasHostedCredentials) {
    return { url: HOSTED_URL, anonKey: HOSTED_ANON_KEY };
  }

  if (mode === 'byo') {
    try {
      const raw = localStorage.getItem(CONNECTION_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed?.url && parsed?.anonKey) return parsed;
      return null;
    } catch {
      return null;
    }
  }

  // No mode chosen yet — check if there's a legacy connection in localStorage
  try {
    const raw = localStorage.getItem(CONNECTION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.url && parsed?.anonKey) {
        // Migrate: mark as BYO if credentials differ from hosted, otherwise hosted
        if (hasHostedCredentials && parsed.url === HOSTED_URL) {
          localStorage.setItem(MODE_KEY, 'hosted');
        } else {
          localStorage.setItem(MODE_KEY, 'byo');
        }
        return parsed;
      }
    }
  } catch {}

  // Check if hosted credentials exist and user has an auth session (returning hosted user)
  if (hasHostedCredentials) {
    const hasSession = Object.keys(localStorage).some(k => k.includes('supabase') && k.includes('auth-token'));
    if (hasSession) {
      localStorage.setItem(MODE_KEY, 'hosted');
      return { url: HOSTED_URL, anonKey: HOSTED_ANON_KEY };
    }
  }

  return null;
}

export function saveConnection(url, anonKey) {
  localStorage.setItem(CONNECTION_KEY, JSON.stringify({ url, anonKey }));
  setConnectionMode('byo');
  _client = createClient(url, anonKey);
  return _client;
}

export function clearConnection() {
  localStorage.removeItem(CONNECTION_KEY);
  localStorage.removeItem(MODE_KEY);
  _client = null;
}

export function getClient() {
  if (_client) return _client;
  const conn = getStoredConnection();
  if (!conn) return null;
  _client = createClient(conn.url, conn.anonKey);
  return _client;
}
```

- [ ] **Step 3: Verify build**

Run: `cd ~/blog-cms && npm run build 2>&1 | tail -5`
Expected: Build succeeds (warnings about chunk size are OK, no errors)

- [ ] **Step 4: Commit**

```bash
cd ~/blog-cms
git add src/lib/supabase.js
git commit -m "refactor: replace isHostedMode with runtime connectionMode"
```

---

### Task 2: Update `src/contexts/ConnectionContext.jsx`

**Files:**
- Modify: `src/contexts/ConnectionContext.jsx`

- [ ] **Step 1: Read the current file**

Read `src/contexts/ConnectionContext.jsx` to confirm current content.

- [ ] **Step 2: Replace with updated version**

```jsx
import { createContext, useContext, useState, useCallback } from 'react';
import { getClient, saveConnection, clearConnection, getStoredConnection, getConnectionMode, setConnectionMode, hasHostedCredentials, HOSTED_URL, HOSTED_ANON_KEY } from '../lib/supabase';

const ConnectionContext = createContext(null);

export function ConnectionProvider({ children }) {
  const [connected, setConnected] = useState(() => !!getStoredConnection());
  const [mode, setMode] = useState(() => getConnectionMode());

  const connect = useCallback((url, anonKey) => {
    saveConnection(url, anonKey);
    setConnected(true);
    setMode('byo');
  }, []);

  const connectHosted = useCallback(() => {
    if (!hasHostedCredentials) return;
    setConnectionMode('hosted');
    setConnected(true);
    setMode('hosted');
  }, []);

  const disconnect = useCallback(() => {
    clearConnection();
    setConnected(false);
    setMode(null);
  }, []);

  const supabase = connected ? getClient() : null;

  return (
    <ConnectionContext.Provider value={{
      connected,
      supabase,
      connect,
      connectHosted,
      disconnect,
      connectionMode: mode,
      hasHostedCredentials,
    }}>
      {children}
    </ConnectionContext.Provider>
  );
}

export function useConnection() {
  const context = useContext(ConnectionContext);
  if (!context) throw new Error('useConnection must be used within ConnectionProvider');
  return context;
}
```

- [ ] **Step 3: Verify build**

Run: `cd ~/blog-cms && npm run build 2>&1 | tail -5`
Expected: Build will FAIL because other files still reference `isHostedMode`. That's expected — we'll fix them in the next tasks.

- [ ] **Step 4: Commit**

```bash
cd ~/blog-cms
git add src/contexts/ConnectionContext.jsx
git commit -m "refactor: ConnectionContext exposes connectionMode instead of isHostedMode"
```

---

### Task 3: Create `src/pages/Welcome.jsx` — Dual-Mode Landing Page

**Files:**
- Create: `src/pages/Welcome.jsx`

- [ ] **Step 1: Create the Welcome page**

```jsx
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useConnection } from '../contexts/ConnectionContext';
import { Database, Cloud, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Welcome() {
  const { user } = useAuth();
  const { connected } = useConnection();
  const navigate = useNavigate();

  // Already authenticated — go to dashboard
  if (user && connected) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-10">
          <img
            src="https://moonify.ai/moonify-logo.svg"
            alt="Moonify"
            className="h-10 mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-slate-900">
            AI-Powered Blog CMS
          </h1>
          <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
            Manage blog content created by your AI assistant.
            Review, edit, and publish — all from one place.
          </p>
        </div>

        {/* Two path cards */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {/* Hosted path */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center mb-4">
              <Cloud className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900 mb-1">
              Use Moonify's Database
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed mb-6 flex-1">
              Instant setup — we host everything. Create an account and start
              managing your blog content in under a minute. No configuration needed.
            </p>
            <div className="space-y-3">
              <Button onClick={() => navigate('/signup')} className="w-full">
                <ArrowRight className="w-4 h-4" /> Sign Up Free
              </Button>
              <p className="text-xs text-slate-400 text-center">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-blue-600 hover:text-blue-700"
                >
                  Sign in
                </button>
              </p>
            </div>
          </div>

          {/* BYO path */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center mb-4">
              <Database className="w-5 h-5 text-emerald-600" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900 mb-1">
              Connect Your Own Supabase
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed mb-6 flex-1">
              Bring your own database for full control over your data. You'll need a
              free Supabase account. We'll walk you through the setup step by step.
            </p>
            <div className="space-y-3">
              <Button onClick={() => navigate('/connect')} variant="outline" className="w-full">
                <Database className="w-4 h-4" /> Connect Database
              </Button>
              <p className="text-xs text-slate-400 text-center">
                Already connected?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-blue-600 hover:text-blue-700"
                >
                  Sign in
                </button>
              </p>
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">How It Works</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-slate-500">1</span>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">Set up your database</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Use our hosted database or connect your own Supabase project.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-slate-500">2</span>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">Create content with AI</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Use Claude Code, the MCP server, or the REST API to generate blog posts.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-slate-500">3</span>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">Review and publish</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Edit, add notes, and publish. Your website updates automatically.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-xs text-slate-400 text-center mt-6">
          Open source on{' '}
          <a
            href="https://github.com/puzzled-mushroom911/blog-cms"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-700"
          >
            GitHub
          </a>
          {' '}&middot;{' '}
          Built by{' '}
          <a href="https://moonify.ai" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700">
            Moonify AI
          </a>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd ~/blog-cms
git add src/pages/Welcome.jsx
git commit -m "feat: add Welcome landing page with hosted + BYO cards"
```

---

### Task 4: Update `src/App.jsx` — Add Welcome Route, Remove `isHostedMode`

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Read the current file**

Read `src/App.jsx` to confirm current content.

- [ ] **Step 2: Replace with updated version**

```jsx
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
        {/* Public entry points */}
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/connect" element={<Connect />} />
        <Route path="/setup" element={connected ? <Setup /> : <Navigate to="/connect" replace />} />
        <Route path="/create-workspace" element={<CreateWorkspace />} />

        {/* App routes — require connection + auth */}
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
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

        {/* Fallback */}
        <Route path="*" element={
          connected ? <Navigate to="/" replace /> : <Navigate to="/welcome" replace />
        } />
      </Routes>
      <Toaster richColors position="bottom-right" />
    </>
  );
}
```

- [ ] **Step 3: Commit**

```bash
cd ~/blog-cms
git add src/App.jsx
git commit -m "refactor: add /welcome route, remove isHostedMode from routing"
```

---

### Task 5: Update `src/components/ProtectedRoute.jsx`

**Files:**
- Modify: `src/components/ProtectedRoute.jsx`

- [ ] **Step 1: Read the current file**

Read `src/components/ProtectedRoute.jsx` to confirm current content.

- [ ] **Step 2: Replace with updated version**

```jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useConnection } from '../contexts/ConnectionContext';
import { useWorkspace } from '../contexts/WorkspaceContext';

export default function ProtectedRoute({ children }) {
  const { connected } = useConnection();
  const { user } = useAuth();
  const { workspace, loading: wsLoading } = useWorkspace();

  if (!connected) return <Navigate to="/welcome" replace />;
  if (!user) return <Navigate to="/login" replace />;

  // Wait for workspace to load
  if (wsLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
      </div>
    );
  }

  // If user has no workspace yet, send to create one
  if (!workspace) return <Navigate to="/create-workspace" replace />;

  return children;
}
```

- [ ] **Step 3: Commit**

```bash
cd ~/blog-cms
git add src/components/ProtectedRoute.jsx
git commit -m "refactor: ProtectedRoute redirects to /welcome instead of isHostedMode check"
```

---

### Task 6: Update `src/pages/Login.jsx` — Support Both Modes

**Files:**
- Modify: `src/pages/Login.jsx`

- [ ] **Step 1: Read the current file**

Read `src/pages/Login.jsx` to confirm current content.

- [ ] **Step 2: Replace with updated version**

The key change: remove the `isHostedMode` guard. If the user has BYO credentials, use those. If not and hosted credentials exist, use hosted. The `getClient()` function in supabase.js already handles this based on `connectionMode`.

For Login, if no connection exists at all, we need to establish one. If the user came from the hosted signup path, they should connect to hosted. We detect this: if `connectionMode` is null and `hasHostedCredentials` is true, we auto-connect to hosted when they try to log in.

```jsx
import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useConnection } from '../contexts/ConnectionContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getConfig } from '../config';

export default function Login() {
  const { user, signIn } = useAuth();
  const { connected, disconnect, connectionMode, connectHosted, hasHostedCredentials } = useConnection();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const config = getConfig();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    // If not connected yet, try hosted credentials
    if (!connected && hasHostedCredentials) {
      connectHosted();
      // Need a brief delay for the client to initialize
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
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src="https://moonify.ai/moonify-logo.svg"
            alt="Moonify"
            className="h-12 mx-auto mb-4"
          />
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
                placeholder="Your password"
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </div>
        </form>

        <div className="mt-4 text-center space-y-2">
          <p className="text-xs text-slate-400">
            Don't have an account?{' '}
            <button type="button" onClick={() => navigate('/welcome')} className="text-blue-600 hover:text-blue-700">
              Get started
            </button>
          </p>
          {connectionMode === 'byo' && (
            <p className="text-xs text-slate-400">
              Wrong Supabase project?{' '}
              <button type="button" onClick={() => { disconnect(); navigate('/connect'); }} className="text-blue-600 hover:text-blue-700">
                Disconnect
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
cd ~/blog-cms
git add src/pages/Login.jsx
git commit -m "refactor: Login supports both hosted and BYO modes"
```

---

### Task 7: Update `src/pages/Signup.jsx` — Remove `isHostedMode` Guard

**Files:**
- Modify: `src/pages/Signup.jsx`

- [ ] **Step 1: Read the current file**

Read `src/pages/Signup.jsx` to confirm current content.

- [ ] **Step 2: Replace with updated version**

The Signup page should always be accessible. When a user signs up via this page, they're using the hosted Supabase, so we call `connectHosted()` to set the mode.

```jsx
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
  const { connectHosted, hasHostedCredentials } = useConnection();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // If already signed in, go to dashboard
  if (user) return <Navigate to="/" replace />;

  // If no hosted credentials available, can't use this page
  if (!hasHostedCredentials) return <Navigate to="/connect" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Ensure we're connected to hosted Supabase
    connectHosted();
    await new Promise(r => setTimeout(r, 100));

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
```

- [ ] **Step 3: Commit**

```bash
cd ~/blog-cms
git add src/pages/Signup.jsx
git commit -m "refactor: Signup uses connectHosted() instead of isHostedMode guard"
```

---

### Task 8: Update `src/pages/Connect.jsx` — Better Guidance, Remove Guards

**Files:**
- Modify: `src/pages/Connect.jsx`

- [ ] **Step 1: Read the current file**

Read `src/pages/Connect.jsx` to confirm current content.

- [ ] **Step 2: Replace with updated version**

Remove the hosted-mode redirect (this page is now always accessible). Add a "What you'll need" checklist and more detailed guidance text.

```jsx
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
        {/* Back link */}
        <button
          onClick={() => navigate('/welcome')}
          className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <img
            src="https://moonify.ai/moonify-logo.svg"
            alt="Moonify"
            className="h-10 mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-slate-900">Connect Your Database</h1>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
            This CMS stores all data in your own Supabase project.<br />
            Your content, your data, your control.
          </p>
        </div>

        {/* What you'll need */}
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

        {/* Step-by-step guide */}
        <div className="mt-4 bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Where do I find these?</h3>
          <ol className="space-y-3 text-sm text-slate-600">
            <li className="flex gap-3">
              <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 text-xs font-bold text-slate-500">1</span>
              <span>Go to{' '}
              <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 inline-flex items-center gap-1">
                supabase.com/dashboard <ExternalLink className="w-3 h-3" />
              </a></span>
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
```

- [ ] **Step 3: Commit**

```bash
cd ~/blog-cms
git add src/pages/Connect.jsx
git commit -m "feat: improved Connect page with guidance text, back navigation"
```

---

### Task 9: Create `src/lib/tracking.js` — Anonymous Install Ping

**Files:**
- Create: `src/lib/tracking.js`

- [ ] **Step 1: Create the tracking module**

This sends a single anonymous ping to the hosted Supabase when a BYO user completes setup. Fire-and-forget — failures are silently ignored.

```js
import { HOSTED_URL, HOSTED_ANON_KEY, hasHostedCredentials } from './supabase';
import { createClient } from '@supabase/supabase-js';

/**
 * Record an anonymous CMS install event.
 * Called once when a BYO user completes the setup flow.
 * Fire-and-forget — never blocks the user experience.
 */
export async function trackInstall(projectUrl) {
  if (!hasHostedCredentials) return;

  try {
    // Hash the project URL for uniqueness without storing PII
    const encoder = new TextEncoder();
    const data = encoder.encode(projectUrl);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const projectHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    const hosted = createClient(HOSTED_URL, HOSTED_ANON_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    await hosted.from('cms_installs').insert({ project_hash: projectHash });
  } catch {
    // Silent failure — tracking is best-effort
  }
}
```

- [ ] **Step 2: Commit**

```bash
cd ~/blog-cms
git add src/lib/tracking.js
git commit -m "feat: add anonymous install tracking for BYO users"
```

---

### Task 10: Update `src/pages/Setup.jsx` — Add Tracking Ping

**Files:**
- Modify: `src/pages/Setup.jsx`

- [ ] **Step 1: Read the current file**

Read `src/pages/Setup.jsx` to confirm current content.

- [ ] **Step 2: Add tracking import and call**

At the top of the file, add the import:

```jsx
import { trackInstall } from '../lib/tracking';
```

Find the `handleCreateAccount` function. After the successful signup (the `else` branch after `if (error)`), add the tracking call. The updated function should be:

```jsx
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
```

Also update the disconnect link at the bottom of the component. Replace:

```jsx
          <button
            onClick={() => { disconnect(); navigate('/connect'); }}
            className="text-xs text-slate-400 hover:text-slate-600"
          >
            Disconnect and use a different Supabase project
          </button>
```

With:

```jsx
          <button
            onClick={() => { disconnect(); navigate('/welcome'); }}
            className="text-xs text-slate-400 hover:text-slate-600"
          >
            Disconnect and use a different Supabase project
          </button>
```

And add the `disconnect` import from useConnection at the top of the component:

```jsx
  const { supabase, connected, disconnect } = useConnection();
```

- [ ] **Step 3: Verify build**

Run: `cd ~/blog-cms && npm run build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
cd ~/blog-cms
git add src/pages/Setup.jsx
git commit -m "feat: track BYO installs on account creation, fix disconnect link"
```

---

### Task 11: Create `cms_installs` Table in Hosted Supabase

**Files:**
- None (Supabase SQL via MCP)

- [ ] **Step 1: Create the tracking table**

Run this SQL via Supabase MCP on project `wosfsgadatfgfboxzogo`:

```sql
-- Anonymous install tracking for BYO CMS users
CREATE TABLE IF NOT EXISTS cms_installs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_hash text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cms_installs_hash ON cms_installs(project_hash);

-- Allow anonymous inserts (tracking pings come from unauthenticated BYO users)
ALTER TABLE cms_installs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert installs" ON cms_installs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Auth users can read installs" ON cms_installs
  FOR SELECT USING (auth.role() = 'authenticated');
```

- [ ] **Step 2: Verify table exists**

Run SQL: `SELECT count(*) FROM cms_installs;`
Expected: Returns 0 (empty table, no errors)

---

### Task 12: Final Build Verification and Deploy

**Files:**
- All files from Tasks 1-10

- [ ] **Step 1: Full build check**

Run: `cd ~/blog-cms && npm run build 2>&1 | tail -10`
Expected: Build succeeds with no errors (chunk size warning is OK)

- [ ] **Step 2: Grep for any remaining `isHostedMode` references**

Run: `grep -r "isHostedMode" ~/blog-cms/src/`
Expected: No results. All references should be removed.

- [ ] **Step 3: Run dev server and test manually**

Run: `cd ~/blog-cms && npm run dev`

Test these flows in browser:
1. Open `http://localhost:5173` → should redirect to `/welcome`
2. `/welcome` shows two cards (hosted + BYO)
3. Click "Sign Up Free" → goes to `/signup`
4. Click "Connect Database" → goes to `/connect` with guidance text
5. Back button on Connect → goes to `/welcome`
6. Direct access to `/login` → login form works
7. After login → dashboard shows all posts

- [ ] **Step 4: Commit any remaining fixes**

```bash
cd ~/blog-cms
git add -A
git commit -m "chore: final cleanup for dual-mode CMS"
```

- [ ] **Step 5: Deploy to Vercel**

Push to main branch to trigger Vercel deployment:

```bash
cd ~/blog-cms
git push origin main
```

Verify at https://cms.moonify.ai that the welcome page loads for unauthenticated visitors.
