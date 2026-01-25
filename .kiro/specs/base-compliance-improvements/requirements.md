# Base Compliance and Improvements - Requirements

## 1. Overview

This specification addresses comprehensive improvements to the Memory Match BASE application to ensure full compliance with Base documentation, OnchainKit best practices, and modern Web3 standards. The project is a memory card game built on Base blockchain with on-chain progress tracking.

### Current State Analysis

**What Works:**
- Core game mechanics (100 levels, card matching, star ratings)
- Smart contract deployed on Base Mainnet (0x93aC1C769aCE5caE403a454cBd236aB2EA7B17F5)
- Basic wallet connection with wagmi
- Local progress storage
- Property-based testing with fast-check
- 502/502 tests passing

**Critical Issues Identified:**

1. **OnchainKit Integration Issues**
   - Not using OnchainKit's Wallet components (using custom WalletButton instead)
   - Missing WalletModal for streamlined onboarding
   - No Identity components (Avatar, Name, Address, Badge)
   - Not leveraging OnchainKit's appearance configuration
   - Missing proper Smart Wallet onboarding flow

2. **Paymaster/Gas Sponsorship Issues**
   - Using deprecated `useWriteContracts` experimental hook
   - Incorrect Paymaster URL configuration
   - Not following ERC-7677 standard
   - Missing proper gas policy configuration guidance
   - No fallback for when Paymaster is unavailable

3. **Base Account Integration Missing**
   - No Basename resolution or display
   - Missing Base Account SDK integration
   - No authentication flow using Base Account
   - Not leveraging Base Account features

4. **Mini App Configuration Issues**
   - Missing proper Farcaster manifest
   - No account association in minikit.config.ts
   - Missing webhook configuration
   - Not following Mini App best practices

5. **Wallet Connection Issues**
   - Custom wallet button instead of OnchainKit components
   - No proper Smart Wallet preference enforcement
   - Missing wallet modal for better UX
   - No proper error handling for wallet connection
   - Only Coinbase Wallet showing (smartWalletOnly preference too restrictive)

6. **Missing Base Ecosystem Features**
   - No Basename integration
   - No proper identity display
   - Missing social features (Farcaster integration)
   - No proper Base branding

## 2. User Stories

### 2.1 As a new user, I want seamless wallet onboarding
**Acceptance Criteria:**
- User sees a professional wallet modal when connecting
- Smart Wallet creation is prioritized and explained
- Passkey authentication is clearly communicated
- Terms and privacy policy are displayed
- Connection errors are handled gracefully
- User can see their Basename if they have one

### 2.2 As a player, I want gas-free transactions
**Acceptance Criteria:**
- All on-chain transactions are sponsored by Paymaster
- User sees clear indication that transactions are gas-free
- Paymaster failures have proper fallback messaging
- Batch updates work with Paymaster
- Transaction status is clearly communicated

### 2.3 As a user, I want to see my Base identity
**Acceptance Criteria:**
- User's Basename is displayed if available
- User's avatar is shown (from Basename or generated)
- User's address is displayed in shortened format
- User can copy their address easily
- Identity is consistent across all screens

### 2.4 As a developer, I want proper Base documentation compliance
**Acceptance Criteria:**
- All OnchainKit components are used correctly
- Paymaster follows ERC-7677 standard
- Base Account SDK is properly integrated
- Mini App manifest is complete and valid
- Code follows Base best practices

### 2.5 As a user, I want the app to work as a Mini App
**Acceptance Criteria:**
- App works in Farcaster clients (Base app, Warpcast)
- Proper manifest with all required fields
- Account association is configured
- App metadata is complete (screenshots, icons, descriptions)
- Webhook is configured for notifications

### 2.6 As a player, I want reliable blockchain synchronization
**Acceptance Criteria:**
- Progress saves to blockchain automatically after level completion
- Manual save option is available
- Sync status is clearly displayed
- Conflicts between local and blockchain data are resolved
- Offline play is supported with later sync

## 3. Technical Requirements

### 3.1 OnchainKit Integration

**3.1.1 Wallet Components**
- Replace custom WalletButton with OnchainKit's `<Wallet>` component
- Implement `<WalletModal>` for streamlined onboarding
- Use `<ConnectWallet>` button with proper styling
- Implement `<WalletDropdown>` for account management
- Add `<WalletDropdownDisconnect>` for logout

**3.1.2 Identity Components**
- Implement `<Identity>` component for user display
- Add `<Avatar>` for user profile picture
- Add `<Name>` for Basename or address display
- Add `<Address>` with copy functionality
- Add `<Badge>` for verification status
- Add `<EthBalance>` display

**3.1.3 Configuration**
- Properly configure OnchainKitProvider with appearance settings
- Set up wallet modal configuration
- Configure terms and privacy URLs
- Set up proper theme (Base theme)
- Configure app name and logo

### 3.2 Paymaster Integration (ERC-7677 Compliant)

**3.2.1 Paymaster Configuration**
- Use correct Paymaster URL format: `https://api.developer.coinbase.com/rpc/v1/base/{API_KEY}`
- Implement proper capabilities check
- Use wagmi's `useWriteContracts` with capabilities
- Add fallback for non-Smart Wallet users
- Implement proper error handling

**3.2.2 Transaction Handling**
- Use `useCapabilities` to check Paymaster support
- Configure paymasterService in capabilities
- Handle both single and batch updates
- Show clear gas-free messaging
- Implement transaction status tracking

**3.2.3 Documentation**
- Add clear instructions for getting CDP API key
- Document gas policy configuration
- Explain contract allowlisting
- Provide troubleshooting guide

### 3.3 Base Account Integration

**3.3.1 Basename Resolution**
- Integrate `useBasename` hook for name resolution
- Display Basename in identity components
- Fall back to address if no Basename
- Cache Basename lookups

**3.3.2 Authentication**
- Implement proper sign-in flow
- Use Base Account for authentication
- Store authentication state properly
- Handle session management

### 3.4 Mini App Configuration

**3.4.1 Manifest Configuration**
- Create proper `public/.well-known/farcaster.json` manifest
- Add account association (header, payload, signature)
- Configure webhook URL for notifications
- Add all required metadata fields
- Include proper screenshots and icons

**3.4.2 Farcaster Integration**
- Support Farcaster Frame actions
- Handle Mini App context
- Implement proper deep linking
- Add social sharing features

### 3.5 Code Quality and Best Practices

**3.5.1 TypeScript**
- Ensure all types are properly defined
- Remove any `any` types
- Use proper type guards
- Implement proper error types

**3.5.2 Testing**
- Maintain 100% test pass rate
- Add tests for new components
- Test Paymaster integration
- Test wallet connection flows

**3.5.3 Documentation**
- Update README with new features
- Document all environment variables
- Add deployment guide
- Create troubleshooting section

## 4. Non-Functional Requirements

### 4.1 Performance
- Wallet connection should complete in < 3 seconds
- Paymaster transactions should complete in < 5 seconds
- Basename resolution should be cached
- App should load in < 2 seconds

### 4.2 Security
- All private keys must be in .env (never committed)
- Proper input validation on all contract calls
- Secure message signing for authentication
- Proper error handling to prevent information leakage

### 4.3 Accessibility
- All OnchainKit components maintain WCAG 2.1 AA compliance
- Keyboard navigation works throughout
- Screen reader support for all interactive elements
- Proper ARIA labels

### 4.4 Compatibility
- Works on Base Mainnet and Base Sepolia
- Compatible with all major wallets (Coinbase Wallet, MetaMask, WalletConnect)
- Works in Farcaster clients (Base app, Warpcast)
- Responsive design for mobile and desktop

## 5. Dependencies

### 5.1 Required Packages (Already Installed)
- `@coinbase/onchainkit`: ^1.1.2
- `wagmi`: ^2.19.5
- `viem`: ^2.44.4
- `@tanstack/react-query`: ^5.90.20

### 5.2 Environment Variables Required
- `VITE_ONCHAINKIT_API_KEY`: CDP API key (for OnchainKit and Paymaster)
- `VITE_WALLETCONNECT_PROJECT_ID`: WalletConnect project ID
- `VITE_NETWORK`: Network selection (mainnet/sepolia)
- `VITE_CONTRACT_ADDRESS`: Smart contract address

### 5.3 External Services
- Coinbase Developer Platform (CDP) for API keys
- WalletConnect Cloud for project ID
- Base RPC endpoints
- Basescan for contract verification

## 6. Success Criteria

### 6.1 Functional Success
- [ ] All OnchainKit components properly integrated
- [ ] Paymaster working for all transactions
- [ ] Basename resolution and display working
- [ ] Mini App manifest complete and valid
- [ ] All tests passing (502/502)

### 6.2 User Experience Success
- [ ] Wallet connection is seamless and intuitive
- [ ] Gas-free transactions work reliably
- [ ] Identity display is clear and professional
- [ ] App works in Farcaster clients
- [ ] Error messages are helpful and actionable

## 7. Out of Scope

The following items are explicitly out of scope for this specification:

- Documentation updates (README, guides, etc.)
- Leaderboard implementation (future feature)
- Achievement NFTs (future feature)
- Sound effects (future feature)
- Daily challenges (future feature)
- Multi-language support
- Smart contract modifications
- Backend server implementation
- Analytics integration

## 8. References

- [Base Documentation](https://docs.base.org/)
- [OnchainKit Documentation](https://onchainkit.xyz/)
- [Base Account Documentation](https://docs.base.org/base-account/overview/what-is-base-account)
- [Paymaster Documentation](https://docs.cdp.coinbase.com/paymaster/introduction/welcome)
- [Mini Apps Documentation](https://docs.base.org/mini-apps/introduction/overview)
- [ERC-7677 Standard](https://www.erc7677.xyz/)
- [Wagmi Documentation](https://wagmi.sh/)
- [Viem Documentation](https://viem.sh/)
