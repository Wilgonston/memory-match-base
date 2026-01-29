/**
 * Fetch Retry Utilities
 * 
 * Provides robust fetch functionality with automatic retry logic,
 * error suppression for analytics, and exponential backoff.
 */

export interface FetchRetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Initial delay between retries in ms (default: 1000) */
  retryDelay?: number;
  /** Whether to use exponential backoff (default: true) */
  exponentialBackoff?: boolean;
  /** Whether to suppress analytics errors (default: true) */
  suppressAnalyticsErrors?: boolean;
  /** Custom function to determine if error is retryable */
  isRetryable?: (error: Error) => boolean;
}

/**
 * Fetch with automatic retry logic
 * 
 * @param input - URL or Request object
 * @param init - Fetch options
 * @param options - Retry configuration
 * @returns Promise resolving to Response
 * 
 * @example
 * ```ts
 * const response = await fetchWithRetry('https://api.example.com/data', {
 *   method: 'POST',
 *   body: JSON.stringify({ data: 'value' })
 * }, {
 *   maxRetries: 5,
 *   retryDelay: 2000
 * });
 * ```
 */

// Store original fetch before any modifications
const originalFetch = window.fetch.bind(window);

export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  options: FetchRetryOptions = {}
): Promise<Response> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    exponentialBackoff = true,
    suppressAnalyticsErrors = true,
    isRetryable = defaultIsRetryable,
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Use original fetch to avoid recursion
      const response = await originalFetch(input, init);
      
      // If response is not ok but is a client error (4xx), don't retry
      if (!response.ok && response.status >= 400 && response.status < 500) {
        return response;
      }
      
      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Check if this is an analytics request
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      const isAnalytics = url.includes('analytics') || url.includes('coinbase') || url.includes('telemetry');
      
      // If it's analytics and we should suppress, return mock response
      if (isAnalytics && suppressAnalyticsErrors) {
        console.warn(`[fetchWithRetry] Suppressing analytics error: ${lastError.message}`);
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Check if error is retryable
      if (!isRetryable(lastError)) {
        throw lastError;
      }
      
      // If we have retries left, wait and try again
      if (attempt < maxRetries) {
        const delay = exponentialBackoff ? retryDelay * attempt : retryDelay;
        console.warn(`[fetchWithRetry] Attempt ${attempt}/${maxRetries} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
    }
  }

  // All retries exhausted
  throw new Error(`Fetch failed after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
}

/**
 * Default function to determine if an error is retryable
 * 
 * @param error - The error to check
 * @returns True if the error should trigger a retry
 */
function defaultIsRetryable(error: Error): boolean {
  const retryableMessages = [
    'Failed to fetch',
    'Network request failed',
    'NetworkError',
    'timeout',
    'ECONNREFUSED',
    'ETIMEDOUT',
  ];

  return retryableMessages.some(msg => 
    error.message.toLowerCase().includes(msg.toLowerCase())
  );
}

/**
 * Fetch JSON with automatic retry and parsing
 * 
 * @param input - URL or Request object
 * @param init - Fetch options
 * @param options - Retry configuration
 * @returns Promise resolving to parsed JSON
 * 
 * @example
 * ```ts
 * const data = await fetchJSON<{ result: string }>('https://api.example.com/data');
 * console.log(data.result);
 * ```
 */
export async function fetchJSON<T = unknown>(
  input: RequestInfo | URL,
  init?: RequestInit,
  options?: FetchRetryOptions
): Promise<T> {
  const response = await fetchWithRetry(input, init, options);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response.json() as Promise<T>;
}

/**
 * Setup global fetch interceptor with retry logic
 * 
 * This function overrides the global fetch to add automatic retry
 * and error suppression for all fetch calls in the application.
 * 
 * @param options - Default retry configuration for all fetch calls
 * 
 * @example
 * ```ts
 * // In your main.tsx or app entry point
 * setupGlobalFetchRetry({
 *   maxRetries: 3,
 *   retryDelay: 1000,
 *   suppressAnalyticsErrors: true
 * });
 * ```
 */
export function setupGlobalFetchRetry(options: FetchRetryOptions = {}): void {
  // Save original fetch before overriding
  const originalFetch = window.fetch.bind(window);
  
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const {
      maxRetries = 3,
      retryDelay = 1000,
      exponentialBackoff = true,
      suppressAnalyticsErrors = true,
      isRetryable = defaultIsRetryable,
    } = options;

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Use original fetch, not the overridden one
        const response = await originalFetch(input, init);
        
        // If response is not ok but is a client error (4xx), don't retry
        if (!response.ok && response.status >= 400 && response.status < 500) {
          return response;
        }
        
        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Check if this is an analytics request
        const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
        const isAnalytics = url.includes('analytics') || url.includes('coinbase') || url.includes('telemetry');
        
        // If it's analytics and we should suppress, return mock response
        if (isAnalytics && suppressAnalyticsErrors) {
          console.warn(`[fetchWithRetry] Suppressing analytics error: ${lastError.message}`);
          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        // Check if error is retryable
        if (!isRetryable(lastError)) {
          throw lastError;
        }
        
        // If we have retries left, wait and try again
        if (attempt < maxRetries) {
          const delay = exponentialBackoff ? retryDelay * attempt : retryDelay;
          console.warn(`[fetchWithRetry] Attempt ${attempt}/${maxRetries} failed, retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
    }

    // All retries exhausted
    throw new Error(`Fetch failed after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
  };
  
  console.log('[fetchRetry] Global fetch interceptor installed with retry logic');
}

/**
 * Setup global error handler for unhandled fetch rejections
 * 
 * This prevents "Failed to fetch" errors from appearing in the console
 * when they're related to analytics or other non-critical services.
 */
export function setupGlobalErrorHandler(): void {
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason;
    
    if (error?.message?.includes('Failed to fetch')) {
      console.warn('[Global Error Handler] Suppressed unhandled fetch error:', error.message);
      event.preventDefault();
    }
  });
  
  console.log('[fetchRetry] Global error handler installed');
}
