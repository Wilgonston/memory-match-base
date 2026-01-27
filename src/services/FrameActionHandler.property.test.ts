/**
 * Property-Based Tests for FrameActionHandler
 * 
 * These tests verify universal correctness properties across randomized inputs
 * using the fast-check library for property-based testing.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { privateKeyToAccount } from 'viem/accounts';
import { type Hex } from 'viem';
import {
  FrameActionHandler,
  type FrameActionData,
} from './FrameActionHandler';

describe('FrameActionHandler Property Tests', () => {
  let signerAccount: ReturnType<typeof privateKeyToAccount>;
  let handler: FrameActionHandler;

  beforeEach(() => {
    // Create a test account for signing
    const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' as Hex;
    signerAccount = privateKeyToAccount(privateKey);
    
    // Create handler
    handler = new FrameActionHandler('https://example.com');
  });

  // Feature: base-ecosystem-integration, Property 5: For any Frame action received, the system should validate the signature and reject actions with invalid signatures
  describe('Property 5: Frame Signature Validation', () => {
    it('should validate correctly signed frame actions', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random frame action data
          fc.record({
            fid: fc.integer({ min: 1, max: 1000000 }),
            url: fc.webUrl().map(url => `${url}?level=${fc.sample(fc.integer({ min: 1, max: 100 }), 1)[0]}`),
            messageHash: fc.hexaString({ minLength: 64, maxLength: 64 }).map(s => `0x${s}`),
            timestamp: fc.integer({ min: Math.floor((Date.now() - 4 * 60 * 1000) / 1000), max: Math.floor(Date.now() / 1000) }),
            network: fc.constantFrom(1, 10, 8453), // Ethereum, Optimism, Base
            buttonIndex: fc.integer({ min: 1, max: 4 }),
            inputText: fc.option(fc.string({ minLength: 0, maxLength: 100 }), { nil: undefined }),
            state: fc.option(fc.string({ minLength: 0, maxLength: 100 }), { nil: undefined }),
            transactionId: fc.option(fc.hexaString({ minLength: 64, maxLength: 64 }).map(s => `0x${s}`), { nil: undefined }),
          }),
          async (actionData) => {
            // Create the message to sign
            const message = JSON.stringify({
              fid: actionData.fid,
              url: actionData.url,
              messageHash: actionData.messageHash,
              timestamp: actionData.timestamp,
              network: actionData.network,
              buttonIndex: actionData.buttonIndex,
              inputText: actionData.inputText,
              state: actionData.state,
              transactionId: actionData.transactionId,
            });

            // Sign the message with the test account
            const signature = await signerAccount.signMessage({ message });

            // Create the frame action with valid signature
            const action: FrameActionData = {
              ...actionData,
              signature,
            };

            // Validate signature - should return true for correctly signed actions
            const isValid = await handler.validateSignature(action, signerAccount.address);
            
            expect(isValid).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject frame actions with invalid signatures', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random frame action data
          fc.record({
            fid: fc.integer({ min: 1, max: 1000000 }),
            url: fc.webUrl().map(url => `${url}?level=${fc.sample(fc.integer({ min: 1, max: 100 }), 1)[0]}`),
            messageHash: fc.hexaString({ minLength: 64, maxLength: 64 }).map(s => `0x${s}`),
            timestamp: fc.integer({ min: Math.floor((Date.now() - 4 * 60 * 1000) / 1000), max: Math.floor(Date.now() / 1000) }),
            network: fc.constantFrom(1, 10, 8453),
            buttonIndex: fc.integer({ min: 1, max: 4 }),
          }),
          async (actionData) => {
            // Generate a random but structurally invalid signature
            // Valid signatures are 132 chars (0x + 130 hex chars), but with wrong content
            const randomHex = Array.from({ length: 130 }, () => 
              Math.floor(Math.random() * 16).toString(16)
            ).join('');
            const invalidSignature = `0x${randomHex}` as Hex;

            // Create the frame action with invalid signature
            const action: FrameActionData = {
              ...actionData,
              signature: invalidSignature,
            };

            // Validate signature - should return false for invalid signatures
            // The handler should catch any errors and return false
            const isValid = await handler.validateSignature(action, signerAccount.address);
            
            expect(isValid).toBe(false);
          }
        ),
        { numRuns: 50 } // Reduced runs since we're not using fc for signature generation
      );
    });

    it('should reject frame actions signed by different account', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random frame action data
          fc.record({
            fid: fc.integer({ min: 1, max: 1000000 }),
            url: fc.webUrl().map(url => `${url}?level=${fc.sample(fc.integer({ min: 1, max: 100 }), 1)[0]}`),
            messageHash: fc.hexaString({ minLength: 64, maxLength: 64 }).map(s => `0x${s}`),
            timestamp: fc.integer({ min: Math.floor((Date.now() - 4 * 60 * 1000) / 1000), max: Math.floor(Date.now() / 1000) }),
            network: fc.constantFrom(1, 10, 8453),
            buttonIndex: fc.integer({ min: 1, max: 4 }),
          }),
          async (actionData) => {
            // Create a different account for signing
            const differentPrivateKey = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d' as Hex;
            const differentAccount = privateKeyToAccount(differentPrivateKey);

            // Create the message to sign
            const message = JSON.stringify({
              fid: actionData.fid,
              url: actionData.url,
              messageHash: actionData.messageHash,
              timestamp: actionData.timestamp,
              network: actionData.network,
              buttonIndex: actionData.buttonIndex,
              inputText: undefined,
              state: undefined,
              transactionId: undefined,
            });

            // Sign with different account
            const signature = await differentAccount.signMessage({ message });

            // Create the frame action
            const action: FrameActionData = {
              ...actionData,
              signature,
            };

            // Validate signature with original signer's address - should return false
            const isValid = await handler.validateSignature(action, signerAccount.address);
            
            expect(isValid).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject frame actions with tampered data', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random frame action data
          fc.record({
            fid: fc.integer({ min: 1, max: 1000000 }),
            url: fc.webUrl().map(url => `${url}?level=${fc.sample(fc.integer({ min: 1, max: 100 }), 1)[0]}`),
            messageHash: fc.hexaString({ minLength: 64, maxLength: 64 }).map(s => `0x${s}`),
            timestamp: fc.integer({ min: Math.floor((Date.now() - 4 * 60 * 1000) / 1000), max: Math.floor(Date.now() / 1000) }),
            network: fc.constantFrom(1, 10, 8453),
            buttonIndex: fc.integer({ min: 1, max: 4 }),
          }),
          async (actionData) => {
            // Create the message to sign
            const message = JSON.stringify({
              fid: actionData.fid,
              url: actionData.url,
              messageHash: actionData.messageHash,
              timestamp: actionData.timestamp,
              network: actionData.network,
              buttonIndex: actionData.buttonIndex,
              inputText: undefined,
              state: undefined,
              transactionId: undefined,
            });

            // Sign the original message
            const signature = await signerAccount.signMessage({ message });

            // Tamper with the data after signing
            const tamperedAction: FrameActionData = {
              ...actionData,
              fid: actionData.fid + 1, // Tamper with FID
              signature,
            };

            // Validate signature - should return false for tampered data
            const isValid = await handler.validateSignature(tamperedAction, signerAccount.address);
            
            expect(isValid).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle malformed signatures gracefully', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random frame action data
          fc.record({
            fid: fc.integer({ min: 1, max: 1000000 }),
            url: fc.webUrl().map(url => `${url}?level=${fc.sample(fc.integer({ min: 1, max: 100 }), 1)[0]}`),
            messageHash: fc.hexaString({ minLength: 64, maxLength: 64 }).map(s => `0x${s}`),
            timestamp: fc.integer({ min: Math.floor((Date.now() - 4 * 60 * 1000) / 1000), max: Math.floor(Date.now() / 1000) }),
            network: fc.constantFrom(1, 10, 8453),
            buttonIndex: fc.integer({ min: 1, max: 4 }),
          }),
          async (actionData) => {
            // Test various malformed signatures
            const malformedSignatures = [
              '',
              '0x',
              'invalid',
              '0x123', // Too short
              '0xZZZZ', // Invalid hex
            ];

            for (const malformedSignature of malformedSignatures) {
              // Create the frame action with malformed signature
              const action: FrameActionData = {
                ...actionData,
                signature: malformedSignature as Hex,
              };

              // Validate signature - should return false without throwing
              const isValid = await handler.validateSignature(action, signerAccount.address);
              
              expect(isValid).toBe(false);
            }
          }
        ),
        { numRuns: 20 } // Reduced since we test multiple signatures per run
      );
    });
  });

  describe('Deep Link Extraction', () => {
    it('should correctly extract level from any valid URL', async () => {
      await fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          fc.webUrl(),
          (level, baseUrl) => {
            const url = `${baseUrl}?level=${level}`;
            const extractedLevel = handler.extractLevelFromUrl(url);
            
            expect(extractedLevel).toBe(level);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return null for URLs without level parameter', async () => {
      await fc.assert(
        fc.property(
          fc.webUrl(),
          (url) => {
            // Ensure URL doesn't have level parameter
            const urlWithoutLevel = url.split('?')[0];
            const extractedLevel = handler.extractLevelFromUrl(urlWithoutLevel);
            
            expect(extractedLevel).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
