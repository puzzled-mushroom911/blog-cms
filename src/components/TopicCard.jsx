import { Link } from 'react-router-dom';
import { Search, TrendingUp, Target, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import StatusBadge from './StatusBadge';

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function difficultyColor(difficulty) {
  if (difficulty < 30) return 'bg-emerald-50 text-emerald-700';
  if (difficulty <= 60) return 'bg-amber-50 text-amber-700';
  return 'bg-red-50 text-red-700';
}

export default function TopicCard({ topic, onApprove, onResearch, onDiscard }) {
  return (
    <Card className="hover:border-slate-300 hover:shadow-sm transition-all py-0">
      <CardContent className="p-4 flex items-start gap-4">
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <StatusBadge status={topic.status} />
            <span className="text-xs text-slate-400">{topic.competition_level}</span>
          </div>
          <Link
            to={`/topics/${topic.id}`}
            className="text-sm font-semibold text-slate-800 truncate block hover:text-blue-600 transition-colors"
          >
            {topic.title}
          </Link>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
            <span className="flex items-center gap-1" title="Primary keyword">
              <Search className="w-3 h-3" />
              {topic.primary_keyword}
            </span>
            <span className="flex items-center gap-1" title="Monthly search volume">
              <TrendingUp className="w-3 h-3" />
              {topic.search_volume?.toLocaleString() || 0}/mo
            </span>
            <span
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${difficultyColor(topic.keyword_difficulty)}`}
              title="Keyword difficulty"
            >
              <Target className="w-3 h-3" />
              KD {topic.keyword_difficulty}
            </span>
            <span className="flex items-center gap-1" title="Added">
              {formatDate(topic.created_at)}
            </span>
          </div>
        </div>

        {/* Quick actions for 'idea' status — approve for research */}
        {topic.status === 'idea' && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); onResearch?.(topic.id); }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-50 text-violet-700 hover:bg-violet-100 transition-colors"
            >
              Research
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDiscard(topic.id); }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
            >
              Discard
            </button>
          </div>
        )}

        {/* Quick actions for 'researched' status — approve for writing */}
        {topic.status === 'researched' && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); onApprove(topic.id); }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-sky-50 text-sky-700 hover:bg-sky-100 transition-colors"
            >
              Approve
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDiscard(topic.id); }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
            >
              Discard
            </button>
          </div>
        )}

        {/* View button for other statuses */}
        {topic.status !== 'researched' && topic.status !== 'idea' && (
          <Link
            to={`/topics/${topic.id}`}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors flex-shrink-0"
            title="View details"
          >
            <Eye className="w-4 h-4" />
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
