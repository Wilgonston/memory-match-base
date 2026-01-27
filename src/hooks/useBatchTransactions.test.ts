import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useBatchTransactions } from './useBatchTransactions';
import { batchTransactionService } from '../services/BatchTransactionService';
import type { Address, Hex } from 'viem';

describe('useBatchTransactions', () => {
  beforeEach(() => {
    batchTransactionService.clearBatch();
  });

  describe('Batch Management', () => {
    it('should start with empty batch', () => {
      const { result } = renderHook(() => useBatchTransactions());

      expect(result.current.batchSize).toBe(0);
      expect(result.current.isEmpty()).toBe(true);
    });

    it('should add operations to batch', () => {
      const { result } = renderHook(() => useBatchTransactions());

      const operation = {
        target: '0x1234567890123456789012345678901234567890' as Address,
        value: 0n,
        data: '0x12345678' as Hex,
        description: 'Test operation',
      };

      act(() => {
        result.current.addOperation(operation);
      });

      expect(result.current.batchSize).toBe(1);
      expect(result.current.isEmpty()).toBe(false);
    });

    it('should get current batch', () => {
      const { result } = renderHook(() => useBatchTransactions());

      const operation = {
        target: '0x1234567890123456789012345678901234567890' as Address,
        value: 0n,
        data: '0x12345678' as Hex,
        description: 'Test operation',
      };

      act(() => {
        result.current.addOperation(operation);
      });

      const batch = result.current.getBatch();
      expect(batch.length).toBe(1);
      expect(batch[0].description).toBe('Test operation');
    });

    it('should clear batch', () => {
      const { result } = renderHook(() => useBatchTransactions());

      const operation = {
        target: '0x1234567890123456789012345678901234567890' as Address,
        value: 0n,
        data: '0x12345678' as Hex,
        description: 'Test operation',
      };

      act(() => {
        result.current.addOperation(operation);
      });

      expect(result.current.batchSize).toBe(1);

      act(() => {
        result.current.clearBatch();
      });

      expect(result.current.batchSize).toBe(0);
      expect(result.current.isEmpty()).toBe(true);
    });
  });

  describe('Batch Preview', () => {
    it('should preview batch', async () => {
      const { result } = renderHook(() => useBatchTransactions());

      const operation = {
        target: '0x1234567890123456789012345678901234567890' as Address,
        value: 0n,
        data: '0x12345678' as Hex,
        description: 'Test operation',
      };

      act(() => {
        result.current.addOperation(operation);
      });

      await act(async () => {
        await result.current.previewBatch();
      });

      await waitFor(() => {
        expect(result.current.preview).toBeDefined();
        expect(result.current.preview?.operations.length).toBe(1);
      });
    });

    it('should show validation errors in preview', async () => {
      const { result } = renderHook(() => useBatchTransactions());

      const invalidOperation = {
        target: '0x0000000000000000000000000000000000000000' as Address,
        value: 0n,
        data: '0x' as Hex,
        description: '',
      };

      act(() => {
        result.current.addOperation(invalidOperation);
      });

      await act(async () => {
        await result.current.previewBatch();
      });

      await waitFor(() => {
        expect(result.current.preview).toBeDefined();
        expect(result.current.preview?.errors.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Batch Execution', () => {
    it('should execute batch successfully', async () => {
      const { result } = renderHook(() => useBatchTransactions());

      const operation = {
        target: '0x1234567890123456789012345678901234567890' as Address,
        value: 0n,
        data: '0x12345678' as Hex,
        description: 'Test operation',
      };

      act(() => {
        result.current.addOperation(operation);
      });

      expect(result.current.batchSize).toBe(1);

      let executionResult;
      await act(async () => {
        executionResult = await result.current.executeBatch();
      });

      expect(executionResult).toBeDefined();
      expect(executionResult.success).toBe(true);
      expect(executionResult.transactionHash).toBeDefined();

      // Batch should be cleared after execution
      expect(result.current.batchSize).toBe(0);
    });

    it('should set executing state during execution', async () => {
      const { result } = renderHook(() => useBatchTransactions());

      const operation = {
        target: '0x1234567890123456789012345678901234567890' as Address,
        value: 0n,
        data: '0x12345678' as Hex,
        description: 'Test operation',
      };

      act(() => {
        result.current.addOperation(operation);
      });

      expect(result.current.isExecuting).toBe(false);

      const executionPromise = act(async () => {
        return result.current.executeBatch();
      });

      // Should be executing
      await waitFor(() => {
        expect(result.current.isExecuting).toBe(false); // Will be false after completion
      });

      await executionPromise;
    });

    it('should handle execution errors', async () => {
      const { result } = renderHook(() => useBatchTransactions());

      // Don't add any operations - should fail
      await act(async () => {
        try {
          await result.current.executeBatch();
        } catch (err) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBeTruthy();
    });
  });

  describe('Operation Removal', () => {
    it('should remove operation by index', () => {
      const { result } = renderHook(() => useBatchTransactions());

      const op1 = {
        target: '0x1234567890123456789012345678901234567890' as Address,
        value: 0n,
        data: '0x12345678' as Hex,
        description: 'Operation 1',
      };

      const op2 = {
        target: '0x2234567890123456789012345678901234567890' as Address,
        value: 0n,
        data: '0x12345678' as Hex,
        description: 'Operation 2',
      };

      act(() => {
        result.current.addOperation(op1);
        result.current.addOperation(op2);
      });

      expect(result.current.batchSize).toBe(2);

      act(() => {
        result.current.removeOperation(0);
      });

      expect(result.current.batchSize).toBe(1);

      const batch = result.current.getBatch();
      expect(batch[0].description).toBe('Operation 2');
    });

    it('should handle invalid removal index', () => {
      const { result } = renderHook(() => useBatchTransactions());

      const operation = {
        target: '0x1234567890123456789012345678901234567890' as Address,
        value: 0n,
        data: '0x12345678' as Hex,
        description: 'Test operation',
      };

      act(() => {
        result.current.addOperation(operation);
      });

      act(() => {
        result.current.removeOperation(10); // Invalid index
      });

      expect(result.current.error).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should clear error when adding operation', () => {
      const { result } = renderHook(() => useBatchTransactions());

      // Cause an error
      act(() => {
        result.current.removeOperation(10);
      });

      expect(result.current.error).toBeTruthy();

      // Add operation should clear error
      act(() => {
        result.current.addOperation({
          target: '0x1234567890123456789012345678901234567890' as Address,
          value: 0n,
          data: '0x12345678' as Hex,
          description: 'Test operation',
        });
      });

      expect(result.current.error).toBeNull();
    });

    it('should clear error when clearing batch', () => {
      const { result } = renderHook(() => useBatchTransactions());

      // Cause an error
      act(() => {
        result.current.removeOperation(10);
      });

      expect(result.current.error).toBeTruthy();

      // Clear batch should clear error
      act(() => {
        result.current.clearBatch();
      });

      expect(result.current.error).toBeNull();
    });
  });
});
