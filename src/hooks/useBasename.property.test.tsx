/**
 * Property-Based Tests for useBasename Hook
 * 
 * Tests Property 15: Basename Resolution Consistency
 * 
 * **Validates: Requirements 16.1, 16.2**
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import * as fc from 'fast-check';
import { useBasename, truncateAddress, clearBasenameCache } from './useBasename';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock OnchainKit's useName hook
vi.mock('@coinbase/onchainkit/identity', () => ({
  useName: vi.fn(),
}));

import { useName } from '@coinbase/onchainkit/identity';

describe('useBasename - Property-Based Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    clearBasenameCache();
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  /**
   * Property 15: Basename Resolution Consistency
   * 
   * For any Ethereum address:
   * - If a Basename exists, the Identity_Provider should resolve and display it
   * - Otherwise, display a truncated address
   * 
   * **Validates: Requirements 16.1, 16.2**
   */
  describe('Property 15: Basename Resolution Consistency', () => {
    it('should display basename when it exists', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random Ethereum addresses
          fc.hexaString({ minLength: 40, maxLength: 40 }),
          // Generate random basenames
          fc.string({ minLength: 3, maxLength: 20 }).map(s => `${s}.base.eth`),
          async (addressHex, basename) => {
            const address = `0x${addressHex}` as `0x${string}`;

            // Clear cache before each test
            clearBasenameCache();

            // Mock useName to return the basename
            vi.mocked(useName).mockReturnValue({
              data: basename,
              isLoading: false,
              isError: false,
              error: null,
            } as any);

            const { result } = renderHook(() => useBasename(address), { wrapper });

            // Should display the basename immediately (not loading)
            expect(result.current.isLoading).toBe(false);
            expect(result.current.displayName).toBe(basename);
            expect(result.current.basename).toBe(basename);
          }
        ),
        { numRuns: 50, timeout: 10000 }
      );
    });

    it('should display truncated address when basename does not exist', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random Ethereum addresses
          fc.hexaString({ minLength: 40, maxLength: 40 }),
          async (addressHex) => {
            const address = `0x${addressHex}` as `0x${string}`;

            // Clear cache before each test
            clearBasenameCache();

            // Mock useName to return null (no basename)
            vi.mocked(useName).mockReturnValue({
              data: null,
              isLoading: false,
              isError: false,
              error: null,
            } as any);

            const { result } = renderHook(() => useBasename(address), { wrapper });

            // Should display truncated address immediately (not loading)
            expect(result.current.isLoading).toBe(false);
            
            const expectedTruncated = truncateAddress(address);
            expect(result.current.displayName).toBe(expectedTruncated);
            expect(result.current.basename).toBe(null);
            
            // Verify truncation format: 0x1234...5678
            expect(result.current.displayName).toMatch(/^0x[0-9a-f]{4}\.\.\.[0-9a-f]{4}$/i);
          }
        ),
        { numRuns: 50, timeout: 10000 }
      );
    });

    it('should handle undefined address gracefully', () => {
      // Mock useName to return null
      vi.mocked(useName).mockReturnValue({
        data: null,
        isLoading: false,
        isError: false,
        error: null,
      } as any);

      const { result } = renderHook(() => useBasename(undefined), { wrapper });

      // Should return empty string for undefined address
      expect(result.current.displayName).toBe('');
      expect(result.current.basename).toBe(null);
      expect(result.current.isLoading).toBe(false);
    });

    it('should cache basename resolutions for 5 minutes', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.hexaString({ minLength: 40, maxLength: 40 }),
          fc.string({ minLength: 3, maxLength: 20 }).map(s => `${s}.base.eth`),
          async (addressHex, basename) => {
            const address = `0x${addressHex}` as `0x${string}`;

            // First call - mock returns basename
            vi.mocked(useName).mockReturnValue({
              data: basename,
              isLoading: false,
              isError: false,
              error: null,
            } as any);

            const { result: result1 } = renderHook(() => useBasename(address), { wrapper });

            await waitFor(() => {
              expect(result1.current.isLoading).toBe(false);
            });

            expect(result1.current.displayName).toBe(basename);

            // Second call - should use cache, even if mock returns different value
            vi.mocked(useName).mockReturnValue({
              data: 'different.base.eth',
              isLoading: false,
              isError: false,
              error: null,
            } as any);

            const { result: result2 } = renderHook(() => useBasename(address), { wrapper });

            // Should still return cached basename
            expect(result2.current.displayName).toBe(basename);
            expect(result2.current.isLoading).toBe(false);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('truncateAddress utility', () => {
    it('should truncate addresses to 0x1234...5678 format', () => {
      fc.assert(
        fc.property(
          fc.hexaString({ minLength: 40, maxLength: 40 }),
          (addressHex) => {
            const address = `0x${addressHex}`;
            const truncated = truncateAddress(address);

            // Should match format: 0x1234...5678
            expect(truncated).toMatch(/^0x[0-9a-f]{4}\.\.\.[0-9a-f]{4}$/i);
            
            // Should start with first 6 characters (0x + 4 hex)
            expect(truncated.startsWith(address.slice(0, 6))).toBe(true);
            
            // Should end with last 4 characters
            expect(truncated.endsWith(address.slice(-4))).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle short addresses gracefully', () => {
      fc.assert(
        fc.property(
          fc.string({ maxLength: 9 }),
          (shortAddress) => {
            const truncated = truncateAddress(shortAddress);
            // Should return the address as-is if too short
            expect(truncated).toBe(shortAddress);
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
