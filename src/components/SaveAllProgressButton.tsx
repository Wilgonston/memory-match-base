/**
 * SaveAllProgressButton Component
 * 
 * Button to save all completed levels to blockchain in a single batch transaction
 * Uses EIP-5792 writeContracts for batching multiple updates
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { useBatchUpdateLevels } from '../hooks/useBatchUpdateLevels';
import { useLoadBlockchainProgress } from '../hooks/useLoadBlockchainProgress';
import { getUnsavedLevels } from '../utils/unsavedProgress';
import { ProgressData } from '../types';
import './SaveAllProgressButton.css';

export interface SaveAllProgressButtonProps {
  progressData: ProgressData;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
}

export const SaveAllProgressButton: React.FC<SaveAllProgressButtonProps> = ({
  progressData,
  onSuccess,
  onError,
  className = '',
}) => {
  const { isConnected } = useAccount();
  const { batchUpdate, isPending, error, isSuccess, hasPaymaster, reset, id } = useBatchUpdateLevels();
  const { progress: blockchainProgress, isLoading: isLoadingBlockchain } = useLoadBlockchainProgress();
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState<string | null>(null);
  const [savedHash, setSavedHash] = useState<string | null>(null);

  // Calculate unsaved levels (levels that need to be saved to blockchain)
  const unsavedData = useMemo(() => {
    return getUnsavedLevels(progressData, blockchainProgress);
  }, [progressData, blockchainProgress]);

  if (!isConnected) {
    return null;
  }

  // Hide button if no unsaved progress
  if (unsavedData.count === 0 && !isLoadingBlockchain) {
    return null;
  }

  // Show loading while checking blockchain
  if (isLoadingBlockchain) {
    return (
      <div className={`save-all-progress-container ${className}`}>
        <div className="save-all-info">
          Checking blockchain progress...
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    setIsSaving(true);
    setShowSuccess(false);
    setShowError(null);
    reset();
    
    try {
      await batchUpdate(unsavedData.levels, unsavedData.stars);
    } catch (err) {
      console.error('[SaveAllProgressButton] Failed to save progress:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to save progress';
      
      // User-friendly error messages
      if (errorMessage.includes('User rejected') || errorMessage.includes('User denied')) {
        setShowError('Transaction cancelled');
      } else if (errorMessage.includes('insufficient funds')) {
        setShowError('Insufficient funds for gas');
      } else if (!errorMessage.includes('wallet_getCapabilities') && 
                 !errorMessage.includes('wallet_sendCalls')) {
        setShowError('Transaction failed. Please try again.');
      }
      setIsSaving(false);
    }
  };

  // Handle success - only when transaction is confirmed on blockchain
  useEffect(() => {
    if (isSuccess && !isPending && id) {
      console.log('[SaveAllProgressButton] ✅ Batch transaction confirmed:', id);
      setShowSuccess(true);
      setShowError(null);
      setIsSaving(false);
      setSavedHash(id); // Save hash to prevent re-showing button
      onSuccess?.();
      
      // Auto-hide after 10 seconds
      const timer = setTimeout(() => {
        setShowSuccess(false);
        setSavedHash(null); // Reset to allow saving new progress
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [isSuccess, isPending, id, onSuccess]);

  // Handle error
  useEffect(() => {
    if (error && !error.includes('wallet_getCapabilities') && !error.includes('wallet_sendCalls')) {
      // User-friendly error messages
      let errorMsg = 'Transaction failed. Please try again.';
      
      if (error.includes('User rejected') || error.includes('User denied')) {
        errorMsg = 'Transaction cancelled';
      } else if (error.includes('insufficient funds')) {
        errorMsg = 'Insufficient funds for gas';
      }
      
      setShowError(errorMsg);
      setShowSuccess(false);
      setIsSaving(false);
      onError?.(errorMsg);
    }
  }, [error, onError]);

  const isLoading = isSaving || isPending;
  
  // Hide button if transaction was successful (data is on blockchain)
  if (savedHash && showSuccess) {
    return (
      <div className={`save-all-progress-container ${className}`}>
        <div className="save-all-success-message">
          ✅ Progress saved to blockchain!
          <a 
            href={`https://basescan.org/tx/${savedHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="tx-link"
          >
            View transaction
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={`save-all-progress-container ${className}`}>
      <button
        onClick={handleSave}
        disabled={isLoading || showSuccess}
        className={`save-all-progress-button ${showSuccess ? 'success' : ''}`}
        title={`Save ${unsavedData.count} unsaved level${unsavedData.count > 1 ? 's' : ''} to blockchain in a single transaction`}
      >
        {isLoading ? (
          <>
            <span className="save-all-spinner"></span>
            Saving batch...
          </>
        ) : showSuccess ? (
          <>✓ All Saved!</>
        ) : (
          <>
            💾 Save to Blockchain ({unsavedData.count})
          </>
        )}
      </button>

      {showError && (
        <p className="save-all-error">
          ⚠️ {showError}
        </p>
      )}

      <p className="save-all-info">
        {hasPaymaster ? '⚡ Gas-free' : '⚡ You will pay gas'} • Batch saves {unsavedData.count} level{unsavedData.count > 1 ? 's' : ''} in 1 transaction
      </p>
    </div>
  );
};
