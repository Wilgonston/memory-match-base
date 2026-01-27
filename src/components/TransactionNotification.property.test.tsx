/**
 * TransactionNotification Property-Based Tests
 * 
 * Property 22: Transaction Notification Lifecycle
 * For any transaction, the system should display notifications at each lifecycle 
 * stage (submitted, pending, confirmed/failed) with appropriate status information 
 * and transaction hash.
 * 
 * Validates: Requirements 13.1, 13.2, 13.3, 13.4
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import fc from 'fast-check';
import { TransactionNotification, TransactionStatus } from './TransactionNotification';

describe('Property 22: Transaction Notification Lifecycle', () => {
  // Feature: base-ecosystem-integration, Property 22: For any transaction, the system should display notifications at each lifecycle stage
  it('should display notification for any transaction at any lifecycle stage', () => {
    fc.assert(
      fc.property(
        fc.record({
          hash: fc.hexaString({ minLength: 64, maxLength: 66 }).map(h => h.startsWith('0x') ? h : `0x${h}`),
          status: fc.constantFrom<TransactionStatus>('submitted', 'pending', 'confirmed', 'failed'),
          network: fc.constantFrom<'mainnet' | 'sepolia'>('mainnet', 'sepolia'),
          error: fc.option(fc.string({ minLength: 5, maxLength: 100 }), { nil: undefined }),
        }),
        (props) => {
          const { container } = render(
            <TransactionNotification
              hash={props.hash}
              status={props.status}
              network={props.network}
              error={props.error}
              autoDismissDelay={0} // Disable auto-dismiss for testing
            />
          );

          // Property: Notification must be visible
          const notification = container.querySelector('.transaction-notification');
          expect(notification).toBeTruthy();

          // Property: Must have status class
          expect(notification?.classList.contains(props.status)).toBe(true);

          // Property: Transaction hash must be displayed (truncated)
          const hashElement = container.querySelector('.notification-hash');
          expect(hashElement).toBeTruthy();
          expect(hashElement?.textContent).toContain(props.hash.slice(0, 10));
          expect(hashElement?.textContent).toContain(props.hash.slice(-8));

          // Property: Status label must be present
          const statusLabel = container.querySelector('.notification-status');
          expect(statusLabel).toBeTruthy();

          cleanup();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should display correct status label for each lifecycle stage', () => {
    fc.assert(
      fc.property(
        fc.record({
          hash: fc.hexaString({ minLength: 64, maxLength: 64 }).map(h => `0x${h}`),
          status: fc.constantFrom<TransactionStatus>('submitted', 'pending', 'confirmed', 'failed'),
        }),
        (props) => {
          render(
            <TransactionNotification
              hash={props.hash}
              status={props.status}
              autoDismissDelay={0}
            />
          );

          // Property: Status label must match the status
          const expectedLabels: Record<TransactionStatus, string> = {
            submitted: 'Submitted',
            pending: 'Pending',
            confirmed: 'Confirmed',
            failed: 'Failed',
          };

          expect(screen.getByText(expectedLabels[props.status])).toBeInTheDocument();

          cleanup();
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should display appropriate message for each status', () => {
    fc.assert(
      fc.property(
        fc.record({
          hash: fc.hexaString({ minLength: 64, maxLength: 64 }).map(h => `0x${h}`),
          status: fc.constantFrom<TransactionStatus>('submitted', 'pending', 'confirmed', 'failed'),
          error: fc.option(fc.string({ minLength: 5, maxLength: 100 }), { nil: undefined }),
        }),
        (props) => {
          const { container } = render(
            <TransactionNotification
              hash={props.hash}
              status={props.status}
              error={props.error}
              autoDismissDelay={0}
            />
          );

          // Property: Must have notification body with message
          const body = container.querySelector('.notification-body');
          expect(body).toBeTruthy();

          // Property: Message must be appropriate for status
          if (props.status === 'submitted') {
            expect(body?.textContent).toContain('submitted');
          } else if (props.status === 'pending') {
            expect(body?.textContent).toContain('confirmation');
          } else if (props.status === 'confirmed') {
            expect(body?.textContent).toContain('confirmed');
          } else if (props.status === 'failed') {
            expect(body?.textContent).toBeTruthy();
          }

          cleanup();
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should include BaseScan link for any transaction', () => {
    fc.assert(
      fc.property(
        fc.record({
          hash: fc.hexaString({ minLength: 64, maxLength: 64 }).map(h => `0x${h}`),
          status: fc.constantFrom<TransactionStatus>('submitted', 'pending', 'confirmed', 'failed'),
          network: fc.constantFrom<'mainnet' | 'sepolia'>('mainnet', 'sepolia'),
        }),
        (props) => {
          const { container } = render(
            <TransactionNotification
              hash={props.hash}
              status={props.status}
              network={props.network}
              autoDismissDelay={0}
            />
          );

          // Property: Must have BaseScan link
          const link = container.querySelector('.notification-link') as HTMLAnchorElement;
          expect(link).toBeTruthy();
          expect(link?.href).toContain(props.hash);
          
          // Property: Link must point to correct network
          if (props.network === 'mainnet') {
            expect(link?.href).toContain('basescan.org');
          } else {
            expect(link?.href).toContain('sepolia.basescan.org');
          }

          cleanup();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have dismiss button for any notification', () => {
    fc.assert(
      fc.property(
        fc.record({
          hash: fc.hexaString({ minLength: 64, maxLength: 64 }).map(h => `0x${h}`),
          status: fc.constantFrom<TransactionStatus>('submitted', 'pending', 'confirmed', 'failed'),
        }),
        (props) => {
          const onDismiss = vi.fn();

          render(
            <TransactionNotification
              hash={props.hash}
              status={props.status}
              onDismiss={onDismiss}
              autoDismissDelay={0}
            />
          );

          // Property: Must have dismiss button
          const dismissButton = screen.getByRole('button', { name: /dismiss/i });
          expect(dismissButton).toBeInTheDocument();

          cleanup();
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should display error message for failed transactions', () => {
    fc.assert(
      fc.property(
        fc.record({
          hash: fc.hexaString({ minLength: 64, maxLength: 64 }).map(h => `0x${h}`),
          error: fc.string({ minLength: 10, maxLength: 200 }),
        }),
        (props) => {
          const { container } = render(
            <TransactionNotification
              hash={props.hash}
              status="failed"
              error={props.error}
              autoDismissDelay={0}
            />
          );

          // Property: Error message must be displayed
          const body = container.querySelector('.notification-body');
          expect(body?.textContent).toContain(props.error);

          cleanup();
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should maintain consistent structure across all statuses', () => {
    fc.assert(
      fc.property(
        fc.record({
          hash: fc.hexaString({ minLength: 64, maxLength: 64 }).map(h => `0x${h}`),
          status: fc.constantFrom<TransactionStatus>('submitted', 'pending', 'confirmed', 'failed'),
          network: fc.constantFrom<'mainnet' | 'sepolia'>('mainnet', 'sepolia'),
        }),
        (props) => {
          const { container } = render(
            <TransactionNotification
              hash={props.hash}
              status={props.status}
              network={props.network}
              autoDismissDelay={0}
            />
          );

          // Property: Must have consistent structure
          expect(container.querySelector('.transaction-notification')).toBeTruthy();
          expect(container.querySelector('.notification-icon')).toBeTruthy();
          expect(container.querySelector('.notification-content')).toBeTruthy();
          expect(container.querySelector('.notification-header')).toBeTruthy();
          expect(container.querySelector('.notification-status')).toBeTruthy();
          expect(container.querySelector('.notification-body')).toBeTruthy();
          expect(container.querySelector('.notification-link')).toBeTruthy();
          expect(container.querySelector('.notification-hash')).toBeTruthy();
          expect(container.querySelector('.notification-dismiss')).toBeTruthy();

          cleanup();
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property 22: Transaction Notification Lifecycle - Edge Cases', () => {
  it('should handle very long transaction hashes', () => {
    fc.assert(
      fc.property(
        fc.hexaString({ minLength: 64, maxLength: 128 }).map(h => `0x${h}`),
        (hash) => {
          const { container } = render(
            <TransactionNotification
              hash={hash}
              status="submitted"
              autoDismissDelay={0}
            />
          );

          // Property: Must display truncated hash
          const hashElement = container.querySelector('.notification-hash');
          expect(hashElement).toBeTruthy();
          expect(hashElement?.textContent).toContain('...');

          cleanup();
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should handle very long error messages', () => {
    fc.assert(
      fc.property(
        fc.record({
          hash: fc.hexaString({ minLength: 64, maxLength: 64 }).map(h => `0x${h}`),
          error: fc.string({ minLength: 200, maxLength: 1000 }),
        }),
        (props) => {
          const { container } = render(
            <TransactionNotification
              hash={props.hash}
              status="failed"
              error={props.error}
              autoDismissDelay={0}
            />
          );

          // Property: Must render without crashing
          expect(container.querySelector('.transaction-notification')).toBeTruthy();

          cleanup();
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should handle missing error message for failed status', () => {
    fc.assert(
      fc.property(
        fc.hexaString({ minLength: 64, maxLength: 64 }).map(h => `0x${h}`),
        (hash) => {
          const { container } = render(
            <TransactionNotification
              hash={hash}
              status="failed"
              // No error provided
              autoDismissDelay={0}
            />
          );

          // Property: Must show default error message
          const body = container.querySelector('.notification-body');
          expect(body?.textContent).toContain('failed');

          cleanup();
        }
      ),
      { numRuns: 30 }
    );
  });

  it('should handle auto-dismiss for completed transactions', async () => {
    fc.assert(
      fc.asyncProperty(
        fc.record({
          hash: fc.hexaString({ minLength: 64, maxLength: 64 }).map(h => `0x${h}`),
          status: fc.constantFrom<TransactionStatus>('confirmed', 'failed'),
          delay: fc.integer({ min: 100, max: 500 }),
        }),
        async (props) => {
          const onDismiss = vi.fn();

          const { container } = render(
            <TransactionNotification
              hash={props.hash}
              status={props.status}
              onDismiss={onDismiss}
              autoDismissDelay={props.delay}
            />
          );

          // Property: Notification must be visible initially
          expect(container.querySelector('.transaction-notification')).toBeTruthy();

          // Property: onDismiss must be called after delay
          await waitFor(
            () => {
              expect(onDismiss).toHaveBeenCalled();
            },
            { timeout: props.delay + 1000 }
          );

          cleanup();
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should not auto-dismiss pending or submitted transactions', async () => {
    fc.assert(
      fc.asyncProperty(
        fc.record({
          hash: fc.hexaString({ minLength: 64, maxLength: 64 }).map(h => `0x${h}`),
          status: fc.constantFrom<TransactionStatus>('submitted', 'pending'),
        }),
        async (props) => {
          const onDismiss = vi.fn();

          const { container } = render(
            <TransactionNotification
              hash={props.hash}
              status={props.status}
              onDismiss={onDismiss}
              autoDismissDelay={500}
            />
          );

          // Wait longer than auto-dismiss delay
          await new Promise(resolve => setTimeout(resolve, 700));

          // Property: onDismiss must NOT be called for active transactions
          expect(onDismiss).not.toHaveBeenCalled();

          // Property: Notification must still be visible
          expect(container.querySelector('.transaction-notification')).toBeTruthy();

          cleanup();
        }
      ),
      { numRuns: 20 }
    );
  });
});
