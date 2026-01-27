/**
 * LoadingIndicator Cancellable Operations Property-Based Tests
 * 
 * Property 21: Cancellable Operation UI
 * For any long-running operation that supports cancellation, the system should 
 * provide a cancel button in the UI.
 * 
 * Validates: Requirements 12.5
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import fc from 'fast-check';
import { LoadingIndicator } from './LoadingIndicator';

describe('Property 21: Cancellable Operation UI', () => {
  // Feature: base-ecosystem-integration, Property 21: For any long-running operation that supports cancellation, the system should provide a cancel button
  it('should provide cancel button for any cancellable operation', () => {
    fc.assert(
      fc.property(
        fc.record({
          operation: fc.string({ minLength: 5, maxLength: 100 }).filter(s => s.trim().length > 0),
          cancellable: fc.boolean(),
          estimatedTime: fc.option(fc.integer({ min: 10, max: 300 }), { nil: undefined }),
        }),
        (props) => {
          const onCancel = vi.fn();

          const { container } = render(
            <LoadingIndicator
              operation={props.operation}
              cancellable={props.cancellable}
              onCancel={props.cancellable ? onCancel : undefined}
              estimatedTime={props.estimatedTime}
            />
          );

          // Property: Cancel button presence must match cancellable prop
          const cancelButton = container.querySelector('.loading-cancel-button');

          if (props.cancellable) {
            // Must have cancel button
            expect(cancelButton).toBeTruthy();
            expect(cancelButton).toHaveAttribute('aria-label', 'Cancel operation');
          } else {
            // Must not have cancel button
            expect(cancelButton).toBeFalsy();
          }

          cleanup();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should call onCancel callback when cancel button is clicked', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 5, maxLength: 50 }).filter(s => s.trim().length > 0),
        (operation) => {
          const onCancel = vi.fn();

          render(
            <LoadingIndicator
              operation={operation}
              cancellable={true}
              onCancel={onCancel}
            />
          );

          // Property: Cancel button must trigger onCancel callback
          const cancelButton = screen.getByRole('button', { name: /cancel/i });
          expect(cancelButton).toBeInTheDocument();

          // Click the button
          fireEvent.click(cancelButton);

          // Property: onCancel must be called exactly once
          expect(onCancel).toHaveBeenCalledTimes(1);

          cleanup();
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should handle multiple cancel button clicks', () => {
    fc.assert(
      fc.property(
        fc.record({
          operation: fc.string({ minLength: 5, maxLength: 50 }).filter(s => s.trim().length > 0),
          clickCount: fc.integer({ min: 1, max: 10 }),
        }),
        (props) => {
          const onCancel = vi.fn();

          render(
            <LoadingIndicator
              operation={props.operation}
              cancellable={true}
              onCancel={onCancel}
            />
          );

          const cancelButton = screen.getByRole('button', { name: /cancel/i });

          // Property: Each click must trigger onCancel
          for (let i = 0; i < props.clickCount; i++) {
            fireEvent.click(cancelButton);
          }

          expect(onCancel).toHaveBeenCalledTimes(props.clickCount);

          cleanup();
        }
      ),
      { numRuns: 30 }
    );
  });

  it('should not render cancel button when onCancel is not provided', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 5, maxLength: 50 }).filter(s => s.trim().length > 0),
        (operation) => {
          const { container } = render(
            <LoadingIndicator
              operation={operation}
              cancellable={true}
              // onCancel not provided
            />
          );

          // Property: No cancel button when onCancel is undefined
          const cancelButton = container.querySelector('.loading-cancel-button');
          expect(cancelButton).toBeFalsy();

          cleanup();
        }
      ),
      { numRuns: 30 }
    );
  });

  it('should maintain cancel button accessibility for all operations', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 5, maxLength: 100 }).filter(s => s.trim().length > 0),
        (operation) => {
          const onCancel = vi.fn();

          render(
            <LoadingIndicator
              operation={operation}
              cancellable={true}
              onCancel={onCancel}
            />
          );

          // Property: Cancel button must be accessible
          const cancelButton = screen.getByRole('button', { name: /cancel/i });
          
          // Must have accessible name
          expect(cancelButton).toHaveAccessibleName();
          
          // Must be keyboard focusable
          cancelButton.focus();
          expect(document.activeElement).toBe(cancelButton);

          cleanup();
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should render cancel button with consistent styling', () => {
    fc.assert(
      fc.property(
        fc.record({
          operation: fc.string({ minLength: 5, maxLength: 50 }).filter(s => s.trim().length > 0),
          estimatedTime: fc.option(fc.integer({ min: 1, max: 120 }), { nil: undefined }),
          stillWorking: fc.boolean(),
        }),
        (props) => {
          const onCancel = vi.fn();

          const { container } = render(
            <LoadingIndicator
              operation={props.operation}
              cancellable={true}
              onCancel={onCancel}
              estimatedTime={props.estimatedTime}
              stillWorking={props.stillWorking}
            />
          );

          // Property: Cancel button must have consistent class
          const cancelButton = container.querySelector('.loading-cancel-button');
          expect(cancelButton).toBeTruthy();
          expect(cancelButton?.classList.contains('loading-cancel-button')).toBe(true);

          cleanup();
        }
      ),
      { numRuns: 50 }
    );
  });
});

describe('Property 21: Cancellable Operation UI - Edge Cases', () => {
  it('should handle cancel button with very long operation names', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 200, maxLength: 500 }).filter(s => s.trim().length > 0),
        (operation) => {
          const onCancel = vi.fn();

          const { container } = render(
            <LoadingIndicator
              operation={operation}
              cancellable={true}
              onCancel={onCancel}
            />
          );

          // Property: Cancel button must render even with very long operation names
          const cancelButton = container.querySelector('.loading-cancel-button');
          expect(cancelButton).toBeTruthy();

          cleanup();
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should handle rapid cancel button clicks', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 5, max: 20 }),
        (rapidClicks) => {
          const onCancel = vi.fn();

          render(
            <LoadingIndicator
              operation="Processing"
              cancellable={true}
              onCancel={onCancel}
            />
          );

          const cancelButton = screen.getByRole('button', { name: /cancel/i });

          // Property: Rapid clicks must all be registered
          for (let i = 0; i < rapidClicks; i++) {
            fireEvent.click(cancelButton);
          }

          expect(onCancel).toHaveBeenCalledTimes(rapidClicks);

          cleanup();
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should handle cancel button with keyboard events', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 5, maxLength: 50 }).filter(s => s.trim().length > 0),
        (operation) => {
          const onCancel = vi.fn();

          render(
            <LoadingIndicator
              operation={operation}
              cancellable={true}
              onCancel={onCancel}
            />
          );

          const cancelButton = screen.getByRole('button', { name: /cancel/i });

          // Property: Cancel button must be keyboard accessible
          cancelButton.focus();
          expect(document.activeElement).toBe(cancelButton);

          // Simulate Enter key
          fireEvent.keyDown(cancelButton, { key: 'Enter', code: 'Enter' });
          
          // Button should still be in the document
          expect(cancelButton).toBeInTheDocument();

          cleanup();
        }
      ),
      { numRuns: 30 }
    );
  });

  it('should maintain cancel button state across re-renders', () => {
    fc.assert(
      fc.property(
        fc.record({
          operation: fc.string({ minLength: 5, maxLength: 50 }).filter(s => s.trim().length > 0),
          estimatedTime: fc.integer({ min: 1, max: 60 }),
        }),
        (props) => {
          const onCancel = vi.fn();

          const { rerender, container } = render(
            <LoadingIndicator
              operation={props.operation}
              cancellable={true}
              onCancel={onCancel}
              estimatedTime={props.estimatedTime}
            />
          );

          // Property: Cancel button must be present initially
          let cancelButton = container.querySelector('.loading-cancel-button');
          expect(cancelButton).toBeTruthy();

          // Re-render with updated estimated time
          rerender(
            <LoadingIndicator
              operation={props.operation}
              cancellable={true}
              onCancel={onCancel}
              estimatedTime={props.estimatedTime + 10}
            />
          );

          // Property: Cancel button must still be present after re-render
          cancelButton = container.querySelector('.loading-cancel-button');
          expect(cancelButton).toBeTruthy();

          cleanup();
        }
      ),
      { numRuns: 30 }
    );
  });
});
