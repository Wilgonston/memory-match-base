/**
 * Property-Based Tests for WebhookHandler
 * 
 * These tests verify universal correctness properties across randomized inputs
 * using the fast-check library for property-based testing.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { privateKeyToAccount } from 'viem/accounts';
import { type Hex } from 'viem';
import { WebhookHandler, type WebhookEvent } from './WebhookHandler';

describe('WebhookHandler Property Tests', () => {
  let signerAccount: ReturnType<typeof privateKeyToAccount>;
  let webhookHandler: WebhookHandler;

  beforeEach(() => {
    // Create a test account for signing
    const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' as Hex;
    signerAccount = privateKeyToAccount(privateKey);
    
    // Create webhook handler with signer's address as secret
    webhookHandler = new WebhookHandler(signerAccount.address);
  });

  // Feature: base-ecosystem-integration, Property 2: For any webhook event received, the system should validate the cryptographic signature and reject events with invalid signatures
  describe('Property 2: Webhook Signature Validation', () => {
    it('should validate correctly signed webhook events', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random webhook event data
          fc.record({
            type: fc.constantFrom('install', 'uninstall', 'notification'),
            timestamp: fc.integer({ min: Date.now() - 300000, max: Date.now() }),
            userId: fc.string({ minLength: 1, maxLength: 50 }),
            data: fc.dictionary(
              fc.string({ minLength: 1, maxLength: 20 }),
              fc.oneof(
                fc.string(),
                fc.integer(),
                fc.boolean(),
                fc.constant(null)
              )
            )
          }),
          async (eventData) => {
            // Create the message to sign
            const message = JSON.stringify({
              type: eventData.type,
              timestamp: eventData.timestamp,
              userId: eventData.userId,
              data: eventData.data,
            });

            // Sign the message with the test account
            const signature = await signerAccount.signMessage({ message });

            // Create the webhook event with valid signature
            const event: WebhookEvent = {
              ...eventData,
              signature,
            };

            // Validate signature - should return true for correctly signed events
            const isValid = await webhookHandler.validateSignature(event, signerAccount.address);
            
            expect(isValid).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject webhook events with invalid signatures', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random webhook event data
          fc.record({
            type: fc.constantFrom('install', 'uninstall', 'notification'),
            timestamp: fc.integer({ min: Date.now() - 300000, max: Date.now() }),
            userId: fc.string({ minLength: 1, maxLength: 50 }),
            data: fc.dictionary(
              fc.string({ minLength: 1, maxLength: 20 }),
              fc.oneof(
                fc.string(),
                fc.integer(),
                fc.boolean(),
                fc.constant(null)
              )
            )
          }),
          // Generate random invalid signature
          fc.hexaString({ minLength: 130, maxLength: 132 }).map(s => `0x${s}` as Hex),
          async (eventData, invalidSignature) => {
            // Create the webhook event with invalid signature
            const event: WebhookEvent = {
              ...eventData,
              signature: invalidSignature,
            };

            // Validate signature - should return false for invalid signatures
            const isValid = await webhookHandler.validateSignature(event, signerAccount.address);
            
            expect(isValid).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject webhook events signed by different account', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random webhook event data
          fc.record({
            type: fc.constantFrom('install', 'uninstall', 'notification'),
            timestamp: fc.integer({ min: Date.now() - 300000, max: Date.now() }),
            userId: fc.string({ minLength: 1, maxLength: 50 }),
            data: fc.dictionary(
              fc.string({ minLength: 1, maxLength: 20 }),
              fc.oneof(
                fc.string(),
                fc.integer(),
                fc.boolean(),
                fc.constant(null)
              )
            )
          }),
          async (eventData) => {
            // Create a different account for signing
            const differentPrivateKey = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d' as Hex;
            const differentAccount = privateKeyToAccount(differentPrivateKey);

            // Create the message to sign
            const message = JSON.stringify({
              type: eventData.type,
              timestamp: eventData.timestamp,
              userId: eventData.userId,
              data: eventData.data,
            });

            // Sign with different account
            const signature = await differentAccount.signMessage({ message });

            // Create the webhook event
            const event: WebhookEvent = {
              ...eventData,
              signature,
            };

            // Validate signature with original signer's address - should return false
            const isValid = await webhookHandler.validateSignature(event, signerAccount.address);
            
            expect(isValid).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject webhook events with tampered data', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random webhook event data
          fc.record({
            type: fc.constantFrom('install', 'uninstall', 'notification'),
            timestamp: fc.integer({ min: Date.now() - 300000, max: Date.now() }),
            userId: fc.string({ minLength: 1, maxLength: 50 }),
            data: fc.dictionary(
              fc.string({ minLength: 1, maxLength: 20 }),
              fc.oneof(
                fc.string(),
                fc.integer(),
                fc.boolean(),
                fc.constant(null)
              )
            )
          }),
          async (eventData) => {
            // Create the message to sign
            const message = JSON.stringify({
              type: eventData.type,
              timestamp: eventData.timestamp,
              userId: eventData.userId,
              data: eventData.data,
            });

            // Sign the original message
            const signature = await signerAccount.signMessage({ message });

            // Tamper with the data after signing
            const tamperedEvent: WebhookEvent = {
              ...eventData,
              userId: eventData.userId + '_tampered',
              signature,
            };

            // Validate signature - should return false for tampered data
            const isValid = await webhookHandler.validateSignature(tamperedEvent, signerAccount.address);
            
            expect(isValid).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle malformed signatures gracefully', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random webhook event data
          fc.record({
            type: fc.constantFrom('install', 'uninstall', 'notification'),
            timestamp: fc.integer({ min: Date.now() - 300000, max: Date.now() }),
            userId: fc.string({ minLength: 1, maxLength: 50 }),
            data: fc.dictionary(
              fc.string({ minLength: 1, maxLength: 20 }),
              fc.oneof(
                fc.string(),
                fc.integer(),
                fc.boolean(),
                fc.constant(null)
              )
            )
          }),
          // Generate malformed signatures
          fc.oneof(
            fc.constant(''),
            fc.constant('0x'),
            fc.constant('invalid'),
            fc.string({ minLength: 1, maxLength: 50 }),
            fc.hexaString({ minLength: 10, maxLength: 50 })
          ),
          async (eventData, malformedSignature) => {
            // Create the webhook event with malformed signature
            const event: WebhookEvent = {
              ...eventData,
              signature: malformedSignature,
            };

            // Validate signature - should return false without throwing
            const isValid = await webhookHandler.validateSignature(event, signerAccount.address);
            
            expect(isValid).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
