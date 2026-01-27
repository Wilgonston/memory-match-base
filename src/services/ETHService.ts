/**
 * ETH Service
 * 
 * Provides ETH balance checking, transfer, and formatting utilities
 * Requirements: 11.1, 11.2, 11.6
 */

import { formatUnits, parseUnits, type Address, type Hash } from 'viem';
import { getPublicClient, getWalletClient } from '@wagmi/core';
import { wagmiConfig } from '../config/wagmi';

export const ETH_DECIMALS = 18;

export interface TransferResult {
  hash: Hash;
  success: boolean;
  error?: string;
}

/**
 * ETH Service for balance checking and transfers
 */
export class ETHService {
  /**
   * Get ETH balance for an address
   * @param address - The address to check balance for
   * @param chainId - Optional chain ID (defaults to current chain)
   * @returns Balance in wei as bigint
   */
  async getBalance(address: Address, chainId?: number): Promise<bigint> {
    try {
      const publicClient = getPublicClient(wagmiConfig, { chainId });
      
      if (!publicClient) {
        throw new Error('Public client not available');
      }
      
      const balance = await publicClient.getBalance({ address });
      return balance;
    } catch (error) {
      console.error('Error getting ETH balance:', error);
      throw new Error(`Failed to get ETH balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Transfer ETH to another address
   * @param to - Recipient address
   * @param amount - Amount in wei
   * @param chainId - Optional chain ID (defaults to current chain)
   * @returns Transaction result with hash
   */
  async transfer(to: Address, amount: bigint, chainId?: number): Promise<TransferResult> {
    try {
      const walletClient = await getWalletClient(wagmiConfig, { chainId });
      
      if (!walletClient) {
        throw new Error('Wallet client not available');
      }

      const hash = await walletClient.sendTransaction({
        to,
        value: amount,
      });

      return {
        hash,
        success: true,
      };
    } catch (error) {
      console.error('Error transferring ETH:', error);
      
      return {
        hash: '0x0' as Hash,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Format ETH amount for display
   * @param amount - Amount in wei
   * @param decimals - Number of decimal places to show (default: 4)
   * @returns Formatted string with ETH symbol
   */
  formatAmount(amount: bigint, decimals: number = 4): string {
    try {
      const formatted = formatUnits(amount, ETH_DECIMALS);
      const number = parseFloat(formatted);
      
      // Format with specified decimals
      const rounded = number.toFixed(decimals);
      
      // Remove trailing zeros
      const trimmed = rounded.replace(/\.?0+$/, '');
      
      return `${trimmed} ETH`;
    } catch (error) {
      console.error('Error formatting ETH amount:', error);
      return '0 ETH';
    }
  }

  /**
   * Validate ETH amount
   * @param amount - Amount in wei
   * @returns True if amount is valid (positive and not zero)
   */
  validateAmount(amount: bigint): boolean {
    return amount > 0n;
  }

  /**
   * Parse ETH amount from string
   * @param amount - Amount as string (e.g., "0.1")
   * @returns Amount in wei as bigint
   */
  parseAmount(amount: string): bigint {
    try {
      return parseUnits(amount, ETH_DECIMALS);
    } catch (error) {
      console.error('Error parsing ETH amount:', error);
      throw new Error(`Invalid ETH amount: ${amount}`);
    }
  }

  /**
   * Format ETH amount from wei to human-readable string
   * @param amount - Amount in wei
   * @returns Formatted string without ETH symbol
   */
  formatEthAmount(amount: bigint): string {
    return formatUnits(amount, ETH_DECIMALS);
  }

  /**
   * Check if address has sufficient balance
   * @param address - Address to check
   * @param requiredAmount - Required amount in wei
   * @param chainId - Optional chain ID
   * @returns True if balance is sufficient
   */
  async hasSufficientBalance(
    address: Address,
    requiredAmount: bigint,
    chainId?: number
  ): Promise<boolean> {
    try {
      const balance = await this.getBalance(address, chainId);
      return balance >= requiredAmount;
    } catch (error) {
      console.error('Error checking balance:', error);
      return false;
    }
  }
}

// Export singleton instance
export const ethService = new ETHService();
