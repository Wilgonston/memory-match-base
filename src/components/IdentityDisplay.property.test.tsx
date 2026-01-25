/**
 * Property-Based Tests for IdentityDisplay Component
 * 
 * Tests Property 16: Identity Update on Wallet Change
 * 
 * **Validates: Requirements 16.6**
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import * as fc from 'fast-check';
import { IdentityDisplay } from './IdentityDisplay';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock wagmi's useAccount hook
vi.mock('wagmi', () => ({
  useAccount: vi.fn(),
}));

// Mock OnchainKit's identity components
vi.mock('@coinbase/onchainkit/identity', () => ({
  Identity: ({ children, address }: any) => (
    <div data-testid="identity" data-address={address}>
      {children}
    </div>
  ),
  Avatar: ({ className }: any) => (
    <div data-testid="avatar" className={className}>Avatar</div>
  ),
  Name: ({ className }: any) => (
    <div data-testid="name" className={className}>Name</div>
  ),
  Address: ({ className }: any) => (
    <div data-testid="address" className={className}>Address</div>
  ),
}));

import { useAccount } from 'wagmi';

describe('IdentityDisplay - Property-Based Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  // Helper to render with cleanup
  const renderWithCleanup = () => {
    const result = render(<IdentityDisplay />, { wrapper });
    return result;
  };

  /**
   * Property 16: Identity Update on Wallet Change
   * 
   * For any wallet change, the displayed identity should update to match
   * the new wallet's identity.
   * 
   * **Validates: Requirements 16.6**
   */
  describe('Property 16: Identity Update on Wallet Change', () => {
    it('should update identity when wallet address changes', () => {
      fc.assert(
        fc.property(
          // Generate two different Ethereum addresses
          fc.hexaString({ minLength: 40, maxLength: 40 }),
          fc.hexaString({ minLength: 40, maxLength: 40 }),
          (addressHex1, addressHex2) => {
            // Ensure addresses are different
            fc.pre(addressHex1 !== addressHex2);

            const address1 = `0x${addressHex1}` as `0x${string}`;
            const address2 = `0x${addressHex2}` as `0x${string}`;

            // Mock first wallet connection
            vi.mocked(useAccount).mockReturnValue({
              address: address1,
              isConnected: true,
            } as any);

            const { rerender, container, unmount } = render(<IdentityDisplay />, { wrapper });

            // Should display first address - use container query
            const identity1 = container.querySelector('[data-testid="identity"]');
            expect(identity1).toHaveAttribute('data-address', address1);

            // Mock wallet change to second address
            vi.mocked(useAccount).mockReturnValue({
              address: address2,
              isConnected: true,
            } as any);

            rerender(<IdentityDisplay />);

            // Should update to display second address
            const identity2 = container.querySelector('[data-testid="identity"]');
            expect(identity2).toHaveAttribute('data-address', address2);

            // Clean up
            unmount();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should hide identity when wallet disconnects', () => {
      fc.assert(
        fc.property(
          fc.hexaString({ minLength: 40, maxLength: 40 }),
          (addressHex) => {
            const address = `0x${addressHex}` as `0x${string}`;

            // Mock wallet connection
            vi.mocked(useAccount).mockReturnValue({
              address: address,
              isConnected: true,
            } as any);

            const { rerender, container, unmount } = render(<IdentityDisplay />, { wrapper });

            // Should display identity
            const identity1 = container.querySelector('[data-testid="identity"]');
            expect(identity1).toBeInTheDocument();

            // Mock wallet disconnection
            vi.mocked(useAccount).mockReturnValue({
              address: undefined,
              isConnected: false,
            } as any);

            rerender(<IdentityDisplay />);

            // Should hide identity
            expect(container.firstChild).toBeNull();

            // Clean up
            unmount();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should show identity when wallet connects', () => {
      fc.assert(
        fc.property(
          fc.hexaString({ minLength: 40, maxLength: 40 }),
          (addressHex) => {
            const address = `0x${addressHex}` as `0x${string}`;

            // Mock no wallet connection
            vi.mocked(useAccount).mockReturnValue({
              address: undefined,
              isConnected: false,
            } as any);

            const { rerender, container, unmount } = render(<IdentityDisplay />, { wrapper });

            // Should not display identity
            expect(container.firstChild).toBeNull();

            // Mock wallet connection
            vi.mocked(useAccount).mockReturnValue({
              address: address,
              isConnected: true,
            } as any);

            rerender(<IdentityDisplay />);

            // Should show identity - use container query to avoid multiple elements issue
            const identity = container.querySelector('[data-testid="identity"]');
            expect(identity).toBeInTheDocument();
            expect(identity).toHaveAttribute('data-address', address);

            // Clean up
            unmount();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle multiple wallet switches correctly', () => {
      fc.assert(
        fc.property(
          // Generate array of 3-5 different addresses
          fc.array(
            fc.hexaString({ minLength: 40, maxLength: 40 }),
            { minLength: 3, maxLength: 5 }
          ).map(addresses => {
            // Ensure all addresses are unique
            const uniqueAddresses = Array.from(new Set(addresses));
            return uniqueAddresses.slice(0, Math.min(uniqueAddresses.length, 5));
          }),
          (addressHexes) => {
            fc.pre(addressHexes.length >= 3);

            const addresses = addressHexes.map(hex => `0x${hex}` as `0x${string}`);

            // Start with first address
            vi.mocked(useAccount).mockReturnValue({
              address: addresses[0],
              isConnected: true,
            } as any);

            const { rerender, unmount, container } = render(<IdentityDisplay />, { wrapper });

            // Verify first address - use container query
            const identity1 = container.querySelector('[data-testid="identity"]');
            expect(identity1).toHaveAttribute('data-address', addresses[0]);

            // Switch through all addresses
            for (let i = 1; i < addresses.length; i++) {
              vi.mocked(useAccount).mockReturnValue({
                address: addresses[i],
                isConnected: true,
              } as any);

              rerender(<IdentityDisplay />);

              // Should update to current address
              const identity = container.querySelector('[data-testid="identity"]');
              expect(identity).toHaveAttribute('data-address', addresses[i]);
            }

            // Clean up
            unmount();
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should maintain component structure across wallet changes', () => {
      fc.assert(
        fc.property(
          fc.hexaString({ minLength: 40, maxLength: 40 }),
          fc.hexaString({ minLength: 40, maxLength: 40 }),
          (addressHex1, addressHex2) => {
            fc.pre(addressHex1 !== addressHex2);

            const address1 = `0x${addressHex1}` as `0x${string}`;
            const address2 = `0x${addressHex2}` as `0x${string}`;

            // Mock first wallet
            vi.mocked(useAccount).mockReturnValue({
              address: address1,
              isConnected: true,
            } as any);

            const { rerender, unmount, container } = render(<IdentityDisplay />, { wrapper });

            // Verify all components present
            const identities = container.querySelectorAll('[data-testid="identity"]');
            const avatars = container.querySelectorAll('[data-testid="avatar"]');
            const names = container.querySelectorAll('[data-testid="name"]');
            const addresses = container.querySelectorAll('[data-testid="address"]');

            expect(identities.length).toBe(1);
            expect(avatars.length).toBe(1);
            expect(names.length).toBe(1);
            expect(addresses.length).toBe(1);

            // Switch wallet
            vi.mocked(useAccount).mockReturnValue({
              address: address2,
              isConnected: true,
            } as any);

            rerender(<IdentityDisplay />);

            // All components should still be present (and only one of each)
            const identities2 = container.querySelectorAll('[data-testid="identity"]');
            const avatars2 = container.querySelectorAll('[data-testid="avatar"]');
            const names2 = container.querySelectorAll('[data-testid="name"]');
            const addresses2 = container.querySelectorAll('[data-testid="address"]');

            expect(identities2.length).toBe(1);
            expect(avatars2.length).toBe(1);
            expect(names2.length).toBe(1);
            expect(addresses2.length).toBe(1);

            // Clean up
            unmount();
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
