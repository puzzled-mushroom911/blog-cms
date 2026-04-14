import { useState, useEffect, useMemo } from 'react';
import { useSupabase } from '../hooks/useSupabase';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { FileText, Eye, PenTool, AlertCircle, Search, CalendarClock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PostCard from '../components/PostCard';

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
  { value: 'needs-review', label: 'Needs Review' },
];

export default function Dashboard() {
  const supabase = useSupabase();
  const { workspaceId } = useWorkspace();
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
    let query = supabase
      .from('blog_posts')
      .select('*')
      .order('date', { ascending: false });
    if (workspaceId) query = query.eq('workspace_id', workspaceId);
    const { data, error } = await query;

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
        <h1 className="text-2xl font-bold text-slate-900">Blog Posts</h1>
        <p className="text-sm text-slate-500 mt-1">
          Review and publish your blog content
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
          color={stats.published > 0 ? 'emerald' : 'slate'}
        />
        <StatCard
          label="Scheduled"
          value={stats.scheduled}
          icon={<CalendarClock className="w-4 h-4" />}
          color={stats.scheduled > 0 ? 'blue' : 'slate'}
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
          color={stats.needsReview > 0 ? 'amber' : 'slate'}
        />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search posts..."
            className="pl-9"
          />
        </div>

        {/* Status filter tabs */}
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1">
          {STATUS_FILTERS.map((f) => (
            <Button
              key={f.value}
              variant="ghost"
              size="sm"
              onClick={() => setStatusFilter(f.value)}
              className={
                statusFilter === f.value
                  ? 'bg-slate-900 text-white hover:bg-slate-900 hover:text-white'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }
            >
              {f.label}
            </Button>
          ))}
        </div>

        {/* Sort */}
        <Select value={sortOrder} onValueChange={setSortOrder}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="oldest">Oldest first</SelectItem>
          </SelectContent>
        </Select>
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
              : (
                <span className="block mt-2 text-slate-400">
                  Blog posts created by your AI assistant will appear here for review.<br />
                  Use the sidebar to navigate to <strong className="text-slate-500">Topics</strong> for keyword research or <strong className="text-slate-500">SEO Pages</strong> for programmatic content.
                </span>
              )
            }
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
    <Card className={`py-0 ${colors[color]}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          {icon}
          <span className="text-xs font-medium uppercase tracking-wider opacity-70">
            {label}
          </span>
        </div>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}
