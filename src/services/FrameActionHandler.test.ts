/**
 * Unit Tests for FrameActionHandler
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { privateKeyToAccount } from 'viem/accounts';
import { type Hex } from 'viem';
import {
  FrameActionHandler,
  createFrameActionHandler,
  type FrameActionData,
} from './FrameActionHandler';

describe('FrameActionHandler', () => {
  let signerAccount: ReturnType<typeof privateKeyToAccount>;
  let handler: FrameActionHandler;

  beforeEach(() => {
    // Create a test account for signing
    const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' as Hex;
    signerAccount = privateKeyToAccount(privateKey);
    
    // Create handler
    handler = new FrameActionHandler('https://example.com');
  });

  describe('constructor', () => {
    it('should create handler with provided base URL', () => {
      const customHandler = new FrameActionHandler('https://custom.com');
      expect(customHandler).toBeInstanceOf(FrameActionHandler);
    });

    it('should use window.location.origin when no base URL provided', () => {
      const defaultHandler = new FrameActionHandler();
      expect(defaultHandler).toBeInstanceOf(FrameActionHandler);
    });
  });

  describe('createFrameActionHandler', () => {
    it('should create a frame action handler instance', () => {
      const handler = createFrameActionHandler('https://example.com');
      expect(handler).toBeDefined();
    });
  });

  describe('validateSignature', () => {
    it('should validate a correctly signed frame action', async () => {
      const actionData = {
        fid: 12345,
        url: 'https://example.com?level=5',
        messageHash: '0xabcdef',
        timestamp: Math.floor(Date.now() / 1000),
        network: 1,
        buttonIndex: 1,
      };

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

      const signature = await signerAccount.signMessage({ message });

      const action: FrameActionData = {
        ...actionData,
        signature,
      };

      const isValid = await handler.validateSignature(action, signerAccount.address);
      expect(isValid).toBe(true);
    });

    it('should reject action with invalid signature', async () => {
      const action: FrameActionData = {
        fid: 12345,
        url: 'https://example.com?level=5',
        messageHash: '0xabcdef',
        timestamp: Math.floor(Date.now() / 1000),
        network: 1,
        buttonIndex: 1,
        signature: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12',
      };

      const isValid = await handler.validateSignature(action, signerAccount.address);
      expect(isValid).toBe(false);
    });

    it('should handle malformed signature gracefully', async () => {
      const action: FrameActionData = {
        fid: 12345,
        url: 'https://example.com?level=5',
        messageHash: '0xabcdef',
        timestamp: Math.floor(Date.now() / 1000),
        network: 1,
        buttonIndex: 1,
        signature: 'invalid-signature' as Hex,
      };

      const isValid = await handler.validateSignature(action, signerAccount.address);
      expect(isValid).toBe(false);
    });
  });

  describe('extractLevelFromUrl', () => {
    it('should extract level from URL with level parameter', () => {
      const level = handler.extractLevelFromUrl('https://example.com?level=5');
      expect(level).toBe(5);
    });

    it('should extract level from URL with multiple parameters', () => {
      const level = handler.extractLevelFromUrl('https://example.com?foo=bar&level=10&baz=qux');
      expect(level).toBe(10);
    });

    it('should return null for URL without level parameter', () => {
      const level = handler.extractLevelFromUrl('https://example.com?foo=bar');
      expect(level).toBeNull();
    });

    it('should return null for invalid level value', () => {
      const level = handler.extractLevelFromUrl('https://example.com?level=invalid');
      expect(level).toBeNull();
    });

    it('should return null for malformed URL', () => {
      const level = handler.extractLevelFromUrl('not-a-url');
      expect(level).toBeNull();
    });

    it('should handle level at different positions in query string', () => {
      const level1 = handler.extractLevelFromUrl('https://example.com?level=7');
      const level2 = handler.extractLevelFromUrl('https://example.com?a=1&level=7');
      const level3 = handler.extractLevelFromUrl('https://example.com?a=1&level=7&b=2');
      
      expect(level1).toBe(7);
      expect(level2).toBe(7);
      expect(level3).toBe(7);
    });
  });

  describe('generateDeepLink', () => {
    it('should generate deep link with level parameter', () => {
      const link = handler.generateDeepLink(5);
      expect(link).toBe('https://example.com?level=5');
    });

    it('should generate deep link with custom base URL', () => {
      const link = handler.generateDeepLink(10, 'https://custom.com');
      expect(link).toBe('https://custom.com?level=10');
    });

    it('should generate different links for different levels', () => {
      const link1 = handler.generateDeepLink(1);
      const link2 = handler.generateDeepLink(2);
      
      expect(link1).not.toBe(link2);
      expect(link1).toContain('level=1');
      expect(link2).toContain('level=2');
    });
  });

  describe('handleAction', () => {
    it('should handle valid frame action for button 1', async () => {
      const action: FrameActionData = {
        fid: 12345,
        url: 'https://example.com?level=5',
        messageHash: '0xabcdef',
        timestamp: Math.floor(Date.now() / 1000),
        network: 1,
        buttonIndex: 1,
        signature: '0x00' as Hex,
      };

      const frame = await handler.handleAction(action);

      expect(frame).toBeDefined();
      expect(frame.version).toBe('vNext');
      expect(frame.button).toBeDefined();
      expect(frame.button?.title).toContain('Play Level 5');
      expect(frame.button?.target).toContain('level=5');
    });

    it('should throw error for action that is too old', async () => {
      const action: FrameActionData = {
        fid: 12345,
        url: 'https://example.com?level=5',
        messageHash: '0xabcdef',
        timestamp: Math.floor((Date.now() - 6 * 60 * 1000) / 1000), // 6 minutes ago
        network: 1,
        buttonIndex: 1,
        signature: '0x00' as Hex,
      };

      await expect(handler.handleAction(action)).rejects.toThrow('Frame action too old');
    });

    it('should throw error for action with future timestamp', async () => {
      const action: FrameActionData = {
        fid: 12345,
        url: 'https://example.com?level=5',
        messageHash: '0xabcdef',
        timestamp: Math.floor((Date.now() + 60 * 1000) / 1000), // 1 minute in future
        network: 1,
        buttonIndex: 1,
        signature: '0x00' as Hex,
      };

      await expect(handler.handleAction(action)).rejects.toThrow('Frame action timestamp is in the future');
    });

    it('should throw error for URL without level parameter', async () => {
      const action: FrameActionData = {
        fid: 12345,
        url: 'https://example.com',
        messageHash: '0xabcdef',
        timestamp: Math.floor(Date.now() / 1000),
        network: 1,
        buttonIndex: 1,
        signature: '0x00' as Hex,
      };

      await expect(handler.handleAction(action)).rejects.toThrow('Could not extract level from frame URL');
    });

    it('should throw error for invalid level number', async () => {
      const action: FrameActionData = {
        fid: 12345,
        url: 'https://example.com?level=0',
        messageHash: '0xabcdef',
        timestamp: Math.floor(Date.now() / 1000),
        network: 1,
        buttonIndex: 1,
        signature: '0x00' as Hex,
      };

      await expect(handler.handleAction(action)).rejects.toThrow('Invalid level number');
    });

    it('should throw error for level above 100', async () => {
      const action: FrameActionData = {
        fid: 12345,
        url: 'https://example.com?level=101',
        messageHash: '0xabcdef',
        timestamp: Math.floor(Date.now() / 1000),
        network: 1,
        buttonIndex: 1,
        signature: '0x00' as Hex,
      };

      await expect(handler.handleAction(action)).rejects.toThrow('Invalid level number');
    });

    it('should throw error for unknown button index', async () => {
      const action: FrameActionData = {
        fid: 12345,
        url: 'https://example.com?level=5',
        messageHash: '0xabcdef',
        timestamp: Math.floor(Date.now() / 1000),
        network: 1,
        buttonIndex: 99,
        signature: '0x00' as Hex,
      };

      await expect(handler.handleAction(action)).rejects.toThrow('Unknown button index');
    });

    it('should accept action within 5 minute window', async () => {
      const action: FrameActionData = {
        fid: 12345,
        url: 'https://example.com?level=5',
        messageHash: '0xabcdef',
        timestamp: Math.floor((Date.now() - 4 * 60 * 1000) / 1000), // 4 minutes ago
        network: 1,
        buttonIndex: 1,
        signature: '0x00' as Hex,
      };

      await expect(handler.handleAction(action)).resolves.toBeDefined();
    });
  });

  describe('timestamp validation', () => {
    it('should accept action just under 5 minute boundary', async () => {
      const action: FrameActionData = {
        fid: 12345,
        url: 'https://example.com?level=5',
        messageHash: '0xabcdef',
        timestamp: Math.floor((Date.now() - 4.9 * 60 * 1000) / 1000), // Just under 5 minutes
        network: 1,
        buttonIndex: 1,
        signature: '0x00' as Hex,
      };

      await expect(handler.handleAction(action)).resolves.toBeDefined();
    });
  });
});
