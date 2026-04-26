import express from 'express';
import { protect, requireGitHubToken } from '../middleware/auth.middleware.js';
import { githubLimiter } from '../middleware/rateLimiter.js';
import { cachedFetch, KEYS, invalidateUser } from '../services/cache.service.js';
import {
  fetchUserProfile,
  fetchRepos,
  fetchAggregatedLanguages,
  fetchContributionCalendar,
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
router.use(protect, requireGitHubToken, githubLimiter);

// ── Helper: resolve target username ───────────────────────────
// If ?username=xyz is passed use that (public view), else use authed user
const resolveUsername = (req) =>
  req.query.username || req.user.username;

// ═══════════════════════════════════════════════════════════════
// GET /api/github/all  ← Primary endpoint — everything at once
// ═══════════════════════════════════════════════════════════════
router.get('/all', async (req, res, next) => {
  try {
    const username = resolveUsername(req);
    const token    = req.githubToken;
    const userId   = req.user._id;
    const key      = KEYS.allData(username);

    console.log(`📊 /github/all request:`, { username, hasToken: !!token, userId });

    const data = await cachedFetch({
      key,
      userId,
      useDB:  true,
      memTTL: 300,
      fetcher: async () => {
        // Fire all requests in parallel — much faster than serial
        const [ghProfile, repos, contributions, events, prs] = await Promise.allSettled([
          fetchUserProfile(token, username),
          fetchRepos(token, username),
          fetchContributionCalendar(token, username),
          fetchRecentEvents(token, username),
          fetchPullRequests(token, username),
        ]);

        const profile = ghProfile.status === 'fulfilled' ? ghProfile.value : null;
        const repoList = repos.status === 'fulfilled' ? repos.value : [];
        const contribs = contributions.status === 'fulfilled' ? contributions.value : null;
        const eventList = events.status === 'fulfilled' ? events.value : [];
        const prList = prs.status === 'fulfilled' ? prs.value : [];

        console.log(`📊 GitHub API results:`, {
          profile: ghProfile.status,
          repos: repos.status,
          contributions: contributions.status,
          events: events.status,
          prs: prs.status,
        });

        if (ghProfile.status === 'rejected') console.log(`   ❌ Profile error:`, ghProfile.reason?.message);
        if (repos.status === 'rejected') console.log(`   ❌ Repos error:`, repos.reason?.message);
        if (contributions.status === 'rejected') console.log(`   ❌ Contributions error:`, contributions.reason?.message);
        if (events.status === 'rejected') console.log(`   ❌ Events error:`, events.reason?.message);
        if (prs.status === 'rejected') console.log(`   ❌ PRs error:`, prs.reason?.message);

        // Fetch languages after we have repos (needs repo list)
        let langBytes = {};
        if (repoList.length) {
          try {
            langBytes = await fetchAggregatedLanguages(token, username, repoList);
          } catch { /* fail gracefully */ }
        }

        // ── Compute analytics ──────────────────────────────
        const heatmap        = buildHeatmapData(contribs?.contributionCalendar);
        const streaks        = calcStreaks(heatmap);
        const languages      = buildLanguageStats(langBytes);
        const commitAnalytics = buildCommitAnalytics(eventList);
        const prStats        = buildPRStats(prList);
        const repoStats      = buildRepoStats(repoList);
        const summary        = buildSummaryStats({
          ghProfile:       profile,
          repos:           repoStats,
          streaks,
          contributions:   contribs,
          languages,
          prStats,
          commitAnalytics,
        });

        return {
          profile,
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

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/github/overview ──────────────────────────────────
router.get('/overview', async (req, res, next) => {
  try {
    const username = resolveUsername(req);
    const token    = req.githubToken;
    const key      = KEYS.overview(username);

    const data = await cachedFetch({
      key,
      memTTL: 600, // 10 min — profile changes less often
      fetcher: () => fetchUserProfile(token, username),
    });

    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// ── GET /api/github/repos ─────────────────────────────────────
router.get('/repos', async (req, res, next) => {
  try {
    const username = resolveUsername(req);
    const token    = req.githubToken;
    const key      = KEYS.repos(username);

    const repos = await cachedFetch({
      key,
      memTTL: 300,
      fetcher: () => fetchRepos(token, username),
    });

    const repoStats = buildRepoStats(repos);
    res.json({ success: true, data: repoStats });
  } catch (err) { next(err); }
});

// ── GET /api/github/languages ─────────────────────────────────
router.get('/languages', async (req, res, next) => {
  try {
    const username = resolveUsername(req);
    const token    = req.githubToken;
    const key      = KEYS.languages(username);

    const data = await cachedFetch({
      key,
      memTTL: 600,
      fetcher: async () => {
        const repos = await fetchRepos(token, username);
        const langBytes = await fetchAggregatedLanguages(token, username, repos);
        return buildLanguageStats(langBytes);
      },
    });

    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// ── GET /api/github/contributions ────────────────────────────
router.get('/contributions', async (req, res, next) => {
  try {
    const username = resolveUsername(req);
    const token    = req.githubToken;
    const key      = KEYS.contributions(username);

    const data = await cachedFetch({
      key,
      memTTL: 300,
      fetcher: async () => {
        const contribs = await fetchContributionCalendar(token, username);
        const heatmap  = buildHeatmapData(contribs?.contributionCalendar);
        const streaks  = calcStreaks(heatmap);
        return {
          heatmap,
          streaks,
          totals: {
            totalContributions: contribs?.contributionCalendar?.totalContributions || 0,
            totalCommits:       contribs?.totalCommitContributions || 0,
            totalPRs:           contribs?.totalPullRequestContributions || 0,
            totalIssues:        contribs?.totalIssueContributions || 0,
          },
        };
      },
    });

    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// ── GET /api/github/commits ───────────────────────────────────
router.get('/commits', async (req, res, next) => {
  try {
    const username = resolveUsername(req);
    const token    = req.githubToken;
    const key      = KEYS.commits(username);

    const data = await cachedFetch({
      key,
      memTTL: 300,
      fetcher: async () => {
        const events = await fetchRecentEvents(token, username);
        return buildCommitAnalytics(events);
      },
    });

    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// ── GET /api/github/stats ─────────────────────────────────────
router.get('/stats', async (req, res, next) => {
  try {
    const username = resolveUsername(req);
    const token    = req.githubToken;
    const key      = KEYS.stats(username);

    const data = await cachedFetch({
      key,
      memTTL: 300,
      fetcher: async () => {
        const [ghProfile, repos, contributions, events, prs] = await Promise.allSettled([
          fetchUserProfile(token, username),
          fetchRepos(token, username),
          fetchContributionCalendar(token, username),
          fetchRecentEvents(token, username),
          fetchPullRequests(token, username),
        ]);

        const repoList = repos.status === 'fulfilled' ? repos.value : [];
        const contribs = contributions.status === 'fulfilled' ? contributions.value : null;
        const eventList = events.status === 'fulfilled' ? events.value : [];
        const prList = prs.status === 'fulfilled' ? prs.value : [];

        const heatmap  = buildHeatmapData(contribs?.contributionCalendar);
        const streaks  = calcStreaks(heatmap);
        const langBytes = repoList.length
          ? await fetchAggregatedLanguages(token, username, repoList).catch(() => ({}))
          : {};
        const languages      = buildLanguageStats(langBytes);
        const commitAnalytics = buildCommitAnalytics(eventList);
        const prStats        = buildPRStats(prList);
        const repoStats      = buildRepoStats(repoList);

        return buildSummaryStats({
          ghProfile: ghProfile.status === 'fulfilled' ? ghProfile.value : null,
          repos: repoStats,
          streaks,
          contributions: contribs,
          languages,
          prStats,
          commitAnalytics,
        });
      },
    });

    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// ── POST /api/github/refresh — bust cache ────────────────────
router.post('/refresh', async (req, res) => {
  invalidateUser(req.user.username);
  res.json({ success: true, message: 'Cache cleared. Next request will fetch fresh data.' });
});

export default router;
