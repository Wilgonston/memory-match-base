// Mini App configuration for BASE App integration
// Following official BASE documentation: https://docs.base.org/mini-apps/quickstart/new-apps/deploy
const ROOT_URL = import.meta.env.VITE_APP_URL || 'https://memory-match-base.vercel.app';

/**
 * Account Association Configuration for Farcaster Mini Apps
 * 
 * Account association links your Mini App to a Farcaster account, enabling:
 * - Verified ownership of the Mini App
 * - Enhanced trust and discoverability in Farcaster
 * - Access to Farcaster social features
 * 
 * SETUP INSTRUCTIONS:
 * 
 * 1. GET YOUR FARCASTER ID (FID):
 *    - Visit https://warpcast.com/~/settings
 *    - Your FID is shown in your profile settings
 *    - Or use the Farcaster API: https://api.warpcast.com/v2/user-by-username?username=YOUR_USERNAME
 * 
 * 2. GET YOUR CUSTODY ADDRESS AND PRIVATE KEY:
 *    - Your custody address is the Ethereum address that controls your Farcaster account
 *    - This is typically the address you used when registering on Farcaster
 *    - You'll need the private key for this address to sign the association
 *    - SECURITY: Never commit private keys to version control!
 * 
 * 3. GENERATE THE SIGNATURE:
 *    
 *    Option A - Using the provided script (recommended):
 *    ```bash
 *    npm run generate-account-association
 *    ```
 *    This will prompt you for your FID and private key, then generate the signature.
 *    
 *    Option B - Manual generation using ethers.js:
 *    ```typescript
 *    import { ethers } from 'ethers';
 *    
 *    const fid = YOUR_FID; // Your Farcaster ID
 *    const domain = 'memory-match-base.app'; // Your app domain
 *    const timestamp = Date.now();
 *    const privateKey = 'YOUR_CUSTODY_PRIVATE_KEY'; // NEVER commit this!
 *    
 *    // Create the message to sign
 *    const message = JSON.stringify({
 *      header: {
 *        fid: fid,
 *        type: 'custody',
 *        key: ethers.computeAddress(privateKey) // Derives public key
 *      },
 *      payload: {
 *        domain: domain,
 *        timestamp: timestamp
 *      }
 *    });
 *    
 *    // Sign the message
 *    const wallet = new ethers.Wallet(privateKey);
 *    const signature = await wallet.signMessage(message);
 *    
 *    console.log('Signature:', signature);
 *    ```
 * 
 * 4. UPDATE ENVIRONMENT VARIABLES:
 *    Add these to your .env file (NEVER commit .env to git):
 *    ```
 *    VITE_FARCASTER_FID=your_fid_here
 *    VITE_FARCASTER_CUSTODY_ADDRESS=0x...
 *    VITE_ACCOUNT_ASSOCIATION_SIGNATURE=0x...
 *    VITE_ACCOUNT_ASSOCIATION_TIMESTAMP=1234567890
 *    ```
 * 
 * 5. VERIFICATION:
 *    - The signature must be generated using the custody address for your FID
 *    - The domain must match your deployed app's hostname
 *    - The timestamp should be when you generated the signature
 *    - Farcaster will verify the signature matches the custody address for the FID
 * 
 * SECURITY NOTES:
 * - The custody address private key should be stored securely (use environment variables)
 * - Never commit private keys or signatures to version control
 * - Regenerate the signature if you change domains or FIDs
 * - The signature proves you control the Farcaster account associated with the FID
 * 
 * For more information:
 * - Farcaster Account Association: https://docs.farcaster.xyz/developers/guides/accounts/account-association
 * - Base Mini Apps: https://docs.base.org/mini-apps/
 */

// Account association timestamp - should be set when signature is generated
const ACCOUNT_ASSOCIATION_TIMESTAMP = parseInt(
  import.meta.env.VITE_ACCOUNT_ASSOCIATION_TIMESTAMP || '0'
);

export const minikitConfig = {
  // Account Association for Farcaster integration
  // https://docs.farcaster.xyz/developers/guides/accounts/account-association
  accountAssociation: {
    header: {
      // Your Farcaster ID - get from https://warpcast.com/~/settings
      fid: parseInt(import.meta.env.VITE_FARCASTER_FID || '0'),
      // Type is always 'custody' for custody address signatures
      type: 'custody' as const,
      // Your custody address (public key) - the Ethereum address controlling your Farcaster account
      key: import.meta.env.VITE_FARCASTER_CUSTODY_ADDRESS || '',
    },
    payload: {
      // Domain must match your deployed app's hostname
      domain: new URL(ROOT_URL).hostname,
      // Timestamp when the signature was generated
      timestamp: ACCOUNT_ASSOCIATION_TIMESTAMP || Date.now(),
    },
    // Cryptographic signature proving ownership of the Farcaster account
    // Generate using the script: npm run generate-account-association
    signature: import.meta.env.VITE_ACCOUNT_ASSOCIATION_SIGNATURE || '',
  },
  
  miniapp: {
    version: "1",
    name: "Memory Match BASE",
    subtitle: "Test your memory with BASE ecosystem projects",
    description: "Classic memory card game featuring BASE blockchain ecosystem projects. Match pairs, complete 100 levels, and master the BASE ecosystem!",
    screenshotUrls: [
      `${ROOT_URL}/assets/miniapp/screenshot-1-gameplay.png`,
      `${ROOT_URL}/assets/miniapp/screenshot-2-level-select.png`,
      `${ROOT_URL}/assets/miniapp/screenshot-3-victory.png`
    ],
    iconUrl: `${ROOT_URL}/assets/miniapp/icon-1024.png`,
    splashImageUrl: `${ROOT_URL}/assets/miniapp/splash-improved.svg`,
    splashBackgroundColor: "#0052FF", // BASE blue
    homeUrl: ROOT_URL,
    primaryCategory: "games",
    tags: ["memory", "game", "base", "crypto", "puzzle", "blockchain", "web3"],
    heroImageUrl: `${ROOT_URL}/assets/miniapp/hero-improved.svg`,
    tagline: "Master the BASE ecosystem through memory",
    ogTitle: "Memory Match BASE - Blockchain Memory Game",
    ogDescription: "Test your memory with BASE blockchain projects. 100 levels of crypto fun!",
    ogImageUrl: `${ROOT_URL}/assets/miniapp/cover-1200x630.png`,
    // Webhook URL for Mini App events (required for BASE App integration)
    // https://docs.base.org/mini-apps/quickstart/new-apps/deploy
    webhookUrl: `${ROOT_URL}/api/webhook`,
  },
} as const;
