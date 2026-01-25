/**
 * WalletButton Component
 * 
 * Wallet connection button using OnchainKit's Wallet components.
 * Provides wallet connection, identity display, and disconnection functionality.
 * 
 * Requirements: 15.1, 15.2, 15.3, 15.5, 16.3
 */

import React from 'react';
import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownBasename,
  WalletDropdownDisconnect,
} from '@coinbase/onchainkit/wallet';
import {
  Address,
  Avatar,
  Name,
  Identity,
} from '@coinbase/onchainkit/identity';
import './WalletButton.css';

/**
 * WalletButton component for wallet connection and management
 * 
 * Features:
 * - Connect wallet button for non-connected users
 * - Wallet dropdown with identity display for connected users
 * - Basename display and management
 * - Disconnect functionality
 */
export const WalletButton: React.FC = () => {
  return (
    <div className="wallet-button-container">
      <Wallet>
        <ConnectWallet>
          <Avatar className="h-6 w-6" />
          <Name />
        </ConnectWallet>
        <WalletDropdown>
          <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
            <Avatar />
            <Name />
            <Address />
          </Identity>
          <WalletDropdownBasename />
          <WalletDropdownDisconnect />
        </WalletDropdown>
      </Wallet>
    </div>
  );
};
