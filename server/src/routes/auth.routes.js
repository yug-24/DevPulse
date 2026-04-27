import express from 'express';
import passport from 'passport';
import { signToken, cookieOptions } from '../config/jwt.js';
import { protect } from '../middleware/auth.middleware.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import User from '../models/User.model.js';

const router = express.Router();

// ── GET /api/auth/github ──────────────────────────────────────
// Kick off GitHub OAuth — redirects to github.com
router.get(
  '/github',
  authLimiter,
  passport.authenticate('github', {
    scope: ['user:email', 'read:user', 'repo'],
    session: false,
  })
);

// ── GET /api/auth/github/callback ────────────────────────────
// GitHub redirects here after user approves
router.get(
  '/github/callback',
  authLimiter,
  passport.authenticate('github', {
    session: false,
    failureRedirect: `${(process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '')}/login?error=oauth_failed`,
  }),
  (req, res) => {
    const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');
    try {
      // Issue JWT
      const token = signToken({
        sub:      req.user._id.toString(),
        username: req.user.username,
        name:     req.user.name,
      });

      // Set HttpOnly cookie
      res.cookie('token', token, cookieOptions());

      // Redirect to dashboard — no token in URL (security)
      res.redirect(`${clientUrl}/dashboard`);
    } catch (err) {
      console.error('OAuth callback error:', err);
      res.redirect(`${clientUrl}/login?error=server_error`);
    }
  }
);

// ── GET /api/auth/me ──────────────────────────────────────────
router.get('/me', protect, (req, res) => {
  res.json({
    success: true,
    data: { user: req.user.toPublicProfile() },
  });
});

// ── POST /api/auth/logout ─────────────────────────────────────
router.post('/logout', protect, (req, res) => {
  res.clearCookie('token', { path: '/' });
  res.json({ success: true, message: 'Logged out successfully.' });
});

// ── GET /api/auth/status ──────────────────────────────────────
// Quick check — is this session valid? Used by frontend on load
router.get('/status', protect, (req, res) => {
  res.json({
    success:       true,
    authenticated: true,
    user: {
      _id:      req.user._id,
      username: req.user.username,
      name:     req.user.name,
      avatar:   req.user.avatar,
    },
  });
});

// ── PATCH /api/auth/profile ───────────────────────────────────
// Update profile preferences (isPublic, shareSlug)
router.patch('/profile', protect, async (req, res, next) => {
  try {
    const { isPublic, shareSlug } = req.body;
    const updates = {};

    if (typeof isPublic === 'boolean') updates.isPublic = isPublic;

    if (shareSlug !== undefined) {
      if (shareSlug === null || shareSlug === '') {
        updates.shareSlug = null;
      } else {
        // Validate slug format: lowercase, letters/numbers/hyphens, 3-30 chars
        const slug = String(shareSlug).toLowerCase().trim();
        if (!/^[a-z0-9-]{3,30}$/.test(slug)) {
          return res.status(400).json({
            success: false,
            message: 'Slug must be 3-30 characters: lowercase letters, numbers, and hyphens only.',
          });
        }

        // Check uniqueness
        const existing = await User.findOne({
          shareSlug: slug,
          _id: { $ne: req.user._id },
        });
        if (existing) {
          return res.status(409).json({
            success: false,
            message: 'That slug is already taken. Try another.',
          });
        }
        updates.shareSlug = slug;
      }
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new:             true,
      runValidators:   true,
    });

    res.json({
      success: true,
      message: 'Profile updated.',
      data:    { user: user.toPublicProfile() },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
