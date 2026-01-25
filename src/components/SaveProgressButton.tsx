/**
 * SaveProgressButton Component
 * 
 * Button for saving game progress to blockchain.
 * Uses OnchainKit's Transaction components for seamless UX.
 * 
 * Requirements: 17.5, 17.6, 17.7, 21.1, 21.2, 21.3, 21.4, 21.5, 21.6, 21.7
 */

import React from 'react';
import { useAccount } from 'wagmi';
import { useUpdateLevel } from '../hooks/useUpdateLevel';
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
 * Displays a button to save progress to blockchain.
 * Shows loading state during transaction and success/error messages.
 * Only visible when wallet is connected.
 */
export const SaveProgressButton: React.FC<SaveProgressButtonProps> = ({
  level,
  stars,
  onSuccess,
  onError,
  className = '',
}) => {
  const { isConnected } = useAccount();
  const { updateLevel, status, error, isPending, reset } = useUpdateLevel();

  // Don't render if wallet not connected
  if (!isConnected) {
    return null;
  }

  const handleSave = async () => {
    try {
      await updateLevel(level, stars);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to save progress';
      if (onError) {
        onError(errorMsg);
      }
    }
  };

  const handleRetry = () => {
    reset();
    handleSave();
  };

  return (
    <div className={`save-progress-button-container ${className}`}>
      {status === 'idle' && (
        <button
          onClick={handleSave}
          className="save-progress-button"
          disabled={isPending}
        >
          Save to Blockchain
        </button>
      )}

      {status === 'pending' && (
        <div className="save-progress-status saving">
          <div className="spinner" />
          <span>Saving to blockchain...</span>
        </div>
      )}

      {status === 'success' && (
        <div className="save-progress-status success">
          <span className="success-icon">✓</span>
          <span>Progress saved!</span>
        </div>
      )}

      {status === 'error' && (
        <div className="save-progress-status error">
          <span className="error-icon">✗</span>
          <span>Failed: {error}</span>
          <button onClick={handleRetry} className="retry-button">
            Retry
          </button>
        </div>
      )}
    </div>
  );
};
