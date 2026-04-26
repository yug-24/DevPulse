import { useMemo } from 'react';
import { cn } from '../../utils/helpers';

const LEVEL_CLASSES = [
  'contrib-0',
  'contrib-1',
  'contrib-2',
  'contrib-3',
  'contrib-4',
];

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS   = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

const ContribHeatmap = ({ days = [], totalContributions = 0, loading = false }) => {
  // Group days into weeks (columns of 7)
  const weeks = useMemo(() => {
    if (!days.length) return [];
    const result = [];
    for (let i = 0; i < days.length; i += 7) {
      result.push(days.slice(i, i + 7));
    }
    return result;
  }, [days]);

  // Build month labels from the first day of each month in the data
  const monthLabels = useMemo(() => {
    const labels = [];
    let lastMonth = -1;
    weeks.forEach((week, wi) => {
      const firstDay = week[0];
      if (!firstDay) return;
      const month = new Date(firstDay.date).getMonth();
      if (month !== lastMonth) {
        labels.push({ month: MONTHS[month], weekIndex: wi });
        lastMonth = month;
      }
    });
    return labels;
  }, [weeks]);

  if (loading) {
    return (
      <div className="card p-5">
        <div className="skeleton h-4 w-48 rounded mb-4" />
        <div className="flex gap-1 flex-wrap">
          {Array.from({ length: 364 }).map((_, i) => (
            <div key={i} className="w-3 h-3 rounded-sm skeleton" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="card p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gh-text">
          {totalContributions.toLocaleString()} contributions in the last year
        </h2>
        {/* Legend */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-gh-muted">
          <span>Less</span>
          {[0,1,2,3,4].map((l) => (
            <div key={l} className={cn('w-3 h-3 rounded-sm', LEVEL_CLASSES[l])} />
          ))}
          <span>More</span>
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="min-w-[680px]">
          {/* Month labels */}
          <div className="flex gap-1 mb-1 ml-8">
            {weeks.map((_, wi) => {
              const label = monthLabels.find((m) => m.weekIndex === wi);
              return (
                <div key={wi} className="w-3 text-xs text-gh-muted shrink-0">
                  {label ? label.month : ''}
                </div>
              );
            })}
          </div>

          {/* Day labels + grid */}
          <div className="flex gap-1">
            {/* Day of week labels */}
            <div className="flex flex-col gap-1 mr-1">
              {DAYS.map((d, i) => (
                <div key={i} className="h-3 text-xs text-gh-muted flex items-center">
                  {d}
                </div>
              ))}
            </div>

            {/* Weeks */}
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1">
                {week.map((day, di) => (
                  <div
                    key={di}
                    className={cn(
                      'w-3 h-3 rounded-sm cursor-pointer transition-opacity hover:opacity-80',
                      LEVEL_CLASSES[day.level ?? 0]
                    )}
                    title={
                      day.date
                        ? `${day.count} contribution${day.count !== 1 ? 's' : ''} on ${day.date}`
                        : ''
                    }
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContribHeatmap;
