/**
 * SaveProgressButton Component
 * 
 * Button for saving game progress to blockchain with Paymaster support.
 * Uses OnchainKit's Transaction components for gas-free transactions.
 * 
 * Requirements: 17.5, 17.6, 17.7, 21.1, 21.2, 21.3, 21.4, 21.5, 21.6, 21.7
 */

import React from 'react';
import { useAccount } from 'wagmi';
import { base } from 'wagmi/chains';
import { 
  Transaction, 
  TransactionButton,
  TransactionStatus,
  TransactionStatusLabel,
  TransactionStatusAction,
} from '@coinbase/onchainkit/transaction';
import type { LifecycleStatus } from '@coinbase/onchainkit/transaction';
import { getContractAddress, MEMORY_MATCH_PROGRESS_ABI } from '../types/blockchain';
import './SaveProgressButton.css';

export interface SaveProgressButtonProps {
  /** Level number to save */
  level: number;
  /** Stars earned (1-3) */
  stars: number;
  /** Callback when save succeeds */
  onSuccess?: () => void;
  /** Callback when save fails */
  onError?: (error: string) => void;
  /** Optional CSS class */
  className?: string;
}

/**
 * SaveProgressButton component
 * 
 * Displays a button to save progress to blockchain with Paymaster support.
 * Shows loading state during transaction and success/error messages.
 * Only visible when wallet is connected.
 * Transactions are gas-free when Paymaster is configured.
 */
export const SaveProgressButton: React.FC<SaveProgressButtonProps> = ({
  level,
  stars,
  onSuccess,
  onError,
  className = '',
}) => {
  const { isConnected } = useAccount();
  const contractAddress = getContractAddress();

  // Don't render if wallet not connected
  if (!isConnected) {
    return null;
  }

  console.log('SaveProgressButton - Contract Address:', contractAddress);
  console.log('SaveProgressButton - Level:', level, 'Stars:', stars);

  // Transaction contracts configuration
  const contracts = [
    {
      address: contractAddress as `0x${string}`,
      abi: MEMORY_MATCH_PROGRESS_ABI,
      functionName: 'update',
      args: [level, stars],
    },
  ];

  // Handle transaction status changes
  const handleOnStatus = (status: LifecycleStatus) => {
    console.log('Transaction status:', status);
    
    if (status.statusName === 'success') {
      console.log('Transaction successful!');
      if (onSuccess) {
        onSuccess();
      }
    } else if (status.statusName === 'error') {
      console.error('Transaction failed:', status.statusData);
      if (onError) {
        onError(status.statusData?.message || 'Transaction failed');
      }
    }
  };

  // Build Paymaster URL from OnchainKit API key
  const apiKey = import.meta.env.VITE_ONCHAINKIT_API_KEY || '';
  const paymasterUrl = apiKey 
    ? `https://api.developer.coinbase.com/rpc/v1/base/${apiKey}`
    : '';

  console.log('Paymaster URL configured:', paymasterUrl ? 'Yes' : 'No');

  return (
    <div className={`save-progress-button-container ${className}`}>
      <Transaction
        contracts={contracts}
        chainId={base.id}
        onStatus={handleOnStatus}
        capabilities={{
          paymasterService: paymasterUrl ? {
            url: paymasterUrl,
          } : undefined,
        }}
      >
        <TransactionButton 
          className="save-progress-button"
          text="Save to Blockchain (Gas-Free)"
        />
        <TransactionStatus>
          <TransactionStatusLabel />
          <TransactionStatusAction />
        </TransactionStatus>
      </Transaction>
    </div>
  );
};
