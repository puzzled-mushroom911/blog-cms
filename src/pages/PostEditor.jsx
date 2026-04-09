import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import ContentRenderer from '../components/ContentRenderer';
import MetadataSidebar from '../components/MetadataSidebar';
import StatusBadge from '../components/StatusBadge';
import { ArrowLeft, Save, PanelRightOpen, PanelRightClose } from 'lucide-react';

export default function PostEditor() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);

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
    setLoading(false);
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

  function handleInlineEdit(blockIndex, field, value) {
    const content = [...post.content];
    content[blockIndex] = { ...content[blockIndex], [field]: value };
    setPost({ ...post, content });
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

            {/* Content blocks */}
            <ContentRenderer
              content={post.content}
              editable={true}
              onInlineEdit={handleInlineEdit}
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
