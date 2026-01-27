/**
 * PaymasterService - ERC-7677 Compliant Paymaster Integration
 * 
 * This service implements the ERC-7677 standard for paymaster RPC methods,
 * enabling gas sponsorship for user transactions on Base.
 * 
 * Reference: https://eips.ethereum.org/EIPS/eip-7677
 * 
 * Requirements: 2.1, 2.2, 2.3
 */

import { Address, Hex } from 'viem';
import { GasPolicy, memoryMatchGasPolicy } from '../config/gas-policy';
import { handleServiceError, logServiceOperation, logServiceWarning } from '../utils/errorHandler';

/**
 * User operation structure for ERC-4337 account abstraction
 */
export interface UserOperation {
  sender: Address;
  nonce: bigint;
  initCode: Hex;
  callData: Hex;
  callGasLimit: bigint;
  verificationGasLimit: bigint;
  preVerificationGas: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  paymasterAndData?: Hex;
  signature: Hex;
}

/**
 * Paymaster stub data for gas estimation
 */
export interface PaymasterStubData {
  paymaster: Address;
  paymasterData: Hex;
  paymasterVerificationGasLimit: bigint;
  paymasterPostOpGasLimit: bigint;
}

/**
 * Paymaster data for transaction sponsorship
 */
export interface PaymasterData extends PaymasterStubData {
  paymasterAndData: Hex;
}

/**
 * Optional context for paymaster requests
 */
export interface PaymasterContext {
  policyId?: string;
  sponsorshipInfo?: {
    name: string;
    icon?: string;
  };
}

/**
 * ERC-7677 RPC response structure
 */
interface PaymasterRPCResponse {
  paymaster: Address;
  paymasterData: Hex;
  paymasterVerificationGasLimit: string;
  paymasterPostOpGasLimit: string;
}

/**
 * PaymasterService implements ERC-7677 compliant paymaster integration
 * 
 * This service provides methods for:
 * - Getting stub data for gas estimation (pm_getPaymasterStubData)
 * - Getting actual paymaster data for sponsorship (pm_getPaymasterData)
 * - Checking eligibility for gas sponsorship
 */
export class PaymasterService {
  private paymasterUrl: string;
  private gasPolicy: GasPolicy;

  /**
   * Create a new PaymasterService instance
   * 
   * @param paymasterUrl - The ERC-7677 compliant paymaster RPC endpoint
   * @param gasPolicy - Gas policy configuration for sponsorship eligibility
   */
  constructor(paymasterUrl: string, gasPolicy: GasPolicy) {
    if (!paymasterUrl) {
      throw new Error('Paymaster URL is required');
    }
    this.paymasterUrl = paymasterUrl;
    this.gasPolicy = gasPolicy;
  }

  /**
   * Get paymaster stub data for gas estimation
   * 
   * This method calls pm_getPaymasterStubData to get placeholder values
   * for gas estimation before the actual transaction is ready.
   * 
   * @param userOp - The user operation to estimate gas for
   * @param entrypoint - The EntryPoint contract address
   * @param chainId - The chain ID (e.g., 8453 for Base Mainnet)
   * @param context - Optional context for the paymaster request
   * @returns Promise resolving to paymaster stub data
   * 
   * Requirements: 2.2
   */
  async getPaymasterStubData(
    userOp: UserOperation,
    entrypoint: Address,
    chainId: number,
    context?: PaymasterContext
  ): Promise<PaymasterStubData> {
    try {
      logServiceOperation('PaymasterService', 'Requesting stub data for gas estimation', {
        sender: userOp.sender,
        chainId,
        entrypoint,
      });

      const isEligible = await this.isEligibleForSponsorship(userOp);
      if (!isEligible) {
        throw new Error('Transaction not eligible for gas sponsorship');
      }

      const response = await this.callPaymasterRPC<PaymasterRPCResponse>(
        'pm_getPaymasterStubData',
        [userOp, entrypoint, chainId.toString(16), context]
      );

      const stubData: PaymasterStubData = {
        paymaster: response.paymaster,
        paymasterData: response.paymasterData,
        paymasterVerificationGasLimit: BigInt(response.paymasterVerificationGasLimit),
        paymasterPostOpGasLimit: BigInt(response.paymasterPostOpGasLimit),
      };

      logServiceOperation('PaymasterService', 'Stub data received', {
        paymaster: stubData.paymaster,
        verificationGas: stubData.paymasterVerificationGasLimit.toString(),
        postOpGas: stubData.paymasterPostOpGasLimit.toString(),
      });

      return stubData;
    } catch (error) {
      console.error('[PaymasterService]', error);
      throw new Error(
        `Failed to get paymaster stub data: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get paymaster data for transaction sponsorship
   * 
   * This method calls pm_getPaymasterData to get the actual paymaster
   * signature and data needed to sponsor the transaction.
   * 
   * @param userOp - The user operation to sponsor
   * @param entrypoint - The EntryPoint contract address
   * @param chainId - The chain ID (e.g., 8453 for Base Mainnet)
   * @param context - Optional context for the paymaster request
   * @returns Promise resolving to paymaster data with signature
   * 
   * Requirements: 2.3
   */
  async getPaymasterData(
    userOp: UserOperation,
    entrypoint: Address,
    chainId: number,
    context?: PaymasterContext
  ): Promise<PaymasterData> {
    try {
      logServiceOperation('PaymasterService', 'Requesting paymaster data for sponsorship', {
        sender: userOp.sender,
        chainId,
        entrypoint,
      });

      const isEligible = await this.isEligibleForSponsorship(userOp);
      if (!isEligible) {
        throw new Error('Transaction not eligible for gas sponsorship');
      }

      const response = await this.callPaymasterRPC<PaymasterRPCResponse & { paymasterAndData: Hex }>(
        'pm_getPaymasterData',
        [userOp, entrypoint, chainId.toString(16), context]
      );

      const paymasterData: PaymasterData = {
        paymaster: response.paymaster,
        paymasterData: response.paymasterData,
        paymasterVerificationGasLimit: BigInt(response.paymasterVerificationGasLimit),
        paymasterPostOpGasLimit: BigInt(response.paymasterPostOpGasLimit),
        paymasterAndData: response.paymasterAndData,
      };

      logServiceOperation('PaymasterService', 'Paymaster data received', {
        paymaster: paymasterData.paymaster,
        sponsored: true,
      });

      this.logPaymasterUsage(userOp, paymasterData);

      return paymasterData;
    } catch (error) {
      console.error('[PaymasterService]', error);
      throw new Error(
        `Failed to get paymaster data: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Check if a user operation is eligible for gas sponsorship
   * 
   * This method validates the operation against the configured gas policy:
   * - Checks if the target contract is in the allowed list
   * - Validates gas limits are within policy bounds
   * - Checks function selectors if configured
   * 
   * @param userOp - The user operation to check
   * @returns Promise resolving to true if eligible, false otherwise
   * 
   * Requirements: 2.1, 2.3
   */
  async isEligibleForSponsorship(userOp: UserOperation): Promise<boolean> {
    try {
      // Extract target contract from callData
      // For Smart Wallet, the target is typically encoded in the callData
      const targetContract = this.extractTargetContract(userOp.callData);

      // Check if contract is in allowed list
      const isAllowedContract = this.gasPolicy.allowedContracts.some(
        (allowed) => allowed.toLowerCase() === targetContract.toLowerCase()
      );

      if (!isAllowedContract) {
        logServiceWarning('PaymasterService', 'Contract not in allowed list', { targetContract });
        return false;
      }

      const totalGas = userOp.callGasLimit + userOp.verificationGasLimit + userOp.preVerificationGas;
      if (totalGas > this.gasPolicy.maxGasPerTransaction) {
        logServiceWarning('PaymasterService', 'Gas limit exceeds policy', {
          requested: totalGas.toString(),
          max: this.gasPolicy.maxGasPerTransaction.toString(),
        });
        return false;
      }

      // Check function selector if configured
      if (this.gasPolicy.allowedFunctions) {
        // Find the allowed functions for this contract (case-insensitive)
        const allowedFunctionsEntry = Object.entries(this.gasPolicy.allowedFunctions).find(
          ([contract]) => contract.toLowerCase() === targetContract.toLowerCase()
        );

        if (allowedFunctionsEntry) {
          const [, allowedFunctions] = allowedFunctionsEntry;
          const functionSelector = this.extractFunctionSelector(userOp.callData);
          const isAllowedFunction = allowedFunctions.some(
            (allowed) => allowed.toLowerCase() === functionSelector.toLowerCase()
          );

          if (!isAllowedFunction) {
            logServiceWarning('PaymasterService', 'Function not in allowed list', { functionSelector });
            return false;
          }
        }
      }

      logServiceOperation('PaymasterService', 'Transaction eligible for sponsorship', {
        contract: targetContract,
        gas: totalGas.toString(),
      });

      return true;
    } catch (error) {
      console.error('[PaymasterService]', error);
      return false;
    }
  }

  /**
   * Call a paymaster RPC method
   * 
   * @param method - The RPC method name (e.g., 'pm_getPaymasterStubData')
   * @param params - The method parameters
   * @returns Promise resolving to the RPC response
   */
  private async callPaymasterRPC<T>(method: string, params: unknown[]): Promise<T> {
    // Serialize params with BigInt support
    const serializedParams = this.serializeWithBigInt(params);

    const response = await fetch(this.paymasterUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method,
        params: serializedParams,
      }),
    });

    if (!response.ok) {
      throw new Error(`Paymaster RPC failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(`Paymaster RPC error: ${data.error.message || JSON.stringify(data.error)}`);
    }

    return data.result as T;
  }

  /**
   * Serialize parameters with BigInt support
   * Converts BigInt values to hex strings for JSON serialization
   * 
   * @param obj - The object to serialize
   * @returns Serialized object with BigInt values converted to hex strings
   */
  private serializeWithBigInt(obj: unknown): unknown {
    if (typeof obj === 'bigint') {
      return '0x' + obj.toString(16);
    }
    if (Array.isArray(obj)) {
      return obj.map((item) => this.serializeWithBigInt(item));
    }
    if (obj && typeof obj === 'object') {
      const result: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.serializeWithBigInt(value);
      }
      return result;
    }
    return obj;
  }

  /**
   * Extract target contract address from callData
   * 
   * For Smart Wallet execute calls, the target is typically the first 20 bytes
   * after the function selector.
   * 
   * @param callData - The call data hex string
   * @returns The target contract address
   */
  private extractTargetContract(callData: Hex): Address {
    // For Smart Wallet execute(address target, uint256 value, bytes data)
    // The target address is at bytes 4-24 (after 4-byte function selector)
    if (callData.length < 74) {
      // 0x + 4 bytes selector + 32 bytes (20 bytes address padded)
      throw new Error('Invalid callData: too short to extract target');
    }

    // Extract address from position 4-24 (skip 0x and 4-byte selector)
    // Address is padded to 32 bytes, so we take the last 20 bytes
    const addressHex = '0x' + callData.slice(34, 74); // Skip 0x(2) + selector(8) + padding(24)
    return addressHex as Address;
  }

  /**
   * Extract function selector from callData
   * 
   * @param callData - The call data hex string
   * @returns The 4-byte function selector
   */
  private extractFunctionSelector(callData: Hex): string {
    if (callData.length < 10) {
      // 0x + 4 bytes
      throw new Error('Invalid callData: too short to extract function selector');
    }

    // First 4 bytes after 0x
    return callData.slice(0, 10);
  }

  /**
   * Log paymaster usage for monitoring gas credit consumption
   * 
   * @param userOp - The user operation that was sponsored
   * @param paymasterData - The paymaster data used
   * 
   * Requirements: 2.7
   */
  private logPaymasterUsage(userOp: UserOperation, paymasterData: PaymasterData): void {
    const usage = {
      timestamp: new Date().toISOString(),
      sender: userOp.sender,
      paymaster: paymasterData.paymaster,
      estimatedGas: (
        userOp.callGasLimit +
        userOp.verificationGasLimit +
        userOp.preVerificationGas +
        paymasterData.paymasterVerificationGasLimit +
        paymasterData.paymasterPostOpGasLimit
      ).toString(),
      sponsored: true,
    };

    logServiceOperation('PaymasterService', 'Usage logged', usage);
  }
}

/**
 * Create a PaymasterService instance with the configured paymaster URL
 * 
 * @param paymasterUrl - The ERC-7677 compliant paymaster RPC endpoint
 * @param gasPolicy - Optional custom gas policy (defaults to memoryMatchGasPolicy from config)
 * @returns A configured PaymasterService instance
 */
export function createPaymasterService(
  paymasterUrl: string,
  gasPolicy: GasPolicy = memoryMatchGasPolicy
): PaymasterService {
  return new PaymasterService(paymasterUrl, gasPolicy);
}
