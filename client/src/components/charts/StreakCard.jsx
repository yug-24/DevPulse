import { Flame, Zap, Calendar } from 'lucide-react';
import { cn } from '../../utils/helpers';

const StreakCard = ({ streaks, loading = false }) => {
  if (loading) {
    return (
      <div className="card p-5">
        <div className="skeleton h-4 w-24 rounded mb-4" />
        <div className="grid grid-cols-3 gap-3">
          {[1,2,3].map(i => <div key={i} className="skeleton h-20 rounded-lg" />)}
        </div>
      </div>
    );
  }

  const stats = [
    {
      icon:  Flame,
      label: 'Current streak',
      value: streaks?.current || 0,
      unit:  'days',
      color: streaks?.current >= 7
        ? 'text-orange-400'
        : streaks?.current >= 3
        ? 'text-amber-400'
        : 'text-gh-muted',
      bg: streaks?.current >= 7
        ? 'bg-orange-400/10'
        : streaks?.current >= 3
        ? 'bg-amber-400/10'
        : 'bg-gh-border/30',
    },
    {
      icon:  Zap,
      label: 'Longest streak',
      value: streaks?.longest || 0,
      unit:  'days',
      color: 'text-brand-400',
      bg:    'bg-brand-400/10',
    },
    {
      icon:  Calendar,
      label: 'Active days',
      value: streaks?.totalActiveDays || 0,
      unit:  'this year',
      color: 'text-blue-400',
      bg:    'bg-blue-400/10',
    },
  ];

  return (
    <div className="card p-5">
      <h2 className="text-sm font-semibold text-gh-text mb-4">Streaks</h2>
      <div className="grid grid-cols-3 gap-3">
        {stats.map(({ icon: Icon, label, value, unit, color, bg }) => (
          <div
            key={label}
            className="bg-gh-bg rounded-xl p-4 border border-gh-border text-center"
          >
            <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-3', bg)}>
              <Icon size={18} className={color} />
            </div>
            <div className={cn('text-2xl font-bold font-mono', color)}>{value}</div>
            <div className="text-xs text-gh-muted mt-0.5 leading-tight">{unit}</div>
            <div className="text-xs text-gh-muted mt-1 font-medium">{label.split(' ')[0]}</div>
          </div>
        ))}
      </div>
      {streaks?.current >= 7 && (
        <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-orange-900/20 border border-orange-800/30 rounded-lg">
          <Flame size={14} className="text-orange-400 shrink-0" />
          <p className="text-xs text-orange-400">
            {streaks.current >= 30
              ? `🔥 ${streaks.current}-day streak! You're on fire!`
              : streaks.current >= 14
              ? `Great momentum! ${streaks.current} days strong.`
              : `${streaks.current} days and counting — keep going!`}
          </p>
        </div>
      )}
    </div>
  );
};

export default StreakCard;
