const AUTH_KEY = 'authenticated';
const AUTH_ADDRESS_KEY = 'authenticatedAddress';
const AUTH_TIMESTAMP_KEY = 'authTimestamp';

export function setAuthentication(address: string): void {
  localStorage.setItem(AUTH_KEY, 'true');
  localStorage.setItem(AUTH_ADDRESS_KEY, address);
  localStorage.setItem(AUTH_TIMESTAMP_KEY, Date.now().toString());
}

export function clearAuthentication(): void {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(AUTH_ADDRESS_KEY);
  localStorage.removeItem(AUTH_TIMESTAMP_KEY);
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
  return auth.isAuthenticated && auth.address === address;
}
