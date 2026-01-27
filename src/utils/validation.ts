/**
 * Input Validation Utilities
 * 
 * Provides validation functions for user inputs and blockchain data.
 * 
 * Requirements: 22.1, 22.3
 */

/**
 * Validates Ethereum address format
 */
export function isValidAddress(address: string): boolean {
  if (!address || typeof address !== 'string') {
    return false;
  }
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Validates transaction hash format
 */
export function isValidTxHash(hash: string): boolean {
  if (!hash || typeof hash !== 'string') {
    return false;
  }
  return /^0x[a-fA-F0-9]{64}$/.test(hash);
}

/**
 * Validates level number is within valid range
 */
export function isValidLevel(level: number): boolean {
  return Number.isInteger(level) && level >= 1 && level <= 100;
}

/**
 * Validates moves count is reasonable
 */
export function isValidMoves(moves: number): boolean {
  return Number.isInteger(moves) && moves >= 0 && moves <= 10000;
}

/**
 * Validates time is reasonable (in seconds)
 */
export function isValidTime(time: number): boolean {
  return Number.isFinite(time) && time >= 0 && time <= 86400; // Max 24 hours
}

/**
 * Validates stars rating
 */
export function isValidStars(stars: number): boolean {
  return Number.isInteger(stars) && stars >= 0 && stars <= 3;
}

/**
 * Sanitizes user input string
 */
export function sanitizeString(input: string, maxLength: number = 1000): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  // Remove any HTML tags
  const withoutHtml = input.replace(/<[^>]*>/g, '');
  
  // Trim and limit length
  return withoutHtml.trim().slice(0, maxLength);
}

/**
 * Validates blockchain data structure
 */
export interface BlockchainData {
  address?: string;
  txHash?: string;
  blockNumber?: number;
  chainId?: number;
}

export function validateBlockchainData(data: unknown): data is BlockchainData {
  if (!data || typeof data !== 'object') {
    return false;
  }
  
  const d = data as Partial<BlockchainData>;
  
  // Validate address if present
  if (d.address !== undefined && !isValidAddress(d.address)) {
    return false;
  }
  
  // Validate txHash if present
  if (d.txHash !== undefined && !isValidTxHash(d.txHash)) {
    return false;
  }
  
  // Validate blockNumber if present
  if (d.blockNumber !== undefined && (!Number.isInteger(d.blockNumber) || d.blockNumber < 0)) {
    return false;
  }
  
  // Validate chainId if present
  if (d.chainId !== undefined && (!Number.isInteger(d.chainId) || d.chainId < 0)) {
    return false;
  }
  
  return true;
}

/**
 * Validates progress data structure
 */
export interface ProgressDataValidation {
  level: number;
  moves: number;
  time: number;
  stars: number;
}

export function validateProgressData(data: unknown): data is ProgressDataValidation {
  if (!data || typeof data !== 'object') {
    return false;
  }
  
  const d = data as Partial<ProgressDataValidation>;
  
  return (
    d.level !== undefined && isValidLevel(d.level) &&
    d.moves !== undefined && isValidMoves(d.moves) &&
    d.time !== undefined && isValidTime(d.time) &&
    d.stars !== undefined && isValidStars(d.stars)
  );
}

/**
 * Rate limiting utility
 */
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  
  constructor(
    private maxAttempts: number = 10,
    private windowMs: number = 60000 // 1 minute
  ) {}
  
  /**
   * Check if action is allowed for given key
   */
  isAllowed(key: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    
    // Remove old attempts outside the window
    const recentAttempts = attempts.filter(time => now - time < this.windowMs);
    
    if (recentAttempts.length >= this.maxAttempts) {
      return false;
    }
    
    // Add current attempt
    recentAttempts.push(now);
    this.attempts.set(key, recentAttempts);
    
    return true;
  }
  
  /**
   * Reset attempts for given key
   */
  reset(key: string): void {
    this.attempts.delete(key);
  }
  
  /**
   * Clear all attempts
   */
  clearAll(): void {
    this.attempts.clear();
  }
}
