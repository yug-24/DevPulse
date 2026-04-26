import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Github, MapPin, Building2, Link2, Users,
  Star, GitFork, Calendar, Flame, Code2,
  GitCommit, GitPullRequest, Share2, Check,
  Lock, UserX, Zap, ExternalLink, ArrowLeft,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ContribHeatmap from '../components/charts/ContribHeatmap';
import LanguageChart from '../components/charts/LanguageChart';
import StreakCard from '../components/charts/StreakCard';
import PRVelocity from '../components/charts/PRVelocity';
import { DailyCommitChart } from '../components/charts/CommitChart';
import RepoCard from '../components/ui/RepoCard';
import Spinner from '../components/ui/Spinner';
import { formatNumber, githubUrl, timeAgo } from '../utils/helpers';
import api, { getErrorMessage } from '../utils/api';
import toast from 'react-hot-toast';

// ── Stat pill component ───────────────────────────────────────
const Pill = ({ icon: Icon, value, label, color = 'text-gh-muted' }) => (
  <div className="flex items-center gap-1.5 text-sm">
    <Icon size={14} className={color} />
    <span className="font-semibold text-gh-text font-mono">{formatNumber(value)}</span>
    <span className="text-gh-muted">{label}</span>
  </div>
);

// ── Share button ──────────────────────────────────────────────
const ShareButton = ({ url }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Profile URL copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy URL');
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="btn btn-sm btn-secondary flex items-center gap-2"
      title="Copy profile URL"
    >
      {copied ? (
        <><Check size={13} className="text-brand-400" /> Copied!</>
      ) : (
        <><Share2 size={13} /> Share</>
      )}
    </button>
  );
};

// ── Main page ─────────────────────────────────────────────────
const PublicProfilePage = ({ bySlug = false }) => {
  const { username, slug } = useParams();
  const { user: authUser }  = useAuth();
  const navigate            = useNavigate();

  const [profileData, setProfileData] = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const load = async () => {
      try {
        const endpoint = bySlug
          ? `/users/slug/${slug}`
          : `/users/${username}`;
        const { data } = await api.get(endpoint);
        setProfileData(data.data);
      } catch (err) {
        const status = err?.response?.status;
        const msg    = getErrorMessage(err);
        if (status === 404) {
          setError({ type: 'not_found', message: msg });
        } else if (status === 403) {
          setError({ type: 'private', message: msg });
        } else {
          setError({ type: 'error', message: msg });
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [username, slug, bySlug]);

  // ── Loading ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gh-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center mx-auto mb-4">
            <Zap size={20} className="text-brand-400" />
          </div>
          <Spinner size="lg" className="mx-auto mb-3" />
          <p className="text-gh-muted text-sm">Loading profile…</p>
        </div>
      </div>
    );
  }

  // ── Error states ───────────────────────────────────────────
  if (error) {
    const isNotFound = error.type === 'not_found';
    const isPrivate  = error.type === 'private';

    return (
      <div className="min-h-screen bg-gh-bg flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-gh-surface border border-gh-border flex items-center justify-center mx-auto mb-6">
            {isPrivate
              ? <Lock size={28} className="text-gh-muted" />
              : <UserX size={28} className="text-gh-muted" />
            }
          </div>
          <h1 className="text-xl font-bold text-gh-text mb-2">
            {isPrivate  ? 'Private profile'
            : isNotFound ? 'Profile not found'
            : 'Something went wrong'}
          </h1>
          <p className="text-gh-muted text-sm mb-6">{error.message}</p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="btn btn-sm btn-secondary flex items-center gap-2"
            >
              <ArrowLeft size={13} />
              Go back
            </button>
            <Link to="/" className="btn btn-sm btn-primary no-underline">
              DevPulse home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { user, analytics, isOwner } = profileData;
  const s    = analytics?.summary;
  const prof = user?.githubProfile;
  const profileUrl = window.location.href;

  return (
    <div className="min-h-screen bg-gh-bg">

      {/* ── Minimal public nav ── */}
      <header className="sticky top-0 z-40 bg-gh-bg/95 backdrop-blur border-b border-gh-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-13 flex items-center justify-between py-3">
          <Link
            to="/"
            className="flex items-center gap-2 no-underline group"
          >
            <div className="w-6 h-6 rounded-md bg-brand-600 flex items-center justify-center">
              <Zap size={12} className="text-white" />
            </div>
            <span className="text-sm font-bold text-gh-text group-hover:text-brand-400 transition-colors">
              DevPulse
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <ShareButton url={profileUrl} />
            {isOwner ? (
              <Link
                to="/dashboard"
                className="btn btn-sm btn-primary no-underline"
              >
                My dashboard
              </Link>
            ) : (
              <Link
                to="/"
                className="btn btn-sm btn-secondary no-underline"
              >
                Get yours free
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

        {/* ── Hero profile card ── */}
        <div className="card p-6 sm:p-8 mb-6">
          <div className="flex flex-col sm:flex-row items-start gap-6">

            {/* Avatar */}
            <div className="shrink-0">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-24 h-24 rounded-full border-4 border-gh-border"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gh-border flex items-center justify-center text-3xl font-bold text-gh-text">
                  {user.username?.[0]?.toUpperCase()}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h1 className="text-2xl font-bold text-gh-text">
                    {user.name || user.username}
                  </h1>
                  <a
                    href={githubUrl(user.username)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-gh-muted hover:text-brand-400 transition-colors no-underline inline-flex items-center gap-1 mt-0.5"
                  >
                    @{user.username}
                    <ExternalLink size={11} />
                  </a>
                </div>
                <a
                  href={githubUrl(user.username)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-secondary no-underline flex items-center gap-2 shrink-0"
                >
                  <Github size={14} />
                  GitHub
                </a>
              </div>

              {/* Bio */}
              {prof?.bio && (
                <p className="text-sm text-gh-muted mt-3 leading-relaxed max-w-lg">
                  {prof.bio}
                </p>
              )}

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-4 mt-3">
                {prof?.company && (
                  <span className="flex items-center gap-1.5 text-xs text-gh-muted">
                    <Building2 size={13} />
                    {prof.company}
                  </span>
                )}
                {prof?.location && (
                  <span className="flex items-center gap-1.5 text-xs text-gh-muted">
                    <MapPin size={13} />
                    {prof.location}
                  </span>
                )}
                {user.createdAt && (
                  <span className="flex items-center gap-1.5 text-xs text-gh-muted">
                    <Calendar size={13} />
                    On DevPulse since {timeAgo(user.createdAt)}
                  </span>
                )}
              </div>

              {/* GitHub stats row */}
              <div className="flex flex-wrap items-center gap-5 mt-4 pt-4 border-t border-gh-border">
                <Pill icon={Users}      value={prof?.followers}   label="followers"    color="text-gh-muted" />
                <Pill icon={GitFork}    value={prof?.publicRepos} label="repos"        color="text-blue-400" />
                <Pill icon={Star}       value={s?.totalStars}     label="total stars"  color="text-amber-400" />
                <Pill icon={GitCommit}  value={s?.totalContributions} label="contributions" color="text-brand-400" />
                <Pill icon={Flame}      value={s?.currentStreak ? `${s.currentStreak}d` : '0d'} label="streak" color="text-orange-400" />
              </div>
            </div>
          </div>
        </div>

        {/* ── Top stats strip ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            {
              icon:  GitCommit,
              label: 'Contributions',
              value: s?.totalContributions,
              color: 'text-brand-400',
              bg:    'bg-brand-400/10',
            },
            {
              icon:  Flame,
              label: 'Longest streak',
              value: s?.longestStreak ? `${s.longestStreak}d` : '0d',
              color: 'text-orange-400',
              bg:    'bg-orange-400/10',
            },
            {
              icon:  Code2,
              label: 'Top language',
              value: s?.topLanguage || '—',
              color: 'text-purple-400',
              bg:    'bg-purple-400/10',
            },
            {
              icon:  GitPullRequest,
              label: 'Merge rate',
              value: s?.mergeRate ? `${s.mergeRate}%` : '—',
              color: 'text-blue-400',
              bg:    'bg-blue-400/10',
            },
          ].map(({ icon: Icon, label, value, color, bg }) => (
            <div key={label} className="card p-4 text-center">
              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mx-auto mb-2`}>
                <Icon size={16} className={color} />
              </div>
              <div className={`text-xl font-bold font-mono ${color}`}>
                {typeof value === 'number' ? formatNumber(value) : value ?? '—'}
              </div>
              <div className="text-xs text-gh-muted mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* ── Heatmap ── */}
        <div className="mb-6">
          <ContribHeatmap
            days={analytics?.heatmap || []}
            totalContributions={analytics?.contribs?.totalContributions || 0}
            loading={false}
          />
        </div>

        {/* ── Streaks + Languages ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <StreakCard streaks={analytics?.streaks} loading={false} />
          </div>
          <LanguageChart languages={analytics?.languages || []} loading={false} />
        </div>

        {/* ── Commits + PRs ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <DailyCommitChart
            daily={analytics?.commitAnalytics?.daily || []}
            loading={false}
          />
          <PRVelocity prStats={analytics?.prStats} loading={false} />
        </div>

        {/* ── Top repos ── */}
        {analytics?.repoStats?.topStarred?.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-gh-text mb-4 flex items-center gap-2">
              <Star size={15} className="text-amber-400" />
              Top repositories
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {analytics.repoStats.topStarred.slice(0, 6).map((repo) => (
                <RepoCard key={repo.id} repo={repo} />
              ))}
            </div>
          </div>
        )}

        {/* ── Footer CTA ── */}
        <div className="card p-6 text-center mt-8">
          <div className="w-10 h-10 rounded-xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center mx-auto mb-3">
            <Zap size={18} className="text-brand-400" />
          </div>
          <h3 className="text-base font-semibold text-gh-text mb-1">
            Get your own DevPulse dashboard
          </h3>
          <p className="text-sm text-gh-muted mb-4">
            Connect GitHub in 10 seconds. Free, read-only access.
          </p>
          <Link
            to="/"
            className="btn btn-md btn-primary no-underline inline-flex items-center gap-2"
          >
            <Github size={16} />
            Connect GitHub — free
          </Link>
        </div>

      </main>
    </div>
  );
};

export default PublicProfilePage;
