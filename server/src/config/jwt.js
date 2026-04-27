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
  const hasVercelClient = process.env.CLIENT_URL?.includes('vercel.app');
  
  // Cross-site cookies require SameSite=None and Secure=true
  const isCrossSite = isProd || hasVercelClient;

  return {
    httpOnly: true,
    secure:   isCrossSite, 
    sameSite: isCrossSite ? 'none' : 'lax',
    maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days
    path:     '/',
  };
};
