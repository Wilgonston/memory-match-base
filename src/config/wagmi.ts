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

// Create wagmi configuration
export const wagmiConfig = createConfig({
  chains,
  connectors: [
    injected(),
    coinbaseWallet({
      appName: 'Memory Match BASE',
      appLogoUrl: `${window.location.origin}/icon-512.png`,
      preference: 'smartWalletOnly', // Use Smart Wallet with passkeys
    }),
    walletConnect({
      projectId: walletConnectProjectId,
      metadata: {
        name: 'Memory Match BASE',
        description: 'Classic memory card game featuring BASE blockchain ecosystem projects',
        url: window.location.origin,
        icons: [`${window.location.origin}/icon-512.png`],
      },
    }),
  ],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
});
