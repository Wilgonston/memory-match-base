import { http, createConfig, cookieStorage, createStorage } from 'wagmi';
import { base } from 'wagmi/chains';
import { coinbaseWallet, walletConnect, injected } from 'wagmi/connectors';
import { generateBuilderCodeSuffix, getBuilderCode } from '../utils/builderCode';

// Get environment variables
const walletConnectProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '';
const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;

// Use only Base Mainnet
const chains = [base] as const;

// Generate Builder Code data suffix for transaction attribution
// This automatically appends the Builder Code to all transactions
// See: https://docs.base.org/base-chain/builder-codes/app-developers
const builderCode = getBuilderCode();
const DATA_SUFFIX = builderCode ? generateBuilderCodeSuffix(builderCode) : undefined;

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
    // Use default Base RPC endpoint
    [base.id]: http(),
  },
  // Builder Code attribution for transaction tracking
  // Automatically appends Builder Code to all transactions for analytics and rewards
  // See: https://docs.base.org/base-chain/builder-codes/builder-codes
  ...(DATA_SUFFIX && { dataSuffix: DATA_SUFFIX }),
});
