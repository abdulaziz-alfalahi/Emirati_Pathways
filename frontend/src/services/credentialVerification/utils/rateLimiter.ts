import { retryMechanism } from "./retryMechanism";
import { integrationLogger } from "./logger";

export class RateLimiter {
  private rateLimitCache = new Map<string, { count: number; resetTime: number }>();

  async checkRateLimit(databaseSource: string): Promise<void> {
    const operation = async () => {
      // Get database config to check rate limits
      const { data: config, error } = await supabase
        .from('external_database_configs')
        .select('rate_limit_per_minute')
        .eq('database_name', databaseSource)
        .eq('is_active', true)
        .single();

      if (error) {
        throw new Error(`Failed to fetch rate limit config: ${error.message}`);
      }

      const rateLimit = config.rate_limit_per_minute || 60;
      const now = Date.now();
      const windowStart = Math.floor(now / 60000) * 60000; // Current minute window
      const cacheKey = `${databaseSource}-${windowStart}`;

      // Check in-memory cache first
      const cached = this.rateLimitCache.get(cacheKey);
      if (cached && cached.count >= rateLimit) {
        const waitTime = cached.resetTime - now;
        if (waitTime > 0) {
          throw new Error(`RATE_LIMIT_EXCEEDED: Wait ${Math.ceil(waitTime / 1000)} seconds`);
        }
      }

      // Update cache
      if (cached) {
        cached.count++;
      } else {
        this.rateLimitCache.set(cacheKey, {
          count: 1,
          resetTime: windowStart + 60000 // Next minute
        });
      }

      // Clean old cache entries
      this.cleanupCache();

      return true;
    };

    const result = await retryMechanism.executeWithRetry(
      operation,
      `checkRateLimit-${databaseSource}`,
      {
        maxRetries: 1, // Limited retries for rate limiting
        baseDelayMs: 1000,
        retryableErrors: ['NETWORK_ERROR', 'TIMEOUT', 'CONNECTION_REFUSED']
      }
    );

    if (result.success) {
      integrationLogger.logDebug(
        'RateLimiter',
        'checkRateLimit',
        `Rate limit check passed for ${databaseSource}`,
        {
          additionalData: { 
            attempts: result.attempts,
            duration: result.totalDuration
          }
        }
      );
    } else {
      integrationLogger.logError(
        'RateLimiter',
        'checkRateLimit',
        `Rate limit check failed for ${databaseSource}`,
        result.error,
        {
          additionalData: { 
            attempts: result.attempts,
            duration: result.totalDuration
          }
        }
      );
      throw result.error!;
    }
  }

  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, value] of this.rateLimitCache.entries()) {
      if (value.resetTime < now) {
        this.rateLimitCache.delete(key);
      }
    }
  }

  // Get current rate limit status for monitoring
  getRateLimitStatus(databaseSource: string): { 
    currentCount: number; 
    resetTime: number; 
    isLimited: boolean 
  } {
    const now = Date.now();
    const windowStart = Math.floor(now / 60000) * 60000;
    const cacheKey = `${databaseSource}-${windowStart}`;
    const cached = this.rateLimitCache.get(cacheKey);

    if (!cached) {
      return { currentCount: 0, resetTime: windowStart + 60000, isLimited: false };
    }

    return {
      currentCount: cached.count,
      resetTime: cached.resetTime,
      isLimited: cached.resetTime > now
    };
  }
}
