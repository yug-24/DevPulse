import { cn } from '../../utils/helpers';

const LanguageChart = ({ languages = [], loading = false }) => {
  if (loading) {
    return (
      <div className="card p-5">
        <div className="skeleton h-4 w-32 rounded mb-4" />
        <div className="space-y-3">
          {[80, 55, 40, 25, 15].map((w, i) => (
            <div key={i}>
              <div className="flex justify-between mb-1">
                <div className="skeleton h-3 w-20 rounded" />
                <div className="skeleton h-3 w-8 rounded" />
              </div>
              <div className="h-2 bg-gh-border rounded-full">
                <div className="skeleton h-full rounded-full" style={{ width: `${w}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!languages.length) {
    return (
      <div className="card p-5 flex items-center justify-center h-48">
        <p className="text-sm text-gh-muted">No language data yet</p>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <h2 className="text-sm font-semibold text-gh-text mb-4">
        Languages
      </h2>

      {/* Stacked bar */}
      <div className="flex h-2.5 rounded-full overflow-hidden mb-5 gap-0.5">
        {languages.map((lang) => (
          <div
            key={lang.name}
            style={{
              width:           `${lang.percentage}%`,
              backgroundColor: lang.color,
              minWidth:        '2px',
            }}
            title={`${lang.name} ${lang.percentage}%`}
            className="rounded-sm"
          />
        ))}
      </div>

      {/* List */}
      <div className="space-y-2.5">
        {languages.map((lang) => (
          <div key={lang.name} className="flex items-center gap-3">
            <div
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: lang.color }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs font-medium text-gh-text truncate">
                  {lang.name}
                </span>
                <span className="text-xs text-gh-muted ml-2 shrink-0">
                  {lang.percentage}%
                </span>
              </div>
              <div className="h-1 bg-gh-border rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width:           `${lang.percentage}%`,
                    backgroundColor: lang.color,
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LanguageChart;
