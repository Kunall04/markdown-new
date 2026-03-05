import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,  // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX) || 10,                // 10 requests per window
  standardHeaders: true,   // sends RateLimit-* headers (RateLimit-Limit, RateLimit-Remaining, etc.)
  legacyHeaders: false,    // disables X-RateLimit-* headers (deprecated, no reason to send both)
  message: {
    error: 'Too many requests — try again in a minute',
  },
});
export default limiter;
