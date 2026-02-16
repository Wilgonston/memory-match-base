/**
 * Builder Code Attribution Utilities
 *
 * Utilities for integrating BASE Builder Codes for transaction attribution.
 * Builder Codes enable automatic tracking of onchain activity for analytics and rewards.
 *
 * @see https://docs.base.org/base-chain/builder-codes/builder-codes
 */

/**
 * Generate Builder Code data suffix for transaction attribution
 *
 * This function creates the ERC-8021 compliant data suffix that gets appended
 * to transaction calldata for attribution purposes.
 *
 * @param builderCode - Your Builder Code from base.dev (e.g., "bc_b7k3p9da")
 * @returns Hex string data suffix or undefined if ox/erc8021 is not available
 *
 * @example
 * ```typescript
 * const suffix = generateBuilderCodeSuffix('bc_b7k3p9da');
 * // Returns: '0x...' (ERC-8021 compliant suffix)
 * ```
 */
export function generateBuilderCodeSuffix(builderCode: string): `0x${string}` | undefined {
  if (!builderCode) {
    return undefined;
  }

  try {
    // Dynamically require ox/erc8021 to avoid build errors if not installed
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Attribution } = require('ox/erc8021');
    const suffix = Attribution.toDataSuffix({ codes: [builderCode] });
    console.log('[Builder Code] Attribution enabled:', builderCode);
    return suffix;
  } catch (error) {
    console.warn('[Builder Code] ox/erc8021 not available. Attribution disabled.');
    console.warn('[Builder Code] Install ox@0.11.0+ to enable: npm install ox@latest');
    return undefined;
  }
}

/**
 * Validate Builder Code format
 *
 * @param builderCode - Builder Code to validate
 * @returns true if valid format
 */
export function isValidBuilderCode(builderCode: string): boolean {
  // Builder Codes typically follow format: bc_[alphanumeric]
  return /^bc_[a-z0-9]+$/i.test(builderCode);
}

/**
 * Get Builder Code from environment
 *
 * @returns Builder Code from VITE_BUILDER_CODE env var or undefined
 */
export function getBuilderCode(): string | undefined {
  const code = import.meta.env.VITE_BUILDER_CODE;

  if (code && !isValidBuilderCode(code)) {
    console.warn('[Builder Code] Invalid format:', code);
    console.warn('[Builder Code] Expected format: bc_[alphanumeric]');
    return undefined;
  }

  return code || undefined;
}
