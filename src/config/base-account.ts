/**
 * Base Account SDK Configuration
 *
 * This module configures the Base Account SDK for authentication and payments.
 * The Base Account SDK provides Sign in with Base (SIWB) and Base Pay functionality.
 *
 * @see https://docs.base.org/base-account/quickstart/web-react
 */

import { base } from 'wagmi/chains';

// Get environment variables
const cdpProjectId = import.meta.env.VITE_CDP_PROJECT_ID || '';
const appName = 'Memory Match BASE';
const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;

/**
 * Base Account SDK Configuration Interface
 */
export interface BaseAccountConfig {
  /** CDP Project ID from Coinbase Developer Platform */
  projectId: string;
  /** Network to use: always 'mainnet' */
  network: 'mainnet';
  /** Application name displayed in wallet UI */
  appName: string;
  /** Application logo URL */
  appLogoUrl: string;
  /** Application URL */
  appUrl: string;
  /** Whether to use testnet (always false for mainnet) */
  testnet: boolean;
}

/**
 * Determine if we're using testnet based on network configuration
 */
export const isTestnet = false;

/**
 * Get the appropriate chain based on network configuration
 */
export const baseAccountChain = base;

/**
 * Base Account SDK configuration object
 * This configuration is used to initialize the Base Account SDK
 */
export const baseAccountConfig: BaseAccountConfig = {
  projectId: cdpProjectId,
  network: 'mainnet',
  appName,
  appLogoUrl: `${appUrl}/assets/miniapp/icon-512-improved.svg`,
  appUrl,
  testnet: false,
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
export { base };
