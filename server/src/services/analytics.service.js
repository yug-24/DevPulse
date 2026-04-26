/**
 * Analytics Service
 * -----------------
 * Pure computation — no API calls, no DB access.
 * Takes raw GitHub API responses and returns structured analytics objects.
 */

// ── Contribution heatmap ──────────────────────────────────────

/**
 * Flatten the GraphQL contribution calendar into a flat array of days
 * sorted oldest → newest, ready for the heatmap grid.
 */
export const buildHeatmapData = (contributionCalendar) => {
  if (!contributionCalendar?.weeks) return [];

  const days = [];
  for (const week of contributionCalendar.weeks) {
    for (const day of week.contributionDays) {
      days.push({
        date:  day.date,
        count: day.contributionCount,
        level: getContribLevel(day.contributionCount),
      });
    }
  }
  return days;
};

const getContribLevel = (count) => {
  if (count === 0) return 0;
  if (count <= 3)  return 1;
  if (count <= 6)  return 2;
  if (count <= 9)  return 3;
  return 4;
};

// ── Streak calculation ────────────────────────────────────────

/**
 * Calculate current and longest streak from heatmap data.
 * A streak is consecutive days with at least 1 contribution.
 */
export const calcStreaks = (heatmapDays) => {
  if (!heatmapDays?.length) return { current: 0, longest: 0, totalActiveDays: 0 };

  // Sort newest first
  const sorted = [...heatmapDays]
    .filter((d) => d.count > 0)
    .map((d) => d.date)
    .sort()
    .reverse();

  if (!sorted.length) return { current: 0, longest: 0, totalActiveDays: sorted.length };

  const today     = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  // Current streak — must start from today or yesterday
  let current = 0;
  if (sorted[0] === today || sorted[0] === yesterday) {
    current = 1;
    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i - 1]);
      const curr = new Date(sorted[i]);
      const diffDays = Math.round((prev - curr) / 86400000);
      if (diffDays === 1) { current++; }
      else break;
    }
  }

  // Longest streak — scan all history
  let longest = current;
  let run     = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev    = new Date(sorted[i - 1]);
    const curr    = new Date(sorted[i]);
    const diffDays = Math.round((prev - curr) / 86400000);
    if (diffDays === 1) {
      run++;
      if (run > longest) longest = run;
    } else {
      run = 1;
    }
  }

  return { current, longest, totalActiveDays: sorted.length };
};

// ── Language analytics ────────────────────────────────────────

/**
 * Convert raw language bytes map into percentage breakdown
 * with color codes, sorted by usage.
 */
export const buildLanguageStats = (langBytes) => {
  if (!langBytes || !Object.keys(langBytes).length) return [];

  const total = Object.values(langBytes).reduce((s, b) => s + b, 0);
  if (total === 0) return [];

  const COLORS = {
    JavaScript: '#f1e05a', TypeScript: '#3178c6',
    Python:     '#3572A5', Java:       '#b07219',
    Go:         '#00ADD8', Rust:       '#dea584',
    'C++':      '#f34b7d', C:          '#555555',
    'C#':       '#178600', PHP:        '#4F5D95',
    Ruby:       '#701516', Swift:      '#F05138',
    Kotlin:     '#A97BFF', Dart:       '#00B4AB',
    Vue:        '#41b883', HTML:       '#e34c26',
    CSS:        '#563d7c', Shell:      '#89e051',
    Dockerfile: '#384d54', Makefile:   '#427819',
  };

  return Object.entries(langBytes)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10) // Top 10 languages
    .map(([name, bytes]) => ({
      name,
      bytes,
      percentage: Math.round((bytes / total) * 1000) / 10, // 1dp
      color: COLORS[name] || '#8b949e',
    }));
};

// ── Commit analytics ──────────────────────────────────────────

/**
 * Extract push events from user events array and build:
 * - daily commit counts (for bar chart)
 * - hourly distribution (what time of day do they commit?)
 * - day-of-week distribution
 */
export const buildCommitAnalytics = (events) => {
  const pushEvents = events.filter((e) => e.type === 'PushEvent');

  // Daily counts — last 30 days
  const dailyCounts = {};
  const now = Date.now();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now - i * 86400000).toISOString().split('T')[0];
    dailyCounts[d] = 0;
  }

  // Hourly distribution (0-23)
  const hourly = new Array(24).fill(0);

  // Day of week distribution (0=Sun..6=Sat)
  const weekday = new Array(7).fill(0);
  const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  let totalCommits = 0;

  for (const event of pushEvents) {
    const commits = event.payload?.commits?.length || 0;
    const date    = new Date(event.created_at);
    const dateStr = date.toISOString().split('T')[0];

    totalCommits += commits;

    if (dateStr in dailyCounts) {
      dailyCounts[dateStr] += commits;
    }

    hourly[date.getHours()]   += commits;
    weekday[date.getDay()]    += commits;
  }

  // Peak hour
  const peakHour = hourly.indexOf(Math.max(...hourly));
  const peakHourLabel =
    peakHour === 0 ? '12am'
    : peakHour < 12 ? `${peakHour}am`
    : peakHour === 12 ? '12pm'
    : `${peakHour - 12}pm`;

  // Peak day
  const peakDayIdx = weekday.indexOf(Math.max(...weekday));
  const peakDay    = weekdayNames[peakDayIdx];

  return {
    daily: Object.entries(dailyCounts).map(([date, count]) => ({ date, count })),
    hourly: hourly.map((count, hour) => ({
      hour,
      label: hour === 0 ? '12am'
        : hour < 12 ? `${hour}am`
        : hour === 12 ? '12pm'
        : `${hour - 12}pm`,
      count,
    })),
    weekday: weekday.map((count, i) => ({
      day: weekdayNames[i],
      count,
    })),
    peakHour:    peakHourLabel,
    peakDay,
    totalCommits,
    totalPushEvents: pushEvents.length,
  };
};

// ── PR analytics ──────────────────────────────────────────────

/**
 * Build PR velocity and merge rate stats from PR list.
 */
export const buildPRStats = (prs) => {
  if (!prs?.length) {
    return {
      total: 0, merged: 0, open: 0, closed: 0,
      mergeRate: 0, avgMergeDays: 0,
      monthly: [],
    };
  }

  const merged = prs.filter((p) => p.pull_request?.merged_at);
  const open   = prs.filter((p) => p.state === 'open');
  const closed = prs.filter((p) => p.state === 'closed' && !p.pull_request?.merged_at);

  // Average time to merge (days)
  const mergeTimes = merged
    .filter((p) => p.created_at && p.pull_request?.merged_at)
    .map((p) => {
      const created = new Date(p.created_at);
      const mergedAt = new Date(p.pull_request.merged_at);
      return (mergedAt - created) / 86400000;
    });
  const avgMergeDays = mergeTimes.length
    ? Math.round((mergeTimes.reduce((s, d) => s + d, 0) / mergeTimes.length) * 10) / 10
    : 0;

  // Monthly PR counts — last 6 months
  const monthly = buildMonthlyPRCounts(prs, 6);

  return {
    total:        prs.length,
    merged:       merged.length,
    open:         open.length,
    closed:       closed.length,
    mergeRate:    Math.round((merged.length / prs.length) * 100),
    avgMergeDays,
    monthly,
  };
};

const buildMonthlyPRCounts = (prs, months) => {
  const result = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    const count = prs.filter((p) => {
      const pd = new Date(p.created_at);
      return pd.getFullYear() === d.getFullYear() && pd.getMonth() === d.getMonth();
    }).length;
    result.push({ label, count });
  }

  return result;
};

// ── Repo analytics ────────────────────────────────────────────

/**
 * Build repo statistics — top starred, most forked, recently active.
 */
export const buildRepoStats = (repos) => {
  if (!repos?.length) return { total: 0, topStarred: [], mostForked: [], recentlyActive: [], totalStars: 0 };

  const ownRepos  = repos.filter((r) => !r.fork && !r.archived);
  const totalStars = ownRepos.reduce((s, r) => s + (r.stargazers_count || 0), 0);

  const topStarred = [...ownRepos]
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 6);

  const mostForked = [...ownRepos]
    .sort((a, b) => b.forks_count - a.forks_count)
    .slice(0, 3);

  const recentlyActive = [...repos]
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    .slice(0, 6);

  return {
    total:          repos.length,
    ownTotal:       ownRepos.length,
    forks:          repos.length - ownRepos.length,
    totalStars,
    topStarred,
    mostForked,
    recentlyActive,
  };
};

// ── Summary stats ─────────────────────────────────────────────

/**
 * Build the top-level summary numbers shown in the stat cards.
 */
export const buildSummaryStats = ({
  ghProfile,
  repos,
  streaks,
  contributions,
  languages,
  prStats,
  commitAnalytics,
}) => ({
  totalRepos:          ghProfile?.public_repos  || 0,
  totalStars:          repos?.totalStars        || 0,
  followers:           ghProfile?.followers     || 0,
  following:           ghProfile?.following     || 0,
  totalContributions:  contributions?.contributionCalendar?.totalContributions || 0,
  currentStreak:       streaks?.current         || 0,
  longestStreak:       streaks?.longest         || 0,
  totalActiveDays:     streaks?.totalActiveDays || 0,
  topLanguage:         languages?.[0]?.name     || '—',
  topLanguagePercent:  languages?.[0]?.percentage || 0,
  totalCommits30d:     commitAnalytics?.totalCommits || 0,
  mergeRate:           prStats?.mergeRate        || 0,
  totalPRs:            prStats?.total            || 0,
  peakHour:            commitAnalytics?.peakHour || '—',
  peakDay:             commitAnalytics?.peakDay  || '—',
});
