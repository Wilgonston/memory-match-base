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
    if (status.statusName === 'transactionPending') {
      playSound('transaction-submitted');
    } else if (status.statusName === 'success') {
      playSound('transaction-confirmed');
      onSuccess?.();
    } else if (status.statusName === 'error') {
      onError?.(status.statusData?.message || 'Transaction failed');
    }
  };

  return (
    <div className={`save-progress-button-container ${className}`}>
      <Transaction
        contracts={contracts}
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
        ✨ Gas-free transaction (sponsored by Paymaster)
      </p>
    </div>
  );
};

