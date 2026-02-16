# Builder Codes Integration

This document explains how Builder Codes are integrated into Memory Match BASE for transaction attribution.

## What Are Builder Codes?

Builder Codes are an ERC-721 NFT collection that help identify builders onchain. Each code enables:

- **Rewards**: Automatic attribution of transaction usage back to your app
- **Analytics**: Track onchain usage, user acquisition, and conversion metrics
- **Visibility**: Show up in Base App discovery surfaces and leaderboards

## How It Works

Builder Codes use the ERC-8021 standard to append attribution data to transaction calldata:

1. Your Builder Code is converted to a data suffix
2. The suffix is automatically appended to all transactions
3. Smart contracts execute normally (they ignore the extra data)
4. Offchain indexers extract attribution after the fact

**Important**: No smart contract modifications needed! The attribution suffix is transparent to contract execution.

## Integration in This Project

### 1. Configuration

Builder Code attribution is configured in `src/config/wagmi.ts`:

```typescript
// Get Builder Code from environment
const builderCode = import.meta.env.VITE_BUILDER_CODE || '';

// Generate ERC-8021 compliant data suffix
let DATA_SUFFIX: `0x${string}` | undefined;
if (builderCode) {
  const { Attribution } = require('ox/erc8021');
  DATA_SUFFIX = Attribution.toDataSuffix({ codes: [builderCode] });
}

// Add to wagmi config
export const wagmiConfig = createConfig({
  // ... other config
  ...(DATA_SUFFIX && { dataSuffix: DATA_SUFFIX }),
});
```

### 2. Automatic Attribution

Once configured, ALL transactions automatically include your Builder Code:

- `useSendTransaction` - Regular transactions
- `useSendCalls` - Batch transactions (EIP-5792)
- `useWriteContract` - Contract interactions
- Paymaster-sponsored transactions

No changes needed in your components or hooks!

### 3. Environment Setup

Add your Builder Code to `.env`:

```env
# Get from https://base.dev/ > Settings > Builder Code
VITE_BUILDER_CODE=bc_xxxxxxxx
```

## Getting Your Builder Code

1. Visit [base.dev](https://base.dev/)
2. Register your app
3. Go to **Settings** → **Builder Code**
4. Copy your code (format: `bc_xxxxxxxx`)
5. Add to `.env` file

## Verifying Attribution

### Method 1: Check base.dev

1. Visit [base.dev](https://base.dev/)
2. Select **Onchain** from transaction type dropdown
3. Check Total Transactions section for attribution counts

### Method 2: Block Explorer

1. Find your transaction on [Basescan](https://basescan.org/)
2. View the **Input Data** field
3. Verify last 16 bytes are `8021` repeating
4. Decode suffix to confirm your Builder Code

### Method 3: Validation Tool

Use the [Builder Code Validation Tool](https://builder-code-checker.vercel.app/):

1. Select transaction type
2. Enter transaction hash
3. Click **Check Attribution**

## Gas Costs

The ERC-8021 suffix adds minimal gas:

- **16 gas per non-zero byte**
- Typical suffix: ~50 bytes = ~800 gas
- Negligible compared to transaction cost

## Wallet Support

### EOAs (Externally Owned Accounts)
✅ All EOA wallets support `dataSuffix` by default

### Smart Wallets
✅ Wallets supporting ERC-5792 can use `dataSuffix` capability

### Embedded Wallets
✅ Privy and Turnkey support Builder Codes

## Benefits for Memory Match BASE

1. **Analytics**: Track how many users play and complete levels
2. **Rewards**: Qualify for potential BASE rewards program
3. **Visibility**: Show up in BASE App leaderboards
4. **Attribution**: Understand user acquisition channels

## Technical Details

### Dependencies

- `ox@0.11.0+` - Provides `Attribution.toDataSuffix()` function
- `wagmi@2.0+` - Supports `dataSuffix` in config
- `viem@2.45.0+` - Required for ERC-8021 support

### Implementation Files

- `src/config/wagmi.ts` - Main configuration
- `src/utils/builderCode.ts` - Helper utilities
- `.env.example` - Environment variable template

### Error Handling

If `ox/erc8021` is not available:

```typescript
try {
  const { Attribution } = require('ox/erc8021');
  DATA_SUFFIX = Attribution.toDataSuffix({ codes: [builderCode] });
} catch (error) {
  console.warn('ox/erc8021 not available. Attribution disabled.');
  // App continues to work without attribution
}
```

## Resources

- [Official ERC-8021 Proposal](https://eip.tools/eip/8021)
- [BASE Builder Codes Docs](https://docs.base.org/base-chain/builder-codes/builder-codes)
- [Integration Guide](https://docs.base.org/base-chain/builder-codes/app-developers)
- [Validation Tool](https://builder-code-checker.vercel.app/)

## FAQ

**Q: Do I need to modify my smart contract?**
A: No! The suffix is appended to calldata and ignored by contracts.

**Q: Will this break my app if Builder Code is not set?**
A: No. Attribution is optional and gracefully disabled if not configured.

**Q: Can I use multiple Builder Codes?**
A: Yes! Pass an array: `codes: ['code1', 'code2']`

**Q: Does this work with Paymaster transactions?**
A: Yes! Builder Codes work with both regular and sponsored transactions.

**Q: How do I test attribution locally?**
A: Set `VITE_BUILDER_CODE` in `.env` and check transaction input data on Basescan.
