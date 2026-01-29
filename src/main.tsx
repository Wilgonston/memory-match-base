import React from 'react'
import ReactDOM from 'react-dom/client'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { OnchainKitProvider } from '@coinbase/onchainkit'
import './index.css'
import App from './App.tsx'
import { wagmiConfig } from './config/wagmi'
import { onchainKitConfig } from './config/onchainkit'
import { BaseAccountProvider } from './components/BaseAccountProvider'
import { initBaseApp } from './utils/baseApp'
import { setupGlobalFetchRetry, setupGlobalErrorHandler } from './utils/fetchRetry'

// Initialize Base App detection and optimizations
initBaseApp()

// Setup global fetch retry and error handling
setupGlobalFetchRetry({
  maxRetries: 3,
  retryDelay: 1000,
  exponentialBackoff: true,
  suppressAnalyticsErrors: true,
})

setupGlobalErrorHandler()

// Create a client for React Query with optimized defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 30 seconds before considering it stale
      staleTime: 30_000,
      // Keep unused data in cache for 5 minutes
      gcTime: 5 * 60 * 1000,
      // Retry failed queries twice before giving up
      retry: 2,
      // Don't automatically refetch when window regains focus
      // (prevents unnecessary refetches during gameplay)
      refetchOnWindowFocus: false,
      // Don't refetch on reconnect (we have manual refetch where needed)
      refetchOnReconnect: false,
    },
  },
})

function AppWithWalletModal() {
  return (
    <BaseAccountProvider>
      <App />
    </BaseAccountProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider
          apiKey={onchainKitConfig.apiKey}
          chain={onchainKitConfig.chain}
          config={{
            ...onchainKitConfig.config,
            // Disable analytics to prevent "Failed to fetch" errors
            analytics: {
              enabled: false,
            },
          }}
        >
          <AppWithWalletModal />
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>,
)
