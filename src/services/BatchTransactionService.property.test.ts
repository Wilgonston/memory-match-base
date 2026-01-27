import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { BatchTransactionService, type Operation } from './BatchTransactionService';
import type { Address, Hex } from 'viem';

describe('BatchTransactionService - Property Tests', () => {
  // Create a fresh service instance for each test
  const createService = () => new BatchTransactionService();

  // Arbitrary for generating valid operations
  const operationArbitrary = fc.record({
    target: fc.hexaString({ minLength: 40, maxLength: 40 }).map(
      (s) => `0x${s}` as Address
    ),
    value: fc.bigInt({ min: 0n, max: 1000000000000000000n }),
    data: fc.hexaString({ minLength: 8, maxLength: 100 }).map(
      (s) => `0x${s}` as Hex
    ),
    description: fc.string({ minLength: 1, maxLength: 100 }),
  });

  describe('Property 14: Batch Transaction Grouping', () => {
    /**
     * Feature: base-ecosystem-integration
     * Property 14: For any set of multiple offline level completions, the system 
     * should group them into a single batch transaction rather than individual transactions.
     * 
     * **Validates: Requirements 9.2**
     */
    it('should group multiple operations into a single batch', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(operationArbitrary, { minLength: 2, maxLength: 10 }),
          async (operations) => {
            const service = createService();
            
            // Add all operations to batch
            operations.forEach((op) => service.addOperation(op));

            // Verify all operations are in the batch
            const batch = service.getBatch();
            expect(batch.length).toBe(operations.length);

            // Verify each operation is present
            operations.forEach((op, index) => {
              expect(batch[index].target).toBe(op.target);
              expect(batch[index].value).toBe(op.value);
              expect(batch[index].data).toBe(op.data);
              expect(batch[index].description).toBe(op.description);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain operation order in batch', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(operationArbitrary, { minLength: 2, maxLength: 10 }),
          async (operations) => {
            const service = createService();
            operations.forEach((op) => service.addOperation(op));

            const batch = service.getBatch();

            // Verify operations are in the same order
            for (let i = 0; i < operations.length; i++) {
              expect(batch[i].target).toBe(operations[i].target);
              expect(batch[i].description).toBe(operations[i].description);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly report batch size', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(operationArbitrary, { minLength: 0, maxLength: 20 }),
          async (operations) => {
            const service = createService();
            operations.forEach((op) => service.addOperation(op));

            expect(service.getBatchSize()).toBe(operations.length);
            expect(service.isEmpty()).toBe(operations.length === 0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 15: Batch Transaction Atomicity', () => {
    /**
     * Feature: base-ecosystem-integration
     * Property 15: For any approved batch of operations, the system should execute 
     * all operations in a single on-chain transaction.
     * 
     * **Validates: Requirements 9.4**
     */
    it('should execute all operations in a single transaction', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(operationArbitrary, { minLength: 1, maxLength: 10 }),
          async (operations) => {
            const service = createService();
            operations.forEach((op) => service.addOperation(op));

            const result = await service.executeBatch();

            // Should succeed
            expect(result.success).toBe(true);
            
            // Should return a single transaction hash
            expect(result.transactionHash).toBeDefined();
            expect(typeof result.transactionHash).toBe('string');
            expect(result.transactionHash?.startsWith('0x')).toBe(true);

            // Batch should be cleared after execution
            expect(service.isEmpty()).toBe(true);
            expect(service.getBatchSize()).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should clear batch after successful execution', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(operationArbitrary, { minLength: 1, maxLength: 10 }),
          async (operations) => {
            const service = createService();
            operations.forEach((op) => service.addOperation(op));

            const sizeBefore = service.getBatchSize();
            expect(sizeBefore).toBe(operations.length);

            await service.executeBatch();

            // Batch should be empty after execution
            expect(service.getBatchSize()).toBe(0);
            expect(service.isEmpty()).toBe(true);
            expect(service.getBatch()).toEqual([]);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not execute empty batch', async () => {
      await fc.assert(
        fc.asyncProperty(fc.constant(null), async () => {
          const service = createService();
          // Don't add any operations
          expect(service.isEmpty()).toBe(true);

          // Attempt to execute should throw
          await expect(service.executeBatch()).rejects.toThrow(
            'Batch validation failed'
          );
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 16: Batch Partial Failure Handling', () => {
    /**
     * Feature: base-ecosystem-integration
     * Property 16: For any batch transaction where some operations fail, the system 
     * should identify which operations failed and provide detailed error information for each.
     * 
     * **Validates: Requirements 9.5, 9.6**
     */
    it('should validate operations before execution', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(operationArbitrary, { minLength: 1, maxLength: 5 }),
          async (operations) => {
            const service = createService();
            operations.forEach((op) => service.addOperation(op));

            const preview = await service.previewBatch();

            // Preview should contain all operations
            expect(preview.operations.length).toBe(operations.length);
            
            // Should estimate gas
            expect(preview.totalGas).toBeGreaterThan(0n);
            
            // Should indicate sponsorship eligibility
            expect(typeof preview.sponsored).toBe('boolean');
            
            // Should have errors array (may be empty for valid operations)
            expect(Array.isArray(preview.errors)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should detect invalid operations in preview', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            target: fc.constant('0x0000000000000000000000000000000000000000' as Address),
            value: fc.bigInt({ min: 0n, max: 1000000000000000000n }),
            data: fc.constant('0x' as Hex), // Empty data
            description: fc.constant(''), // Empty description
          }),
          async (invalidOp) => {
            const service = createService();
            service.addOperation(invalidOp);

            const preview = await service.previewBatch();

            // Should have validation errors
            expect(preview.errors.length).toBeGreaterThan(0);
            
            // Should not be sponsored if invalid
            expect(preview.sponsored).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should provide detailed error information', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              target: fc.constant('0x0000000000000000000000000000000000000000' as Address),
              value: fc.bigInt({ min: 0n, max: 1000000000000000000n }),
              data: fc.constant('0x' as Hex),
              description: fc.constant(''),
            }),
            { minLength: 1, maxLength: 3 }
          ),
          async (invalidOps) => {
            const service = createService();
            invalidOps.forEach((op) => service.addOperation(op));

            const preview = await service.previewBatch();

            // Each invalid operation should generate errors
            expect(preview.errors.length).toBeGreaterThan(0);
            
            // Errors should be descriptive strings
            preview.errors.forEach((error) => {
              expect(typeof error).toBe('string');
              expect(error.length).toBeGreaterThan(0);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow removal of specific operations', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(operationArbitrary, { minLength: 3, maxLength: 10 }),
          fc.integer({ min: 0, max: 9 }),
          async (operations, removeIndexRaw) => {
            const service = createService();
            operations.forEach((op) => service.addOperation(op));

            const initialSize = service.getBatchSize();
            const removeIndex = removeIndexRaw % initialSize;

            // Remove operation at index
            service.removeOperation(removeIndex);

            // Batch size should decrease by 1
            expect(service.getBatchSize()).toBe(initialSize - 1);

            // Removed operation should not be in batch
            const batch = service.getBatch();
            expect(batch.length).toBe(initialSize - 1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should throw error when removing invalid index', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(operationArbitrary, { minLength: 1, maxLength: 5 }),
          async (operations) => {
            const service = createService();
            operations.forEach((op) => service.addOperation(op));

            const size = service.getBatchSize();

            // Try to remove at invalid indices
            expect(() => service.removeOperation(-1)).toThrow('Invalid operation index');
            expect(() => service.removeOperation(size)).toThrow('Invalid operation index');
            expect(() => service.removeOperation(size + 10)).toThrow('Invalid operation index');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Batch Management', () => {
    it('should clear batch on demand', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(operationArbitrary, { minLength: 1, maxLength: 10 }),
          async (operations) => {
            const service = createService();
            operations.forEach((op) => service.addOperation(op));

            expect(service.getBatchSize()).toBe(operations.length);

            service.clearBatch();

            expect(service.getBatchSize()).toBe(0);
            expect(service.isEmpty()).toBe(true);
            expect(service.getBatch()).toEqual([]);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return independent copy of batch', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(operationArbitrary, { minLength: 1, maxLength: 5 }),
          async (operations) => {
            const service = createService();
            operations.forEach((op) => service.addOperation(op));

            const batch1 = service.getBatch();
            const batch2 = service.getBatch();

            // Should be equal but not the same reference
            expect(batch1).toEqual(batch2);
            expect(batch1).not.toBe(batch2);

            // Modifying returned batch should not affect service
            batch1.pop();
            expect(service.getBatchSize()).toBe(operations.length);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
