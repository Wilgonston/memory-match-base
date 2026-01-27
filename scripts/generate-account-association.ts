/**
 * Generate Farcaster Account Association
 * 
 * This script generates a cryptographic signature proving ownership of a Farcaster account.
 * The signature is used to link your Mini App to your Farcaster account in the Base App.
 * 
 * Usage:
 *   npm run generate-account-association
 * 
 * Requirements:
 *   - Your Farcaster ID (FID) from https://warpcast.com/~/settings
 *   - Your custody address private key (the address that controls your Farcaster account)
 * 
 * Security:
 *   - Private keys are never stored or logged
 *   - Only the signature is output
 *   - NEVER commit the generated values to version control
 */

import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import * as readline from 'readline';

interface AccountAssociation {
  fid: number;
  custodyAddress: string;
  signature: string;
  timestamp: number;
  domain: string;
}

/**
 * Prompt user for input
 */
function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

/**
 * Generate account association signature
 */
async function generateAccountAssociation(): Promise<AccountAssociation> {
  console.log('\n🔐 Farcaster Account Association Generator\n');
  console.log('This script will generate a signature to link your Mini App to your Farcaster account.\n');

  // Get FID
  const fidInput = await prompt('Enter your Farcaster ID (FID): ');
  const fid = parseInt(fidInput.trim());

  if (isNaN(fid) || fid <= 0) {
    throw new Error('Invalid FID. Please enter a positive number.');
  }

  console.log(`✓ FID: ${fid}\n`);

  // Get private key
  console.log('⚠️  SECURITY WARNING: Your private key will NOT be stored or logged.');
  console.log('   It is only used to generate the signature.\n');
  console.log('💡 TIP: This is the private key of the EOA wallet you used to register on Farcaster.');
  console.log('   Find your custody address in Warpcast Settings → Advanced → Custody Address');
  console.log('   Then export the private key from that wallet (MetaMask, Coinbase Wallet, etc.)\n');
  
  const privateKeyInput = await prompt('Enter your custody address private key (0x...): ');
  const privateKey = privateKeyInput.trim() as `0x${string}`;

  if (!privateKey.startsWith('0x') || privateKey.length !== 66) {
    throw new Error('Invalid private key format. Must be 0x followed by 64 hex characters.');
  }

  // Create account from private key
  const account = privateKeyToAccount(privateKey);
  console.log(`✓ Custody Address: ${account.address}\n`);

  // Get domain from environment or use default
  const domain = process.env.VITE_APP_URL 
    ? new URL(process.env.VITE_APP_URL).hostname 
    : 'memory-match-base.app';
  
  console.log(`✓ Domain: ${domain}\n`);

  // Generate timestamp
  const timestamp = Math.floor(Date.now() / 1000);
  console.log(`✓ Timestamp: ${timestamp}\n`);

  // Create message to sign
  const message = JSON.stringify({
    header: {
      fid,
      type: 'custody',
      key: account.address
    },
    payload: {
      domain,
      timestamp
    }
  });

  console.log('📝 Generating signature...\n');

  // Sign message
  const signature = await account.signMessage({ message });

  console.log('✅ Signature generated successfully!\n');

  return {
    fid,
    custodyAddress: account.address,
    signature,
    timestamp,
    domain
  };
}

/**
 * Display results
 */
function displayResults(association: AccountAssociation) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('                    ACCOUNT ASSOCIATION GENERATED                    ');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('📋 Add these values to your .env file:\n');
  console.log('─────────────────────────────────────────────────────────────────────\n');
  console.log(`VITE_FARCASTER_FID=${association.fid}`);
  console.log(`VITE_FARCASTER_CUSTODY_ADDRESS=${association.custodyAddress}`);
  console.log(`VITE_ACCOUNT_ASSOCIATION_SIGNATURE=${association.signature}`);
  console.log(`VITE_ACCOUNT_ASSOCIATION_TIMESTAMP=${association.timestamp}`);
  console.log('\n─────────────────────────────────────────────────────────────────────\n');

  console.log('📝 Summary:\n');
  console.log(`   FID:              ${association.fid}`);
  console.log(`   Custody Address:  ${association.custodyAddress}`);
  console.log(`   Domain:           ${association.domain}`);
  console.log(`   Timestamp:        ${association.timestamp} (${new Date(association.timestamp * 1000).toISOString()})`);
  console.log(`   Signature:        ${association.signature.substring(0, 20)}...${association.signature.substring(association.signature.length - 20)}`);
  console.log('');

  console.log('⚠️  SECURITY REMINDERS:\n');
  console.log('   1. NEVER commit these values to version control');
  console.log('   2. Add them to .env (which should be in .gitignore)');
  console.log('   3. Add them to your production environment variables');
  console.log('   4. Keep your private key secure and never share it');
  console.log('');

  console.log('📚 Next Steps:\n');
  console.log('   1. Add the values above to your .env file');
  console.log('   2. Add them to .env.production.example (without actual values)');
  console.log('   3. Configure them in your production environment (Vercel/Netlify)');
  console.log('   4. Deploy your app');
  console.log('   5. Verify the account association in minikit.config.ts');
  console.log('');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

/**
 * Main function
 */
async function main() {
  try {
    const association = await generateAccountAssociation();
    displayResults(association);
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : 'Unknown error');
    console.error('\nPlease try again or check the documentation for help.\n');
    process.exit(1);
  }
}

// Run the script
main();
