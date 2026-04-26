import express from 'express';
import User from '../models/User.model.js';
import { optionalAuth } from '../middleware/auth.middleware.js';
import { cachedFetch, KEYS } from '../services/cache.service.js';
import {
  fetchContributionCalendar,
  fetchRepos,
  fetchAggregatedLanguages,
  fetchRecentEvents,
  fetchPullRequests,
} from '../services/github.service.js';
import {
  buildHeatmapData,
  calcStreaks,
  buildLanguageStats,
  buildCommitAnalytics,
  buildPRStats,
  buildRepoStats,
  buildSummaryStats,
} from '../services/analytics.service.js';

const router = express.Router();

// ── Helper: fetch public analytics for a given user document ──
// Reads from cache first — same cache the dashboard uses,
// so a visitor gets instant load after the owner has visited theirs.
const getPublicAnalytics = async (user) => {
  const key = KEYS.allData(user.username);

  return cachedFetch({
    key,
    userId:  user._id,
    useDB:   true,
    memTTL:  600, // 10 min for public view
    fetcher: async () => {
      // For public profiles we use the owner's stored GitHub token
      const userWithToken = await User.findById(user._id)
        .select('+githubAccessToken')
        .lean();

      const token = userWithToken?.githubAccessToken;
      if (!token) return null;

      const username = user.username;
      const [contributions, repos, events, prs] = await Promise.allSettled([
        fetchContributionCalendar(token, username),
        fetchRepos(token, username),
        fetchRecentEvents(token, username),
        fetchPullRequests(token, username),
      ]);

      const contribs  = contributions.status === 'fulfilled' ? contributions.value : null;
      const repoList  = repos.status === 'fulfilled' ? repos.value : [];
      const eventList = events.status === 'fulfilled' ? events.value : [];
      const prList    = prs.status === 'fulfilled' ? prs.value : [];

      let langBytes = {};
      if (repoList.length) {
        langBytes = await fetchAggregatedLanguages(token, username, repoList).catch(() => ({}));
      }

      const heatmap         = buildHeatmapData(contribs?.contributionCalendar);
      const streaks         = calcStreaks(heatmap);
      const languages       = buildLanguageStats(langBytes);
      const commitAnalytics = buildCommitAnalytics(eventList);
      const prStats         = buildPRStats(prList);
      const repoStats       = buildRepoStats(repoList);
      const summary         = buildSummaryStats({
        ghProfile:     user.githubProfile,
        repos:         repoStats,
        streaks,
        contributions: contribs,
        languages,
        prStats,
        commitAnalytics,
      });

      return {
        profile: user.githubProfile,
        summary,
        heatmap,
        streaks,
        languages,
        commitAnalytics,
        prStats,
        repoStats,
        contribs: {
          totalContributions: contribs?.contributionCalendar?.totalContributions || 0,
          totalCommits:       contribs?.totalCommitContributions || 0,
          totalPRs:           contribs?.totalPullRequestContributions || 0,
          totalIssues:        contribs?.totalIssueContributions || 0,
        },
        fetchedAt: new Date().toISOString(),
      };
    },
  });
};

// ═══════════════════════════════════════════════════════════════
// IMPORTANT: /slug/:slug MUST come before /:username
// otherwise Express matches "slug" as a GitHub username
// ═══════════════════════════════════════════════════════════════

// ── GET /api/users/slug/:slug ─────────────────────────────────
router.get('/slug/:slug', optionalAuth, async (req, res, next) => {
  try {
    const slug = req.params.slug.toLowerCase().trim();

    if (!/^[a-z0-9-]{3,30}$/.test(slug)) {
      return res.status(400).json({ success: false, message: 'Invalid slug format.' });
    }

    const user = await User.findOne({
      shareSlug: slug,
      isPublic:  true,
      isActive:  true,
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Profile not found.' });
    }

    const isOwner    = req.user?._id?.toString() === user._id.toString();
    const analytics  = await getPublicAnalytics(user);

    res.json({
      success: true,
      data: {
        user:      user.toPublicProfile(),
        analytics,
        isOwner,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/users/:username ──────────────────────────────────
router.get('/:username', optionalAuth, async (req, res, next) => {
  try {
    const username = req.params.username.toLowerCase().trim();

    // Basic sanity check — GitHub usernames: letters, numbers, hyphens, max 39
    if (!/^[a-z0-9-]{1,39}$/.test(username)) {
      return res.status(400).json({ success: false, message: 'Invalid username format.' });
    }

    const user = await User.findOne({ username, isActive: true });

    if (!user) {
      return res.status(404).json({
        success:  false,
        message:  `No DevPulse profile found for @${username}.`,
        notFound: true,
      });
    }

    const isOwner = req.user?._id?.toString() === user._id.toString();

    // Private profile — only owner can see
    if (!user.isPublic && !isOwner) {
      return res.status(403).json({
        success:  false,
        message:  'This profile is private.',
        isPrivate: true,
      });
    }

    const analytics = await getPublicAnalytics(user);

    res.json({
      success: true,
      data: {
        user:      user.toPublicProfile(),
        analytics,
        isOwner,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
