import rateLimit from 'express-rate-limit';

/** General API rate limiter */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests. Please try again later.', code: 'RATE_LIMIT' },
});

/** Stricter limiter for Real-Debrid proxy endpoints to avoid hitting RD rate limits */
export const realDebridRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many Real-Debrid requests. Please slow down.', code: 'RATE_LIMIT_RD' },
});
