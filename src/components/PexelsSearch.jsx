import { useState, useRef, useEffect } from 'react';
import { Search, Loader2, Camera } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

export default function PexelsSearch({ apiKey, onSelect, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);


  async function search(pageNum = 1) {
    if (!query.trim()) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(query.trim())}&per_page=12&page=${pageNum}&orientation=landscape`,
        { headers: { Authorization: apiKey } }
      );

      if (!res.ok) {
        if (res.status === 401) throw new Error('Invalid API key. Check your Pexels key in Settings.');
        throw new Error(`Pexels API error (${res.status})`);
      }

      const data = await res.json();
      setResults(data.photos || []);
      setTotalResults(data.total_results || 0);
      setPage(pageNum);
    } catch (err) {
      setError(err.message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    search(1);
  }

  function handleSelect(photo) {
    onSelect(photo.src.large2x);
    onClose();
  }

  const hasMore = page * 12 < totalResults;
  const hasPrev = page > 1;

  return (
    <Dialog open={true} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col overflow-hidden p-0">
        {/* Header */}
        <DialogHeader className="px-5 pt-5 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-slate-400" />
            Search Pexels
          </DialogTitle>
        </DialogHeader>

        {/* Search bar */}
        <form onSubmit={handleSubmit} className="px-5 py-3 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search free stock photos..."
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-colors"
            />
          </div>
        </form>

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {error && (
            <p className="text-sm text-red-600 text-center py-4">{error}</p>
          )}

          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
            </div>
          )}

          {!loading && results.length === 0 && !error && (
            <p className="text-sm text-slate-400 text-center py-12">
              {query ? 'No results found. Try a different search.' : 'Search for photos above.'}
            </p>
          )}

          {!loading && results.length > 0 && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {results.map((photo) => (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => handleSelect(photo)}
                    className="group relative aspect-[3/2] rounded-lg overflow-hidden border border-slate-200 hover:border-blue-400 hover:ring-2 hover:ring-blue-200 transition-all"
                  >
                    <img
                      src={photo.src.medium}
                      alt={photo.alt || 'Pexels photo'}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-end">
                      <span className="text-[10px] text-white px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity truncate w-full">
                        {photo.photographer}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                <span className="text-xs text-slate-400">
                  {totalResults.toLocaleString()} results
                </span>
                <div className="flex gap-2">
                  {hasPrev && (
                    <button
                      type="button"
                      onClick={() => search(page - 1)}
                      className="px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      Previous
                    </button>
                  )}
                  {hasMore && (
                    <button
                      type="button"
                      onClick={() => search(page + 1)}
                      className="px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      Next
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer attribution */}
        <div className="px-5 py-3 border-t border-slate-100 text-center">
          <span className="text-[10px] text-slate-400">
            Photos provided by{' '}
            <a href="https://www.pexels.com" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-slate-700 underline">
              Pexels
            </a>
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
