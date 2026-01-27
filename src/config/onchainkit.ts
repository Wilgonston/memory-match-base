import { base, baseSepolia } from 'wagmi/chains';

// Get environment variables
const apiKey = import.meta.env.VITE_ONCHAINKIT_API_KEY || '';
const network = import.meta.env.VITE_NETWORK || 'sepolia';

// Determine the chain based on network configuration
export const defaultChain = network === 'mainnet' ? base : baseSepolia;

// Build Paymaster URL from API key following ERC-7677 standard
// Format: https://api.developer.coinbase.com/rpc/v1/base/{API_KEY}
// The same API key is used for both OnchainKit features and Paymaster sponsorship
const paymasterUrl = apiKey 
  ? `https://api.developer.coinbase.com/rpc/v1/base/${apiKey}`
  : undefined;

// OnchainKit configuration with Paymaster and Smart Wallet support
export const onchainKitConfig = {
  apiKey,
  chain: defaultChain,
  config: {
    appearance: {
      mode: 'auto' as const, // 'auto', 'light', or 'dark'
      theme: 'base' as const, // Use BASE theme
      name: 'Memory Match BASE',
      logo: `${window.location.origin}/assets/miniapp/icon-512.svg`,
    },
    // Wallet configuration for Smart Wallet support
    wallet: {
      display: 'modal' as const,
      termsUrl: 'https://www.coinbase.com/legal/user-agreement',
      privacyUrl: 'https://www.coinbase.com/legal/privacy',
    },
    // Paymaster URL for gas-free transactions (Smart Wallet only)
    paymaster: paymasterUrl,
  },
};

// Export chain for use in components
export { base, baseSepolia };
