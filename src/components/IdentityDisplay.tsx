/**
 * IdentityDisplay Component
 * 
 * Displays user identity using OnchainKit's Identity components.
 * Shows Basename (if available) or truncated address with avatar.
 * Updates automatically when wallet changes.
 * 
 * Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6
 */

import React from 'react';
import { useAccount } from 'wagmi';
import {
  Identity,
  Avatar,
  Name,
  Address,
} from '@coinbase/onchainkit/identity';
import './IdentityDisplay.css';

/**
 * IdentityDisplay component props
 */
export interface IdentityDisplayProps {
  /**
   * Optional CSS class name for styling
   */
  className?: string;
}

/**
 * IdentityDisplay component
 * 
 * Displays the connected wallet's identity using OnchainKit components.
 * Shows avatar, Basename (or truncated address), and full address on hover.
 * 
 * Features:
 * - Displays Basename if available (e.g., "alice.base.eth")
 * - Falls back to truncated address if no Basename (e.g., "0x1234...5678")
 * - Shows avatar from Basename or generated from address
 * - Tooltip shows full address on hover
 * - Updates automatically when wallet changes
 * - Returns null when no wallet is connected
 * 
 * @example
 * ```tsx
 * <IdentityDisplay className="my-custom-class" />
 * ```
 */
export const IdentityDisplay: React.FC<IdentityDisplayProps> = ({ className = '' }) => {
  const { address, isConnected } = useAccount();

  // Don't render if no wallet is connected
  if (!isConnected || !address) {
    return null;
  }

  return (
    <div className={`identity-display ${className}`}>
      <Identity
        address={address}
        className="identity-container"
        hasCopyAddressOnClick
      >
        <Avatar className="identity-avatar" />
        <Name className="identity-name" />
        <Address className="identity-address" />
      </Identity>
    </div>
  );
};
