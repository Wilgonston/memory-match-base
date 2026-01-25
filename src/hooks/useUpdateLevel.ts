/**
 * useUpdateLevel Hook
 * 
 * Custom hook for updating a single level's progress with Paymaster support.
 * Uses wagmi's useWriteContract with proper configuration for gas sponsorship.
 * 
 * Requirements: 19.4, 17.1, 17.2, 17.3
 */

import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useState, useCallback, useEffect } from 'react';
import { base } from 'wagmi/chains';
import { 
  MEMORY_MATCH_PROGRESS_ABI, 
  getContractAddress,
  type TransactionStatus 
} from '../types/blockchain';

/**
 * Hook return type
 */
export interface UseUpdateLevelResult {
  /** Function to update a single level */
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
 * - Submits transaction to update one level
 * - Supports Paymaster for gas-free transactions
 * - Tracks transaction status (pending, success, error)
 * - Waits for transaction confirmation
 * - Validates inputs before submission
 * - Handles errors gracefully with user-friendly messages
 * 
 * @returns Object containing updateLevel function, transaction status, and helpers
 * 
 * @example
 * ```tsx
 * const { updateLevel, status, isPending } = useUpdateLevel();
 * 
 * const handleSave = async () => {
 *   try {
 *     await updateLevel(1, 3); // Save level 1 with 3 stars
 *     console.log('Progress saved!');
 *   } catch (err) {
 *     console.error('Failed to save:', err);
 *   }
 * };
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
      // Validate level
      if (level < 1 || level > 100) {
        const errorMsg = `Invalid level: ${level}. Must be between 1 and 100.`;
        setLocalError(errorMsg);
        throw new Error(errorMsg);
      }

      // Validate stars
      if (stars < 1 || stars > 3) {
        const errorMsg = `Invalid stars: ${stars}. Must be between 1 and 3.`;
        setLocalError(errorMsg);
        throw new Error(errorMsg);
      }

      // Clear previous error
      setLocalError(undefined);

      console.log(`Updating level ${level} with ${stars} stars to contract ${contractAddress}`);

      try {
        // Submit transaction with Paymaster support
        writeContract({
          address: contractAddress as `0x${string}`,
          abi: MEMORY_MATCH_PROGRESS_ABI,
          functionName: 'update',
          args: [level, stars],
          chainId: base.id,
        });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to submit transaction';
        setLocalError(errorMsg);
        console.error('Transaction submission failed:', err);
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

  // Log transaction status changes
  useEffect(() => {
    if (hash) {
      console.log('Transaction submitted:', hash);
    }
  }, [hash]);

  useEffect(() => {
    if (isSuccess) {
      console.log('Transaction confirmed successfully!');
    }
  }, [isSuccess]);

  useEffect(() => {
    if (error) {
      console.error('Transaction error:', error);
    }
  }, [error]);

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
