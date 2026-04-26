import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import passport from 'passport';

import connectDB from './config/database.js';
import { configurePassport } from './config/passport.js';
import { globalLimiter } from './middleware/rateLimiter.js';
import { errorHandler, notFound } from './middleware/error.middleware.js';

import authRoutes   from './routes/auth.routes.js';
import githubRoutes from './routes/github.routes.js';
import userRoutes   from './routes/user.routes.js';

const app = express();

// ── Trust proxy (Railway / Vercel) ────────────────────────────
app.set('trust proxy', 1);

// ── Security headers ──────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy:  { policy: 'cross-origin' },
    contentSecurityPolicy: false, // Managed by Vercel on frontend
    hsts: process.env.NODE_ENV === 'production'
      ? { maxAge: 31536000, includeSubDomains: true }
      : false,
  })
);

// ── CORS ───────────────────────────────────────────────────────
const ALLOWED_ORIGIN = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || origin === ALLOWED_ORIGIN) return cb(null, true);
      cb(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ── Standard middleware ───────────────────────────────────────
app.use(globalLimiter);
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// ── Passport ──────────────────────────────────────────────────
configurePassport();
app.use(passport.initialize());

// ── Health check ──────────────────────────────────────────────
app.get('/health', (req, res) =>
  res.json({
    status:      'ok',
    timestamp:   new Date().toISOString(),
    uptime:      Math.round(process.uptime()),
    environment: process.env.NODE_ENV,
  })
);

// ── API Routes ────────────────────────────────────────────────
app.use('/api/auth',   authRoutes);
app.use('/api/github', githubRoutes);
app.use('/api/users',  userRoutes);

// ── Error handling ────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '5000', 10);

const start = async () => {
  await connectDB();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 DevPulse server`);
    console.log(`   Mode:    ${process.env.NODE_ENV || 'development'}`);
    console.log(`   Port:    ${PORT}`);
    console.log(`   Client:  ${ALLOWED_ORIGIN}`);
    console.log(`   Health:  http://localhost:${PORT}/health\n`);
  });
};

const shutdown = (sig) => {
  console.log(`\n${sig} — shutting down`);
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
  if (process.env.NODE_ENV !== 'production') process.exit(1);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  process.exit(1);
});

start();
