import { useState, useCallback } from 'react';
import { Address, Hex } from 'viem';
import { batchTransactionService, type Operation, type BatchPreview } from '../services/BatchTransactionService';

/**
 * Hook for managing batch transactions
 * 
 * Provides methods to add operations, preview batches, and execute
 * multiple operations in a single transaction.
 */
export function useBatchTransactions() {
  const [batchSize, setBatchSize] = useState(0);
  const [preview, setPreview] = useState<BatchPreview | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Add an operation to the batch
   */
  const addOperation = useCallback((operation: Operation) => {
    batchTransactionService.addOperation(operation);
    setBatchSize(batchTransactionService.getBatchSize());
    setError(null);
  }, []);

  /**
   * Get current batch
   */
  const getBatch = useCallback(() => {
    return batchTransactionService.getBatch();
  }, []);

  /**
   * Clear the batch
   */
  const clearBatch = useCallback(() => {
    batchTransactionService.clearBatch();
    setBatchSize(0);
    setPreview(null);
    setError(null);
  }, []);

  /**
   * Preview the batch before execution
   */
  const previewBatch = useCallback(async () => {
    try {
      setError(null);
      const batchPreview = await batchTransactionService.previewBatch();
      setPreview(batchPreview);
      return batchPreview;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to preview batch';
      setError(errorMessage);
      return null;
    }
  }, []);

  /**
   * Execute the batch transaction
   */
  const executeBatch = useCallback(async () => {
    try {
      setIsExecuting(true);
      setError(null);

      const result = await batchTransactionService.executeBatch();

      if (!result.success) {
        throw new Error(result.error || 'Batch execution failed');
      }

      // Clear state after successful execution
      setBatchSize(0);
      setPreview(null);

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Batch execution failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsExecuting(false);
    }
  }, []);

  /**
   * Remove an operation from the batch
   */
  const removeOperation = useCallback((index: number) => {
    try {
      batchTransactionService.removeOperation(index);
      setBatchSize(batchTransactionService.getBatchSize());
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove operation';
      setError(errorMessage);
    }
  }, []);

  /**
   * Check if batch is empty
   */
  const isEmpty = useCallback(() => {
    return batchTransactionService.isEmpty();
  }, []);

  return {
    batchSize,
    preview,
    isExecuting,
    error,
    addOperation,
    getBatch,
    clearBatch,
    previewBatch,
    executeBatch,
    removeOperation,
    isEmpty,
  };
}
