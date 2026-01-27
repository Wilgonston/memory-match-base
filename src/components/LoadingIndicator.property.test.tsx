/**
 * LoadingIndicator Property-Based Tests
 * 
 * Property 20: Operation Loading Indicators
 * For any blockchain operation in progress, the system should display a loading 
 * indicator with the operation type and maintain it until the operation completes or fails.
 * 
 * Validates: Requirements 12.1, 12.2, 12.6
 */

import { describe, it, expect } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import fc from 'fast-check';
import { LoadingIndicator } from './LoadingIndicator';

describe('Property 20: Operation Loading Indicators', () => {
  // Feature: base-ecosystem-integration, Property 20: For any blockchain operation in progress, the system should display a loading indicator with the operation type
  it('should display loading indicator with operation type for any operation', () => {
    fc.assert(
      fc.property(
        fc.record({
          operation: fc.oneof(
            fc.constant('Connecting wallet'),
            fc.constant('Saving progress'),
            fc.constant('Submitting transaction'),
            fc.constant('Confirming transaction'),
            fc.constant('Loading data'),
            fc.constant('Processing payment'),
            fc.constant('Switching network'),
            fc.constant('Requesting permission'),
            fc.string({ minLength: 5, maxLength: 50 }).filter(s => s.trim().length > 0)
          ),
          estimatedTime: fc.option(fc.integer({ min: 1, max: 60 }), { nil: undefined }),
          cancellable: fc.boolean(),
          stillWorking: fc.boolean(),
        }),
        (props) => {
          // Render loading indicator
          const { container } = render(
            <LoadingIndicator
              operation={props.operation}
              estimatedTime={props.estimatedTime}
              cancellable={props.cancellable}
              onCancel={props.cancellable ? () => {} : undefined}
              stillWorking={props.stillWorking}
            />
          );

          // Property: Loading indicator must be present
          const loadingIndicator = container.querySelector('.loading-indicator');
          expect(loadingIndicator).toBeTruthy();

          // Property: Operation type must be displayed (check via textContent to handle whitespace)
          const operationElement = container.querySelector('.loading-operation');
          expect(operationElement).toBeTruthy();
          expect(operationElement?.textContent).toBe(props.operation);

          // Property: Spinner must be present
          const spinner = container.querySelector('.loading-spinner');
          expect(spinner).toBeTruthy();

          // Cleanup for next iteration
          cleanup();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should display estimated time when provided', () => {
    fc.assert(
      fc.property(
        fc.record({
          operation: fc.string({ minLength: 5, maxLength: 50 }),
          estimatedTime: fc.integer({ min: 1, max: 120 }),
        }),
        (props) => {
          render(
            <LoadingIndicator
              operation={props.operation}
              estimatedTime={props.estimatedTime}
              stillWorking={false}
            />
          );

          // Property: Estimated time must be displayed when provided and not stillWorking
          const estimateText = screen.getByText(new RegExp(`~${props.estimatedTime}s`));
          expect(estimateText).toBeInTheDocument();

          cleanup();
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should show still working message for long operations', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 5, maxLength: 50 }),
        (operation) => {
          render(
            <LoadingIndicator
              operation={operation}
              stillWorking={true}
            />
          );

          // Property: Still working message must be displayed
          expect(screen.getByText(/Still working on it/)).toBeInTheDocument();

          cleanup();
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should render cancel button only when cancellable', () => {
    fc.assert(
      fc.property(
        fc.record({
          operation: fc.string({ minLength: 5, maxLength: 50 }),
          cancellable: fc.boolean(),
        }),
        (props) => {
          render(
            <LoadingIndicator
              operation={props.operation}
              cancellable={props.cancellable}
              onCancel={props.cancellable ? () => {} : undefined}
            />
          );

          // Property: Cancel button presence must match cancellable prop
          const cancelButton = screen.queryByRole('button', { name: /cancel/i });
          
          if (props.cancellable) {
            expect(cancelButton).toBeInTheDocument();
          } else {
            expect(cancelButton).not.toBeInTheDocument();
          }

          cleanup();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain loading state structure across all operations', () => {
    fc.assert(
      fc.property(
        fc.record({
          operation: fc.string({ minLength: 1, maxLength: 100 }),
          estimatedTime: fc.option(fc.integer({ min: 0, max: 300 }), { nil: undefined }),
          cancellable: fc.boolean(),
          stillWorking: fc.boolean(),
        }),
        (props) => {
          const { container } = render(
            <LoadingIndicator
              operation={props.operation}
              estimatedTime={props.estimatedTime}
              cancellable={props.cancellable}
              onCancel={props.cancellable ? () => {} : undefined}
              stillWorking={props.stillWorking}
            />
          );

          // Property: Must have consistent structure
          expect(container.querySelector('.loading-indicator')).toBeTruthy();
          expect(container.querySelector('.loading-content')).toBeTruthy();
          expect(container.querySelector('.loading-text')).toBeTruthy();
          expect(container.querySelector('.loading-operation')).toBeTruthy();

          // Property: Must have either spinner or custom icon
          const hasSpinner = container.querySelector('.loading-spinner');
          expect(hasSpinner).toBeTruthy();

          cleanup();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not show estimated time when stillWorking is true', () => {
    fc.assert(
      fc.property(
        fc.record({
          operation: fc.string({ minLength: 5, maxLength: 50 }),
          estimatedTime: fc.integer({ min: 1, max: 60 }),
        }),
        (props) => {
          render(
            <LoadingIndicator
              operation={props.operation}
              estimatedTime={props.estimatedTime}
              stillWorking={true}
            />
          );

          // Property: Estimated time must not be shown when stillWorking
          expect(screen.queryByText(/Estimated time/)).not.toBeInTheDocument();
          
          // Property: Still working message must be shown instead
          expect(screen.getByText(/Still working on it/)).toBeInTheDocument();

          cleanup();
        }
      ),
      { numRuns: 50 }
    );
  });
});

describe('Property 20: Operation Loading Indicators - Edge Cases', () => {
  it('should handle empty operation string gracefully', () => {
    fc.assert(
      fc.property(
        fc.constant(''),
        (operation) => {
          const { container } = render(
            <LoadingIndicator operation={operation} />
          );

          // Property: Component must still render even with empty operation
          expect(container.querySelector('.loading-indicator')).toBeTruthy();

          cleanup();
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should handle very long operation strings', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 100, maxLength: 500 }).filter(s => s.trim().length > 0),
        (operation) => {
          const { container } = render(<LoadingIndicator operation={operation} />);

          // Property: Long operation text must be displayed (check via textContent)
          const operationElement = container.querySelector('.loading-operation');
          expect(operationElement).toBeTruthy();
          expect(operationElement?.textContent).toBe(operation);

          cleanup();
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should handle zero and negative estimated times', () => {
    fc.assert(
      fc.property(
        fc.record({
          operation: fc.string({ minLength: 5, maxLength: 50 }),
          estimatedTime: fc.integer({ min: -10, max: 0 }),
        }),
        (props) => {
          const { container } = render(
            <LoadingIndicator
              operation={props.operation}
              estimatedTime={props.estimatedTime}
            />
          );

          // Property: Component must render without crashing
          expect(container.querySelector('.loading-indicator')).toBeTruthy();

          cleanup();
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should handle special characters in operation text', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 5, maxLength: 50 }),
        (operation) => {
          const operationWithSpecialChars = `${operation} <>&"'`;
          
          const { container } = render(<LoadingIndicator operation={operationWithSpecialChars} />);

          // Property: Special characters must be handled safely (React escapes them)
          // Check that the component renders without crashing
          expect(container.querySelector('.loading-indicator')).toBeTruthy();
          
          // Check that operation text is present (may be escaped by React)
          const operationElement = container.querySelector('.loading-operation');
          expect(operationElement).toBeTruthy();
          expect(operationElement?.textContent).toContain(operation);

          cleanup();
        }
      ),
      { numRuns: 30 }
    );
  });
});
