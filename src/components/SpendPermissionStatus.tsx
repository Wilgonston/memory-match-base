/**
 * SpendPermissionStatus Component
 * 
 * Displays current spend permission status and provides controls
 * to request, update, or revoke permissions.
 * 
 * Requirements: 7.3, 7.6
 */

import React from 'react';
import { useSpendPermissions } from '../hooks/useSpendPermissions';
import { formatUnits } from 'viem';
import './SpendPermissionStatus.css';

export interface SpendPermissionStatusProps {
  /** Optional CSS class */
  className?: string;
}

/**
 * SpendPermissionStatus component
 * 
 * Shows permission status and allows user to manage permissions
 */
export const SpendPermissionStatus: React.FC<SpendPermissionStatusProps> = ({
  className = '',
}) => {
  const {
    permission,
    isLoading,
    error,
    requestPermission,
    revokePermission,
    updateAllowance,
  } = useSpendPermissions();

  const handleRequestPermission = async () => {
    try {
      // Request permission for 1 ETH for 30 days
      await requestPermission(1000000000000000000n, 30 * 24 * 60 * 60);
    } catch (err) {
      console.error('Failed to request permission:', err);
    }
  };

  const handleIncreaseAllowance = async () => {
    if (!permission) return;

    try {
      // Double the current allowance
      const newAllowance = permission.allowance * 2n;
      await updateAllowance(newAllowance);
    } catch (err) {
      console.error('Failed to increase allowance:', err);
    }
  };

  const handleRevokePermission = async () => {
    try {
      await revokePermission();
    } catch (err) {
      console.error('Failed to revoke permission:', err);
    }
  };

  if (isLoading) {
    return (
      <div className={`spend-permission-status ${className}`}>
        <p className="status-loading">Loading permission status...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`spend-permission-status ${className}`}>
        <p className="status-error">Error: {error}</p>
      </div>
    );
  }

  if (!permission) {
    return (
      <div className={`spend-permission-status ${className}`}>
        <div className="status-no-permission">
          <p className="status-message">
            No spend permission set. Grant permission to enable automatic transactions.
          </p>
          <button
            className="btn-request-permission"
            onClick={handleRequestPermission}
            disabled={isLoading}
          >
            Grant Permission
          </button>
        </div>
      </div>
    );
  }

  // Check if permission is expired
  const now = Math.floor(Date.now() / 1000);
  const isExpired = now > permission.end;
  const isActive = now >= permission.start && now <= permission.end;

  return (
    <div className={`spend-permission-status ${className}`}>
      <div className="status-active">
        <h3 className="status-title">Spend Permission</h3>
        
        <div className="status-details">
          <div className="status-row">
            <span className="status-label">Allowance:</span>
            <span className="status-value">
              {formatUnits(permission.allowance, 18)} ETH
            </span>
          </div>

          <div className="status-row">
            <span className="status-label">Status:</span>
            <span className={`status-badge ${isExpired ? 'expired' : isActive ? 'active' : 'pending'}`}>
              {isExpired ? 'Expired' : isActive ? 'Active' : 'Pending'}
            </span>
          </div>

          <div className="status-row">
            <span className="status-label">Expires:</span>
            <span className="status-value">
              {new Date(permission.end * 1000).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="status-actions">
          <button
            className="btn-increase-allowance"
            onClick={handleIncreaseAllowance}
            disabled={isLoading || isExpired}
          >
            Increase Allowance
          </button>
          <button
            className="btn-revoke-permission"
            onClick={handleRevokePermission}
            disabled={isLoading}
          >
            Revoke Permission
          </button>
        </div>

        {isExpired && (
          <p className="status-warning">
            Permission has expired. Request a new permission to continue.
          </p>
        )}
      </div>
    </div>
  );
};
