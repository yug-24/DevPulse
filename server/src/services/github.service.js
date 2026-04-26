import axios from 'axios';

const GH_REST    = 'https://api.github.com';
const GH_GRAPHQL = 'https://api.github.com/graphql';

// ── Axios instance factory ────────────────────────────────────
const ghClient = (token) =>
  axios.create({
    baseURL: GH_REST,
    headers: {
      Authorization:        `Bearer ${token}`,
      Accept:               'application/vnd.github.v3+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    timeout: 15000,
  });

// ── GraphQL helper ────────────────────────────────────────────
const gql = async (token, query, variables = {}) => {
  const { data } = await axios.post(
    GH_GRAPHQL,
    { query, variables },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    }
  );
  if (data.errors?.length) {
    const msg = data.errors[0]?.message || 'GraphQL error';
    throw new Error(msg);
  }
  return data.data;
};

// ── Paginate helper (REST) ────────────────────────────────────
const paginate = async (client, url, params = {}, maxPages = 10) => {
  const results = [];
  let page = 1;

  while (page <= maxPages) {
    const { data, headers } = await client.get(url, {
      params: { ...params, per_page: 100, page },
    });

    if (!data?.length) break;
    results.push(...data);

    // If we got fewer than 100 results, no next page
    if (data.length < 100) break;

    // Respect GitHub's link header
    const link = headers?.link || '';
    if (!link.includes('rel="next"')) break;

    page++;
  }

  return results;
};

// ═══════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════

/**
 * Fetch authenticated user's own profile
 */
export const fetchAuthUser = async (token) => {
  const client = ghClient(token);
  const { data } = await client.get('/user');
  return data;
};

/**
 * Fetch any user's public profile
 */
export const fetchUserProfile = async (token, username) => {
  const client = ghClient(token);
  const { data } = await client.get(`/users/${username}`);
  return data;
};

/**
 * Fetch all repos (own + collaborated) — up to 1000
 */
export const fetchRepos = async (token, username) => {
  const client = ghClient(token);

  // Fetch owned repos
  const owned = await paginate(client, '/user/repos', {
    type:      'owner',
    sort:      'updated',
    direction: 'desc',
  });

  return owned;
};

/**
 * Fetch language bytes for a specific repo
 */
export const fetchRepoLanguages = async (token, owner, repo) => {
  const client = ghClient(token);
  try {
    const { data } = await client.get(`/repos/${owner}/${repo}/languages`);
    return data;
  } catch {
    return {};
  }
};

/**
 * Aggregate language bytes across all repos
 * Caps at top 20 repos to stay within rate limits
 */
export const fetchAggregatedLanguages = async (token, username, repos) => {
  const client = ghClient(token);
  const topRepos = repos
    .filter((r) => !r.fork && !r.archived)
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 20);

  const langMaps = await Promise.all(
    topRepos.map((r) =>
      client
        .get(`/repos/${r.full_name}/languages`)
        .then((res) => res.data)
        .catch(() => ({}))
    )
  );

  // Sum bytes across all repos
  const totals = {};
  for (const map of langMaps) {
    for (const [lang, bytes] of Object.entries(map)) {
      totals[lang] = (totals[lang] || 0) + bytes;
    }
  }

  // Sort by bytes descending
  const sorted = Object.entries(totals)
    .sort(([, a], [, b]) => b - a)
    .reduce((acc, [lang, bytes]) => ({ ...acc, [lang]: bytes }), {});

  return sorted;
};

/**
 * Fetch contribution calendar via GraphQL — the green squares data
 * This is ONLY available through GraphQL, not REST API
 */
export const fetchContributionCalendar = async (token, username) => {
  const query = `
    query ContributionCalendar($username: String!) {
      user(login: $username) {
        contributionsCollection {
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                date
                contributionCount
                color
              }
            }
          }
          totalCommitContributions
          totalPullRequestContributions
          totalIssueContributions
          totalRepositoryContributions
          restrictedContributionsCount
        }
      }
    }
  `;

  const data = await gql(token, query, { username });
  return data?.user?.contributionsCollection || null;
};

/**
 * Fetch recent commits across all repos
 * Uses the events API — gets last 300 events (GitHub max)
 */
export const fetchRecentEvents = async (token, username) => {
  const client = ghClient(token);
  const events = await paginate(
    client,
    `/users/${username}/events`,
    {},
    3 // 3 pages = up to 300 events
  );
  return events;
};

/**
 * Fetch pull requests created by user
 */
export const fetchPullRequests = async (token, username) => {
  const client = ghClient(token);
  try {
    const { data } = await client.get('/search/issues', {
      params: {
        q:        `type:pr author:${username}`,
        sort:     'created',
        order:    'desc',
        per_page: 100,
      },
    });
    return data.items || [];
  } catch (err) {
    // Search API has stricter rate limits — fail gracefully
    console.warn('PR fetch failed (rate limit?):', err.message);
    return [];
  }
};

/**
 * Fetch rate limit status — useful for debugging
 */
export const fetchRateLimit = async (token) => {
  const client = ghClient(token);
  const { data } = await client.get('/rate_limit');
  return data.rate;
};

/**
 * Fetch commit activity for a repo (weekly aggregates)
 */
export const fetchRepoCommitActivity = async (token, fullName) => {
  const client = ghClient(token);
  try {
    const { data } = await client.get(
      `/repos/${fullName}/stats/commit_activity`
    );
    return data || [];
  } catch {
    return [];
  }
};

/**
 * Fetch user's starred repos count + top starred owned repos
 */
export const fetchStarredCount = async (token) => {
  const client = ghClient(token);
  try {
    // HEAD request to get count from Link header
    const { headers } = await client.get('/user/starred', {
      params: { per_page: 1 },
    });
    // Parse total from Link header or just return first page length
    const link = headers?.link || '';
    const match = link.match(/page=(\d+)>; rel="last"/);
    return match ? parseInt(match[1], 10) : 0;
  } catch {
    return 0;
  }
};
