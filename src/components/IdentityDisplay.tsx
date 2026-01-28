import { useAccount } from 'wagmi';
import {
  Avatar,
  EthBalance,
} from '@coinbase/onchainkit/identity';
import { useBasename } from '../hooks/useBasename';
import './IdentityDisplay.css';

export interface IdentityDisplayProps {
  showBalance?: boolean;
  hasCopyAddressOnClick?: boolean;
  className?: string;
}

export function IdentityDisplay({
  showBalance = true,
  hasCopyAddressOnClick = false,
  className = '',
}: IdentityDisplayProps) {
  const { address } = useAccount();
  const { basename } = useBasename(address);

  if (!address) {
    return null;
  }

  return (
    <div className={`identity-display ${className}`}>
      <div className="identity-container">
        <Avatar address={address} className="identity-avatar" />
        <div className="identity-info">
          <span className="identity-name">{basename || 'User'}</span>
          {showBalance && <EthBalance address={address} className="identity-balance" />}
        </div>
      </div>
    </div>
  );
}
