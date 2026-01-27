/**
 * Gas Policy Configuration
 * 
 * This file defines the gas sponsorship policies for the Memory Match BASE game.
 * The policies determine which contracts and operations are eligible for paymaster
 * gas sponsorship.
 * 
 * Requirements: 2.4
 */

import { Address } from 'viem';

/**
 * Gas policy configuration for sponsorship eligibility
 */
export interface GasPolicy {
  /** Contract addresses eligible for sponsorship */
  allowedContracts: Address[];
  /** Maximum gas per transaction */
  maxGasPerTransaction: bigint;
  /** Maximum transactions per user per day */
  maxTransactionsPerDay: number;
  /** Specific function selectors allowed (optional) */
  allowedFunctions?: {
    [contract: Address]: string[];
  };
}

/**
 * Contract addresses for the Memory Match game
 */
export const MEMORY_MATCH_CONTRACTS = {
  /** MemoryMatchProgress contract on Base Mainnet */
  PROGRESS_MAINNET: '0x93aC1C769aCE5caE403a454cBd236aB2EA7B17F5' as Address,
  // Add Sepolia testnet address when available
  // PROGRESS_SEPOLIA: '0x...' as Address,
} as const;

/**
 * Default gas policy for Memory Match BASE game
 * 
 * This policy allows sponsorship for:
 * - MemoryMatchProgress contract (0x93aC1C769aCE5caE403a454cBd236aB2EA7B17F5)
 * - Maximum 500,000 gas per transaction
 * - Maximum 100 transactions per user per day
 * 
 * The policy is designed to:
 * 1. Enable gasless gameplay for users
 * 2. Prevent abuse through gas and transaction limits
 * 3. Restrict sponsorship to only the game contract
 * 
 * Requirements: 2.4
 */
export const memoryMatchGasPolicy: GasPolicy = {
  allowedContracts: [
    MEMORY_MATCH_CONTRACTS.PROGRESS_MAINNET,
  ],
  maxGasPerTransaction: 500000n,
  maxTransactionsPerDay: 100,
  // Function selectors can be added here if needed for additional security
  // This would restrict sponsorship to specific contract functions
  // allowedFunctions: {
  //   [MEMORY_MATCH_CONTRACTS.PROGRESS_MAINNET]: [
  //     '0x1234abcd', // saveProgress function selector
  //     '0x5678efgh', // batchSaveProgress function selector
  //   ],
  // },
};

/**
 * Create a custom gas policy with overrides
 * 
 * @param overrides - Partial gas policy to override defaults
 * @returns A complete gas policy with overrides applied
 * 
 * @example
 * ```typescript
 * const customPolicy = createGasPolicy({
 *   maxGasPerTransaction: 1000000n,
 *   maxTransactionsPerDay: 200,
 * });
 * ```
 */
export function createGasPolicy(overrides: Partial<GasPolicy>): GasPolicy {
  return {
    ...memoryMatchGasPolicy,
    ...overrides,
  };
}

/**
 * Validate a gas policy configuration
 * 
 * @param policy - The gas policy to validate
 * @returns true if valid, false otherwise
 */
export function validateGasPolicy(policy: GasPolicy): boolean {
  try {
    if (!policy.allowedContracts || policy.allowedContracts.length === 0) {
      throw new Error('Gas policy must have at least one allowed contract');
    }

    if (policy.maxGasPerTransaction <= 0n) {
      throw new Error('Max gas per transaction must be greater than 0');
    }

    if (policy.maxTransactionsPerDay <= 0) {
      throw new Error('Max transactions per day must be greater than 0');
    }

    for (const contract of policy.allowedContracts) {
      if (!contract.startsWith('0x') || contract.length !== 42) {
        throw new Error(`Invalid contract address: ${contract}`);
      }
    }

    if (policy.allowedFunctions) {
      for (const [contract, selectors] of Object.entries(policy.allowedFunctions)) {
        if (!contract.startsWith('0x') || contract.length !== 42) {
          throw new Error(`Invalid contract address in allowedFunctions: ${contract}`);
        }

        for (const selector of selectors) {
          if (!selector.startsWith('0x') || selector.length !== 10) {
            throw new Error(`Invalid function selector: ${selector} (must be 4 bytes with 0x prefix)`);
          }
        }
      }
    }

    return true;
  } catch (error) {
    console.error('[GasPolicy] Validation failed:', error);
    return false;
  }
}

try {
  validateGasPolicy(memoryMatchGasPolicy);
} catch (error) {
  console.error('[GasPolicy] Default policy validation failed:', error);
}
