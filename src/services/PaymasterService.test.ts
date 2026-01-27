/**
 * PaymasterService Unit Tests
 * 
 * Tests for ERC-7677 compliant paymaster service implementation.
 * 
 * Requirements: 2.1, 2.2, 2.3
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  PaymasterService,
  createPaymasterService,
  UserOperation,
} from './PaymasterService';
import { GasPolicy, memoryMatchGasPolicy } from '../config/gas-policy';
import { Address, Hex } from 'viem';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('PaymasterService', () => {
  const mockPaymasterUrl = 'https://api.example.com/paymaster';
  const mockEntrypoint = '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789' as Address;
  const mockChainId = 8453; // Base Mainnet

  const mockUserOp: UserOperation = {
    sender: '0x1234567890123456789012345678901234567890' as Address,
    nonce: 1n,
    initCode: '0x' as Hex,
    callData: '0xb61d27f600000000000000000000000093ac1c769ace5cae403a454cbd236ab2ea7b17f50000000000000000000000000000000000000000000000000000000000000000' as Hex,
    callGasLimit: 100000n,
    verificationGasLimit: 100000n,
    preVerificationGas: 50000n,
    maxFeePerGas: 1000000000n,
    maxPriorityFeePerGas: 1000000000n,
    signature: '0x' as Hex,
  };

  const mockPaymasterResponse = {
    paymaster: '0xPaymasterAddress123456789012345678901234' as Address,
    paymasterData: '0xPaymasterData' as Hex,
    paymasterVerificationGasLimit: '50000',
    paymasterPostOpGasLimit: '50000',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create a PaymasterService instance with valid parameters', () => {
      const service = new PaymasterService(mockPaymasterUrl, memoryMatchGasPolicy);
      expect(service).toBeInstanceOf(PaymasterService);
    });

    it('should throw error if paymaster URL is empty', () => {
      expect(() => new PaymasterService('', memoryMatchGasPolicy)).toThrow(
        'Paymaster URL is required'
      );
    });
  });

  describe('getPaymasterStubData', () => {
    it('should successfully get stub data for eligible transaction', async () => {
      const service = new PaymasterService(mockPaymasterUrl, memoryMatchGasPolicy);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          jsonrpc: '2.0',
          id: 1,
          result: mockPaymasterResponse,
        }),
      });

      const result = await service.getPaymasterStubData(
        mockUserOp,
        mockEntrypoint,
        mockChainId
      );

      expect(result).toEqual({
        paymaster: mockPaymasterResponse.paymaster,
        paymasterData: mockPaymasterResponse.paymasterData,
        paymasterVerificationGasLimit: 50000n,
        paymasterPostOpGasLimit: 50000n,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        mockPaymasterUrl,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('pm_getPaymasterStubData'),
        })
      );
    });

    it('should throw error if transaction is not eligible', async () => {
      const service = new PaymasterService(mockPaymasterUrl, memoryMatchGasPolicy);

      // Create user op with disallowed contract
      const ineligibleUserOp = {
        ...mockUserOp,
        callData: '0xb61d27f60000000000000000000000001111111111111111111111111111111111111111' as Hex,
      };

      await expect(
        service.getPaymasterStubData(ineligibleUserOp, mockEntrypoint, mockChainId)
      ).rejects.toThrow('Transaction not eligible for gas sponsorship');

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should throw error if RPC call fails', async () => {
      const service = new PaymasterService(mockPaymasterUrl, memoryMatchGasPolicy);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(
        service.getPaymasterStubData(mockUserOp, mockEntrypoint, mockChainId)
      ).rejects.toThrow('Failed to get paymaster stub data');
    });

    it('should throw error if RPC returns error', async () => {
      const service = new PaymasterService(mockPaymasterUrl, memoryMatchGasPolicy);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          jsonrpc: '2.0',
          id: 1,
          error: { code: -32000, message: 'Insufficient gas credits' },
        }),
      });

      await expect(
        service.getPaymasterStubData(mockUserOp, mockEntrypoint, mockChainId)
      ).rejects.toThrow('Insufficient gas credits');
    });

    it('should include context in RPC call if provided', async () => {
      const service = new PaymasterService(mockPaymasterUrl, memoryMatchGasPolicy);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          jsonrpc: '2.0',
          id: 1,
          result: mockPaymasterResponse,
        }),
      });

      const context = {
        policyId: 'test-policy',
        sponsorshipInfo: { name: 'Test Sponsor' },
      };

      await service.getPaymasterStubData(mockUserOp, mockEntrypoint, mockChainId, context);

      const fetchCall = mockFetch.mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body.params[3]).toEqual(context);
    });
  });

  describe('getPaymasterData', () => {
    it('should successfully get paymaster data for eligible transaction', async () => {
      const service = new PaymasterService(mockPaymasterUrl, memoryMatchGasPolicy);

      const mockResponse = {
        ...mockPaymasterResponse,
        paymasterAndData: '0xPaymasterAndData' as Hex,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          jsonrpc: '2.0',
          id: 1,
          result: mockResponse,
        }),
      });

      const result = await service.getPaymasterData(mockUserOp, mockEntrypoint, mockChainId);

      expect(result).toEqual({
        paymaster: mockResponse.paymaster,
        paymasterData: mockResponse.paymasterData,
        paymasterVerificationGasLimit: 50000n,
        paymasterPostOpGasLimit: 50000n,
        paymasterAndData: mockResponse.paymasterAndData,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        mockPaymasterUrl,
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('pm_getPaymasterData'),
        })
      );
    });

    it('should log paymaster usage after successful sponsorship', async () => {
      const service = new PaymasterService(mockPaymasterUrl, memoryMatchGasPolicy);
      const consoleSpy = vi.spyOn(console, 'log');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          jsonrpc: '2.0',
          id: 1,
          result: {
            ...mockPaymasterResponse,
            paymasterAndData: '0xPaymasterAndData' as Hex,
          },
        }),
      });

      await service.getPaymasterData(mockUserOp, mockEntrypoint, mockChainId);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[PaymasterService] Usage logged:',
        expect.objectContaining({
          sender: mockUserOp.sender,
          sponsored: true,
        })
      );
    });

    it('should throw error if transaction is not eligible', async () => {
      const service = new PaymasterService(mockPaymasterUrl, memoryMatchGasPolicy);

      const ineligibleUserOp = {
        ...mockUserOp,
        callData: '0xb61d27f60000000000000000000000001111111111111111111111111111111111111111' as Hex,
      };

      await expect(
        service.getPaymasterData(ineligibleUserOp, mockEntrypoint, mockChainId)
      ).rejects.toThrow('Transaction not eligible for gas sponsorship');
    });
  });

  describe('isEligibleForSponsorship', () => {
    it('should return true for allowed contract', async () => {
      const service = new PaymasterService(mockPaymasterUrl, memoryMatchGasPolicy);

      const result = await service.isEligibleForSponsorship(mockUserOp);

      expect(result).toBe(true);
    });

    it('should return false for disallowed contract', async () => {
      const service = new PaymasterService(mockPaymasterUrl, memoryMatchGasPolicy);

      const disallowedUserOp = {
        ...mockUserOp,
        callData: '0xb61d27f60000000000000000000000001111111111111111111111111111111111111111' as Hex,
      };

      const result = await service.isEligibleForSponsorship(disallowedUserOp);

      expect(result).toBe(false);
    });

    it('should return false if gas limit exceeds policy', async () => {
      const service = new PaymasterService(mockPaymasterUrl, memoryMatchGasPolicy);

      const highGasUserOp = {
        ...mockUserOp,
        callGasLimit: 1000000n, // Exceeds 500,000 limit
      };

      const result = await service.isEligibleForSponsorship(highGasUserOp);

      expect(result).toBe(false);
    });

    it('should check function selector if configured in policy', async () => {
      const policyWithFunctions: GasPolicy = {
        ...memoryMatchGasPolicy,
        allowedFunctions: {
          '0x93aC1C769aCE5caE403a454cBd236aB2EA7B17F5': ['0xb61d27f6'], // execute function
        },
      };

      const service = new PaymasterService(mockPaymasterUrl, policyWithFunctions);

      const result = await service.isEligibleForSponsorship(mockUserOp);

      expect(result).toBe(true);
    });

    it('should return false for disallowed function selector', async () => {
      const policyWithFunctions: GasPolicy = {
        ...memoryMatchGasPolicy,
        allowedFunctions: {
          '0x93aC1C769aCE5caE403a454cBd236aB2EA7B17F5': ['0x12345678'], // Different function
        },
      };

      const service = new PaymasterService(mockPaymasterUrl, policyWithFunctions);

      const result = await service.isEligibleForSponsorship(mockUserOp);

      expect(result).toBe(false);
    });

    it('should return false and log error if callData is invalid', async () => {
      const service = new PaymasterService(mockPaymasterUrl, memoryMatchGasPolicy);
      const consoleErrorSpy = vi.spyOn(console, 'error');

      const invalidUserOp = {
        ...mockUserOp,
        callData: '0x1234' as Hex, // Too short
      };

      const result = await service.isEligibleForSponsorship(invalidUserOp);

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[PaymasterService] Error checking eligibility:',
        expect.any(Error)
      );
    });
  });

  describe('createPaymasterService', () => {
    it('should create a PaymasterService with default gas policy', () => {
      const service = createPaymasterService(mockPaymasterUrl);
      expect(service).toBeInstanceOf(PaymasterService);
    });

    it('should create a PaymasterService with custom gas policy', () => {
      const customPolicy: GasPolicy = {
        allowedContracts: ['0x1111111111111111111111111111111111111111' as Address],
        maxGasPerTransaction: 1000000n,
        maxTransactionsPerDay: 50,
      };

      const service = createPaymasterService(mockPaymasterUrl, customPolicy);
      expect(service).toBeInstanceOf(PaymasterService);
    });
  });

  describe('memoryMatchGasPolicy', () => {
    it('should have correct default values', () => {
      expect(memoryMatchGasPolicy.allowedContracts).toContain(
        '0x93aC1C769aCE5caE403a454cBd236aB2EA7B17F5'
      );
      expect(memoryMatchGasPolicy.maxGasPerTransaction).toBe(500000n);
      expect(memoryMatchGasPolicy.maxTransactionsPerDay).toBe(100);
    });
  });

  describe('error handling', () => {
    it('should handle network errors gracefully', async () => {
      const service = new PaymasterService(mockPaymasterUrl, memoryMatchGasPolicy);

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        service.getPaymasterStubData(mockUserOp, mockEntrypoint, mockChainId)
      ).rejects.toThrow('Failed to get paymaster stub data');
    });

    it('should handle malformed JSON response', async () => {
      const service = new PaymasterService(mockPaymasterUrl, memoryMatchGasPolicy);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await expect(
        service.getPaymasterStubData(mockUserOp, mockEntrypoint, mockChainId)
      ).rejects.toThrow('Failed to get paymaster stub data');
    });
  });

  describe('logging', () => {
    it('should log when requesting stub data', async () => {
      const service = new PaymasterService(mockPaymasterUrl, memoryMatchGasPolicy);
      const consoleSpy = vi.spyOn(console, 'log');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          jsonrpc: '2.0',
          id: 1,
          result: mockPaymasterResponse,
        }),
      });

      await service.getPaymasterStubData(mockUserOp, mockEntrypoint, mockChainId);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[PaymasterService] Requesting stub data for gas estimation',
        expect.any(Object)
      );
    });

    it('should log when transaction is eligible', async () => {
      const service = new PaymasterService(mockPaymasterUrl, memoryMatchGasPolicy);
      const consoleSpy = vi.spyOn(console, 'log');

      await service.isEligibleForSponsorship(mockUserOp);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[PaymasterService] Transaction eligible for sponsorship',
        expect.any(Object)
      );
    });

    it('should warn when contract is not allowed', async () => {
      const service = new PaymasterService(mockPaymasterUrl, memoryMatchGasPolicy);
      const consoleWarnSpy = vi.spyOn(console, 'warn');

      const disallowedUserOp = {
        ...mockUserOp,
        callData: '0xb61d27f60000000000000000000000001111111111111111111111111111111111111111' as Hex,
      };

      await service.isEligibleForSponsorship(disallowedUserOp);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[PaymasterService] Contract not in allowed list:',
        expect.any(String)
      );
    });
  });
});
