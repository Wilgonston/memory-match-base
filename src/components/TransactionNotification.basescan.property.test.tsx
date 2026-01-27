/**
 * TransactionNotification BaseScan Link Property-Based Tests
 * 
 * Property 23: BaseScan Link Generation
 * For any transaction hash on Base network, the system should generate a valid 
 * BaseScan URL that links to the transaction details.
 * 
 * Validates: Requirements 13.5
 */

import { describe, it, expect } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import fc from 'fast-check';
import { TransactionNotification } from './TransactionNotification';

describe('Property 23: BaseScan Link Generation', () => {
  // Feature: base-ecosystem-integration, Property 23: For any transaction hash on Base network, the system should generate a valid BaseScan URL
  it('should generate valid BaseScan URL for any transaction hash', () => {
    fc.assert(
      fc.property(
        fc.record({
          hash: fc.hexaString({ minLength: 64, maxLength: 64 }).map(h => `0x${h}`),
          network: fc.constantFrom<'mainnet' | 'sepolia'>('mainnet', 'sepolia'),
        }),
        (props) => {
          const { container } = render(
            <TransactionNotification
              hash={props.hash}
              status="submitted"
              network={props.network}
              autoDismissDelay={0}
            />
          );

          // Property: Must have BaseScan link
          const link = container.querySelector('.notification-link') as HTMLAnchorElement;
          expect(link).toBeTruthy();

          // Property: Link must be valid URL
          expect(() => new URL(link.href)).not.toThrow();

          // Property: Link must contain transaction hash
          expect(link.href).toContain(props.hash);

          // Property: Link must point to correct BaseScan domain
          const url = new URL(link.href);
          if (props.network === 'mainnet') {
            expect(url.hostname).toBe('basescan.org');
          } else {
            expect(url.hostname).toBe('sepolia.basescan.org');
          }

          // Property: Link must have /tx/ path
          expect(url.pathname).toContain('/tx/');

          cleanup();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should generate mainnet BaseScan URL for mainnet transactions', () => {
    fc.assert(
      fc.property(
        fc.hexaString({ minLength: 64, maxLength: 64 }).map(h => `0x${h}`),
        (hash) => {
          const { container } = render(
            <TransactionNotification
              hash={hash}
              status="confirmed"
              network="mainnet"
              autoDismissDelay={0}
            />
          );

          // Property: Mainnet link must point to basescan.org
          const link = container.querySelector('.notification-link') as HTMLAnchorElement;
          expect(link.href).toContain('https://basescan.org/tx/');
          expect(link.href).toContain(hash);

          cleanup();
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should generate sepolia BaseScan URL for sepolia transactions', () => {
    fc.assert(
      fc.property(
        fc.hexaString({ minLength: 64, maxLength: 64 }).map(h => `0x${h}`),
        (hash) => {
          const { container } = render(
            <TransactionNotification
              hash={hash}
              status="pending"
              network="sepolia"
              autoDismissDelay={0}
            />
          );

          // Property: Sepolia link must point to sepolia.basescan.org
          const link = container.querySelector('.notification-link') as HTMLAnchorElement;
          expect(link.href).toContain('https://sepolia.basescan.org/tx/');
          expect(link.href).toContain(hash);

          cleanup();
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should generate correct URL format for all transaction statuses', () => {
    fc.assert(
      fc.property(
        fc.record({
          hash: fc.hexaString({ minLength: 64, maxLength: 64 }).map(h => `0x${h}`),
          status: fc.constantFrom('submitted', 'pending', 'confirmed', 'failed'),
          network: fc.constantFrom<'mainnet' | 'sepolia'>('mainnet', 'sepolia'),
        }),
        (props) => {
          const { container } = render(
            <TransactionNotification
              hash={props.hash}
              status={props.status as any}
              network={props.network}
              autoDismissDelay={0}
            />
          );

          // Property: URL format must be consistent across all statuses
          const link = container.querySelector('.notification-link') as HTMLAnchorElement;
          const url = new URL(link.href);

          // Must use HTTPS
          expect(url.protocol).toBe('https:');

          // Must have correct path structure
          expect(url.pathname).toMatch(/^\/tx\/0x[0-9a-fA-F]+$/);

          // Must match the transaction hash
          expect(url.pathname).toContain(props.hash);

          cleanup();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should open BaseScan link in new tab', () => {
    fc.assert(
      fc.property(
        fc.record({
          hash: fc.hexaString({ minLength: 64, maxLength: 64 }).map(h => `0x${h}`),
          network: fc.constantFrom<'mainnet' | 'sepolia'>('mainnet', 'sepolia'),
        }),
        (props) => {
          const { container } = render(
            <TransactionNotification
              hash={props.hash}
              status="confirmed"
              network={props.network}
              autoDismissDelay={0}
            />
          );

          // Property: Link must open in new tab
          const link = container.querySelector('.notification-link') as HTMLAnchorElement;
          expect(link.target).toBe('_blank');
          expect(link.rel).toContain('noopener');
          expect(link.rel).toContain('noreferrer');

          cleanup();
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should handle transaction hashes with and without 0x prefix', () => {
    fc.assert(
      fc.property(
        fc.record({
          hash: fc.hexaString({ minLength: 64, maxLength: 64 }),
          hasPrefix: fc.boolean(),
        }),
        (props) => {
          const hash = props.hasPrefix ? `0x${props.hash}` : props.hash;

          const { container } = render(
            <TransactionNotification
              hash={hash}
              status="submitted"
              network="mainnet"
              autoDismissDelay={0}
            />
          );

          // Property: Link must be generated regardless of 0x prefix
          const link = container.querySelector('.notification-link') as HTMLAnchorElement;
          expect(link).toBeTruthy();
          expect(link.href).toContain('basescan.org/tx/');

          cleanup();
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should preserve transaction hash case in URL', () => {
    fc.assert(
      fc.property(
        fc.hexaString({ minLength: 64, maxLength: 64 }).map(h => `0x${h}`),
        (hash) => {
          const { container } = render(
            <TransactionNotification
              hash={hash}
              status="confirmed"
              network="mainnet"
              autoDismissDelay={0}
            />
          );

          // Property: Hash in URL must match original hash
          const link = container.querySelector('.notification-link') as HTMLAnchorElement;
          expect(link.href).toContain(hash);

          cleanup();
        }
      ),
      { numRuns: 50 }
    );
  });
});

describe('Property 23: BaseScan Link Generation - Edge Cases', () => {
  it('should handle very long transaction hashes', () => {
    fc.assert(
      fc.property(
        fc.hexaString({ minLength: 64, maxLength: 128 }).map(h => `0x${h}`),
        (hash) => {
          const { container } = render(
            <TransactionNotification
              hash={hash}
              status="submitted"
              network="mainnet"
              autoDismissDelay={0}
            />
          );

          // Property: Must generate link even for long hashes
          const link = container.querySelector('.notification-link') as HTMLAnchorElement;
          expect(link).toBeTruthy();
          expect(link.href).toContain('basescan.org/tx/');

          cleanup();
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should handle short transaction hashes', () => {
    fc.assert(
      fc.property(
        fc.hexaString({ minLength: 10, maxLength: 40 }).map(h => `0x${h}`),
        (hash) => {
          const { container } = render(
            <TransactionNotification
              hash={hash}
              status="submitted"
              network="mainnet"
              autoDismissDelay={0}
            />
          );

          // Property: Must generate link even for short hashes
          const link = container.querySelector('.notification-link') as HTMLAnchorElement;
          expect(link).toBeTruthy();
          expect(link.href).toContain(hash);

          cleanup();
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should handle uppercase and lowercase hex characters', () => {
    fc.assert(
      fc.property(
        fc.record({
          hash: fc.hexaString({ minLength: 64, maxLength: 64 }),
          uppercase: fc.boolean(),
        }),
        (props) => {
          const hash = props.uppercase 
            ? `0x${props.hash.toUpperCase()}`
            : `0x${props.hash.toLowerCase()}`;

          const { container } = render(
            <TransactionNotification
              hash={hash}
              status="confirmed"
              network="mainnet"
              autoDismissDelay={0}
            />
          );

          // Property: Link must work with any case
          const link = container.querySelector('.notification-link') as HTMLAnchorElement;
          expect(link.href).toContain(hash);

          cleanup();
        }
      ),
      { numRuns: 30 }
    );
  });

  it('should default to mainnet when network not specified', () => {
    fc.assert(
      fc.property(
        fc.hexaString({ minLength: 64, maxLength: 64 }).map(h => `0x${h}`),
        (hash) => {
          const { container } = render(
            <TransactionNotification
              hash={hash}
              status="submitted"
              // network not specified
              autoDismissDelay={0}
            />
          );

          // Property: Must default to mainnet BaseScan
          const link = container.querySelector('.notification-link') as HTMLAnchorElement;
          expect(link.href).toContain('https://basescan.org/tx/');

          cleanup();
        }
      ),
      { numRuns: 30 }
    );
  });

  it('should generate unique URLs for different transaction hashes', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.hexaString({ minLength: 64, maxLength: 64 }).map(h => `0x${h}`),
          fc.hexaString({ minLength: 64, maxLength: 64 }).map(h => `0x${h}`)
        ).filter(([hash1, hash2]) => hash1 !== hash2),
        ([hash1, hash2]) => {
          const { container: container1 } = render(
            <TransactionNotification
              hash={hash1}
              status="submitted"
              network="mainnet"
              autoDismissDelay={0}
            />
          );

          const link1 = container1.querySelector('.notification-link') as HTMLAnchorElement;
          cleanup();

          const { container: container2 } = render(
            <TransactionNotification
              hash={hash2}
              status="submitted"
              network="mainnet"
              autoDismissDelay={0}
            />
          );

          const link2 = container2.querySelector('.notification-link') as HTMLAnchorElement;

          // Property: Different hashes must generate different URLs
          expect(link1.href).not.toBe(link2.href);
          expect(link1.href).toContain(hash1);
          expect(link2.href).toContain(hash2);

          cleanup();
        }
      ),
      { numRuns: 30 }
    );
  });
});
