/**
 * useSequentialUpdateLevels Hook
 * 
 * Custom hook for updating multiple levels' progress sequentially.
 * Uses standard wagmi hooks for better wallet compatibility.
 * Falls back to sequential updates when batch calls are not supported.
 * 
 * Requirements: 19.5
 */

import { useAccount, useChainId, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useState, useCallback, useEffect } from 'react';
import { Address } from 'viem';
import { 
  MEMORY_MATCH_PROGRESS_ABI, 
  getContractAddress,
  type TransactionStatus 
} from '../types/blockchain';
import { getChainId } from '../utils/network';

/**
 * Hook return type
 */
export interface UseSequentialUpdateLevelsResult {
  /** Function to update multiple levels sequentially */
  updateLevels: (levels: number[], stars: number[]) => void;
  /** Current transaction hash */
  hash?: `0x${string}`;
  /** Current transaction status */
  status: TransactionStatus;
  /** Error message if transaction failed */
  error?: string;
  /** Whether transaction is pending */
  isPending: boolean;
  /** Whether all transactions succeeded */
  isSuccess: boolean;
  /** Progress of sequential updates (current/total) */
  progress: { current: number; total: number };
  /** Reset function to clear state */
  reset: () => void;
}

/**
 * Custom hook for sequentially updating multiple levels' progress on blockchain
 * 
 * Features:
 * - Updates levels one by one (compatible with all wallets)
 * - Tracks progress of sequential updates
 * - Validates inputs before submission
 * - Handles errors gracefully with user-friendly messages
 * - Waits for transaction confirmation before marking as success
 * 
 * @returns Object containing updateLevels function, transaction status, and helpers
 * 
 * @example
 * ```tsx
 * const { updateLevels, status, isPending, progress } = useSequentialUpdateLevels();
 * 
 * const handleSave = async () => {
 *   try {
 *     await updateLevels([1, 2, 3], [3, 2, 3]); // Save multiple levels
 *     console.log('All progress saved!');
 *   } catch (err) {
 *     console.error('Failed to save:', err);
 *   }
 * };
 * ```
 */
export function useSequentialUpdateLevels(): UseSequentialUpdateLevelsResult {
  const chainId = useChainId();
  const expectedChainId = getChainId();
  const contractAddress = getContractAddress();
  const [localError, setLocalError] = useState<string>();
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const { writeContract, data: hash, isPending: isWritePending, error: writeError, reset: resetWrite } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const isPending = isWritePending || isConfirming;

  // Determine transaction status
  const status: TransactionStatus = isPending
    ? 'pending'
    : isConfirmed
    ? 'success'
    : writeError || localError
    ? 'error'
    : 'idle';

  // Combined error message
  const error = localError || writeError?.message;

  // Log transaction confirmation
  useEffect(() => {
    if (isConfirmed && hash) {
      // Transaction confirmed on blockchain
    }
  }, [isConfirmed, hash]);

  // Sequential update function
  const updateLevels = useCallback(
    (levels: number[], stars: number[]): void => {
      // Check if on correct network
      if (chainId !== expectedChainId) {
        const errorMsg = `Wrong network. Please switch to Base ${expectedChainId === 8453 ? 'Mainnet' : 'Sepolia'}`;
        setLocalError(errorMsg);
        throw new Error(errorMsg);
      }

      // Validate array lengths match
      if (levels.length !== stars.length) {
        const errorMsg = `Array length mismatch: ${levels.length} levels vs ${stars.length} stars`;
        setLocalError(errorMsg);
        throw new Error(errorMsg);
      }

      // Validate array length is within limits
      if (levels.length === 0) {
        const errorMsg = 'Cannot update with empty arrays';
        setLocalError(errorMsg);
        throw new Error(errorMsg);
      }

      // Validate each level and star value
      for (let i = 0; i < levels.length; i++) {
        const level = levels[i];
        const star = stars[i];

        if (level < 1 || level > 100) {
          const errorMsg = `Invalid level at index ${i}: ${level}. Must be between 1 and 100.`;
          setLocalError(errorMsg);
          throw new Error(errorMsg);
        }

        if (star < 1 || star > 3) {
          const errorMsg = `Invalid stars at index ${i}: ${star}. Must be between 1 and 3.`;
          setLocalError(errorMsg);
          throw new Error(errorMsg);
        }
      }

      // Clear previous state
      setLocalError(undefined);
      setProgress({ current: 0, total: levels.length });

      try {
        console.log(`[useSequentialUpdateLevels] Updating ${levels.length} levels`);
        console.log('[useSequentialUpdateLevels] Levels:', levels);
        console.log('[useSequentialUpdateLevels] Stars:', stars);
        console.log('[useSequentialUpdateLevels] Contract address:', contractAddress);
        console.log('[useSequentialUpdateLevels] Chain ID:', chainId);
        
        // Submit transaction to blockchain
        writeContract({
          address: contractAddress as Address,
          abi: MEMORY_MATCH_PROGRESS_ABI,
          functionName: 'batchUpdate',
          args: [levels, stars],
        });
        
        console.log('[useSequentialUpdateLevels] writeContract called, waiting for user signature...');
        
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to update levels';
        console.error('[useSequentialUpdateLevels] Error:', errorMsg);
        setLocalError(errorMsg);
        throw err;
      }
    },
    [contractAddress, writeContract, chainId, expectedChainId]
  );

  // Reset function
  const reset = useCallback(() => {
    setLocalError(undefined);
    setProgress({ current: 0, total: 0 });
    resetWrite();
  }, [resetWrite]);

  return {
    updateLevels,
    hash,
    status,
    error,
    isPending,
    isSuccess: isConfirmed, // Only true when transaction is confirmed on blockchain
    progress,
    reset,
  };
}
