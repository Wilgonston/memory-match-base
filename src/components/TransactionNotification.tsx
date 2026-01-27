/**
 * TransactionNotification Component
 * 
 * Displays notifications for blockchain transaction status.
 * Shows submitted, pending, confirmed, and failed states.
 * 
 * Features:
 * - Transaction status indicators
 * - Link to BaseScan for transaction details
 * - Dismissible notifications
 * - Auto-dismiss after success/failure
 * 
 * Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6
 */

import { useEffect, useState } from 'react';
import './TransactionNotification.css';

export type TransactionStatus = 'submitted' | 'pending' | 'confirmed' | 'failed';

export interface TransactionNotificationProps {
  /** Transaction hash */
  hash: string;
  /** Current status */
  status: TransactionStatus;
  /** Network (for BaseScan link) */
  network?: 'mainnet' | 'sepolia';
  /** Error message if failed */
  error?: string;
  /** Callback when dismissed */
  onDismiss?: () => void;
  /** Auto-dismiss after success (ms) */
  autoDismissDelay?: number;
}

/**
 * Generate BaseScan URL for transaction
 */
function getBaseScanUrl(hash: string, network: 'mainnet' | 'sepolia' = 'mainnet'): string {
  const baseUrl = network === 'mainnet' 
    ? 'https://basescan.org'
    : 'https://sepolia.basescan.org';
  return `${baseUrl}/tx/${hash}`;
}

/**
 * Get status icon and color
 */
function getStatusDisplay(status: TransactionStatus): { icon: string; color: string; label: string } {
  switch (status) {
    case 'submitted':
      return { icon: '📤', color: '#3182ce', label: 'Submitted' };
    case 'pending':
      return { icon: '⏳', color: '#ed8936', label: 'Pending' };
    case 'confirmed':
      return { icon: '✅', color: '#48bb78', label: 'Confirmed' };
    case 'failed':
      return { icon: '❌', color: '#f56565', label: 'Failed' };
  }
}

export function TransactionNotification({
  hash,
  status,
  network = 'mainnet',
  error,
  onDismiss,
  autoDismissDelay = 5000,
}: TransactionNotificationProps) {
  const [visible, setVisible] = useState(true);
  const { icon, color, label } = getStatusDisplay(status);
  const baseScanUrl = getBaseScanUrl(hash, network);

  // Auto-dismiss on success or failure
  useEffect(() => {
    if ((status === 'confirmed' || status === 'failed') && autoDismissDelay > 0) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, autoDismissDelay);

      return () => clearTimeout(timer);
    }
  }, [status, autoDismissDelay]);

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(() => {
      onDismiss?.();
    }, 300); // Wait for fade-out animation
  };

  if (!visible) {
    return null;
  }

  return (
    <div 
      className={`transaction-notification ${status}`}
      style={{ borderLeftColor: color }}
    >
      <div className="notification-icon">{icon}</div>
      
      <div className="notification-content">
        <div className="notification-header">
          <span className="notification-status" style={{ color }}>
            {label}
          </span>
          <button
            onClick={handleDismiss}
            className="notification-dismiss"
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
        
        <div className="notification-body">
          {status === 'submitted' && (
            <p>Transaction submitted to the network</p>
          )}
          {status === 'pending' && (
            <p>Waiting for confirmation...</p>
          )}
          {status === 'confirmed' && (
            <p>Transaction confirmed successfully!</p>
          )}
          {status === 'failed' && (
            <p>{error || 'Transaction failed'}</p>
          )}
        </div>
        
        <a
          href={baseScanUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="notification-link"
        >
          View on BaseScan →
        </a>
        
        <div className="notification-hash">
          {hash.slice(0, 10)}...{hash.slice(-8)}
        </div>
      </div>
    </div>
  );
}

/**
 * Container for multiple notifications
 */
export function TransactionNotificationContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="transaction-notification-container">
      {children}
    </div>
  );
}
