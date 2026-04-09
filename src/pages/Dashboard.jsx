import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { FileText, Eye, PenTool, AlertCircle, Search, CalendarClock } from 'lucide-react';
import PostCard from '../components/PostCard';

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
  { value: 'needs-review', label: 'Needs Review' },
];

export default function Dashboard() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');

  useEffect(() => {
    loadPosts();
  }, []);

  async function loadPosts() {
    setLoading(true);
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .order('date', { ascending: false });

    if (!error && data) {
      setPosts(data);
    }
    setLoading(false);
  }

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return {
      total: posts.length,
      published: posts.filter((p) => p.status === 'published' && (!p.date || p.date <= today)).length,
      scheduled: posts.filter((p) => p.status === 'published' && p.date > today).length,
      draft: posts.filter((p) => p.status === 'draft').length,
      needsReview: posts.filter((p) => p.status === 'needs-review').length,
    };
  }, [posts]);

  const filtered = useMemo(() => {
    let result = [...posts];

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((p) => p.status === statusFilter);
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q) ||
          p.slug?.toLowerCase().includes(q)
      );
    }

    // Sort
    result.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [posts, statusFilter, searchQuery, sortOrder]);

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your blog posts
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard
          label="Total Posts"
          value={stats.total}
          icon={<FileText className="w-4 h-4" />}
          color="slate"
        />
        <StatCard
          label="Published"
          value={stats.published}
          icon={<Eye className="w-4 h-4" />}
          color="emerald"
        />
        <StatCard
          label="Scheduled"
          value={stats.scheduled}
          icon={<CalendarClock className="w-4 h-4" />}
          color="blue"
        />
        <StatCard
          label="Drafts"
          value={stats.draft}
          icon={<PenTool className="w-4 h-4" />}
          color="slate"
        />
        <StatCard
          label="Needs Review"
          value={stats.needsReview}
          icon={<AlertCircle className="w-4 h-4" />}
          color="amber"
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
            placeholder="Search posts..."
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
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>
      </div>

      {/* Post list */}
      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-400 mt-4">Loading posts...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500 font-medium">No posts found</p>
          <p className="text-xs text-slate-400 mt-1">
            {searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Posts will appear here once added to Supabase'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((post) => (
            <PostCard key={post.id} post={post} />
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
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
  };

  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
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
