import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { GitPullRequest, GitMerge, Clock, TrendingUp } from 'lucide-react';
import { cn } from '../../utils/helpers';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gh-surface border border-gh-border rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-gh-muted mb-1">{label}</p>
      <p className="text-gh-text font-semibold">
        {payload[0].value} PR{payload[0].value !== 1 ? 's' : ''}
      </p>
    </div>
  );
};

const PRVelocity = ({ prStats, loading = false }) => {
  if (loading) {
    return (
      <div className="card p-5">
        <div className="skeleton h-4 w-36 rounded mb-4" />
        <div className="grid grid-cols-2 gap-3 mb-4">
          {[1,2,3,4].map(i => <div key={i} className="skeleton h-16 rounded-lg" />)}
        </div>
        <div className="skeleton h-28 w-full rounded" />
      </div>
    );
  }

  if (!prStats || prStats.total === 0) {
    return (
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-gh-text mb-4">Pull Requests</h2>
        <div className="h-28 flex items-center justify-center">
          <p className="text-sm text-gh-muted">No PR data available</p>
        </div>
      </div>
    );
  }

  const miniStats = [
    {
      icon: GitPullRequest,
      label: 'Total PRs',
      value: prStats.total,
      color: 'text-blue-400',
      bg:    'bg-blue-400/10',
    },
    {
      icon: GitMerge,
      label: 'Merged',
      value: prStats.merged,
      color: 'text-purple-400',
      bg:    'bg-purple-400/10',
    },
    {
      icon: TrendingUp,
      label: 'Merge rate',
      value: `${prStats.mergeRate}%`,
      color: 'text-brand-400',
      bg:    'bg-brand-400/10',
    },
    {
      icon: Clock,
      label: 'Avg merge',
      value: prStats.avgMergeDays ? `${prStats.avgMergeDays}d` : '—',
      color: 'text-amber-400',
      bg:    'bg-amber-400/10',
    },
  ];

  return (
    <div className="card p-5">
      <h2 className="text-sm font-semibold text-gh-text mb-4">Pull Requests</h2>

      {/* Mini stat grid */}
      <div className="grid grid-cols-2 gap-2 mb-5">
        {miniStats.map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className="bg-gh-bg rounded-lg p-3 border border-gh-border">
            <div className={cn('w-7 h-7 rounded-md flex items-center justify-center mb-2', bg)}>
              <Icon size={14} className={color} />
            </div>
            <div className={cn('text-lg font-bold font-mono', color)}>{value}</div>
            <div className="text-xs text-gh-muted mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Monthly bar chart */}
      {prStats.monthly?.length > 0 && (
        <>
          <h3 className="text-xs font-medium text-gh-muted mb-3">PRs per month</h3>
          <ResponsiveContainer width="100%" height={100}>
            <BarChart
              data={prStats.monthly}
              barSize={12}
              margin={{ top: 0, right: 0, left: -28, bottom: 0 }}
            >
              <CartesianGrid vertical={false} stroke="#30363d" strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
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
              <Bar dataKey="count" fill="#a371f7" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  );
};

export default PRVelocity;
