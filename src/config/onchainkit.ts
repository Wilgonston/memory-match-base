import { base, baseSepolia } from 'wagmi/chains';

// Get environment variables
const apiKey = import.meta.env.VITE_ONCHAINKIT_API_KEY || '';
const network = import.meta.env.VITE_NETWORK || 'sepolia';

// Determine the chain based on network configuration
export const defaultChain = network === 'mainnet' ? base : baseSepolia;

// Build Paymaster URL from API key
// Format: https://api.developer.coinbase.com/rpc/v1/base/YOUR_API_KEY
const paymasterUrl = apiKey 
  ? `https://api.developer.coinbase.com/rpc/v1/base/${apiKey}`
  : '';

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
    // Paymaster configuration for gas-free transactions (Smart Wallet only)
    paymaster: paymasterUrl ? {
      url: paymasterUrl,
    } : undefined,
  },
};

// Export chain for use in components
export { base, baseSepolia };
