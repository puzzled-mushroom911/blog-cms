import { Link } from 'react-router-dom';

const STATUS_DOT = {
  draft: 'bg-slate-300',
  'needs-review': 'bg-amber-400',
  published: 'bg-emerald-500',
};

const TYPE_BG = {
  blog: 'bg-blue-50 text-blue-700 border-blue-200',
  seo: 'bg-violet-50 text-violet-700 border-violet-200',
};

function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function getFirstDayOfWeek(year, month) {
  return new Date(year, month - 1, 1).getDay();
}

export default function CalendarGrid({ year, month, items }) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month;
  const todayDate = today.getDate();

  // Group items by day
  const itemsByDay = {};
  for (const item of items) {
    const day = parseInt(item.date.split('-')[2], 10);
    if (!itemsByDay[day]) itemsByDay[day] = [];
    itemsByDay[day].push(item);
  }

  const cells = [];
  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) {
    cells.push(<div key={`empty-${i}`} className="h-28 bg-slate-50/50 border-b border-r border-slate-100" />);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const isToday = isCurrentMonth && day === todayDate;
    const dayItems = itemsByDay[day] || [];

    cells.push(
      <div
        key={day}
        className={`h-28 border-b border-r border-slate-100 p-1.5 overflow-hidden ${
          isToday ? 'bg-blue-50/50' : 'bg-white'
        }`}
      >
        <div className={`text-xs font-medium mb-1 ${isToday ? 'text-blue-600' : 'text-slate-400'}`}>
          {isToday ? (
            <span className="bg-blue-600 text-white w-5 h-5 rounded-full inline-flex items-center justify-center text-[10px]">
              {day}
            </span>
          ) : (
            day
          )}
        </div>
        <div className="space-y-0.5">
          {dayItems.slice(0, 3).map(item => {
            const linkTo = item.content_type === 'blog' ? `/posts/${item.id}` : `/seo-pages/${item.id}`;
            const typeBg = TYPE_BG[item.content_type] || TYPE_BG.seo;
            const dotColor = STATUS_DOT[item.status] || STATUS_DOT.draft;
            return (
              <Link
                key={item.id}
                to={linkTo}
                className={`block text-[10px] leading-tight px-1.5 py-0.5 rounded border truncate hover:opacity-80 ${typeBg}`}
                title={item.title}
              >
                <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${dotColor}`} />
                {item.title}
              </Link>
            );
          })}
          {dayItems.length > 3 && (
            <div className="text-[10px] text-slate-400 pl-1">+{dayItems.length - 3} more</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-l border-slate-100 rounded-xl overflow-hidden bg-white">
      {/* Day headers */}
      <div className="grid grid-cols-7">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="text-center text-xs font-medium text-slate-500 py-2 border-b border-r border-slate-100 bg-slate-50">
            {d}
          </div>
        ))}
      </div>
      {/* Day cells */}
      <div className="grid grid-cols-7">{cells}</div>
    </div>
  );
}
