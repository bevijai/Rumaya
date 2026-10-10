import rateLimit from 'express-rate-limit';

/** Throttle OTP start/verify to slow down SMS-bombing and brute-force code guessing. */
export const otpRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  // Registration, phone verification, email start, and email verification consume four requests.
  // Leave room for a resend or corrected code while retaining a strict per-IP ceiling.
  limit: 12,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts, please try again later.' },
});

/** Throttle the live translation preview (fires while typing) since it calls a paid AI API. */
export const translatePreviewRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many translation requests, please slow down.' },
});
