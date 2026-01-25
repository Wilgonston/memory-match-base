import { http, createConfig } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { coinbaseWallet } from 'wagmi/connectors';

// Get environment variables
const network = import.meta.env.VITE_NETWORK || 'sepolia';

// Determine which chains to use based on network configuration
const chains = network === 'mainnet' 
  ? [base, baseSepolia] as const
  : [baseSepolia, base] as const;

// Create wagmi configuration with Smart Wallet only
export const wagmiConfig = createConfig({
  chains,
  connectors: [
    // Coinbase Smart Wallet - primary connector
    coinbaseWallet({
      appName: 'Memory Match BASE',
      appLogoUrl: `${window.location.origin}/assets/miniapp/icon-512.svg`,
      preference: 'smartWalletOnly', // Force Smart Wallet creation
      version: '4', // Use latest version
    }),
  ],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
});
