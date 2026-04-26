import NodeCache from 'node-cache';
import User from '../models/User.model.js';

// ── L1: In-process memory cache (fast, per-server-instance) ──
// TTL: 5 min for API data, 10 min for heavy analytics
const memCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

// ── Cache key builders ────────────────────────────────────────
export const KEYS = {
  overview:      (u) => `overview:${u}`,
  repos:         (u) => `repos:${u}`,
  languages:     (u) => `languages:${u}`,
  contributions: (u) => `contributions:${u}`,
  commits:       (u) => `commits:${u}`,
  stats:         (u) => `stats:${u}`,
  pullRequests:  (u) => `prs:${u}`,
  allData:       (u) => `all:${u}`,
};

// ── L1 helpers ────────────────────────────────────────────────
export const getFromMemory = (key) => memCache.get(key) ?? null;

export const setInMemory = (key, value, ttl = 300) => {
  memCache.set(key, value, ttl);
};

export const invalidateUser = (username) => {
  Object.values(KEYS).forEach((fn) => memCache.del(fn(username)));
};

// ── L2: MongoDB-backed cache ──────────────────────────────────
// Survives server restarts. TTL: 30 min for full analytics.
const DB_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

export const getFromDB = async (userId) => {
  const user = await User.findById(userId)
    .select('+cachedStats +cachedAt')
    .lean();

  if (!user?.cachedStats || !user?.cachedAt) return null;

  const age = Date.now() - new Date(user.cachedAt).getTime();
  if (age > DB_CACHE_TTL_MS) return null;

  return user.cachedStats;
};

export const saveToDBCache = async (userId, stats) => {
  await User.findByIdAndUpdate(userId, {
    cachedStats: stats,
    cachedAt:    new Date(),
  });
};

// ── Main cache-or-fetch helper ────────────────────────────────
/**
 * Tries L1 memory → L2 DB → fetcher fn.
 * Writes result back to both layers.
 */
export const cachedFetch = async ({
  key,
  userId,
  fetcher,
  memTTL = 300,
  useDB  = false,
}) => {
  // L1 hit
  const mem = getFromMemory(key);
  if (mem) return mem;

  // L2 hit (only for full analytics bundle)
  if (useDB && userId) {
    const db = await getFromDB(userId);
    if (db) {
      setInMemory(key, db, memTTL);
      return db;
    }
  }

  // Miss — call the fetcher
  const data = await fetcher();
  setInMemory(key, data, memTTL);
  if (useDB && userId) {
    saveToDBCache(userId, data).catch(() => {}); // Non-blocking write
  }

  return data;
};
