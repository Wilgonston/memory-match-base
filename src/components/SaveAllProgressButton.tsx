/**
 * SaveAllProgressButton Component
 * 
 * Button to save all completed levels to blockchain in a single batch transaction
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { useSequentialUpdateLevels } from '../hooks/useSequentialUpdateLevels';
import { useLoadBlockchainProgress } from '../hooks/useLoadBlockchainProgress';
import { getContractAddress, type OnChainProgress } from '../types/blockchain';
import { ProgressData } from '../types';
import { getUnsavedLevels } from '../utils/unsavedProgress';
import { isSmartWallet } from '../utils/walletDetection';
import { getUserFriendlyError, shouldDisplayError, TIMEOUTS } from '../utils/errorMessages';
import { TransactionNotification } from './TransactionNotification';
import './SaveAllProgressButton.css';

export interface SaveAllProgressButtonProps {
  progressData: ProgressData;
  blockchainProgress?: OnChainProgress | null;
  onRefetchBlockchain?: () => Promise<void>;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
}

export const SaveAllProgressButton: React.FC<SaveAllProgressButtonProps> = ({
  progressData,
  blockchainProgress: externalBlockchainProgress,
  onRefetchBlockchain,
  onSuccess,
  onError,
  className = '',
}) => {
  const { isConnected, connector } = useAccount();
  const { updateLevels, isPending, error, isSuccess, progress, reset, hash } = useSequentialUpdateLevels();
  const { progress: onChainProgress, isLoading: isLoadingBlockchain, refetch } = useLoadBlockchainProgress({ autoLoad: false });
  const [isSaving, setIsSaving] = useState(false);
  
  // Use external blockchain progress if provided, otherwise use internal
  const blockchainProgress = externalBlockchainProgress !== undefined ? externalBlockchainProgress : onChainProgress;
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState<string | null>(null);
  const [savedHash, setSavedHash] = useState<string | null>(null);
  const [showNotification, setShowNotification] = useState(false);

  // Determine if this is a Smart Wallet
  const isSmartWalletConnected = isSmartWallet(connector?.id);

  // Get only unsaved levels (compare with blockchain)
  const levelsToSave = useMemo(() => {
    // Don't calculate if still loading
    if (isLoadingBlockchain) {
      return { levels: [], stars: [], count: 0 };
    }
    
    const unsaved = getUnsavedLevels(progressData, blockchainProgress);
    
    console.log('[SaveAllProgressButton] Checking unsaved levels:', {
      localLevels: Array.from(progressData.levelStars.entries()),
      blockchainLevels: blockchainProgress ? Array.from(blockchainProgress.levelStars.entries()) : 'null',
      unsavedCount: unsaved.count,
      unsavedLevels: unsaved.levels,
    });
    
    return unsaved;
  }, [progressData, blockchainProgress, isLoadingBlockchain]);

  if (!isConnected) {
    return null;
  }

  // Hide button if loading blockchain data OR if blockchain data hasn't loaded yet
  if (isLoadingBlockchain || (!blockchainProgress && !isLoadingBlockchain && externalBlockchainProgress === undefined)) {
    return (
      <div className={`save-all-progress-container ${className}`}>
        <p className="save-all-info">
          🔄 Checking blockchain progress...
        </p>
      </div>
    );
  }

  // Hide button if no progress to save (all synced!)
  if (levelsToSave.count === 0) {
    return (
      <div className={`save-all-progress-container ${className}`}>
        <div className="save-all-success-message">
          ✅ All progress synced to blockchain!
        </div>
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
      
      const friendlyError = getUserFriendlyError(errorMessage);
      if (friendlyError) {
        setShowError(friendlyError);
      }
      setIsSaving(false);
    }
  };

  // Handle success - only when transaction is confirmed on blockchain
  useEffect(() => {
    if (isSuccess && !isPending && hash) {
      console.log('[SaveAllProgressButton] ✅ Transaction confirmed on blockchain');
      console.log('[SaveAllProgressButton] Transaction/UserOp ID:', hash);
      console.log('[SaveAllProgressButton] View on BaseScan:', `https://basescan.org/tx/${hash}`);
      
      setShowSuccess(true);
      setShowError(null);
      setIsSaving(false);
      setSavedHash(hash);
      setShowNotification(true); // Show notification
      
      // Wait for blockchain to update, then refetch (this will show LoadingIndicator in App)
      const verifyTimer = setTimeout(async () => {
        console.log('[SaveAllProgressButton] Refetching blockchain progress...');
        console.log('[SaveAllProgressButton] onRefetchBlockchain available:', !!onRefetchBlockchain);
        
        try {
          // Use external refetch if provided, otherwise use internal
          if (onRefetchBlockchain) {
            console.log('[SaveAllProgressButton] Calling external refetch (will show LoadingIndicator)...');
            await onRefetchBlockchain();
          } else {
            console.log('[SaveAllProgressButton] Calling internal refetch...');
            await refetch();
          }
          
          console.log('[SaveAllProgressButton] Blockchain data refreshed');
        } catch (error) {
          console.error('[SaveAllProgressButton] Failed to refetch:', error);
        }
      }, TIMEOUTS.VERIFY_DELAY);
      
      onSuccess?.();
      
      return () => {
        clearTimeout(verifyTimer);
      };
    }
    // IMPORTANT: Do NOT include onSuccess, onRefetchBlockchain, refetch in dependencies
    // They are functions that change on every render and cause infinite loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess, isPending, hash]);

  // Handle error - but ignore if we're verifying (transaction was successful)
  useEffect(() => {
    if (error && shouldDisplayError(error)) {
      const errorMsg = getUserFriendlyError(error);
      if (errorMsg) {
        setShowError(errorMsg);
        setShowSuccess(false);
        setIsSaving(false);
        onError?.(errorMsg);
      }
    }
    // IMPORTANT: Do NOT include onError in dependencies - it causes infinite loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  const isLoading = isSaving || isPending;

  return (
    <div className={`save-all-progress-container ${className}`}>
      <button
        onClick={handleSave}
        disabled={isLoading || showSuccess}
        className={`save-all-progress-button ${showSuccess ? 'success' : ''}`}
        title={`Save ${levelsToSave.count} level${levelsToSave.count > 1 ? 's' : ''} to blockchain`}
      >
        {showSuccess ? (
          <>✓ All Saved!</>
        ) : isLoading ? (
          <>
            <span className="save-all-spinner"></span>
            {progress.total > 0 && progress.current > 0
              ? `Saving ${progress.current}/${progress.total}...` 
              : progress.total > 0
              ? 'Waiting for signature...'
              : 'Saving...'}
          </>
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
        {isSmartWalletConnected 
          ? `⚡ Gas-free transaction • Saves ${levelsToSave.count} level${levelsToSave.count > 1 ? 's' : ''}`
          : `⚡ You will pay gas • Saves ${levelsToSave.count} level${levelsToSave.count > 1 ? 's' : ''}`}
      </p>

      {/* Transaction notification */}
      {showNotification && savedHash && (
        <TransactionNotification
          hash={savedHash}
          status="confirmed"
          network="mainnet"
          onDismiss={() => setShowNotification(false)}
          autoDismissDelay={TIMEOUTS.AUTO_DISMISS}
        />
      )}
    </div>
  );
};
