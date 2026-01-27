/**
 * SmartWalletTransaction Component
 * 
 * Handles gasless transactions through OnchainKit Transaction components
 * with Paymaster support. User only needs to approve once.
 */

import { 
  Transaction, 
  TransactionButton,
  TransactionStatus,
  TransactionStatusLabel,
  TransactionStatusAction,
} from '@coinbase/onchainkit/transaction';
import type { LifecycleStatus } from '@coinbase/onchainkit/transaction';
import { useCallback } from 'react';
import { MEMORY_MATCH_PROGRESS_ABI, getContractAddress } from '../types/blockchain';
import { base } from 'wagmi/chains';

interface SmartWalletTransactionProps {
  levels: number[];
  stars: number[];
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  buttonText?: string;
}

export function SmartWalletTransaction({
  levels,
  stars,
  onSuccess,
  onError,
  buttonText = 'Save Progress',
}: SmartWalletTransactionProps) {
  const contractAddress = getContractAddress();

  const handleOnStatus = useCallback((status: LifecycleStatus) => {
    console.log('[SmartWalletTransaction] Status:', status);
    
    if (status.statusName === 'success') {
      console.log('[SmartWalletTransaction] Transaction successful!');
      onSuccess?.();
    } else if (status.statusName === 'error') {
      console.error('[SmartWalletTransaction] Transaction failed:', status.statusData);
      onError?.(new Error(status.statusData?.message || 'Transaction failed'));
    }
  }, [onSuccess, onError]);

  // Build contract calls
  const contracts = [
    {
      address: contractAddress,
      abi: MEMORY_MATCH_PROGRESS_ABI,
      functionName: 'batchUpdate',
      args: [levels, stars],
    },
  ] as const;

  return (
    <Transaction
      chainId={base.id}
      contracts={contracts}
      onStatus={handleOnStatus}
    >
      <TransactionButton text={buttonText} />
      <TransactionStatus>
        <TransactionStatusLabel />
        <TransactionStatusAction />
      </TransactionStatus>
    </Transaction>
  );
}
