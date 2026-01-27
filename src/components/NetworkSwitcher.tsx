import { useState, useEffect } from 'react';
import { useAccount, useSwitchChain, useChainId } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import './NetworkSwitcher.css';

export function NetworkSwitcher() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();
  const [isOpen, setIsOpen] = useState(false);
  const [showWrongNetworkPrompt, setShowWrongNetworkPrompt] = useState(false);

  // Get preferred network from environment variable
  const preferredNetwork = import.meta.env.VITE_NETWORK || 'mainnet';
  const preferredChainId = preferredNetwork === 'mainnet' ? base.id : baseSepolia.id;

  useEffect(() => {
    // Auto-switch to preferred network on connect
    if (isConnected && chainId !== preferredChainId && !isPending) {
      console.log('[NetworkSwitcher] Auto-switching to', preferredNetwork, 'network');
      switchChain({ chainId: preferredChainId });
    }
  }, [isConnected, chainId, preferredChainId, isPending, switchChain, preferredNetwork]);

  useEffect(() => {
    // Check if user is on wrong network
    if (isConnected && chainId !== preferredChainId) {
      setShowWrongNetworkPrompt(true);
    } else {
      setShowWrongNetworkPrompt(false);
    }
  }, [isConnected, chainId, preferredChainId]);

  if (!isConnected) {
    return null;
  }

  const currentNetwork = chainId === base.id ? 'mainnet' : 'sepolia';
  const networks = [
    { id: base.id, name: 'Base Mainnet', chain: base },
    { id: baseSepolia.id, name: 'Base Sepolia', chain: baseSepolia }
  ];

  const handleNetworkSwitch = (targetChainId: number) => {
    if (targetChainId !== chainId) {
      switchChain({ chainId: targetChainId });
    }
    setIsOpen(false);
    setShowWrongNetworkPrompt(false);
  };

  return (
    <>
      <div className="network-switcher">
        <button
          className="network-switcher-button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={isPending}
          aria-label="Switch network"
          aria-expanded={isOpen}
        >
          <span className="network-indicator" data-network={currentNetwork} />
          <span className="network-name">
            {currentNetwork === 'mainnet' ? 'Base' : 'Sepolia'}
          </span>
          <span className="network-arrow">{isOpen ? '▲' : '▼'}</span>
        </button>

        {isOpen && (
          <div className="network-dropdown">
            {networks.map((network) => (
              <button
                key={network.id}
                className={`network-option ${chainId === network.id ? 'active' : ''}`}
                onClick={() => handleNetworkSwitch(network.id)}
                disabled={isPending || chainId === network.id}
              >
                <span className="network-indicator" data-network={network.id === base.id ? 'mainnet' : 'sepolia'} />
                <span>{network.name}</span>
                {chainId === network.id && <span className="check-mark">✓</span>}
              </button>
            ))}
          </div>
        )}

        {isPending && (
          <div className="network-switching-overlay">
            <div className="spinner" />
            <p>Switching network...</p>
          </div>
        )}
      </div>

      {showWrongNetworkPrompt && (
        <div className="wrong-network-prompt">
          <p>⚠️ You're on the wrong network</p>
          <p className="prompt-message">
            Please switch to {preferredNetwork === 'mainnet' ? 'Base Mainnet' : 'Base Sepolia'}
          </p>
          <button
            className="switch-network-button"
            onClick={() => handleNetworkSwitch(preferredChainId)}
            disabled={isPending}
          >
            Switch to {preferredNetwork === 'mainnet' ? 'Base Mainnet' : 'Base Sepolia'}
          </button>
        </div>
      )}
    </>
  );
}
