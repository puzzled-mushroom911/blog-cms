import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import ContentRenderer from '../components/ContentRenderer';
import MetadataSidebar from '../components/MetadataSidebar';
import StatusBadge from '../components/StatusBadge';
import { ArrowLeft, Save, PanelRightOpen, PanelRightClose, Trash2, MessageSquareWarning } from 'lucide-react';

export default function PostEditor() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editorNotes, setEditorNotes] = useState([]);

  useEffect(() => {
    loadPost();
  }, [id]);

  async function loadPost() {
    setLoading(true);
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      navigate('/');
      return;
    }
    setPost(data);
    setEditorNotes(Array.isArray(data.editor_notes) ? data.editor_notes : []);
    setLoading(false);
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

  async function handleSave() {
    if (!post) return;
    setSaving(true);
    setSaveMessage('');

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
        status: post.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', post.id);

    setSaving(false);
    if (error) {
      setSaveMessage('Error saving: ' + error.message);
    } else {
      // Trigger site rebuild when a post is published
      if (post.status === 'published') {
        triggerDeploy();
        setSaveMessage('Saved & deploy triggered');
      } else {
        setSaveMessage('Saved');
      }
      setTimeout(() => setSaveMessage(''), 3000);
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
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
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
      navigate('/');
    } else {
      setSaveMessage('Error deleting: ' + error.message);
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
            {saveMessage && (
              <span
                className={`text-xs font-medium ${
                  saveMessage.startsWith('Error') ? 'text-red-600' : 'text-emerald-600'
                }`}
              >
                {saveMessage}
              </span>
            )}
            {/* Delete button */}
            <div className="relative">
              <button
                onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
                className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                title="Delete post"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              {showDeleteConfirm && (
                <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-lg border border-slate-200 p-4 z-50 w-64">
                  <p className="text-sm text-slate-700 mb-3">Delete this post permanently?</p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="flex-1 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 disabled:opacity-50"
                    >
                      {deleting ? 'Deleting...' : 'Delete'}
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
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
