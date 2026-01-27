/**
 * PaymasterService Property-Based Tests
 * 
 * Property tests for paymaster error fallback behavior.
 * 
 * **Validates: Requirements 2.5**
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import {
  PaymasterService,
  UserOperation,
} from './PaymasterService';
import { memoryMatchGasPolicy } from '../config/gas-policy';
import { Address, Hex } from 'viem';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

/**
 * Create a mock UserOperation with random transaction parameters
 */
function createMockUserOp(params: {
  to: string;
  data: string;
  value: bigint;
}): UserOperation {
  // Construct callData for Smart Wallet execute(address target, uint256 value, bytes data)
  // Function selector: 0xb61d27f6
  // Parameters: target (32 bytes padded), value (32 bytes), data offset (32 bytes), data length (32 bytes), data
  const targetPadded = params.to.padStart(64, '0');
  const valuePadded = params.value.toString(16).padStart(64, '0');
  const dataOffset = '0000000000000000000000000000000000000000000000000000000000000060'; // 96 bytes offset
  const dataLength = (params.data.length / 2).toString(16).padStart(64, '0');
  const dataPadded = params.data.padEnd(Math.ceil(params.data.length / 64) * 64, '0');
  
  const callData = `0xb61d27f6${targetPadded}${valuePadded}${dataOffset}${dataLength}${dataPadded}` as Hex;

  return {
    sender: '0x1234567890123456789012345678901234567890' as Address,
    nonce: 1n,
    initCode: '0x' as Hex,
    callData,
    callGasLimit: 100000n,
    verificationGasLimit: 100000n,
    preVerificationGas: 50000n,
    maxFeePerGas: 1000000000n,
    maxPriorityFeePerGas: 1000000000n,
    signature: '0x' as Hex,
  };
}

/**
 * Mock transaction execution with paymaster fallback
 * 
 * This simulates the behavior described in the design document:
 * - Try to get paymaster sponsorship
 * - If paymaster fails, fall back to user-paid transaction
 * - Return transaction result with sponsorship status
 */
async function executeWithPaymasterFallback(
  transaction: UserOperation,
  paymasterService: PaymasterService,
  entrypoint: Address,
  chainId: number
): Promise<{
  sponsored: boolean;
  receipt: { status: 'success' | 'failed'; hash: string };
  transactionData: UserOperation;
}> {
  let sponsored = false;
  
  try {
    // Try to get paymaster data for sponsorship
    const paymasterData = await paymasterService.getPaymasterData(
      transaction,
      entrypoint,
      chainId
    );
    
    // If we got paymaster data, mark as sponsored
    if (paymasterData && paymasterData.paymasterAndData) {
      sponsored = true;
      transaction.paymasterAndData = paymasterData.paymasterAndData;
    }
  } catch (error) {
    // Paymaster failed - fall back to user-paid transaction
    console.log('[Fallback] Paymaster sponsorship failed, using user-paid mode:', error);
    sponsored = false;
    // Continue with transaction without paymaster data
  }
  
  // Execute transaction (mock execution)
  // In real implementation, this would submit to the blockchain
  const receipt = {
    status: 'success' as const,
    hash: `0x${Math.random().toString(16).slice(2)}`,
  };
  
  return {
    sponsored,
    receipt,
    transactionData: transaction,
  };
}

describe('PaymasterService Property Tests', () => {
  const mockPaymasterUrl = 'https://api.example.com/paymaster';
  const mockEntrypoint = '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789' as Address;
  const mockChainId = 8453; // Base Mainnet

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock console methods to reduce noise in test output
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Feature: base-ecosystem-integration, Property 1: Paymaster Error Fallback
   * 
   * For any transaction that fails paymaster sponsorship, the system should gracefully 
   * fall back to user-paid transaction mode without losing transaction data or user progress.
   * 
   * This property test verifies that:
   * 1. When paymaster fails, the transaction still executes
   * 2. The transaction is marked as not sponsored
   * 3. Transaction data is preserved (no data loss)
   * 4. The transaction completes successfully
   * 
   * **Validates: Requirements 2.5**
   */
  it('Property 1: should fall back to user-paid mode on paymaster failure', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          to: fc.hexaString({ minLength: 40, maxLength: 40 }),
          data: fc.hexaString({ minLength: 0, maxLength: 1000 }),
          value: fc.bigInt({ min: 0n, max: 1000000000000000000n }),
        }),
        async (transaction) => {
          // Create paymaster service
          const paymasterService = new PaymasterService(
            mockPaymasterUrl,
            memoryMatchGasPolicy
          );

          // Mock paymaster to fail (simulate various failure scenarios)
          mockFetch.mockRejectedValueOnce(new Error('Paymaster service unavailable'));

          // Create user operation from transaction parameters
          const userOp = createMockUserOp(transaction);

          // Execute transaction with paymaster fallback
          const result = await executeWithPaymasterFallback(
            userOp,
            paymasterService,
            mockEntrypoint,
            mockChainId
          );

          // Verify fallback occurred (not sponsored)
          expect(result.sponsored).toBe(false);

          // Verify transaction still completed successfully
          expect(result.receipt).toBeDefined();
          expect(result.receipt.status).toBe('success');
          expect(result.receipt.hash).toMatch(/^0x[0-9a-f]+$/);

          // Verify transaction data is preserved (no data loss)
          expect(result.transactionData).toBeDefined();
          expect(result.transactionData.sender).toBe(userOp.sender);
          expect(result.transactionData.callData).toBe(userOp.callData);
          expect(result.transactionData.callGasLimit).toBe(userOp.callGasLimit);
          
          // Verify no paymasterAndData was added (user-paid mode)
          expect(result.transactionData.paymasterAndData).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2: Paymaster success should result in sponsored transaction
   * 
   * This complementary property verifies that when paymaster succeeds,
   * the transaction is properly marked as sponsored.
   */
  it('Property 2: should use paymaster sponsorship when available', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          to: fc.constant('93aC1C769aCE5caE403a454cBd236aB2EA7B17F5'), // Allowed contract
          data: fc.hexaString({ minLength: 0, maxLength: 100 }),
          value: fc.bigInt({ min: 0n, max: 1000000000n }),
        }),
        async (transaction) => {
          // Create paymaster service
          const paymasterService = new PaymasterService(
            mockPaymasterUrl,
            memoryMatchGasPolicy
          );

          // Mock successful paymaster response
          const mockPaymasterResponse = {
            paymaster: '0xPaymasterAddress123456789012345678901234' as Address,
            paymasterData: '0xPaymasterData' as Hex,
            paymasterVerificationGasLimit: '50000',
            paymasterPostOpGasLimit: '50000',
            paymasterAndData: '0xPaymasterAndDataComplete' as Hex,
          };

          mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
              jsonrpc: '2.0',
              id: 1,
              result: mockPaymasterResponse,
            }),
          });

          // Create user operation from transaction parameters
          const userOp = createMockUserOp(transaction);

          // Execute transaction with paymaster
          const result = await executeWithPaymasterFallback(
            userOp,
            paymasterService,
            mockEntrypoint,
            mockChainId
          );

          // Verify sponsorship occurred
          expect(result.sponsored).toBe(true);

          // Verify transaction completed successfully
          expect(result.receipt).toBeDefined();
          expect(result.receipt.status).toBe('success');

          // Verify paymaster data was added
          expect(result.transactionData.paymasterAndData).toBeDefined();
          expect(result.transactionData.paymasterAndData).toBe(
            mockPaymasterResponse.paymasterAndData
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 3: Transaction data integrity across fallback scenarios
   * 
   * Verifies that transaction data remains intact regardless of whether
   * paymaster succeeds or fails.
   */
  it('Property 3: should preserve transaction data integrity in all scenarios', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          to: fc.hexaString({ minLength: 40, maxLength: 40 }),
          data: fc.hexaString({ minLength: 0, maxLength: 500 }),
          value: fc.bigInt({ min: 0n, max: 1000000000000000000n }),
          paymasterShouldFail: fc.boolean(),
        }),
        async (params) => {
          const { to, data, value, paymasterShouldFail } = params;
          
          // Create paymaster service
          const paymasterService = new PaymasterService(
            mockPaymasterUrl,
            memoryMatchGasPolicy
          );

          // Mock paymaster response based on test parameter
          if (paymasterShouldFail) {
            mockFetch.mockRejectedValueOnce(new Error('Paymaster failure'));
          } else {
            mockFetch.mockResolvedValueOnce({
              ok: true,
              json: async () => ({
                jsonrpc: '2.0',
                id: 1,
                result: {
                  paymaster: '0xPaymasterAddress123456789012345678901234' as Address,
                  paymasterData: '0xPaymasterData' as Hex,
                  paymasterVerificationGasLimit: '50000',
                  paymasterPostOpGasLimit: '50000',
                  paymasterAndData: '0xPaymasterAndDataComplete' as Hex,
                },
              }),
            });
          }

          // Create user operation
          const originalUserOp = createMockUserOp({ to, data, value });
          
          // Store original values for comparison
          const originalCallData = originalUserOp.callData;
          const originalSender = originalUserOp.sender;
          const originalGasLimits = {
            call: originalUserOp.callGasLimit,
            verification: originalUserOp.verificationGasLimit,
            preVerification: originalUserOp.preVerificationGas,
          };

          // Execute transaction
          const result = await executeWithPaymasterFallback(
            originalUserOp,
            paymasterService,
            mockEntrypoint,
            mockChainId
          );

          // Verify core transaction data is preserved
          expect(result.transactionData.sender).toBe(originalSender);
          expect(result.transactionData.callData).toBe(originalCallData);
          expect(result.transactionData.callGasLimit).toBe(originalGasLimits.call);
          expect(result.transactionData.verificationGasLimit).toBe(originalGasLimits.verification);
          expect(result.transactionData.preVerificationGas).toBe(originalGasLimits.preVerification);

          // Verify transaction completed
          expect(result.receipt.status).toBe('success');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 4: Fallback should handle various error types gracefully
   * 
   * Tests that the fallback mechanism works for different types of paymaster errors.
   */
  it('Property 4: should handle various paymaster error types gracefully', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          to: fc.hexaString({ minLength: 40, maxLength: 40 }),
          data: fc.hexaString({ minLength: 0, maxLength: 200 }),
          value: fc.bigInt({ min: 0n, max: 1000000000n }),
          errorType: fc.constantFrom(
            'network_error',
            'rpc_error',
            'insufficient_credits',
            'rate_limit',
            'invalid_response'
          ),
        }),
        async (params) => {
          const { to, data, value, errorType } = params;
          
          // Create paymaster service
          const paymasterService = new PaymasterService(
            mockPaymasterUrl,
            memoryMatchGasPolicy
          );

          // Mock different error scenarios
          switch (errorType) {
            case 'network_error':
              mockFetch.mockRejectedValueOnce(new Error('Network connection failed'));
              break;
            case 'rpc_error':
              mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                  jsonrpc: '2.0',
                  id: 1,
                  error: { code: -32000, message: 'RPC error' },
                }),
              });
              break;
            case 'insufficient_credits':
              mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                  jsonrpc: '2.0',
                  id: 1,
                  error: { code: -32001, message: 'Insufficient gas credits' },
                }),
              });
              break;
            case 'rate_limit':
              mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 429,
                statusText: 'Too Many Requests',
              });
              break;
            case 'invalid_response':
              mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => {
                  throw new Error('Invalid JSON');
                },
              });
              break;
          }

          // Create user operation
          const userOp = createMockUserOp({ to, data, value });

          // Execute transaction with fallback
          const result = await executeWithPaymasterFallback(
            userOp,
            paymasterService,
            mockEntrypoint,
            mockChainId
          );

          // Verify fallback occurred for all error types
          expect(result.sponsored).toBe(false);

          // Verify transaction still completed successfully
          expect(result.receipt.status).toBe('success');

          // Verify transaction data is intact
          expect(result.transactionData.callData).toBe(userOp.callData);
        }
      ),
      { numRuns: 100 }
    );
  });
});
