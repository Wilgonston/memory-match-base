import { Address, Hex } from 'viem';
import { generateRandomHash } from '../utils/cryptoUtils';

/**
 * Represents a single operation in a batch transaction
 */
export interface Operation {
  target: Address;
  value: bigint;
  data: Hex;
  description: string;
}

/**
 * Preview of a batch transaction before execution
 */
export interface BatchPreview {
  operations: Operation[];
  totalGas: bigint;
  sponsored: boolean;
  errors: string[];
}

/**
 * Service for managing batch transactions
 * 
 * Allows multiple blockchain operations to be grouped and executed
 * in a single transaction, reducing gas costs and improving UX.
 */
export class BatchTransactionService {
  private operations: Operation[] = [];

  /**
   * Add an operation to the current batch
   * 
   * @param operation - The operation to add
   */
  addOperation(operation: Operation): void {
    this.operations.push(operation);
  }

  /**
   * Get all operations in the current batch
   * 
   * @returns Array of operations
   */
  getBatch(): Operation[] {
    return [...this.operations];
  }

  /**
   * Clear all operations from the batch
   */
  clearBatch(): void {
    this.operations = [];
  }

  /**
   * Get the number of operations in the batch
   * 
   * @returns Number of operations
   */
  getBatchSize(): number {
    return this.operations.length;
  }

  /**
   * Check if the batch is empty
   * 
   * @returns True if batch has no operations
   */
  isEmpty(): boolean {
    return this.operations.length === 0;
  }

  /**
   * Preview the batch before execution
   * 
   * Estimates gas, checks sponsorship eligibility, and validates operations
   * 
   * @returns Promise resolving to batch preview
   */
  async previewBatch(): Promise<BatchPreview> {
    const errors: string[] = [];

    // Validate operations
    if (this.operations.length === 0) {
      errors.push('Batch is empty');
    }

    // Validate each operation
    for (let i = 0; i < this.operations.length; i++) {
      const op = this.operations[i];
      
      if (!op.target || op.target === '0x0000000000000000000000000000000000000000') {
        errors.push(`Operation ${i}: Invalid target address`);
      }
      
      if (!op.data || op.data === '0x') {
        errors.push(`Operation ${i}: Missing transaction data`);
      }
      
      if (!op.description) {
        errors.push(`Operation ${i}: Missing description`);
      }
    }

    // Estimate total gas (simplified - in production would call estimateGas)
    const gasPerOperation = 100000n;
    const totalGas = BigInt(this.operations.length) * gasPerOperation;

    // Check if batch is eligible for sponsorship
    // In production, this would check with paymaster service
    const sponsored = this.operations.length > 0 && errors.length === 0;

    return {
      operations: this.getBatch(),
      totalGas,
      sponsored,
      errors,
    };
  }

  /**
   * Execute the batch transaction
   * 
   * In production, this would:
   * 1. Encode all operations into a single multicall
   * 2. Submit to the blockchain
   * 3. Wait for confirmation
   * 4. Handle partial failures
   * 
   * @returns Promise resolving to transaction receipt
   * @throws Error if batch is invalid or execution fails
   */
  async executeBatch(): Promise<{
    success: boolean;
    transactionHash?: string;
    failedOperations?: number[];
    error?: string;
  }> {
    // Preview to validate
    const preview = await this.previewBatch();
    
    if (preview.errors.length > 0) {
      throw new Error(`Batch validation failed: ${preview.errors.join(', ')}`);
    }

    if (this.operations.length === 0) {
      throw new Error('Cannot execute empty batch');
    }

    try {
      // In production, this would:
      // 1. Create multicall transaction
      // 2. Get paymaster sponsorship if eligible
      // 3. Submit transaction
      // 4. Wait for confirmation
      // 5. Parse results to identify failed operations
      
      const transactionHash = generateRandomHash();
      
      const failedOperations: number[] = [];
      
      this.clearBatch();
      
      return {
        success: true,
        transactionHash,
        failedOperations: failedOperations.length > 0 ? failedOperations : undefined,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Remove an operation from the batch by index
   * 
   * @param index - Index of operation to remove
   * @throws Error if index is out of bounds
   */
  removeOperation(index: number): void {
    if (index < 0 || index >= this.operations.length) {
      throw new Error(`Invalid operation index: ${index}`);
    }
    this.operations.splice(index, 1);
  }
}

export const batchTransactionService = new BatchTransactionService();
