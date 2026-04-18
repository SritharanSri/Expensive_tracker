import { NextResponse } from "next/server";

interface RateLimitTracker {
  count: number;
  resetAt: number;
}

// In-memory store: Map<IP_Address, Tracker>
// Note: In a real distributed production environment, use Redis for this.
const rateLimiter = new Map<string, RateLimitTracker>();

interface RateLimitConfig {
  limit: number;    // Number of requests allowed
  windowMs: number; // Time window in milliseconds
}

/**
 * Basic in-memory rate limiter to prevent abuse and DDoS at the API layer.
 */
export function buildRateLimiter(config: RateLimitConfig) {
  return function checkRateLimit(ip: string | null) {
    if (!ip) return NextResponse.next(); // Fallback if IP cannot be determined

    const now = Date.now();
    const tracker = rateLimiter.get(ip);

    if (tracker) {
      if (now > tracker.resetAt) {
        // Window expired, reset
        rateLimiter.set(ip, { count: 1, resetAt: now + config.windowMs });
      } else {
        // Within window
        if (tracker.count >= config.limit) {
          return NextResponse.json(
             { success: false, error: "Too many requests. Please try again later." },
             { status: 429 } 
          );
        }
        tracker.count++;
      }
    } else {
      // First request
      rateLimiter.set(ip, { count: 1, resetAt: now + config.windowMs });
    }

    // Clean up old entries occasionally to prevent memory leaks in the Map
    if (Math.random() < 0.05) {
      for (const [key, val] of rateLimiter.entries()) {
        if (now > val.resetAt) rateLimiter.delete(key);
      }
    }

    return null; // Null means rate limit NOT exceeded, allow request implementation
  };
}
