import { http, createConfig } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { coinbaseWallet, walletConnect, injected } from 'wagmi/connectors';

// Get environment variables
const walletConnectProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '';
const network = import.meta.env.VITE_NETWORK || 'sepolia';

// Determine which chains to use based on network configuration
const chains = network === 'mainnet' 
  ? [base, baseSepolia] as const
  : [baseSepolia, base] as const;

// Create wagmi configuration with all wallet options
export const wagmiConfig = createConfig({
  chains,
  connectors: [
    // Coinbase Wallet with Smart Wallet preference
    // Smart Wallet provides gasless transactions and enhanced security
    // Following Base documentation best practices
    coinbaseWallet({
      appName: 'Memory Match BASE',
      appLogoUrl: `${window.location.origin}/assets/miniapp/icon-512.svg`,
      preference: 'smartWalletOnly', // Prefer Smart Wallet for best UX
    }),
    // Injected wallets (MetaMask, Zerion, etc.)
    injected(),
    // WalletConnect
    walletConnect({
      projectId: walletConnectProjectId,
      metadata: {
        name: 'Memory Match BASE',
        description: 'Web3 Memory Card Game on Base Blockchain',
        url: window.location.origin,
        icons: [`${window.location.origin}/assets/miniapp/icon-512.svg`],
      },
    }),
  ],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
});
