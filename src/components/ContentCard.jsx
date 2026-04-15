import { Link } from 'react-router-dom';
import { Calendar, Clock, Pencil, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import StatusBadge from './StatusBadge';
import { getConfig } from '../config';

/**
 * Estimates total word count across all block types in a post's content array.
 */
function wordCount(content) {
  if (!content || !Array.isArray(content)) return 0;
  let words = 0;
  for (const block of content) {
    if (block.text) words += block.text.split(/\s+/).filter(Boolean).length;
    if (block.items)
      for (const item of block.items) {
        const str = typeof item === 'string' ? item : (item.text || '');
        words += str.split(/\s+/).filter(Boolean).length;
      }
    if (block.pros)
      for (const item of block.pros) {
        const str = typeof item === 'string' ? item : (item.text || '');
        words += str.split(/\s+/).filter(Boolean).length;
      }
    if (block.cons)
      for (const item of block.cons) {
        const str = typeof item === 'string' ? item : (item.text || '');
        words += str.split(/\s+/).filter(Boolean).length;
      }
    if (block.steps)
      for (const step of block.steps) {
        words += (step.title || '').split(/\s+/).filter(Boolean).length;
        words += (step.text || '').split(/\s+/).filter(Boolean).length;
      }
    if (block.content)
      words += block.content.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length;
  }
  return words;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Unified content card for both blog posts and SEO pages.
 * Receives a normalized item prop with a `type` field ('blog' | 'seo').
 */
export default function ContentCard({ item }) {
  const config = getConfig();
  const { pageTypes } = config;
  const isBlog = item.type === 'blog';

  // Word count for blog posts
  const words = isBlog ? wordCount(item.content) : 0;

  // SEO page type label
  const typeConfig = !isBlog ? pageTypes.find((t) => t.value === item.page_type) : null;
  const pageTypeLabel = typeConfig?.label || item.page_type;

  // SEO indicator dot based on keyword data
  const seoIndicator = getSeoIndicator(item);

  // Build the public URL
  const publicUrl = isBlog
    ? `${config.siteUrl}${config.blogPathPrefix}/${item.slug}`
    : `${config.siteUrl}/${item.slug}`;

  // Edit route
  const editRoute = isBlog ? `/posts/${item.id}` : `/seo-pages/${item.id}`;

  return (
    <Card className="hover:border-slate-300 hover:shadow-sm transition-all py-0">
      <CardContent className="p-4 flex items-start gap-4">
        {/* Thumbnail (blog posts only) */}
        {isBlog && item.image && (
          <img
            src={item.image}
            alt=""
            className="w-20 h-14 object-cover rounded-lg flex-shrink-0 bg-slate-100"
          />
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {/* Type badge */}
            {isBlog ? (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full border bg-blue-50 text-blue-700 border-blue-200">
                Blog
              </span>
            ) : (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full border bg-violet-50 text-violet-700 border-violet-200">
                SEO Page
              </span>
            )}
            <StatusBadge status={item.status} date={item.date} />
            {seoIndicator && (
              <span
                className={`w-2 h-2 rounded-full flex-shrink-0 ${seoIndicator}`}
                title={seoIndicatorTitle(item)}
              />
            )}
            {isBlog && item.category && (
              <span className="text-xs text-slate-400">{item.category}</span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-sm font-semibold text-slate-800 truncate">
            <Link to={editRoute} className="hover:text-blue-600 transition-colors">
              {item.title}
            </Link>
          </h3>

          {/* Metadata row */}
          <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
            {item.date && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(item.date)}
              </span>
            )}
            {isBlog && item.read_time && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {item.read_time}
              </span>
            )}
            {isBlog && words > 0 && (
              <span>{words.toLocaleString()} words</span>
            )}
            {!isBlog && pageTypeLabel && (
              <span>{pageTypeLabel}</span>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <Link
            to={editRoute}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Edit"
          >
            <Pencil className="w-4 h-4" />
          </Link>
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="View on site"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Returns a Tailwind bg class for the SEO indicator dot, or null if no data.
 * Green: KD < 30 AND volume > 500
 * Yellow: KD 30-60 OR volume 200-500
 */
function getSeoIndicator(item) {
  const kd = item.keyword_difficulty;
  const vol = item.search_volume;
  if (kd == null && vol == null) return null;

  const kdNum = kd != null ? Number(kd) : null;
  const volNum = vol != null ? Number(vol) : null;

  // Green: easy keyword with high volume
  if (kdNum != null && kdNum < 30 && volNum != null && volNum > 500) {
    return 'bg-emerald-400';
  }

  // Yellow: moderate difficulty or moderate volume
  if (
    (kdNum != null && kdNum >= 30 && kdNum <= 60) ||
    (volNum != null && volNum >= 200 && volNum <= 500)
  ) {
    return 'bg-amber-400';
  }

  return null;
}

function seoIndicatorTitle(item) {
  const parts = [];
  if (item.keyword_difficulty != null) parts.push(`KD: ${item.keyword_difficulty}`);
  if (item.search_volume != null) parts.push(`Vol: ${item.search_volume}`);
  return parts.join(' | ') || '';
}
