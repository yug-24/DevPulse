import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Globe, Shield, Link2, LogOut, Save,
  ExternalLink, Eye, EyeOff, Check,
  AlertTriangle, Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/layout/Navbar';
import { authApi, getErrorMessage } from '../utils/api';
import toast from 'react-hot-toast';

const BASE_URL = window.location.origin;

const SettingsPage = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  const [isPublic,   setIsPublic]   = useState(user?.isPublic   || false);
  const [shareSlug,  setShareSlug]  = useState(user?.shareSlug  || '');
  const [slugError,  setSlugError]  = useState('');
  const [slugStatus, setSlugStatus] = useState('idle'); // idle | checking | available | taken
  const [saving,     setSaving]     = useState(false);
  const [saved,      setSaved]      = useState(false);

  // Auto-suggest slug from username
  useEffect(() => {
    if (!shareSlug && user?.username) {
      setShareSlug(user.username.toLowerCase().replace(/[^a-z0-9-]/g, '-'));
    }
  }, [user?.username]); // eslint-disable-line

  const validateSlug = (val) => {
    if (!val) return '';
    if (val.length < 3)  return 'Slug must be at least 3 characters.';
    if (val.length > 30) return 'Slug cannot exceed 30 characters.';
    if (!/^[a-z0-9-]+$/.test(val)) return 'Only lowercase letters, numbers, and hyphens.';
    if (/^-|-$/.test(val)) return 'Slug cannot start or end with a hyphen.';
    if (/--/.test(val)) return 'Slug cannot contain consecutive hyphens.';
    return '';
  };

  const handleSlugChange = (e) => {
    const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setShareSlug(val);
    setSlugStatus('idle');
    setSaved(false);
    const err = validateSlug(val);
    setSlugError(err);
  };

  const handleSave = async () => {
    const err = validateSlug(shareSlug);
    if (err) { setSlugError(err); return; }

    setSaving(true);
    setSaved(false);
    try {
      const { data } = await authApi.profile({
        isPublic,
        shareSlug: shareSlug || null,
      });
      updateUser(data.data.user);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      toast.success('Settings saved!');
    } catch (e) {
      const msg = getErrorMessage(e);
      if (msg.toLowerCase().includes('taken')) {
        setSlugError('That slug is already taken. Try another.');
        setSlugStatus('taken');
      } else {
        toast.error(msg);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  const profileUrl = shareSlug && !slugError
    ? `${BASE_URL}/u/${shareSlug}`
    : shareSlug
    ? null
    : `${BASE_URL}/dev/${user?.username}`;

  const hasChanges =
    isPublic  !== (user?.isPublic   || false) ||
    shareSlug !== (user?.shareSlug  || '');

  return (
    <div className="min-h-screen bg-gh-bg">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-xl font-bold text-gh-text">Settings</h1>
          <p className="text-sm text-gh-muted mt-1">
            Manage your DevPulse profile and preferences.
          </p>
        </div>

        {/* ── Public profile card ── */}
        <div className="card p-6 mb-4">
          <div className="flex items-start gap-3 mb-5">
            <div className="w-9 h-9 rounded-lg bg-brand-400/10 flex items-center justify-center shrink-0">
              <Globe size={17} className="text-brand-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gh-text">Public profile</h2>
              <p className="text-xs text-gh-muted mt-1 leading-relaxed">
                Make your DevPulse analytics publicly viewable. Share the link on your
                resume, LinkedIn, or GitHub bio.
              </p>
            </div>
          </div>

          {/* Toggle */}
          <label className="flex items-center justify-between cursor-pointer mb-5 p-3 rounded-xl bg-gh-bg border border-gh-border hover:border-gh-muted transition-colors">
            <div className="flex items-center gap-3">
              {isPublic
                ? <Eye size={16} className="text-brand-400" />
                : <EyeOff size={16} className="text-gh-muted" />
              }
              <div>
                <p className="text-sm font-medium text-gh-text">
                  {isPublic ? 'Profile is public' : 'Profile is private'}
                </p>
                <p className="text-xs text-gh-muted mt-0.5">
                  {isPublic
                    ? 'Anyone with the link can view your analytics'
                    : 'Only you can see your dashboard'}
                </p>
              </div>
            </div>
            <div className="relative ml-3 shrink-0">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={isPublic}
                onChange={(e) => { setIsPublic(e.target.checked); setSaved(false); }}
              />
              <div className="w-11 h-6 rounded-full bg-gh-border peer-checked:bg-brand-600 transition-colors" />
              <div className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
            </div>
          </label>

          {/* Custom slug */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gh-muted mb-2">
              Custom URL slug
              <span className="text-gh-border ml-1">(3-30 chars, lowercase)</span>
            </label>
            <div className="flex">
              <span className="flex items-center px-3 py-2 text-xs text-gh-muted bg-gh-bg border border-gh-border border-r-0 rounded-l-lg whitespace-nowrap">
                {BASE_URL}/u/
              </span>
              <input
                type="text"
                className={`input rounded-l-none flex-1 text-sm font-mono ${
                  slugError ? 'border-red-500 focus:ring-red-500'
                  : slugStatus === 'available' ? 'border-brand-500 focus:ring-brand-500'
                  : ''
                }`}
                placeholder={user?.username || 'your-slug'}
                value={shareSlug}
                onChange={handleSlugChange}
                maxLength={30}
                disabled={!isPublic}
              />
            </div>

            {/* Slug feedback */}
            {slugError && (
              <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
                <AlertTriangle size={11} />
                {slugError}
              </p>
            )}
            {!slugError && shareSlug && isPublic && (
              <p className="text-xs text-brand-400 mt-1.5 flex items-center gap-1">
                <Check size={11} />
                Your profile URL: <span className="font-mono ml-1">{BASE_URL}/u/{shareSlug}</span>
              </p>
            )}
            {!isPublic && (
              <p className="text-xs text-gh-muted mt-1.5">
                Enable public profile to set a custom slug.
              </p>
            )}
          </div>

          {/* Live preview */}
          {isPublic && shareSlug && !slugError && (
            <div className="p-3 bg-gh-bg rounded-xl border border-gh-border">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-gh-muted mb-0.5">Profile preview URL</p>
                  <p className="text-sm font-mono text-brand-400 truncate">
                    {BASE_URL}/u/{shareSlug}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    to={`/u/${shareSlug}`}
                    target="_blank"
                    className="btn btn-sm btn-ghost no-underline flex items-center gap-1.5 text-xs"
                  >
                    <ExternalLink size={12} />
                    Preview
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Also accessible by GitHub username */}
          {isPublic && (
            <p className="text-xs text-gh-muted mt-3 flex items-center gap-1.5">
              <Link2 size={11} />
              Also accessible at{' '}
              <Link
                to={`/dev/${user?.username}`}
                target="_blank"
                className="font-mono text-gh-muted hover:text-brand-400 transition-colors"
              >
                {BASE_URL}/dev/{user?.username}
              </Link>
            </p>
          )}
        </div>

        {/* ── Security card ── */}
        <div className="card p-6 mb-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-blue-400/10 flex items-center justify-center shrink-0">
              <Shield size={17} className="text-blue-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gh-text">Security</h2>
              <p className="text-xs text-gh-muted mt-1">
                DevPulse uses read-only GitHub access. We never write to your repos.
              </p>
            </div>
          </div>
          <div className="space-y-2 text-xs text-gh-muted bg-gh-bg rounded-xl p-4 border border-gh-border font-mono">
            <p className="flex items-center gap-2">
              <Check size={11} className="text-brand-400 shrink-0" />
              Scopes: user:email, read:user, repo (read-only)
            </p>
            <p className="flex items-center gap-2">
              <Check size={11} className="text-brand-400 shrink-0" />
              GitHub token encrypted, never sent to browser
            </p>
            <p className="flex items-center gap-2">
              <Check size={11} className="text-brand-400 shrink-0" />
              JWT session — 7 day expiry, HttpOnly cookie
            </p>
            <p className="flex items-center gap-2">
              <Check size={11} className="text-brand-400 shrink-0" />
              API data cached 5 min — max 60 req/min rate limit
            </p>
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleLogout}
            className="btn btn-sm btn-ghost text-red-400 hover:text-red-300 flex items-center gap-2"
          >
            <LogOut size={14} />
            Sign out
          </button>

          <button
            onClick={handleSave}
            disabled={saving || !!slugError || !hasChanges}
            className="btn btn-md btn-primary flex items-center gap-2 min-w-[120px]"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving…
              </>
            ) : saved ? (
              <>
                <Check size={15} />
                Saved!
              </>
            ) : (
              <>
                <Save size={15} />
                Save changes
              </>
            )}
          </button>
        </div>

        {/* ── DevPulse branding ── */}
        <div className="mt-10 pt-6 border-t border-gh-border text-center">
          <div className="flex items-center justify-center gap-2 text-xs text-gh-muted">
            <Zap size={11} className="text-brand-400" />
            <span>DevPulse — Built by Yug Bhatt</span>
          </div>
        </div>

      </main>
    </div>
  );
};

export default SettingsPage;
