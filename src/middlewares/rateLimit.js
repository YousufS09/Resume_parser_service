/**
 * Minimal fixed-window rate limiter keyed by client IP.
 * Protects the upload/parse endpoints from filling the disk or exhausting the Groq quota.
 * State is in memory, so limits apply per server instance.
 */
const createRateLimiter = ({ windowMs, max }) => {
  const hits = new Map();

  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) {
      if (entry.resetAt <= now) {
        hits.delete(key);
      }
    }
  }, windowMs);
  cleanup.unref();

  return (req, res, next) => {
    if (max <= 0) {
      next();
      return;
    }

    const now = Date.now();
    const key = req.ip || 'unknown';
    let entry = hits.get(key);

    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(key, entry);
    }

    entry.count += 1;

    if (entry.count > max) {
      res.set('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)));
      res.status(429).json({ error: { message: 'Too many requests. Please try again later.' } });
      return;
    }

    next();
  };
};

module.exports = { createRateLimiter };
