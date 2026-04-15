/**
 * Simple in-memory rate limiter for Vercel Functions (Fluid Compute).
 *
 * Fluid Compute reuses function instances across concurrent requests,
 * so in-memory stores provide real protection per-instance. For
 * distributed rate limiting across all instances, use Upstash Redis.
 *
 * Usage:
 *   import { rateLimit } from './_lib/rateLimit.js';
 *   const limiter = rateLimit({ windowMs: 60_000, max: 30 });
 *
 *   export default async function handler(req, res) {
 *     const { limited } = limiter(req);
 *     if (limited) return res.status(429).json({ error: 'Too many requests' });
 *     // ... handler logic
 *   }
 */

const stores = new Map();

/**
 * @param {Object} opts
 * @param {number} opts.windowMs  - Time window in milliseconds (default: 60s)
 * @param {number} opts.max       - Max requests per window (default: 30)
 * @param {string} [opts.name]    - Store name to share limits across routes
 */
export function rateLimit({ windowMs = 60_000, max = 30, name = 'default' } = {}) {
  if (!stores.has(name)) {
    stores.set(name, new Map());
  }

  return function check(req) {
    const store = stores.get(name);
    const ip = getClientIp(req);
    const now = Date.now();

    // Clean expired entries periodically (every 100 checks)
    if (Math.random() < 0.01) {
      for (const [key, entry] of store) {
        if (now - entry.start > windowMs) store.delete(key);
      }
    }

    const entry = store.get(ip);

    if (!entry || now - entry.start > windowMs) {
      store.set(ip, { count: 1, start: now });
      return { limited: false, remaining: max - 1 };
    }

    entry.count++;

    if (entry.count > max) {
      return { limited: true, remaining: 0 };
    }

    return { limited: false, remaining: max - entry.count };
  };
}

/**
 * Stricter limiter for auth endpoints (login, signup).
 * 5 attempts per 15 minutes per IP.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  name: 'auth',
});

/**
 * Standard API limiter.
 * 60 requests per minute per IP.
 */
export const apiLimiter = rateLimit({
  windowMs: 60_000,
  max: 60,
  name: 'api',
});

/**
 * WordPress publish limiter.
 * 10 publishes per 5 minutes per IP.
 */
export const publishLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  name: 'publish',
});

function getClientIp(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}
