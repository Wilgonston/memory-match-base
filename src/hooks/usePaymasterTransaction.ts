/**
 * usePaymasterTransaction Hook
 * 
 * Hook for sending regular transactions (Paymaster disabled).
 * User pays gas for all transactions.
 * 
 * Requirements: 2.1, 2.2, 2.3
 */

import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useState, useCallback, useEffect } from 'react';
import { Address } from 'viem';

export interface UsePaymasterTransactionOptions {
  /** Contract address to interact with */
  address: Address;
  /** Contract ABI */
  abi: readonly unknown[];
  /** Function name to call */
  functionName: string;
  /** Function arguments */
  args?: unknown[];
  /** Callback on success */
  onSuccess?: (hash: string) => void;
  /** Callback on error */
  onError?: (error: string) => void;
}

export interface UsePaymasterTransactionResult {
  /** Function to send transaction */
  sendTransaction: () => void;
  /** Transaction hash */
  hash?: string;
  /** Whether transaction is pending */
  isPending: boolean;
  /** Whether transaction succeeded */
  isSuccess: boolean;
  /** Error message if transaction failed */
  error?: string;
  /** Whether Paymaster is available (always false now) */
  hasPaymaster: boolean;
  /** Reset function */
  reset: () => void;
}

/**
 * Hook for sending regular transactions (user pays gas)
 * 
 * @param options - Transaction options
 * @returns Transaction state and functions
 * 
 * @example
 * ```tsx
 * const { sendTransaction, isPending, isSuccess } = usePaymasterTransaction({
 *   address: contractAddress,
 *   abi: CONTRACT_ABI,
 *   functionName: 'update',
 *   args: [level, stars],
 *   onSuccess: (hash) => console.log('Transaction confirmed:', hash),
 *   onError: (error) => console.error('Transaction failed:', error),
 * });
 * ```
 */
export function usePaymasterTransaction(
  options: UsePaymasterTransactionOptions
): UsePaymasterTransactionResult {
  const [localError, setLocalError] = useState<string>();

  // Use regular writeContract (user pays gas)
  const {
    writeContract,
    isPending: isPendingWrite,
    data: txHash,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract();

  // Wait for transaction receipt
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const isPending = isPendingWrite || isConfirming;
  const isSuccess = isConfirmed;
  const error = localError || writeError?.message;
  const hash = txHash;

  // Send transaction
  const sendTransaction = useCallback(() => {
    setLocalError(undefined);

    try {
      console.log('[usePaymasterTransaction] Sending regular transaction (user pays gas)');
      writeContract({
        address: options.address,
        abi: options.abi,
        functionName: options.functionName,
        args: options.args,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Transaction failed';
      setLocalError(errorMsg);
      options.onError?.(errorMsg);
    }
  }, [writeContract, options]);

  // Handle transaction success
  useEffect(() => {
    if (isConfirmed && txHash) {
      console.log('[usePaymasterTransaction] Transaction confirmed:', txHash);
      options.onSuccess?.(txHash);
    }
  }, [isConfirmed, txHash, options]);

  // Handle errors
  useEffect(() => {
    if (writeError) {
      const errorMsg = writeError.message || 'Transaction failed';
      setLocalError(errorMsg);
      options.onError?.(errorMsg);
    }
  }, [writeError, options]);

  // Reset function
  const reset = useCallback(() => {
    setLocalError(undefined);
    resetWrite();
  }, [resetWrite]);

  return {
    sendTransaction,
    hash,
    isPending,
    isSuccess,
    error,
    hasPaymaster: false, // Paymaster disabled
    reset,
  };
}
