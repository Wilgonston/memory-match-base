import { http, createConfig } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { coinbaseWallet, walletConnect } from 'wagmi/connectors';
import { isMainnet } from '../utils/network';

// Get environment variables
const walletConnectProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '';

// Determine which chains to use based on network configuration
const chains = isMainnet() 
  ? [base, baseSepolia] as const
  : [baseSepolia, base] as const;

// Create wagmi configuration with all wallet options
export const wagmiConfig = createConfig({
  chains,
  connectors: [
    // Coinbase Wallet with Smart Wallet preference
    coinbaseWallet({
      appName: 'Memory Match BASE',
      appLogoUrl: 'https://memory-match-base.vercel.app/assets/miniapp/icon-512-improved.svg',
      preference: 'smartWalletOnly',
    }),
    // WalletConnect
    walletConnect({
      projectId: walletConnectProjectId,
      metadata: {
        name: 'Memory Match BASE',
        description: 'Web3 Memory Card Game on Base Blockchain',
        url: 'https://memory-match-base.vercel.app',
        icons: ['https://memory-match-base.vercel.app/assets/miniapp/icon-512-improved.svg'],
      },
    }),
  ],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
});
