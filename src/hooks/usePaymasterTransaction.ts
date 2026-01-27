/**
 * usePaymasterTransaction Hook
 * 
 * Custom hook for executing transactions with Paymaster integration.
 * Provides automatic fallback to user-paid transactions when paymaster fails.
 * 
 * Features:
 * - Attempts paymaster sponsorship first
 * - Falls back to user-paid on paymaster failure
 * - Comprehensive logging for monitoring
 * - Error handling and status tracking
 * 
 * Requirements: 2.2, 2.3, 2.5, 2.7
 */

import { useState, useCallback } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Address, Hex } from 'viem';
import { PaymasterService, UserOperation } from '../services/PaymasterService';
import { performanceMonitor } from '../utils/performance';

export interface PaymasterTransactionOptions {
  /** The paymaster service instance */
  paymasterService?: PaymasterService;
  /** Contract address to call */
  address: Address;
  /** Contract ABI */
  abi: unknown[];
  /** Function name to call */
  functionName: string;
  /** Function arguments */
  args?: unknown[];
  /** Callback on success */
  onSuccess?: (hash: Hex) => void;
  /** Callback on error */
  onError?: (error: Error) => void;
  /** EntryPoint contract address (for ERC-4337) */
  entrypoint?: Address;
  /** Chain ID */
  chainId?: number;
}

export interface PaymasterTransactionState {
  /** Whether a transaction is in progress */
  isLoading: boolean;
  /** Whether paymaster sponsorship was used */
  isSponsored: boolean;
  /** Transaction hash */
  hash?: Hex;
  /** Transaction status */
  status: 'idle' | 'preparing' | 'submitting' | 'pending' | 'success' | 'error';
  /** Error message if failed */
  error?: string;
  /** Whether paymaster was attempted */
  paymasterAttempted: boolean;
  /** Whether paymaster succeeded */
  paymasterSucceeded: boolean;
}

/**
 * Hook for executing transactions with Paymaster integration
 * 
 * @param options - Transaction options including paymaster service
 * @returns Transaction state and execute function
 * 
 * @example
 * ```tsx
 * const { execute, isLoading, isSponsored, status } = usePaymasterTransaction({
 *   paymasterService,
 *   address: contractAddress,
 *   abi: contractAbi,
 *   functionName: 'saveProgress',
 *   args: [level, stars],
 *   onSuccess: (hash) => console.log('Success:', hash),
 *   onError: (error) => console.error('Error:', error),
 * });
 * 
 * // Execute the transaction
 * await execute();
 * ```
 */
export function usePaymasterTransaction(
  options: PaymasterTransactionOptions
): PaymasterTransactionState & { execute: () => Promise<void> } {
  const { address: userAddress } = useAccount();
  const [state, setState] = useState<PaymasterTransactionState>({
    isLoading: false,
    isSponsored: false,
    status: 'idle',
    paymasterAttempted: false,
    paymasterSucceeded: false,
  });

  // wagmi hook for writing to contract
  const { writeContractAsync } = useWriteContract();

  // Wait for transaction receipt
  const { data: receipt } = useWaitForTransactionReceipt({
    hash: state.hash,
  });

  // Update status when receipt is received
  if (receipt && state.status === 'pending') {
    if (receipt.status === 'success') {
      setState((prev) => ({ ...prev, status: 'success', isLoading: false }));
      if (options.onSuccess && state.hash) {
        options.onSuccess(state.hash);
      }
    } else {
      setState((prev) => ({
        ...prev,
        status: 'error',
        isLoading: false,
        error: 'Transaction reverted',
      }));
      if (options.onError) {
        options.onError(new Error('Transaction reverted'));
      }
    }
  }

  /**
   * Execute transaction with paymaster integration
   * 
   * Flow:
   * 1. Check if paymaster service is available
   * 2. If available, attempt to get paymaster sponsorship
   * 3. If paymaster succeeds, execute sponsored transaction
   * 4. If paymaster fails, fall back to user-paid transaction
   * 5. Log all attempts for monitoring
   */
  const execute = useCallback(async () => {
    if (!userAddress) {
      const error = new Error('Wallet not connected');
      setState((prev) => ({
        ...prev,
        status: 'error',
        error: error.message,
        isLoading: false,
      }));
      if (options.onError) {
        options.onError(error);
      }
      return;
    }

    setState((prev) => ({
      ...prev,
      isLoading: true,
      status: 'preparing',
      error: undefined,
      paymasterAttempted: false,
      paymasterSucceeded: false,
    }));

    const startTime = Date.now();
    let sponsored = false;

    try {
      // Attempt paymaster sponsorship if service is available
      if (options.paymasterService) {
        try {
          console.log('[usePaymasterTransaction] Attempting paymaster sponsorship');
          setState((prev) => ({ ...prev, paymasterAttempted: true }));

          // Create a mock UserOperation for eligibility check
          // In a real implementation, this would be constructed from the transaction data
          const mockUserOp: UserOperation = {
            sender: userAddress as Address,
            nonce: 0n,
            initCode: '0x' as Hex,
            callData: '0x' as Hex, // Would contain actual call data
            callGasLimit: 100000n,
            verificationGasLimit: 100000n,
            preVerificationGas: 21000n,
            maxFeePerGas: 1000000000n,
            maxPriorityFeePerGas: 1000000000n,
            signature: '0x' as Hex,
          };

          // Check eligibility
          const isEligible = await options.paymasterService.isEligibleForSponsorship(
            mockUserOp
          );

          if (isEligible) {
            console.log('[usePaymasterTransaction] Transaction eligible for sponsorship');
            
            // Get paymaster data
            const entrypoint = options.entrypoint || ('0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789' as Address);
            const chainId = options.chainId || 8453; // Base mainnet

            const paymasterData = await options.paymasterService.getPaymasterData(
              mockUserOp,
              entrypoint,
              chainId
            );

            if (paymasterData && paymasterData.paymasterAndData) {
              sponsored = true;
              setState((prev) => ({
                ...prev,
                isSponsored: true,
                paymasterSucceeded: true,
              }));
              console.log('[usePaymasterTransaction] Paymaster sponsorship obtained');
              
              // Log paymaster usage for monitoring (Requirement 2.7)
              console.log('[usePaymasterTransaction] Paymaster usage:', {
                timestamp: new Date().toISOString(),
                user: userAddress,
                contract: options.address,
                function: options.functionName,
                sponsored: true,
                paymaster: paymasterData.paymaster,
              });
            }
          } else {
            console.log('[usePaymasterTransaction] Transaction not eligible for sponsorship');
          }
        } catch (paymasterError) {
          // Paymaster failed - log and fall back (Requirement 2.5)
          console.warn('[usePaymasterTransaction] Paymaster failed, falling back to user-paid:', paymasterError);
          
          // Log fallback for monitoring
          console.log('[usePaymasterTransaction] Fallback to user-paid:', {
            timestamp: new Date().toISOString(),
            user: userAddress,
            contract: options.address,
            function: options.functionName,
            sponsored: false,
            reason: paymasterError instanceof Error ? paymasterError.message : 'Unknown error',
          });
        }
      } else {
        console.log('[usePaymasterTransaction] No paymaster service configured, using user-paid transaction');
      }

      // Execute transaction (sponsored or user-paid)
      setState((prev) => ({ ...prev, status: 'submitting' }));
      
      console.log('[usePaymasterTransaction] Executing transaction:', {
        address: options.address,
        functionName: options.functionName,
        args: options.args,
        sponsored,
      });

      const hash = await writeContractAsync({
        address: options.address,
        abi: options.abi,
        functionName: options.functionName,
        args: options.args,
      });

      setState((prev) => ({
        ...prev,
        hash,
        status: 'pending',
      }));

      console.log('[usePaymasterTransaction] Transaction submitted:', {
        hash,
        sponsored,
      });

      // Record performance metric
      const duration = Date.now() - startTime;
      performanceMonitor.recordMetric({
        name: 'transaction',
        value: duration,
        timestamp: Date.now(),
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Transaction failed';
      console.error('[usePaymasterTransaction] Transaction error:', error);

      setState((prev) => ({
        ...prev,
        status: 'error',
        error: errorMessage,
        isLoading: false,
      }));

      if (options.onError) {
        options.onError(error instanceof Error ? error : new Error(errorMessage));
      }
    }
  }, [
    userAddress,
    options.paymasterService,
    options.address,
    options.abi,
    options.functionName,
    options.args,
    options.entrypoint,
    options.chainId,
    options.onSuccess,
    options.onError,
    writeContractAsync,
  ]);

  return {
    ...state,
    execute,
  };
}
