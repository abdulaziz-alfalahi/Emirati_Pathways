
export interface RetryOptions {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  jitterMs: number;
  retryableErrors: string[];
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  attempts: number;
  totalDuration: number;
}

export class RetryMechanism {
  private defaultOptions: RetryOptions = {
    maxRetries: 3,
    baseDelayMs: 1000,
    maxDelayMs: 10000,
    jitterMs: 100,
    retryableErrors: [
      'NETWORK_ERROR',
      'TIMEOUT',
      'SERVICE_UNAVAILABLE',
      'RATE_LIMIT_EXCEEDED',
      'CONNECTION_REFUSED',
      'DNS_RESOLUTION_FAILED'
    ]
  };

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    options: Partial<RetryOptions> = {}
  ): Promise<RetryResult<T>> {
    const config = { ...this.defaultOptions, ...options };
    const startTime = Date.now();
    let lastError: Error | null = null;
    let attempts = 0;

    for (let attempt = 1; attempt <= config.maxRetries + 1; attempt++) {
      attempts = attempt;
      
      try {
        console.log(`[RetryMechanism] Attempt ${attempt} for ${operationName}`);
        const result = await operation();
        
        const totalDuration = Date.now() - startTime;
        console.log(`[RetryMechanism] ${operationName} succeeded on attempt ${attempt} after ${totalDuration}ms`);
        
        return {
          success: true,
          data: result,
          attempts,
          totalDuration
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.log(`[RetryMechanism] Attempt ${attempt} for ${operationName} failed:`, lastError.message);

        // Check if this is the last attempt
        if (attempt > config.maxRetries) {
          break;
        }

        // Check if error is retryable
        if (!this.isRetryableError(lastError, config.retryableErrors)) {
          console.log(`[RetryMechanism] Non-retryable error for ${operationName}, stopping retries`);
          break;
        }

        // Calculate delay with exponential backoff and jitter
        const delay = this.calculateDelay(attempt, config);
        console.log(`[RetryMechanism] Waiting ${delay}ms before retry ${attempt + 1} for ${operationName}`);
        
        await this.sleep(delay);
      }
    }

    const totalDuration = Date.now() - startTime;
    console.log(`[RetryMechanism] ${operationName} failed after ${attempts} attempts and ${totalDuration}ms`);
    
    return {
      success: false,
      error: lastError || new Error('Unknown error'),
      attempts,
      totalDuration
    };
  }

  private isRetryableError(error: Error, retryableErrors: string[]): boolean {
    const errorMessage = error.message.toLowerCase();
    const errorName = error.name.toLowerCase();
    
    return retryableErrors.some(retryableError => 
      errorMessage.includes(retryableError.toLowerCase()) ||
      errorName.includes(retryableError.toLowerCase())
    );
  }

  private calculateDelay(attempt: number, config: RetryOptions): number {
    // Exponential backoff: baseDelay * 2^(attempt-1)
    const exponentialDelay = config.baseDelayMs * Math.pow(2, attempt - 1);
    
    // Add jitter to prevent thundering herd
    const jitter = Math.random() * config.jitterMs;
    
    // Cap at maximum delay
    const delay = Math.min(exponentialDelay + jitter, config.maxDelayMs);
    
    return Math.floor(delay);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Helper method to create timeout promises
  withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('TIMEOUT')), timeoutMs)
      )
    ]);
  }
}

export const retryMechanism = new RetryMechanism();
