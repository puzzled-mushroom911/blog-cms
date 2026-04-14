import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useConnection } from '../contexts/ConnectionContext';
import { toast } from 'sonner';
import { ArrowRight, Loader2, AlertCircle, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function CreateWorkspace() {
  const { user } = useAuth();
  const { supabase, isHostedMode } = useConnection();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!user) {
    return <Navigate to={isHostedMode ? '/signup' : '/login'} replace />;
  }

  function handleNameChange(value) {
    setName(value);
    if (!slugTouched) {
      setSlug(slugify(value));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const finalSlug = slug.trim() || slugify(name);
    if (!finalSlug) {
      setError('Workspace needs a valid URL slug.');
      setLoading(false);
      return;
    }

    // Create workspace
    const { data: workspace, error: wsError } = await supabase
      .from('workspaces')
      .insert({
        name: name.trim(),
        slug: finalSlug,
        owner_id: user.id,
      })
      .select()
      .single();

    if (wsError) {
      setLoading(false);
      if (wsError.message?.includes('duplicate') || wsError.code === '23505') {
        setError('That slug is already taken. Try a different name.');
      } else {
        setError(wsError.message);
      }
      return;
    }

    // Add creator as owner member
    const { error: memberError } = await supabase
      .from('workspace_members')
      .insert({
        workspace_id: workspace.id,
        user_id: user.id,
        role: 'owner',
      });

    if (memberError) {
      setLoading(false);
      setError('Workspace created but failed to add membership: ' + memberError.message);
      return;
    }

    setLoading(false);
    toast.success('Workspace created!');
    navigate('/');
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Name your workspace</h1>
          <p className="text-sm text-slate-500 mt-2">
            This is where your team manages blog content.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4"
        >
          <div>
            <Label className="text-sm text-slate-700 mb-1.5">Workspace name</Label>
            <Input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
              autoFocus
              placeholder="e.g. Living in St. Pete"
            />
          </div>

          <div>
            <Label className="text-sm text-slate-700 mb-1.5">URL slug</Label>
            <Input
              type="text"
              value={slug}
              onChange={(e) => { setSlug(slugify(e.target.value)); setSlugTouched(true); }}
              required
              placeholder="e.g. living-in-st-pete"
            />
            <p className="text-xs text-slate-400 mt-1">
              Used in URLs. Lowercase letters, numbers, and hyphens only.
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <Button type="submit" disabled={loading || !name.trim()} className="w-full">
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
            ) : (
              <><ArrowRight className="w-4 h-4" /> Create workspace</>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
