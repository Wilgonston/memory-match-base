/**
 * useSpendPermissions Hook
 * 
 * React hook for managing spend permissions for Smart Wallets.
 * Provides methods to request, check, and revoke permissions.
 * 
 * Requirements: 7.2, 7.3, 7.5, 7.6
 */

import { useState, useEffect, useCallback } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { Address } from 'viem';
import { spendPermissionManager, type SpendPermission } from '../services/SpendPermissionManager';
import { getContractAddress } from '../types/blockchain';

/**
 * Hook return type
 */
export interface UseSpendPermissionsReturn {
  /** Current permission for the game contract */
  permission: SpendPermission | null;
  /** Whether permission is being loaded */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Request a new spend permission */
  requestPermission: (allowance: bigint, period: number) => Promise<void>;
  /** Check if permission is sufficient for an amount */
  hasPermission: (amount: bigint) => Promise<boolean>;
  /** Revoke current permission */
  revokePermission: () => Promise<void>;
  /** Update permission allowance */
  updateAllowance: (newAllowance: bigint) => Promise<void>;
}

/**
 * ETH token address (0x0 for native ETH)
 */
const ETH_TOKEN_ADDRESS: Address = '0x0000000000000000000000000000000000000000';

/**
 * Default permission period (30 days in seconds)
 */
const DEFAULT_PERMISSION_PERIOD = 30 * 24 * 60 * 60;

/**
 * Default allowance (1 ETH in wei)
 */
const DEFAULT_ALLOWANCE = 1000000000000000000n;

/**
 * useSpendPermissions hook
 * 
 * Manages spend permissions for the game contract
 */
export function useSpendPermissions(): UseSpendPermissionsReturn {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  
  const [permission, setPermission] = useState<SpendPermission | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const contractAddress = getContractAddress();

  /**
   * Load current permission
   */
  const loadPermission = useCallback(async () => {
    if (!isConnected || !address || !contractAddress) {
      setPermission(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const perm = await spendPermissionManager.getPermission(
        contractAddress,
        ETH_TOKEN_ADDRESS
      );

      setPermission(perm);
    } catch (err) {
      console.error('[useSpendPermissions] Error loading permission:', err);
      setError(err instanceof Error ? err.message : 'Failed to load permission');
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, address, contractAddress]);

  /**
   * Request a new spend permission
   */
  const requestPermission = useCallback(
    async (allowance: bigint = DEFAULT_ALLOWANCE, period: number = DEFAULT_PERMISSION_PERIOD) => {
      if (!isConnected || !address || !contractAddress) {
        throw new Error('Wallet not connected');
      }

      try {
        setIsLoading(true);
        setError(null);

        const now = Math.floor(Date.now() / 1000);

        const perm = await spendPermissionManager.requestPermission({
          spender: contractAddress,
          token: ETH_TOKEN_ADDRESS,
          allowance,
          period,
          start: now,
          end: now + period,
        });

        setPermission(perm);

        console.log('[useSpendPermissions] Permission requested successfully');
      } catch (err) {
        console.error('[useSpendPermissions] Error requesting permission:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to request permission';
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [isConnected, address, contractAddress]
  );

  /**
   * Check if permission is sufficient for an amount
   */
  const hasPermission = useCallback(
    async (amount: bigint): Promise<boolean> => {
      if (!isConnected || !address || !contractAddress) {
        return false;
      }

      try {
        return await spendPermissionManager.hasPermission(
          contractAddress,
          ETH_TOKEN_ADDRESS,
          amount
        );
      } catch (err) {
        console.error('[useSpendPermissions] Error checking permission:', err);
        return false;
      }
    },
    [isConnected, address, contractAddress]
  );

  /**
   * Revoke current permission
   */
  const revokePermission = useCallback(async () => {
    if (!contractAddress) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      await spendPermissionManager.revokePermission(
        contractAddress,
        ETH_TOKEN_ADDRESS
      );

      setPermission(null);

      console.log('[useSpendPermissions] Permission revoked successfully');
    } catch (err) {
      console.error('[useSpendPermissions] Error revoking permission:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to revoke permission';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [contractAddress]);

  /**
   * Update permission allowance
   */
  const updateAllowance = useCallback(
    async (newAllowance: bigint) => {
      if (!contractAddress) {
        throw new Error('Contract address not available');
      }

      try {
        setIsLoading(true);
        setError(null);

        await spendPermissionManager.updateAllowance(
          contractAddress,
          ETH_TOKEN_ADDRESS,
          newAllowance
        );

        // Reload permission to get updated data
        await loadPermission();

        console.log('[useSpendPermissions] Allowance updated successfully');
      } catch (err) {
        console.error('[useSpendPermissions] Error updating allowance:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to update allowance';
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [contractAddress, loadPermission]
  );

  /**
   * Load permission on mount and when dependencies change
   */
  useEffect(() => {
    loadPermission();
  }, [loadPermission]);

  /**
   * Clear permissions on disconnect
   */
  useEffect(() => {
    if (!isConnected) {
      spendPermissionManager.clearAllPermissions();
      setPermission(null);
    }
  }, [isConnected]);

  return {
    permission,
    isLoading,
    error,
    requestPermission,
    hasPermission,
    revokePermission,
    updateAllowance,
  };
}
