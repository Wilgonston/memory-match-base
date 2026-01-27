/**
 * Configuration Validation
 * 
 * Validates application configuration on startup to catch
 * configuration errors early.
 */

import { validateBaseAccountConfig } from './base-account';
import { validateGasPolicy } from './gas-policy';
import { memoryMatchGasPolicy } from './gas-policy';

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate all application configuration
 * 
 * @returns Validation result with errors and warnings
 */
export function validateAppConfig(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate Base Account configuration
  try {
    const baseAccountValid = validateBaseAccountConfig();
    if (!baseAccountValid) {
      warnings.push('Base Account configuration is incomplete. Smart Wallet features may not work.');
    }
  } catch (error) {
    errors.push(`Base Account validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Validate Gas Policy
  try {
    const gasPolicyValid = validateGasPolicy(memoryMatchGasPolicy);
    if (!gasPolicyValid) {
      errors.push('Gas policy validation failed. Paymaster sponsorship will not work.');
    }
  } catch (error) {
    errors.push(`Gas policy validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Validate OnchainKit API key
  const apiKey = import.meta.env.VITE_ONCHAINKIT_API_KEY;
  if (!apiKey) {
    warnings.push('OnchainKit API key not configured. Paymaster sponsorship will not work.');
  }

  // Validate WalletConnect Project ID
  const wcProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;
  if (!wcProjectId) {
    warnings.push('WalletConnect Project ID not configured. WalletConnect will not work.');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Log validation results to console
 * 
 * @param result - Validation result to log
 */
export function logValidationResults(result: ValidationResult): void {
  if (result.valid) {
    console.log('[Config] ✅ All configuration validated successfully');
  } else {
    console.error('[Config] ❌ Configuration validation failed:');
    result.errors.forEach((error) => console.error(`  - ${error}`));
  }

  if (result.warnings.length > 0) {
    console.warn('[Config] ⚠️ Configuration warnings:');
    result.warnings.forEach((warning) => console.warn(`  - ${warning}`));
  }
}

/**
 * Validate configuration and throw if invalid
 * 
 * @throws Error if configuration is invalid
 */
export function validateAppConfigOrThrow(): void {
  const result = validateAppConfig();
  logValidationResults(result);

  if (!result.valid) {
    throw new Error('Application configuration is invalid. Please check environment variables.');
  }
}
