/**
 * Wallet Migration Property-Based Tests
 * 
 * Property tests for Smart Wallet error handling and EOA detection.
 * 
 * Requirements: 6.4, 6.5
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import {
  isEOA,
  hasDismissedMigration,
  dismissMigration,
  clearMigrationDismissal,
  shouldOfferMigration,
  getMigrationStatus,
} from './walletMigration';

// Mock wagmi core
vi.mock('@wagmi/core', () => ({
  getPublicClient: vi.fn(),
}));

import { getPublicClient } from '@wagmi/core';

// Generator for valid Ethereum addresses
const ethereumAddressArbitrary = fc.hexaString({ minLength: 40, maxLength: 40 }).map(
  (hex) => `0x${hex}` as `0x${string}`
);

describe('Wallet Migration - Property-Based Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  /**
   * Property 7: Smart Wallet Error Handling
   * 
   * For any Smart Wallet creation failure, the system should provide
   * a descriptive error message and offer fallback connection options.
   * 
   * **Validates: Requirements 6.4**
   */
  describe('Property 7: Smart Wallet Error Handling', () => {
    it('should handle getBytecode errors gracefully for any address', async () => {
      await fc.assert(
        fc.asyncProperty(
          ethereumAddressArbitrary,
          async (address) => {
            // Mock getBytecode to throw an error
            vi.mocked(getPublicClient).mockReturnValue({
              getBytecode: vi.fn().mockRejectedValue(new Error('Network error')),
            } as any);

            // Property: Should not throw, should return false (assume Smart Wallet)
            const result = await isEOA(address);
            expect(result).toBe(false);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should handle missing public client gracefully for any address', async () => {
      await fc.assert(
        fc.asyncProperty(
          ethereumAddressArbitrary,
          async (address) => {
            // Mock getPublicClient to return null
            vi.mocked(getPublicClient).mockReturnValue(null as any);

            // Property: Should not throw, should return false
            const result = await isEOA(address);
            expect(result).toBe(false);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should provide consistent error handling for any error type', async () => {
      await fc.assert(
        fc.asyncProperty(
          ethereumAddressArbitrary,
          fc.string(),
          async (address, errorMessage) => {
            // Mock getBytecode to throw various errors
            vi.mocked(getPublicClient).mockReturnValue({
              getBytecode: vi.fn().mockRejectedValue(new Error(errorMessage)),
            } as any);

            // Property: Should always return false on error (safe default)
            const result = await isEOA(address);
            expect(result).toBe(false);
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  /**
   * Property 8: EOA Detection
   * 
   * For any connected address, the system should correctly detect
   * whether it is an EOA or a Smart Wallet contract.
   * 
   * **Validates: Requirements 6.5**
   */
  describe('Property 8: EOA Detection', () => {
    it('should detect EOA when bytecode is empty for any address', async () => {
      await fc.assert(
        fc.asyncProperty(
          ethereumAddressArbitrary,
          async (address) => {
            // Mock getBytecode to return no code (EOA)
            vi.mocked(getPublicClient).mockReturnValue({
              getBytecode: vi.fn().mockResolvedValue(undefined),
            } as any);

            // Property: Should return true for EOA
            const result = await isEOA(address);
            expect(result).toBe(true);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should detect EOA when bytecode is 0x for any address', async () => {
      await fc.assert(
        fc.asyncProperty(
          ethereumAddressArbitrary,
          async (address) => {
            // Mock getBytecode to return '0x' (EOA)
            vi.mocked(getPublicClient).mockReturnValue({
              getBytecode: vi.fn().mockResolvedValue('0x'),
            } as any);

            // Property: Should return true for EOA
            const result = await isEOA(address);
            expect(result).toBe(true);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should detect Smart Wallet when bytecode exists for any address', async () => {
      await fc.assert(
        fc.asyncProperty(
          ethereumAddressArbitrary,
          fc.hexaString({ minLength: 10, maxLength: 100 }),
          async (address, bytecode) => {
            // Mock getBytecode to return contract code (Smart Wallet)
            vi.mocked(getPublicClient).mockReturnValue({
              getBytecode: vi.fn().mockResolvedValue(`0x${bytecode}`),
            } as any);

            // Property: Should return false for Smart Wallet
            const result = await isEOA(address);
            expect(result).toBe(false);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should persist dismissal state for any address', () => {
      fc.assert(
        fc.property(
          ethereumAddressArbitrary,
          (address) => {
            // Initially not dismissed
            expect(hasDismissedMigration(address)).toBe(false);

            // Dismiss migration
            dismissMigration(address);

            // Property: Should be dismissed after calling dismissMigration
            expect(hasDismissedMigration(address)).toBe(true);

            // Clear dismissal
            clearMigrationDismissal(address);

            // Property: Should not be dismissed after clearing
            expect(hasDismissedMigration(address)).toBe(false);
          }
        ),
        { numRuns: 30 }
      );
    });

    it('should offer migration only for EOAs that have not dismissed', async () => {
      await fc.assert(
        fc.asyncProperty(
          ethereumAddressArbitrary,
          fc.boolean(),
          fc.boolean(),
          async (address, isEOAValue, hasDismissed) => {
            // Setup mocks
            if (isEOAValue) {
              vi.mocked(getPublicClient).mockReturnValue({
                getBytecode: vi.fn().mockResolvedValue(undefined),
              } as any);
            } else {
              vi.mocked(getPublicClient).mockReturnValue({
                getBytecode: vi.fn().mockResolvedValue('0x1234'),
              } as any);
            }

            if (hasDismissed) {
              dismissMigration(address);
            } else {
              clearMigrationDismissal(address);
            }

            // Property: Should offer migration only if EOA and not dismissed
            const shouldOffer = await shouldOfferMigration(address);
            expect(shouldOffer).toBe(isEOAValue && !hasDismissed);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should provide consistent migration status for any address', async () => {
      await fc.assert(
        fc.asyncProperty(
          ethereumAddressArbitrary,
          async (address) => {
            // Mock as EOA
            vi.mocked(getPublicClient).mockReturnValue({
              getBytecode: vi.fn().mockResolvedValue(undefined),
            } as any);

            // Get status twice
            const status1 = await getMigrationStatus(address);
            const status2 = await getMigrationStatus(address);

            // Property: Should return consistent results
            expect(status1.isEOA).toBe(status2.isEOA);
            expect(status1.hasDismissed).toBe(status2.hasDismissed);
            expect(status1.shouldOffer).toBe(status2.shouldOffer);
          }
        ),
        { numRuns: 20 }
      );
    });
  });
});
