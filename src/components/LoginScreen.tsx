import { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect, useSignMessage, useSwitchChain, useChainId } from 'wagmi';
import { base } from 'wagmi/chains';
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
    
    // Disconnect wallet
    disconnect();
    
    // Clear all Coinbase Wallet SDK data
    try {
      // Clear localStorage items related to Coinbase Wallet
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.includes('coinbase') || 
          key.includes('walletlink') || 
          key.includes('-walletUsername') ||
          key.includes('CBWSDK')
        )) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Clear sessionStorage
      sessionStorage.clear();
      
      console.log('[LoginScreen] Wallet data cleared. Please refresh the page and reconnect.');
      setError('Wallet reset complete. Please refresh the page (F5) and connect again.');
    } catch (err) {
      console.error('[LoginScreen] Failed to clear wallet data:', err);
      setError('Failed to reset wallet. Please clear your browser cache manually.');
    }
  };

  const handleConnect = () => {
    console.log('[LoginScreen] Connecting wallet...');
    console.log('[LoginScreen] Available connectors:', connectors.map(c => c.id));
    
    // Get Coinbase Wallet connector (Smart Wallet)
    const coinbaseConnector = connectors.find(c => c.id === 'coinbaseWalletSDK');
    if (coinbaseConnector) {
      console.log('[LoginScreen] Using Coinbase Wallet connector');
      console.log('[LoginScreen] Forcing chainId:', base.id);
      // Connect with Base Mainnet chainId to ensure Smart Wallet is created on correct network
      connect({ 
        connector: coinbaseConnector,
        chainId: base.id, // Force Base Mainnet
      });
    } else {
      console.log('[LoginScreen] Coinbase connector not found, showing all connectors');
      setShowConnectors(true);
    }
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
                <button 
                  onClick={handleConnect}
                  className="login-connect-button"
                >
                  Connect Wallet
                </button>
              ) : (
                <div className="login-connectors">
                  {connectors.map((connector) => (
                    <button
                      key={connector.id}
                      onClick={() => connect({ connector })}
                      className="login-connector-button"
                    >
                      {connector.name}
                    </button>
                  ))}
                </div>
              )}
              
              <p className="login-note">
                A Smart Wallet will be created automatically for you.
                <br />
                All transactions are free (sponsored by Paymaster).
              </p>
            </>
          ) : (
            <>
              <div className="login-connected">
                <div className="login-check-icon">✓</div>
                <p className="login-connected-text">
                  Smart Wallet Connected
                </p>
                <p className="login-address">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </p>
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
