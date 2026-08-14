/**
 * In-memory rate limiter for API routes (e.g. contact form).
 * For production at scale, consider Redis or another key-value store.
 */

const store = new Map<string, { count: number; resetAt: number }>();

const DEFAULT_WINDOW_MS = 60 * 1000; // 1 minute
const DEFAULT_MAX_REQUESTS = 10;

export interface RateLimitOptions {
  windowMs?: number;
  maxRequests?: number;
}

/**
 * Get client identifier from request (IP or forwarded IP).
 */
export function getClientId(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? "unknown";
  return ip;
}

/**
 * Check rate limit. Returns null if allowed, or a Response if rate limited.
 */
export function rateLimit(
  request: Request,
  keyPrefix: string,
  options: RateLimitOptions = {}
): Response | null {
  const { windowMs = DEFAULT_WINDOW_MS, maxRequests = DEFAULT_MAX_REQUESTS } = options;
  const id = getClientId(request);
  const key = `${keyPrefix}:${id}`;
  const now = Date.now();
  const entry = store.get(key);

  if (!entry) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }

  if (now >= entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }

  entry.count += 1;
  if (entry.count > maxRequests) {
    return new Response(
      JSON.stringify({
        error: "Too many requests",
        code: "too_many_requests",
        retryAfter: Math.ceil((entry.resetAt - now) / 1000),
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(Math.ceil((entry.resetAt - now) / 1000)),
        },
      }
    );
  }
  return null;
}

/**
 * Optional: cleanup old entries to avoid unbounded memory (call from a cron or periodically).
 */
export function pruneRateLimitStore(): void {
  const now = Date.now();
  for (const [k, v] of store.entries()) {
    if (now >= v.resetAt) store.delete(k);
  }
}
