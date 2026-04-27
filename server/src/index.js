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

import authRoutes from './routes/auth.routes.js';
import githubRoutes from './routes/github.routes.js';
import userRoutes from './routes/user.routes.js';

// ── Validate required env vars before doing anything else ─────
const REQUIRED_ENV = ['NODE_ENV'];
// Add any vars your app truly needs at boot (e.g. JWT_SECRET, SESSION_SECRET)
// Remove or adjust as appropriate:
// const REQUIRED_ENV = ['NODE_ENV', 'JWT_SECRET', 'MONGODB_URI'];
const missingEnv = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missingEnv.length) {
  console.error(`❌ Missing required environment variables: ${missingEnv.join(', ')}`);
  process.exit(1);
}

const app = express();

// ── Trust proxy (Railway / Vercel) ────────────────────────────
app.set('trust proxy', 1);

// ── Security headers ──────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false,
    hsts: process.env.NODE_ENV === 'production'
      ? { maxAge: 31536000, includeSubDomains: true }
      : false,
  })
);

// ── CORS ───────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  process.env.CLIENT_URL,
  'https://dev-pulse-rho.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean).map(url => url.trim().replace(/\/$/, ''));

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      
      const sanitizedOrigin = origin.trim().replace(/\/$/, '');
      const isAllowed = 
        ALLOWED_ORIGINS.includes(sanitizedOrigin) || 
        sanitizedOrigin.endsWith('.vercel.app') ||
        sanitizedOrigin === 'https://dev-pulse-rho.vercel.app'; // Explicitly allow the user's domain

      if (isAllowed) {
        return cb(null, true);
      }
      
      console.warn(`⚠️  CORS blocked origin: "${origin}"`);
      console.warn(`   Allowed Origins:`, ALLOWED_ORIGINS);
      cb(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
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
try {
  configurePassport();
} catch (err) {
  console.error('❌ Passport configuration failed:', err.message);
  process.exit(1);
}
app.use(passport.initialize());

// ── Health check ──────────────────────────────────────────────
app.get('/health', (_req, res) =>
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
    environment: process.env.NODE_ENV,
    db: global.__dbConnected ? 'connected' : 'connecting',
  })
);

// ── API Routes ────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/github', githubRoutes);
app.use('/api/users', userRoutes);

// ── Error handling ────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '5000', 10);

const start = async () => {
  // Bind the server FIRST so Railway's healthcheck can reach /health
  // immediately while DB connects in the background.
  await new Promise((resolve, reject) => {
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n🚀 DevPulse server`);
      console.log(`   Mode:    ${process.env.NODE_ENV || 'development'}`);
      console.log(`   Port:    ${PORT}`);
      console.log(`   Client:  ${ALLOWED_ORIGINS.join(', ')}`);
      console.log(`   Health:  http://localhost:${PORT}/health\n`);
      resolve(server);
    });

    server.on('error', (err) => {
      console.error('❌ Failed to bind server:', err.message);
      reject(err);
    });
  });

  // Connect to DB after the server is already accepting requests
  try {
    await connectDB();
    global.__dbConnected = true;
    console.log('✅ Database connected');
  } catch (err) {
    console.error('⚠️  Database connection failed (server still running):', err.message);
    // Don't exit — let the server serve /health and handle retries
  }
};

const shutdown = (sig) => {
  console.log(`\n${sig} — shutting down gracefully`);
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
  if (process.env.NODE_ENV !== 'production') process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  process.exit(1);
});

start().catch((err) => {
  console.error('❌ Server failed to start:', err.message);
  process.exit(1);
});