import React, { useState } from 'react';
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
import { getChainId } from '../utils/network';
import './SaveProgressButton.css';

export interface SaveProgressButtonProps {
  level: number;
  stars: number;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
}

export const SaveProgressButton: React.FC<SaveProgressButtonProps> = ({
  level,
  stars,
  onSuccess,
  onError,
  className = '',
}) => {
  const { address, isConnected } = useAccount();
  const contractAddress = getContractAddress();
  const [hasPaymaster, setHasPaymaster] = useState(true);

  if (!isConnected || !address) {
    return null;
  }

  const contracts = [
    {
      address: contractAddress as Address,
      abi: MEMORY_MATCH_PROGRESS_ABI,
      functionName: 'update',
      args: [level, stars],
    },
  ];

  const handleOnStatus = (status: LifecycleStatus) => {
    console.log('[SaveProgressButton] Transaction status:', status.statusName);
    
    if (status.statusName === 'transactionPending') {
      playSound('transaction-submitted');
    } else if (status.statusName === 'success') {
      playSound('transaction-confirmed');
      onSuccess?.();
    } else if (status.statusName === 'error') {
      const errorMessage = status.statusData?.message || status.statusData?.error || 'Transaction failed';
      console.error('[SaveProgressButton] Transaction error:', errorMessage);
      
      // Check if error is related to Paymaster
      if (errorMessage.includes('wallet_getCapabilities') || 
          errorMessage.includes('not supported') ||
          errorMessage.includes('paymaster')) {
        console.log('[SaveProgressButton] Paymaster not available, user will pay gas');
        setHasPaymaster(false);
      }
      
      // Don't show error to user if it's just a Paymaster capability check
      if (!errorMessage.includes('wallet_getCapabilities')) {
        onError?.(errorMessage);
      }
    }
  };

  return (
    <div className={`save-progress-button-container ${className}`}>
      <Transaction
        calls={contracts}
        onStatus={handleOnStatus}
        chainId={getChainId()}
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
        {hasPaymaster 
          ? '✨ Gas-free transaction (sponsored by Paymaster)' 
          : '⚡ You will pay gas for this transaction'}
      </p>
    </div>
  );
};

