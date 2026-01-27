import { http, createConfig, cookieStorage, createStorage } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { coinbaseWallet, walletConnect } from 'wagmi/connectors';
import { isMainnet } from '../utils/network';

// Get environment variables
const walletConnectProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '';
const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;

// CRITICAL: Always use Base Mainnet as first chain
// This ensures Smart Wallet is created on Base Mainnet by default
const chains = [base, baseSepolia] as const;

// Create wagmi configuration with Base Account support
export const wagmiConfig = createConfig({
  chains,
  connectors: [
    // Coinbase Wallet with Smart Wallet (Base Account)
    // IMPORTANT: Smart Wallet will be created on the first chain (Base Mainnet)
    coinbaseWallet({
      appName: 'Memory Match BASE',
      appLogoUrl: `${appUrl}/assets/miniapp/icon-512-improved.svg`,
      preference: 'smartWalletOnly', // Force Smart Wallet creation
      version: '4', // Use latest SDK version
    }),
    // WalletConnect as fallback
    walletConnect({
      projectId: walletConnectProjectId,
      metadata: {
        name: 'Memory Match BASE',
        description: 'Web3 Memory Card Game on Base Blockchain',
        url: appUrl,
        icons: [`${appUrl}/assets/miniapp/icon-512-improved.svg`],
      },
      showQrModal: true,
    }),
  ],
  storage: createStorage({
    storage: cookieStorage,
  }),
  ssr: false,
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
});
