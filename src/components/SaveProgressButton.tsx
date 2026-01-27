import React, { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Address } from 'viem';
import { getContractAddress, MEMORY_MATCH_PROGRESS_ABI } from '../types/blockchain';
import { playSound } from '../utils/soundManager';
import './SaveProgressButton.css';

export interface SaveProgressButtonProps {
  level: number;
  stars: number;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
}

export const SaveProgressButton: React.FC<SaveProgressButtonProps> = ({
  level,
  stars,
  onSuccess,
  onError,
  className = '',
}) => {
  const { address, isConnected } = useAccount();
  const contractAddress = getContractAddress();
  const [isSaving, setIsSaving] = useState(false);

  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  if (!isConnected || !address) {
    return null;
  }

  const handleSave = async () => {
    try {
      setIsSaving(true);
      console.log('[SaveProgressButton] Saving level', level, 'with', stars, 'stars');
      
      playSound('transaction-submitted');
      
      writeContract({
        address: contractAddress as Address,
        abi: MEMORY_MATCH_PROGRESS_ABI,
        functionName: 'update',
        args: [level, stars],
      });
    } catch (err) {
      console.error('[SaveProgressButton] Transaction error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Transaction failed';
      
      // User-friendly error messages
      if (errorMessage.includes('User rejected') || errorMessage.includes('User denied')) {
        onError?.('Transaction cancelled');
      } else if (errorMessage.includes('insufficient funds')) {
        onError?.('Insufficient funds for gas');
      } else if (!errorMessage.includes('wallet_getCapabilities') && 
                 !errorMessage.includes('wallet_sendCalls')) {
        onError?.('Transaction failed. Please try again.');
      }
      
      setIsSaving(false);
    }
  };

  // Handle transaction success
  React.useEffect(() => {
    if (isSuccess) {
      console.log('[SaveProgressButton] Transaction confirmed!');
      playSound('transaction-confirmed');
      onSuccess?.();
      setIsSaving(false);
    }
  }, [isSuccess, onSuccess]);

  // Handle transaction error
  React.useEffect(() => {
    if (writeError) {
      console.error('[SaveProgressButton] Write error:', writeError);
      const errorMessage = writeError.message || 'Transaction failed';
      
      // User-friendly error messages
      if (errorMessage.includes('User rejected') || errorMessage.includes('User denied')) {
        onError?.('Transaction cancelled');
      } else if (errorMessage.includes('insufficient funds')) {
        onError?.('Insufficient funds for gas');
      } else if (!errorMessage.includes('wallet_getCapabilities') && 
                 !errorMessage.includes('wallet_sendCalls')) {
        onError?.('Transaction failed. Please try again.');
      }
      
      setIsSaving(false);
    }
  }, [writeError, onError]);

  const isLoading = isPending || isConfirming || isSaving;

  return (
    <div className={`save-progress-button-container ${className}`}>
      <button
        onClick={handleSave}
        disabled={isLoading || isSuccess}
        className="save-progress-button"
        title="Save progress to blockchain"
      >
        {isLoading ? (
          <>
            <span className="save-progress-spinner"></span>
            {isConfirming ? 'Confirming...' : 'Saving...'}
          </>
        ) : isSuccess ? (
          <>✓ Saved!</>
        ) : (
          'Save to Blockchain'
        )}
      </button>

      {writeError && !writeError.message.includes('wallet_getCapabilities') && !writeError.message.includes('wallet_sendCalls') && (
        <p className="save-progress-error">
          ⚠️ {writeError.message.includes('User rejected') || writeError.message.includes('User denied')
            ? 'Transaction cancelled'
            : writeError.message.includes('insufficient funds')
            ? 'Insufficient funds for gas'
            : 'Transaction failed. Please try again.'}
        </p>
      )}

      <p className="gas-free-info">
        ⚡ You will pay gas for this transaction
      </p>
    </div>
  );
};

