/**
 * Tests for validation utilities
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  isValidAddress,
  isValidTxHash,
  isValidLevel,
  isValidMoves,
  isValidTime,
  isValidStars,
  sanitizeString,
  validateBlockchainData,
  validateProgressData,
  RateLimiter,
} from './validation';

describe('validation utilities', () => {
  describe('isValidAddress', () => {
    it('should validate correct Ethereum addresses', () => {
      expect(isValidAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb')).toBe(false); // Missing one char
      expect(isValidAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0')).toBe(true);
      expect(isValidAddress('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF')).toBe(true);
    });
    
    it('should reject invalid addresses', () => {
      expect(isValidAddress('')).toBe(false);
      expect(isValidAddress('0x')).toBe(false);
      expect(isValidAddress('not an address')).toBe(false);
      expect(isValidAddress('0xGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG')).toBe(false);
    });
  });
  
  describe('isValidTxHash', () => {
    it('should validate correct transaction hashes', () => {
      const validHash = '0x' + 'a'.repeat(64);
      expect(isValidTxHash(validHash)).toBe(true);
    });
    
    it('should reject invalid hashes', () => {
      expect(isValidTxHash('')).toBe(false);
      expect(isValidTxHash('0x')).toBe(false);
      expect(isValidTxHash('0x' + 'a'.repeat(63))).toBe(false);
      expect(isValidTxHash('0x' + 'g'.repeat(64))).toBe(false);
    });
  });
  
  describe('isValidLevel', () => {
    it('should validate levels 1-100', () => {
      expect(isValidLevel(1)).toBe(true);
      expect(isValidLevel(50)).toBe(true);
      expect(isValidLevel(100)).toBe(true);
    });
    
    it('should reject invalid levels', () => {
      expect(isValidLevel(0)).toBe(false);
      expect(isValidLevel(101)).toBe(false);
      expect(isValidLevel(-1)).toBe(false);
      expect(isValidLevel(1.5)).toBe(false);
    });
  });

  describe('isValidMoves', () => {
    it('should validate reasonable move counts', () => {
      expect(isValidMoves(0)).toBe(true);
      expect(isValidMoves(100)).toBe(true);
      expect(isValidMoves(10000)).toBe(true);
    });
    
    it('should reject invalid moves', () => {
      expect(isValidMoves(-1)).toBe(false);
      expect(isValidMoves(10001)).toBe(false);
      expect(isValidMoves(1.5)).toBe(false);
    });
  });
  
  describe('isValidTime', () => {
    it('should validate reasonable times', () => {
      expect(isValidTime(0)).toBe(true);
      expect(isValidTime(60)).toBe(true);
      expect(isValidTime(86400)).toBe(true);
    });
    
    it('should reject invalid times', () => {
      expect(isValidTime(-1)).toBe(false);
      expect(isValidTime(86401)).toBe(false);
      expect(isValidTime(Infinity)).toBe(false);
    });
  });
  
  describe('isValidStars', () => {
    it('should validate star ratings 0-3', () => {
      expect(isValidStars(0)).toBe(true);
      expect(isValidStars(1)).toBe(true);
      expect(isValidStars(2)).toBe(true);
      expect(isValidStars(3)).toBe(true);
    });
    
    it('should reject invalid stars', () => {
      expect(isValidStars(-1)).toBe(false);
      expect(isValidStars(4)).toBe(false);
      expect(isValidStars(1.5)).toBe(false);
    });
  });
  
  describe('sanitizeString', () => {
    it('should remove HTML tags', () => {
      expect(sanitizeString('<script>alert("xss")</script>')).toBe('alert("xss")');
      expect(sanitizeString('<b>bold</b> text')).toBe('bold text');
    });
    
    it('should trim whitespace', () => {
      expect(sanitizeString('  hello  ')).toBe('hello');
    });
    
    it('should limit length', () => {
      const longString = 'a'.repeat(2000);
      expect(sanitizeString(longString, 100)).toHaveLength(100);
    });
    
    it('should handle invalid inputs', () => {
      expect(sanitizeString('')).toBe('');
      expect(sanitizeString(null as any)).toBe('');
      expect(sanitizeString(undefined as any)).toBe('');
    });
  });
  
  describe('validateBlockchainData', () => {
    it('should validate correct blockchain data', () => {
      expect(validateBlockchainData({
        address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
        txHash: '0x' + 'a'.repeat(64),
        blockNumber: 12345,
        chainId: 1,
      })).toBe(true);
    });
    
    it('should validate partial data', () => {
      expect(validateBlockchainData({ address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0' })).toBe(true);
      expect(validateBlockchainData({ chainId: 1 })).toBe(true);
      expect(validateBlockchainData({})).toBe(true);
    });
    
    it('should reject invalid data', () => {
      expect(validateBlockchainData({ address: 'invalid' })).toBe(false);
      expect(validateBlockchainData({ txHash: 'invalid' })).toBe(false);
      expect(validateBlockchainData({ blockNumber: -1 })).toBe(false);
      expect(validateBlockchainData({ chainId: -1 })).toBe(false);
    });
  });
  
  describe('validateProgressData', () => {
    it('should validate correct progress data', () => {
      expect(validateProgressData({
        level: 1,
        moves: 10,
        time: 60,
        stars: 3,
      })).toBe(true);
    });
    
    it('should reject invalid progress data', () => {
      expect(validateProgressData({ level: 0, moves: 10, time: 60, stars: 3 })).toBe(false);
      expect(validateProgressData({ level: 1, moves: -1, time: 60, stars: 3 })).toBe(false);
      expect(validateProgressData({ level: 1, moves: 10, time: -1, stars: 3 })).toBe(false);
      expect(validateProgressData({ level: 1, moves: 10, time: 60, stars: 4 })).toBe(false);
    });
  });
  
  describe('RateLimiter', () => {
    let limiter: RateLimiter;
    
    beforeEach(() => {
      limiter = new RateLimiter(3, 1000); // 3 attempts per second
    });
    
    it('should allow attempts within limit', () => {
      expect(limiter.isAllowed('test')).toBe(true);
      expect(limiter.isAllowed('test')).toBe(true);
      expect(limiter.isAllowed('test')).toBe(true);
    });
    
    it('should block attempts over limit', () => {
      limiter.isAllowed('test');
      limiter.isAllowed('test');
      limiter.isAllowed('test');
      expect(limiter.isAllowed('test')).toBe(false);
    });
    
    it('should track different keys separately', () => {
      limiter.isAllowed('key1');
      limiter.isAllowed('key1');
      limiter.isAllowed('key1');
      expect(limiter.isAllowed('key1')).toBe(false);
      expect(limiter.isAllowed('key2')).toBe(true);
    });
    
    it('should reset attempts for a key', () => {
      limiter.isAllowed('test');
      limiter.isAllowed('test');
      limiter.isAllowed('test');
      limiter.reset('test');
      expect(limiter.isAllowed('test')).toBe(true);
    });
    
    it('should clear all attempts', () => {
      limiter.isAllowed('key1');
      limiter.isAllowed('key2');
      limiter.clearAll();
      expect(limiter.isAllowed('key1')).toBe(true);
      expect(limiter.isAllowed('key2')).toBe(true);
    });
  });
});
