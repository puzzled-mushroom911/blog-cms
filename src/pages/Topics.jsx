import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import {
  Lightbulb,
  ThumbsUp,
  PenTool,
  CheckCircle,
  Trash2,
  Search,
} from 'lucide-react';
import TopicCard from '../components/TopicCard';

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'researched', label: 'Researched' },
  { value: 'approved', label: 'Approved' },
  { value: 'writing', label: 'Writing' },
  { value: 'written', label: 'Written' },
];

const SORT_OPTIONS = [
  { value: 'volume-desc', label: 'Volume (high → low)' },
  { value: 'volume-asc', label: 'Volume (low → high)' },
  { value: 'difficulty-asc', label: 'Difficulty (easy → hard)' },
  { value: 'difficulty-desc', label: 'Difficulty (hard → easy)' },
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
];

export default function Topics() {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('volume-desc');
  const [showDiscarded, setShowDiscarded] = useState(false);

  useEffect(() => {
    loadTopics();
  }, []);

  async function loadTopics() {
    setLoading(true);
    const { data, error } = await supabase
      .from('blog_topics')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setTopics(data);
    }
    setLoading(false);
  }

  async function updateTopicStatus(topicId, newStatus) {
    const { error } = await supabase
      .from('blog_topics')
      .update({ status: newStatus })
      .eq('id', topicId);

    if (!error) {
      setTopics((prev) =>
        prev.map((t) => (t.id === topicId ? { ...t, status: newStatus } : t))
      );
    }
  }

  const stats = useMemo(() => ({
    researched: topics.filter((t) => t.status === 'researched').length,
    approved: topics.filter((t) => t.status === 'approved').length,
    writing: topics.filter((t) => t.status === 'writing').length,
    written: topics.filter((t) => t.status === 'written').length,
    discarded: topics.filter((t) => t.status === 'discarded').length,
  }), [topics]);

  const filtered = useMemo(() => {
    let result = [...topics];

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((t) => t.status === statusFilter);
    } else if (!showDiscarded) {
      result = result.filter((t) => t.status !== 'discarded');
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.title?.toLowerCase().includes(q) ||
          t.primary_keyword?.toLowerCase().includes(q) ||
          t.secondary_keywords?.some((kw) => kw.toLowerCase().includes(q))
      );
    }

    // Sort
    result.sort((a, b) => {
      switch (sortOrder) {
        case 'volume-desc': return (b.search_volume || 0) - (a.search_volume || 0);
        case 'volume-asc': return (a.search_volume || 0) - (b.search_volume || 0);
        case 'difficulty-asc': return (a.keyword_difficulty || 0) - (b.keyword_difficulty || 0);
        case 'difficulty-desc': return (b.keyword_difficulty || 0) - (a.keyword_difficulty || 0);
        case 'oldest': return new Date(a.created_at) - new Date(b.created_at);
        case 'newest':
        default: return new Date(b.created_at) - new Date(a.created_at);
      }
    });

    return result;
  }, [topics, statusFilter, searchQuery, sortOrder, showDiscarded]);

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Content Pipeline</h1>
        <p className="text-sm text-slate-500 mt-1">
          Review and approve researched topics — approved topics become blog posts or SEO pages
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard
          label="Researched"
          value={stats.researched}
          icon={<Lightbulb className="w-4 h-4" />}
          color="violet"
        />
        <StatCard
          label="Approved"
          value={stats.approved}
          icon={<ThumbsUp className="w-4 h-4" />}
          color="sky"
        />
        <StatCard
          label="Writing"
          value={stats.writing}
          icon={<PenTool className="w-4 h-4" />}
          color="orange"
        />
        <StatCard
          label="Written"
          value={stats.written}
          icon={<CheckCircle className="w-4 h-4" />}
          color="emerald"
        />
        <StatCard
          label="Discarded"
          value={stats.discarded}
          icon={<Trash2 className="w-4 h-4" />}
          color="slate"
        />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search topics or keywords..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 bg-white"
          />
        </div>

        {/* Status filter tabs */}
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                statusFilter === f.value
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Sort */}
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Show discarded toggle (only visible when filter is "All") */}
      {statusFilter === 'all' && stats.discarded > 0 && (
        <label className="flex items-center gap-2 mb-4 text-xs text-slate-400 cursor-pointer">
          <input
            type="checkbox"
            checked={showDiscarded}
            onChange={(e) => setShowDiscarded(e.target.checked)}
            className="rounded border-slate-300"
          />
          Show discarded ({stats.discarded})
        </label>
      )}

      {/* Topic list */}
      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-400 mt-4">Loading topics...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <Lightbulb className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500 font-medium">No topics yet.</p>
          <p className="text-xs text-slate-400 mt-1">
            {searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : (
                <span className="block mt-2 text-slate-400">
                  Your AI assistant researches keywords and adds topics here for you to review.<br />
                  Approve topics you like — your assistant will write the content. Discard the rest.
                </span>
              )
            }
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((topic) => (
            <TopicCard
              key={topic.id}
              topic={topic}
              onApprove={(id) => updateTopicStatus(id, 'approved')}
              onDiscard={(id) => updateTopicStatus(id, 'discarded')}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color }) {
  const colors = {
    slate: 'bg-slate-50 text-slate-600 border-slate-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    sky: 'bg-sky-50 text-sky-600 border-sky-100',
    violet: 'bg-violet-50 text-violet-600 border-violet-100',
    orange: 'bg-orange-50 text-orange-600 border-orange-100',
  };

  return (
    <div className={`rounded-xl border p-4 ${colors[color] || colors.slate}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wider opacity-70">
          {label}
        </span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
