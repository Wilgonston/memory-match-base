/**
 * Authentication Utility
 * 
 * Manages user authentication state with integrity verification.
 * Uses HMAC-like signature to prevent tampering with localStorage.
 */

const AUTH_KEY = 'authenticated';
const AUTH_ADDRESS_KEY = 'authenticatedAddress';
const AUTH_TIMESTAMP_KEY = 'authTimestamp';
const AUTH_SIGNATURE_KEY = 'authSignature';

// Session timeout: 7 days
const SESSION_TIMEOUT_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Generate a simple hash for integrity verification
 * Note: This is not cryptographically secure, but prevents casual tampering
 */
function generateAuthSignature(address: string, timestamp: string): string {
  // Simple hash using address and timestamp
  // In production, consider using a more secure method
  const data = `${address}:${timestamp}:memory-match-base`;
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Verify authentication signature
 */
function verifyAuthSignature(address: string, timestamp: string, signature: string): boolean {
  const expectedSignature = generateAuthSignature(address, timestamp);
  return signature === expectedSignature;
}

/**
 * Check if session has expired
 */
function isSessionExpired(timestamp: number): boolean {
  const now = Date.now();
  return (now - timestamp) > SESSION_TIMEOUT_MS;
}

export function setAuthentication(address: string): void {
  const timestamp = Date.now().toString();
  const signature = generateAuthSignature(address, timestamp);
  
  localStorage.setItem(AUTH_KEY, 'true');
  localStorage.setItem(AUTH_ADDRESS_KEY, address);
  localStorage.setItem(AUTH_TIMESTAMP_KEY, timestamp);
  localStorage.setItem(AUTH_SIGNATURE_KEY, signature);
}

export function clearAuthentication(): void {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(AUTH_ADDRESS_KEY);
  localStorage.removeItem(AUTH_TIMESTAMP_KEY);
  localStorage.removeItem(AUTH_SIGNATURE_KEY);
}

export function getAuthentication(): {
  isAuthenticated: boolean;
  address: string | null;
  timestamp: number | null;
} {
  const isAuthenticated = localStorage.getItem(AUTH_KEY) === 'true';
  const address = localStorage.getItem(AUTH_ADDRESS_KEY);
  const timestampStr = localStorage.getItem(AUTH_TIMESTAMP_KEY);
  const timestamp = timestampStr ? parseInt(timestampStr, 10) : null;

  return { isAuthenticated, address, timestamp };
}

export function isAuthenticatedForAddress(address: string | undefined): boolean {
  if (!address) return false;
  
  const auth = getAuthentication();
  const signature = localStorage.getItem(AUTH_SIGNATURE_KEY);
  
  // Check basic authentication
  if (!auth.isAuthenticated || auth.address !== address) {
    return false;
  }
  
  // Check signature integrity
  if (!signature || !auth.timestamp) {
    clearAuthentication();
    return false;
  }
  
  const timestampStr = auth.timestamp.toString();
  if (!verifyAuthSignature(auth.address || '', timestampStr, signature)) {
    // Signature mismatch - possible tampering
    clearAuthentication();
    return false;
  }
  
  // Check session expiration
  if (isSessionExpired(auth.timestamp)) {
    clearAuthentication();
    return false;
  }
  
  return true;
}
