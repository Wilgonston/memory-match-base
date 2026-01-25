/**
 * SaveProgressButton Component
 * 
 * Button for saving game progress to blockchain with Paymaster support.
 * Uses wagmi's experimental hooks for gas-free transactions with Smart Wallets.
 * 
 * Requirements: 17.5, 17.6, 17.7, 21.1, 21.2, 21.3, 21.4, 21.5, 21.6, 21.7
 */

import React, { useState, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { useCapabilities, useWriteContracts } from 'wagmi/experimental';
import { base } from 'wagmi/chains';
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
 * All transactions are gas-free (sponsored by Paymaster) for Smart Wallets.
 */
export const SaveProgressButton: React.FC<SaveProgressButtonProps> = ({
  level,
  stars,
  onSuccess,
  onError,
  className = '',
}) => {
  const { address, isConnected } = useAccount();
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const contractAddress = getContractAddress();

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
        console.log('Paymaster service available and configured');
        return {
          paymasterService: {
            url: paymasterUrl,
          },
        };
      }
    }
    
    console.log('Paymaster service not available');
    return {};
  }, [availableCapabilities, address]);

  // Configure writeContracts hook
  const { writeContracts } = useWriteContracts({
    mutation: {
      onSuccess: (data) => {
        console.log('Transaction successful:', data);
        setStatus('success');
        setIsSaving(false);
        if (onSuccess) {
          onSuccess();
        }
        // Reset status after 3 seconds
        setTimeout(() => setStatus('idle'), 3000);
      },
      onError: (error) => {
        console.error('Transaction failed:', error);
        const message = error.message || 'Transaction failed';
        setErrorMessage(message);
        setStatus('error');
        setIsSaving(false);
        if (onError) {
          onError(message);
        }
        // Reset status after 5 seconds
        setTimeout(() => {
          setStatus('idle');
          setErrorMessage('');
        }, 5000);
      },
    },
  });

  // Don't render if wallet not connected
  if (!isConnected) {
    return null;
  }

  const handleSave = async () => {
    setIsSaving(true);
    setStatus('idle');
    setErrorMessage('');

    try {
      console.log('Saving progress:', { level, stars, contractAddress });
      console.log('Using capabilities:', capabilities);

      writeContracts({
        contracts: [
          {
            address: contractAddress as `0x${string}`,
            abi: MEMORY_MATCH_PROGRESS_ABI,
            functionName: 'update',
            args: [level, stars],
          },
        ],
        capabilities,
      });
    } catch (error) {
      console.error('Error initiating transaction:', error);
      const message = error instanceof Error ? error.message : 'Failed to initiate transaction';
      setErrorMessage(message);
      setStatus('error');
      setIsSaving(false);
      if (onError) {
        onError(message);
      }
    }
  };

  const hasPaymaster = Object.keys(capabilities).length > 0;

  return (
    <div className={`save-progress-button-container ${className}`}>
      <button
        onClick={handleSave}
        disabled={isSaving || status === 'success'}
        className={`save-progress-button ${status}`}
      >
        {isSaving && (
          <span className="save-progress-spinner"></span>
        )}
        {status === 'idle' && !isSaving && 'Save to Blockchain'}
        {isSaving && 'Saving...'}
        {status === 'success' && '✓ Saved!'}
        {status === 'error' && 'Failed - Retry'}
      </button>

      {status === 'error' && errorMessage && (
        <p className="save-progress-error">
          {errorMessage}
        </p>
      )}

      {status === 'idle' && !isSaving && (
        <p className="gas-free-info">
          {hasPaymaster 
            ? '✨ Gas-free transaction (sponsored by Paymaster)'
            : '⚠️ Paymaster not available - transaction will require gas'}
        </p>
      )}
    </div>
  );
};
