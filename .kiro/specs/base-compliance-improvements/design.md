# Base Compliance and Improvements - Design Document

## 1. Architecture Overview

### 1.1 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React Application                        │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ OnchainKit   │  │ Wagmi/Viem   │  │ React Query  │      │
│  │ Components   │  │ Hooks        │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Wallet       │  │ Identity     │  │ Transaction  │      │
│  │ Management   │  │ Resolution   │  │ Management   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
├─────────────────────────────────────────────────────────────┤
│                    Base Infrastructure                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Base RPC     │  │ Paymaster    │  │ Smart        │      │
│  │              │  │ Service      │  │ Contract     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Component Hierarchy

```
App
├── OnchainKitProvider (with config)
│   ├── WagmiProvider
│   │   ├── QueryClientProvider
│   │   │   ├── LoginScreen
│   │   │   │   └── Wallet Components
│   │   │   │       ├── ConnectWallet
│   │   │   │       └── Identity Display
│   │   │   ├── LevelSelect
│   │   │   │   ├── Header (with Wallet)
│   │   │   │   └── Level Grid
│   │   │   └── GameBoard
│   │   │       ├── Header (with Wallet)
│   │   │       ├── Grid
│   │   │       └── SaveProgressButton
```

## 2. Detailed Component Design

### 2.1 OnchainKit Provider Configuration

**File:** `src/main.tsx`

**Current Issues:**
- Basic configuration without wallet modal settings
- Missing appearance customization
- No proper theme configuration

**Proposed Solution:**

```typescript
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { base } from 'wagmi/chains';

const onchainKitConfig = {
  apiKey: import.meta.env.VITE_ONCHAINKIT_API_KEY,
  chain: base,
  config: {
    appearance: {
      mode: 'auto' as const,
      theme: 'base' as const,
      name: 'Memory Match BASE',
      logo: '/assets/miniapp/icon-512.svg',
    },
    wallet: {
      display: 'modal' as const,
      termsUrl: 'https://www.coinbase.com/legal/user-agreement',
      privacyUrl: 'https://www.coinbase.com/legal/privacy',
    },
  },
};

<OnchainKitProvider {...onchainKitConfig}>
  <App />
</OnchainKitProvider>
```

**Correctness Properties:**
- **Property 2.1.1**: Provider configuration must include all required fields (apiKey, chain, config)
- **Property 2.1.2**: Wallet display mode must be 'modal' for streamlined onboarding
- **Property 2.1.3**: Theme must be 'base' for consistent Base branding

### 2.2 Wallet Component Replacement

**File:** `src/components/WalletButton.tsx` → `src/components/WalletComponents.tsx`

**Current Issues:**
- Custom implementation instead of OnchainKit components
- No identity display
- No proper dropdown for account management
- Missing Basename integration

**Proposed Solution:**

```typescript
import {
  Wallet,
  ConnectWallet,
  WalletDropdown,
  WalletDropdownDisconnect,
  Identity,
  Avatar,
  Name,
  Address,
  Badge,
  EthBalance,
} from '@coinbase/onchainkit/wallet';
import { color } from '@coinbase/onchainkit/theme';

export function WalletComponents() {
  return (
    <Wallet>
      <ConnectWallet>
        <Avatar className="h-6 w-6" />
        <Name />
      </ConnectWallet>
      <WalletDropdown>
        <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
          <Avatar />
          <Name />
          <Address className={color.foregroundMuted} />
          <EthBalance />
        </Identity>
        <WalletDropdownDisconnect />
      </WalletDropdown>
    </Wallet>
  );
}
```

**Correctness Properties:**
- **Property 2.2.1**: Wallet component must render ConnectWallet button when disconnected
- **Property 2.2.2**: Wallet component must render WalletDropdown when connected
- **Property 2.2.3**: Identity component must display Basename if available, otherwise address
- **Property 2.2.4**: Address must be copyable via hasCopyAddressOnClick prop

### 2.3 Identity Display Component

**File:** `src/components/IdentityDisplay.tsx`

**Current Issues:**
- No dedicated identity display component
- Basename not resolved or displayed
- No avatar display

**Proposed Solution:**

```typescript
import { Identity, Avatar, Name, Address, Badge } from '@coinbase/onchainkit/identity';
import { useAccount } from 'wagmi';
import { base } from 'wagmi/chains';

interface IdentityDisplayProps {
  address?: string;
  className?: string;
  showBadge?: boolean;
  showAddress?: boolean;
}

export function IdentityDisplay({ 
  address: propAddress, 
  className = '',
  showBadge = true,
  showAddress = true,
}: IdentityDisplayProps) {
  const { address: connectedAddress } = useAccount();
  const address = propAddress || connectedAddress;

  if (!address) return null;

  return (
    <Identity
      address={address as `0x${string}`}
      chain={base}
      className={className}
    >
      <Avatar />
      <Name>
        {showBadge && <Badge />}
      </Name>
      {showAddress && <Address />}
    </Identity>
  );
}
```

**Correctness Properties:**
- **Property 2.3.1**: Identity must resolve Basename from address
- **Property 2.3.2**: Avatar must display Basename avatar or generated avatar
- **Property 2.3.3**: Name must display Basename if available, otherwise shortened address
- **Property 2.3.4**: Badge must display verification status when showBadge is true

### 2.4 Paymaster Integration (ERC-7677 Compliant)

**File:** `src/components/SaveProgressButton.tsx`

**Current Issues:**
- Using experimental hooks incorrectly
- Paymaster URL format is wrong
- Not following ERC-7677 standard
- No proper capabilities check

**Proposed Solution:**

```typescript
import { useAccount, useWriteContracts, useCapabilities } from 'wagmi/experimental';
import { base } from 'wagmi/chains';
import { useMemo } from 'react';

export function SaveProgressButton({ level, stars }: Props) {
  const { address } = useAccount();
  
  // Check for paymaster capabilities (ERC-7677)
  const { data: availableCapabilities } = useCapabilities({
    account: address,
  });

  // Configure paymaster capabilities
  const capabilities = useMemo(() => {
    if (!availableCapabilities || !address) return {};
    
    const capabilitiesForChain = availableCapabilities[base.id];
    
    if (
      capabilitiesForChain?.['paymasterService'] &&
      capabilitiesForChain['paymasterService'].supported
    ) {
      const apiKey = import.meta.env.VITE_ONCHAINKIT_API_KEY;
      
      return {
        paymasterService: {
          url: `https://api.developer.coinbase.com/rpc/v1/base/${apiKey}`,
        },
      };
    }
    
    return {};
  }, [availableCapabilities, address]);

  const { writeContracts } = useWriteContracts({
    mutation: {
      onSuccess: (data) => {
        console.log('Transaction successful:', data);
      },
      onError: (error) => {
        console.error('Transaction failed:', error);
      },
    },
  });

  const handleSave = () => {
    writeContracts({
      contracts: [
        {
          address: contractAddress,
          abi: MEMORY_MATCH_PROGRESS_ABI,
          functionName: 'update',
          args: [level, stars],
        },
      ],
      capabilities,
    });
  };

  const hasPaymaster = Object.keys(capabilities).length > 0;

  return (
    <button onClick={handleSave}>
      Save to Blockchain
      {hasPaymaster && <span>✨ Gas-free</span>}
    </button>
  );
}
```

**Correctness Properties:**
- **Property 2.4.1**: Paymaster URL must follow format: `https://api.developer.coinbase.com/rpc/v1/base/{API_KEY}`
- **Property 2.4.2**: Capabilities must be checked before attempting sponsored transaction
- **Property 2.4.3**: Transaction must fall back to regular transaction if Paymaster unavailable
- **Property 2.4.4**: User must be informed whether transaction is gas-free or not

### 2.5 Basename Hook Integration

**File:** `src/hooks/useBasename.ts`

**Current Issues:**
- No Basename resolution
- No caching of Basename lookups
- No integration with OnchainKit

**Proposed Solution:**

```typescript
import { useQuery } from '@tanstack/react-query';
import { base } from 'wagmi/chains';
import { normalize } from 'viem/ens';
import { usePublicClient } from 'wagmi';

export function useBasename(address?: `0x${string}`) {
  const publicClient = usePublicClient({ chainId: base.id });

  return useQuery({
    queryKey: ['basename', address],
    queryFn: async () => {
      if (!address || !publicClient) return null;
      
      try {
        // Reverse lookup for Basename
        const basename = await publicClient.getEnsName({
          address,
        });
        
        return basename;
      } catch (error) {
        console.error('Failed to resolve basename:', error);
        return null;
      }
    },
    enabled: !!address && !!publicClient,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });
}
```

**Correctness Properties:**
- **Property 2.5.1**: Basename lookup must be cached for 5 minutes
- **Property 2.5.2**: Basename lookup must return null if address has no Basename
- **Property 2.5.3**: Basename lookup must handle errors gracefully
- **Property 2.5.4**: Basename lookup must only execute when address is provided

### 2.6 Mini App Manifest Configuration

**File:** `public/.well-known/farcaster.json`

**Current Issues:**
- Missing Farcaster manifest
- No account association
- Incomplete metadata

**Proposed Solution:**

```json
{
  "accountAssociation": {
    "header": "eyJmaWQiOjEyMzQ1LCJ0eXBlIjoiY3VzdG9keSIsImtleSI6IjB4...",
    "payload": "eyJkb21haW4iOiJtZW1vcnktbWF0Y2gtYmFzZS5hcHAifQ==",
    "signature": "MHg..."
  },
  "miniapp": {
    "version": "1",
    "name": "Memory Match BASE",
    "homeUrl": "https://memory-match-base.app",
    "iconUrl": "https://memory-match-base.app/assets/miniapp/icon-512.svg",
    "splashImageUrl": "https://memory-match-base.app/assets/miniapp/splash.svg",
    "splashBackgroundColor": "#0052FF",
    "webhookUrl": "https://memory-match-base.app/api/webhook",
    "subtitle": "Test your memory with BASE projects",
    "description": "Classic memory card game featuring BASE blockchain ecosystem projects. Match pairs, complete 100 levels, and master the BASE ecosystem!",
    "screenshotUrls": [
      "https://memory-match-base.app/screenshots/gameplay.svg",
      "https://memory-match-base.app/screenshots/level-select.svg"
    ],
    "primaryCategory": "games",
    "tags": ["memory", "game", "base", "crypto", "puzzle"],
    "heroImageUrl": "https://memory-match-base.app/assets/miniapp/hero.svg",
    "tagline": "Master the BASE ecosystem through memory!",
    "ogTitle": "Memory Match BASE - Blockchain Memory Game",
    "ogDescription": "Test your memory with BASE blockchain projects. 100 levels of crypto fun!",
    "ogImageUrl": "https://memory-match-base.app/assets/miniapp/og-image.svg",
    "noindex": false
  }
}
```

**Correctness Properties:**
- **Property 2.6.1**: Manifest must include valid account association
- **Property 2.6.2**: All URLs must be absolute and publicly accessible
- **Property 2.6.3**: Icon must be 512x512 SVG or PNG
- **Property 2.6.4**: Screenshots must be representative of actual app

### 2.7 Batch Update with Paymaster

**File:** `src/hooks/useBatchUpdateLevels.ts`

**Current Issues:**
- Batch update exists but may not work with Paymaster
- No proper error handling for batch operations
- No progress indication for batch operations

**Proposed Solution:**

```typescript
import { useWriteContracts, useCapabilities } from 'wagmi/experimental';
import { base } from 'wagmi/chains';
import { useMemo, useState } from 'react';

export function useBatchUpdateLevels() {
  const { address } = useAccount();
  const [isUpdating, setIsUpdating] = useState(false);
  
  const { data: availableCapabilities } = useCapabilities({
    account: address,
  });

  const capabilities = useMemo(() => {
    if (!availableCapabilities || !address) return {};
    
    const capabilitiesForChain = availableCapabilities[base.id];
    
    if (
      capabilitiesForChain?.['paymasterService'] &&
      capabilitiesForChain['paymasterService'].supported
    ) {
      const apiKey = import.meta.env.VITE_ONCHAINKIT_API_KEY;
      
      return {
        paymasterService: {
          url: `https://api.developer.coinbase.com/rpc/v1/base/${apiKey}`,
        },
      };
    }
    
    return {};
  }, [availableCapabilities, address]);

  const { writeContracts } = useWriteContracts({
    mutation: {
      onSuccess: () => {
        setIsUpdating(false);
      },
      onError: () => {
        setIsUpdating(false);
      },
    },
  });

  const batchUpdate = async (levels: number[], stars: number[]) => {
    if (levels.length !== stars.length) {
      throw new Error('Levels and stars arrays must have same length');
    }
    
    if (levels.length === 0) {
      throw new Error('Cannot batch update with empty arrays');
    }

    setIsUpdating(true);

    writeContracts({
      contracts: [
        {
          address: contractAddress,
          abi: MEMORY_MATCH_PROGRESS_ABI,
          functionName: 'batchUpdate',
          args: [levels, stars],
        },
      ],
      capabilities,
    });
  };

  return {
    batchUpdate,
    isUpdating,
    hasPaymaster: Object.keys(capabilities).length > 0,
  };
}
```

**Correctness Properties:**
- **Property 2.7.1**: Batch update must validate that levels and stars arrays have same length
- **Property 2.7.2**: Batch update must not accept empty arrays
- **Property 2.7.3**: Batch update must use Paymaster if available
- **Property 2.7.4**: Batch update must provide progress indication

## 3. Data Flow

### 3.1 Wallet Connection Flow

```
User clicks "Connect Wallet"
    ↓
OnchainKit WalletModal opens
    ↓
User selects wallet type
    ↓
Smart Wallet creation (if new user)
    ↓
Passkey authentication
    ↓
Wallet connected
    ↓
Basename resolution (if available)
    ↓
Identity displayed in UI
```

### 3.2 Transaction Flow (with Paymaster)

```
User completes level
    ↓
Check Paymaster capabilities
    ↓
If Paymaster available:
    Configure paymasterService capability
    ↓
    Call writeContracts with capabilities
    ↓
    Transaction sponsored (gas-free)
    ↓
    Show success message
Else:
    Show "Paymaster unavailable" message
    ↓
    User can choose to pay gas or skip
```

### 3.3 Basename Resolution Flow

```
Wallet connected
    ↓
Extract address
    ↓
Check cache for Basename
    ↓
If cached:
    Return cached Basename
Else:
    Query Base L2 resolver
    ↓
    If Basename exists:
        Cache for 5 minutes
        ↓
        Return Basename
    Else:
        Return null
        ↓
        Display shortened address
```

## 4. State Management

### 4.1 Wallet State

```typescript
interface WalletState {
  address?: `0x${string}`;
  isConnected: boolean;
  isConnecting: boolean;
  basename?: string;
  avatar?: string;
  balance?: bigint;
}
```

### 4.2 Transaction State

```typescript
interface TransactionState {
  status: 'idle' | 'pending' | 'success' | 'error';
  hash?: string;
  error?: string;
  isGasFree: boolean;
}
```

### 4.3 Paymaster State

```typescript
interface PaymasterState {
  isAvailable: boolean;
  isChecking: boolean;
  error?: string;
}
```

## 5. Error Handling

### 5.1 Wallet Connection Errors

```typescript
enum WalletError {
  USER_REJECTED = 'User rejected connection',
  WALLET_NOT_FOUND = 'No wallet found',
  NETWORK_MISMATCH = 'Wrong network',
  UNKNOWN = 'Unknown error',
}

function handleWalletError(error: Error): WalletError {
  if (error.message.includes('User rejected')) {
    return WalletError.USER_REJECTED;
  }
  if (error.message.includes('No provider')) {
    return WalletError.WALLET_NOT_FOUND;
  }
  if (error.message.includes('chain')) {
    return WalletError.NETWORK_MISMATCH;
  }
  return WalletError.UNKNOWN;
}
```

### 5.2 Paymaster Errors

```typescript
enum PaymasterError {
  NOT_AVAILABLE = 'Paymaster not available',
  POLICY_VIOLATION = 'Transaction violates gas policy',
  RATE_LIMIT = 'Rate limit exceeded',
  UNKNOWN = 'Unknown paymaster error',
}

function handlePaymasterError(error: Error): PaymasterError {
  if (error.message.includes('not available')) {
    return PaymasterError.NOT_AVAILABLE;
  }
  if (error.message.includes('policy')) {
    return PaymasterError.POLICY_VIOLATION;
  }
  if (error.message.includes('rate limit')) {
    return PaymasterError.RATE_LIMIT;
  }
  return PaymasterError.UNKNOWN;
}
```

### 5.3 Transaction Errors

```typescript
enum TransactionError {
  INSUFFICIENT_GAS = 'Insufficient gas',
  NONCE_TOO_LOW = 'Nonce too low',
  REPLACEMENT_UNDERPRICED = 'Replacement transaction underpriced',
  USER_REJECTED = 'User rejected transaction',
  UNKNOWN = 'Unknown transaction error',
}
```

## 6. Testing Strategy

### 6.1 Unit Tests

**Wallet Components:**
- Test wallet connection flow
- Test wallet disconnection
- Test identity display with Basename
- Test identity display without Basename
- Test error handling

**Paymaster Integration:**
- Test capabilities check
- Test transaction with Paymaster
- Test transaction without Paymaster
- Test error handling
- Test fallback behavior

**Basename Resolution:**
- Test Basename lookup with valid address
- Test Basename lookup with invalid address
- Test caching behavior
- Test error handling

### 6.2 Property-Based Tests

**Property 2.1**: Wallet connection must always result in either connected or error state
**Property 2.2**: Paymaster capabilities check must return boolean
**Property 2.3**: Basename resolution must return string or null
**Property 2.4**: Transaction with Paymaster must not require gas from user
**Property 2.5**: Identity component must always display either Basename or address

### 6.3 Integration Tests

- Test complete wallet connection flow
- Test complete transaction flow with Paymaster
- Test complete Basename resolution flow
- Test Mini App manifest loading
- Test error recovery flows

## 7. Performance Considerations

### 7.1 Caching Strategy

- Basename lookups: 5 minute cache
- Wallet capabilities: 1 minute cache
- Contract reads: 30 second cache
- Avatar images: Browser cache with long TTL

### 7.2 Optimization Techniques

- Lazy load OnchainKit components
- Debounce Basename lookups
- Batch contract reads when possible
- Use React.memo for expensive components

### 7.3 Bundle Size

- OnchainKit components are tree-shakeable
- Use dynamic imports for heavy components
- Optimize images (SVG preferred)
- Minimize CSS bundle

## 8. Security Considerations

### 8.1 API Key Management

- Never commit API keys to repository
- Use environment variables
- Validate API key format before use
- Rotate keys regularly

### 8.2 Transaction Security

- Validate all contract inputs
- Use proper type checking
- Implement transaction simulation before sending
- Handle revert reasons properly

### 8.3 User Data

- Never store private keys
- Use secure session management
- Implement proper authentication
- Clear sensitive data on logout

## 9. Deployment Considerations

### 9.1 Environment Configuration

**Development:**
- Use Base Sepolia testnet
- Use test API keys
- Enable debug logging
- Disable analytics

**Production:**
- Use Base Mainnet
- Use production API keys
- Disable debug logging
- Enable analytics
- Enable error tracking

### 9.2 Vercel Deployment

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "framework": "vite",
  "env": {
    "VITE_NETWORK": "mainnet",
    "VITE_CHAIN_ID": "8453",
    "VITE_CONTRACT_ADDRESS": "0x93aC1C769aCE5caE403a454cBd236aB2EA7B17F5"
  }
}
```

### 9.3 CDN Configuration

- Serve static assets from CDN
- Enable compression (gzip/brotli)
- Set proper cache headers
- Use immutable assets

## 10. Monitoring and Analytics

### 10.1 Key Metrics

- Wallet connection success rate
- Paymaster transaction success rate
- Basename resolution success rate
- Average transaction time
- Error rates by type

### 10.2 Error Tracking

- Track wallet connection errors
- Track transaction errors
- Track Paymaster errors
- Track Basename resolution errors

## 11. Correctness Properties Summary

### Core Properties

1. **Wallet Connection**: Connection must always result in connected or error state
2. **Paymaster**: Transactions must be gas-free when Paymaster is available
3. **Basename**: Resolution must return Basename or null, never error
4. **Identity**: Must always display either Basename or shortened address
5. **Transactions**: Must validate inputs before sending
6. **Caching**: Must respect cache TTLs for all lookups
7. **Error Handling**: Must provide actionable error messages
8. **Security**: Must never expose private keys or sensitive data

### Testing Framework

- Use fast-check for property-based testing
- Use vitest for unit and integration tests
- Use testing-library for component tests
- Maintain 100% test pass rate

## 12. Migration Plan

### Phase 1: OnchainKit Components (Priority: High)
1. Replace WalletButton with OnchainKit Wallet components
2. Add Identity components throughout app
3. Update LoginScreen to use WalletModal
4. Test wallet connection flow

### Phase 2: Paymaster Integration (Priority: High)
1. Fix Paymaster URL configuration
2. Implement proper capabilities check
3. Update SaveProgressButton
4. Update batch update functionality
5. Test gas-free transactions

### Phase 3: Basename Integration (Priority: Medium)
1. Implement useBasename hook
2. Add Basename display to Identity components
3. Add caching for Basename lookups
4. Test Basename resolution

### Phase 4: Mini App Configuration (Priority: Medium)
1. Create Farcaster manifest
2. Add account association
3. Configure webhook
4. Test in Farcaster clients

### Phase 5: Testing and Deployment (Priority: High)
1. Run all tests
2. Fix any issues
3. Deploy to production
4. Verify functionality

## 13. Success Metrics

- [ ] All OnchainKit components integrated
- [ ] Paymaster working for 95%+ of transactions
- [ ] Basename resolution working for 100% of addresses
- [ ] Mini App manifest validated
- [ ] All tests passing (502/502)
- [ ] Zero critical bugs in production
- [ ] User satisfaction > 90%
