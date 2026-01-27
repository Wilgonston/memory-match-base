/**
 * Unit Tests for WebhookHandler
 * 
 * These tests verify specific examples and edge cases for webhook handling.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { privateKeyToAccount } from 'viem/accounts';
import { type Hex } from 'viem';
import { WebhookHandler, createWebhookHandler, type WebhookEvent } from './WebhookHandler';

describe('WebhookHandler', () => {
  let signerAccount: ReturnType<typeof privateKeyToAccount>;
  let webhookHandler: WebhookHandler;

  beforeEach(() => {
    // Create a test account for signing
    const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' as Hex;
    signerAccount = privateKeyToAccount(privateKey);
    
    // Create webhook handler with signer's address as secret
    webhookHandler = new WebhookHandler(signerAccount.address);
  });

  describe('constructor', () => {
    it('should create a webhook handler with valid secret', () => {
      expect(webhookHandler).toBeInstanceOf(WebhookHandler);
    });

    it('should throw error when secret is empty', () => {
      expect(() => new WebhookHandler('')).toThrow('Webhook secret is required');
    });
  });

  describe('createWebhookHandler', () => {
    it('should create a webhook handler instance', () => {
      const handler = createWebhookHandler(signerAccount.address);
      expect(handler).toBeDefined();
    });
  });

  describe('validateSignature', () => {
    it('should validate a correctly signed webhook event', async () => {
      const eventData = {
        type: 'install' as const,
        timestamp: Date.now(),
        userId: 'user123',
        data: { fid: 12345, username: 'testuser' },
      };

      const message = JSON.stringify({
        type: eventData.type,
        timestamp: eventData.timestamp,
        userId: eventData.userId,
        data: eventData.data,
      });

      const signature = await signerAccount.signMessage({ message });

      const event: WebhookEvent = {
        ...eventData,
        signature,
      };

      const isValid = await webhookHandler.validateSignature(event, signerAccount.address);
      expect(isValid).toBe(true);
    });

    it('should reject event with invalid signature', async () => {
      // Generate a random but structurally valid signature (132 chars)
      const randomHex = Array.from({ length: 130 }, () => 
        Math.floor(Math.random() * 16).toString(16)
      ).join('');
      
      const event: WebhookEvent = {
        type: 'install',
        timestamp: Date.now(),
        userId: 'user123',
        data: { fid: 12345 },
        signature: `0x${randomHex}` as Hex,
      };

      const isValid = await webhookHandler.validateSignature(event, signerAccount.address);
      expect(isValid).toBe(false);
    });

    it('should reject event signed by different account', async () => {
      const differentPrivateKey = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d' as Hex;
      const differentAccount = privateKeyToAccount(differentPrivateKey);

      const eventData = {
        type: 'install' as const,
        timestamp: Date.now(),
        userId: 'user123',
        data: { fid: 12345 },
      };

      const message = JSON.stringify({
        type: eventData.type,
        timestamp: eventData.timestamp,
        userId: eventData.userId,
        data: eventData.data,
      });

      const signature = await differentAccount.signMessage({ message });

      const event: WebhookEvent = {
        ...eventData,
        signature,
      };

      const isValid = await webhookHandler.validateSignature(event, signerAccount.address);
      expect(isValid).toBe(false);
    });

    it('should handle malformed signature gracefully', async () => {
      const event: WebhookEvent = {
        type: 'install',
        timestamp: Date.now(),
        userId: 'user123',
        data: { fid: 12345 },
        signature: 'invalid-signature',
      };

      const isValid = await webhookHandler.validateSignature(event, signerAccount.address);
      expect(isValid).toBe(false);
    });
  });

  describe('handleEvent', () => {
    it('should handle valid install event', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const eventData = {
        type: 'install' as const,
        timestamp: Date.now(),
        userId: 'user123',
        data: { fid: 12345, username: 'testuser' },
      };

      const message = JSON.stringify({
        type: eventData.type,
        timestamp: eventData.timestamp,
        userId: eventData.userId,
        data: eventData.data,
      });

      const signature = await signerAccount.signMessage({ message });

      const event: WebhookEvent = {
        ...eventData,
        signature,
      };

      await webhookHandler.handleEvent(event);

      expect(consoleSpy).toHaveBeenCalledWith(
        'User installed Mini App:',
        expect.objectContaining({
          userId: 'user123',
          fid: 12345,
          username: 'testuser',
        })
      );

      consoleSpy.mockRestore();
    });

    it('should handle valid uninstall event', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const eventData = {
        type: 'uninstall' as const,
        timestamp: Date.now(),
        userId: 'user123',
        data: { fid: 12345 },
      };

      const message = JSON.stringify({
        type: eventData.type,
        timestamp: eventData.timestamp,
        userId: eventData.userId,
        data: eventData.data,
      });

      const signature = await signerAccount.signMessage({ message });

      const event: WebhookEvent = {
        ...eventData,
        signature,
      };

      await webhookHandler.handleEvent(event);

      expect(consoleSpy).toHaveBeenCalledWith(
        'User uninstalled Mini App:',
        expect.objectContaining({
          userId: 'user123',
          fid: 12345,
        })
      );

      consoleSpy.mockRestore();
    });

    it('should handle valid notification event', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const eventData = {
        type: 'notification' as const,
        timestamp: Date.now(),
        userId: 'user123',
        data: {
          notificationType: 'level_complete',
          level: 5,
          stars: 3,
        },
      };

      const message = JSON.stringify({
        type: eventData.type,
        timestamp: eventData.timestamp,
        userId: eventData.userId,
        data: eventData.data,
      });

      const signature = await signerAccount.signMessage({ message });

      const event: WebhookEvent = {
        ...eventData,
        signature,
      };

      await webhookHandler.handleEvent(event);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Notification event:',
        expect.objectContaining({
          userId: 'user123',
          notificationType: 'level_complete',
        })
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        'Level completed:',
        expect.objectContaining({
          level: 5,
          stars: 3,
        })
      );

      consoleSpy.mockRestore();
    });

    it('should throw error for invalid signature', async () => {
      const event: WebhookEvent = {
        type: 'install',
        timestamp: Date.now(),
        userId: 'user123',
        data: { fid: 12345 },
        signature: 'invalid-signature',
      };

      await expect(webhookHandler.handleEvent(event)).rejects.toThrow('Invalid webhook signature');
    });

    it('should throw error for event that is too old', async () => {
      const eventData = {
        type: 'install' as const,
        timestamp: Date.now() - 6 * 60 * 1000, // 6 minutes ago (too old)
        userId: 'user123',
        data: { fid: 12345 },
      };

      const message = JSON.stringify({
        type: eventData.type,
        timestamp: eventData.timestamp,
        userId: eventData.userId,
        data: eventData.data,
      });

      const signature = await signerAccount.signMessage({ message });

      const event: WebhookEvent = {
        ...eventData,
        signature,
      };

      await expect(webhookHandler.handleEvent(event)).rejects.toThrow('Webhook event too old');
    });

    it('should throw error for event with future timestamp', async () => {
      const eventData = {
        type: 'install' as const,
        timestamp: Date.now() + 60 * 1000, // 1 minute in the future
        userId: 'user123',
        data: { fid: 12345 },
      };

      const message = JSON.stringify({
        type: eventData.type,
        timestamp: eventData.timestamp,
        userId: eventData.userId,
        data: eventData.data,
      });

      const signature = await signerAccount.signMessage({ message });

      const event: WebhookEvent = {
        ...eventData,
        signature,
      };

      await expect(webhookHandler.handleEvent(event)).rejects.toThrow('Webhook event timestamp is in the future');
    });

    it('should handle unknown event type gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const eventData = {
        type: 'unknown' as any,
        timestamp: Date.now(),
        userId: 'user123',
        data: {},
      };

      const message = JSON.stringify({
        type: eventData.type,
        timestamp: eventData.timestamp,
        userId: eventData.userId,
        data: eventData.data,
      });

      const signature = await signerAccount.signMessage({ message });

      const event: WebhookEvent = {
        ...eventData,
        signature,
      };

      await webhookHandler.handleEvent(event);

      expect(consoleSpy).toHaveBeenCalledWith('Unknown webhook event type:', 'unknown');

      consoleSpy.mockRestore();
    });

    it('should handle unknown notification type gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const eventData = {
        type: 'notification' as const,
        timestamp: Date.now(),
        userId: 'user123',
        data: {
          notificationType: 'unknown_type',
        },
      };

      const message = JSON.stringify({
        type: eventData.type,
        timestamp: eventData.timestamp,
        userId: eventData.userId,
        data: eventData.data,
      });

      const signature = await signerAccount.signMessage({ message });

      const event: WebhookEvent = {
        ...eventData,
        signature,
      };

      await webhookHandler.handleEvent(event);

      expect(consoleSpy).toHaveBeenCalledWith('Unknown notification type:', 'unknown_type');

      consoleSpy.mockRestore();
    });
  });

  describe('timestamp validation', () => {
    it('should accept event within 5 minute window', async () => {
      const eventData = {
        type: 'install' as const,
        timestamp: Date.now() - 4 * 60 * 1000, // 4 minutes ago
        userId: 'user123',
        data: { fid: 12345 },
      };

      const message = JSON.stringify({
        type: eventData.type,
        timestamp: eventData.timestamp,
        userId: eventData.userId,
        data: eventData.data,
      });

      const signature = await signerAccount.signMessage({ message });

      const event: WebhookEvent = {
        ...eventData,
        signature,
      };

      await expect(webhookHandler.handleEvent(event)).resolves.not.toThrow();
    });

    it('should reject event exactly at 5 minute boundary', async () => {
      const eventData = {
        type: 'install' as const,
        timestamp: Date.now() - 5 * 60 * 1000 - 1, // Just over 5 minutes ago
        userId: 'user123',
        data: { fid: 12345 },
      };

      const message = JSON.stringify({
        type: eventData.type,
        timestamp: eventData.timestamp,
        userId: eventData.userId,
        data: eventData.data,
      });

      const signature = await signerAccount.signMessage({ message });

      const event: WebhookEvent = {
        ...eventData,
        signature,
      };

      await expect(webhookHandler.handleEvent(event)).rejects.toThrow('Webhook event too old');
    });
  });
});
