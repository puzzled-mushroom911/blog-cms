import { Link } from 'react-router-dom';
import { Calendar, Clock, Pencil, ExternalLink } from 'lucide-react';
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

export default function PostCard({ post }) {
  const words = wordCount(post.content);
  const config = getConfig();

  return (
    <div className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all">
      <div className="flex items-start gap-4 p-4">
        {/* Thumbnail */}
        {post.image && (
          <img
            src={post.image}
            alt=""
            className="w-20 h-14 object-cover rounded-lg flex-shrink-0 bg-slate-100"
          />
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <StatusBadge status={post.status} date={post.date} />
            <span className="text-xs text-slate-400">{post.category}</span>
          </div>
          <h3 className="text-sm font-semibold text-slate-800 truncate">
            {post.title}
          </h3>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(post.date)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {post.read_time}
            </span>
            <span>{words.toLocaleString()} words</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <Link
            to={`/posts/${post.id}`}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Edit"
          >
            <Pencil className="w-4 h-4" />
          </Link>
          <a
            href={`${config.siteUrl}${config.blogPathPrefix}/${post.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="View on site"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
