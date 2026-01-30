/**
 * SaveAllProgressButton Component
 * 
 * Button to save all completed levels to blockchain in a single batch transaction
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { useSequentialUpdateLevels } from '../hooks/useSequentialUpdateLevels';
import { useLoadBlockchainProgress } from '../hooks/useLoadBlockchainProgress';
import { getContractAddress } from '../types/blockchain';
import { ProgressData } from '../types';
import { getUnsavedLevels, hasMoreProgressOnBlockchain } from '../utils/unsavedProgress';
import './SaveAllProgressButton.css';

export interface SaveAllProgressButtonProps {
  progressData: ProgressData;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  onLoadFromBlockchain?: () => void;
  className?: string;
}

export const SaveAllProgressButton: React.FC<SaveAllProgressButtonProps> = ({
  progressData,
  onSuccess,
  onError,
  onLoadFromBlockchain,
  className = '',
}) => {
  const { isConnected } = useAccount();
  const { updateLevels, isPending, error, isSuccess, progress, reset, hash } = useSequentialUpdateLevels();
  const { progress: onChainProgress, isLoading: isLoadingBlockchain, refetch } = useLoadBlockchainProgress();
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState<string | null>(null);
  const [savedHash, setSavedHash] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Get only unsaved levels (compare with blockchain)
  const levelsToSave = useMemo(() => {
    const unsaved = getUnsavedLevels(progressData, onChainProgress);
    
    console.log('[SaveAllProgressButton] Checking unsaved levels:', {
      localLevels: Array.from(progressData.levelStars.entries()),
      blockchainLevels: onChainProgress ? Array.from(onChainProgress.levelStars.entries()) : 'null',
      unsavedCount: unsaved.count,
      unsavedLevels: unsaved.levels,
    });
    
    return unsaved;
  }, [progressData, onChainProgress]);

  // Check if blockchain has more progress
  const blockchainHasMore = useMemo(() => {
    return hasMoreProgressOnBlockchain(progressData, onChainProgress);
  }, [progressData, onChainProgress]);

  if (!isConnected) {
    return null;
  }

  // Hide button if loading blockchain data
  if (isLoadingBlockchain) {
    return (
      <div className={`save-all-progress-container ${className}`}>
        <p className="save-all-info">
          🔄 Checking blockchain progress...
        </p>
      </div>
    );
  }

  // Hide button if no progress to save (all synced!)
  if (levelsToSave.count === 0 && !blockchainHasMore) {
    return (
      <div className={`save-all-progress-container ${className}`}>
        <div className="save-all-success-message">
          ✅ All progress synced to blockchain!
        </div>
      </div>
    );
  }

  // Show "Load from blockchain" button if blockchain has more progress
  if (blockchainHasMore && levelsToSave.count === 0) {
    return (
      <div className={`save-all-progress-container ${className}`}>
        <button
          onClick={onLoadFromBlockchain}
          className="save-all-progress-button load-button"
          title="Load progress from blockchain"
        >
          📥 Load from Blockchain
        </button>
        <p className="save-all-info">
          ⚠️ Blockchain has more progress than local
        </p>
      </div>
    );
  }

  const handleSave = () => {
    console.log('[SaveAllProgressButton] ========== SAVE BUTTON CLICKED ==========');
    console.log('[SaveAllProgressButton] levelsToSave:', levelsToSave);
    console.log('[SaveAllProgressButton] isConnected:', isConnected);
    console.log('[SaveAllProgressButton] Contract address:', getContractAddress());
    
    setIsSaving(true);
    setShowSuccess(false);
    setShowError(null);
    reset();
    
    try {
      console.log('[SaveAllProgressButton] Calling updateLevels with:', {
        levels: levelsToSave.levels,
        stars: levelsToSave.stars,
        count: levelsToSave.count
      });
      
      updateLevels(levelsToSave.levels, levelsToSave.stars);
      
      console.log('[SaveAllProgressButton] ✅ updateLevels called successfully');
    } catch (err) {
      console.error('[SaveAllProgressButton] ❌ Failed to save progress:', err);
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
    if (isSuccess && !isPending && hash && !isVerifying) {
      console.log('[SaveAllProgressButton] ✅ Transaction confirmed on blockchain');
      console.log('[SaveAllProgressButton] Transaction/UserOp ID:', hash);
      console.log('[SaveAllProgressButton] View on BaseScan:', `https://basescan.org/tx/${hash}`);
      
      setShowSuccess(true);
      setShowError(null);
      setIsSaving(false);
      setSavedHash(hash);
      setIsVerifying(true);
      
      // Wait for blockchain to update, then refetch and verify
      const verifyTimer = setTimeout(async () => {
        console.log('[SaveAllProgressButton] Refetching blockchain progress...');
        await refetch();
        
        // After refetch, component will re-render and check levelsToSave
        // If levelsToSave.count === 0, it will show "All progress synced"
        console.log('[SaveAllProgressButton] Blockchain data refreshed');
      }, 3000);
      
      onSuccess?.();
      
      return () => clearTimeout(verifyTimer);
    }
  }, [isSuccess, isPending, hash, onSuccess, refetch, isVerifying]);

  // Handle error - but ignore if we're verifying (transaction was successful)
  useEffect(() => {
    if (error && !error.includes('wallet_getCapabilities') && !error.includes('wallet_sendCalls') && !isVerifying) {
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
  }, [error, onError, isVerifying]);

  const isLoading = isSaving || isPending || isVerifying;

  return (
    <div className={`save-all-progress-container ${className}`}>
      <button
        onClick={handleSave}
        disabled={isLoading || showSuccess}
        className={`save-all-progress-button ${showSuccess ? 'success' : ''}`}
        title={`Save ${levelsToSave.count} level${levelsToSave.count > 1 ? 's' : ''} to blockchain (you pay gas)`}
      >
        {isLoading ? (
          <>
            <span className="save-all-spinner"></span>
            {progress.total > 0 
              ? `Saving ${progress.current}/${progress.total}...` 
              : 'Saving...'}
          </>
        ) : showSuccess ? (
          <>✓ All Saved!</>
        ) : (
          <>
            💾 Save to Blockchain ({levelsToSave.count})
          </>
        )}
      </button>

      {showError && (
        <p className="save-all-error">
          ⚠️ {showError}
        </p>
      )}

      <p className="save-all-info">
        ⚡ You will pay gas • Saves {levelsToSave.count} level{levelsToSave.count > 1 ? 's' : ''}
      </p>
    </div>
  );
};
