/**
 * useBatchUpdateLevels Hook
 * 
 * Custom hook for updating multiple levels' progress in a single transaction.
 * Uses wagmi's experimental hooks for batch transactions with Paymaster support.
 * 
 * Requirements: 19.5
 */

import { useAccount, useChainId } from 'wagmi';
import { useCapabilities, useWriteContracts } from 'wagmi/experimental';
import { base } from 'wagmi/chains';
import { useState, useCallback, useMemo } from 'react';
import { 
  MEMORY_MATCH_PROGRESS_ABI, 
  getContractAddress,
  type TransactionStatus 
} from '../types/blockchain';
import { getChainId } from '../utils/network';

/**
 * Hook return type
 */
export interface UseBatchUpdateLevelsResult {
  /** Function to batch update multiple levels */
  batchUpdate: (levels: number[], stars: number[]) => Promise<void>;
  /** Transaction ID if submitted */
  id?: string;
  /** Current transaction status */
  status: TransactionStatus;
  /** Error message if transaction failed */
  error?: string;
  /** Whether transaction is pending */
  isPending: boolean;
  /** Whether transaction succeeded */
  isSuccess: boolean;
  /** Whether Paymaster is available for gas-free transactions */
  hasPaymaster: boolean;
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
 * - Supports Paymaster for gas-free transactions
 * - Validates inputs before submission
 * - Handles errors gracefully with user-friendly messages
 * 
 * @returns Object containing batchUpdate function, transaction status, and helpers
 * 
 * @example
 * ```tsx
 * const { batchUpdate, status, isPending, hasPaymaster } = useBatchUpdateLevels();
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
  const { address } = useAccount();
  const chainId = useChainId();
  const expectedChainId = getChainId();
  const contractAddress = getContractAddress();
  const [localError, setLocalError] = useState<string>();
  const [isSuccess, setIsSuccess] = useState(false);

  // Check for paymaster capabilities
  const { data: availableCapabilities } = useCapabilities({
    account: address,
  });

  // Configure paymaster capabilities
  const capabilities = useMemo(() => {
    if (!availableCapabilities || !address) return {};
    
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
        console.log('Paymaster service available for batch update');
        return {
          paymasterService: {
            url: paymasterUrl,
          },
        };
      }
    }
    
    console.log('Paymaster service not available for batch update');
    return {};
  }, [availableCapabilities, address]);

  const hasPaymaster = Object.keys(capabilities).length > 0;

  // Configure writeContracts hook
  const { writeContracts, isPending, data: id, error: writeError } = useWriteContracts({
    mutation: {
      onSuccess: (data) => {
        console.log('Batch transaction successful:', data);
        setIsSuccess(true);
        setLocalError(undefined);
      },
      onError: (error) => {
        console.error('Batch transaction failed:', error);
        
        // Handle specific error cases
        let message = 'Batch transaction failed';
        
        if (error.message.includes('Failed to fetch signer')) {
          message = 'Wallet connection lost. Please refresh the page and try again.';
        } else if (error.message.includes('User rejected')) {
          message = 'Transaction rejected by user';
        } else if (error.message.includes('insufficient funds')) {
          message = 'Insufficient funds for gas';
        } else if (error.message.includes('network')) {
          message = 'Network error. Please check your connection.';
        } else if (error.message) {
          message = error.message;
        }
        
        setLocalError(message);
        setIsSuccess(false);
      },
    },
  });

  // Determine transaction status
  const status: TransactionStatus = isPending
    ? 'pending'
    : isSuccess
    ? 'success'
    : writeError || localError
    ? 'error'
    : 'idle';

  // Combined error message
  const error = localError || writeError?.message;

  // Batch update function
  const batchUpdate = useCallback(
    async (levels: number[], stars: number[]): Promise<void> => {
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

      // Clear previous state
      setLocalError(undefined);
      setIsSuccess(false);

      try {
        console.log(`Batch updating ${levels.length} levels with Paymaster:`, hasPaymaster);
        
        // Submit batch transaction with capabilities
        writeContracts({
          contracts: [
            {
              address: contractAddress as `0x${string}`,
              abi: MEMORY_MATCH_PROGRESS_ABI,
              functionName: 'batchUpdate',
              args: [levels, stars],
            },
          ],
          capabilities,
        });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to submit batch transaction';
        setLocalError(errorMsg);
        throw err;
      }
    },
    [contractAddress, writeContracts, capabilities, hasPaymaster, chainId, expectedChainId]
  );

  // Reset function
  const reset = useCallback(() => {
    setLocalError(undefined);
    setIsSuccess(false);
  }, []);

  return {
    batchUpdate,
    id,
    status,
    error,
    isPending,
    isSuccess,
    hasPaymaster,
    reset,
  };
}
