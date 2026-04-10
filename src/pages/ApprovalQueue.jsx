import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchApprovalQueue, batchApproveSeoPages, updateSeoPage } from '../lib/seoPages';
import StatusBadge from '../components/StatusBadge';
import { CheckCircle, XCircle, Clock, Loader2, Inbox, ChevronDown, ChevronRight } from 'lucide-react';

function groupByDate(pages) {
  const groups = {};
  const noDate = [];
  for (const page of pages) {
    if (page.scheduled_date) {
      const key = page.scheduled_date;
      if (!groups[key]) groups[key] = [];
      groups[key].push(page);
    } else {
      noDate.push(page);
    }
  }
  // Sort date keys chronologically
  const sorted = Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  if (noDate.length) sorted.push(['unscheduled', noDate]);
  return sorted;
}

function formatDateLabel(dateStr) {
  if (dateStr === 'unscheduled') return 'Unscheduled';
  const date = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.getTime() === today.getTime()) return 'Today';
  if (date.getTime() === tomorrow.getTime()) return 'Tomorrow';
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function isToday(dateStr) {
  if (dateStr === 'unscheduled') return false;
  const date = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date.getTime() === today.getTime();
}

export default function ApprovalQueue() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(new Set());
  const [approving, setApproving] = useState(false);
  const [collapsed, setCollapsed] = useState(new Set());

  useEffect(() => {
    loadQueue();
  }, []);

  async function loadQueue() {
    setLoading(true);
    try {
      const data = await fetchApprovalQueue();
      setPages(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function toggleSelect(id) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectGroup(groupPages) {
    setSelected(prev => {
      const next = new Set(prev);
      const allSelected = groupPages.every(p => next.has(p.id));
      if (allSelected) {
        groupPages.forEach(p => next.delete(p.id));
      } else {
        groupPages.forEach(p => next.add(p.id));
      }
      return next;
    });
  }

  function toggleCollapse(dateKey) {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(dateKey)) next.delete(dateKey);
      else next.add(dateKey);
      return next;
    });
  }

  async function handleBatchApprove() {
    if (selected.size === 0) return;
    setApproving(true);
    try {
      await batchApproveSeoPages([...selected]);
      setSelected(new Set());
      await loadQueue();
    } catch (err) {
      console.error(err);
    } finally {
      setApproving(false);
    }
  }

  async function handleReject(id) {
    try {
      await updateSeoPage(id, { status: 'draft' });
      await loadQueue();
    } catch (err) {
      console.error(err);
    }
  }

  const groups = groupByDate(pages);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Inbox className="w-5 h-5" />
            HITL Queue
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {pages.length} page{pages.length !== 1 ? 's' : ''} awaiting review
          </p>
        </div>
        {selected.size > 0 && (
          <button
            onClick={handleBatchApprove}
            disabled={approving}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50"
          >
            {approving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
            Approve {selected.size} selected
          </button>
        )}
      </div>

      {pages.length === 0 ? (
        <div className="text-center py-20">
          <CheckCircle className="w-10 h-10 text-emerald-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">All caught up! No pages need review.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map(([dateKey, groupPages]) => {
            const today = isToday(dateKey);
            const isCollapsed = collapsed.has(dateKey);
            const allSelected = groupPages.every(p => selected.has(p.id));

            return (
              <div key={dateKey} className={`rounded-xl border ${today ? 'border-blue-200 bg-blue-50/30' : 'border-slate-200 bg-white'}`}>
                {/* Group header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                  <button
                    onClick={() => toggleCollapse(dateKey)}
                    className="flex items-center gap-2 text-sm font-semibold text-slate-900"
                  >
                    {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    {formatDateLabel(dateKey)}
                    {today && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">Today</span>}
                    <span className="text-xs text-slate-400 font-normal ml-1">({groupPages.length})</span>
                  </button>
                  <button
                    onClick={() => selectGroup(groupPages)}
                    className={`text-xs px-2 py-1 rounded ${allSelected ? 'bg-emerald-100 text-emerald-700' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    {allSelected ? 'Deselect all' : 'Select all'}
                  </button>
                </div>

                {/* Group items */}
                {!isCollapsed && (
                  <div className="divide-y divide-slate-100">
                    {groupPages.map(page => (
                      <div key={page.id} className="flex items-center gap-3 px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.has(page.id)}
                          onChange={() => toggleSelect(page.id)}
                          className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <Link
                          to={`/seo-pages/${page.id}`}
                          className="flex-1 min-w-0 hover:text-blue-600 transition-colors"
                        >
                          <div className="text-sm font-medium text-slate-900 truncate">{page.title}</div>
                          <div className="text-xs text-slate-400 truncate">/{page.slug}</div>
                        </Link>
                        <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                          {page.page_type}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => batchApproveSeoPages([page.id]).then(loadQueue)}
                            className="p-1 text-emerald-500 hover:bg-emerald-50 rounded"
                            title="Approve"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleReject(page.id)}
                            className="p-1 text-red-400 hover:bg-red-50 rounded"
                            title="Reject (back to draft)"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
