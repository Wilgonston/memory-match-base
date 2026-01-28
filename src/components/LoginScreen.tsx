import { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect, useSignMessage, useSwitchChain, useChainId } from 'wagmi';
import { base } from 'wagmi/chains';
import { Identity, Avatar, Name } from '@coinbase/onchainkit/identity';
import { setAuthentication } from '../utils/auth';
import './LoginScreen.css';

interface LoginScreenProps {
  onAuthenticated: () => void;
}

export function LoginScreen({ onAuthenticated }: LoginScreenProps) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { connectors, connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const { switchChain } = useSwitchChain();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConnectors, setShowConnectors] = useState(false);
  const [showWrongNetworkWarning, setShowWrongNetworkWarning] = useState(false);

  // Auto-switch to Base Mainnet when wallet connects
  useEffect(() => {
    if (isConnected && chainId !== base.id) {
      console.log('[LoginScreen] Wallet connected on wrong network:', chainId);
      console.log('[LoginScreen] Expected network:', base.id);
      setShowWrongNetworkWarning(true);
      
      // Try to switch network
      console.log('[LoginScreen] Attempting to switch to Base Mainnet...');
      switchChain({ chainId: base.id });
    } else if (isConnected && chainId === base.id) {
      setShowWrongNetworkWarning(false);
    }
  }, [isConnected, chainId, switchChain]);

  const handleResetWallet = () => {
    console.log('[LoginScreen] Resetting wallet...');
    
    // Disconnect wallet first
    disconnect();
    
    // Clear all Coinbase Wallet SDK and wagmi data
    try {
      // Clear localStorage items
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.includes('coinbase') || 
          key.includes('walletlink') || 
          key.includes('-walletUsername') ||
          key.includes('CBWSDK') ||
          key.includes('wagmi') ||
          key.includes('recentConnector') ||
          key.includes('wallet')
        )) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => {
        console.log('[LoginScreen] Removing localStorage key:', key);
        localStorage.removeItem(key);
      });
      
      // Clear sessionStorage
      sessionStorage.clear();
      
      // Clear IndexedDB (Coinbase Wallet SDK uses it)
      if (window.indexedDB) {
        window.indexedDB.databases().then((databases) => {
          databases.forEach((db) => {
            if (db.name && (
              db.name.includes('coinbase') || 
              db.name.includes('walletlink') ||
              db.name.includes('CBWSDK')
            )) {
              console.log('[LoginScreen] Deleting IndexedDB:', db.name);
              window.indexedDB.deleteDatabase(db.name);
            }
          });
        });
      }
      
      console.log('[LoginScreen] Wallet data cleared successfully');
      setError('✅ Wallet reset complete! Please refresh the page (F5) and connect again.');
      
      // Auto-refresh after 2 seconds
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err) {
      console.error('[LoginScreen] Failed to clear wallet data:', err);
      setError('Failed to reset wallet. Please clear your browser cache manually and refresh.');
    }
  };

  const handleConnect = () => {
    console.log('[LoginScreen] Connecting Smart Wallet...');
    console.log('[LoginScreen] Available connectors:', connectors.map(c => c.id));
    
    // First, disconnect any existing connection
    if (isConnected) {
      console.log('[LoginScreen] Disconnecting existing wallet...');
      disconnect();
      // Wait a bit before reconnecting
      setTimeout(() => connectSmartWallet(), 500);
    } else {
      connectSmartWallet();
    }
  };

  const connectSmartWallet = () => {
    // Get Coinbase Wallet connector (Smart Wallet)
    const coinbaseConnector = connectors.find(c => c.id === 'coinbaseWalletSDK');
    if (coinbaseConnector) {
      console.log('[LoginScreen] Using Coinbase Smart Wallet connector');
      console.log('[LoginScreen] Forcing chainId:', base.id);
      // Connect with Base Mainnet chainId to ensure Smart Wallet is created on correct network
      connect({ 
        connector: coinbaseConnector,
        chainId: base.id, // Force Base Mainnet
      });
    } else {
      console.log('[LoginScreen] Coinbase connector not found');
      setError('Coinbase Smart Wallet connector not available');
    }
  };

  const handleConnectOtherWallet = () => {
    console.log('[LoginScreen] Showing other wallet options...');
    setShowConnectors(true);
  };

  const handleConnectorClick = (connector: any) => {
    console.log('[LoginScreen] Connecting with:', connector.name);
    connect({ 
      connector,
      chainId: base.id, // Force Base Mainnet
    });
    setShowConnectors(false);
  };

  const handleAuthenticate = async () => {
    if (!address) return;

    // Check if on correct network
    if (chainId !== base.id) {
      setError('Please wait for network switch to complete');
      return;
    }

    setIsAuthenticating(true);
    setError(null);

    try {
      const message = `Welcome to Memory Match BASE!\n\nSign this message to authenticate your wallet ownership.\n\nWallet: ${address}\nTimestamp: ${new Date().toISOString()}`;
      await signMessageAsync({ message });
      setAuthentication(address);
      onAuthenticated();
    } catch (err) {
      console.error('Authentication failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
      
      // Handle specific errors
      if (errorMessage.includes('User rejected') || errorMessage.includes('User denied')) {
        setError('You rejected the signature request. Please try again.');
      } else if (errorMessage.includes('pending') || errorMessage.includes('владельца')) {
        setError('There is a pending transaction. Please wait or cancel it in your wallet.');
      } else {
        setError('Authentication failed. Please try again.');
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-container">
        <div className="login-header">
          <img 
            src="/assets/miniapp/logo-improved.svg" 
            alt="Memory Match BASE" 
            className="login-logo"
            onError={(e) => {
              e.currentTarget.src = '/assets/miniapp/hero.svg';
            }}
          />
          <h1 className="login-title">Memory Match BASE</h1>
          <p className="login-subtitle">
            Web3 Memory Card Game on Base Blockchain
          </p>
        </div>

        <div className="login-content">
          {!isConnected ? (
            <>
              <p className="login-description">
                Create your Smart Wallet with Passkey to start playing
              </p>
              <p className="login-subdescription">
                ✨ No seed phrases • 🔐 Secure with biometrics • ⚡ Gas-free transactions
              </p>
              
              {!showConnectors ? (
                <>
                  <button 
                    onClick={handleConnect}
                    className="login-connect-button login-connect-primary"
                  >
                    🔐 Create Smart Wallet (Recommended)
                  </button>

                  <div className="login-divider">
                    <span className="login-divider-text">or</span>
                  </div>

                  <button 
                    onClick={handleConnectOtherWallet}
                    className="login-connect-button login-connect-secondary"
                  >
                    🦊 Connect Existing Wallet (MetaMask, etc.)
                  </button>
                </>
              ) : (
                <>
                  <div className="login-connectors">
                    <p className="login-connectors-title">Choose your wallet:</p>
                    {connectors
                      .filter(c => c.id !== 'coinbaseWalletSDK') // Exclude Coinbase Smart Wallet from this list
                      .map((connector) => (
                        <button
                          key={connector.id}
                          onClick={() => handleConnectorClick(connector)}
                          className="login-connector-button"
                        >
                          {connector.name === 'WalletConnect' && '🔗 '}
                          {connector.name === 'MetaMask' && '🦊 '}
                          {connector.name}
                        </button>
                      ))}
                  </div>
                  <button 
                    onClick={() => setShowConnectors(false)}
                    className="login-back-button"
                  >
                    ← Back
                  </button>
                </>
              )}
              
              <p className="login-note">
                <strong>Smart Wallet (Recommended):</strong> No seed phrases, biometric login, gas-free transactions
                <br />
                <strong>Existing Wallet:</strong> Use MetaMask or other wallets (you pay gas fees)
              </p>

              <div className="login-troubleshooting">
                <p className="login-troubleshooting-title">⚠️ Troubleshooting:</p>
                <p className="login-troubleshooting-text">
                  If you see your existing Coinbase wallet instead of creating a new Smart Wallet:
                </p>
                <ol className="login-troubleshooting-list">
                  <li>Click "Reset Wallet & Start Over" button below</li>
                  <li>Open Coinbase Wallet app and disconnect this site</li>
                  <li>Refresh this page (F5)</li>
                  <li>Click "Connect Wallet" again</li>
                </ol>
                <button 
                  onClick={handleResetWallet}
                  className="login-reset-button-small"
                >
                  🔄 Reset Wallet & Start Over
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="login-connected">
                <div className="login-check-icon">✓</div>
                <p className="login-connected-text">
                  Smart Wallet Connected
                </p>
                <div className="login-identity">
                  <Identity address={address} className="login-identity-container">
                    <Avatar className="login-avatar" />
                    <Name className="login-name" />
                  </Identity>
                </div>
                <p className="login-network-info">
                  Current Network: {chainId === 8453 ? 'Base Mainnet ✅' : 
                                   chainId === 137 ? 'Polygon ⚠️' : 
                                   chainId === 1 ? 'Ethereum ⚠️' :
                                   `Chain ${chainId} ⚠️`}
                </p>
                {chainId !== base.id && (
                  <>
                    <p className="login-network-warning">
                      ⚠️ Wrong Network Detected!
                    </p>
                    <p className="login-network-warning">
                      Your Smart Wallet was created on {chainId === 137 ? 'Polygon' : 'wrong network'}.
                      <br />
                      You need to reset and create a new wallet on Base Mainnet.
                    </p>
                  </>
                )}
              </div>

              {chainId !== base.id ? (
                <>
                  <button
                    onClick={() => {
                      console.log('[LoginScreen] Attempting to switch to Base Mainnet...');
                      switchChain({ chainId: base.id });
                    }}
                    className="login-auth-button"
                  >
                    Try Switch to Base Mainnet
                  </button>
                  
                  <button
                    onClick={handleResetWallet}
                    className="login-reset-button"
                  >
                    🔄 Reset Wallet & Start Over
                  </button>
                  
                  <p className="login-info login-warning">
                    ⚠️ <strong>Important:</strong> Your Smart Wallet is on the wrong network.
                    <br />
                    <br />
                    <strong>Steps to fix:</strong>
                    <br />
                    1. Click "Reset Wallet & Start Over" button above
                    <br />
                    2. Refresh this page (press F5)
                    <br />
                    3. Click "Connect Wallet" again
                    <br />
                    4. New Smart Wallet will be created on Base Mainnet
                  </p>
                </>
              ) : (
                <>
                  <button
                    onClick={handleAuthenticate}
                    disabled={isAuthenticating}
                    className="login-auth-button"
                  >
                    {isAuthenticating ? (
                      <>
                        <span className="login-spinner"></span>
                        Authenticating...
                      </>
                    ) : (
                      'Sign Message to Continue'
                    )}
                  </button>

                  <p className="login-info">
                    You'll be asked to sign a message to prove wallet ownership. This is free and doesn't require gas.
                  </p>
                </>
              )}
            </>
          )}
          
          {error && (
            <div className="login-error">
              {error}
            </div>
          )}
        </div>

        <div className="login-features">
          <div className="login-feature">
            <span className="login-feature-icon">🎮</span>
            <span className="login-feature-text">100 Levels</span>
          </div>
          <div className="login-feature">
            <span className="login-feature-icon">⛓️</span>
            <span className="login-feature-text">On-Chain Progress</span>
          </div>
          <div className="login-feature">
            <span className="login-feature-icon">⚡</span>
            <span className="login-feature-text">Gas-Free</span>
          </div>
          <div className="login-feature">
            <span className="login-feature-icon">🏆</span>
            <span className="login-feature-text">Earn Stars</span>
          </div>
        </div>
      </div>
    </div>
  );
}
