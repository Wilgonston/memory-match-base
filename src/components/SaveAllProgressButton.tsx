/**
 * SaveAllProgressButton Component
 * 
 * Button to save all completed levels to blockchain in a single batch transaction
 */

import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { useBatchUpdateLevels } from '../hooks/useBatchUpdateLevels';
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
  const { batchUpdate, isPending, error, hasPaymaster } = useBatchUpdateLevels();
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
      
      await batchUpdate(levels, stars);
      console.log('[SaveAllProgressButton] All progress saved successfully!');
      onSuccess?.();
    } catch (err) {
      console.error('[SaveAllProgressButton] Failed to save progress:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to save progress';
      
      // Don't show error if it's just a Paymaster capability check
      if (!errorMessage.includes('wallet_getCapabilities')) {
        onError?.(errorMessage);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={`save-all-progress-container ${className}`}>
      <button
        onClick={handleSave}
        disabled={isSaving || isPending}
        className="save-all-progress-button"
        title={`Save ${completedCount} completed level${completedCount > 1 ? 's' : ''} to blockchain`}
      >
        {isSaving || isPending ? (
          <>
            <span className="save-all-spinner"></span>
            Saving...
          </>
        ) : (
          <>
            💾 Save to Blockchain ({completedCount})
          </>
        )}
      </button>

      {error && !error.includes('wallet_getCapabilities') && (
        <p className="save-all-error">
          ⚠️ {error}
        </p>
      )}

      <p className="save-all-info">
        {hasPaymaster 
          ? `✨ Gas-free • Saves all ${completedCount} completed level${completedCount > 1 ? 's' : ''}`
          : `⚡ You will pay gas • Saves all ${completedCount} completed level${completedCount > 1 ? 's' : ''}`}
      </p>
    </div>
  );
};
