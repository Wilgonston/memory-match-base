/**
 * IdentityDisplay Component
 * 
 * Displays user identity information with Basename resolution and display.
 * Shows avatar, name (Basename if available, otherwise address), and full address.
 * Includes copy-to-clipboard functionality and ETH balance display.
 * 
 * Requirements: 5.3, 5.4, 5.5, 5.6
 */

import { useAccount } from 'wagmi';
import {
  Identity,
  Avatar,
  Name,
  Address,
  EthBalance,
} from '@coinbase/onchainkit/identity';
import { useBasename } from '../hooks/useBasename';
import './IdentityDisplay.css';

export interface IdentityDisplayProps {
  /**
   * Whether to show the ETH balance
   * @default true
   */
  showBalance?: boolean;
  
  /**
   * Whether to enable copy address on click
   * @default true
   */
  hasCopyAddressOnClick?: boolean;
  
  /**
   * Additional CSS class name
   */
  className?: string;
}

/**
 * IdentityDisplay component that shows user identity with Basename support
 */
export function IdentityDisplay({
  showBalance = true,
  hasCopyAddressOnClick = true,
  className = '',
}: IdentityDisplayProps) {
  const { address } = useAccount();
  const { basename, isLoading: isLoadingBasename } = useBasename(address);

  if (!address) {
    return null;
  }

  return (
    <div className={`identity-display ${className}`}>
      <Identity
        address={address}
        className="identity-container"
        hasCopyAddressOnClick={hasCopyAddressOnClick}
      >
        <Avatar className="identity-avatar" />
        <div className="identity-info">
          <div className="identity-name-container">
            {isLoadingBasename ? (
              <span className="identity-name-loading">Loading...</span>
            ) : basename ? (
              <span className="identity-basename" title={`Basename: ${basename}`}>
                {basename}
              </span>
            ) : (
              <Name className="identity-name" />
            )}
          </div>
          <Address className="identity-address" />
          {showBalance && (
            <EthBalance className="identity-balance" />
          )}
        </div>
      </Identity>
    </div>
  );
}
