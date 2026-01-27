import { useAccount } from 'wagmi';
import {
  Identity,
  Avatar,
  Name,
  Address,
  EthBalance,
} from '@coinbase/onchainkit/identity';
import './IdentityDisplay.css';

export interface IdentityDisplayProps {
  showBalance?: boolean;
  hasCopyAddressOnClick?: boolean;
  className?: string;
}

export function IdentityDisplay({
  showBalance = true,
  hasCopyAddressOnClick = true,
  className = '',
}: IdentityDisplayProps) {
  const { address } = useAccount();

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
          <Name className="identity-name" />
          <Address className="identity-address" />
          {showBalance && <EthBalance className="identity-balance" />}
        </div>
      </Identity>
    </div>
  );
}
