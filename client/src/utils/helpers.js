import { clsx } from 'clsx';

export const cn = (...inputs) => clsx(inputs);

// Format large numbers: 12345 → "12.3k"
export const formatNumber = (n) => {
  if (!n && n !== 0) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`;
  return n.toString();
};

// Time ago: "3 days ago"
export const timeAgo = (date) => {
  const secs = Math.floor((Date.now() - new Date(date)) / 1000);
  const intervals = [
    { label: 'year',   s: 31536000 },
    { label: 'month',  s: 2592000  },
    { label: 'week',   s: 604800   },
    { label: 'day',    s: 86400    },
    { label: 'hour',   s: 3600     },
    { label: 'minute', s: 60       },
  ];
  for (const { label, s } of intervals) {
    const count = Math.floor(secs / s);
    if (count >= 1) return `${count} ${label}${count !== 1 ? 's' : ''} ago`;
  }
  return 'just now';
};

// Format date: "Jan 2024"
export const formatMonth = (date) =>
  new Date(date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

// Format date: "Jan 15, 2024"
export const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

// Get initials from name
export const getInitials = (name = '') =>
  name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();

// Language color map — same as GitHub
export const LANGUAGE_COLORS = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python:     '#3572A5',
  Java:       '#b07219',
  Go:         '#00ADD8',
  Rust:       '#dea584',
  'C++':      '#f34b7d',
  C:          '#555555',
  'C#':       '#178600',
  PHP:        '#4F5D95',
  Ruby:       '#701516',
  Swift:      '#F05138',
  Kotlin:     '#A97BFF',
  Dart:       '#00B4AB',
  Vue:        '#41b883',
  HTML:       '#e34c26',
  CSS:        '#563d7c',
  Shell:      '#89e051',
  Dockerfile: '#384d54',
  default:    '#8b949e',
};

export const getLangColor = (lang) =>
  LANGUAGE_COLORS[lang] || LANGUAGE_COLORS.default;

// Build GitHub profile URL
export const githubUrl = (username) => `https://github.com/${username}`;

// Truncate string
export const truncate = (str, n = 60) =>
  str?.length > n ? `${str.slice(0, n - 1)}…` : str;

// Calculate streak from sorted date array (YYYY-MM-DD strings)
export const calcStreak = (dates) => {
  if (!dates?.length) return { current: 0, longest: 0 };
  const sorted = [...new Set(dates)].sort().reverse();
  let current = 0, longest = 0, streak = 1;
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  // Current streak — must include today or yesterday
  if (sorted[0] === today || sorted[0] === yesterday) {
    current = 1;
    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i - 1]);
      const curr = new Date(sorted[i]);
      const diff = (prev - curr) / 86400000;
      if (diff === 1) { current++; }
      else break;
    }
  }

  // Longest streak
  streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diff = (prev - curr) / 86400000;
    if (diff === 1) { streak++; longest = Math.max(longest, streak); }
    else streak = 1;
  }
  longest = Math.max(longest, current);

  return { current, longest };
};
