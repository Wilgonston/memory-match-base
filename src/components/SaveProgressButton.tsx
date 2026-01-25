/**
 * SaveProgressButton Component
 * 
 * Button for saving game progress to blockchain with Paymaster support.
 * Uses OnchainKit's Transaction components for gas-free transactions.
 * 
 * IMPORTANT: Gas-free transactions only work with Smart Wallets (ERC-4337).
 * Regular EOA wallets (MetaMask, Zerion, etc.) will still pay gas fees.
 * 
 * Requirements: 17.5, 17.6, 17.7, 21.1, 21.2, 21.3, 21.4, 21.5, 21.6, 21.7
 */

import React, { useState } from 'react';
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
 * 
 * Gas-free transactions require Smart Wallet (Coinbase Smart Wallet).
 * Regular EOA wallets will still pay gas fees (~$0.07).
 */
export const SaveProgressButton: React.FC<SaveProgressButtonProps> = ({
  level,
  stars,
  onSuccess,
  onError,
  className = '',
}) => {
  const { isConnected, connector } = useAccount();
  const contractAddress = getContractAddress();
  const [showWalletWarning, setShowWalletWarning] = useState(false);

  // Don't render if wallet not connected
  if (!isConnected) {
    return null;
  }

  // Check if using Smart Wallet (Coinbase Wallet with Smart Wallet support)
  const isSmartWallet = connector?.name?.toLowerCase().includes('coinbase') || 
                        connector?.name?.toLowerCase().includes('smart');

  console.log('SaveProgressButton - Contract Address:', contractAddress);
  console.log('SaveProgressButton - Level:', level, 'Stars:', stars);
  console.log('SaveProgressButton - Connector:', connector?.name);
  console.log('SaveProgressButton - Is Smart Wallet:', isSmartWallet);

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
      setShowWalletWarning(false);
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
      {/* Warning for non-Smart Wallet users */}
      {!isSmartWallet && showWalletWarning && (
        <div className="wallet-warning">
          <p className="warning-text">
            ⚠️ Gas-free transactions require Coinbase Smart Wallet.
            <br />
            You're using {connector?.name || 'a regular wallet'}, so you'll pay gas fees (~$0.07).
          </p>
          <button 
            className="warning-dismiss"
            onClick={() => setShowWalletWarning(false)}
          >
            Got it
          </button>
        </div>
      )}

      <Transaction
        contracts={contracts}
        chainId={base.id}
        onStatus={handleOnStatus}
        capabilities={isSmartWallet && paymasterUrl ? {
          paymasterService: {
            url: paymasterUrl,
          },
        } : undefined}
      >
        <TransactionButton 
          className="save-progress-button"
          text={isSmartWallet ? "Save to Blockchain (Gas-Free)" : "Save to Blockchain"}
          onClick={() => {
            if (!isSmartWallet) {
              setShowWalletWarning(true);
            }
          }}
        />
        <TransactionStatus>
          <TransactionStatusLabel />
          <TransactionStatusAction />
        </TransactionStatus>
      </Transaction>

      {/* Info about Smart Wallet */}
      {!isSmartWallet && (
        <p className="smart-wallet-info">
          💡 For gas-free transactions, use <a href="https://www.coinbase.com/wallet" target="_blank" rel="noopener noreferrer">Coinbase Smart Wallet</a>
        </p>
      )}
    </div>
  );
};
