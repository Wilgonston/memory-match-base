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
  const { updateLevels, isPending, error, isSuccess, progress, reset } = useSequentialUpdateLevels();
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState<string | null>(null);

  if (!isConnected) {
    return null;
  }

  const completedCount = progressData.completedLevels.size;

  if (completedCount === 0) {
    return null;
  }

  const handleSave = async () => {
    setIsSaving(true);
    setShowSuccess(false);
    setShowError(null);
    reset(); // Reset previous state
    
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
        setShowError('Transaction cancelled');
      } else if (errorMessage.includes('insufficient funds')) {
        setShowError('Insufficient funds for gas');
      } else if (!errorMessage.includes('wallet_getCapabilities') && 
                 !errorMessage.includes('wallet_sendCalls')) {
        setShowError('Transaction failed. Please try again.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Handle success
  useEffect(() => {
    if (isSuccess && !isSaving && !isPending) {
      console.log('[SaveAllProgressButton] Transaction confirmed successfully');
      setShowSuccess(true);
      setShowError(null);
      onSuccess?.();
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
    }
  }, [isSuccess, isSaving, isPending, onSuccess]);

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
      onError?.(errorMsg);
    }
  }, [error, onError]);

  const isLoading = isSaving || isPending;

  return (
    <div className={`save-all-progress-container ${className}`}>
      <button
        onClick={handleSave}
        disabled={isLoading || showSuccess}
        className={`save-all-progress-button ${showSuccess ? 'success' : ''}`}
        title={`Save ${completedCount} completed level${completedCount > 1 ? 's' : ''} to blockchain`}
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
            💾 Save to Blockchain ({completedCount})
          </>
        )}
      </button>

      {showError && (
        <p className="save-all-error">
          ⚠️ {showError}
        </p>
      )}

      <p className="save-all-info">
        ⚡ You will pay gas • Saves all {completedCount} completed level{completedCount > 1 ? 's' : ''}
      </p>
    </div>
  );
};
