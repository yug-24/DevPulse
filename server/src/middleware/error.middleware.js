export const errorHandler = (err, req, res, next) => {
  let status  = err.statusCode || err.status || 500;
  let message = err.message    || 'Internal server error';

  // Mongoose validation
  if (err.name === 'ValidationError') {
    status  = 400;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    status  = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `${field} already exists.`;
  }

  // Mongoose invalid ObjectId
  if (err.name === 'CastError') {
    status  = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // GitHub API rate limit
  if (err.response?.status === 403 && err.response?.headers?.['x-ratelimit-remaining'] === '0') {
    status  = 429;
    message = 'GitHub API rate limit reached. Please try again in an hour.';
  }

  // GitHub API 401 — token expired or revoked
  if (err.response?.status === 401 && err.config?.url?.includes('api.github.com')) {
    status  = 401;
    message = 'GitHub token expired. Please reconnect your account.';
  }

  console.error(`❌ [${req.method}] ${req.path} → ${status}: ${message}`);

  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};
