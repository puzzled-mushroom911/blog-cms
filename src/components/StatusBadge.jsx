const STATUS_STYLES = {
  published: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  draft: 'bg-slate-50 text-slate-600 border-slate-200',
  'needs-review': 'bg-amber-50 text-amber-700 border-amber-200',
};

const STATUS_LABELS = {
  published: 'Published',
  draft: 'Draft',
  'needs-review': 'Needs Review',
};

export default function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.draft;
  const label = STATUS_LABELS[status] || status;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style}`}
    >
      {label}
    </span>
  );
}
