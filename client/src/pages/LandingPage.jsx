import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Github, Zap, GitCommit, BarChart2,
  Flame, Globe, Shield, ArrowRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const FEATURES = [
  {
    icon: GitCommit,
    title: 'Commit heatmap',
    desc: 'Visual contribution graph showing your activity over the past year.',
  },
  {
    icon: Flame,
    title: 'Streak tracker',
    desc: 'Current and longest coding streaks — stay consistent.',
  },
  {
    icon: BarChart2,
    title: 'Language breakdown',
    desc: 'See exactly how much time you spend in each language.',
  },
  {
    icon: Globe,
    title: 'Shareable profile',
    desc: 'Public URL you can put in your resume or send to recruiters.',
  },
];

const DEMO_STATS = [
  { label: 'Total commits', value: '2,847' },
  { label: 'Repositories', value: '34'    },
  { label: 'Current streak', value: '23d' },
  { label: 'Top language',  value: 'JS'   },
];

const LandingPage = () => {
  const { loginWithGitHub } = useAuth();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const error = searchParams.get('error');
    if (error === 'oauth_failed') {
      toast.error('GitHub sign-in failed. Please try again.');
    } else if (error === 'server_error') {
      toast.error('Something went wrong. Please try again.');
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gh-bg">

      {/* ── Navbar ── */}
      <header className="border-b border-gh-border">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
              <Zap size={14} className="text-white" />
            </div>
            <span className="font-bold text-gh-text text-sm">DevPulse</span>
          </div>
          <button
            onClick={loginWithGitHub}
            className="btn btn-sm btn-secondary flex items-center gap-2"
          >
            <Github size={15} />
            Sign in
          </button>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-800 bg-brand-900/30 text-brand-400 text-xs font-medium mb-8">
          <Zap size={11} />
          GitHub analytics for developers
        </div>

        <h1 className="text-5xl sm:text-6xl font-bold text-gh-text leading-tight tracking-tight mb-6">
          Your GitHub story,{' '}
          <span className="text-brand-400">beautifully told</span>
        </h1>

        <p className="text-lg text-gh-muted max-w-2xl mx-auto mb-10 leading-relaxed">
          Connect your GitHub account and get a stunning analytics dashboard —
          commit heatmaps, streak tracking, language trends, and a shareable
          profile link you can send to recruiters.
        </p>

        {/* CTA */}
        <button
          onClick={loginWithGitHub}
          className="btn btn-lg btn-github inline-flex items-center gap-3 px-8 shadow-lg hover:shadow-xl transition-shadow"
        >
          <Github size={20} />
          Connect GitHub — it's free
          <ArrowRight size={16} />
        </button>

        <p className="text-xs text-gh-muted mt-4 flex items-center justify-center gap-1.5">
          <Shield size={12} />
          Read-only access. We never write to your repos.
        </p>
      </section>

      {/* ── Demo stats strip ── */}
      <section className="border-y border-gh-border bg-gh-surface/50">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {DEMO_STATS.map(({ label, value }) => (
              <div key={label}>
                <div className="text-3xl font-bold text-gh-text font-mono">{value}</div>
                <div className="text-sm text-gh-muted mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-2xl font-bold text-gh-text text-center mb-12">
          Everything you need to track your growth
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card p-5 hover:border-gray-500 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-brand-400/10 text-brand-400 flex items-center justify-center mb-4">
                <Icon size={18} />
              </div>
              <h3 className="text-sm font-semibold text-gh-text mb-2">{title}</h3>
              <p className="text-xs text-gh-muted leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="border-t border-gh-border">
        <div className="max-w-6xl mx-auto px-6 py-16 text-center">
          <h2 className="text-2xl font-bold text-gh-text mb-4">
            Ready to see your GitHub story?
          </h2>
          <p className="text-gh-muted mb-8">
            Takes 10 seconds to connect. No email required.
          </p>
          <button
            onClick={loginWithGitHub}
            className="btn btn-lg btn-github inline-flex items-center gap-3 px-8"
          >
            <Github size={18} />
            Get started with GitHub
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gh-border">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between text-xs text-gh-muted">
          <span>DevPulse — Built by Yug Bhatt</span>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/yug-24"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gh-text transition-colors no-underline text-gh-muted"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
