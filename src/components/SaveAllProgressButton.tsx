/**
 * SaveAllProgressButton Component
 * 
 * Button to save all completed levels to blockchain in a single batch transaction
 */

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useSequentialUpdateLevels } from '../hooks/useSequentialUpdateLevels';
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
  const { updateLevels, isPending, error, isSuccess, progress } = useSequentialUpdateLevels();
  const [isSaving, setIsSaving] = useState(false);

  if (!isConnected) {
    return null;
  }

  const completedCount = progressData.completedLevels.size;

  if (completedCount === 0) {
    return null;
  }

  const handleSave = async () => {
    setIsSaving(true);
    try {
      console.log('[SaveAllProgressButton] Saving all progress to blockchain...');
      
      // Convert progressData to arrays
      const levels = Array.from(progressData.completedLevels).sort((a, b) => a - b);
      const stars = levels.map(level => progressData.levelStars.get(level) || 1);
      
      console.log('[SaveAllProgressButton] Levels:', levels);
      console.log('[SaveAllProgressButton] Stars:', stars);
      
      await updateLevels(levels, stars);
      console.log('[SaveAllProgressButton] All progress saved successfully!');
    } catch (err) {
      console.error('[SaveAllProgressButton] Failed to save progress:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to save progress';
      
      // User-friendly error messages
      if (errorMessage.includes('User rejected') || errorMessage.includes('User denied')) {
        onError?.('Transaction cancelled');
      } else if (errorMessage.includes('insufficient funds')) {
        onError?.('Insufficient funds for gas');
      } else if (!errorMessage.includes('wallet_getCapabilities') && 
                 !errorMessage.includes('wallet_sendCalls')) {
        onError?.('Transaction failed. Please try again.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Handle success
  useEffect(() => {
    if (isSuccess && !isSaving) {
      onSuccess?.();
    }
  }, [isSuccess, isSaving, onSuccess]);

  // Handle error
  useEffect(() => {
    if (error && !error.includes('wallet_getCapabilities') && !error.includes('wallet_sendCalls')) {
      // User-friendly error messages
      if (error.includes('User rejected') || error.includes('User denied')) {
        onError?.('Transaction cancelled');
      } else if (error.includes('insufficient funds')) {
        onError?.('Insufficient funds for gas');
      } else {
        onError?.('Transaction failed. Please try again.');
      }
    }
  }, [error, onError]);

  const isLoading = isSaving || isPending;

  return (
    <div className={`save-all-progress-container ${className}`}>
      <button
        onClick={handleSave}
        disabled={isLoading || isSuccess}
        className="save-all-progress-button"
        title={`Save ${completedCount} completed level${completedCount > 1 ? 's' : ''} to blockchain`}
      >
        {isLoading ? (
          <>
            <span className="save-all-spinner"></span>
            {progress.total > 0 
              ? `Saving ${progress.current}/${progress.total}...` 
              : 'Saving...'}
          </>
        ) : isSuccess ? (
          <>✓ All Saved!</>
        ) : (
          <>
            💾 Save to Blockchain ({completedCount})
          </>
        )}
      </button>

      {error && !error.includes('wallet_getCapabilities') && !error.includes('wallet_sendCalls') && (
        <p className="save-all-error">
          ⚠️ {error.includes('User rejected') || error.includes('User denied')
            ? 'Transaction cancelled'
            : error.includes('insufficient funds')
            ? 'Insufficient funds for gas'
            : 'Transaction failed. Please try again.'}
        </p>
      )}

      <p className="save-all-info">
        ⚡ You will pay gas • Saves all {completedCount} completed level{completedCount > 1 ? 's' : ''}
      </p>
    </div>
  );
};
