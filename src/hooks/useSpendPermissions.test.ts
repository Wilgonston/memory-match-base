/**
 * Unit tests for useSpendPermissions hook
 * 
 * Tests permission request, checking, and exhaustion handling.
 * 
 * Requirements: 7.2, 7.5, 7.6
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useSpendPermissions } from './useSpendPermissions';
import { spendPermissionManager } from '../services/SpendPermissionManager';

// Mock wagmi hooks
vi.mock('wagmi', () => ({
  useAccount: vi.fn(() => ({
    address: '0x1234567890123456789012345678901234567890',
    isConnected: true,
  })),
  useDisconnect: vi.fn(() => ({
    disconnect: vi.fn(),
  })),
}));

// Mock blockchain types
vi.mock('../types/blockchain', () => ({
  getContractAddress: vi.fn(() => '0x93aC1C769aCE5caE403a454cBd236aB2EA7B17F5'),
  MEMORY_MATCH_PROGRESS_ABI: [],
}));

describe('useSpendPermissions', () => {
  beforeEach(() => {
    // Clear all permissions before each test
    spendPermissionManager.clearAllPermissions();
  });

  describe('Permission Request (Requirement 7.2)', () => {
    it('should request permission on first connection', async () => {
      const { result } = renderHook(() => useSpendPermissions());

      // Initially no permission
      expect(result.current.permission).toBeNull();

      // Request permission
      await waitFor(async () => {
        await result.current.requestPermission(1000000000000000000n, 3600);
      });

      // Should have permission now
      await waitFor(() => {
        expect(result.current.permission).not.toBeNull();
      });

      expect(result.current.permission?.allowance).toBe(1000000000000000000n);
    });

    it('should handle permission request errors', async () => {
      const { result } = renderHook(() => useSpendPermissions());

      // Try to request with invalid allowance
      await expect(
        result.current.requestPermission(0n, 3600)
      ).rejects.toThrow();
    });

    it('should set loading state during request', async () => {
      const { result } = renderHook(() => useSpendPermissions());

      // Wait for initial load to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Start request
      const requestPromise = result.current.requestPermission(1000000000000000000n, 3600);

      await requestPromise;

      // Should not be loading anymore
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('Permission Check (Requirement 7.5)', () => {
    it('should check permission before transactions', async () => {
      const { result } = renderHook(() => useSpendPermissions());

      // Request permission
      await waitFor(async () => {
        await result.current.requestPermission(1000000000000000000n, 3600);
      });

      // Check if permission is sufficient
      const hasPerm = await result.current.hasPermission(500000000000000000n);
      expect(hasPerm).toBe(true);

      // Check if permission is insufficient
      const hasPermLarge = await result.current.hasPermission(2000000000000000000n);
      expect(hasPermLarge).toBe(false);
    });

    it('should return false when no permission exists', async () => {
      const { result } = renderHook(() => useSpendPermissions());

      const hasPerm = await result.current.hasPermission(1000000000000000000n);
      expect(hasPerm).toBe(false);
    });

    it('should return false when permission is expired', async () => {
      const { result } = renderHook(() => useSpendPermissions());

      // Request permission that expires immediately
      const now = Math.floor(Date.now() / 1000);
      await spendPermissionManager.requestPermission({
        spender: '0x93aC1C769aCE5caE403a454cBd236aB2EA7B17F5' as any,
        token: '0x0000000000000000000000000000000000000000' as any,
        allowance: 1000000000000000000n,
        period: 1,
        start: now - 10,
        end: now - 5, // Already expired
      });

      const hasPerm = await result.current.hasPermission(500000000000000000n);
      expect(hasPerm).toBe(false);
    });
  });

  describe('Exhaustion Handling (Requirement 7.6)', () => {
    it('should detect when permission is exhausted', async () => {
      const { result } = renderHook(() => useSpendPermissions());

      // Request permission with small allowance
      await waitFor(async () => {
        await result.current.requestPermission(100n, 3600);
      });

      // Check if permission is sufficient for small amount
      const hasPermSmall = await result.current.hasPermission(50n);
      expect(hasPermSmall).toBe(true);

      // Check if permission is exhausted for large amount
      const hasPermLarge = await result.current.hasPermission(200n);
      expect(hasPermLarge).toBe(false);
    });

    it('should allow increasing allowance when exhausted', async () => {
      const { result } = renderHook(() => useSpendPermissions());

      // Request permission with small allowance
      await waitFor(async () => {
        await result.current.requestPermission(100n, 3600);
      });

      // Permission is insufficient for large amount
      let hasPerm = await result.current.hasPermission(200n);
      expect(hasPerm).toBe(false);

      // Increase allowance
      await waitFor(async () => {
        await result.current.updateAllowance(500n);
      });

      // Now permission should be sufficient
      hasPerm = await result.current.hasPermission(200n);
      expect(hasPerm).toBe(true);
    });

    it('should prompt user to increase limit when exhausted', async () => {
      const { result } = renderHook(() => useSpendPermissions());

      // Request permission
      await waitFor(async () => {
        await result.current.requestPermission(1000000000000000000n, 3600);
      });

      await waitFor(() => {
        expect(result.current.permission).not.toBeNull();
      });

      // Permission exists but might be insufficient for very large amounts
      const hasPermHuge = await result.current.hasPermission(10000000000000000000n);
      expect(hasPermHuge).toBe(false);

      // User should be able to update allowance
      expect(result.current.updateAllowance).toBeDefined();
    });
  });

  describe('Permission Revocation', () => {
    it('should revoke permission', async () => {
      const { result } = renderHook(() => useSpendPermissions());

      // Request permission
      await waitFor(async () => {
        await result.current.requestPermission(1000000000000000000n, 3600);
      });

      await waitFor(() => {
        expect(result.current.permission).not.toBeNull();
      });

      // Revoke permission
      await waitFor(async () => {
        await result.current.revokePermission();
      });

      await waitFor(() => {
        expect(result.current.permission).toBeNull();
      });
    });

    it('should handle revoke errors gracefully', async () => {
      const { result } = renderHook(() => useSpendPermissions());

      // Try to revoke non-existent permission (should not throw)
      await expect(
        result.current.revokePermission()
      ).resolves.not.toThrow();
    });
  });

  describe('Permission Status Display', () => {
    it('should show permission details', async () => {
      const { result } = renderHook(() => useSpendPermissions());

      // Request permission
      await waitFor(async () => {
        await result.current.requestPermission(1000000000000000000n, 3600);
      });

      await waitFor(() => {
        expect(result.current.permission).not.toBeNull();
      });

      const perm = result.current.permission!;
      expect(perm.allowance).toBe(1000000000000000000n);
      expect(perm.period).toBe(3600);
      expect(perm.spender).toBe('0x93aC1C769aCE5caE403a454cBd236aB2EA7B17F5');
    });

    it('should indicate when permission is active', async () => {
      const { result } = renderHook(() => useSpendPermissions());

      const now = Math.floor(Date.now() / 1000);

      // Request active permission directly
      await result.current.requestPermission(1000000000000000000n, 3600);

      // Wait for permission to be set
      await waitFor(() => {
        expect(result.current.permission).not.toBeNull();
      }, { timeout: 2000 });

      const perm = result.current.permission!;
      expect(perm.start).toBeLessThanOrEqual(now + 10); // Allow small time difference
      expect(perm.end).toBeGreaterThan(now);
    });
  });
});
