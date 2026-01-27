/**
 * Rate Limiter for Webhook and API endpoints
 * 
 * Provides rate limiting functionality to prevent abuse and DoS attacks.
 */

export interface RateLimitConfig {
  /** Maximum number of requests allowed in the time window */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
}

export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig = { maxRequests: 10, windowMs: 60000 }) {
    this.config = config;
  }

  /**
   * Check if a request is allowed for the given identifier
   * @param identifier - Unique identifier (e.g., IP address, user ID, FID)
   * @returns true if request is allowed, false if rate limit exceeded
   */
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(identifier) || [];

    // Remove attempts outside the time window
    const recentAttempts = attempts.filter(
      (timestamp) => now - timestamp < this.config.windowMs
    );

    // Check if limit exceeded
    if (recentAttempts.length >= this.config.maxRequests) {
      return false;
    }

    // Add current attempt
    recentAttempts.push(now);
    this.attempts.set(identifier, recentAttempts);

    return true;
  }

  /**
   * Get remaining requests for an identifier
   * @param identifier - Unique identifier
   * @returns Number of remaining requests in current window
   */
  getRemaining(identifier: string): number {
    const now = Date.now();
    const attempts = this.attempts.get(identifier) || [];
    const recentAttempts = attempts.filter(
      (timestamp) => now - timestamp < this.config.windowMs
    );
    return Math.max(0, this.config.maxRequests - recentAttempts.length);
  }

  /**
   * Get time until rate limit resets for an identifier
   * @param identifier - Unique identifier
   * @returns Milliseconds until reset, or 0 if not rate limited
   */
  getResetTime(identifier: string): number {
    const now = Date.now();
    const attempts = this.attempts.get(identifier) || [];
    
    if (attempts.length === 0) {
      return 0;
    }

    const oldestAttempt = Math.min(...attempts);
    const resetTime = oldestAttempt + this.config.windowMs;
    
    return Math.max(0, resetTime - now);
  }

  /**
   * Reset rate limit for a specific identifier
   * @param identifier - Unique identifier to reset
   */
  reset(identifier: string): void {
    this.attempts.delete(identifier);
  }

  /**
   * Clear all rate limit data
   */
  clearAll(): void {
    this.attempts.clear();
  }

  /**
   * Clean up old entries to prevent memory leaks
   * Should be called periodically
   */
  cleanup(): void {
    const now = Date.now();
    for (const [identifier, attempts] of this.attempts.entries()) {
      const recentAttempts = attempts.filter(
        (timestamp) => now - timestamp < this.config.windowMs
      );
      
      if (recentAttempts.length === 0) {
        this.attempts.delete(identifier);
      } else {
        this.attempts.set(identifier, recentAttempts);
      }
    }
  }
}

/**
 * Global rate limiters for different endpoints
 */
export const webhookRateLimiter = new RateLimiter({
  maxRequests: 10,
  windowMs: 60000, // 10 requests per minute
});

export const apiRateLimiter = new RateLimiter({
  maxRequests: 100,
  windowMs: 60000, // 100 requests per minute
});

// Cleanup old entries every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    webhookRateLimiter.cleanup();
    apiRateLimiter.cleanup();
  }, 5 * 60 * 1000);
}
