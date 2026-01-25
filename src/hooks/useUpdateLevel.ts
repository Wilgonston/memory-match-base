/**
 * useUpdateLevel Hook
 * 
 * Custom hook for updating a single level's progress on the blockchain.
 * Uses wagmi's useWriteContract for transaction submission.
 * 
 * Requirements: 19.4
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
export interface UseUpdateLevelResult {
  /** Function to update a level */
  updateLevel: (level: number, stars: number) => Promise<void>;
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
 * Custom hook for updating a single level's progress on blockchain
 * 
 * Features:
 * - Submits transaction to update level progress
 * - Tracks transaction status (pending, success, error)
 * - Waits for transaction confirmation
 * - Handles errors gracefully with user-friendly messages
 * - Provides reset function to clear state
 * 
 * @returns Object containing updateLevel function, transaction status, and helpers
 * 
 * @example
 * ```tsx
 * const { updateLevel, status, error, isPending } = useUpdateLevel();
 * 
 * const handleSave = async () => {
 *   try {
 *     await updateLevel(5, 3); // Save level 5 with 3 stars
 *     console.log('Progress saved!');
 *   } catch (err) {
 *     console.error('Failed to save:', err);
 *   }
 * };
 * 
 * return (
 *   <button onClick={handleSave} disabled={isPending}>
 *     {isPending ? 'Saving...' : 'Save Progress'}
 *   </button>
 * );
 * ```
 */
export function useUpdateLevel(): UseUpdateLevelResult {
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

  // Update level function
  const updateLevel = useCallback(
    async (level: number, stars: number): Promise<void> => {
      // Validate inputs
      if (level < 1 || level > 100) {
        const errorMsg = `Invalid level: ${level}. Must be between 1 and 100.`;
        setLocalError(errorMsg);
        throw new Error(errorMsg);
      }

      if (stars < 1 || stars > 3) {
        const errorMsg = `Invalid stars: ${stars}. Must be between 1 and 3.`;
        setLocalError(errorMsg);
        throw new Error(errorMsg);
      }

      // Clear previous error
      setLocalError(undefined);

      try {
        // Submit transaction
        writeContract({
          address: contractAddress,
          abi: MEMORY_MATCH_PROGRESS_ABI,
          functionName: 'update',
          args: [level, stars],
        });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to submit transaction';
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
    updateLevel,
    hash,
    status,
    error,
    isPending,
    isSuccess,
    reset,
  };
}
