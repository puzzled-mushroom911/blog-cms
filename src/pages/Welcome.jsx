import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useConnection } from '../contexts/ConnectionContext';
import { Database, Cloud, ArrowRight, CheckCircle, PlayCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Welcome() {
  const { user } = useAuth();
  const { connected } = useConnection();
  const navigate = useNavigate();
  const [showVideo, setShowVideo] = useState(false);

  if (user && connected) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <img src="https://moonify.ai/moonify-logo.svg" alt="Moonify" className="h-10 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900">AI-Powered Blog CMS</h1>
          <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
            Manage blog content created by your AI assistant. Review, edit, and publish — all from one place.
          </p>
          <button
            type="button"
            onClick={() => setShowVideo(true)}
            className="inline-flex items-center gap-1.5 mt-4 text-xs font-medium text-blue-600 hover:text-blue-700"
          >
            <PlayCircle className="w-4 h-4" />
            Watch the 30-second tour
          </button>
        </div>

        {showVideo && (
          <div
            className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-4"
            onClick={() => setShowVideo(false)}
          >
            <div
              className="relative w-full max-w-3xl bg-slate-950 rounded-xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setShowVideo(false)}
                className="absolute top-3 right-3 z-10 w-8 h-8 bg-slate-900/80 hover:bg-slate-900 rounded-full flex items-center justify-center text-white"
                aria-label="Close video"
              >
                <X className="w-4 h-4" />
              </button>
              <video
                src="/onboarding/01-intro.mp4"
                autoPlay
                controls
                playsInline
                className="w-full aspect-video bg-black"
              />
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center mb-4">
              <Cloud className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900 mb-1">Use Moonify's Database</h2>
            <p className="text-sm text-slate-500 leading-relaxed mb-6 flex-1">
              Instant setup — we host everything. Create an account and start managing your blog content in under a minute. No configuration needed.
            </p>
            <div className="space-y-3">
              <Button onClick={() => navigate('/signup')} className="w-full">
                <ArrowRight className="w-4 h-4" /> Sign Up Free
              </Button>
              <p className="text-xs text-slate-400 text-center">
                Already have an account?{' '}
                <button type="button" onClick={() => navigate('/login')} className="text-blue-600 hover:text-blue-700">Sign in</button>
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center mb-4">
              <Database className="w-5 h-5 text-emerald-600" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900 mb-1">Connect Your Own Supabase</h2>
            <p className="text-sm text-slate-500 leading-relaxed mb-6 flex-1">
              Bring your own database for full control over your data. You'll need a free Supabase account. We'll walk you through the setup step by step.
            </p>
            <div className="space-y-3">
              <Button onClick={() => navigate('/connect')} variant="outline" className="w-full">
                <Database className="w-4 h-4" /> Connect Database
              </Button>
              <p className="text-xs text-slate-400 text-center">
                Already connected?{' '}
                <button type="button" onClick={() => navigate('/login')} className="text-blue-600 hover:text-blue-700">Sign in</button>
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">How It Works</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-slate-500">1</span>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">Set up your database</p>
                <p className="text-xs text-slate-400 mt-0.5">Use our hosted database or connect your own Supabase project.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-slate-500">2</span>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">Create content with AI</p>
                <p className="text-xs text-slate-400 mt-0.5">Use Claude Code, the MCP server, or the REST API to generate blog posts.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-slate-500">3</span>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">Review and publish</p>
                <p className="text-xs text-slate-400 mt-0.5">Edit, add notes, and publish. Your website updates automatically.</p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-400 text-center mt-6">
          Open source on{' '}
          <a href="https://github.com/puzzled-mushroom911/blog-cms" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700">GitHub</a>
          {' '}&middot;{' '}Built by{' '}
          <a href="https://moonify.ai" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700">Moonify AI</a>
        </p>
      </div>
    </div>
  );
}
