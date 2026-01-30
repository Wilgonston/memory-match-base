/**
 * Wallet Detection Utilities
 * 
 * Utilities for detecting wallet type and capabilities.
 */

/**
 * Check if the connected wallet is a Smart Wallet (Coinbase Smart Wallet)
 * 
 * @param connector - The connector object from wagmi
 * @returns true if Smart Wallet, false otherwise
 */
export function isSmartWallet(connectorId?: string): boolean {
  if (!connectorId) return false;
  
  // Coinbase Smart Wallet uses 'coinbaseWalletSDK' connector
  // and creates Smart Wallets (not injected wallets)
  return connectorId === 'coinbaseWalletSDK';
}

/**
 * Check if the connected wallet is an injected wallet (MetaMask, Rainbow, etc.)
 * 
 * @param connectorId - The connector ID from wagmi
 * @returns true if injected wallet, false otherwise
 */
export function isInjectedWallet(connectorId?: string): boolean {
  if (!connectorId) return false;
  
  // Common injected wallet connectors
  const injectedConnectors = [
    'injected',
    'metaMask',
    'walletConnect',
    'rainbow',
    'trust',
    'rabby',
  ];
  
  return injectedConnectors.some(id => 
    connectorId.toLowerCase().includes(id.toLowerCase())
  );
}

/**
 * Get wallet type display name
 * 
 * @param connectorId - The connector ID from wagmi
 * @returns Display name for the wallet type
 */
export function getWalletTypeName(connectorId?: string): string {
  if (!connectorId) return 'Unknown Wallet';
  
  if (isSmartWallet(connectorId)) {
    return 'Smart Wallet';
  }
  
  if (connectorId.toLowerCase().includes('metamask')) {
    return 'MetaMask';
  }
  
  if (connectorId.toLowerCase().includes('walletconnect')) {
    return 'WalletConnect';
  }
  
  if (connectorId.toLowerCase().includes('rainbow')) {
    return 'Rainbow Wallet';
  }
  
  if (connectorId.toLowerCase().includes('trust')) {
    return 'Trust Wallet';
  }
  
  if (connectorId.toLowerCase().includes('rabby')) {
    return 'Rabby Wallet';
  }
  
  return 'Injected Wallet';
}
