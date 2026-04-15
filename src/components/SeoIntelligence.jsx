import { useState, useEffect } from 'react';
import { useSupabase } from '../hooks/useSupabase';
import { Sparkles, Loader2, TrendingUp, Search, HelpCircle, LayoutGrid, AlertTriangle } from 'lucide-react';

function formatCpc(value) {
  if (value == null) return '--';
  return `$${Number(value).toFixed(2)}`;
}

function difficultyColor(kd) {
  if (kd == null) return 'text-slate-700';
  if (kd < 30) return 'text-emerald-600';
  if (kd <= 60) return 'text-amber-600';
  return 'text-red-600';
}

function competitionBadge(level) {
  if (!level) return null;
  const colors = {
    low: 'bg-emerald-50 text-emerald-700',
    medium: 'bg-amber-50 text-amber-700',
    high: 'bg-red-50 text-red-700',
  };
  return (
    <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${colors[level] || 'bg-slate-100 text-slate-600'}`}>
      {level.charAt(0).toUpperCase() + level.slice(1)} competition
    </span>
  );
}

function toTitleCase(str) {
  return str
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function SeoIntelligence({ postId, aiReasoning }) {
  const supabase = useSupabase();
  const [topic, setTopic] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!postId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchTopic() {
      setLoading(true);
      const { data, error } = await supabase
        .from('blog_topics')
        .select('*')
        .eq('blog_post_id', postId)
        .maybeSingle();

      if (!cancelled) {
        setTopic(error ? null : data);
        setLoading(false);
      }
    }

    fetchTopic();
    return () => { cancelled = true; };
  }, [postId, supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
      </div>
    );
  }

  const rd = topic?.research_data || {};
  const hasAnyData = aiReasoning || topic;

  if (!hasAnyData) {
    return (
      <div className="px-5 py-8 text-center">
        <p className="text-sm text-slate-400">No SEO research data linked to this post.</p>
        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
          Research data appears when posts are created from the content pipeline or via Claude Code with DataForSEO.
        </p>
      </div>
    );
  }

  const relatedKeywords = (rd.related_keywords || []).slice(0, 8);
  const peopleAlsoAsk = rd.people_also_ask || [];
  const serpFeatures = rd.serp_features || [];
  const contentGaps = rd.content_gaps || [];

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-5 space-y-0">
        {/* AI Reasoning */}
        {aiReasoning && (
          <>
            <div>
              <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-1.5 mb-3">
                <Sparkles className="w-4 h-4" />
                AI Reasoning
              </h4>
              <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                {aiReasoning}
              </div>
            </div>
            {topic && <div className="border-t border-slate-100 my-4" />}
          </>
        )}

        {/* Keyword Data */}
        {topic && (
          <>
            <div>
              <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-1.5 mb-3">
                <TrendingUp className="w-4 h-4" />
                Keyword Data
              </h4>
              {topic.primary_keyword && (
                <p className="text-xs text-slate-500 mb-3 font-mono">
                  {topic.primary_keyword}
                </p>
              )}
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <p className="text-lg font-semibold text-slate-800">
                    {topic.search_volume != null ? topic.search_volume.toLocaleString() : '--'}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">Volume</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <p className={`text-lg font-semibold ${difficultyColor(topic.keyword_difficulty)}`}>
                    {topic.keyword_difficulty != null ? topic.keyword_difficulty : '--'}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">Difficulty</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <p className="text-lg font-semibold text-slate-800">
                    {formatCpc(topic.cpc)}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">CPC</p>
                </div>
              </div>
              {topic.competition_level && competitionBadge(topic.competition_level)}
            </div>

            {/* Related Keywords */}
            {relatedKeywords.length > 0 && (
              <>
                <div className="border-t border-slate-100 my-4" />
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-1.5 mb-3">
                    <Search className="w-4 h-4" />
                    Related Keywords
                  </h4>
                  <div className="space-y-1.5">
                    {relatedKeywords.map((kw, i) => (
                      <div key={i} className="flex items-center justify-between text-sm py-1">
                        <span className="text-slate-700 truncate mr-2">{kw.keyword}</span>
                        <span className="flex items-center gap-2 text-slate-400 text-xs flex-shrink-0">
                          {kw.search_volume != null && (
                            <span>{kw.search_volume.toLocaleString()}/mo</span>
                          )}
                          {kw.keyword_difficulty != null && (
                            <span className={difficultyColor(kw.keyword_difficulty)}>
                              KD {kw.keyword_difficulty}
                            </span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* People Also Ask */}
            {peopleAlsoAsk.length > 0 && (
              <>
                <div className="border-t border-slate-100 my-4" />
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-1.5 mb-3">
                    <HelpCircle className="w-4 h-4" />
                    People Also Ask
                  </h4>
                  <div className="space-y-2">
                    {peopleAlsoAsk.map((question, i) => (
                      <div key={i} className="bg-slate-50 rounded px-3 py-2 text-sm text-slate-600">
                        {question}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* SERP Features */}
            {serpFeatures.length > 0 && (
              <>
                <div className="border-t border-slate-100 my-4" />
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-1.5 mb-3">
                    <LayoutGrid className="w-4 h-4" />
                    SERP Features
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {serpFeatures.map((feature, i) => (
                      <span
                        key={i}
                        className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-full"
                      >
                        {toTitleCase(feature)}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Content Gaps */}
            {contentGaps.length > 0 && (
              <>
                <div className="border-t border-slate-100 my-4" />
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-1.5 mb-3">
                    <AlertTriangle className="w-4 h-4" />
                    Content Gaps
                  </h4>
                  <ul className="space-y-1.5">
                    {contentGaps.map((gap, i) => (
                      <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                        <span className="text-slate-400 mt-1 flex-shrink-0">&bull;</span>
                        <span>{gap}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
