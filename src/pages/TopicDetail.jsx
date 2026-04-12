import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSupabase } from '../hooks/useSupabase';
import { toast } from 'sonner';
import StatusBadge from '../components/StatusBadge';
import {
  ArrowLeft,
  Save,
  Search,
  TrendingUp,
  Target,
  DollarSign,
  BarChart3,
  ExternalLink,
  MessageCircleQuestion,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { BarChart, Bar, ResponsiveContainer, Tooltip } from 'recharts';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const STATUS_OPTIONS = [
  { value: 'researched', label: 'Researched' },
  { value: 'approved', label: 'Approved' },
  { value: 'discarded', label: 'Discarded' },
  { value: 'writing', label: 'Writing' },
  { value: 'written', label: 'Written' },
];

export default function TopicDetail() {
  const supabase = useSupabase();
  const { id } = useParams();
  const navigate = useNavigate();

  const [topic, setTopic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sortField, setSortField] = useState('search_volume');
  const [sortDirection, setSortDirection] = useState('desc');

  useEffect(() => {
    loadTopic();
  }, [id]);

  async function loadTopic() {
    setLoading(true);
    const { data, error } = await supabase
      .from('blog_topics')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      navigate('/topics');
      return;
    }
    setTopic(data);
    setLoading(false);
  }

  async function handleSave() {
    if (!topic) return;
    setSaving(true);

    const { error } = await supabase
      .from('blog_topics')
      .update({
        status: topic.status,
        notes: topic.notes,
      })
      .eq('id', topic.id);

    setSaving(false);
    if (error) {
      toast.error('Failed to save: ' + error.message);
    } else {
      toast.success('Topic saved');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!topic) return null;

  const research = topic.research_data || {};

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="h-14 flex items-center justify-between px-6 border-b border-slate-200 bg-white flex-shrink-0">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/topics')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3 min-w-0">
              <StatusBadge status={topic.status} />
              <h1 className="text-sm font-semibold text-slate-800 truncate max-w-md">
                {topic.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={handleSave}
              disabled={saving}
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-slate-50">
          <div className="max-w-3xl mx-auto py-10 px-6">
            {/* Title */}
            <h1 className="text-3xl font-bold text-slate-900 mb-2 leading-tight">
              {topic.title}
            </h1>
            <p className="text-sm text-slate-400 mb-8">
              Added {new Date(topic.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>

            {/* Keyword metrics grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <MetricCard
                icon={<Search className="w-4 h-4" />}
                label="Primary Keyword"
                value={topic.primary_keyword}
              />
              <div>
                <MetricCard
                  icon={<TrendingUp className="w-4 h-4" />}
                  label="Search Volume"
                  value={`${(topic.search_volume || 0).toLocaleString()}/mo`}
                />
                {/* Monthly Search Trend sparkline */}
                {research.keyword_data?.monthly_searches?.length > 0 && (
                  <div className="bg-white rounded-b-xl border border-t-0 border-slate-200 px-3 pb-3 -mt-0.5">
                    <ResponsiveContainer width="100%" height={120}>
                      <BarChart data={research.keyword_data.monthly_searches}>
                        <Tooltip
                          contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                          labelStyle={{ fontWeight: 600, color: '#334155' }}
                          formatter={(value) => [value.toLocaleString(), 'Volume']}
                        />
                        <Bar dataKey="volume" fill="#6366f1" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
              <MetricCard
                icon={<Target className="w-4 h-4" />}
                label="Keyword Difficulty"
                value={`${topic.keyword_difficulty || 0}/100`}
              />
              <MetricCard
                icon={<DollarSign className="w-4 h-4" />}
                label="CPC"
                value={`$${(topic.cpc || 0).toFixed(2)}`}
              />
            </div>

            {/* Secondary keywords */}
            {topic.secondary_keywords?.length > 0 && (
              <div className="mb-8">
                <h2 className="text-sm font-semibold text-slate-700 mb-3">Secondary Keywords</h2>
                <div className="flex flex-wrap gap-2">
                  {topic.secondary_keywords.map((kw, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Competition level */}
            <div className="mb-8">
              <h2 className="text-sm font-semibold text-slate-700 mb-3">Competition</h2>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                topic.competition_level === 'low' ? 'bg-emerald-50 text-emerald-700' :
                topic.competition_level === 'high' ? 'bg-red-50 text-red-700' :
                'bg-amber-50 text-amber-700'
              }`}>
                <BarChart3 className="w-3 h-3" />
                {topic.competition_level?.charAt(0).toUpperCase() + topic.competition_level?.slice(1)} competition
              </span>
            </div>

            {/* Research brief (full_brief markdown) */}
            {research.full_brief && (
              <div className="mb-8">
                <h2 className="text-sm font-semibold text-slate-700 mb-3">SEO Research Brief</h2>
                <div className="bg-white rounded-xl border border-slate-200 p-6 prose prose-sm prose-slate max-w-none">
                  <MarkdownRenderer text={research.full_brief} />
                </div>
              </div>
            )}

            {/* Competitor analysis */}
            {research.competitor_analysis?.length > 0 && (
              <div className="mb-8">
                <h2 className="text-sm font-semibold text-slate-700 mb-3">Competitor Analysis</h2>
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="text-left px-4 py-3 font-medium text-slate-600">Domain</th>
                        <th className="text-left px-4 py-3 font-medium text-slate-600">What They Cover</th>
                        <th className="text-left px-4 py-3 font-medium text-slate-600">What They Miss</th>
                      </tr>
                    </thead>
                    <tbody>
                      {research.competitor_analysis.map((comp, i) => (
                        <tr key={i} className={i % 2 ? 'bg-slate-50/50' : ''}>
                          <td className="px-4 py-3 font-medium text-slate-700">{comp.domain}</td>
                          <td className="px-4 py-3 text-slate-600">{comp.what_they_cover}</td>
                          <td className="px-4 py-3 text-slate-600">{comp.what_they_miss}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Content gaps */}
            {research.content_gaps?.length > 0 && (
              <div className="mb-8">
                <h2 className="text-sm font-semibold text-slate-700 mb-3">Content Gaps (Our Advantage)</h2>
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <ol className="list-decimal list-inside space-y-2">
                    {research.content_gaps.map((gap, i) => (
                      <li key={i} className="text-sm text-slate-700">{gap}</li>
                    ))}
                  </ol>
                </div>
              </div>
            )}

            {/* AI search presence */}
            {research.ai_search_presence && (
              <div className="mb-8">
                <h2 className="text-sm font-semibold text-slate-700 mb-3">AI Search Presence</h2>
                <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                  <p className="text-sm text-slate-700">{research.ai_search_presence.summary}</p>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      research.ai_search_presence.mentions_our_site
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}>
                      {research.ai_search_presence.mentions_our_site ? 'Our site mentioned' : 'Our site not mentioned'}
                    </span>
                  </div>
                  {research.ai_search_presence.top_mentioned_domains?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-slate-500 mb-1">Top mentioned domains:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {research.ai_search_presence.top_mentioned_domains.map((domain, i) => (
                          <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">{domain}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SERP overview */}
            {research.serp_overview && (
              <div className="mb-8">
                <h2 className="text-sm font-semibold text-slate-700 mb-3">SERP Overview</h2>
                <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                  <p className="text-sm text-slate-700">{research.serp_overview.top_results_summary}</p>
                  {research.serp_overview.content_types?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {research.serp_overview.content_types.map((type, i) => (
                        <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">{type}</span>
                      ))}
                    </div>
                  )}
                  {research.serp_overview.featured_snippets && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-50 text-violet-700">
                      Featured snippet opportunity
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Suggested angles */}
            {research.suggested_angles?.length > 0 && (
              <div className="mb-8">
                <h2 className="text-sm font-semibold text-slate-700 mb-3">Suggested Angles</h2>
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <ul className="space-y-2">
                    {research.suggested_angles.map((angle, i) => (
                      <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                        <span className="text-violet-500 mt-0.5">→</span>
                        {angle}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Related Keywords Table */}
            {research.related_keywords?.length > 0 && (
              <div className="mb-8">
                <h2 className="text-sm font-semibold text-slate-700 mb-3">Related Keywords</h2>
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        {[
                          { key: 'keyword', label: 'Keyword' },
                          { key: 'search_volume', label: 'Volume' },
                          { key: 'keyword_difficulty', label: 'Difficulty' },
                          { key: 'cpc', label: 'CPC' },
                          { key: 'competition_level', label: 'Competition' },
                        ].map((col) => (
                          <th
                            key={col.key}
                            className="text-left px-4 py-3 font-medium text-slate-600 cursor-pointer hover:text-slate-900 select-none"
                            onClick={() => {
                              if (sortField === col.key) {
                                setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                              } else {
                                setSortField(col.key);
                                setSortDirection('desc');
                              }
                            }}
                          >
                            <span className="inline-flex items-center gap-1">
                              {col.label}
                              {sortField === col.key && (
                                sortDirection === 'asc'
                                  ? <ChevronUp className="w-3 h-3" />
                                  : <ChevronDown className="w-3 h-3" />
                              )}
                            </span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[...research.related_keywords]
                        .sort((a, b) => {
                          const aVal = a[sortField] ?? '';
                          const bVal = b[sortField] ?? '';
                          const cmp = typeof aVal === 'number' ? aVal - bVal : String(aVal).localeCompare(String(bVal));
                          return sortDirection === 'asc' ? cmp : -cmp;
                        })
                        .map((kw, i) => (
                          <tr key={i} className={i % 2 ? 'bg-slate-50/50' : ''}>
                            <td className="px-4 py-3 font-medium text-slate-700">{kw.keyword}</td>
                            <td className="px-4 py-3 text-slate-600">{(kw.search_volume || 0).toLocaleString()}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                (kw.keyword_difficulty || 0) < 30
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : (kw.keyword_difficulty || 0) <= 60
                                    ? 'bg-amber-50 text-amber-700'
                                    : 'bg-red-50 text-red-700'
                              }`}>
                                {kw.keyword_difficulty ?? '—'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-600">${(kw.cpc || 0).toFixed(2)}</td>
                            <td className="px-4 py-3 text-slate-600 capitalize">{kw.competition_level || '—'}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SERP Features & Results (enhanced) */}
            {(research.serp_features?.length > 0 || research.serp_results?.length > 0) && (
              <div className="mb-8">
                <h2 className="text-sm font-semibold text-slate-700 mb-3">SERP Analysis</h2>
                <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
                  {/* SERP feature badges */}
                  {research.serp_features?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-slate-500 mb-2">SERP Features</p>
                      <div className="flex flex-wrap gap-1.5">
                        {research.serp_features.map((feature, i) => {
                          const colorMap = {
                            featured_snippet: 'bg-violet-50 text-violet-700',
                            people_also_ask: 'bg-blue-50 text-blue-700',
                            local_pack: 'bg-emerald-50 text-emerald-700',
                            knowledge_panel: 'bg-amber-50 text-amber-700',
                            video: 'bg-red-50 text-red-700',
                            image: 'bg-pink-50 text-pink-700',
                          };
                          const color = colorMap[feature] || 'bg-slate-100 text-slate-600';
                          return (
                            <span key={i} className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
                              {feature.replace(/_/g, ' ')}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* SERP results list */}
                  {research.serp_results?.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-xs font-medium text-slate-500">Top Results</p>
                      {research.serp_results.map((result, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-6 h-6 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center text-xs font-semibold">
                            {result.position || i + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-800 leading-tight">{result.title}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{result.domain}</p>
                            {result.url && (
                              <a
                                href={result.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-indigo-500 hover:text-indigo-700 truncate block mt-0.5"
                              >
                                {result.url.length > 60 ? result.url.slice(0, 60) + '...' : result.url}
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* People Also Ask */}
            {research.people_also_ask?.length > 0 && (
              <div className="mb-8">
                <h2 className="text-sm font-semibold text-slate-700 mb-3">People Also Ask</h2>
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <ul className="space-y-2.5">
                    {research.people_also_ask.map((question, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                        <MessageCircleQuestion className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                        {question}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Competitors Table (enhanced — supports both old and new format) */}
            {research.competitors?.length > 0 && (
              <div className="mb-8">
                <h2 className="text-sm font-semibold text-slate-700 mb-3">Competitors</h2>
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="text-left px-4 py-3 font-medium text-slate-600">Domain</th>
                        <th className="text-left px-4 py-3 font-medium text-slate-600">Avg Position</th>
                        <th className="text-left px-4 py-3 font-medium text-slate-600">Est. Traffic</th>
                        <th className="text-left px-4 py-3 font-medium text-slate-600">Keywords</th>
                      </tr>
                    </thead>
                    <tbody>
                      {research.competitors.map((comp, i) => (
                        <tr key={i} className={i % 2 ? 'bg-slate-50/50' : ''}>
                          <td className="px-4 py-3 font-medium text-slate-700">{comp.domain}</td>
                          <td className="px-4 py-3 text-slate-600">{comp.avg_position ?? '—'}</td>
                          <td className="px-4 py-3 text-slate-600">{(comp.estimated_traffic || 0).toLocaleString()}</td>
                          <td className="px-4 py-3 text-slate-600">{(comp.relevant_keywords || 0).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <aside className="w-72 border-l border-slate-200 bg-white flex-shrink-0 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Status */}
          <div>
            <Label className="text-xs text-slate-500 uppercase tracking-wider mb-2">
              Status
            </Label>
            <Select value={topic.status} onValueChange={(val) => setTopic({ ...topic, status: val })}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div>
            <Label className="text-xs text-slate-500 uppercase tracking-wider mb-2">
              Reviewer Notes
            </Label>
            <Textarea
              value={topic.notes || ''}
              onChange={(e) => setTopic({ ...topic, notes: e.target.value })}
              rows={6}
              placeholder="Add notes about this topic..."
              className="resize-y"
            />
          </div>

          {/* Linked blog post */}
          {topic.blog_post_id && (
            <div>
              <Label className="text-xs text-slate-500 uppercase tracking-wider mb-2">
                Blog Post
              </Label>
              <Link
                to={`/posts/${topic.blog_post_id}`}
                className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-100 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                View written post
              </Link>
            </div>
          )}

          {/* Timestamps */}
          <div className="text-xs text-slate-400 space-y-1 pt-4 border-t border-slate-100">
            <p>Created: {new Date(topic.created_at).toLocaleString()}</p>
            <p>Updated: {new Date(topic.updated_at).toLocaleString()}</p>
          </div>

          {/* Save button */}
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </aside>
    </div>
  );
}

function MetricCard({ icon, label, value }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-slate-400">{icon}</span>
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}

/**
 * Simple markdown-to-HTML renderer for the full_brief field.
 * Handles headings, bold, italic, lists, and paragraphs.
 */
function MarkdownRenderer({ text }) {
  if (!text) return null;

  const lines = text.split('\n');
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Headings
    if (line.startsWith('### ')) {
      elements.push(<h4 key={i} className="font-semibold text-slate-800 mt-4 mb-2">{line.slice(4)}</h4>);
    } else if (line.startsWith('## ')) {
      elements.push(<h3 key={i} className="font-semibold text-slate-800 text-lg mt-5 mb-2">{line.slice(3)}</h3>);
    } else if (line.startsWith('# ')) {
      elements.push(<h2 key={i} className="font-bold text-slate-900 text-xl mt-6 mb-3">{line.slice(2)}</h2>);
    }
    // List items
    else if (line.match(/^\s*[-*]\s/)) {
      const items = [];
      while (i < lines.length && lines[i].match(/^\s*[-*]\s/)) {
        items.push(lines[i].replace(/^\s*[-*]\s/, ''));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="list-disc list-inside space-y-1 my-2">
          {items.map((item, j) => <li key={j} className="text-slate-700">{item}</li>)}
        </ul>
      );
      continue;
    }
    // Numbered list
    else if (line.match(/^\s*\d+\.\s/)) {
      const items = [];
      while (i < lines.length && lines[i].match(/^\s*\d+\.\s/)) {
        items.push(lines[i].replace(/^\s*\d+\.\s/, ''));
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} className="list-decimal list-inside space-y-1 my-2">
          {items.map((item, j) => <li key={j} className="text-slate-700">{item}</li>)}
        </ol>
      );
      continue;
    }
    // Empty line
    else if (line.trim() === '') {
      // skip
    }
    // Paragraph
    else {
      elements.push(<p key={i} className="text-slate-700 my-2">{line}</p>);
    }

    i++;
  }

  return <>{elements}</>;
}
