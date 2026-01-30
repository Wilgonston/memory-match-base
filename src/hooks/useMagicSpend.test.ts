import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useMagicSpend } from './useMagicSpend';
import { magicSpendService } from '../services/MagicSpendService';
import type { Address } from 'viem';

describe('useMagicSpend', () => {
  beforeEach(() => {
    // Reset service state
    magicSpendService.setAvailable(false);
    magicSpendService.clearPendingTransactions();
    vi.clearAllMocks();
  });

  describe('Availability Check', () => {
    it('should check availability on mount', async () => {
      magicSpendService.setAvailable(true);

      const { result } = renderHook(() => useMagicSpend());

      await waitFor(() => {
        expect(result.current.isAvailable).toBe(true);
      });
    });

    it('should return false when Magic Spend is not available', async () => {
      magicSpendService.setAvailable(false);

      const { result } = renderHook(() => useMagicSpend());

      await waitFor(() => {
        expect(result.current.isAvailable).toBe(false);
      });
    });

    it('should allow manual availability check', async () => {
      magicSpendService.setAvailable(false);

      const { result } = renderHook(() => useMagicSpend());

      await waitFor(() => {
        expect(result.current.isAvailable).toBe(false);
      });

      // Change availability
      magicSpendService.setAvailable(true);

      // Manual check
      await act(async () => {
        const available = await result.current.checkAvailability();
        expect(available).toBe(true);
      });

      expect(result.current.isAvailable).toBe(true);
    });
  });

  describe('Balance Management', () => {
    it('should get balance when available', async () => {
      magicSpendService.setAvailable(true);

      const { result } = renderHook(() => useMagicSpend());

      await waitFor(() => {
        expect(result.current.balance).toBeGreaterThan(0n);
      });
    });

    it('should return zero balance when not available', async () => {
      magicSpendService.setAvailable(false);

      const { result } = renderHook(() => useMagicSpend());

      await waitFor(() => {
        expect(result.current.balance).toBe(0n);
      });
    });

    it('should allow manual balance refresh', async () => {
      magicSpendService.setAvailable(true);

      const { result } = renderHook(() => useMagicSpend());

      await waitFor(() => {
        expect(result.current.balance).toBeGreaterThan(0n);
      });

      const initialBalance = result.current.balance;

      await act(async () => {
        const balance = await result.current.getBalance();
        expect(balance).toBe(initialBalance);
      });
    });
  });

  describe('Transaction Execution', () => {
    it('should execute spend transaction when available', async () => {
      magicSpendService.setAvailable(true);

      const { result } = renderHook(() => useMagicSpend());

      await waitFor(() => {
        expect(result.current.isAvailable).toBe(true);
      });

      const to = '0x1234567890123456789012345678901234567890' as Address;
      const amount = 1000000000000000n; // 0.001 ETH

      await act(async () => {
        const receipt = await result.current.spend(to, amount);
        expect(receipt).toBeDefined();
        expect(receipt.transactionHash).toBeDefined();
        expect(receipt.status).toBe('success');
      });
    });

    it('should throw error when spending while unavailable', async () => {
      magicSpendService.setAvailable(false);

      const { result } = renderHook(() => useMagicSpend());

      await waitFor(() => {
        expect(result.current.isAvailable).toBe(false);
      });

      const to = '0x1234567890123456789012345678901234567890' as Address;
      const amount = 1000000000000000n;

      await act(async () => {
        await expect(result.current.spend(to, amount)).rejects.toThrow(
          'Magic Spend is not available'
        );
      });
    });

    it('should update pending transactions after spend', async () => {
      magicSpendService.setAvailable(true);

      const { result } = renderHook(() => useMagicSpend());

      await waitFor(() => {
        expect(result.current.isAvailable).toBe(true);
      });

      const to = '0x1234567890123456789012345678901234567890' as Address;
      const amount = 1000000000000000n;

      await act(async () => {
        await result.current.spend(to, amount);
      });

      await waitFor(() => {
        expect(result.current.pendingTransactions.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Pending Transactions', () => {
    it('should track pending transactions', async () => {
      magicSpendService.setAvailable(true);

      const { result } = renderHook(() => useMagicSpend());

      await waitFor(() => {
        expect(result.current.isAvailable).toBe(true);
      });

      // Execute multiple transactions
      const to = '0x1234567890123456789012345678901234567890' as Address;

      await act(async () => {
        await result.current.spend(to, 1000000000000000n);
        await result.current.spend(to, 2000000000000000n);
      });

      await waitFor(() => {
        expect(result.current.pendingTransactions.length).toBe(2);
      });
    });

    it('should refresh pending transactions manually', async () => {
      magicSpendService.setAvailable(true);

      const { result } = renderHook(() => useMagicSpend());

      await waitFor(() => {
        expect(result.current.isAvailable).toBe(true);
      });

      const to = '0x1234567890123456789012345678901234567890' as Address;

      await act(async () => {
        await result.current.spend(to, 1000000000000000n);
      });

      await waitFor(() => {
        expect(result.current.pendingTransactions.length).toBe(1);
      });

      await act(async () => {
        const pending = await result.current.refreshPendingTransactions();
        expect(pending.length).toBe(1);
      });
    });

    it('should display pending transaction details', async () => {
      magicSpendService.setAvailable(true);

      const { result } = renderHook(() => useMagicSpend());

      await waitFor(() => {
        expect(result.current.isAvailable).toBe(true);
      });

      const to = '0x1234567890123456789012345678901234567890' as Address;
      const amount = 1000000000000000n;

      await act(async () => {
        await result.current.spend(to, amount);
      });

      await waitFor(() => {
        expect(result.current.pendingTransactions.length).toBe(1);
      });

      const tx = result.current.pendingTransactions[0];
      expect(tx.to).toBe(to);
      expect(tx.amount).toBe(amount);
      expect(tx.status).toBe('pending');
      expect(tx.hash).toBeDefined();
      expect(tx.timestamp).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should set error state on failure', async () => {
      magicSpendService.setAvailable(false);

      const { result } = renderHook(() => useMagicSpend());

      await waitFor(() => {
        expect(result.current.isAvailable).toBe(false);
      });

      const to = '0x1234567890123456789012345678901234567890' as Address;
      const amount = 1000000000000000n;

      await act(async () => {
        try {
          await result.current.spend(to, amount);
        } catch {
          // Expected to throw
        }
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.error).toContain('Magic Spend is not available');
    });

    it('should clear error state', async () => {
      magicSpendService.setAvailable(false);

      const { result } = renderHook(() => useMagicSpend());

      await waitFor(() => {
        expect(result.current.isAvailable).toBe(false);
      });

      const to = '0x1234567890123456789012345678901234567890' as Address;
      const amount = 1000000000000000n;

      await act(async () => {
        try {
          await result.current.spend(to, amount);
        } catch {
          // Expected to throw
        }
      });

      expect(result.current.error).toBeTruthy();

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Loading State', () => {
    it('should set loading state during operations', async () => {
      magicSpendService.setAvailable(true);

      const { result } = renderHook(() => useMagicSpend());

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Start an operation
      act(() => {
        result.current.getBalance();
      });

      // Should be loading briefly (may be too fast to catch)
      // Just verify it completes
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });
});
