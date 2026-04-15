import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSupabase } from '../hooks/useSupabase';
import { useWorkspace } from '../contexts/WorkspaceContext';
import StatusBadge from '../components/StatusBadge';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ReferenceArea,
  Legend,
} from 'recharts';

const STATUS_COLORS = {
  idea: '#6366f1',
  researched: '#8b5cf6',
  approved: '#0ea5e9',
  writing: '#f97316',
  written: '#10b981',
  discarded: '#94a3b8',
};

const STATUS_ORDER = ['idea', 'researched', 'approved', 'writing', 'written'];

const DIFFICULTY_BUCKETS = [
  { name: 'Easy (0-30)', color: '#10b981', min: 0, max: 30 },
  { name: 'Medium (31-60)', color: '#f59e0b', min: 31, max: 60 },
  { name: 'Hard (61-100)', color: '#ef4444', min: 61, max: 100 },
];

function CustomScatterTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-md text-xs">
      <p className="font-semibold text-slate-800 mb-1">{data.title}</p>
      <p className="text-slate-500">Volume: <span className="font-medium text-slate-700">{data.search_volume?.toLocaleString() ?? '—'}</span></p>
      <p className="text-slate-500">Difficulty: <span className="font-medium text-slate-700">{data.keyword_difficulty ?? '—'}</span></p>
      <p className="text-slate-500">Status: <span className="font-medium text-slate-700 capitalize">{data.status}</span></p>
    </div>
  );
}

function CustomPieLabel({ cx, cy, midAngle, innerRadius, outerRadius, value, name }) {
  const RADIAN = Math.PI / 180;
  const radius = outerRadius + 20;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (value === 0) return null;

  return (
    <text x={x} y={y} fill="#475569" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={12}>
      {name} ({value})
    </text>
  );
}

export default function Analytics() {
  const supabase = useSupabase();
  const { workspaceId } = useWorkspace();
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [velocityData, setVelocityData] = useState([]);
  const [blogCount, setBlogCount] = useState(0);
  const [seoPageCount, setSeoPageCount] = useState(0);

  useEffect(() => {
    loadTopics();
    loadPublishingVelocity();
    loadContentMix();
  }, []);

  async function loadTopics() {
    setLoading(true);
    let query = supabase
      .from('blog_topics')
      .select('*')
      .order('created_at', { ascending: false });
    if (workspaceId) query = query.eq('workspace_id', workspaceId);
    const { data, error } = await query;

    if (!error && data) {
      setTopics(data);
    }
    setLoading(false);
  }

  async function loadPublishingVelocity() {
    // Get posts from the last 8 weeks
    const eightWeeksAgo = new Date();
    eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);
    const startDate = eightWeeksAgo.toISOString().split('T')[0];

    let query = supabase
      .from('blog_posts')
      .select('date, status')
      .eq('status', 'published')
      .gte('date', startDate);
    if (workspaceId) query = query.eq('workspace_id', workspaceId);

    const { data, error } = await query;
    if (error || !data) return;

    // Group by week
    const weeks = {};
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - i * 7);
      // Snap to Monday
      const day = weekStart.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      weekStart.setDate(weekStart.getDate() + diff);
      const key = weekStart.toISOString().split('T')[0];
      const label = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      weeks[key] = { week: label, count: 0, _start: weekStart };
    }

    for (const post of data) {
      const postDate = new Date(post.date);
      // Find which week bucket this post falls into
      const sortedWeeks = Object.entries(weeks).sort((a, b) => new Date(a[0]) - new Date(b[0]));
      for (let i = sortedWeeks.length - 1; i >= 0; i--) {
        if (postDate >= sortedWeeks[i][1]._start) {
          sortedWeeks[i][1].count++;
          break;
        }
      }
    }

    const sorted = Object.values(weeks)
      .sort((a, b) => new Date(a._start) - new Date(b._start))
      .map(({ week, count }) => ({ week, count }));
    setVelocityData(sorted);
  }

  async function loadContentMix() {
    // Count published blog posts
    let blogQuery = supabase
      .from('blog_posts')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published');
    if (workspaceId) blogQuery = blogQuery.eq('workspace_id', workspaceId);
    const { count: blogTotal } = await blogQuery;
    setBlogCount(blogTotal || 0);

    // Count published SEO pages
    let seoQuery = supabase
      .from('seo_pages')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published');
    if (workspaceId) seoQuery = seoQuery.eq('workspace_id', workspaceId);
    const { count: seoTotal } = await seoQuery;
    setSeoPageCount(seoTotal || 0);
  }

  const hasSearchData = useMemo(
    () => topics.some((t) => t.search_volume != null && t.search_volume > 0),
    [topics]
  );

  // Scatter chart: all topics (including discarded for context)
  const scatterData = useMemo(() => {
    const byStatus = {};
    for (const status of Object.keys(STATUS_COLORS)) {
      byStatus[status] = [];
    }
    for (const t of topics) {
      if (t.search_volume == null || t.keyword_difficulty == null) continue;
      const s = t.status || 'idea';
      if (!byStatus[s]) byStatus[s] = [];
      byStatus[s].push(t);
    }
    return byStatus;
  }, [topics]);

  // Pipeline funnel: exclude discarded
  const funnelData = useMemo(() => {
    const counts = {};
    for (const s of STATUS_ORDER) counts[s] = 0;
    for (const t of topics) {
      if (t.status && STATUS_ORDER.includes(t.status)) {
        counts[t.status]++;
      }
    }
    return STATUS_ORDER.map((s) => ({
      name: s.charAt(0).toUpperCase() + s.slice(1),
      status: s,
      count: counts[s],
      fill: STATUS_COLORS[s],
    }));
  }, [topics]);

  // Difficulty distribution: exclude discarded
  const difficultyData = useMemo(() => {
    const active = topics.filter((t) => t.status !== 'discarded' && t.keyword_difficulty != null);
    return DIFFICULTY_BUCKETS.map((bucket) => ({
      name: bucket.name,
      value: active.filter((t) => t.keyword_difficulty >= bucket.min && t.keyword_difficulty <= bucket.max).length,
      color: bucket.color,
    }));
  }, [topics]);

  // Top opportunities table: exclude discarded
  const topOpportunities = useMemo(() => {
    return topics
      .filter((t) => t.status !== 'discarded' && t.search_volume != null && t.search_volume > 0)
      .map((t) => ({
        ...t,
        score: t.search_volume / Math.max(t.keyword_difficulty ?? 0, 1),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }, [topics]);

  if (loading) {
    return (
      <div className="p-6 lg:p-8 max-w-6xl">
        <div className="text-center py-16">
          <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-400 mt-4">Loading SEO data...</p>
        </div>
      </div>
    );
  }

  if (!hasSearchData) {
    return (
      <div className="p-6 lg:p-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">
            Content performance and keyword research insights
          </p>
        </div>
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <p className="text-sm text-slate-500 font-medium">No keyword data yet</p>
          <p className="text-xs text-slate-400 mt-2">
            Research topics with keyword data (search volume, difficulty) to populate this dashboard.<br />
            Head to <Link to="/topics" className="text-indigo-600 hover:underline font-medium">Content Pipeline</Link> to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-6xl">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">SEO Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">
          Keyword research insights across your content pipeline
        </p>
      </div>

      {/* 2x2 chart grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* 1. Keyword Opportunity Scatter */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Keyword Opportunity Map</h2>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                type="number"
                dataKey="keyword_difficulty"
                name="Difficulty"
                domain={[0, 100]}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                label={{ value: 'Keyword Difficulty', position: 'insideBottom', offset: -5, fontSize: 11, fill: '#64748b' }}
              />
              <YAxis
                type="number"
                dataKey="search_volume"
                name="Volume"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                label={{ value: 'Monthly Search Volume', angle: -90, position: 'insideLeft', offset: 10, fontSize: 11, fill: '#64748b' }}
              />
              <Tooltip content={<CustomScatterTooltip />} />
              <ReferenceArea
                x1={0}
                x2={40}
                y1={200}
                y2="dataMax"
                fill="#10b981"
                fillOpacity={0.06}
                stroke="#10b981"
                strokeOpacity={0.3}
                strokeDasharray="4 4"
                label={{ value: 'Opportunity Zone', position: 'insideTopLeft', fontSize: 10, fill: '#10b981' }}
              />
              {Object.entries(STATUS_COLORS).map(([status, color]) => {
                const data = scatterData[status];
                if (!data?.length) return null;
                return (
                  <Scatter
                    key={status}
                    name={status.charAt(0).toUpperCase() + status.slice(1)}
                    data={data}
                    fill={color}
                    fillOpacity={0.8}
                    r={5}
                  />
                );
              })}
              <Legend
                wrapperStyle={{ fontSize: 11 }}
                iconSize={8}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* 2. Pipeline Funnel */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Pipeline Funnel</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={funnelData} layout="vertical" margin={{ top: 10, right: 30, bottom: 10, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 12, fill: '#475569' }}
                width={90}
              />
              <Tooltip
                formatter={(value) => [value, 'Topics']}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={28}>
                {funnelData.map((entry) => (
                  <Cell key={entry.status} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 3. Difficulty Distribution (Donut) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Difficulty Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={difficultyData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                dataKey="value"
                label={CustomPieLabel}
                labelLine={false}
                strokeWidth={2}
                stroke="#fff"
              >
                {difficultyData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [value, name]}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
              />
              <Legend
                wrapperStyle={{ fontSize: 11 }}
                iconSize={8}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 4. Publishing Velocity */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-1">Publishing Velocity</h2>
          <p className="text-xs text-slate-400 mb-4">Posts published per week</p>
          {velocityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={270}>
              <BarChart data={velocityData} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  allowDecimals={false}
                />
                <Tooltip
                  formatter={(value) => [value, 'Posts']}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[270px]">
              <p className="text-sm text-slate-400">No published posts in the last 8 weeks</p>
            </div>
          )}
        </div>
      </div>

      {/* Content Mix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-1">Blog Posts</p>
          <p className="text-2xl font-bold text-slate-700">{blogCount}</p>
          <p className="text-xs text-slate-400 mt-0.5">Published</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-1">SEO Pages</p>
          <p className="text-2xl font-bold text-slate-700">{seoPageCount}</p>
          <p className="text-xs text-slate-400 mt-0.5">Published</p>
        </div>
      </div>

      {/* Top Opportunities Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Top Opportunities</h2>
        {topOpportunities.length === 0 ? (
          <p className="text-sm text-slate-400 py-6 text-center">
            No topics with search volume data to rank.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left font-medium text-slate-500 pb-3 pr-4">#</th>
                  <th className="text-left font-medium text-slate-500 pb-3 pr-4">Title</th>
                  <th className="text-left font-medium text-slate-500 pb-3 pr-4">Primary Keyword</th>
                  <th className="text-right font-medium text-slate-500 pb-3 pr-4">Volume</th>
                  <th className="text-right font-medium text-slate-500 pb-3 pr-4">Difficulty</th>
                  <th className="text-right font-medium text-slate-500 pb-3 pr-4">Score</th>
                  <th className="text-left font-medium text-slate-500 pb-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {topOpportunities.map((topic, i) => (
                  <tr key={topic.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="py-3 pr-4 text-slate-400 tabular-nums">{i + 1}</td>
                    <td className="py-3 pr-4">
                      <Link
                        to={`/topics/${topic.id}`}
                        className="text-indigo-600 hover:text-indigo-800 hover:underline font-medium"
                      >
                        {topic.title}
                      </Link>
                    </td>
                    <td className="py-3 pr-4 text-slate-600">{topic.primary_keyword || '—'}</td>
                    <td className="py-3 pr-4 text-right tabular-nums text-slate-700">
                      {topic.search_volume?.toLocaleString() ?? '—'}
                    </td>
                    <td className="py-3 pr-4 text-right tabular-nums text-slate-700">
                      {topic.keyword_difficulty ?? '—'}
                    </td>
                    <td className="py-3 pr-4 text-right tabular-nums font-medium text-slate-800">
                      {Math.round(topic.score).toLocaleString()}
                    </td>
                    <td className="py-3">
                      <StatusBadge status={topic.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, highlight }) {
  return (
    <div className={`rounded-lg border p-3 ${highlight ? 'border-emerald-200 bg-emerald-50' : 'border-slate-100 bg-slate-50'}`}>
      <p className={`text-xs font-medium uppercase tracking-wider mb-1 ${highlight ? 'text-emerald-600' : 'text-slate-400'}`}>
        {label}
      </p>
      <p className={`text-xl font-bold ${highlight ? 'text-emerald-700' : 'text-slate-700'}`}>
        {value}
      </p>
    </div>
  );
}
