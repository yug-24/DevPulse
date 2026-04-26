import { verifyToken } from '../config/jwt.js';
import User from '../models/User.model.js';

/**
 * Protect routes — reads JWT from:
 *   1. Authorization: Bearer <token>   (API clients)
 *   2. Cookie: token=<token>           (browser SPA)
 */
export const protect = async (req, res, next) => {
  try {
    let token = null;

    // Priority 1: Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    // Priority 2: HttpOnly cookie
    if (!token && req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Please connect your GitHub account.',
      });
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      const message =
        err.name === 'TokenExpiredError'
          ? 'Session expired. Please reconnect.'
          : 'Invalid session token.';
      return res.status(401).json({ success: false, message });
    }

    const user = await User.findById(decoded.sub).select('-githubAccessToken');
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User account not found or inactive.',
      });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(500).json({ success: false, message: 'Authentication error.' });
  }
};

/**
 * Attach user if token present — never blocks request if no token.
 * Used for public profile routes that show extra data when logged in.
 */
export const optionalAuth = async (req, res, next) => {
  try {
    let token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;
    if (!token) return next();

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.sub).select('-githubAccessToken');
    if (user?.isActive) req.user = user;
  } catch {
    // Silent — optional auth never blocks
  }
  next();
};

/**
 * Require the GitHub access token to be present on the user.
 * Used for routes that actually call the GitHub API.
 */
export const requireGitHubToken = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('+githubAccessToken');
    if (!user?.githubAccessToken) {
      return res.status(401).json({
        success: false,
        message: 'GitHub access token missing. Please reconnect your account.',
        code: 'GITHUB_TOKEN_MISSING',
      });
    }
    req.githubToken = user.githubAccessToken;
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};
