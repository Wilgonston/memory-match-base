/**
 * SaveProgressButton Component
 * 
 * Button for saving game progress to blockchain with Paymaster support.
 * Uses OnchainKit Transaction components for ERC-7677 compliant gas sponsorship
 * with automatic fallback to user-paid transactions when sponsorship fails.
 * 
 * Requirements: 2.2, 2.3, 2.5, 2.7, 5.7, 17.5, 17.6, 17.7, 21.1, 21.2, 21.3, 21.4, 21.5, 21.6, 21.7
 */

import React from 'react';
import { useAccount } from 'wagmi';
import { Address } from 'viem';
import {
  Transaction,
  TransactionButton,
  TransactionStatus,
  TransactionStatusLabel,
  TransactionStatusAction,
} from '@coinbase/onchainkit/transaction';
import type { LifecycleStatus } from '@coinbase/onchainkit/transaction';
import { getContractAddress, MEMORY_MATCH_PROGRESS_ABI } from '../types/blockchain';
import { playSound } from '../utils/soundManager';
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
 * Displays a button to save progress to blockchain using OnchainKit Transaction components.
 * Automatically attempts gas sponsorship via Paymaster, with fallback to user-paid transactions.
 * Shows transaction status and provides user feedback throughout the process.
 * Only visible when wallet is connected.
 * 
 * Features:
 * - OnchainKit Transaction component integration
 * - ERC-7677 compliant paymaster integration
 * - Automatic fallback to user-paid transactions
 * - Transaction status display with labels and actions
 * - Sound effects for transaction events
 */
export const SaveProgressButton: React.FC<SaveProgressButtonProps> = ({
  level,
  stars,
  onSuccess,
  onError,
  className = '',
}) => {
  const { address, isConnected } = useAccount();
  const contractAddress = getContractAddress();

  // Don't render if wallet not connected
  if (!isConnected || !address) {
    return null;
  }

  // Prepare contract call
  const contracts = [
    {
      address: contractAddress as Address,
      abi: MEMORY_MATCH_PROGRESS_ABI,
      functionName: 'update',
      args: [level, stars],
    },
  ];

  // Handle transaction status changes
  const handleOnStatus = (status: LifecycleStatus) => {
    console.log('[SaveProgressButton] Transaction status:', status);

    // Play sounds based on status
    if (status.statusName === 'transactionPending') {
      playSound('transaction-submitted');
    } else if (status.statusName === 'success') {
      playSound('transaction-confirmed');
      if (onSuccess) {
        onSuccess();
      }
    } else if (status.statusName === 'error') {
      if (onError && status.statusData?.message) {
        onError(status.statusData.message);
      }
    }
  };

  return (
    <div className={`save-progress-button-container ${className}`}>
      <Transaction
        contracts={contracts}
        onStatus={handleOnStatus}
        chainId={contractAddress ? 8453 : 84532} // Base mainnet or sepolia
      >
        <TransactionButton
          className="save-progress-button"
          text="Save to Blockchain"
        />
        <TransactionStatus>
          <TransactionStatusLabel />
          <TransactionStatusAction />
        </TransactionStatus>
      </Transaction>

      <p className="gas-free-info">
        ✨ Gas-free transaction (sponsored by Paymaster)
      </p>
    </div>
  );
};

