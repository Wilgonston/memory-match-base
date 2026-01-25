/**
 * WalletButton Component
 * 
 * Wallet connection button using wagmi hooks.
 * Provides wallet connection with Smart Wallet support.
 * 
 * Requirements: 15.1, 15.2, 15.3, 15.5, 16.3
 */

import React from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { coinbaseWallet } from 'wagmi/connectors';
import './WalletButton.css';

/**
 * WalletButton component for wallet connection and management
 * 
 * Features:
 * - Connect wallet button (prioritizes Coinbase Smart Wallet)
 * - Shows connected address
 * - Disconnect functionality
 */
export const WalletButton: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    return (
      <div className="wallet-button-container">
        <div className="wallet-connected">
          <span className="wallet-address">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
          <button 
            onClick={() => disconnect()}
            className="wallet-disconnect-btn"
          >
            Disconnect
          </button>
        </div>
      </div>
    );
  }

  // Find Coinbase Wallet connector (prioritize Smart Wallet)
  const coinbaseConnector = connectors.find(c => c.id === 'coinbaseWalletSDK');
  const defaultConnector = coinbaseConnector || connectors[0];

  return (
    <div className="wallet-button-container">
      <button
        onClick={() => connect({ connector: defaultConnector })}
        className="wallet-connect-btn"
      >
        Connect Wallet
      </button>
    </div>
  );
};
