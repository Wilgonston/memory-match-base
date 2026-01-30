import { useState, useEffect, useCallback } from 'react';
import { Address, Hex } from 'viem';
import { magicSpendService, type MagicSpendTransaction } from '../services/MagicSpendService';

/**
 * Hook for managing Magic Spend functionality
 * 
 * Provides methods to check availability, get balance, execute transactions,
 * and track pending Magic Spend transactions.
 */
export function useMagicSpend() {
  const [isAvailable, setIsAvailable] = useState(false);
  const [balance, setBalance] = useState<bigint>(0n);
  const [pendingTransactions, setPendingTransactions] = useState<MagicSpendTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Check Magic Spend availability
   */
  const checkAvailability = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const available = await magicSpendService.isAvailable();
      setIsAvailable(available);
      return available;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check availability';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Get Magic Spend balance
   */
  const getBalance = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const bal = await magicSpendService.getBalance();
      setBalance(bal);
      return bal;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get balance';
      setError(errorMessage);
      return 0n;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Execute a Magic Spend transaction
   */
  const spend = useCallback(
    async (to: Address, amount: bigint, data?: Hex) => {
      try {
        setIsLoading(true);
        setError(null);

        // Check availability first
        const available = await magicSpendService.isAvailable();
        if (!available) {
          throw new Error('Magic Spend is not available');
        }

        // Execute transaction
        const receipt = await magicSpendService.spend(to, amount, data);

        // Refresh pending transactions and balance
        await Promise.all([refreshPendingTransactions(), getBalance()]);

        return receipt;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Transaction failed';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [getBalance]
  );

  /**
   * Refresh pending transactions list
   */
  const refreshPendingTransactions = useCallback(async () => {
    try {
      const pending = await magicSpendService.getPendingTransactions();
      setPendingTransactions(pending);
      return pending;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get pending transactions';
      setError(errorMessage);
      return [];
    }
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Initialize Magic Spend on mount
   */
  useEffect(() => {
    const initialize = async () => {
      await checkAvailability();
      if (isAvailable) {
        await Promise.all([getBalance(), refreshPendingTransactions()]);
      }
    };

    initialize();
  }, [checkAvailability, getBalance, refreshPendingTransactions, isAvailable]);

  /**
   * Poll for pending transaction updates
   */
  useEffect(() => {
    if (!isAvailable || pendingTransactions.length === 0) {
      return;
    }

    const interval = setInterval(() => {
      refreshPendingTransactions();
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [isAvailable, pendingTransactions.length, refreshPendingTransactions]);

  return {
    isAvailable,
    balance,
    pendingTransactions,
    isLoading,
    error,
    checkAvailability,
    getBalance,
    spend,
    refreshPendingTransactions,
    clearError,
  };
}
