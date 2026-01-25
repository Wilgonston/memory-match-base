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
    coinbaseWallet({
      appName: 'Memory Match BASE',
      appLogoUrl: `${window.location.origin}/assets/miniapp/icon-512.svg`,
      preference: 'smartWalletOnly', // Prioritize Smart Wallet for gas-free transactions
    }),
    // Injected wallets (MetaMask, Zerion, etc.) - will prompt to create Smart Wallet
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
