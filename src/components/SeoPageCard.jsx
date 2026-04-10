import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import { Globe, Calendar, ArrowRight } from 'lucide-react';

const PAGE_TYPE_LABELS = {
  'moving-from': 'Moving From',
  'compare': 'Compare',
  'zip-code': 'Zip Code',
  'neighborhood': 'Neighborhood',
  'schools': 'Schools',
};

const PAGE_TYPE_COLORS = {
  'moving-from': 'bg-blue-50 text-blue-700',
  'compare': 'bg-purple-50 text-purple-700',
  'zip-code': 'bg-amber-50 text-amber-700',
  'neighborhood': 'bg-emerald-50 text-emerald-700',
  'schools': 'bg-rose-50 text-rose-700',
};

export default function SeoPageCard({ page }) {
  const typeLabel = PAGE_TYPE_LABELS[page.page_type] || page.page_type;
  const typeColor = PAGE_TYPE_COLORS[page.page_type] || 'bg-slate-50 text-slate-700';

  return (
    <Link
      to={`/seo-pages/${page.id}`}
      className="block bg-white border border-slate-200 rounded-xl p-4 hover:border-slate-300 hover:shadow-sm transition-all group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeColor}`}>
              {typeLabel}
            </span>
            <StatusBadge status={page.status} />
          </div>
          <h3 className="font-medium text-slate-900 text-sm truncate group-hover:text-blue-600 transition-colors">
            {page.title}
          </h3>
          {page.meta_description && (
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{page.meta_description}</p>
          )}
          <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Globe className="w-3 h-3" />
              /{page.slug}
            </span>
            {page.scheduled_date && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(page.scheduled_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            )}
          </div>
        </div>
        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors flex-shrink-0 mt-1" />
      </div>
    </Link>
  );
}
