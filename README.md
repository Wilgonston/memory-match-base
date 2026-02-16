# 🎮 Memory Match BASE

A production-ready Web3 memory card game built on Base blockchain with full OnchainKit integration, Smart Wallet support, and gasless transactions.

![Memory Match BASE](public/assets/miniapp/hero.svg)

## 🌟 Features

### Core Gameplay
- **100 Progressive Levels** - From 4x4 to 8x8 grids with increasing difficulty
- **Star Rating System** - Earn 1-3 stars based on performance
- **20+ Base Projects** - Learn the Base ecosystem while playing
- **Sound Effects** - Immersive audio feedback (flip, match, victory)
- **Responsive Design** - Optimized for mobile, tablet, and desktop

### Web3 Integration
- **Smart Wallet** - Passkey-secured, no seed phrases needed
- **Gasless Transactions** - All transactions sponsored via Coinbase Paymaster
- **On-Chain Progress** - Save your progress to Base blockchain
- **Base Account Integration** - Seamless authentication and payments
- **OnchainKit Components** - Production-ready UI components

### Technical Excellence
- **502/502 Tests Passing** - Comprehensive test coverage
- **Property-Based Testing** - Using fast-check for robust validation
- **Error Boundaries** - Graceful error handling for Web3 operations
- **Performance Optimized** - Code splitting and lazy loading
- **Accessibility** - WCAG 2.1 AA compliant

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- A Coinbase Developer Platform account
- WalletConnect Project ID

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/memory-match-base.git
cd memory-match-base

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
```

### Environment Configuration

Edit `.env` and add your API keys:

```env
# Required - Get from https://portal.cdp.coinbase.com/
VITE_ONCHAINKIT_API_KEY=your_api_key_here
VITE_CDP_PROJECT_ID=your_project_id_here

# Required - Get from https://cloud.walletconnect.com/
VITE_WALLETCONNECT_PROJECT_ID=your_project_id_here

# Network Configuration
VITE_NETWORK=mainnet

# Smart Contract (Base Mainnet)
VITE_CONTRACT_ADDRESS=0x93aC1C769aCE5caE403a454cBd236aB2EA7B17F5

# Optional - Get from https://base.dev/ > Settings > Builder Code
VITE_BUILDER_CODE=bc_xxxxxxxx
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📦 Build & Deploy

### Build for Production

```bash
npm run build
```

The build output will be in the `dist/` directory.

### Deploy to Vercel

#### Option 1: Vercel Dashboard

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com) and import your repository
3. Add environment variables in project settings
4. Deploy

#### Option 2: Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

### Environment Variables for Production

Set these in your deployment platform:

| Variable | Value | Required |
|----------|-------|----------|
| `VITE_NETWORK` | `mainnet` | Yes |
| `VITE_CONTRACT_ADDRESS` | `0x93aC1C769aCE5caE403a454cBd236aB2EA7B17F5` | Yes |
| `VITE_ONCHAINKIT_API_KEY` | Your API key | Yes |
| `VITE_CDP_PROJECT_ID` | Your project ID | Yes |
| `VITE_WALLETCONNECT_PROJECT_ID` | Your project ID | Yes |
| `VITE_BUILDER_CODE` | Your Builder Code | Optional |

## 🔑 Getting API Keys

### OnchainKit API Key (Required)

This key enables both OnchainKit features AND Paymaster gas sponsorship.

1. Visit [Coinbase Developer Platform](https://portal.cdp.coinbase.com/)
2. Create a new project or select existing
3. Navigate to API Keys section
4. Create a new API key
5. Copy to your `.env` file

**Important:** This single API key is used for:
- OnchainKit UI components
- Paymaster gas sponsorship (ERC-7677 compliant)
- Base Account integration

### WalletConnect Project ID (Required)

1. Visit [WalletConnect Cloud](https://cloud.walletconnect.com/)
2. Create a new project
3. Copy the Project ID
4. Add to your `.env` file

### Builder Code (Optional)

Builder Codes enable transaction attribution for analytics and rewards.

1. Visit [base.dev](https://base.dev/)
2. Register your app
3. Go to **Settings** → **Builder Code**
4. Copy your code (format: `bc_xxxxxxxx`)
5. Add to your `.env` file

**Benefits:**
- Track onchain usage and user acquisition
- Qualify for BASE rewards program
- Show up in BASE App leaderboards
- Understand user acquisition channels

See [docs/BUILDER_CODES.md](docs/BUILDER_CODES.md) for detailed integration guide.

## 🎮 How to Play

### 1. Connect Wallet

Click "Connect Wallet" to create a Smart Wallet using Passkey (biometric authentication). No seed phrases needed!

### 2. Authenticate

Sign a message to prove wallet ownership (free, no gas required).

### 3. Select Level

Choose from 100 levels. Complete levels to unlock the next ones.

### 4. Match Cards

Click cards to flip and find matching pairs. Complete all pairs to win!

### 5. Earn Stars

- ⭐ 1 star: Complete the level
- ⭐⭐ 2 stars: Good performance
- ⭐⭐⭐ 3 stars: Excellent performance

### 6. Save Progress

Your progress is automatically saved to the Base blockchain (gasless!).

## 🏗️ Tech Stack

### Frontend
- **React 19** - Latest React with concurrent features
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first styling

### Web3 Stack
- **OnchainKit 1.1.2** - Coinbase's React components for onchain apps
- **wagmi 2.19.5** - React hooks for Ethereum
- **viem 2.44.4** - TypeScript interface for Ethereum
- **Base Account SDK** - Authentication and payments

### Wallet Integration
- **Coinbase Smart Wallet** - Passkey-secured, gasless transactions
- **WalletConnect** - Multi-wallet support
- **Injected Wallets** - MetaMask, Zerion, etc.

### Testing
- **Vitest** - Fast unit test runner
- **Testing Library** - React component testing
- **fast-check** - Property-based testing
- **502/502 tests passing** ✅

### Smart Contract
- **Solidity 0.8.20** - Latest stable version
- **Hardhat** - Development environment
- **Gas-optimized** - Bit-packing for efficient storage

## 📁 Project Structure

```
memory-match-base/
├── src/
│   ├── components/          # React components
│   │   ├── WalletComponents.tsx    # OnchainKit wallet UI
│   │   ├── LoginScreen.tsx         # Authentication
│   │   ├── LevelSelect.tsx         # Level selection
│   │   ├── GameBoard.tsx           # Main game
│   │   └── Card.tsx                # Memory card
│   ├── hooks/               # Custom React hooks
│   │   ├── useProgress.ts          # Progress management
│   │   ├── useGameState.ts         # Game state
│   │   └── usePaymasterTransaction.ts  # Gasless transactions
│   ├── services/            # Business logic
│   │   ├── PaymasterService.ts     # ERC-7677 paymaster
│   │   └── BatchTransactionService.ts
│   ├── utils/               # Utility functions
│   │   ├── soundManager.ts         # Audio
│   │   ├── progressSync.ts         # Blockchain sync
│   │   └── scoring.ts              # Star calculation
│   ├── config/              # Configuration
│   │   ├── onchainkit.ts           # OnchainKit setup
│   │   ├── wagmi.ts                # wagmi config
│   │   └── gas-policy.ts           # Paymaster policy
│   └── types/               # TypeScript types
├── contracts/               # Smart contracts
│   └── MemoryMatchProgress.sol
├── public/                  # Static assets
│   └── assets/
│       ├── projects/        # Base project logos
│       └── sounds/          # Audio files
└── tests/                   # Test files

```

## 🔗 Smart Contract

### Base Mainnet

- **Address:** `0x93aC1C769aCE5caE403a454cBd236aB2EA7B17F5`
- **Network:** Base Mainnet (Chain ID: 8453)
- **Explorer:** [View on Basescan](https://basescan.org/address/0x93aC1C769aCE5caE403a454cBd236aB2EA7B17F5)

### Features

- **Gas-Optimized Storage** - Uses bit-packing to store 100 levels in 2 uint256 slots
- **Batch Updates** - Update multiple levels in one transaction
- **Immutable Progress** - Stars can only increase, never decrease
- **Event Emission** - Emits events for indexing and monitoring

### Functions

```solidity
// Update a single level
function update(uint8 level, uint8 stars) external

// Batch update multiple levels
function batchUpdate(uint8[] calldata levels, uint8[] calldata stars) external

// Get stars for a level
function getStars(address player, uint8 level) external view returns (uint8)

// Get total stars
function getTotal(address player) external view returns (uint16)
```

## ⚡ Gasless Transactions (Paymaster)

This app uses **Coinbase Paymaster** to sponsor all gas fees:

### How It Works

1. User initiates a transaction (e.g., save progress)
2. App requests sponsorship from Paymaster (ERC-7677 compliant)
3. Paymaster checks gas policy and approves
4. Transaction is submitted with sponsored gas
5. **User pays $0 in gas fees** ✨

### Gas Policy

The paymaster is configured to sponsor:
- **Contract:** MemoryMatchProgress only
- **Max Gas:** 500,000 per transaction
- **Max Transactions:** 100 per user per day
- **Functions:** `update()` and `batchUpdate()`

### Fallback Support

If paymaster sponsorship fails, the app automatically falls back to user-paid transactions.

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in UI mode
npm run test:ui
```

### Test Coverage

- **502/502 tests passing** ✅
- Unit tests for all components
- Integration tests for Web3 flows
- Property-based tests for critical logic
- Contract tests with Hardhat

## 🎵 Sound Effects

The game includes immersive audio feedback:

- **Card Flip** - When flipping a card
- **Match** - When finding a pair
- **Mismatch** - When cards don't match
- **Victory** - When completing a level

Toggle sound on/off in settings. Preference is saved to localStorage.

## 🛡️ Error Handling

Comprehensive error handling for Web3 operations:

- **Error Boundaries** - Catch and display errors gracefully
- **Error Classification** - Network, contract, user, system errors
- **User-Friendly Messages** - Clear explanations
- **Recovery Options** - Retry for recoverable errors
- **Debug Info** - Technical details in development mode

## 📊 Transaction Notifications

Real-time notifications for blockchain transactions:

- **Submitted** - Transaction sent to network
- **Pending** - Waiting for confirmation
- **Confirmed** - Transaction successful ✅
- **Failed** - Transaction failed with details
- **Basescan Links** - View on block explorer

## 🌐 Base Integration

This project follows Base best practices:

### Smart Wallet (Base Account)
- Passkey-secured authentication
- No seed phrases needed
- Gasless transactions via Paymaster
- Cross-device sync

### OnchainKit Components
- `<Wallet>` - Wallet connection UI
- `<Transaction>` - Transaction handling
- `<Identity>` - User identity display
- `<Avatar>` - ENS/Basename avatars

### Base Ecosystem
- Features 20+ Base project logos
- Educates users about Base ecosystem
- Promotes Base projects through gameplay

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## � Bug Reports

Found a bug? Please open an issue with:
- Description of the bug
- Steps to reproduce
- Expected behavior
- Screenshots (if applicable)
- Browser/device information

## 📞 Support & Resources

- **Base Documentation:** [docs.base.org](https://docs.base.org/)
- **OnchainKit Docs:** [onchainkit.xyz](https://onchainkit.xyz/)
- **Base Discord:** [discord.gg/buildonbase](https://discord.gg/buildonbase)
- **Coinbase Developer Platform:** [portal.cdp.coinbase.com](https://portal.cdp.coinbase.com/)

## 📱 Base App Integration

This game can be integrated into the **Base App** as a Mini App for wider distribution and access to Farcaster social features.

### Current Status

✅ **Ready for Integration** - All prerequisites complete  
⚠️ **Needs Setup** - Farcaster account association and webhook

### Quick Start

1. **Complete Farcaster Account Association**
   ```bash
   npm run generate-account-association
   ```

2. **Set up Webhook Endpoint**
   - Implement `/api/webhook` endpoint
   - Generate webhook secret
   - Configure in production

3. **Submit to Base App**
   - Complete submission form
   - Provide all materials
   - Wait for review

### Resources

- **Specification:** [.kiro/specs/base-app-integration/](/.kiro/specs/base-app-integration/)
  - [requirements.md](/.kiro/specs/base-app-integration/requirements.md) - Требования и user stories
  - [design.md](/.kiro/specs/base-app-integration/design.md) - Архитектура и дизайн
  - [tasks.md](/.kiro/specs/base-app-integration/tasks.md) - Пошаговые задачи
- **Base Mini Apps Docs:** https://docs.base.org/mini-apps/
- **Farcaster Docs:** https://docs.farcaster.xyz/

## 🎯 Roadmap

- [x] Core game mechanics
- [x] Smart Wallet integration
- [x] Gasless transactions (Paymaster)
- [x] On-chain progress saving
- [x] 100 levels with star ratings
- [x] Sound effects
- [x] Comprehensive testing (502 tests)
- [ ] **Base App Integration** (in progress)
  - [ ] Farcaster account association
  - [ ] Webhook implementation
  - [ ] Base App optimizations
  - [ ] Submission to Base App
- [ ] Global leaderboard
- [ ] Achievement NFTs
- [ ] Daily challenges
- [ ] Farcaster Frame integration

## 🙏 Acknowledgments

- Built with [OnchainKit](https://onchainkit.xyz/) by Coinbase
- Deployed on [Base](https://base.org/) - Ethereum L2
- Inspired by the Base ecosystem and community
- Special thanks to all Base project contributors

---

**Made with ❤️ for the Base community**

🔗 [Play Now](https://your-domain.com) | 🐦 [Twitter](https://twitter.com/base) | 💬 [Discord](https://discord.gg/buildonbase)
