import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSupabase } from '../hooks/useSupabase';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { toast } from 'sonner';
import ContentRenderer from '../components/ContentRenderer';
import MetadataSidebar from '../components/MetadataSidebar';
import StatusBadge from '../components/StatusBadge';
import { ArrowLeft, Save, PanelRightOpen, PanelRightClose, Trash2, MessageSquareWarning, CheckCircle, Globe, Loader2, ExternalLink } from 'lucide-react';
import { captureFeedback } from '../lib/feedback';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';

export default function PostEditor() {
  const supabase = useSupabase();
  const { workspaceId } = useWorkspace();
  const { id } = useParams();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editorNotes, setEditorNotes] = useState([]);
  const [originalContent, setOriginalContent] = useState(null);

  // WordPress publishing state
  const [wpConfigured, setWpConfigured] = useState(false);
  const [wpPublishing, setWpPublishing] = useState(false);

  useEffect(() => {
    loadPost();
    checkWordPressConfig();
  }, [id]);

  async function loadPost() {
    setLoading(true);
    let query = supabase
      .from('blog_posts')
      .select('*')
      .eq('id', id);
    if (workspaceId) query = query.eq('workspace_id', workspaceId);
    const { data, error } = await query.single();

    if (error || !data) {
      navigate('/');
      return;
    }
    setPost(data);
    // Store the AI's original content for feedback diffing
    if (data.original_content) {
      setOriginalContent(data.original_content);
    }
    setEditorNotes(Array.isArray(data.editor_notes) ? data.editor_notes : []);
    setLoading(false);
  }

  async function checkWordPressConfig() {
    if (!workspaceId) return;
    const { data: ws } = await supabase
      .from('workspaces')
      .select('settings')
      .eq('id', workspaceId)
      .single();
    const wp = ws?.settings?.wordpress;
    setWpConfigured(!!(wp?.site_url && wp?.username && wp?.app_password));
  }

  async function handlePublishToWordPress() {
    if (!post) return;
    setWpPublishing(true);

    try {
      // Get the Supabase session token to authenticate with our server endpoint
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Session expired. Please sign in again.');
        setWpPublishing(false);
        return;
      }

      // Call our server endpoint — it handles WordPress credentials, HTML
      // conversion, and the WordPress API call securely server-side
      const response = await fetch(`/api/v1/posts/${post.id}/publish-wordpress`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      toast.success(
        <div className="flex items-center gap-2">
          <span>Published to WordPress as draft</span>
          <a
            href={result.wordpress_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 underline"
          >
            View <ExternalLink className="w-3 h-3" />
          </a>
        </div>,
        { duration: 8000 }
      );
    } catch (err) {
      toast.error('WordPress publishing failed: ' + (err.message || 'Unknown error'));
    }

    setWpPublishing(false);
  }

  async function saveNotes(notes) {
    if (!post) return;
    await supabase
      .from('blog_posts')
      .update({ editor_notes: notes })
      .eq('id', post.id);
  }

  function handleAddNote(blockIndex, text) {
    const note = {
      blockIndex,
      text,
      author: 'Editor',
      createdAt: new Date().toISOString(),
      resolved: false,
    };
    const updated = [...editorNotes, note];
    setEditorNotes(updated);
    saveNotes(updated);
  }

  function handleToggleResolved(blockIndex, noteCreatedAt) {
    const updated = editorNotes.map((n) =>
      n.blockIndex === blockIndex && n.createdAt === noteCreatedAt
        ? { ...n, resolved: !n.resolved }
        : n
    );
    setEditorNotes(updated);
    saveNotes(updated);
  }

  const unresolvedNoteCount = editorNotes.filter((n) => !n.resolved).length;

  function scrollToFirstUnresolved() {
    const firstUnresolved = editorNotes.find((n) => !n.resolved);
    if (!firstUnresolved) return;
    const blockElements = document.querySelectorAll('[data-block-index]');
    const target = Array.from(blockElements).find(
      (el) => el.getAttribute('data-block-index') === String(firstUnresolved.blockIndex)
    );
    target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  async function handlePublish() {
    if (!post) return;
    setSaving(true);

    const { error } = await supabase
      .from('blog_posts')
      .update({
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        date: post.date || new Date().toISOString().split('T')[0],
        read_time: post.read_time,
        author: post.author,
        category: post.category,
        tags: post.tags,
        youtube_id: post.youtube_id,
        image: post.image,
        meta_description: post.meta_description,
        keywords: post.keywords,
        content: post.content,
        sources: post.sources,
        ai_reasoning: post.ai_reasoning,
        status: 'published',
        updated_at: new Date().toISOString(),
      })
      .eq('id', post.id);

    setSaving(false);
    if (error) {
      toast.error('Failed to publish: ' + error.message);
    } else {
      setPost(prev => ({ ...prev, status: 'published' }));
      // Capture feedback from edits + notes (async, non-blocking)
      if (originalContent) {
        captureFeedback(supabase, post.id, originalContent, post.content, post.title, editorNotes, workspaceId)
          .catch(() => {}); // Best-effort — don't block publish
      }
      triggerDeploy();
      revalidateBlog(post.slug);
      toast.success('Published & deploy triggered');
    }
  }

  async function handleSave() {
    if (!post) return;
    setSaving(true);

    const { error } = await supabase
      .from('blog_posts')
      .update({
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        date: post.date,
        read_time: post.read_time,
        author: post.author,
        category: post.category,
        tags: post.tags,
        youtube_id: post.youtube_id,
        image: post.image,
        meta_description: post.meta_description,
        keywords: post.keywords,
        content: post.content,
        sources: post.sources,
        ai_reasoning: post.ai_reasoning,
        status: post.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', post.id);

    setSaving(false);
    if (error) {
      toast.error('Failed to save: ' + error.message);
    } else {
      // Capture feedback from edits + notes (async, non-blocking)
      if (originalContent) {
        captureFeedback(supabase, post.id, originalContent, post.content, post.title, editorNotes, workspaceId)
          .catch(() => {}); // Best-effort — don't block save
      }
      // Trigger site rebuild when a post is published
      if (post.status === 'published') {
        triggerDeploy();
        toast.success('Saved & deploy triggered');
      } else {
        toast.success('Post saved');
      }
      revalidateBlog(post.slug);
    }
  }

  async function triggerDeploy() {
    const hookUrl = import.meta.env.VITE_DEPLOY_HOOK_URL;
    if (!hookUrl) return;
    try {
      await fetch(hookUrl, { method: 'POST' });
    } catch {
      // Deploy hook is best-effort -- don't block the save
    }
  }

  async function revalidateBlog(slug) {
    const revalidateUrl = import.meta.env.VITE_REVALIDATE_URL;
    if (!revalidateUrl) return;
    try {
      await fetch(revalidateUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-revalidate-key': import.meta.env.VITE_REVALIDATE_KEY || '',
        },
        body: JSON.stringify({ slug }),
      });
    } catch {
      // Revalidation is best-effort
    }
  }

  function handleInlineEdit(blockIndex, field, value) {
    const content = [...post.content];
    content[blockIndex] = { ...content[blockIndex], [field]: value };
    setPost({ ...post, content });
  }

  function handleInsertBlock(index, block) {
    if (!post) return;
    const content = [...post.content];
    content.splice(index, 0, block);
    setPost({ ...post, content });
  }

  function handleRemoveBlock(index) {
    if (!post) return;
    const content = [...post.content];
    content.splice(index, 1);
    setPost({ ...post, content });
  }

  async function handleDelete() {
    if (!post) return;
    setDeleting(true);
    const { error } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', post.id);
    setDeleting(false);
    if (!error) {
      toast.success('Post deleted');
      navigate('/');
    } else {
      toast.error('Failed to delete: ' + error.message);
      setShowDeleteConfirm(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Main editor area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="h-14 flex items-center justify-between px-6 border-b border-slate-200 bg-white flex-shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 min-w-0">
              <StatusBadge status={post.status} date={post.date} />
              <h1 className="text-sm font-semibold text-slate-800 truncate max-w-md">
                {post.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Delete button */}
            <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-600 hover:bg-red-50">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete this post?</DialogTitle>
                  <DialogDescription>This action cannot be undone.</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
                  <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                    {deleting ? "Deleting..." : "Delete"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            {wpConfigured && (
              <button
                onClick={handlePublishToWordPress}
                disabled={wpPublishing}
                className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                title="Publish to WordPress as draft"
              >
                {wpPublishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                {wpPublishing ? 'Sending...' : 'WordPress'}
              </button>
            )}
            {post.status !== 'published' && (
              <button
                onClick={handlePublish}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                {saving ? 'Publishing...' : 'Publish'}
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              title={showSidebar ? 'Hide sidebar' : 'Show sidebar'}
            >
              {showSidebar ? (
                <PanelRightClose className="w-5 h-5" />
              ) : (
                <PanelRightOpen className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Content preview */}
        <div className="flex-1 overflow-y-auto bg-slate-50">
          <div className="max-w-3xl mx-auto py-10 px-6">
            {/* Featured image preview */}
            {post.image && (
              <div className="mb-8 rounded-xl overflow-hidden bg-slate-200">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-48 object-cover"
                />
              </div>
            )}

            {/* Title preview */}
            <h1 className="text-3xl font-bold text-slate-900 mb-2 leading-tight">
              {post.title}
            </h1>
            <p className="text-sm text-slate-400 mb-8">
              {post.author} &middot; {post.date} &middot; {post.read_time}
            </p>

            {/* Unresolved notes banner */}
            {unresolvedNoteCount > 0 && (
              <button
                type="button"
                onClick={scrollToFirstUnresolved}
                className="w-full mb-6 flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium hover:bg-amber-100 transition-colors"
              >
                <MessageSquareWarning className="w-4 h-4 flex-shrink-0" />
                {unresolvedNoteCount} unresolved note{unresolvedNoteCount > 1 ? 's' : ''} — click to jump to first
              </button>
            )}

            {/* Content blocks */}
            <ContentRenderer
              content={post.content}
              editable={true}
              onInlineEdit={handleInlineEdit}
              onInsertBlock={handleInsertBlock}
              onRemoveBlock={handleRemoveBlock}
              slug={post.slug}
              editorNotes={editorNotes}
              onAddNote={handleAddNote}
              onToggleResolved={handleToggleResolved}
            />
          </div>
        </div>
      </div>

      {/* Metadata sidebar */}
      {showSidebar && (
        <aside className="w-80 border-l border-slate-200 bg-white flex-shrink-0 overflow-hidden">
          <MetadataSidebar
            post={post}
            onChange={setPost}
            onSave={handleSave}
            saving={saving}
          />
        </aside>
      )}
    </div>
  );
}

