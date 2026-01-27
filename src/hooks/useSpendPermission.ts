/**
 * useSpendPermission Hook
 * 
 * Implements EIP-7715 Spend Permissions for automatic transactions
 * without user confirmation on each transaction.
 * 
 * This allows the app to automatically save progress to blockchain
 * after user grants permission once.
 */

import { useCallback, useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { getContractAddress } from '../types/blockchain';

export interface SpendPermission {
  /** Whether permission is granted */
  isGranted: boolean;
  /** Request permission from user */
  requestPermission: () => Promise<void>;
  /** Revoke permission */
  revokePermission: () => Promise<void>;
  /** Whether permission request is pending */
  isPending: boolean;
  /** Error if any */
  error?: string;
}

/**
 * Hook for managing spend permissions (EIP-7715)
 * 
 * This allows the app to send transactions automatically
 * after user grants permission once.
 */
export function useSpendPermission(): SpendPermission {
  const { address } = useAccount();
  const contractAddress = getContractAddress();
  const [isGranted, setIsGranted] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string>();

  // Check if permission is already granted
  useEffect(() => {
    const checkPermission = async () => {
      if (!address) return;
      
      try {
        // Check localStorage for granted permission
        const key = `spend-permission-${address}-${contractAddress}`;
        const granted = localStorage.getItem(key) === 'true';
        setIsGranted(granted);
      } catch (err) {
        console.error('[SpendPermission] Failed to check permission:', err);
      }
    };

    checkPermission();
  }, [address, contractAddress]);

  const requestPermission = useCallback(async () => {
    if (!address) {
      setError('Wallet not connected');
      return;
    }

    setIsPending(true);
    setError(undefined);

    try {
      const provider = (window as any).ethereum;
      
      if (!provider) {
        throw new Error('No wallet provider found');
      }

      // Request permission using wallet_grantPermissions (EIP-7715)
      // This is experimental and may not be supported by all wallets yet
      try {
        await provider.request({
          method: 'wallet_grantPermissions',
          params: [{
            eth_accounts: {},
            eth_sendTransaction: {
              to: contractAddress,
            },
          }],
        });
        
        // Save permission to localStorage
        const key = `spend-permission-${address}-${contractAddress}`;
        localStorage.setItem(key, 'true');
        setIsGranted(true);
        
        console.log('[SpendPermission] Permission granted!');
      } catch (err: any) {
        // If wallet_grantPermissions is not supported, fall back to regular flow
        if (err.code === -32601 || err.message?.includes('not supported')) {
          console.log('[SpendPermission] wallet_grantPermissions not supported, using regular flow');
          // Still mark as "granted" so we don't keep asking
          const key = `spend-permission-${address}-${contractAddress}`;
          localStorage.setItem(key, 'true');
          setIsGranted(true);
        } else {
          throw err;
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to request permission';
      setError(errorMsg);
      console.error('[SpendPermission] Error:', err);
    } finally {
      setIsPending(false);
    }
  }, [address, contractAddress]);

  const revokePermission = useCallback(async () => {
    if (!address) return;

    try {
      const key = `spend-permission-${address}-${contractAddress}`;
      localStorage.removeItem(key);
      setIsGranted(false);
      console.log('[SpendPermission] Permission revoked');
    } catch (err) {
      console.error('[SpendPermission] Failed to revoke permission:', err);
    }
  }, [address, contractAddress]);

  return {
    isGranted,
    requestPermission,
    revokePermission,
    isPending,
    error,
  };
}
