/**
 * Cryptographic Utilities
 * 
 * Provides common cryptographic functions for generating random values,
 * hashes, and other crypto operations.
 */

import { Hash, Hex } from 'viem';

/**
 * Generate a random transaction hash
 * 
 * @returns Random 32-byte hash as hex string
 */
export function generateRandomHash(): Hash {
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);
  return `0x${Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')}` as Hash;
}

/**
 * Generate a random salt as bigint
 * 
 * @returns Random 32-byte value as bigint
 */
export function generateRandomSalt(): bigint {
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);
  
  let salt = 0n;
  for (let i = 0; i < randomBytes.length; i++) {
    salt = (salt << 8n) | BigInt(randomBytes[i]);
  }
  
  return salt;
}

/**
 * Generate random bytes of specified length
 * 
 * @param length - Number of bytes to generate
 * @returns Hex string of random bytes
 */
export function generateRandomBytes(length: number): Hex {
  const randomBytes = new Uint8Array(length);
  crypto.getRandomValues(randomBytes);
  return `0x${Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')}` as Hex;
}
