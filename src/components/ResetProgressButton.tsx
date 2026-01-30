/**
 * ResetProgressButton Component
 * 
 * Button to reset local progress only
 * Note: Blockchain data cannot be reset because the smart contract
 * only allows increasing stars, not decreasing them.
 */

import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import './ResetProgressButton.css';

export interface ResetProgressButtonProps {
  onResetLocal: () => void;
  onRefetchBlockchain?: () => Promise<void>;
  onSuccess?: () => void;
  className?: string;
}

export const ResetProgressButton: React.FC<ResetProgressButtonProps> = ({
  onResetLocal,
  onRefetchBlockchain,
  onSuccess,
  className = '',
}) => {
  const { isConnected } = useAccount();
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  if (!isConnected) {
    return null;
  }

  const handleReset = () => {
    console.log('[ResetProgressButton] Starting reset process...');
    setShowSuccess(false);
    setShowConfirm(false);
    
    // Reset only local storage - blockchain data cannot be decreased
    // The smart contract only allows increasing stars, not decreasing them
    console.log('[ResetProgressButton] Resetting local storage only...');
    onResetLocal();
    
    // Show success immediately (no blockchain transaction needed)
    setShowSuccess(true);
    
    // Refetch blockchain data to show the difference
    setTimeout(async () => {
      console.log('[ResetProgressButton] Refetching blockchain progress...');
      
      try {
        if (onRefetchBlockchain) {
          await onRefetchBlockchain();
        }
        
        console.log('[ResetProgressButton] ✅ Local progress reset complete');
      } catch (error) {
        console.error('[ResetProgressButton] Failed to refetch:', error);
      }
    }, 500);
    
    onSuccess?.();
  };

  return (
    <div className={`reset-progress-container ${className}`}>
      {!showConfirm ? (
        <button
          onClick={() => setShowConfirm(true)}
          className="reset-progress-button"
        >
          🗑️ Reset Local Progress
        </button>
      ) : (
        <div className="reset-confirm-dialog">
          <p className="reset-warning">⚠️ Are you sure?</p>
          <p className="reset-description">
            This will reset your LOCAL progress only.
            Your blockchain progress will remain unchanged.
          </p>
          <div className="reset-actions">
            <button
              onClick={handleReset}
              className="reset-confirm-button"
            >
              {showSuccess ? (
                <>✓ Reset Complete!</>
              ) : (
                <>Yes, Reset Local Progress</>
              )}
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              className="reset-cancel-button"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
