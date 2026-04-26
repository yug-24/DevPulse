import { cn } from '../../utils/helpers';

const sizes = {
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-8 h-8 border-[3px]',
  xl: 'w-12 h-12 border-4',
};

const Spinner = ({ size = 'md', className, color = 'green' }) => {
  const colorClass =
    color === 'green'
      ? 'border-green-900 border-t-brand-400'
      : color === 'white'
      ? 'border-white/20 border-t-white'
      : 'border-gh-border border-t-brand-400';

  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn('rounded-full animate-spin', sizes[size], colorClass, className)}
    />
  );
};

export default Spinner;
