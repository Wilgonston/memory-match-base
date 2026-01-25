/**
 * Test Utilities
 * 
 * Provides test wrappers with all necessary providers.
 */

import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { wagmiConfig } from '../config/wagmi';

// Create a test query client
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

/**
 * Wrapper with all providers for testing
 */
export function AllTheProviders({ children }: { children: React.ReactNode }) {
  const queryClient = createTestQueryClient();

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}

/**
 * Mock authentication for tests
 * Sets up localStorage to simulate authenticated state
 */
export function setupMockAuthentication(address = '0x1234567890123456789012345678901234567890') {
  localStorage.setItem('authenticated', 'true');
  localStorage.setItem('authenticatedAddress', address);
  localStorage.setItem('authTimestamp', Date.now().toString());
}

/**
 * Clear mock authentication
 */
export function clearMockAuthentication() {
  localStorage.removeItem('authenticated');
  localStorage.removeItem('authenticatedAddress');
  localStorage.removeItem('authTimestamp');
}

/**
 * Custom render function with providers
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllTheProviders, ...options });
}

// Re-export everything from testing library
export * from '@testing-library/react';
export { renderWithProviders as render };
