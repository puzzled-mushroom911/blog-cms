const STATUS_STYLES = {
  published: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  scheduled: 'bg-blue-50 text-blue-700 border-blue-200',
  draft: 'bg-slate-50 text-slate-600 border-slate-200',
  'needs-review': 'bg-amber-50 text-amber-700 border-amber-200',
  researched: 'bg-violet-50 text-violet-700 border-violet-200',
  approved: 'bg-sky-50 text-sky-700 border-sky-200',
  discarded: 'bg-red-50 text-red-500 border-red-200',
  writing: 'bg-orange-50 text-orange-700 border-orange-200',
  written: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const STATUS_LABELS = {
  published: 'Published',
  scheduled: 'Scheduled',
  draft: 'Draft',
  'needs-review': 'Needs Review',
  researched: 'Researched',
  approved: 'Approved',
  discarded: 'Discarded',
  writing: 'Writing',
  written: 'Written',
};

export default function StatusBadge({ status, date }) {
  const isScheduled =
    status === 'published' && date && date > new Date().toISOString().split('T')[0];
  const displayStatus = isScheduled ? 'scheduled' : status;
  const style = STATUS_STYLES[displayStatus] || STATUS_STYLES.draft;
  const label = STATUS_LABELS[displayStatus] || displayStatus;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style}`}
    >
      {label}
    </span>
  );
}
