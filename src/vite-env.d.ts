/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_URL: string;
  readonly VITE_ONCHAINKIT_API_KEY: string;
  readonly VITE_WALLETCONNECT_PROJECT_ID: string;
  readonly VITE_PROGRESS_CONTRACT_MAINNET: string;
  readonly VITE_PROGRESS_CONTRACT_SEPOLIA: string;
  readonly VITE_NETWORK: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
