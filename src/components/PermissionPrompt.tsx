/**
 * PermissionPrompt Component
 * 
 * Prompts user to grant permission for automatic blockchain sync
 */

import { useSpendPermission } from '../hooks/useSpendPermission';
import './PermissionPrompt.css';

interface PermissionPromptProps {
  onGranted?: () => void;
  onSkip?: () => void;
}

export function PermissionPrompt({ onGranted, onSkip }: PermissionPromptProps) {
  const { isGranted, requestPermission, isPending, error } = useSpendPermission();

  if (isGranted) {
    return null;
  }

  const handleGrant = async () => {
    await requestPermission();
    onGranted?.();
  };

  return (
    <div className="permission-prompt-overlay">
      <div className="permission-prompt">
        <div className="permission-icon">🔐</div>
        
        <h2 className="permission-title">
          Enable Automatic Progress Sync?
        </h2>
        
        <p className="permission-description">
          Grant permission to automatically save your progress to the blockchain after each level.
        </p>
        
        <div className="permission-benefits">
          <div className="permission-benefit">
            <span className="benefit-icon">✅</span>
            <span>No gas fees (sponsored by Paymaster)</span>
          </div>
          <div className="permission-benefit">
            <span className="benefit-icon">⚡</span>
            <span>Automatic sync after each level</span>
          </div>
          <div className="permission-benefit">
            <span className="benefit-icon">🔒</span>
            <span>Secure and revocable anytime</span>
          </div>
        </div>

        {error && (
          <div className="permission-error">
            {error}
          </div>
        )}
        
        <div className="permission-actions">
          <button
            onClick={handleGrant}
            disabled={isPending}
            className="permission-button permission-button-primary"
          >
            {isPending ? 'Requesting...' : 'Grant Permission'}
          </button>
          
          <button
            onClick={onSkip}
            className="permission-button permission-button-secondary"
          >
            Skip (Manual Sync)
          </button>
        </div>
        
        <p className="permission-note">
          You'll need to approve transactions in your wallet, but gas is always free.
        </p>
      </div>
    </div>
  );
}
