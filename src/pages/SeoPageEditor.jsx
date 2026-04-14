import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchSeoPageById, updateSeoPage, deleteSeoPage, approveSeoPage } from '../lib/seoPages';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { toast } from 'sonner';
import ContentRenderer from '../components/ContentRenderer';
import StatusBadge from '../components/StatusBadge';
import { getConfig } from '../config';
import {
  ArrowLeft, Save, Trash2, CheckCircle, Loader2, Globe,
  Calendar, Eye, PanelRight, PanelRightClose,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

const STATUS_OPTIONS = ['draft', 'needs-review', 'published'];

export default function SeoPageEditor() {
  const { pageTypes } = getConfig();
  const { workspaceId } = useWorkspace();
  const { id } = useParams();
  const navigate = useNavigate();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    loadPage();
  }, [id]);

  async function loadPage() {
    setLoading(true);
    try {
      const data = await fetchSeoPageById(id, workspaceId);
      setPage(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function updateField(field, value) {
    setPage(prev => ({ ...prev, [field]: value }));
  }

  function handleInlineEdit(blockIndex, field, value) {
    const content = [...page.content];
    content[blockIndex] = { ...content[blockIndex], [field]: value };
    setPage(prev => ({ ...prev, content }));
  }

  function handleInsertBlock(index, block) {
    if (!page) return;
    const content = [...page.content];
    content.splice(index, 0, block);
    setPage(prev => ({ ...prev, content }));
  }

  function handleRemoveBlock(index) {
    if (!page) return;
    const content = [...page.content];
    content.splice(index, 1);
    setPage(prev => ({ ...prev, content }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const { id: _, created_at, updated_at, ...updates } = page;
      await updateSeoPage(id, updates);
      toast.success('Page saved');
    } catch (err) {
      toast.error('Failed to save: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleApprove() {
    setSaving(true);
    try {
      const updated = await approveSeoPage(id, page.scheduled_date);
      setPage(updated);
      toast.success('Page approved');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    try {
      await deleteSeoPage(id);
      toast.success('Page deleted');
      navigate('/seo-pages');
    } catch (err) {
      toast.error(err.message);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="flex items-center justify-center min-h-screen text-slate-500">
        Page not found.
      </div>
    );
  }

  const previewUrl = `/${page.page_type}/${page.slug}`;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <div className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/seo-pages')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <StatusBadge status={page.status} />
          <span className="text-sm text-slate-500 truncate max-w-xs">{page.title}</span>
        </div>
        <div className="flex items-center gap-2">
          {page.status === 'needs-review' && (
            <Button
              onClick={handleApprove}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Approve
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowDeleteConfirm(true)}
            className="text-slate-400 hover:text-red-500 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSidebar(!showSidebar)}
          >
            {showSidebar ? <PanelRightClose className="w-4 h-4" /> : <PanelRight className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {error && (
        <div className="mx-4 mt-2 p-2 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>
      )}

      <div className="flex">
        {/* Content preview */}
        <div className={`flex-1 p-6 ${showSidebar ? 'mr-80' : ''} transition-all`}>
          <div className="max-w-3xl mx-auto bg-white rounded-xl border border-slate-200 p-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">{page.h1 || page.title}</h1>
            {page.meta_description && (
              <p className="text-sm text-slate-500 mb-6 italic">{page.meta_description}</p>
            )}
            {Array.isArray(page.content) && page.content.length > 0 ? (
              <ContentRenderer
                content={page.content}
                editable={true}
                onInlineEdit={handleInlineEdit}
                onInsertBlock={handleInsertBlock}
                onRemoveBlock={handleRemoveBlock}
                slug={page.slug}
              />
            ) : (
              <p className="text-slate-400 text-sm italic">No content blocks yet.</p>
            )}

            {/* Structured data summary */}
            {page.data && Object.keys(page.data).length > 0 && (
              <details className="mt-8 border-t border-slate-100 pt-4">
                <summary className="text-sm font-medium text-slate-500 cursor-pointer hover:text-slate-700">
                  Structured Data ({Object.keys(page.data).length} fields)
                </summary>
                <pre className="mt-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg overflow-auto max-h-60">
                  {JSON.stringify(page.data, null, 2)}
                </pre>
              </details>
            )}
          </div>
        </div>

        {/* Sidebar */}
        {showSidebar && (
          <aside className="fixed right-0 top-14 bottom-0 w-80 bg-white border-l border-slate-200 overflow-y-auto p-4 space-y-4">
            <h2 className="font-semibold text-sm text-slate-900">Page Settings</h2>

            {/* Status */}
            <div>
              <Label className="text-xs text-slate-500 mb-1">Status</Label>
              <Select value={page.status} onValueChange={(val) => updateField('status', val)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Page Type */}
            <div>
              <Label className="text-xs text-slate-500 mb-1">Page Type</Label>
              <Select value={page.page_type} onValueChange={(val) => updateField('page_type', val)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pageTypes.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div>
              <Label className="text-xs text-slate-500 mb-1">Title</Label>
              <Input
                type="text"
                value={page.title}
                onChange={e => updateField('title', e.target.value)}
              />
              <span className="text-xs text-slate-400 mt-0.5 block">{page.title.length}/60</span>
            </div>

            {/* Slug */}
            <div>
              <Label className="text-xs text-slate-500 mb-1">Slug</Label>
              <Input
                type="text"
                value={page.slug}
                onChange={e => updateField('slug', e.target.value)}
                className="font-mono"
              />
            </div>

            {/* H1 */}
            <div>
              <Label className="text-xs text-slate-500 mb-1">H1</Label>
              <Input
                type="text"
                value={page.h1}
                onChange={e => updateField('h1', e.target.value)}
              />
            </div>

            {/* Scheduled Date */}
            <div>
              <Label className="text-xs text-slate-500 mb-1">Scheduled Date</Label>
              <Input
                type="date"
                value={page.scheduled_date || ''}
                onChange={e => updateField('scheduled_date', e.target.value || null)}
              />
            </div>

            <hr className="border-slate-100" />
            <h2 className="font-semibold text-sm text-slate-900">SEO</h2>

            {/* Meta Description */}
            <div>
              <Label className="text-xs text-slate-500 mb-1">Meta Description</Label>
              <Textarea
                value={page.meta_description}
                onChange={e => updateField('meta_description', e.target.value)}
                rows={3}
                className="resize-none"
              />
              <span className={`text-xs mt-0.5 block ${page.meta_description.length > 160 ? 'text-red-500' : 'text-slate-400'}`}>
                {page.meta_description.length}/160
              </span>
            </div>

            {/* Keywords */}
            <div>
              <Label className="text-xs text-slate-500 mb-1">Keywords</Label>
              <Input
                type="text"
                value={page.keywords || ''}
                onChange={e => updateField('keywords', e.target.value)}
                placeholder="comma, separated, keywords"
              />
            </div>

            {/* Preview link */}
            <div className="pt-2">
              <a
                href={`${import.meta.env.VITE_SITE_URL || ''}${previewUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700"
              >
                <Eye className="w-3.5 h-3.5" />
                Preview on site
              </a>
            </div>
          </aside>
        )}
      </div>

      {/* Delete confirmation modal */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this page?</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
