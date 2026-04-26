import { cn, formatNumber } from '../../utils/helpers';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const StatCard = ({
  icon: Icon,
  label,
  value,
  sub,
  trend,        // positive | negative | neutral
  trendValue,
  accent = 'green', // green | blue | purple | amber | gray
  loading = false,
  className,
}) => {
  const accentColors = {
    green:  'text-brand-400 bg-brand-400/10',
    blue:   'text-blue-400  bg-blue-400/10',
    purple: 'text-purple-400 bg-purple-400/10',
    amber:  'text-amber-400  bg-amber-400/10',
    gray:   'text-gh-muted   bg-gh-border/30',
  };

  const trendIcons = {
    positive: TrendingUp,
    negative: TrendingDown,
    neutral:  Minus,
  };

  const trendColors = {
    positive: 'text-brand-400',
    negative: 'text-red-400',
    neutral:  'text-gh-muted',
  };

  const TrendIcon = trend ? trendIcons[trend] : null;

  if (loading) {
    return (
      <div className={cn('card p-5', className)}>
        <div className="flex items-start justify-between mb-3">
          <div className="skeleton w-9 h-9 rounded-lg" />
          <div className="skeleton w-16 h-5 rounded-full" />
        </div>
        <div className="skeleton w-20 h-7 rounded mb-1" />
        <div className="skeleton w-28 h-4 rounded" />
      </div>
    );
  }

  return (
    <div className={cn('card p-5 hover:border-gray-500 transition-colors', className)}>
      <div className="flex items-start justify-between mb-3">
        {Icon && (
          <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', accentColors[accent])}>
            <Icon size={18} />
          </div>
        )}
        {TrendIcon && trendValue && (
          <div className={cn('flex items-center gap-1 text-xs font-medium', trendColors[trend])}>
            <TrendIcon size={12} />
            <span>{trendValue}</span>
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-gh-text font-mono tracking-tight">
        {typeof value === 'number' ? formatNumber(value) : value ?? '—'}
      </div>
      <div className="text-sm font-medium text-gh-text mt-0.5">{label}</div>
      {sub && <div className="text-xs text-gh-muted mt-1">{sub}</div>}
    </div>
  );
};

export default StatCard;
