/**
 * useSmartWalletTransaction Hook
 * 
 * Uses OnchainKit Transaction components for gasless transactions
 * with Smart Wallet. No signature required from user.
 */

import { useCallback, useState } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { base } from 'wagmi/chains';
import { 
  MEMORY_MATCH_PROGRESS_ABI, 
  getContractAddress,
} from '../types/blockchain';
import { getChainId } from '../utils/network';

export interface UseSmartWalletTransactionResult {
  /** Function to batch update multiple levels */
  batchUpdate: (levels: number[], stars: number[]) => Promise<{ hash: string }>;
  /** Whether transaction is pending */
  isPending: boolean;
  /** Error message if transaction failed */
  error?: string;
  /** Reset function to clear state */
  reset: () => void;
}

/**
 * Hook for sending gasless transactions through Smart Wallet
 * 
 * This uses the Smart Wallet's built-in capabilities to send
 * transactions without requiring user signatures or gas fees.
 */
export function useSmartWalletTransaction(): UseSmartWalletTransactionResult {
  const { address } = useAccount();
  const chainId = useChainId();
  const expectedChainId = getChainId();
  const contractAddress = getContractAddress();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string>();

  const batchUpdate = useCallback(
    async (levels: number[], stars: number[]): Promise<{ hash: string }> => {
      // Check if on correct network
      if (chainId !== expectedChainId) {
        const errorMsg = `Wrong network. Please switch to Base ${expectedChainId === 8453 ? 'Mainnet' : 'Sepolia'}`;
        setError(errorMsg);
        throw new Error(errorMsg);
      }

      // Validate inputs
      if (levels.length !== stars.length) {
        const errorMsg = `Array length mismatch: ${levels.length} levels vs ${stars.length} stars`;
        setError(errorMsg);
        throw new Error(errorMsg);
      }

      if (levels.length === 0) {
        const errorMsg = 'Cannot batch update with empty arrays';
        setError(errorMsg);
        throw new Error(errorMsg);
      }

      setIsPending(true);
      setError(undefined);

      try {
        // Use eth_sendTransaction with Smart Wallet
        // The Smart Wallet will handle gas sponsorship automatically
        const provider = (window as any).ethereum;
        
        if (!provider) {
          throw new Error('No wallet provider found');
        }

        // Encode the function call
        const iface = new (await import('ethers')).Interface(MEMORY_MATCH_PROGRESS_ABI);
        const data = iface.encodeFunctionData('batchUpdate', [levels, stars]);

        // Send transaction through Smart Wallet
        const txHash = await provider.request({
          method: 'eth_sendTransaction',
          params: [{
            from: address,
            to: contractAddress,
            data,
            // Smart Wallet will handle gas automatically
          }],
        });

        console.log('[SmartWallet] Transaction sent:', txHash);
        setIsPending(false);
        
        return { hash: txHash };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Transaction failed';
        setError(errorMsg);
        setIsPending(false);
        throw err;
      }
    },
    [address, chainId, expectedChainId, contractAddress]
  );

  const reset = useCallback(() => {
    setError(undefined);
    setIsPending(false);
  }, []);

  return {
    batchUpdate,
    isPending,
    error,
    reset,
  };
}
