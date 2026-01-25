/**
 * IdentityDisplay Component
 * 
 * Displays user identity with Basename support using OnchainKit.
 * Shows avatar, name (Basename or address), and optional address/badge.
 * 
 * Features:
 * - Automatic Basename resolution
 * - Avatar display (from Basename or generated)
 * - Name display with verification badge
 * - Optional address display with copy functionality
 * - Supports both connected and external addresses
 */

import {
  Identity,
  Avatar,
  Name,
  Address,
  Badge,
} from '@coinbase/onchainkit/identity';
import { useAccount } from 'wagmi';
import { base } from 'wagmi/chains';

export interface IdentityDisplayProps {
  /** Address to display (uses connected address if not provided) */
  address?: string;
  /** Additional CSS classes */
  className?: string;
  /** Whether to show verification badge */
  showBadge?: boolean;
  /** Whether to show address */
  showAddress?: boolean;
  /** Whether address should be copyable */
  hasCopyAddressOnClick?: boolean;
}

/**
 * IdentityDisplay component
 * 
 * Displays user identity with Basename support.
 * Automatically resolves Basename and shows avatar.
 * 
 * @example
 * ```tsx
 * // Display connected user
 * <IdentityDisplay />
 * 
 * // Display specific address
 * <IdentityDisplay address="0x..." />
 * 
 * // Display with all features
 * <IdentityDisplay 
 *   address="0x..."
 *   showBadge={true}
 *   showAddress={true}
 *   hasCopyAddressOnClick={true}
 * />
 * ```
 */
export function IdentityDisplay({
  address: propAddress,
  className = '',
  showBadge = true,
  showAddress = true,
  hasCopyAddressOnClick = false,
}: IdentityDisplayProps) {
  const { address: connectedAddress } = useAccount();
  const address = propAddress || connectedAddress;

  // Don't render if no address
  if (!address) {
    return null;
  }

  return (
    <Identity
      address={address as `0x${string}`}
      chain={base}
      className={className}
      hasCopyAddressOnClick={hasCopyAddressOnClick}
    >
      <Avatar />
      <Name>
        {showBadge && <Badge />}
      </Name>
      {showAddress && <Address />}
    </Identity>
  );
}
