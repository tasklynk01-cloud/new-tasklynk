/**
 * Database Retry Utilities
 * 
 * Provides retry logic for database operations to handle
 * transient failures and improve reliability.
 */

/**
 * Retry configuration options
 */
export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryableErrors?: string[];
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryableErrors: [
    'timeout',
    'timed out',
    'network',
    'econnrefused',
    'connection',
    'econnreset',
    'etimedout',
  ],
};

/**
 * Check if an error is retryable
 */
function isRetryableError(error: any, retryableErrors: string[]): boolean {
  const errorMessage = (error?.message || '').toLowerCase();
  const errorCode = (error?.code || '').toLowerCase();
  const errorName = (error?.name || '').toLowerCase();

  const allErrorStrings = [errorMessage, errorCode, errorName].join(' ');

  return retryableErrors.some((pattern) => allErrorStrings.includes(pattern));
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate delay for retry attempt with exponential backoff
 */
function calculateDelay(
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  backoffMultiplier: number
): number {
  const delay = initialDelay * Math.pow(backoffMultiplier, attempt);
  const jitter = Math.random() * 200; // Add random jitter to prevent thundering herd
  return Math.min(delay + jitter, maxDelay);
}

/**
 * Execute a database operation with retry logic
 * 
 * @param operation - The database operation to execute
 * @param options - Retry configuration options
 * @returns The result of the operation
 * @throws The last error if all retries fail
 * 
 * @example
 * ```typescript
 * const result = await withRetry(
 *   () => db.select().from(users).where(eq(users.id, userId)),
 *   { maxRetries: 3, initialDelay: 1000 }
 * );
 * ```
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const config = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: unknown) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry if it's the last attempt
      if (attempt >= config.maxRetries) {
        break;
      }

      // Don't retry if error is not retryable
      if (!isRetryableError(error, config.retryableErrors)) {
        console.log('[DB Retry] Error is not retryable, failing immediately:', lastError.message);
        break;
      }

      // Calculate delay and wait before retry
      const delay = calculateDelay(
        attempt,
        config.initialDelay,
        config.maxDelay,
        config.backoffMultiplier
      );

      console.log(
        `[DB Retry] Attempt ${attempt + 1}/${config.maxRetries} failed, retrying in ${delay}ms...`,
        { error: lastError.message }
      );

      await sleep(delay);
    }
  }

  // All retries exhausted, throw last error
  console.error('[DB Retry] All retry attempts exhausted');
  throw lastError!;
}

/**
 * Execute a database operation with retry and timeout
 * 
 * @param operation - The database operation to execute
 * @param timeoutMs - Maximum time to wait for operation (default: 30000ms)
 * @param options - Retry configuration options
 * @returns The result of the operation
 * @throws TimeoutError if operation exceeds timeout
 */
export async function withRetryAndTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs = 30000,
  options: RetryOptions = {}
): Promise<T> {
  return withRetry(
    async () => {
      return Promise.race([
        operation(),
        new Promise<T>((_, reject) => {
          setTimeout(() => {
            reject(new Error(`Operation timed out after ${timeoutMs}ms`));
          }, timeoutMs);
        }),
      ]);
    },
    options
  );
}

/**
 * Circuit Breaker State
 */
enum CircuitState {
  CLOSED = 'CLOSED',       // Normal operation
  OPEN = 'OPEN',           // Failing, reject requests immediately
  HALF_OPEN = 'HALF_OPEN', // Testing if service recovered
}

/**
 * Circuit Breaker Pattern Implementation
 * 
 * Prevents cascading failures by stopping requests to a failing service
 * and periodically testing if it has recovered.
 */
export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime: number | null = null;
  private nextAttemptTime: number | null = null;
  
  constructor(
    private readonly threshold: number = 5,        // failures before opening
    private readonly timeout: number = 60000,      // time to wait before retry (ms)
    private readonly monitoringPeriod: number = 10000, // rolling window for failures
    private readonly successThreshold: number = 2  // successes needed to close
  ) {}
  
  /**
   * Execute operation through circuit breaker
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    // Check circuit state
    if (this.state === CircuitState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.state = CircuitState.HALF_OPEN;
        if (process.env.NODE_ENV === 'development') {
          console.log('[Circuit Breaker] Attempting to recover...');
        }
      } else {
        throw new Error('Circuit breaker is OPEN - service unavailable');
      }
    }
    
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess() {
    this.failureCount = 0;
    
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.successThreshold) {
        this.state = CircuitState.CLOSED;
        this.successCount = 0;
        if (process.env.NODE_ENV === 'development') {
          console.log('[Circuit Breaker] Circuit CLOSED - service recovered');
        }
      }
    }
  }
  
  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    this.successCount = 0;
    
    if (this.failureCount >= this.threshold) {
      this.state = CircuitState.OPEN;
      this.nextAttemptTime = Date.now() + this.timeout;
      console.error(
        `[Circuit Breaker] Circuit OPEN - threshold reached (${this.failureCount} failures)`
      );
    }
  }
  
  private shouldAttemptReset(): boolean {
    return this.nextAttemptTime !== null && Date.now() >= this.nextAttemptTime;
  }
  
  /**
   * Get current circuit breaker status
   */
  getStatus() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      nextAttemptTime: this.nextAttemptTime,
    };
  }
  
  /**
   * Manually reset circuit breaker
   */
  reset() {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.nextAttemptTime = null;
  }
}

// Global circuit breaker instance for database operations
export const dbCircuitBreaker = new CircuitBreaker(5, 60000, 10000, 2);


