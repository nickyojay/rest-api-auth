import rateLimit from 'express-rate-limit'

// Global limiter — applies to all routes.
// Allows 100 requests per IP per 15 minutes.
// This prevents general API abuse.
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
})

// Strict limiter for login — allows only 10 attempts per IP per 15 minutes.
// After 10 failed login attempts the IP is blocked until the window resets.
// This makes brute force attacks take hours instead of seconds.
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
})