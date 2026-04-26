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

export const cookieOptions = () => ({
  httpOnly: true,
  secure:   process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days
  path:     '/',
});
