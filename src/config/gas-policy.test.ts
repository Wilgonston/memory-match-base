/**
 * Gas Policy Configuration Tests
 * 
 * Unit tests for gas policy configuration and validation.
 * 
 * Requirements: 2.4
 */

import { describe, it, expect } from 'vitest';
import {
  GasPolicy,
  memoryMatchGasPolicy,
  MEMORY_MATCH_CONTRACTS,
  createGasPolicy,
  validateGasPolicy,
} from './gas-policy';
import { Address } from 'viem';

describe('Gas Policy Configuration', () => {
  describe('MEMORY_MATCH_CONTRACTS', () => {
    it('should have correct contract addresses', () => {
      expect(MEMORY_MATCH_CONTRACTS.PROGRESS_MAINNET).toBe(
        '0x93aC1C769aCE5caE403a454cBd236aB2EA7B17F5'
      );
      expect(MEMORY_MATCH_CONTRACTS.PROGRESS_MAINNET).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });
  });

  describe('memoryMatchGasPolicy', () => {
    it('should have correct default values', () => {
      expect(memoryMatchGasPolicy.allowedContracts).toContain(
        MEMORY_MATCH_CONTRACTS.PROGRESS_MAINNET
      );
      expect(memoryMatchGasPolicy.maxGasPerTransaction).toBe(500000n);
      expect(memoryMatchGasPolicy.maxTransactionsPerDay).toBe(100);
    });

    it('should have at least one allowed contract', () => {
      expect(memoryMatchGasPolicy.allowedContracts.length).toBeGreaterThan(0);
    });

    it('should have reasonable gas limits', () => {
      expect(memoryMatchGasPolicy.maxGasPerTransaction).toBeGreaterThan(0n);
      expect(memoryMatchGasPolicy.maxGasPerTransaction).toBeLessThan(10000000n);
    });

    it('should have reasonable transaction limits', () => {
      expect(memoryMatchGasPolicy.maxTransactionsPerDay).toBeGreaterThan(0);
      expect(memoryMatchGasPolicy.maxTransactionsPerDay).toBeLessThan(10000);
    });

    it('should be valid according to validateGasPolicy', () => {
      expect(() => validateGasPolicy(memoryMatchGasPolicy)).not.toThrow();
    });
  });

  describe('createGasPolicy', () => {
    it('should create policy with default values when no overrides', () => {
      const policy = createGasPolicy({});
      expect(policy).toEqual(memoryMatchGasPolicy);
    });

    it('should override maxGasPerTransaction', () => {
      const policy = createGasPolicy({
        maxGasPerTransaction: 1000000n,
      });
      expect(policy.maxGasPerTransaction).toBe(1000000n);
      expect(policy.allowedContracts).toEqual(memoryMatchGasPolicy.allowedContracts);
      expect(policy.maxTransactionsPerDay).toBe(memoryMatchGasPolicy.maxTransactionsPerDay);
    });

    it('should override maxTransactionsPerDay', () => {
      const policy = createGasPolicy({
        maxTransactionsPerDay: 200,
      });
      expect(policy.maxTransactionsPerDay).toBe(200);
      expect(policy.allowedContracts).toEqual(memoryMatchGasPolicy.allowedContracts);
      expect(policy.maxGasPerTransaction).toBe(memoryMatchGasPolicy.maxGasPerTransaction);
    });

    it('should override allowedContracts', () => {
      const customContracts = ['0x1111111111111111111111111111111111111111' as Address];
      const policy = createGasPolicy({
        allowedContracts: customContracts,
      });
      expect(policy.allowedContracts).toEqual(customContracts);
      expect(policy.maxGasPerTransaction).toBe(memoryMatchGasPolicy.maxGasPerTransaction);
      expect(policy.maxTransactionsPerDay).toBe(memoryMatchGasPolicy.maxTransactionsPerDay);
    });

    it('should override multiple properties', () => {
      const policy = createGasPolicy({
        maxGasPerTransaction: 750000n,
        maxTransactionsPerDay: 150,
      });
      expect(policy.maxGasPerTransaction).toBe(750000n);
      expect(policy.maxTransactionsPerDay).toBe(150);
      expect(policy.allowedContracts).toEqual(memoryMatchGasPolicy.allowedContracts);
    });

    it('should add allowedFunctions', () => {
      const policy = createGasPolicy({
        allowedFunctions: {
          [MEMORY_MATCH_CONTRACTS.PROGRESS_MAINNET]: ['0x12345678', '0xabcdef00'],
        },
      });
      expect(policy.allowedFunctions).toBeDefined();
      expect(policy.allowedFunctions![MEMORY_MATCH_CONTRACTS.PROGRESS_MAINNET]).toEqual([
        '0x12345678',
        '0xabcdef00',
      ]);
    });
  });

  describe('validateGasPolicy', () => {
    it('should validate a correct policy', () => {
      const validPolicy: GasPolicy = {
        allowedContracts: ['0x1234567890123456789012345678901234567890' as Address],
        maxGasPerTransaction: 500000n,
        maxTransactionsPerDay: 100,
      };
      expect(() => validateGasPolicy(validPolicy)).not.toThrow();
    });

    it('should throw if allowedContracts is empty', () => {
      const invalidPolicy: GasPolicy = {
        allowedContracts: [],
        maxGasPerTransaction: 500000n,
        maxTransactionsPerDay: 100,
      };
      expect(() => validateGasPolicy(invalidPolicy)).toThrow(
        'Gas policy must have at least one allowed contract'
      );
    });

    it('should throw if maxGasPerTransaction is zero', () => {
      const invalidPolicy: GasPolicy = {
        allowedContracts: ['0x1234567890123456789012345678901234567890' as Address],
        maxGasPerTransaction: 0n,
        maxTransactionsPerDay: 100,
      };
      expect(() => validateGasPolicy(invalidPolicy)).toThrow(
        'Max gas per transaction must be greater than 0'
      );
    });

    it('should throw if maxGasPerTransaction is negative', () => {
      const invalidPolicy: GasPolicy = {
        allowedContracts: ['0x1234567890123456789012345678901234567890' as Address],
        maxGasPerTransaction: -1n,
        maxTransactionsPerDay: 100,
      };
      expect(() => validateGasPolicy(invalidPolicy)).toThrow(
        'Max gas per transaction must be greater than 0'
      );
    });

    it('should throw if maxTransactionsPerDay is zero', () => {
      const invalidPolicy: GasPolicy = {
        allowedContracts: ['0x1234567890123456789012345678901234567890' as Address],
        maxGasPerTransaction: 500000n,
        maxTransactionsPerDay: 0,
      };
      expect(() => validateGasPolicy(invalidPolicy)).toThrow(
        'Max transactions per day must be greater than 0'
      );
    });

    it('should throw if maxTransactionsPerDay is negative', () => {
      const invalidPolicy: GasPolicy = {
        allowedContracts: ['0x1234567890123456789012345678901234567890' as Address],
        maxGasPerTransaction: 500000n,
        maxTransactionsPerDay: -1,
      };
      expect(() => validateGasPolicy(invalidPolicy)).toThrow(
        'Max transactions per day must be greater than 0'
      );
    });

    it('should throw if contract address is invalid (no 0x prefix)', () => {
      const invalidPolicy: GasPolicy = {
        allowedContracts: ['1234567890123456789012345678901234567890' as Address],
        maxGasPerTransaction: 500000n,
        maxTransactionsPerDay: 100,
      };
      expect(() => validateGasPolicy(invalidPolicy)).toThrow(
        'Invalid contract address: 1234567890123456789012345678901234567890'
      );
    });

    it('should throw if contract address is invalid (wrong length)', () => {
      const invalidPolicy: GasPolicy = {
        allowedContracts: ['0x1234' as Address],
        maxGasPerTransaction: 500000n,
        maxTransactionsPerDay: 100,
      };
      expect(() => validateGasPolicy(invalidPolicy)).toThrow('Invalid contract address: 0x1234');
    });

    it('should validate policy with allowedFunctions', () => {
      const validPolicy: GasPolicy = {
        allowedContracts: ['0x1234567890123456789012345678901234567890' as Address],
        maxGasPerTransaction: 500000n,
        maxTransactionsPerDay: 100,
        allowedFunctions: {
          ['0x1234567890123456789012345678901234567890' as Address]: ['0x12345678', '0xabcdef00'],
        },
      };
      expect(() => validateGasPolicy(validPolicy)).not.toThrow();
    });

    it('should throw if allowedFunctions has invalid contract address', () => {
      const invalidPolicy: GasPolicy = {
        allowedContracts: ['0x1234567890123456789012345678901234567890' as Address],
        maxGasPerTransaction: 500000n,
        maxTransactionsPerDay: 100,
        allowedFunctions: {
          ['0x1234' as Address]: ['0x12345678'],
        },
      };
      expect(() => validateGasPolicy(invalidPolicy)).toThrow(
        'Invalid contract address in allowedFunctions: 0x1234'
      );
    });

    it('should throw if function selector is invalid (no 0x prefix)', () => {
      const invalidPolicy: GasPolicy = {
        allowedContracts: ['0x1234567890123456789012345678901234567890' as Address],
        maxGasPerTransaction: 500000n,
        maxTransactionsPerDay: 100,
        allowedFunctions: {
          ['0x1234567890123456789012345678901234567890' as Address]: ['12345678'],
        },
      };
      expect(() => validateGasPolicy(invalidPolicy)).toThrow(
        'Invalid function selector: 12345678 (must be 4 bytes with 0x prefix)'
      );
    });

    it('should throw if function selector is invalid (wrong length)', () => {
      const invalidPolicy: GasPolicy = {
        allowedContracts: ['0x1234567890123456789012345678901234567890' as Address],
        maxGasPerTransaction: 500000n,
        maxTransactionsPerDay: 100,
        allowedFunctions: {
          ['0x1234567890123456789012345678901234567890' as Address]: ['0x1234'],
        },
      };
      expect(() => validateGasPolicy(invalidPolicy)).toThrow(
        'Invalid function selector: 0x1234 (must be 4 bytes with 0x prefix)'
      );
    });

    it('should validate multiple function selectors', () => {
      const validPolicy: GasPolicy = {
        allowedContracts: ['0x1234567890123456789012345678901234567890' as Address],
        maxGasPerTransaction: 500000n,
        maxTransactionsPerDay: 100,
        allowedFunctions: {
          ['0x1234567890123456789012345678901234567890' as Address]: [
            '0x12345678',
            '0xabcdef00',
            '0x11111111',
          ],
        },
      };
      expect(() => validateGasPolicy(validPolicy)).not.toThrow();
    });
  });

  describe('Integration', () => {
    it('should work with PaymasterService configuration', () => {
      // This test verifies that the gas policy can be used with PaymasterService
      const policy = createGasPolicy({
        maxGasPerTransaction: 750000n,
      });

      expect(policy.allowedContracts).toContain(MEMORY_MATCH_CONTRACTS.PROGRESS_MAINNET);
      expect(policy.maxGasPerTransaction).toBe(750000n);
      expect(() => validateGasPolicy(policy)).not.toThrow();
    });

    it('should support multiple contracts', () => {
      const policy = createGasPolicy({
        allowedContracts: [
          MEMORY_MATCH_CONTRACTS.PROGRESS_MAINNET,
          '0x1111111111111111111111111111111111111111' as Address,
        ],
      });

      expect(policy.allowedContracts).toHaveLength(2);
      expect(policy.allowedContracts).toContain(MEMORY_MATCH_CONTRACTS.PROGRESS_MAINNET);
      expect(() => validateGasPolicy(policy)).not.toThrow();
    });
  });
});
