import React from 'react';
import { useAccount } from 'wagmi';
import { getContractAddress, MEMORY_MATCH_PROGRESS_ABI } from '../types/blockchain';
import { useLoadBlockchainProgress } from '../hooks/useLoadBlockchainProgress';
import { usePaymasterTransaction } from '../hooks/usePaymasterTransaction';
import { playSound } from '../utils/soundManager';
import { isSmartWallet } from '../utils/walletDetection';
import { getUserFriendlyError, shouldDisplayError } from '../utils/errorMessages';
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
  const { address, isConnected, connector } = useAccount();
  const contractAddress = getContractAddress();
  const { progress: onChainProgress, isLoading: isLoadingBlockchain, refetch } = useLoadBlockchainProgress({ autoLoad: false });
  const [isVerifying, setIsVerifying] = React.useState(false);

  // Determine if this is a Smart Wallet
  const isSmartWalletConnected = isSmartWallet(connector?.id);

  // Use Paymaster transaction hook
  const {
    sendTransaction,
    isPending,
    isSuccess,
    error,
    hasPaymaster,
  } = usePaymasterTransaction({
    address: contractAddress,
    abi: MEMORY_MATCH_PROGRESS_ABI,
    functionName: 'update',
    args: [level, stars],
    onSuccess: async (hash) => {
      console.log('[SaveProgressButton] Transaction confirmed:', hash);
      playSound('transaction-confirmed');
      setIsVerifying(true);
      
      // Refetch blockchain progress to verify save
      const verifyAndRefetch = async () => {
        try {
          console.log('[SaveProgressButton] Waiting for blockchain to process transaction...');
          // Wait a bit for blockchain to process
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          console.log('[SaveProgressButton] Refetching blockchain progress...');
          await refetch();
          
          console.log('[SaveProgressButton] ✅ Blockchain data refreshed');
        } catch (error) {
          console.error('[SaveProgressButton] Failed to refetch:', error);
        } finally {
          setIsVerifying(false);
        }
      };
      
      verifyAndRefetch();
      onSuccess?.();
    },
    onError: (errorMsg) => {
      console.error('[SaveProgressButton] Transaction error:', errorMsg);
      
      const friendlyError = getUserFriendlyError(errorMsg);
      if (friendlyError) {
        onError?.(friendlyError);
      }
    },
  });

  if (!isConnected || !address) {
    return null;
  }

  // Check if this level is already saved on blockchain with same or better stars
  const blockchainStars = onChainProgress?.levelStars.get(level) || 0;
  const needsSaving = stars > blockchainStars;

  console.log('[SaveProgressButton] Level', level, '- Local:', stars, 'stars, Blockchain:', blockchainStars, 'stars, Needs saving:', needsSaving);

  // Hide button if already synced
  if (!isLoadingBlockchain && !needsSaving) {
    return (
      <div className={`save-progress-button-container ${className}`}>
        <div className="save-progress-synced">
          ✅ Synced to blockchain
        </div>
      </div>
    );
  }

  const handleSave = () => {
    console.log('[SaveProgressButton] Saving level', level, 'with', stars, 'stars');
    playSound('transaction-submitted');
    sendTransaction();
  };

  return (
    <div className={`save-progress-button-container ${className}`}>
      <button
        onClick={handleSave}
        disabled={isPending || isSuccess || isVerifying}
        className="save-progress-button"
        title={hasPaymaster ? "Save progress to blockchain (Gas-Free)" : "Save progress to blockchain"}
      >
        {isPending || isVerifying ? (
          <>
            <span className="save-progress-spinner"></span>
            {isVerifying ? 'Verifying...' : 'Saving...'}
          </>
        ) : isSuccess ? (
          <>✓ Saved!</>
        ) : (
          'Save to Blockchain'
        )}
      </button>

      {error && shouldDisplayError(error) && !isVerifying && (
        <p className="save-progress-error">
          ⚠️ {getUserFriendlyError(error)}
        </p>
      )}

      <p className="gas-free-info">
        {isSmartWalletConnected 
          ? '⚡ Gas-free transaction (sponsored)' 
          : '⚡ You will pay gas for this transaction'}
      </p>
    </div>
  );
};

