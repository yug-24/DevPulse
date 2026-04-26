import { useState, useEffect, useCallback, useRef } from 'react';
import {
  GitCommit, Star, Users, Flame,
  Code2, GitPullRequest, RefreshCw,
  GitFork, Calendar, ExternalLink, AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/layout/Navbar';
import StatCard from '../components/ui/StatCard';
import RepoCard from '../components/ui/RepoCard';
import ContribHeatmap from '../components/charts/ContribHeatmap';
import LanguageChart from '../components/charts/LanguageChart';
import { DailyCommitChart, WeekdayChart, HourlyChart } from '../components/charts/CommitChart';
import PRVelocity from '../components/charts/PRVelocity';
import StreakCard from '../components/charts/StreakCard';
import Spinner from '../components/ui/Spinner';
import { githubUrl, formatNumber } from '../utils/helpers';
import api, { getErrorMessage } from '../utils/api';
import toast from 'react-hot-toast';

const DashboardPage = () => {
  const { user } = useAuth();
  const [data,      setData]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [refreshing,setRefreshing]= useState(false);
  const [error,     setError]     = useState(null);
  const fetchedRef = useRef(false);

  const fetchAll = useCallback(async (bust = false) => {
    try {
      if (bust) {
        // Clear server cache first
        await api.post('/github/refresh').catch(() => {});
      }
      const res = await api.get('/github/all');
      setData(res.data.data);  // Extract the data from the response
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    fetchAll().finally(() => setLoading(false));
  }, [fetchAll]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAll(true);
    setRefreshing(false);
    toast.success('Dashboard refreshed!');
  };

  // ── Summary stats for the top cards ──────────────────────────
  const s = data?.summary;
  const topCards = [
    {
      icon:    GitCommit,
      label:   'Total contributions',
      value:   s?.totalContributions,
      sub:     'in the last year',
      accent:  'green',
      trend:   'positive',
      trendValue: s?.totalActiveDays ? `${s.totalActiveDays} active days` : undefined,
    },
    {
      icon:    Star,
      label:   'Total stars',
      value:   s?.totalStars,
      sub:     `across ${s?.totalRepos ?? '—'} repositories`,
      accent:  'amber',
    },
    {
      icon:    Flame,
      label:   'Current streak',
      value:   s?.currentStreak != null ? `${s.currentStreak}d` : '—',
      sub:     s?.longestStreak ? `Best: ${s.longestStreak} days` : 'Keep coding!',
      accent:  'amber',
    },
    {
      icon:    Code2,
      label:   'Top language',
      value:   s?.topLanguage || '—',
      sub:     s?.topLanguagePercent ? `${s.topLanguagePercent}% of your code` : '',
      accent:  'purple',
    },
    {
      icon:    Users,
      label:   'Followers',
      value:   s?.followers,
      sub:     `Following ${s?.following ?? '—'}`,
      accent:  'blue',
    },
    {
      icon:    GitPullRequest,
      label:   'Pull requests',
      value:   s?.totalPRs,
      sub:     s?.mergeRate ? `${s.mergeRate}% merge rate` : 'Total opened',
      accent:  'purple',
      trend:   s?.mergeRate >= 70 ? 'positive' : undefined,
      trendValue: s?.mergeRate ? `${s.mergeRate}%` : undefined,
    },
    {
      icon:    GitFork,
      label:   'Commits (30d)',
      value:   s?.totalCommits30d,
      sub:     s?.peakDay ? `Most active: ${s.peakDay}s` : 'Last 30 days',
      accent:  'green',
    },
    {
      icon:    Calendar,
      label:   'Active days',
      value:   s?.totalActiveDays,
      sub:     'in the last year',
      accent:  'blue',
    },
  ];

  // ── Error state ───────────────────────────────────────────────
  if (!loading && error) {
    return (
      <div className="min-h-screen bg-gh-bg">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <AlertCircle size={40} className="text-red-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gh-text mb-2">Failed to load dashboard</h2>
          <p className="text-gh-muted text-sm mb-6 max-w-sm mx-auto">{error}</p>
          <button
            onClick={handleRefresh}
            className="btn btn-md btn-primary inline-flex items-center gap-2"
          >
            <RefreshCw size={15} />
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gh-bg">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* ── Profile header ── */}
        <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-16 h-16 rounded-full border-2 border-gh-border shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gh-border flex items-center justify-center text-xl font-bold text-gh-text shrink-0">
                {user?.username?.[0]?.toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-gh-text">
                {user?.name || user?.username}
              </h1>
              <a
                href={githubUrl(user?.username)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gh-muted hover:text-brand-400 transition-colors no-underline inline-flex items-center gap-1"
              >
                @{user?.username}
                <ExternalLink size={11} />
              </a>
              {user?.githubProfile?.bio && (
                <p className="text-sm text-gh-muted mt-1 max-w-md leading-relaxed">
                  {user.githubProfile.bio}
                </p>
              )}
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                {user?.githubProfile?.company && (
                  <span className="text-xs text-gh-muted">{user.githubProfile.company}</span>
                )}
                {user?.githubProfile?.location && (
                  <span className="text-xs text-gh-muted">{user.githubProfile.location}</span>
                )}
                {data?.fetchedAt && (
                  <span className="text-xs text-gh-muted">
                    Updated {new Date(data.fetchedAt).toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={handleRefresh}
            disabled={loading || refreshing}
            className="btn btn-sm btn-secondary flex items-center gap-2 shrink-0"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>

        {/* ── Stat cards grid ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {topCards.map((card) => (
            <StatCard key={card.label} {...card} loading={loading} />
          ))}
        </div>

        {/* ── Contribution heatmap ── */}
        <div className="mb-6">
          <ContribHeatmap
            days={data?.heatmap || []}
            totalContributions={data?.contribs?.totalContributions || 0}
            loading={loading}
          />
        </div>

        {/* ── Streaks + Languages ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <StreakCard streaks={data?.streaks} loading={loading} />
          </div>
          <div>
            <LanguageChart languages={data?.languages || []} loading={loading} />
          </div>
        </div>

        {/* ── Commit analytics row ── */}
        <div className="mb-6">
          <DailyCommitChart
            daily={data?.commitAnalytics?.daily || []}
            loading={loading}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          <WeekdayChart
            weekday={data?.commitAnalytics?.weekday || []}
            peakDay={data?.summary?.peakDay}
            loading={loading}
          />
          <HourlyChart
            hourly={data?.commitAnalytics?.hourly || []}
            peakHour={data?.summary?.peakHour}
            loading={loading}
          />
        </div>

        {/* ── PR velocity ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div>
            <PRVelocity prStats={data?.prStats} loading={loading} />
          </div>

          {/* Contribution breakdown */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-gh-text mb-4">Contribution breakdown</h2>
            {loading ? (
              <div className="space-y-3">
                {[1,2,3,4].map(i => <div key={i} className="skeleton h-8 rounded-lg" />)}
              </div>
            ) : (
              <div className="space-y-2">
                {[
                  { label: 'Commits',      value: data?.contribs?.totalCommits,  color: 'bg-brand-500' },
                  { label: 'Pull requests',value: data?.contribs?.totalPRs,       color: 'bg-purple-500' },
                  { label: 'Issues',       value: data?.contribs?.totalIssues,    color: 'bg-blue-500' },
                ].map(({ label, value, color }) => {
                  const total = (data?.contribs?.totalContributions || 1);
                  const pct   = Math.round(((value || 0) / total) * 100);
                  return (
                    <div key={label}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gh-muted">{label}</span>
                        <span className="text-gh-text font-medium font-mono">
                          {formatNumber(value || 0)}
                        </span>
                      </div>
                      <div className="h-1.5 bg-gh-border rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${color}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Top repos by stars */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-gh-text mb-4 flex items-center gap-2">
              <Star size={15} className="text-amber-400" />
              Most starred
            </h2>
            {loading ? (
              <div className="space-y-2">
                {[1,2,3].map(i => <div key={i} className="skeleton h-10 rounded-lg" />)}
              </div>
            ) : (
              <div className="space-y-2">
                {(data?.repoStats?.topStarred || []).slice(0, 3).map((repo) => (
                  <a
                    key={repo.id}
                    href={repo.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-gh-border/30 transition-colors no-underline group"
                  >
                    <span className="text-xs text-gh-text group-hover:text-brand-400 transition-colors truncate">
                      {repo.name}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-amber-400 shrink-0 ml-2">
                      <Star size={11} fill="currentColor" />
                      {formatNumber(repo.stargazers_count)}
                    </span>
                  </a>
                ))}
                {(!data?.repoStats?.topStarred?.length) && (
                  <p className="text-xs text-gh-muted text-center py-4">No starred repos yet</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Top repos grid ── */}
        <div>
          <h2 className="text-sm font-semibold text-gh-text mb-4 flex items-center gap-2">
            <GitCommit size={15} className="text-brand-400" />
            Recently active repositories
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <RepoCard key={i} loading={true} />
                ))
              : (data?.repoStats?.recentlyActive || []).map((repo) => (
                  <RepoCard key={repo.id} repo={repo} />
                ))}
          </div>
        </div>

      </main>
    </div>
  );
};

export default DashboardPage;
