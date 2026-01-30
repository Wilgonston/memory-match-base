/**
 * ResetProgressButton Component
 * 
 * Button to reset all progress (local and blockchain)
 */

import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { useSequentialUpdateLevels } from '../hooks/useSequentialUpdateLevels';
import { getUserFriendlyError, shouldDisplayError, TIMEOUTS } from '../utils/errorMessages';
import { TransactionNotification } from './TransactionNotification';
import './ResetProgressButton.css';

export interface ResetProgressButtonProps {
  onResetLocal: () => void;
  onRefetchBlockchain?: () => Promise<void>;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
}

export const ResetProgressButton: React.FC<ResetProgressButtonProps> = ({
  onResetLocal,
  onRefetchBlockchain,
  onSuccess,
  onError,
  className = '',
}) => {
  const { isConnected } = useAccount();
  const { updateLevels, isPending, error, isSuccess, reset, hash } = useSequentialUpdateLevels();
  const [isResetting, setIsResetting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState<string | null>(null);
  const [savedHash, setSavedHash] = useState<string | null>(null);
  const [showNotification, setShowNotification] = useState(false);

  if (!isConnected) {
    return null;
  }

  const handleReset = () => {
    console.log('[ResetProgressButton] Starting reset process...');
    setIsResetting(true);
    setShowSuccess(false);
    setShowError(null);
    setShowConfirm(false);
    reset();
    
    // Reset all 100 levels to 1 star (minimum allowed by contract)
    // Note: Contract requires stars to be 1-3, cannot use 0
    const levels = Array.from({ length: 100 }, (_, i) => i + 1);
    const stars = Array(100).fill(1); // Changed from 0 to 1
    
    console.log('[ResetProgressButton] Resetting 100 levels to 1 star (minimum)...');
    
    // Call updateLevels - errors will be handled by useEffect
    updateLevels(levels, stars);
    
    console.log('[ResetProgressButton] ✅ Reset transaction initiated');
  };

  // Handle success - only when transaction is confirmed on blockchain
  React.useEffect(() => {
    if (isSuccess && !isPending && hash) {
      console.log('[ResetProgressButton] ✅ Reset transaction confirmed on blockchain');
      console.log('[ResetProgressButton] Transaction/UserOp ID:', hash);
      
      setShowSuccess(true);
      setShowError(null);
      setIsResetting(false);
      setSavedHash(hash);
      setShowNotification(true);
      
      // Reset local storage
      console.log('[ResetProgressButton] Resetting local storage...');
      onResetLocal();
      
      // Wait for blockchain to update, then refetch
      const verifyTimer = setTimeout(async () => {
        console.log('[ResetProgressButton] Refetching blockchain progress...');
        
        try {
          if (onRefetchBlockchain) {
            await onRefetchBlockchain();
          }
          
          console.log('[ResetProgressButton] ✅ Progress reset complete');
        } catch (error) {
          console.error('[ResetProgressButton] Failed to refetch:', error);
        }
      }, TIMEOUTS.VERIFY_DELAY);
      
      onSuccess?.();
      
      return () => {
        clearTimeout(verifyTimer);
      };
    }
    // IMPORTANT: Do NOT include onResetLocal, onRefetchBlockchain, onSuccess in dependencies
    // They are functions that change on every render and cause infinite loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess, isPending, hash]);

  // Handle error
  React.useEffect(() => {
    if (error && shouldDisplayError(error)) {
      const errorMsg = getUserFriendlyError(error);
      if (errorMsg) {
        console.error('[ResetProgressButton] Error detected:', error);
        setShowError(errorMsg);
        setShowSuccess(false);
        setIsResetting(false);
        onError?.(errorMsg);
      }
    }
    // IMPORTANT: Do NOT include onError in dependencies - it causes infinite loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  const isLoading = isResetting || isPending;

  return (
    <div className={`reset-progress-container ${className}`}>
      {!showConfirm ? (
        <button
          onClick={() => setShowConfirm(true)}
          className="reset-progress-button"
          disabled={isLoading}
        >
          🗑️ Reset All Progress
        </button>
      ) : (
        <div className="reset-confirm-dialog">
          <p className="reset-warning">⚠️ Are you sure?</p>
          <p className="reset-description">
            This will reset ALL your progress (local and blockchain).
            This action cannot be undone!
          </p>
          <div className="reset-actions">
            <button
              onClick={handleReset}
              disabled={isLoading}
              className="reset-confirm-button"
            >
              {showSuccess ? (
                <>✓ Reset Complete!</>
              ) : isLoading ? (
                <>
                  <span className="reset-spinner"></span>
                  Resetting...
                </>
              ) : (
                <>Yes, Reset Everything</>
              )}
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              disabled={isLoading}
              className="reset-cancel-button"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showError && (
        <p className="reset-error">
          ⚠️ {showError}
        </p>
      )}

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
