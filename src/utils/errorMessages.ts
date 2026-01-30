/**
 * Error Message Utilities
 * 
 * Centralized error message handling for consistent user-facing messages
 */

// Common timeout values
export const TIMEOUTS = {
  REFETCH_DELAY: 2000,
  VERIFY_DELAY: 1000,
  AUTO_DISMISS: 12000,
  WALLET_RESET: 2000,
} as const;

/**
 * Get user-friendly error message from blockchain error
 */
export function getUserFriendlyError(error: string | Error): string {
  const errorMsg = error instanceof Error ? error.message : error;
  
  // User cancelled transaction
  if (errorMsg.includes('User rejected') || errorMsg.includes('User denied')) {
    return 'Transaction cancelled';
  }
  
  // Insufficient funds
  if (errorMsg.includes('insufficient funds')) {
    return 'Insufficient funds for gas';
  }
  
  // Pending transaction
  if (errorMsg.includes('pending')) {
    return 'There is a pending transaction. Please wait or cancel it in your wallet.';
  }
  
  // Ignore wallet capability errors (not user-facing)
  if (errorMsg.includes('wallet_getCapabilities') || errorMsg.includes('wallet_sendCalls')) {
    return '';
  }
  
  // Generic error
  return 'Transaction failed. Please try again.';
}

/**
 * Check if error should be displayed to user
 */
export function shouldDisplayError(error: string | Error): boolean {
  const errorMsg = error instanceof Error ? error.message : error;
  
  // Don't show wallet capability errors
  if (errorMsg.includes('wallet_getCapabilities') || errorMsg.includes('wallet_sendCalls')) {
    return false;
  }
  
  return true;
}

/**
 * Check if error is a user cancellation
 */
export function isUserCancellation(error: string | Error): boolean {
  const errorMsg = error instanceof Error ? error.message : error;
  return errorMsg.includes('User rejected') || errorMsg.includes('User denied');
}
