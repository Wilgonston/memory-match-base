/**
 * SpendPermissionManager Service
 * 
 * Manages spend permissions for Smart Wallets, allowing users to set spending limits
 * for the game contract. Provides methods to request, check, revoke, and manage permissions.
 * 
 * Requirements: 7.1, 7.2, 7.4
 */

import { Address, Hex } from 'viem';

/**
 * Spend permission structure
 */
export interface SpendPermission {
  /** Contract address that can spend */
  spender: Address;
  /** Token address (ETH = 0x0000000000000000000000000000000000000000) */
  token: Address;
  /** Maximum amount that can be spent */
  allowance: bigint;
  /** Time period in seconds */
  period: number;
  /** Start timestamp */
  start: number;
  /** End timestamp */
  end: number;
  /** Random salt for uniqueness */
  salt: bigint;
  /** Additional data */
  extraData: Hex;
}

/**
 * Spend permission request (without salt and extraData which are generated)
 */
export type SpendPermissionRequest = Omit<SpendPermission, 'salt' | 'extraData'>;

/**
 * SpendPermissionManager class
 * 
 * Manages spend permissions for Smart Wallets
 */
export class SpendPermissionManager {
  private permissions: Map<string, SpendPermission> = new Map();

  /**
   * Generate a unique key for a permission
   */
  private getPermissionKey(spender: Address, token: Address): string {
    return `${spender.toLowerCase()}-${token.toLowerCase()}`;
  }

  /**
   * Generate random salt for permission
   */
  private generateSalt(): bigint {
    // Generate random 32-byte value
    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);
    
    // Convert to bigint
    let salt = 0n;
    for (let i = 0; i < randomBytes.length; i++) {
      salt = (salt << 8n) | BigInt(randomBytes[i]);
    }
    
    return salt;
  }

  /**
   * Request spend permission
   * 
   * @param request - Permission request without salt and extraData
   * @returns Complete spend permission with generated salt and extraData
   */
  async requestPermission(request: SpendPermissionRequest): Promise<SpendPermission> {
    // Validate request
    if (!request.spender || request.spender === '0x0') {
      throw new Error('Invalid spender address');
    }

    if (!request.token || request.token === '0x0') {
      throw new Error('Invalid token address');
    }

    if (request.allowance <= 0n) {
      throw new Error('Allowance must be greater than 0');
    }

    if (request.period <= 0) {
      throw new Error('Period must be greater than 0');
    }

    if (request.start < 0) {
      throw new Error('Start timestamp must be non-negative');
    }

    if (request.end <= request.start) {
      throw new Error('End timestamp must be after start timestamp');
    }

    // Generate salt and extraData
    const salt = this.generateSalt();
    const extraData: Hex = '0x';

    // Create complete permission
    const permission: SpendPermission = {
      ...request,
      salt,
      extraData,
    };

    // Store permission
    const key = this.getPermissionKey(request.spender, request.token);
    this.permissions.set(key, permission);

    console.log('[SpendPermissionManager] Permission requested:', {
      spender: request.spender,
      token: request.token,
      allowance: request.allowance.toString(),
      period: request.period,
    });

    return permission;
  }

  /**
   * Get current permission for a spender and token
   * 
   * @param spender - Contract address
   * @param token - Token address
   * @returns Permission if exists, null otherwise
   */
  async getPermission(
    spender: Address,
    token: Address
  ): Promise<SpendPermission | null> {
    const key = this.getPermissionKey(spender, token);
    const permission = this.permissions.get(key);

    if (!permission) {
      return null;
    }

    // Check if permission is still valid (not expired)
    const now = Math.floor(Date.now() / 1000);
    if (now > permission.end) {
      // Permission expired, remove it
      this.permissions.delete(key);
      return null;
    }

    return permission;
  }

  /**
   * Revoke permission
   * 
   * @param spender - Contract address
   * @param token - Token address
   */
  async revokePermission(spender: Address, token: Address): Promise<void> {
    const key = this.getPermissionKey(spender, token);
    const permission = this.permissions.get(key);

    if (!permission) {
      console.warn('[SpendPermissionManager] No permission to revoke:', {
        spender,
        token,
      });
      return;
    }

    this.permissions.delete(key);

    console.log('[SpendPermissionManager] Permission revoked:', {
      spender,
      token,
    });
  }

  /**
   * Check if permission is sufficient for an amount
   * 
   * @param spender - Contract address
   * @param token - Token address
   * @param amount - Amount to check
   * @returns true if permission exists and is sufficient
   */
  async hasPermission(
    spender: Address,
    token: Address,
    amount: bigint
  ): Promise<boolean> {
    const permission = await this.getPermission(spender, token);

    if (!permission) {
      return false;
    }

    // Check if allowance is sufficient
    if (permission.allowance < amount) {
      return false;
    }

    // Check if permission is currently active
    const now = Math.floor(Date.now() / 1000);
    if (now < permission.start || now > permission.end) {
      return false;
    }

    return true;
  }

  /**
   * Get all active permissions
   * 
   * @returns Array of active permissions
   */
  async getAllPermissions(): Promise<SpendPermission[]> {
    const now = Math.floor(Date.now() / 1000);
    const activePermissions: SpendPermission[] = [];

    for (const [key, permission] of this.permissions.entries()) {
      // Only include non-expired permissions
      if (now <= permission.end) {
        activePermissions.push(permission);
      } else {
        // Clean up expired permissions
        this.permissions.delete(key);
      }
    }

    return activePermissions;
  }

  /**
   * Clear all permissions (for logout/disconnect)
   */
  async clearAllPermissions(): Promise<void> {
    this.permissions.clear();
    console.log('[SpendPermissionManager] All permissions cleared');
  }

  /**
   * Update permission allowance
   * 
   * @param spender - Contract address
   * @param token - Token address
   * @param newAllowance - New allowance amount
   */
  async updateAllowance(
    spender: Address,
    token: Address,
    newAllowance: bigint
  ): Promise<void> {
    const permission = await this.getPermission(spender, token);

    if (!permission) {
      throw new Error('Permission not found');
    }

    if (newAllowance <= 0n) {
      throw new Error('New allowance must be greater than 0');
    }

    permission.allowance = newAllowance;

    const key = this.getPermissionKey(spender, token);
    this.permissions.set(key, permission);

    console.log('[SpendPermissionManager] Allowance updated:', {
      spender,
      token,
      newAllowance: newAllowance.toString(),
    });
  }
}

// Export singleton instance
export const spendPermissionManager = new SpendPermissionManager();
