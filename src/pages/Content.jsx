import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabase } from '../hooks/useSupabase';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { fetchSeoPages } from '../lib/seoPages';
import { getConfig } from '../config';
import {
  FileText,
  Eye,
  PenTool,
  AlertCircle,
  CalendarClock,
  Search,
  Plus,
  Lightbulb,
  Settings,
  BookOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import ContentCard from '../components/ContentCard';

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'needs-review', label: 'In Review' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'published', label: 'Published' },
];

const TYPE_FILTERS = [
  { value: 'all', label: 'All Types' },
  { value: 'blog', label: 'Blog Posts' },
  { value: 'seo', label: 'SEO Pages' },
];

export default function Content() {
  const supabase = useSupabase();
  const navigate = useNavigate();
  const { workspaceId } = useWorkspace();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadContent();
  }, []);

  async function loadContent() {
    setLoading(true);

    // Fetch blog posts with linked topic keyword data
    const blogItems = await loadBlogPosts();
    const seoItems = await loadSeoPages();

    setItems([...blogItems, ...seoItems]);
    setLoading(false);
  }

  async function loadBlogPosts() {
    try {
      // Try JOIN to blog_topics for keyword data
      let query = supabase
        .from('blog_posts')
        .select('*, blog_topics!blog_topics_blog_post_id_fkey(search_volume, keyword_difficulty)')
        .order('date', { ascending: false });
      if (workspaceId) query = query.eq('workspace_id', workspaceId);

      const { data, error } = await query;

      if (!error && data) {
        return data.map(normalizeBlogPost);
      }
    } catch {
      // Ignore — fall through to fallback
    }

    // Fallback: fetch posts and topics separately, merge client-side
    let postQuery = supabase
      .from('blog_posts')
      .select('*')
      .order('date', { ascending: false });
    if (workspaceId) postQuery = postQuery.eq('workspace_id', workspaceId);
    const { data: posts, error: postError } = await postQuery;

    if (postError || !posts) return [];

    let topicQuery = supabase
      .from('blog_topics')
      .select('blog_post_id, search_volume, keyword_difficulty')
      .not('blog_post_id', 'is', null);
    if (workspaceId) topicQuery = topicQuery.eq('workspace_id', workspaceId);
    const { data: topics } = await topicQuery;

    const topicMap = {};
    if (topics) {
      for (const t of topics) {
        if (t.blog_post_id) topicMap[t.blog_post_id] = t;
      }
    }

    return posts.map((post) => {
      const topic = topicMap[post.id];
      return normalizeBlogPost({
        ...post,
        blog_topics: topic ? [topic] : [],
      });
    });
  }

  async function loadSeoPages() {
    try {
      const data = await fetchSeoPages({}, 'created_at', false, workspaceId);
      return (data || []).map(normalizeSeoPage);
    } catch {
      return [];
    }
  }

  async function handleNewPost() {
    if (creating) return;
    setCreating(true);

    const slug = `untitled-${Date.now()}`;
    const today = new Date().toISOString().split('T')[0];

    const insertData = {
      title: 'Untitled Post',
      status: 'draft',
      slug,
      date: today,
      content: [],
    };
    if (workspaceId) insertData.workspace_id = workspaceId;

    const { data, error } = await supabase
      .from('blog_posts')
      .insert(insertData)
      .select()
      .single();

    setCreating(false);

    if (!error && data) {
      navigate(`/posts/${data.id}`);
    }
  }

  // Stats computed from all loaded items (unfiltered)
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return {
      total: items.length,
      draft: items.filter((i) => i.status === 'draft').length,
      needsReview: items.filter((i) => i.status === 'needs-review').length,
      scheduled: items.filter(
        (i) => i.status === 'published' && i.date && i.date > today
      ).length,
      published: items.filter(
        (i) => i.status === 'published' && (!i.date || i.date <= today)
      ).length,
    };
  }, [items]);

  // Filtered + sorted items
  const filtered = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    let result = [...items];

    // Type filter
    if (typeFilter !== 'all') {
      result = result.filter((i) => i.type === typeFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'scheduled') {
        result = result.filter(
          (i) => i.status === 'published' && i.date && i.date > today
        );
      } else if (statusFilter === 'published') {
        result = result.filter(
          (i) => i.status === 'published' && (!i.date || i.date <= today)
        );
      } else {
        result = result.filter((i) => i.status === statusFilter);
      }
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (i) =>
          i.title?.toLowerCase().includes(q) ||
          i.slug?.toLowerCase().includes(q)
      );
    }

    // Sort
    result.sort((a, b) => {
      const dateA = new Date(a.date || a.created_at);
      const dateB = new Date(b.date || b.created_at);
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [items, typeFilter, statusFilter, searchQuery, sortOrder]);

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Content</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage all your blog posts and SEO pages
          </p>
        </div>
        <Button onClick={handleNewPost} disabled={creating} size="sm">
          <Plus className="w-4 h-4 mr-1.5" />
          {creating ? 'Creating...' : 'New Post'}
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard
          label="Total"
          value={stats.total}
          icon={<FileText className="w-4 h-4" />}
          color="slate"
        />
        <StatCard
          label="Drafts"
          value={stats.draft}
          icon={<PenTool className="w-4 h-4" />}
          color="slate"
        />
        <StatCard
          label="In Review"
          value={stats.needsReview}
          icon={<AlertCircle className="w-4 h-4" />}
          color={stats.needsReview > 0 ? 'amber' : 'slate'}
        />
        <StatCard
          label="Scheduled"
          value={stats.scheduled}
          icon={<CalendarClock className="w-4 h-4" />}
          color={stats.scheduled > 0 ? 'blue' : 'slate'}
        />
        <StatCard
          label="Published"
          value={stats.published}
          icon={<Eye className="w-4 h-4" />}
          color={stats.published > 0 ? 'emerald' : 'slate'}
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
            placeholder="Search content..."
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

        {/* Type filter */}
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TYPE_FILTERS.map((f) => (
              <SelectItem key={f.value} value={f.value}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

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

      {/* Content list */}
      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-400 mt-4">Loading content...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {searchQuery || statusFilter !== 'all' || typeFilter !== 'all' ? (
            <div className="text-center py-16">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500 font-medium">
                No content matches your filters
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          ) : (
            <div className="p-8">
              <div className="text-center mb-8">
                <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-slate-800">
                  Welcome to your CMS
                </h3>
                <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                  Your content feed is empty. Here's how to get started:
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center mb-3">
                    <span className="text-sm font-bold text-blue-600">1</span>
                  </div>
                  <p className="text-sm font-medium text-slate-700">
                    Connect Claude Code
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Add the MCP server to Claude Code and start generating
                    content
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center mb-3">
                    <span className="text-sm font-bold text-emerald-600">
                      2
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-700">
                    AI generates content
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Blog posts and SEO pages appear here as drafts
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center mb-3">
                    <span className="text-sm font-bold text-amber-600">3</span>
                  </div>
                  <p className="text-sm font-medium text-slate-700">
                    Review and publish
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Edit, approve, and schedule — your website updates
                    automatically
                  </p>
                </div>
              </div>

              <div className="mt-6 text-center">
                <p className="text-xs text-slate-400">
                  Check out{' '}
                  <strong className="text-slate-500">API Docs</strong> in the
                  sidebar for setup instructions, or visit{' '}
                  <strong className="text-slate-500">Content Pipeline</strong>{' '}
                  to research topics first.
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => (
            <ContentCard key={`${item.type}-${item.id}`} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

// --- Normalizers ---

function normalizeBlogPost(post) {
  // Extract keyword data from joined blog_topics
  const topics = post.blog_topics;
  const topic = Array.isArray(topics) && topics.length > 0 ? topics[0] : null;

  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    status: post.status,
    date: post.date,
    type: 'blog',
    // Blog-specific
    category: post.category,
    read_time: post.read_time,
    image: post.image,
    content: post.content,
    tags: post.tags,
    // Optional SEO data from linked topic
    search_volume: topic?.search_volume ?? null,
    keyword_difficulty: topic?.keyword_difficulty ?? null,
    // Shared
    meta_description: post.meta_description,
    created_at: post.created_at,
    updated_at: post.updated_at,
  };
}

function normalizeSeoPage(page) {
  return {
    id: page.id,
    title: page.title,
    slug: page.slug,
    status: page.status,
    date: page.scheduled_date || null,
    type: 'seo',
    // SEO-specific
    page_type: page.page_type,
    h1: page.h1,
    scheduled_date: page.scheduled_date,
    // Shared
    meta_description: page.meta_description,
    created_at: page.created_at,
    updated_at: page.updated_at,
    // No keyword data for SEO pages (they don't link to blog_topics)
    search_volume: null,
    keyword_difficulty: null,
  };
}

// --- Stat Card ---

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
