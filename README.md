# 🎮 Memory Match BASE

A Web3 memory card game built on Base blockchain with OnchainKit integration.

![Memory Match BASE](public/assets/miniapp/hero.svg)

## 🌟 Features

- ✨ **100 Unique Levels** - Progressive difficulty from 4x4 to 8x8 grids
- 🎮 **Smooth Gameplay** - Beautiful animations and responsive design
- 🔗 **On-Chain Progress** - Save your progress to Base blockchain
- 💎 **Star Ratings** - Earn 1-3 stars based on performance
- ⚡ **Gas-Free** - Transactions sponsored by Paymaster
- 🎨 **Base Ecosystem** - Features 20+ Base project logos
- 📱 **Mobile Friendly** - Fully responsive design
- 🏆 **Leaderboard Ready** - Compete with other players (coming soon)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/YOUR_USERNAME/memory-match-base.git
cd memory-match-base
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env` and add your API keys:
```env
VITE_ONCHAINKIT_API_KEY=your_api_key_here
VITE_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

4. **Run development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔧 Environment Variables

Create a `.env` file with the following variables:

```env
# Network Configuration
VITE_NETWORK=mainnet
VITE_CHAIN_ID=8453

# Smart Contract
VITE_CONTRACT_ADDRESS=0x93aC1C769aCE5caE403a454cBd236aB2EA7B17F5

# API Keys (Required)
VITE_ONCHAINKIT_API_KEY=your_onchainkit_api_key
VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id

# Optional
VITE_PAYMASTER_URL=your_paymaster_url
```

### Getting API Keys

1. **OnchainKit API Key**: Get from [Coinbase Developer Platform](https://portal.cdp.coinbase.com/)
2. **WalletConnect Project ID**: Get from [WalletConnect Cloud](https://cloud.walletconnect.com/)

## 📦 Build

```bash
# Production build
npm run build

# Preview production build
npm run preview
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

**Test Results**: 502/502 tests passing ✅

## 🌐 Deploy to Vercel

### Option 1: Deploy via Vercel Dashboard

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Add environment variables in Vercel dashboard
6. Click "Deploy"

### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

### Environment Variables in Vercel

Add these in your Vercel project settings:

- `VITE_NETWORK` = `mainnet`
- `VITE_CHAIN_ID` = `8453`
- `VITE_CONTRACT_ADDRESS` = `0x93aC1C769aCE5caE403a454cBd236aB2EA7B17F5`
- `VITE_ONCHAINKIT_API_KEY` = Your API key
- `VITE_WALLETCONNECT_PROJECT_ID` = Your project ID
- `VITE_PAYMASTER_URL` = Your paymaster URL (optional)

## 🏗️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Blockchain**: Base Mainnet
- **Web3**: OnchainKit, wagmi, viem
- **Styling**: Tailwind CSS
- **Testing**: Vitest + Testing Library
- **Property Testing**: fast-check

## 📁 Project Structure

```
memory-match-base/
├── public/
│   └── assets/
│       ├── miniapp/          # App icons and images
│       ├── projects/         # Project logos
│       └── sounds/           # Sound effects
├── src/
│   ├── components/           # React components
│   ├── hooks/                # Custom hooks
│   ├── utils/                # Utility functions
│   ├── types/                # TypeScript types
│   ├── reducers/             # State reducers
│   ├── config/               # Configuration
│   ├── data/                 # Static data
│   └── test/                 # Test utilities
├── contracts/                # Smart contracts
└── docs/                     # Documentation
```

## 🎮 How to Play

1. **Connect Wallet** - Click "Connect Wallet" to link your Base wallet
2. **Select Level** - Choose from 100 levels (unlock by completing previous)
3. **Match Cards** - Click cards to flip and find matching pairs
4. **Earn Stars** - Complete levels quickly to earn 3 stars
5. **Save Progress** - Save your progress on-chain (gas-free!)

## 🔗 Smart Contract

- **Address**: `0x93aC1C769aCE5caE403a454cBd236aB2EA7B17F5`
- **Network**: Base Mainnet (Chain ID: 8453)
- **Verified**: [View on Basescan](https://basescan.org/address/0x93aC1C769aCE5caE403a454cBd236aB2EA7B17F5)

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🐛 Bug Reports

Found a bug? Please open an issue on GitHub with:
- Description of the bug
- Steps to reproduce
- Expected behavior
- Screenshots (if applicable)

## 📞 Support

- **Documentation**: [DEPLOYMENT_PLAN.md](DEPLOYMENT_PLAN.md)
- **Base Discord**: [discord.gg/buildonbase](https://discord.gg/buildonbase)
- **OnchainKit Docs**: [onchainkit.xyz](https://onchainkit.xyz/)

## 🎯 Roadmap

- [x] Core game mechanics
- [x] Blockchain integration
- [x] Wallet connection
- [x] On-chain progress saving
- [ ] Global leaderboard
- [ ] Farcaster Frame integration
- [ ] Achievement NFTs
- [ ] Sound effects
- [ ] Daily challenges

## 🙏 Acknowledgments

- Built with [OnchainKit](https://onchainkit.xyz/) by Coinbase
- Deployed on [Base](https://base.org/)
- Inspired by the Base ecosystem

---

**Made with ❤️ for the Base community**

🔗 [Play Now](https://your-domain.com) | 🐦 [Twitter](https://twitter.com/your_handle) | 💬 [Farcaster](https://warpcast.com/your_handle)
