/**
 * NetworkBlocker Component
 * 
 * Blocks the entire UI if user is on wrong network
 * Forces switch to Base Mainnet
 */

import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { getChainId } from '../utils/network';
import './NetworkBlocker.css';

export function NetworkBlocker() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();
  const expectedChainId = getChainId();

  // Only show if connected and on wrong network
  if (!isConnected || chainId === expectedChainId) {
    return null;
  }

  const handleSwitch = () => {
    switchChain({ chainId: expectedChainId });
  };

  const networkName = expectedChainId === 8453 ? 'Base Mainnet' : 'Base Sepolia';
  const currentNetworkName = chainId === 137 ? 'Polygon' : 
                             chainId === 1 ? 'Ethereum' :
                             chainId === 8453 ? 'Base Mainnet' :
                             chainId === 84532 ? 'Base Sepolia' :
                             `Chain ${chainId}`;

  return (
    <div className="network-blocker-overlay">
      <div className="network-blocker">
        <div className="network-blocker-icon">⚠️</div>
        
        <h2 className="network-blocker-title">
          Wrong Network Detected
        </h2>
        
        <p className="network-blocker-description">
          You're currently on <strong>{currentNetworkName}</strong>
          <br />
          This app only works on <strong>{networkName}</strong>
        </p>
        
        <button
          onClick={handleSwitch}
          disabled={isPending}
          className="network-blocker-button"
        >
          {isPending ? (
            <>
              <span className="network-blocker-spinner"></span>
              Switching...
            </>
          ) : (
            `Switch to ${networkName}`
          )}
        </button>
        
        <p className="network-blocker-note">
          All game features and transactions require {networkName}
        </p>
      </div>
    </div>
  );
}
