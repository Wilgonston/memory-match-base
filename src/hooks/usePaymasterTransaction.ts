/**
 * usePaymasterTransaction Hook
 * 
 * Hook for sending transactions with Paymaster support for injected wallets.
 * Automatically detects if wallet supports EIP-5792 (wallet_sendCalls) and uses Paymaster.
 * Falls back to regular transactions if Paymaster is not available.
 * 
 * Requirements: 2.1, 2.2, 2.3
 */

import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useCapabilities, useWriteContracts } from 'wagmi/experimental';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { Address } from 'viem';
import { base } from 'wagmi/chains';

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
  /** Whether Paymaster is available */
  hasPaymaster: boolean;
  /** Reset function */
  reset: () => void;
}

/**
 * Hook for sending transactions with Paymaster support
 * 
 * This hook automatically detects if the connected wallet supports EIP-5792 (wallet_sendCalls)
 * and uses Paymaster for gas sponsorship. If not supported, falls back to regular transactions.
 * 
 * @param options - Transaction options
 * @returns Transaction state and functions
 * 
 * @example
 * ```tsx
 * const { sendTransaction, isPending, isSuccess, hasPaymaster } = usePaymasterTransaction({
 *   address: contractAddress,
 *   abi: CONTRACT_ABI,
 *   functionName: 'update',
 *   args: [level, stars],
 *   onSuccess: (hash) => console.log('Transaction confirmed:', hash),
 *   onError: (error) => console.error('Transaction failed:', error),
 * });
 * 
 * return (
 *   <button onClick={sendTransaction} disabled={isPending}>
 *     {hasPaymaster ? 'Save (Gas-Free)' : 'Save to Blockchain'}
 *   </button>
 * );
 * ```
 */
export function usePaymasterTransaction(
  options: UsePaymasterTransactionOptions
): UsePaymasterTransactionResult {
  const { address: userAddress } = useAccount();
  const [localError, setLocalError] = useState<string>();

  // Check for paymaster capabilities (EIP-5792)
  const { data: availableCapabilities } = useCapabilities({
    account: userAddress,
  });

  // Configure paymaster capabilities
  const capabilities = useMemo(() => {
    if (!availableCapabilities || !userAddress) return {};
    
    const capabilitiesForChain = availableCapabilities[base.id];
    
    if (
      capabilitiesForChain?.['paymasterService'] &&
      capabilitiesForChain['paymasterService'].supported
    ) {
      const apiKey = import.meta.env.VITE_ONCHAINKIT_API_KEY || '';
      const paymasterUrl = apiKey 
        ? `https://api.developer.coinbase.com/rpc/v1/base/${apiKey}`
        : '';
      
      if (paymasterUrl) {
        console.log('[usePaymasterTransaction] Paymaster service available');
        return {
          paymasterService: {
            url: paymasterUrl,
          },
        };
      }
    }
    
    console.log('[usePaymasterTransaction] Paymaster service not available, using regular transaction');
    return {};
  }, [availableCapabilities, userAddress]);

  const hasPaymaster = Object.keys(capabilities).length > 0;

  // Use writeContracts for Paymaster support (EIP-5792)
  const {
    writeContracts,
    isPending: isPendingBatch,
    data: batchId,
    error: batchError,
    reset: resetBatch,
  } = useWriteContracts();

  // Use writeContract for regular transactions (fallback)
  const {
    writeContract,
    isPending: isPendingRegular,
    data: regularHash,
    error: regularError,
    reset: resetRegular,
  } = useWriteContract();

  // Wait for transaction receipt (only for regular transactions)
  const { isLoading: isConfirming, isSuccess: isConfirmedRegular } = useWaitForTransactionReceipt({
    hash: regularHash,
  });

  // Get batch transaction ID (extract from object if needed)
  const batchCallId = useMemo(() => {
    if (!batchId) return undefined;
    return typeof batchId === 'string' ? batchId : batchId.id;
  }, [batchId]);

  // For batch transactions, consider success immediately after getting batchId
  // Smart Wallet handles confirmation internally, no need to wait
  const isBatchSuccess = Boolean(batchId && !batchError);

  // Determine which method is being used
  const isPending = hasPaymaster ? isPendingBatch : (isPendingRegular || isConfirming);
  const isSuccess = hasPaymaster ? isBatchSuccess : isConfirmedRegular;
  const error = localError || batchError?.message || regularError?.message;
  const hash = hasPaymaster ? batchCallId : regularHash;

  // Send transaction
  const sendTransaction = useCallback(() => {
    setLocalError(undefined);

    try {
      if (hasPaymaster) {
        // Use writeContracts with Paymaster
        console.log('[usePaymasterTransaction] Sending transaction with Paymaster');
        writeContracts({
          contracts: [
            {
              address: options.address,
              abi: options.abi as any,
              functionName: options.functionName,
              args: options.args,
            },
          ],
          capabilities,
        });
      } else {
        // Use regular writeContract
        console.log('[usePaymasterTransaction] Sending regular transaction');
        writeContract({
          address: options.address,
          abi: options.abi,
          functionName: options.functionName,
          args: options.args,
        });
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Transaction failed';
      setLocalError(errorMsg);
      options.onError?.(errorMsg);
    }
  }, [hasPaymaster, writeContracts, writeContract, capabilities, options]);

  // Handle batch transaction success
  useEffect(() => {
    if (batchId && !isPendingBatch && !batchError && isBatchSuccess) {
      console.log('[usePaymasterTransaction] Batch transaction successful:', batchId);
      const hashString = typeof batchId === 'string' ? batchId : batchId.id;
      options.onSuccess?.(hashString);
    }
  }, [batchId, isPendingBatch, batchError, isBatchSuccess, options]);

  // Handle regular transaction success
  useEffect(() => {
    if (isConfirmedRegular && regularHash) {
      console.log('[usePaymasterTransaction] Regular transaction confirmed:', regularHash);
      options.onSuccess?.(regularHash);
    }
  }, [isConfirmedRegular, regularHash, options]);

  // Handle errors
  useEffect(() => {
    if (batchError) {
      const errorMsg = batchError.message || 'Batch transaction failed';
      setLocalError(errorMsg);
      options.onError?.(errorMsg);
    }
  }, [batchError, options]);

  useEffect(() => {
    if (regularError) {
      const errorMsg = regularError.message || 'Transaction failed';
      setLocalError(errorMsg);
      options.onError?.(errorMsg);
    }
  }, [regularError, options]);

  // Reset function
  const reset = useCallback(() => {
    setLocalError(undefined);
    if (hasPaymaster) {
      resetBatch();
    } else {
      resetRegular();
    }
  }, [hasPaymaster, resetBatch, resetRegular]);

  return {
    sendTransaction,
    hash,
    isPending,
    isSuccess,
    error,
    hasPaymaster,
    reset,
  };
}
