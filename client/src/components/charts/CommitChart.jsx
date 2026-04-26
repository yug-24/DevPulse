import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts';
import { cn } from '../../utils/helpers';

// ── Custom tooltip ────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gh-surface border border-gh-border rounded-lg px-3 py-2 shadow-xl text-xs">
      <p className="text-gh-muted mb-1">{label}</p>
      <p className="text-gh-text font-semibold">
        {payload[0].value} commit{payload[0].value !== 1 ? 's' : ''}
      </p>
    </div>
  );
};

// ── 30-day daily bar chart ────────────────────────────────────
export const DailyCommitChart = ({ daily = [], loading = false }) => {
  if (loading) {
    return (
      <div className="card p-5">
        <div className="skeleton h-4 w-48 rounded mb-4" />
        <div className="skeleton h-32 w-full rounded" />
      </div>
    );
  }

  // Show only every 5th label to avoid crowding
  const tickFormatter = (date, i) =>
    i % 5 === 0
      ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : '';

  const maxVal = Math.max(...daily.map((d) => d.count), 1);

  return (
    <div className="card p-5">
      <h2 className="text-sm font-semibold text-gh-text mb-4">
        Commits — last 30 days
      </h2>
      {daily.every((d) => d.count === 0) ? (
        <div className="h-32 flex items-center justify-center">
          <p className="text-sm text-gh-muted">No commits in the last 30 days</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={daily} barSize={8} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#30363d" strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={tickFormatter}
              tick={{ fontSize: 10, fill: '#7d8590' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 10, fill: '#7d8590' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
            <Bar dataKey="count" radius={[3, 3, 0, 0]}>
              {daily.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.count === 0 ? '#21262d' : entry.count >= maxVal * 0.7 ? '#39d353' : '#26a641'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

// ── Weekday distribution ──────────────────────────────────────
export const WeekdayChart = ({ weekday = [], peakDay = '', loading = false }) => {
  if (loading) {
    return (
      <div className="card p-5">
        <div className="skeleton h-4 w-40 rounded mb-4" />
        <div className="skeleton h-24 w-full rounded" />
      </div>
    );
  }

  const max = Math.max(...weekday.map((d) => d.count), 1);

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gh-text">By day of week</h2>
        {peakDay && (
          <span className="badge-green text-xs">
            Peak: {peakDay}
          </span>
        )}
      </div>
      <div className="flex items-end gap-2 h-20">
        {weekday.map(({ day, count }) => {
          const heightPct = max > 0 ? (count / max) * 100 : 0;
          const isPeak    = day === peakDay;
          return (
            <div key={day} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex items-end justify-center" style={{ height: '60px' }}>
                <div
                  className={cn(
                    'w-full rounded-t-sm transition-all duration-500',
                    isPeak ? 'bg-brand-400' : 'bg-gh-border'
                  )}
                  style={{ height: `${Math.max(heightPct, 4)}%` }}
                  title={`${count} commits on ${day}s`}
                />
              </div>
              <span className={cn(
                'text-xs',
                isPeak ? 'text-brand-400 font-medium' : 'text-gh-muted'
              )}>
                {day}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Hourly heatmap row ────────────────────────────────────────
export const HourlyChart = ({ hourly = [], peakHour = '', loading = false }) => {
  if (loading) {
    return (
      <div className="card p-5">
        <div className="skeleton h-4 w-40 rounded mb-4" />
        <div className="skeleton h-10 w-full rounded" />
      </div>
    );
  }

  const max = Math.max(...hourly.map((h) => h.count), 1);

  const getColor = (count) => {
    const ratio = count / max;
    if (ratio === 0)    return '#161b22';
    if (ratio < 0.25)   return '#0e4429';
    if (ratio < 0.5)    return '#006d32';
    if (ratio < 0.75)   return '#26a641';
    return '#39d353';
  };

  const showLabel = (h) => h % 6 === 0;

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gh-text">Commit time of day</h2>
        {peakHour && (
          <span className="badge-green text-xs">Peak: {peakHour}</span>
        )}
      </div>
      <div className="flex gap-1 items-end">
        {hourly.map(({ hour, label, count }) => (
          <div key={hour} className="flex flex-col items-center gap-1 flex-1">
            <div
              className="w-full rounded-sm transition-all duration-500"
              style={{
                height:          '28px',
                backgroundColor: getColor(count),
              }}
              title={`${count} commits at ${label}`}
            />
            <span className="text-gh-muted" style={{ fontSize: '9px' }}>
              {showLabel(hour) ? label : ''}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DailyCommitChart;
