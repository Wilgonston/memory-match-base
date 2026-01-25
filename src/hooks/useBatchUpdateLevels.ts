/**
 * useBatchUpdateLevels Hook
 * 
 * Custom hook for updating multiple levels' progress in a single transaction.
 * Uses wagmi's useWriteContract for batch transaction submission.
 * 
 * Requirements: 19.5
 */

import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useState, useCallback, useEffect } from 'react';
import { 
  MEMORY_MATCH_PROGRESS_ABI, 
  getContractAddress,
  type TransactionStatus 
} from '../types/blockchain';

/**
 * Hook return type
 */
export interface UseBatchUpdateLevelsResult {
  /** Function to batch update multiple levels */
  batchUpdate: (levels: number[], stars: number[]) => Promise<void>;
  /** Transaction hash if submitted */
  hash?: `0x${string}`;
  /** Current transaction status */
  status: TransactionStatus;
  /** Error message if transaction failed */
  error?: string;
  /** Whether transaction is pending */
  isPending: boolean;
  /** Whether transaction succeeded */
  isSuccess: boolean;
  /** Reset function to clear state */
  reset: () => void;
}

/**
 * Custom hook for batch updating multiple levels' progress on blockchain
 * 
 * Features:
 * - Submits single transaction to update multiple levels
 * - More gas-efficient than multiple single updates
 * - Tracks transaction status (pending, success, error)
 * - Waits for transaction confirmation
 * - Validates inputs before submission
 * - Handles errors gracefully with user-friendly messages
 * 
 * @returns Object containing batchUpdate function, transaction status, and helpers
 * 
 * @example
 * ```tsx
 * const { batchUpdate, status, isPending } = useBatchUpdateLevels();
 * 
 * const handleBatchSave = async () => {
 *   try {
 *     await batchUpdate([1, 2, 3], [3, 2, 3]); // Save multiple levels
 *     console.log('All progress saved!');
 *   } catch (err) {
 *     console.error('Failed to save:', err);
 *   }
 * };
 * ```
 */
export function useBatchUpdateLevels(): UseBatchUpdateLevelsResult {
  const contractAddress = getContractAddress();
  const [localError, setLocalError] = useState<string>();

  // Write contract hook
  const {
    data: hash,
    writeContract,
    isPending: isWritePending,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract();

  // Wait for transaction receipt
  const {
    isLoading: isConfirming,
    isSuccess,
    error: receiptError,
  } = useWaitForTransactionReceipt({
    hash,
  });

  // Combined pending state
  const isPending = isWritePending || isConfirming;

  // Determine transaction status
  const status: TransactionStatus = isPending
    ? 'pending'
    : isSuccess
    ? 'success'
    : writeError || receiptError || localError
    ? 'error'
    : 'idle';

  // Combined error message
  const error = localError || writeError?.message || receiptError?.message;

  // Batch update function
  const batchUpdate = useCallback(
    async (levels: number[], stars: number[]): Promise<void> => {
      // Validate array lengths match
      if (levels.length !== stars.length) {
        const errorMsg = `Array length mismatch: ${levels.length} levels vs ${stars.length} stars`;
        setLocalError(errorMsg);
        throw new Error(errorMsg);
      }

      // Validate array length is within limits
      if (levels.length === 0) {
        const errorMsg = 'Cannot batch update with empty arrays';
        setLocalError(errorMsg);
        throw new Error(errorMsg);
      }

      if (levels.length > 100) {
        const errorMsg = `Too many levels: ${levels.length}. Maximum is 100.`;
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

      // Clear previous error
      setLocalError(undefined);

      try {
        // Submit batch transaction
        writeContract({
          address: contractAddress,
          abi: MEMORY_MATCH_PROGRESS_ABI,
          functionName: 'batchUpdate',
          args: [levels, stars],
        });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to submit batch transaction';
        setLocalError(errorMsg);
        throw err;
      }
    },
    [contractAddress, writeContract]
  );

  // Reset function
  const reset = useCallback(() => {
    resetWrite();
    setLocalError(undefined);
  }, [resetWrite]);

  // Clear local error when write error changes
  useEffect(() => {
    if (writeError) {
      setLocalError(undefined);
    }
  }, [writeError]);

  return {
    batchUpdate,
    hash,
    status,
    error,
    isPending,
    isSuccess,
    reset,
  };
}
