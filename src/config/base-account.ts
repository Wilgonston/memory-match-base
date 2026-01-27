/**
 * Base Account SDK Configuration
 * 
 * This module configures the Base Account SDK for authentication and payments.
 * The Base Account SDK provides Sign in with Base (SIWB) and Base Pay functionality.
 * 
 * @see https://docs.base.org/base-account/quickstart/web-react
 */

import { base, baseSepolia } from 'wagmi/chains';

// Get environment variables
const cdpProjectId = import.meta.env.VITE_CDP_PROJECT_ID || '';
const network = import.meta.env.VITE_BASE_ACCOUNT_NETWORK || import.meta.env.VITE_NETWORK || 'sepolia';
const appName = import.meta.env.VITE_APP_NAME || 'Memory Match BASE';
const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;

/**
 * Base Account SDK Configuration Interface
 */
export interface BaseAccountConfig {
  /** CDP Project ID from Coinbase Developer Platform */
  projectId: string;
  /** Network to use: 'mainnet' or 'sepolia' */
  network: 'mainnet' | 'sepolia';
  /** Application name displayed in wallet UI */
  appName: string;
  /** Application logo URL */
  appLogoUrl: string;
  /** Application URL */
  appUrl: string;
  /** Whether to use testnet (true for sepolia, false for mainnet) */
  testnet: boolean;
}

/**
 * Determine if we're using testnet based on network configuration
 */
export const isTestnet = network === 'sepolia';

/**
 * Get the appropriate chain based on network configuration
 */
export const baseAccountChain = isTestnet ? baseSepolia : base;

/**
 * Base Account SDK configuration object
 * This configuration is used to initialize the Base Account SDK
 */
export const baseAccountConfig: BaseAccountConfig = {
  projectId: cdpProjectId,
  network: network as 'mainnet' | 'sepolia',
  appName,
  appLogoUrl: `${appUrl}/assets/miniapp/icon-512.svg`,
  appUrl,
  testnet: isTestnet,
};

/**
 * Validate Base Account configuration
 * Logs warnings if required configuration is missing
 */
export function validateBaseAccountConfig(): boolean {
  if (!baseAccountConfig.projectId) {
    console.warn(
      '[Base Account SDK] CDP Project ID not configured. ' +
      'Set VITE_CDP_PROJECT_ID in your .env file. ' +
      'Get your project ID from https://portal.cdp.coinbase.com/'
    );
    return false;
  }
  
  return true;
}

/**
 * Export chain constants for convenience
 */
export { base, baseSepolia };
