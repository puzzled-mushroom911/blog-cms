import { useState, useEffect } from 'react';
import { fetchSeoPages } from '../lib/seoPages';
import SeoPageCard from '../components/SeoPageCard';
import { getConfig } from '../config';
import { Search, Filter, Globe, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'needs-review', label: 'Needs Review' },
  { value: 'published', label: 'Published' },
];

export default function SeoPages() {
  const { pageTypes } = getConfig();
  const typeFilters = [
    { value: 'all', label: 'All Types' },
    ...pageTypes.map((t) => ({ value: t.value, label: t.label })),
  ];
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadPages();
  }, [statusFilter, typeFilter, search]);

  async function loadPages() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSeoPages({
        status: statusFilter === 'all' ? undefined : statusFilter,
        page_type: typeFilter === 'all' ? undefined : typeFilter,
        search: search || undefined,
      });
      setPages(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const stats = {
    total: pages.length,
    draft: pages.filter(p => p.status === 'draft').length,
    needsReview: pages.filter(p => p.status === 'needs-review').length,
    published: pages.filter(p => p.status === 'published').length,
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Globe className="w-5 h-5" />
            SEO Pages
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Programmatic pages for search — not shown in blog feed
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total', value: stats.total, color: 'text-slate-900' },
          { label: 'Draft', value: stats.draft, color: 'text-slate-500' },
          { label: 'Needs Review', value: stats.needsReview, color: 'text-amber-600' },
          { label: 'Published', value: stats.published, color: 'text-emerald-600' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-3 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search pages..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5">
          {STATUS_FILTERS.map(f => (
            <Button
              key={f.value}
              variant="ghost"
              size="sm"
              onClick={() => setStatusFilter(f.value)}
              className={
                statusFilter === f.value
                  ? 'bg-slate-900 text-white hover:bg-slate-900 hover:text-white'
                  : 'text-slate-500 hover:text-slate-700'
              }
            >
              {f.label}
            </Button>
          ))}
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {typeFilters.map(f => (
              <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-20 text-red-500 text-sm">{error}</div>
      ) : pages.length === 0 ? (
        <div className="text-center py-20">
          <Globe className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No SEO pages yet.</p>
          <p className="text-slate-400 text-xs mt-1">
            Your AI assistant generates these pages automatically from approved topics.<br />
            Once created, they'll appear here for your review before going live.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {pages.map(page => (
            <SeoPageCard key={page.id} page={page} />
          ))}
        </div>
      )}
    </div>
  );
}
