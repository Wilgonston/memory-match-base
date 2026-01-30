/**
 * Unit tests for usePaymasterTransaction hook
 * 
 * Tests the integration of PaymasterService with transaction execution,
 * including fallback logic and logging.
 * 
 * Requirements: 2.5, 2.6, 2.7
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { usePaymasterTransaction } from './usePaymasterTransaction';
import { PaymasterService } from '../services/PaymasterService';
import { Address, Hex } from 'viem';
import * as wagmi from 'wagmi';

// Mock wagmi hooks
vi.mock('wagmi', () => ({
  useAccount: vi.fn(),
  useWriteContract: vi.fn(),
  useWaitForTransactionReceipt: vi.fn(),
}));

// Mock performance monitor
vi.mock('../utils/performance', () => ({
  performanceMonitor: {
    recordMetric: vi.fn(),
  },
}));

describe('usePaymasterTransaction', () => {
  const mockAddress = '0x1234567890123456789012345678901234567890' as Address;
  const mockContractAddress = '0x93aC1C769aCE5caE403a454cBd236aB2EA7B17F5' as Address;
  const mockTxHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890' as Hex;
  const mockAbi = [
    {
      name: 'update',
      type: 'function',
      inputs: [
        { name: 'level', type: 'uint256' },
        { name: 'stars', type: 'uint256' },
      ],
      outputs: [],
    },
  ];

  let mockWriteContractAsync: ReturnType<typeof vi.fn>;
  let mockPaymasterService: PaymasterService;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Setup console spies
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Mock writeContractAsync
    mockWriteContractAsync = vi.fn().mockResolvedValue(mockTxHash);

    // Mock wagmi hooks
    vi.mocked(wagmi.useAccount).mockReturnValue({
      address: mockAddress,
      isConnected: true,
    } as ReturnType<typeof wagmi.useAccount>);

    vi.mocked(wagmi.useWriteContract).mockReturnValue({
      writeContractAsync: mockWriteContractAsync,
    } as unknown as ReturnType<typeof wagmi.useWriteContract>);

    vi.mocked(wagmi.useWaitForTransactionReceipt).mockReturnValue({
      data: undefined,
    } as ReturnType<typeof wagmi.useWaitForTransactionReceipt>);

    // Create mock paymaster service
    mockPaymasterService = {
      isEligibleForSponsorship: vi.fn().mockResolvedValue(true),
      getPaymasterData: vi.fn().mockResolvedValue({
        paymaster: '0x1111111111111111111111111111111111111111' as Address,
        paymasterData: '0x' as Hex,
        paymasterVerificationGasLimit: 100000n,
        paymasterPostOpGasLimit: 50000n,
        paymasterAndData: '0xabcd' as Hex,
      }),
    } as unknown as PaymasterService;
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  describe('Successful sponsorship flow', () => {
    it('should execute transaction with paymaster sponsorship', async () => {
      const onSuccess = vi.fn();
      const { result } = renderHook(() =>
        usePaymasterTransaction({
          paymasterService: mockPaymasterService,
          address: mockContractAddress,
          abi: mockAbi,
          functionName: 'update',
          args: [1, 3],
          onSuccess,
        })
      );

      // Initial state
      expect(result.current.status).toBe('idle');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isSponsored).toBe(false);

      // Execute transaction
      await result.current.execute();

      // Wait for state updates
      await waitFor(() => {
        expect(result.current.status).toBe('pending');
      });

      // Verify paymaster was attempted
      expect(result.current.paymasterAttempted).toBe(true);
      expect(result.current.paymasterSucceeded).toBe(true);
      expect(result.current.isSponsored).toBe(true);

      // Verify paymaster methods were called
      expect(mockPaymasterService.isEligibleForSponsorship).toHaveBeenCalled();
      expect(mockPaymasterService.getPaymasterData).toHaveBeenCalled();

      // Verify transaction was submitted
      expect(mockWriteContractAsync).toHaveBeenCalledWith({
        address: mockContractAddress,
        abi: mockAbi,
        functionName: 'update',
        args: [1, 3],
      });

      // Verify hash is set
      expect(result.current.hash).toBe(mockTxHash);
    });

    it('should log paymaster usage for monitoring', async () => {
      const { result } = renderHook(() =>
        usePaymasterTransaction({
          paymasterService: mockPaymasterService,
          address: mockContractAddress,
          abi: mockAbi,
          functionName: 'update',
          args: [1, 3],
        })
      );

      await result.current.execute();

      await waitFor(() => {
        expect(result.current.status).toBe('pending');
      });

      // Verify logging (Requirement 2.7)
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[usePaymasterTransaction] Paymaster usage:',
        expect.objectContaining({
          timestamp: expect.any(String),
          user: mockAddress,
          contract: mockContractAddress,
          function: 'update',
          sponsored: true,
          paymaster: expect.any(String),
        })
      );
    });
  });

  describe('Fallback to user-paid on paymaster failure', () => {
    it('should fall back to user-paid when paymaster fails', async () => {
      // Make paymaster fail
      const paymasterError = new Error('Paymaster service unavailable');
      mockPaymasterService.getPaymasterData = vi.fn().mockRejectedValue(paymasterError);

      const onSuccess = vi.fn();
      const { result } = renderHook(() =>
        usePaymasterTransaction({
          paymasterService: mockPaymasterService,
          address: mockContractAddress,
          abi: mockAbi,
          functionName: 'update',
          args: [1, 3],
          onSuccess,
        })
      );

      await result.current.execute();

      await waitFor(() => {
        expect(result.current.status).toBe('pending');
      });

      // Verify paymaster was attempted but failed
      expect(result.current.paymasterAttempted).toBe(true);
      expect(result.current.paymasterSucceeded).toBe(false);
      expect(result.current.isSponsored).toBe(false);

      // Verify fallback warning was logged (Requirement 2.5)
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[usePaymasterTransaction] Paymaster failed, falling back to user-paid:',
        paymasterError
      );

      // Verify fallback logging
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[usePaymasterTransaction] Fallback to user-paid:',
        expect.objectContaining({
          timestamp: expect.any(String),
          user: mockAddress,
          contract: mockContractAddress,
          function: 'update',
          sponsored: false,
          reason: 'Paymaster service unavailable',
        })
      );

      // Verify transaction still executed
      expect(mockWriteContractAsync).toHaveBeenCalled();
      expect(result.current.hash).toBe(mockTxHash);
    });

    it('should fall back when transaction is not eligible', async () => {
      // Make transaction ineligible
      mockPaymasterService.isEligibleForSponsorship = vi.fn().mockResolvedValue(false);

      const { result } = renderHook(() =>
        usePaymasterTransaction({
          paymasterService: mockPaymasterService,
          address: mockContractAddress,
          abi: mockAbi,
          functionName: 'update',
          args: [1, 3],
        })
      );

      await result.current.execute();

      await waitFor(() => {
        expect(result.current.status).toBe('pending');
      });

      // Verify paymaster was attempted but not succeeded
      expect(result.current.paymasterAttempted).toBe(true);
      expect(result.current.paymasterSucceeded).toBe(false);
      expect(result.current.isSponsored).toBe(false);

      // Verify getPaymasterData was not called
      expect(mockPaymasterService.getPaymasterData).not.toHaveBeenCalled();

      // Verify transaction still executed
      expect(mockWriteContractAsync).toHaveBeenCalled();
    });
  });

  describe('User-paid transactions without paymaster', () => {
    it('should execute user-paid transaction when no paymaster service', async () => {
      const { result } = renderHook(() =>
        usePaymasterTransaction({
          // No paymaster service
          address: mockContractAddress,
          abi: mockAbi,
          functionName: 'update',
          args: [1, 3],
        })
      );

      await result.current.execute();

      await waitFor(() => {
        expect(result.current.status).toBe('pending');
      });

      // Verify no paymaster attempt
      expect(result.current.paymasterAttempted).toBe(false);
      expect(result.current.paymasterSucceeded).toBe(false);
      expect(result.current.isSponsored).toBe(false);

      // Verify transaction executed
      expect(mockWriteContractAsync).toHaveBeenCalled();
      expect(result.current.hash).toBe(mockTxHash);

      // Verify logging
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[usePaymasterTransaction] No paymaster service configured, using user-paid transaction'
      );
    });
  });

  describe('Error handling', () => {
    it('should handle transaction execution errors', async () => {
      const txError = new Error('Transaction failed');
      mockWriteContractAsync.mockRejectedValue(txError);

      const onError = vi.fn();
      const { result } = renderHook(() =>
        usePaymasterTransaction({
          address: mockContractAddress,
          abi: mockAbi,
          functionName: 'update',
          args: [1, 3],
          onError,
        })
      );

      await result.current.execute();

      await waitFor(() => {
        expect(result.current.status).toBe('error');
      });

      // Verify error state
      expect(result.current.error).toBe('Transaction failed');
      expect(result.current.isLoading).toBe(false);

      // Verify error callback
      expect(onError).toHaveBeenCalledWith(txError);
    });

    it('should handle missing wallet connection', async () => {
      // Mock no wallet connected
      vi.mocked(wagmi.useAccount).mockReturnValue({
        address: undefined,
        isConnected: false,
      } as ReturnType<typeof wagmi.useAccount>);

      const onError = vi.fn();
      const { result } = renderHook(() =>
        usePaymasterTransaction({
          address: mockContractAddress,
          abi: mockAbi,
          functionName: 'update',
          args: [1, 3],
          onError,
        })
      );

      await result.current.execute();

      await waitFor(() => {
        expect(result.current.status).toBe('error');
      });

      // Verify error
      expect(result.current.error).toBe('Wallet not connected');
      expect(onError).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Wallet not connected',
      }));
    });
  });

  describe('Transaction receipt handling', () => {
    it('should update status when transaction succeeds', async () => {
      const onSuccess = vi.fn();
      const { result, rerender } = renderHook(() =>
        usePaymasterTransaction({
          address: mockContractAddress,
          abi: mockAbi,
          functionName: 'update',
          args: [1, 3],
          onSuccess,
        })
      );

      await result.current.execute();

      await waitFor(() => {
        expect(result.current.status).toBe('pending');
      });

      // Mock receipt received
      vi.mocked(wagmi.useWaitForTransactionReceipt).mockReturnValue({
        data: {
          status: 'success',
          transactionHash: mockTxHash,
        },
      } as ReturnType<typeof wagmi.useWaitForTransactionReceipt>);

      rerender();

      await waitFor(() => {
        expect(result.current.status).toBe('success');
      });

      expect(result.current.isLoading).toBe(false);
      expect(onSuccess).toHaveBeenCalledWith(mockTxHash);
    });

    it('should handle transaction revert', async () => {
      const onError = vi.fn();
      const { result, rerender } = renderHook(() =>
        usePaymasterTransaction({
          address: mockContractAddress,
          abi: mockAbi,
          functionName: 'update',
          args: [1, 3],
          onError,
        })
      );

      await result.current.execute();

      await waitFor(() => {
        expect(result.current.status).toBe('pending');
      });

      // Mock receipt with revert
      vi.mocked(wagmi.useWaitForTransactionReceipt).mockReturnValue({
        data: {
          status: 'reverted',
          transactionHash: mockTxHash,
        },
      } as unknown as ReturnType<typeof wagmi.useWaitForTransactionReceipt>);

      rerender();

      await waitFor(() => {
        expect(result.current.status).toBe('error');
      });

      expect(result.current.error).toBe('Transaction reverted');
      expect(onError).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Transaction reverted',
      }));
    });
  });
});
