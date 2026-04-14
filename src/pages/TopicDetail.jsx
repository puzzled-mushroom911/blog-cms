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
  ChevronRight,
  Globe,
  Video,
  Sparkles,
  Users,
  Eye,
  FileText,
  Lightbulb,
  AlertTriangle,
  Code,
  Play,
  Hash,
  Bot,
} from 'lucide-react';
import { BarChart, Bar, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
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

const SERP_FEATURE_META = {
  ai_overview: { label: 'AI Overview', color: 'bg-violet-50 text-violet-700 border-violet-200', icon: Bot },
  featured_snippet: { label: 'Featured Snippet', color: 'bg-violet-50 text-violet-700 border-violet-200', icon: Sparkles },
  people_also_ask: { label: 'People Also Ask', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: MessageCircleQuestion },
  local_pack: { label: 'Local Pack', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: Globe },
  video_carousel: { label: 'Video Carousel', color: 'bg-red-50 text-red-700 border-red-200', icon: Video },
  video: { label: 'Video', color: 'bg-red-50 text-red-700 border-red-200', icon: Video },
  knowledge_panel: { label: 'Knowledge Panel', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: FileText },
  image: { label: 'Images', color: 'bg-pink-50 text-pink-700 border-pink-200', icon: Eye },
  perspectives: { label: 'Perspectives', color: 'bg-sky-50 text-sky-700 border-sky-200', icon: Users },
  related_searches: { label: 'Related Searches', color: 'bg-slate-100 text-slate-700 border-slate-200', icon: Search },
};

export default function TopicDetail() {
  const supabase = useSupabase();
  const { id } = useParams();
  const navigate = useNavigate();

  const [topic, setTopic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sortField, setSortField] = useState('search_volume');
  const [sortDirection, setSortDirection] = useState('desc');
  const [collapsed, setCollapsed] = useState({});

  const toggle = (key) => setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));

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
            <Button variant="ghost" size="icon" onClick={() => navigate('/topics')}>
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
            <span className="text-[10px] font-medium text-slate-400 bg-slate-50 border border-slate-200 rounded px-2 py-1 tracking-wide uppercase">
              Powered by DataForSEO
            </span>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-slate-50">
          <div className="max-w-4xl mx-auto py-10 px-6">
            {/* Title */}
            <h1 className="text-3xl font-bold text-slate-900 mb-2 leading-tight">
              {topic.title}
            </h1>
            <p className="text-sm text-slate-400 mb-8">
              Added {new Date(topic.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>

            {/* ═══════════════════════════════════════════
                KEYWORD METRICS
               ═══════════════════════════════════════════ */}
            <SectionHeader icon={Search} title="Keyword Metrics" source="Google Ads + DataForSEO Labs" />

            <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-4">
              <MetricCard icon={<Search className="w-4 h-4" />} label="Keyword" value={topic.primary_keyword} className="col-span-2" />
              <MetricCard icon={<TrendingUp className="w-4 h-4" />} label="Volume" value={`${(topic.search_volume || 0).toLocaleString()}/mo`} />
              <MetricCard icon={<Target className="w-4 h-4" />} label="Difficulty" value={topic.keyword_difficulty ? `${topic.keyword_difficulty}/100` : 'N/A'} />
              <MetricCard icon={<DollarSign className="w-4 h-4" />} label="CPC" value={topic.cpc ? `$${Number(topic.cpc).toFixed(2)}` : 'N/A'} />
              <MetricCard icon={<BarChart3 className="w-4 h-4" />} label="Competition" value={
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  topic.competition_level === 'low' ? 'bg-emerald-50 text-emerald-700' :
                  topic.competition_level === 'high' ? 'bg-red-50 text-red-700' :
                  'bg-amber-50 text-amber-700'
                }`}>
                  {topic.competition_level?.charAt(0).toUpperCase() + topic.competition_level?.slice(1) || 'N/A'}
                </span>
              } />
            </div>

            {/* CPC Bid Range */}
            {(research.keyword_data?.high_top_of_page_bid || research.keyword_data?.low_top_of_page_bid) && (
              <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4">
                <p className="text-xs font-medium text-slate-500 mb-2">Google Ads Bid Range (Top of Page)</p>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>Low: ${research.keyword_data.low_top_of_page_bid?.toFixed(2) || '—'}</span>
                      <span>High: ${research.keyword_data.high_top_of_page_bid?.toFixed(2) || '—'}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-400 to-amber-400 rounded-full"
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Competition Index */}
            {research.keyword_data?.competition_index != null && (
              <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-slate-500">Competition Index</p>
                  <span className="text-sm font-semibold text-slate-800">
                    {(research.keyword_data.competition_index * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      research.keyword_data.competition_index < 0.3 ? 'bg-emerald-400' :
                      research.keyword_data.competition_index < 0.7 ? 'bg-amber-400' : 'bg-red-400'
                    }`}
                    style={{ width: `${Math.min(research.keyword_data.competition_index * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Monthly Search Trend */}
            {research.keyword_data?.monthly_searches?.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4">
                <p className="text-xs font-medium text-slate-500 mb-3">Monthly Search Volume Trend</p>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={research.keyword_data.monthly_searches}>
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <Tooltip
                      contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                      labelStyle={{ fontWeight: 600, color: '#334155' }}
                      formatter={(value) => [value.toLocaleString(), 'Volume']}
                    />
                    <Bar dataKey="volume" fill="#6366f1" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Secondary keywords */}
            {topic.secondary_keywords?.length > 0 && (
              <div className="mb-8">
                <p className="text-xs font-medium text-slate-500 mb-2">Secondary Keywords</p>
                <div className="flex flex-wrap gap-2">
                  {topic.secondary_keywords.map((kw, i) => (
                    <span key={i} className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════
                SERP ANALYSIS — from DataForSEO
               ═══════════════════════════════════════════ */}
            <SectionHeader icon={Globe} title="SERP Analysis" source="DataForSEO SERP API" />

            {/* SERP feature badges */}
            {research.serp_features?.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-medium text-slate-500 mb-2">Google SERP Features Detected</p>
                <div className="flex flex-wrap gap-2">
                  {research.serp_features.map((feature, i) => {
                    const meta = SERP_FEATURE_META[feature] || { label: feature.replace(/_/g, ' '), color: 'bg-slate-100 text-slate-600 border-slate-200', icon: Globe };
                    const Icon = meta.icon;
                    return (
                      <span key={i} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${meta.color}`}>
                        <Icon className="w-3.5 h-3.5" />
                        {meta.label}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* AI Overview */}
            {research.ai_overview && (
              <div className="mb-6">
                <CollapsibleSection
                  title="Google AI Overview"
                  icon={<Bot className="w-4 h-4 text-violet-500" />}
                  badge="AI-generated"
                  badgeColor="bg-violet-50 text-violet-700"
                  defaultOpen={true}
                  id="ai-overview"
                  collapsed={collapsed}
                  toggle={toggle}
                >
                  <div className="text-sm text-slate-700 leading-relaxed mb-4">
                    {research.ai_overview.summary}
                  </div>

                  {/* AI Overview key data points */}
                  {research.ai_overview.key_data_points && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                      {Object.entries(research.ai_overview.key_data_points).map(([key, value]) => (
                        <div key={key} className="bg-violet-50/50 rounded-lg px-3 py-2">
                          <p className="text-[10px] font-medium text-violet-500 uppercase tracking-wider">
                            {key.replace(/_/g, ' ')}
                          </p>
                          <p className="text-sm font-semibold text-violet-900">{value}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* AI Overview sources */}
                  {research.ai_overview.sources?.length > 0 && (
                    <div>
                      <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">Sources cited by AI Overview</p>
                      <div className="flex flex-wrap gap-1.5">
                        {research.ai_overview.sources.map((source, i) => (
                          <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-xs">{source}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI Overview references (detailed) */}
                  {research.ai_overview.references?.length > 0 && (
                    <div className="mt-3">
                      <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-2">Reference Details</p>
                      <div className="space-y-2">
                        {research.ai_overview.references.map((ref, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs">
                            <span className="flex-shrink-0 w-5 h-5 bg-violet-100 text-violet-600 rounded flex items-center justify-center font-mono text-[10px]">{i + 1}</span>
                            <div className="min-w-0">
                              <a href={ref.url} target="_blank" rel="noopener noreferrer" className="font-medium text-indigo-600 hover:text-indigo-800 truncate block">
                                {ref.title || ref.source}
                              </a>
                              <span className="text-slate-400">{ref.domain || ref.source}</span>
                              {ref.text && <p className="text-slate-500 mt-0.5 line-clamp-2">{ref.text}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CollapsibleSection>
              </div>
            )}

            {/* SERP Results — Top organic results */}
            {research.serp_results?.length > 0 && (
              <div className="mb-6">
                <CollapsibleSection
                  title={`Top ${research.serp_results.length} Organic Results`}
                  icon={<Search className="w-4 h-4 text-indigo-500" />}
                  badge={`${research.serp_results.length} results`}
                  badgeColor="bg-indigo-50 text-indigo-600"
                  defaultOpen={true}
                  id="serp-results"
                  collapsed={collapsed}
                  toggle={toggle}
                >
                  <div className="space-y-3">
                    {research.serp_results.map((result, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                        <span className="flex-shrink-0 w-7 h-7 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center text-xs font-bold">
                          {result.position || i + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-sm font-semibold text-slate-800 leading-tight">{result.title}</p>
                            {result.type && result.type !== 'organic' && (
                              <span className="flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700">
                                {result.type.replace(/_/g, ' ')}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-emerald-600 font-medium">{result.domain}</p>
                          {result.description && (
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{result.description}</p>
                          )}
                          {result.highlighted?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {result.highlighted.map((h, j) => (
                                <span key={j} className="px-1.5 py-0.5 bg-yellow-50 text-yellow-800 rounded text-[10px] font-medium border border-yellow-200">
                                  {h}
                                </span>
                              ))}
                            </div>
                          )}
                          {result.url && (
                            <a href={result.url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-indigo-400 hover:text-indigo-600 truncate block mt-1">
                              {result.url.length > 80 ? result.url.slice(0, 80) + '...' : result.url}
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CollapsibleSection>
              </div>
            )}

            {/* Video Carousel */}
            {research.video_carousel?.length > 0 && (
              <div className="mb-6">
                <CollapsibleSection
                  title="Video Carousel"
                  icon={<Play className="w-4 h-4 text-red-500" />}
                  badge={`${research.video_carousel.length} videos`}
                  badgeColor="bg-red-50 text-red-600"
                  defaultOpen={true}
                  id="video-carousel"
                  collapsed={collapsed}
                  toggle={toggle}
                >
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium mb-3">
                    Channels owning video positions in Google SERP
                  </p>
                  <div className="space-y-2">
                    {research.video_carousel.map((video, i) => (
                      <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-50">
                        <span className="flex-shrink-0 w-7 h-7 bg-red-100 text-red-600 rounded-lg flex items-center justify-center">
                          <Play className="w-3.5 h-3.5" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-800 leading-tight">{video.title}</p>
                          <p className="text-xs text-red-600 font-medium mt-0.5">{video.source}</p>
                          {video.timestamp && (
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {new Date(video.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                          )}
                          {video.url && (
                            <a href={video.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-indigo-400 hover:text-indigo-600 mt-0.5 block">
                              Watch on YouTube
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CollapsibleSection>
              </div>
            )}

            {/* People Also Ask */}
            {research.people_also_ask?.length > 0 && (
              <div className="mb-6">
                <CollapsibleSection
                  title="People Also Ask"
                  icon={<MessageCircleQuestion className="w-4 h-4 text-blue-500" />}
                  badge={`${research.people_also_ask.length} questions`}
                  badgeColor="bg-blue-50 text-blue-600"
                  defaultOpen={true}
                  id="paa"
                  collapsed={collapsed}
                  toggle={toggle}
                >
                  <div className="space-y-2">
                    {research.people_also_ask.map((item, i) => {
                      const question = typeof item === 'string' ? item : item.title;
                      const answer = typeof item === 'object' ? item : null;
                      return (
                        <div key={i} className="p-3 rounded-lg bg-blue-50/50 border border-blue-100">
                          <div className="flex items-start gap-2.5">
                            <MessageCircleQuestion className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-800">{question}</p>
                              {answer?.expanded_element?.[0] && (
                                <div className="mt-2 pl-3 border-l-2 border-blue-200">
                                  <p className="text-xs text-slate-600">{answer.expanded_element[0].description}</p>
                                  <p className="text-[10px] text-slate-400 mt-1">
                                    Source: {answer.expanded_element[0].domain}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CollapsibleSection>
              </div>
            )}

            {/* Perspectives (social mentions) */}
            {research.perspectives?.length > 0 && (
              <div className="mb-6">
                <CollapsibleSection
                  title="Perspectives & Social Mentions"
                  icon={<Users className="w-4 h-4 text-sky-500" />}
                  badge={`${research.perspectives.length} mentions`}
                  badgeColor="bg-sky-50 text-sky-600"
                  defaultOpen={false}
                  id="perspectives"
                  collapsed={collapsed}
                  toggle={toggle}
                >
                  <div className="space-y-2">
                    {research.perspectives.map((p, i) => (
                      <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-50">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-slate-700 leading-snug line-clamp-3">{p.title}</p>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-[10px] font-medium text-sky-600">{p.source || p.domain}</span>
                            {p.date && <span className="text-[10px] text-slate-400">{p.date}</span>}
                          </div>
                          {p.url && (
                            <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-indigo-400 hover:text-indigo-600 mt-0.5 block truncate">
                              {p.url.length > 70 ? p.url.slice(0, 70) + '...' : p.url}
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CollapsibleSection>
              </div>
            )}

            {/* Related Searches */}
            {research.related_searches?.length > 0 && (
              <div className="mb-6">
                <CollapsibleSection
                  title="Related Searches"
                  icon={<Hash className="w-4 h-4 text-slate-500" />}
                  badge={`${research.related_searches.length} queries`}
                  badgeColor="bg-slate-100 text-slate-600"
                  defaultOpen={true}
                  id="related-searches"
                  collapsed={collapsed}
                  toggle={toggle}
                >
                  <div className="flex flex-wrap gap-2">
                    {research.related_searches.map((query, i) => (
                      <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors cursor-default">
                        <Search className="w-3 h-3 text-slate-400" />
                        {query}
                      </span>
                    ))}
                  </div>
                </CollapsibleSection>
              </div>
            )}

            {/* ═══════════════════════════════════════════
                COMPETITIVE INTELLIGENCE
               ═══════════════════════════════════════════ */}
            {(research.competitors?.length > 0 || research.competitor_analysis?.length > 0) && (
              <>
                <SectionHeader icon={Users} title="Competitive Intelligence" source="DataForSEO Labs" />

                {/* SERP Competitors Table */}
                {research.competitors?.length > 0 && (
                  <div className="mb-6">
                    <CollapsibleSection
                      title="SERP Competitors"
                      icon={<BarChart3 className="w-4 h-4 text-amber-500" />}
                      badge={`${research.competitors.length} domains`}
                      badgeColor="bg-amber-50 text-amber-600"
                      defaultOpen={true}
                      id="competitors"
                      collapsed={collapsed}
                      toggle={toggle}
                    >
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-200">
                              <th className="text-left px-3 py-2.5 font-medium text-slate-500 text-xs uppercase tracking-wider">Domain</th>
                              <th className="text-left px-3 py-2.5 font-medium text-slate-500 text-xs uppercase tracking-wider">Avg Position</th>
                              <th className="text-left px-3 py-2.5 font-medium text-slate-500 text-xs uppercase tracking-wider">Est. Traffic</th>
                              <th className="text-left px-3 py-2.5 font-medium text-slate-500 text-xs uppercase tracking-wider">Keywords</th>
                            </tr>
                          </thead>
                          <tbody>
                            {research.competitors.map((comp, i) => (
                              <tr key={i} className={`border-b border-slate-100 ${i % 2 ? 'bg-slate-50/50' : ''}`}>
                                <td className="px-3 py-2.5 font-medium text-slate-700">{comp.domain}</td>
                                <td className="px-3 py-2.5">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                    (comp.avg_position || 99) <= 3 ? 'bg-emerald-50 text-emerald-700' :
                                    (comp.avg_position || 99) <= 10 ? 'bg-amber-50 text-amber-700' :
                                    'bg-slate-100 text-slate-600'
                                  }`}>
                                    #{comp.avg_position?.toFixed(1) ?? '—'}
                                  </span>
                                </td>
                                <td className="px-3 py-2.5 text-slate-600">{(comp.estimated_traffic || 0).toLocaleString()}</td>
                                <td className="px-3 py-2.5 text-slate-600">{(comp.relevant_keywords || 0).toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CollapsibleSection>
                  </div>
                )}

                {/* Competitor Content Analysis */}
                {research.competitor_analysis?.length > 0 && (
                  <div className="mb-6">
                    <CollapsibleSection
                      title="Competitor Content Analysis"
                      icon={<Eye className="w-4 h-4 text-amber-500" />}
                      badge="Gap analysis"
                      badgeColor="bg-amber-50 text-amber-600"
                      defaultOpen={true}
                      id="competitor-analysis"
                      collapsed={collapsed}
                      toggle={toggle}
                    >
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-200">
                              <th className="text-left px-3 py-2.5 font-medium text-slate-500 text-xs uppercase tracking-wider">Domain</th>
                              <th className="text-left px-3 py-2.5 font-medium text-slate-500 text-xs uppercase tracking-wider">What They Cover</th>
                              <th className="text-left px-3 py-2.5 font-medium text-slate-500 text-xs uppercase tracking-wider">What They Miss</th>
                            </tr>
                          </thead>
                          <tbody>
                            {research.competitor_analysis.map((comp, i) => (
                              <tr key={i} className={`border-b border-slate-100 ${i % 2 ? 'bg-slate-50/50' : ''}`}>
                                <td className="px-3 py-2.5 font-medium text-slate-700">{comp.domain}</td>
                                <td className="px-3 py-2.5 text-slate-600">{comp.what_they_cover}</td>
                                <td className="px-3 py-2.5 text-slate-600">{comp.what_they_miss}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CollapsibleSection>
                  </div>
                )}
              </>
            )}

            {/* ═══════════════════════════════════════════
                CONTENT STRATEGY
               ═══════════════════════════════════════════ */}
            {(research.content_gaps?.length > 0 || research.suggested_angles?.length > 0 || research.related_keywords?.length > 0) && (
              <>
                <SectionHeader icon={Lightbulb} title="Content Strategy" source="Claude Analysis" />

                {/* Content gaps */}
                {research.content_gaps?.length > 0 && (
                  <div className="mb-6">
                    <CollapsibleSection
                      title="Content Gaps (Our Advantage)"
                      icon={<AlertTriangle className="w-4 h-4 text-emerald-500" />}
                      badge={`${research.content_gaps.length} gaps`}
                      badgeColor="bg-emerald-50 text-emerald-600"
                      defaultOpen={true}
                      id="content-gaps"
                      collapsed={collapsed}
                      toggle={toggle}
                    >
                      <ol className="space-y-2">
                        {research.content_gaps.map((gap, i) => (
                          <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                            <span className="flex-shrink-0 w-5 h-5 bg-emerald-100 text-emerald-600 rounded flex items-center justify-center text-[10px] font-bold mt-0.5">
                              {i + 1}
                            </span>
                            {gap}
                          </li>
                        ))}
                      </ol>
                    </CollapsibleSection>
                  </div>
                )}

                {/* Suggested angles */}
                {research.suggested_angles?.length > 0 && (
                  <div className="mb-6">
                    <CollapsibleSection
                      title="Suggested Angles"
                      icon={<Lightbulb className="w-4 h-4 text-violet-500" />}
                      badge={`${research.suggested_angles.length} angles`}
                      badgeColor="bg-violet-50 text-violet-600"
                      defaultOpen={true}
                      id="suggested-angles"
                      collapsed={collapsed}
                      toggle={toggle}
                    >
                      <ul className="space-y-2">
                        {research.suggested_angles.map((angle, i) => (
                          <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                            <span className="text-violet-500 mt-0.5 font-bold">→</span>
                            {angle}
                          </li>
                        ))}
                      </ul>
                    </CollapsibleSection>
                  </div>
                )}

                {/* Related Keywords Table */}
                {research.related_keywords?.length > 0 && (
                  <div className="mb-6">
                    <CollapsibleSection
                      title="Related Keywords"
                      icon={<Search className="w-4 h-4 text-indigo-500" />}
                      badge={`${research.related_keywords.length} keywords`}
                      badgeColor="bg-indigo-50 text-indigo-600"
                      defaultOpen={true}
                      id="related-kw"
                      collapsed={collapsed}
                      toggle={toggle}
                    >
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-200">
                              {[
                                { key: 'keyword', label: 'Keyword' },
                                { key: 'search_volume', label: 'Volume' },
                                { key: 'keyword_difficulty', label: 'Difficulty' },
                                { key: 'cpc', label: 'CPC' },
                                { key: 'competition_level', label: 'Competition' },
                              ].map((col) => (
                                <th
                                  key={col.key}
                                  className="text-left px-3 py-2.5 font-medium text-slate-500 text-xs uppercase tracking-wider cursor-pointer hover:text-slate-700 select-none"
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
                                <tr key={i} className={`border-b border-slate-100 ${i % 2 ? 'bg-slate-50/50' : ''}`}>
                                  <td className="px-3 py-2.5 font-medium text-slate-700">{kw.keyword}</td>
                                  <td className="px-3 py-2.5 text-slate-600">{(kw.search_volume || 0).toLocaleString()}</td>
                                  <td className="px-3 py-2.5">
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
                                  <td className="px-3 py-2.5 text-slate-600">${(kw.cpc || 0).toFixed(2)}</td>
                                  <td className="px-3 py-2.5 text-slate-600 capitalize">{kw.competition_level || kw.competition || '—'}</td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </CollapsibleSection>
                  </div>
                )}

                {/* Related High Volume Keywords */}
                {research.related_high_volume_keywords?.length > 0 && (
                  <div className="mb-6">
                    <CollapsibleSection
                      title="High Volume Related Keywords"
                      icon={<TrendingUp className="w-4 h-4 text-emerald-500" />}
                      badge="Opportunity"
                      badgeColor="bg-emerald-50 text-emerald-600"
                      defaultOpen={true}
                      id="high-vol-kw"
                      collapsed={collapsed}
                      toggle={toggle}
                    >
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium mb-3">
                        Keywords with significant search volume related to this topic
                      </p>
                      <div className="space-y-2">
                        {research.related_high_volume_keywords.map((kw, i) => (
                          <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-emerald-50/50 border border-emerald-100">
                            <span className="text-sm font-medium text-slate-800">{kw.keyword}</span>
                            <div className="flex items-center gap-4 text-xs">
                              <span className="font-semibold text-emerald-700">{(kw.search_volume || 0).toLocaleString()}/mo</span>
                              {kw.cpc && <span className="text-slate-500">${kw.cpc.toFixed(2)} CPC</span>}
                              {kw.competition && (
                                <span className="text-slate-400 capitalize">{kw.competition}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CollapsibleSection>
                  </div>
                )}
              </>
            )}

            {/* ═══════════════════════════════════════════
                SEO BRIEF & AI SEARCH
               ═══════════════════════════════════════════ */}

            {/* AI Search Presence */}
            {research.ai_search_presence && (
              <div className="mb-6">
                <SectionHeader icon={Bot} title="AI Search Presence" source="DataForSEO AI Optimization" />
                <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
                  {research.ai_search_presence.summary && (
                    <p className="text-sm text-slate-700">{research.ai_search_presence.summary}</p>
                  )}
                  {research.ai_search_presence.ai_search_volume != null && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-500">AI Search Volume:</span>
                      <span className="text-sm font-semibold text-slate-800">{research.ai_search_presence.ai_search_volume.toLocaleString()}/mo</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      research.ai_search_presence.mentions_our_site
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}>
                      {research.ai_search_presence.mentions_our_site ? 'Our site mentioned in AI answers' : 'Our site NOT mentioned in AI answers'}
                    </span>
                  </div>
                  {research.ai_search_presence.top_mentioned_domains?.length > 0 && (
                    <div>
                      <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">Top domains mentioned by AI</p>
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

            {/* SEO Research Brief */}
            {research.full_brief && (
              <div className="mb-6">
                <CollapsibleSection
                  title="SEO Research Brief"
                  icon={<FileText className="w-4 h-4 text-slate-500" />}
                  badge="Full brief"
                  badgeColor="bg-slate-100 text-slate-600"
                  defaultOpen={false}
                  id="seo-brief"
                  collapsed={collapsed}
                  toggle={toggle}
                >
                  <div className="prose prose-sm prose-slate max-w-none">
                    <MarkdownRenderer text={research.full_brief} />
                  </div>
                </CollapsibleSection>
              </div>
            )}

            {/* SERP Overview (legacy format support) */}
            {research.serp_overview && (
              <div className="mb-6">
                <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">SERP Overview</p>
                  <p className="text-sm text-slate-700">{research.serp_overview.top_results_summary}</p>
                  {research.serp_overview.content_types?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {research.serp_overview.content_types.map((type, i) => (
                        <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">{type}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════
                RAW DATA (collapsible)
               ═══════════════════════════════════════════ */}
            {Object.keys(research).length > 0 && (
              <div className="mb-8">
                <CollapsibleSection
                  title="Raw Research Data (JSON)"
                  icon={<Code className="w-4 h-4 text-slate-400" />}
                  badge="Debug"
                  badgeColor="bg-slate-100 text-slate-500"
                  defaultOpen={false}
                  id="raw-json"
                  collapsed={collapsed}
                  toggle={toggle}
                >
                  <pre className="text-[11px] text-slate-600 bg-slate-50 rounded-lg p-4 overflow-x-auto max-h-96 overflow-y-auto font-mono leading-relaxed">
                    {JSON.stringify(research, null, 2)}
                  </pre>
                </CollapsibleSection>
              </div>
            )}

            {/* DataForSEO attribution footer */}
            <div className="text-center py-6 border-t border-slate-200">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-medium">
                Keyword & SERP data powered by{' '}
                <a href="https://dataforseo.com" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-600">
                  DataForSEO
                </a>
                {' '}| Analysis by Claude
              </p>
            </div>
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

          {/* Quick Metrics */}
          <div className="space-y-2">
            <Label className="text-xs text-slate-500 uppercase tracking-wider">
              Quick Metrics
            </Label>
            <div className="text-xs space-y-1.5 text-slate-600">
              <div className="flex justify-between">
                <span>Volume</span>
                <span className="font-semibold text-slate-800">{(topic.search_volume || 0).toLocaleString()}/mo</span>
              </div>
              <div className="flex justify-between">
                <span>Difficulty</span>
                <span className="font-semibold text-slate-800">{topic.keyword_difficulty || 'N/A'}/100</span>
              </div>
              <div className="flex justify-between">
                <span>CPC</span>
                <span className="font-semibold text-slate-800">${Number(topic.cpc || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Competition</span>
                <span className="font-semibold text-slate-800 capitalize">{topic.competition_level || 'N/A'}</span>
              </div>
              {research.serp_results?.length > 0 && (
                <div className="flex justify-between">
                  <span>SERP Results</span>
                  <span className="font-semibold text-slate-800">{research.serp_results.length} tracked</span>
                </div>
              )}
              {research.people_also_ask?.length > 0 && (
                <div className="flex justify-between">
                  <span>PAA Questions</span>
                  <span className="font-semibold text-slate-800">{research.people_also_ask.length}</span>
                </div>
              )}
            </div>
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
          <Button onClick={handleSave} disabled={saving} className="w-full">
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </aside>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════════ */

function SectionHeader({ icon: Icon, title, source }) {
  return (
    <div className="flex items-center justify-between mb-4 mt-10 first:mt-0">
      <div className="flex items-center gap-2">
        <Icon className="w-5 h-5 text-slate-400" />
        <h2 className="text-base font-bold text-slate-800">{title}</h2>
      </div>
      {source && (
        <span className="text-[10px] font-medium text-slate-400 bg-slate-50 border border-slate-200 rounded px-2 py-0.5 uppercase tracking-wider">
          {source}
        </span>
      )}
    </div>
  );
}

function CollapsibleSection({ title, icon, badge, badgeColor, defaultOpen, id, collapsed, toggle, children }) {
  const isOpen = collapsed[id] !== undefined ? !collapsed[id] : defaultOpen;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <button
        onClick={() => toggle(id)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          {icon}
          <span className="text-sm font-semibold text-slate-700">{title}</span>
          {badge && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${badgeColor}`}>
              {badge}
            </span>
          )}
        </div>
        <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
      </button>
      {isOpen && (
        <div className="px-5 pb-5 border-t border-slate-100 pt-4">
          {children}
        </div>
      )}
    </div>
  );
}

function MetricCard({ icon, label, value, className = '' }) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-slate-400">{icon}</span>
        <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-sm font-semibold text-slate-800">{value}</div>
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

    if (line.startsWith('### ')) {
      elements.push(<h4 key={i} className="font-semibold text-slate-800 mt-4 mb-2">{line.slice(4)}</h4>);
    } else if (line.startsWith('## ')) {
      elements.push(<h3 key={i} className="font-semibold text-slate-800 text-lg mt-5 mb-2">{line.slice(3)}</h3>);
    } else if (line.startsWith('# ')) {
      elements.push(<h2 key={i} className="font-bold text-slate-900 text-xl mt-6 mb-3">{line.slice(2)}</h2>);
    } else if (line.match(/^\s*[-*]\s/)) {
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
    } else if (line.match(/^\s*\d+\.\s/)) {
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
    } else if (line.trim() === '') {
      // skip
    } else {
      elements.push(<p key={i} className="text-slate-700 my-2">{line}</p>);
    }

    i++;
  }

  return <>{elements}</>;
}
