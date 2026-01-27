/**
 * Wallet Migration Utilities
 * 
 * Utilities for detecting EOA wallets and offering Smart Wallet migration.
 * Helps users transition from EOA to Smart Wallet for better UX.
 * 
 * Requirements: 6.1, 6.2, 6.5
 */

import { Address } from 'viem';
import { getPublicClient } from '@wagmi/core';
import { wagmiConfig } from '../config/wagmi';

/**
 * Check if an address is an EOA (Externally Owned Account)
 * 
 * EOAs have no code at their address, while Smart Wallets (contracts) do.
 * 
 * @param address - The address to check
 * @returns true if the address is an EOA, false if it's a contract
 */
export async function isEOA(address: Address): Promise<boolean> {
  try {
    const publicClient = getPublicClient(wagmiConfig);
    
    if (!publicClient) {
      console.warn('[walletMigration] No public client available');
      return false;
    }

    // Get the bytecode at the address
    const code = await publicClient.getBytecode({ address });
    
    // If there's no code (or code is '0x'), it's an EOA
    // If there's code, it's a contract (Smart Wallet)
    return !code || code === '0x';
  } catch (error) {
    console.error('[walletMigration] Error checking if address is EOA:', error);
    // Default to false (assume Smart Wallet) on error to avoid false positives
    return false;
  }
}

/**
 * Check if user has previously dismissed the migration offer
 * 
 * @param address - The user's address
 * @returns true if user has dismissed the migration offer
 */
export function hasDismissedMigration(address: Address): boolean {
  const key = `migration-dismissed-${address.toLowerCase()}`;
  return localStorage.getItem(key) === 'true';
}

/**
 * Mark that user has dismissed the migration offer
 * 
 * @param address - The user's address
 */
export function dismissMigration(address: Address): void {
  const key = `migration-dismissed-${address.toLowerCase()}`;
  localStorage.setItem(key, 'true');
}

/**
 * Clear migration dismissal (for testing or if user wants to see offer again)
 * 
 * @param address - The user's address
 */
export function clearMigrationDismissal(address: Address): void {
  const key = `migration-dismissed-${address.toLowerCase()}`;
  localStorage.removeItem(key);
}

/**
 * Check if we should offer Smart Wallet migration to the user
 * 
 * @param address - The user's address
 * @returns true if we should offer migration
 */
export async function shouldOfferMigration(address: Address): Promise<boolean> {
  // Don't offer if user has already dismissed
  if (hasDismissedMigration(address)) {
    return false;
  }

  // Check if address is an EOA
  const isEOAAddress = await isEOA(address);
  
  // Offer migration if it's an EOA
  return isEOAAddress;
}

/**
 * Migration offer data
 */
export interface MigrationOffer {
  shouldOffer: boolean;
  isEOA: boolean;
  hasDismissed: boolean;
}

/**
 * Get complete migration offer status
 * 
 * @param address - The user's address
 * @returns Migration offer data
 */
export async function getMigrationStatus(address: Address): Promise<MigrationOffer> {
  const isEOAAddress = await isEOA(address);
  const hasDismissed = hasDismissedMigration(address);
  const shouldOffer = isEOAAddress && !hasDismissed;

  return {
    shouldOffer,
    isEOA: isEOAAddress,
    hasDismissed,
  };
}
