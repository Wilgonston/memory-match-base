/**
 * WalletComponents
 * 
 * OnchainKit-based wallet components for connection and identity display.
 * Replaces custom WalletButton with official OnchainKit components.
 * 
 * Features:
 * - Wallet connection with modal
 * - Identity display with Basename support
 * - Avatar, Name, Address, Balance display
 * - Copy address functionality
 * - Disconnect functionality
 */

import {
  Wallet,
  ConnectWallet,
  WalletDropdown,
  WalletDropdownDisconnect,
} from '@coinbase/onchainkit/wallet';
import {
  Identity,
  Avatar,
  Name,
  Address,
  EthBalance,
} from '@coinbase/onchainkit/identity';

/**
 * WalletComponents - Main wallet UI component
 * 
 * Displays connect button when disconnected, dropdown when connected.
 * Automatically handles Basename resolution and identity display.
 */
export function WalletComponents() {
  return (
    <Wallet>
      <ConnectWallet />
      <WalletDropdown>
        <Identity hasCopyAddressOnClick>
          <Avatar />
          <Name />
          <Address />
          <EthBalance />
        </Identity>
        <WalletDropdownDisconnect />
      </WalletDropdown>
    </Wallet>
  );
}

/**
 * WalletButton - Simplified wallet button for compact spaces
 * 
 * Shows just the connect button without dropdown.
 * Useful for headers or compact layouts.
 */
export function WalletButton() {
  return (
    <Wallet>
      <ConnectWallet />
      <WalletDropdown>
        <Identity hasCopyAddressOnClick>
          <Avatar />
          <Name />
          <Address />
          <EthBalance />
        </Identity>
        <WalletDropdownDisconnect />
      </WalletDropdown>
    </Wallet>
  );
}
