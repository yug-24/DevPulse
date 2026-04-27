import jwt from 'jsonwebtoken';

const SECRET  = () => process.env.JWT_SECRET;
const EXPIRES = () => process.env.JWT_EXPIRES_IN || '7d';

export const signToken = (payload) =>
  jwt.sign(payload, SECRET(), {
    expiresIn: EXPIRES(),
    issuer:   'devpulse',
    audience: 'devpulse-client',
  });

export const verifyToken = (token) =>
  jwt.verify(token, SECRET(), {
    issuer:   'devpulse',
    audience: 'devpulse-client',
  });

export const cookieOptions = () => {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure:   isProd,
    // Cross-site cookies (Vercel -> Railway) require SameSite=None and Secure=true
    sameSite: isProd ? 'none' : 'lax',
    maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days
    path:     '/',
  };
};
