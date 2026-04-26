import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, LogOut, Settings, ChevronDown,
  Github, Zap, ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn, githubUrl } from '../../utils/helpers';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (!menuRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  ];

  return (
    <header className="sticky top-0 z-40 bg-gh-bg border-b border-gh-border backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-6">

        {/* Logo */}
        <Link
          to="/dashboard"
          className="flex items-center gap-2 shrink-0 no-underline group"
        >
          <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
            <Zap size={14} className="text-white" />
          </div>
          <span className="font-bold text-gh-text text-sm tracking-tight group-hover:text-brand-400 transition-colors">
            DevPulse
          </span>
        </Link>

        {/* Nav links */}
        <nav className="hidden sm:flex items-center gap-1">
          {navLinks.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors no-underline',
                location.pathname === to
                  ? 'bg-gh-surface text-gh-text'
                  : 'text-gh-muted hover:text-gh-text hover:bg-gh-surface'
              )}
            >
              <Icon size={15} />
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex-1" />

        {/* View public profile */}
        {user?.isPublic && user?.shareSlug && (
          <a
            href={`/u/${user.shareSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 text-xs text-gh-muted hover:text-gh-text transition-colors no-underline"
          >
            <ExternalLink size={13} />
            Public profile
          </a>
        )}

        {/* User menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setOpen((v) => !v)}
            className={cn(
              'flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg transition-colors',
              'hover:bg-gh-surface',
              open && 'bg-gh-surface'
            )}
          >
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-7 h-7 rounded-full"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-gh-border flex items-center justify-center text-xs font-medium text-gh-text">
                {user?.name?.[0] || '?'}
              </div>
            )}
            <span className="hidden sm:block text-sm text-gh-text max-w-[120px] truncate">
              {user?.username}
            </span>
            <ChevronDown
              size={13}
              className={cn(
                'text-gh-muted transition-transform duration-200 hidden sm:block',
                open && 'rotate-180'
              )}
            />
          </button>

          {/* Dropdown */}
          {open && (
            <div className="absolute right-0 top-full mt-1.5 w-56 bg-gh-surface border border-gh-border rounded-xl shadow-xl overflow-hidden animate-scale-in z-50">
              {/* User info */}
              <div className="px-4 py-3 border-b border-gh-border">
                <p className="text-sm font-medium text-gh-text truncate">{user?.name}</p>
                <p className="text-xs text-gh-muted mt-0.5">@{user?.username}</p>
              </div>

              <div className="py-1">
                {/* GitHub profile */}
                <a
                  href={githubUrl(user?.username)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gh-muted hover:text-gh-text hover:bg-gh-border transition-colors no-underline"
                  onClick={() => setOpen(false)}
                >
                  <Github size={15} />
                  GitHub profile
                </a>

                <Link
                  to="/settings"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gh-muted hover:text-gh-text hover:bg-gh-border transition-colors no-underline"
                  onClick={() => setOpen(false)}
                >
                  <Settings size={15} />
                  Settings
                </Link>

                <div className="border-t border-gh-border my-1" />

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-900/20 transition-colors"
                >
                  <LogOut size={15} />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
