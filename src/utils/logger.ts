/**
 * Logger Utility
 * 
 * Provides conditional logging based on environment.
 * In production, only errors are logged to avoid exposing sensitive information.
 */

const isDev = import.meta.env.DEV;

/**
 * Logger with environment-aware logging
 */
export const logger = {
  /**
   * Log general information (only in development)
   */
  log: (...args: any[]): void => {
    if (isDev) {
      console.log(...args);
    }
  },

  /**
   * Log warnings (only in development)
   */
  warn: (...args: any[]): void => {
    if (isDev) {
      console.warn(...args);
    }
  },

  /**
   * Log errors (always logged, even in production)
   */
  error: (...args: any[]): void => {
    console.error(...args);
  },

  /**
   * Log debug information (only in development)
   */
  debug: (...args: any[]): void => {
    if (isDev) {
      console.debug(...args);
    }
  },

  /**
   * Log with context prefix
   */
  withContext: (context: string) => ({
    log: (...args: any[]) => logger.log(`[${context}]`, ...args),
    warn: (...args: any[]) => logger.warn(`[${context}]`, ...args),
    error: (...args: any[]) => logger.error(`[${context}]`, ...args),
    debug: (...args: any[]) => logger.debug(`[${context}]`, ...args),
  }),
};

/**
 * Create a logger with a specific context
 * 
 * @param context - Context name (e.g., component or service name)
 * @returns Logger with context prefix
 * 
 * @example
 * ```typescript
 * const log = createLogger('MyComponent');
 * log.log('Component mounted'); // [MyComponent] Component mounted
 * ```
 */
export function createLogger(context: string) {
  return logger.withContext(context);
}
