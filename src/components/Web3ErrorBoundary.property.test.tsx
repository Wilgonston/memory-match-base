/**
 * Web3ErrorBoundary Property-Based Tests
 * 
 * Property 24: Error Boundary Catching
 * For any Web3 error thrown in a component, the error boundary should catch it, 
 * log detailed information, and display a user-friendly message.
 * 
 * Property 25: Recoverable Error Retry
 * For any error classified as recoverable (network timeout, RPC error), the system 
 * should provide a retry option in the error UI.
 * 
 * Property 26: Error Type Classification
 * For any caught error, the system should correctly classify it as a network error, 
 * contract error, or user rejection based on error properties.
 * 
 * Validates: Requirements 14.2, 14.3, 14.4, 14.6
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import fc from 'fast-check';
import { Web3ErrorBoundary } from './Web3ErrorBoundary';

// Component that throws an error
function ThrowError({ error }: { error: Error }) {
  throw error;
}

describe('Property 24: Error Boundary Catching', () => {
  // Feature: base-ecosystem-integration, Property 24: For any Web3 error thrown in a component, the error boundary should catch it
  it('should catch any error thrown by child components', () => {
    // Suppress console.error for this test
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    fc.assert(
      fc.property(
        fc.record({
          message: fc.string({ minLength: 5, maxLength: 100 }),
          name: fc.constantFrom('Error', 'TypeError', 'ReferenceError'),
        }),
        (props) => {
          const error = new Error(props.message);
          error.name = props.name;

          const { container } = render(
            <Web3ErrorBoundary>
              <ThrowError error={error} />
            </Web3ErrorBoundary>
          );

          // Property: Error boundary must catch the error
          const errorBoundary = container.querySelector('.web3-error-boundary');
          expect(errorBoundary).toBeTruthy();

          // Property: Must display error container
          const errorContainer = container.querySelector('.error-container');
          expect(errorContainer).toBeTruthy();

          cleanup();
        }
      ),
      { numRuns: 50 }
    );

    consoleError.mockRestore();
  });

  it('should display user-friendly message for any error', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    fc.assert(
      fc.property(
        fc.string({ minLength: 10, maxLength: 200 }),
        (message) => {
          const error = new Error(message);

          const { container } = render(
            <Web3ErrorBoundary>
              <ThrowError error={error} />
            </Web3ErrorBoundary>
          );

          // Property: Must display user-friendly message (not raw error)
          const errorMessage = container.querySelector('.error-message');
          expect(errorMessage).toBeTruthy();
          expect(errorMessage?.textContent).toBeTruthy();

          cleanup();
        }
      ),
      { numRuns: 50 }
    );

    consoleError.mockRestore();
  });

  it('should log error details for debugging', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    fc.assert(
      fc.property(
        fc.string({ minLength: 5, maxLength: 100 }),
        (message) => {
          const error = new Error(message);

          render(
            <Web3ErrorBoundary>
              <ThrowError error={error} />
            </Web3ErrorBoundary>
          );

          // Property: console.error must be called with error details
          expect(consoleError).toHaveBeenCalled();

          cleanup();
        }
      ),
      { numRuns: 30 }
    );

    consoleError.mockRestore();
  });

  it('should display error icon for any error', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    fc.assert(
      fc.property(
        fc.string({ minLength: 5, maxLength: 100 }),
        (message) => {
          const error = new Error(message);

          const { container } = render(
            <Web3ErrorBoundary>
              <ThrowError error={error} />
            </Web3ErrorBoundary>
          );

          // Property: Must display error icon
          const errorIcon = container.querySelector('.error-icon');
          expect(errorIcon).toBeTruthy();
          expect(errorIcon?.textContent).toBeTruthy();

          cleanup();
        }
      ),
      { numRuns: 30 }
    );

    consoleError.mockRestore();
  });
});

describe('Property 25: Recoverable Error Retry', () => {
  // Feature: base-ecosystem-integration, Property 25: For any error classified as recoverable, the system should provide a retry option
  it('should provide retry button for network errors', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    fc.assert(
      fc.property(
        fc.constantFrom(
          'network error',
          'timeout error',
          'connection failed',
          'fetch failed',
          'rpc error'
        ),
        (errorMessage) => {
          const error = new Error(errorMessage);

          render(
            <Web3ErrorBoundary>
              <ThrowError error={error} />
            </Web3ErrorBoundary>
          );

          // Property: Must have "Try Again" button for network errors
          const retryButton = screen.getByRole('button', { name: /try again/i });
          expect(retryButton).toBeInTheDocument();

          cleanup();
        }
      ),
      { numRuns: 30 }
    );

    consoleError.mockRestore();
  });

  it('should provide retry button for user rejection errors', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    fc.assert(
      fc.property(
        fc.constantFrom(
          'user rejected transaction',
          'user denied transaction',
          'user cancelled',
          'rejected by user'
        ),
        (errorMessage) => {
          const error = new Error(errorMessage);

          render(
            <Web3ErrorBoundary>
              <ThrowError error={error} />
            </Web3ErrorBoundary>
          );

          // Property: Must have "Try Again" button for user errors
          const retryButton = screen.getByRole('button', { name: /try again/i });
          expect(retryButton).toBeInTheDocument();

          cleanup();
        }
      ),
      { numRuns: 30 }
    );

    consoleError.mockRestore();
  });

  it('should always provide refresh button', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    fc.assert(
      fc.property(
        fc.string({ minLength: 5, maxLength: 100 }),
        (message) => {
          const error = new Error(message);

          render(
            <Web3ErrorBoundary>
              <ThrowError error={error} />
            </Web3ErrorBoundary>
          );

          // Property: Must always have "Refresh Page" button
          const refreshButton = screen.getByText(/refresh page/i);
          expect(refreshButton).toBeInTheDocument();

          cleanup();
        }
      ),
      { numRuns: 50 }
    );

    consoleError.mockRestore();
  });
});

describe('Property 26: Error Type Classification', () => {
  // Feature: base-ecosystem-integration, Property 26: For any caught error, the system should correctly classify it
  it('should classify network errors correctly', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    fc.assert(
      fc.property(
        fc.constantFrom(
          'network error occurred',
          'timeout waiting for response',
          'connection refused',
          'fetch failed',
          'rpc call failed'
        ),
        (message) => {
          const error = new Error(message);

          const { container } = render(
            <Web3ErrorBoundary>
              <ThrowError error={error} />
            </Web3ErrorBoundary>
          );

          // Property: Network errors must show network-related message
          const errorMessage = container.querySelector('.error-message');
          expect(errorMessage?.textContent?.toLowerCase()).toMatch(/network|internet|connection/);

          cleanup();
        }
      ),
      { numRuns: 30 }
    );

    consoleError.mockRestore();
  });

  it('should classify user rejection errors correctly', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    fc.assert(
      fc.property(
        fc.constantFrom(
          'user rejected the request',
          'user denied transaction signature',
          'user cancelled the operation',
          'rejected by user'
        ),
        (message) => {
          const error = new Error(message);

          const { container } = render(
            <Web3ErrorBoundary>
              <ThrowError error={error} />
            </Web3ErrorBoundary>
          );

          // Property: User errors must show cancellation message
          const errorMessage = container.querySelector('.error-message');
          expect(errorMessage?.textContent?.toLowerCase()).toMatch(/cancel|try again/);

          cleanup();
        }
      ),
      { numRuns: 30 }
    );

    consoleError.mockRestore();
  });

  it('should classify contract errors correctly', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    fc.assert(
      fc.property(
        fc.constantFrom(
          'execution reverted',
          'insufficient funds for gas',
          'transaction reverted',
          'gas estimation failed'
        ),
        (message) => {
          const error = new Error(message);

          const { container } = render(
            <Web3ErrorBoundary>
              <ThrowError error={error} />
            </Web3ErrorBoundary>
          );

          // Property: Contract errors must show transaction-related message
          const errorMessage = container.querySelector('.error-message');
          expect(errorMessage?.textContent?.toLowerCase()).toMatch(/transaction|funds/);

          cleanup();
        }
      ),
      { numRuns: 30 }
    );

    consoleError.mockRestore();
  });

  it('should display appropriate icon for each error type', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    fc.assert(
      fc.property(
        fc.record({
          message: fc.constantFrom(
            'user rejected',
            'network error',
            'execution reverted',
            'unknown error'
          ),
        }),
        (props) => {
          const error = new Error(props.message);

          const { container } = render(
            <Web3ErrorBoundary>
              <ThrowError error={error} />
            </Web3ErrorBoundary>
          );

          // Property: Must display an icon
          const errorIcon = container.querySelector('.error-icon');
          expect(errorIcon).toBeTruthy();
          expect(errorIcon?.textContent).toMatch(/[🚫🌐⚠️]/);

          cleanup();
        }
      ),
      { numRuns: 30 }
    );

    consoleError.mockRestore();
  });
});

describe('Property 24-26: Error Boundary - Edge Cases', () => {
  it('should handle errors with very long messages', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    fc.assert(
      fc.property(
        fc.string({ minLength: 500, maxLength: 2000 }),
        (message) => {
          const error = new Error(message);

          const { container } = render(
            <Web3ErrorBoundary>
              <ThrowError error={error} />
            </Web3ErrorBoundary>
          );

          // Property: Must render without crashing
          expect(container.querySelector('.web3-error-boundary')).toBeTruthy();

          cleanup();
        }
      ),
      { numRuns: 20 }
    );

    consoleError.mockRestore();
  });

  it('should handle errors with special characters', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    fc.assert(
      fc.property(
        fc.string({ minLength: 10, maxLength: 100 }),
        (message) => {
          const errorMessage = `${message} <>&"'`;
          const error = new Error(errorMessage);

          const { container } = render(
            <Web3ErrorBoundary>
              <ThrowError error={error} />
            </Web3ErrorBoundary>
          );

          // Property: Must handle special characters safely
          expect(container.querySelector('.web3-error-boundary')).toBeTruthy();

          cleanup();
        }
      ),
      { numRuns: 30 }
    );

    consoleError.mockRestore();
  });

  it('should handle errors without messages', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    const error = new Error();

    const { container } = render(
      <Web3ErrorBoundary>
        <ThrowError error={error} />
      </Web3ErrorBoundary>
    );

    // Property: Must render even with empty error message
    expect(container.querySelector('.web3-error-boundary')).toBeTruthy();
    expect(container.querySelector('.error-message')).toBeTruthy();

    cleanup();
    consoleError.mockRestore();
  });

  it('should maintain consistent UI structure for all error types', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    fc.assert(
      fc.property(
        fc.constantFrom(
          'network error',
          'user rejected',
          'execution reverted',
          'unknown error'
        ),
        (message) => {
          const error = new Error(message);

          const { container } = render(
            <Web3ErrorBoundary>
              <ThrowError error={error} />
            </Web3ErrorBoundary>
          );

          // Property: Must have consistent structure
          expect(container.querySelector('.web3-error-boundary')).toBeTruthy();
          expect(container.querySelector('.error-container')).toBeTruthy();
          expect(container.querySelector('.error-icon')).toBeTruthy();
          expect(container.querySelector('.error-title')).toBeTruthy();
          expect(container.querySelector('.error-message')).toBeTruthy();
          expect(container.querySelector('.error-actions')).toBeTruthy();

          cleanup();
        }
      ),
      { numRuns: 30 }
    );

    consoleError.mockRestore();
  });
});
