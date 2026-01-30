/**
 * Property-Based Tests for SpendPermissionManager
 * 
 * Tests universal properties of spend permission management using fast-check.
 * 
 * Requirements: 7.5, 7.7
 */

import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { SpendPermissionManager } from './SpendPermissionManager';
import type { Address } from 'viem';

describe('SpendPermissionManager Property Tests', () => {
  let manager: SpendPermissionManager;

  beforeEach(() => {
    manager = new SpendPermissionManager();
  });

  // Arbitraries for generating test data
  const addressArb = fc.hexaString({ minLength: 40, maxLength: 40 }).map(
    (hex) => `0x${hex}` as Address
  );

  const positiveAmountArb = fc.bigInt({ min: 1n, max: 1000000000000000000n });

  const periodArb = fc.integer({ min: 1, max: 365 * 24 * 60 * 60 }); // Up to 1 year

  const timestampArb = fc.integer({ min: 0, max: 2147483647 }); // Valid Unix timestamps

  /**
   * Property 9: Spend Permission Enforcement
   * 
   * For any transaction to the MemoryMatchProgress contract, the system should verify
   * spend permission exists and is sufficient before executing the transaction.
   * 
   * Validates: Requirements 7.5
   */
  describe('Property 9: Spend Permission Enforcement', () => {
    it('should enforce permission exists before allowing spend', async () => {
      await fc.assert(
        fc.asyncProperty(
          addressArb,
          addressArb,
          positiveAmountArb,
          async (spender, token, amount) => {
            // Without permission, hasPermission should return false
            const hasPermBefore = await manager.hasPermission(spender, token, amount);
            expect(hasPermBefore).toBe(false);

            // After granting permission with sufficient allowance, should return true
            const now = Math.floor(Date.now() / 1000);
            await manager.requestPermission({
              spender,
              token,
              allowance: amount * 2n, // Grant more than needed
              period: 3600,
              start: now - 60, // Started 1 minute ago
              end: now + 3600, // Ends in 1 hour
            });

            const hasPermAfter = await manager.hasPermission(spender, token, amount);
            expect(hasPermAfter).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject spend when allowance is insufficient', async () => {
      await fc.assert(
        fc.asyncProperty(
          addressArb,
          addressArb,
          positiveAmountArb,
          async (spender, token, requestedAmount) => {
            // Grant permission with less allowance than requested
            // Ensure insufficient allowance is at least 1 but less than requested
            const insufficientAllowance = requestedAmount > 1n 
              ? requestedAmount / 2n 
              : requestedAmount;
            
            // Skip if allowance would be equal to requested (edge case)
            if (insufficientAllowance >= requestedAmount) {
              return;
            }

            const now = Math.floor(Date.now() / 1000);

            await manager.requestPermission({
              spender,
              token,
              allowance: insufficientAllowance,
              period: 3600,
              start: now - 60,
              end: now + 3600,
            });

            // Should not have permission for the larger amount
            const hasPerm = await manager.hasPermission(spender, token, requestedAmount);
            expect(hasPerm).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject spend when permission is expired', async () => {
      await fc.assert(
        fc.asyncProperty(
          addressArb,
          addressArb,
          positiveAmountArb,
          async (spender, token, amount) => {
            // Grant permission that has already expired
            const now = Math.floor(Date.now() / 1000);

            await manager.requestPermission({
              spender,
              token,
              allowance: amount * 2n,
              period: 3600,
              start: now - 7200, // Started 2 hours ago
              end: now - 3600, // Ended 1 hour ago
            });

            // Should not have permission because it's expired
            const hasPerm = await manager.hasPermission(spender, token, amount);
            expect(hasPerm).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject spend when permission has not started yet', async () => {
      await fc.assert(
        fc.asyncProperty(
          addressArb,
          addressArb,
          positiveAmountArb,
          async (spender, token, amount) => {
            // Grant permission that starts in the future
            const now = Math.floor(Date.now() / 1000);

            await manager.requestPermission({
              spender,
              token,
              allowance: amount * 2n,
              period: 3600,
              start: now + 3600, // Starts in 1 hour
              end: now + 7200, // Ends in 2 hours
            });

            // Should not have permission because it hasn't started
            const hasPerm = await manager.hasPermission(spender, token, amount);
            expect(hasPerm).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow spend when permission is active and sufficient', async () => {
      await fc.assert(
        fc.asyncProperty(
          addressArb,
          addressArb,
          positiveAmountArb,
          async (spender, token, amount) => {
            // Grant active permission with sufficient allowance
            const now = Math.floor(Date.now() / 1000);

            await manager.requestPermission({
              spender,
              token,
              allowance: amount,
              period: 3600,
              start: now - 60, // Started 1 minute ago
              end: now + 3600, // Ends in 1 hour
            });

            // Should have permission
            const hasPerm = await manager.hasPermission(spender, token, amount);
            expect(hasPerm).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 10: Spend Permission Revocation
   * 
   * For any disconnect or logout event, the system should revoke all active
   * spend permissions for the user's address.
   * 
   * Validates: Requirements 7.7
   */
  describe('Property 10: Spend Permission Revocation', () => {
    it('should revoke specific permission when requested', async () => {
      await fc.assert(
        fc.asyncProperty(
          addressArb,
          addressArb,
          positiveAmountArb,
          async (spender, token, amount) => {
            // Grant permission
            const now = Math.floor(Date.now() / 1000);
            await manager.requestPermission({
              spender,
              token,
              allowance: amount,
              period: 3600,
              start: now - 60,
              end: now + 3600,
            });

            // Verify permission exists
            const permBefore = await manager.getPermission(spender, token);
            expect(permBefore).not.toBeNull();

            // Revoke permission
            await manager.revokePermission(spender, token);

            // Verify permission is gone
            const permAfter = await manager.getPermission(spender, token);
            expect(permAfter).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should clear all permissions on logout', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              spender: addressArb,
              token: addressArb,
              allowance: positiveAmountArb,
            }),
            { minLength: 1, maxLength: 10 }
          ),
          async (permissions) => {
            // Grant multiple permissions
            const now = Math.floor(Date.now() / 1000);
            for (const perm of permissions) {
              await manager.requestPermission({
                spender: perm.spender,
                token: perm.token,
                allowance: perm.allowance,
                period: 3600,
                start: now - 60,
                end: now + 3600,
              });
            }

            // Verify permissions exist
            const permsBefore = await manager.getAllPermissions();
            expect(permsBefore.length).toBeGreaterThan(0);

            // Clear all permissions (logout)
            await manager.clearAllPermissions();

            // Verify all permissions are gone
            const permsAfter = await manager.getAllPermissions();
            expect(permsAfter.length).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not affect other permissions when revoking one', async () => {
      await fc.assert(
        fc.asyncProperty(
          addressArb,
          addressArb,
          addressArb,
          addressArb,
          positiveAmountArb,
          positiveAmountArb,
          async (spender1, token1, spender2, token2, amount1, amount2) => {
            // Skip if addresses are the same (would be same permission)
            if (
              spender1.toLowerCase() === spender2.toLowerCase() &&
              token1.toLowerCase() === token2.toLowerCase()
            ) {
              return;
            }

            // Grant two different permissions
            const now = Math.floor(Date.now() / 1000);
            await manager.requestPermission({
              spender: spender1,
              token: token1,
              allowance: amount1,
              period: 3600,
              start: now - 60,
              end: now + 3600,
            });

            await manager.requestPermission({
              spender: spender2,
              token: token2,
              allowance: amount2,
              period: 3600,
              start: now - 60,
              end: now + 3600,
            });

            // Revoke first permission
            await manager.revokePermission(spender1, token1);

            // Verify first permission is gone
            const perm1 = await manager.getPermission(spender1, token1);
            expect(perm1).toBeNull();

            // Verify second permission still exists
            const perm2 = await manager.getPermission(spender2, token2);
            expect(perm2).not.toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle revoking non-existent permission gracefully', async () => {
      await fc.assert(
        fc.asyncProperty(addressArb, addressArb, async (spender, token) => {
          // Try to revoke permission that doesn't exist
          await expect(
            manager.revokePermission(spender, token)
          ).resolves.not.toThrow();

          // Verify still no permission
          const perm = await manager.getPermission(spender, token);
          expect(perm).toBeNull();
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Additional property: Permission uniqueness
   * 
   * Each permission should have a unique salt value
   */
  describe('Permission Uniqueness', () => {
    it('should generate unique salts for different permissions', async () => {
      await fc.assert(
        fc.asyncProperty(
          addressArb,
          addressArb,
          positiveAmountArb,
          async (spender, token, amount) => {
            const now = Math.floor(Date.now() / 1000);

            // Request same permission twice
            const perm1 = await manager.requestPermission({
              spender,
              token,
              allowance: amount,
              period: 3600,
              start: now,
              end: now + 3600,
            });

            // Revoke and request again
            await manager.revokePermission(spender, token);

            const perm2 = await manager.requestPermission({
              spender,
              token,
              allowance: amount,
              period: 3600,
              start: now,
              end: now + 3600,
            });

            // Salts should be different
            expect(perm1.salt).not.toBe(perm2.salt);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
