/**
 * Error Handling Utilities
 * 
 * Provides standardized error handling across services and hooks.
 * Ensures consistent error logging and error message formatting.
 */

/**
 * Service error class for consistent error handling
 */
export class ServiceError extends Error {
  constructor(
    public readonly context: string,
    public readonly originalError: unknown,
    message?: string
  ) {
    const errorMessage = message || ServiceError.extractMessage(originalError);
    super(`[${context}] ${errorMessage}`);
    this.name = 'ServiceError';
  }

  /**
   * Extract error message from unknown error type
   */
  private static extractMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return 'Unknown error';
  }
}

/**
 * Handle service errors with consistent logging and error transformation
 * 
 * @param context - Service or component name for logging
 * @param error - The error that occurred
 * @param fallback - Optional fallback value to return
 * @returns Fallback value if provided, otherwise throws ServiceError
 */
/**
 * Handle service errors with consistent logging and error transformation
 * 
 * @param context - Service or component name for logging
 * @param error - The error that occurred
 * @param fallback - Optional fallback value to return
 * @param wrapMessage - Whether to wrap the error message with context (default: false)
 * @returns Fallback value if provided, otherwise throws the original error
 */
export function handleServiceError<T>(
  context: string,
  error: unknown,
  fallback?: T,
  wrapMessage: boolean = false
): T {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(`[${context}]`, error);

  if (fallback !== undefined) {
    return fallback;
  }

  // Re-throw the original error to maintain test compatibility
  if (error instanceof Error) {
    throw error;
  }

  throw new Error(errorMessage);
}

/**
 * Log service operation with consistent formatting
 * 
 * @param context - Service or component name
 * @param operation - Operation being performed
 * @param data - Optional data to log
 */
export function logServiceOperation(
  context: string,
  operation: string,
  data?: Record<string, unknown>
): void {
  const message = `[${context}] ${operation}`;
  if (data) {
    console.log(message, data);
  } else {
    console.log(message);
  }
}

/**
 * Log service warning with consistent formatting
 * 
 * @param context - Service or component name
 * @param warning - Warning message
 * @param data - Optional data to log
 */
export function logServiceWarning(
  context: string,
  warning: string,
  data?: Record<string, unknown>
): void {
  const message = `[${context}] ${warning}`;
  if (data) {
    console.warn(message, data);
  } else {
    console.warn(message);
  }
}
