import { http, createConfig, cookieStorage, createStorage, fallback } from 'wagmi';
import { base } from 'wagmi/chains';
import { coinbaseWallet, walletConnect, injected } from 'wagmi/connectors';

// Get environment variables
const walletConnectProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '';
const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
const baseRpcUrl = import.meta.env.VITE_BASE_RPC_URL;

// Use only Base Mainnet
const chains = [base] as const;

// Create multiple RPC transports for fallback/rotation
const rpcTransports = [
  // Primary: Custom RPC if provided
  ...(baseRpcUrl ? [http(baseRpcUrl)] : []),
  // Fallback 1: Public Base RPC
  http('https://mainnet.base.org'),
  // Fallback 2: Alchemy public endpoint
  http('https://base-mainnet.g.alchemy.com/v2/demo'),
  // Fallback 3: Default wagmi RPC
  http(),
];

// Create wagmi configuration with multiple wallet options
export const wagmiConfig = createConfig({
  chains,
  connectors: [
    // Coinbase Wallet with Smart Wallet (Base Account) - RECOMMENDED
    coinbaseWallet({
      appName: 'Memory Match BASE',
      appLogoUrl: `${appUrl}/assets/miniapp/icon-512-improved.svg`,
      preference: 'smartWalletOnly', // Force Smart Wallet creation
      version: '4', // Use latest SDK version
    }),
    // Injected wallets (MetaMask, Brave Wallet, etc.)
    injected({
      target: 'metaMask',
    }),
    // WalletConnect for mobile wallets and other options
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
    // Use fallback transport with multiple RPC endpoints for automatic rotation
    [base.id]: fallback(rpcTransports, {
      rank: true, // Enable ranking to prefer faster RPCs
      retryCount: 3, // Retry failed requests
      retryDelay: 1000, // 1 second delay between retries
    }),
  },
});
