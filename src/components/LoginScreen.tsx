import { useState, useEffect } from 'react';
import { useAccount, useConnect, useSignMessage, useSwitchChain, useChainId } from 'wagmi';
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
  const { signMessageAsync } = useSignMessage();
  const { switchChain } = useSwitchChain();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConnectors, setShowConnectors] = useState(false);

  // Auto-switch to Base Mainnet when wallet connects
  useEffect(() => {
    if (isConnected && chainId !== base.id) {
      console.log('[LoginScreen] Wallet connected on wrong network. Switching to Base Mainnet...');
      switchChain({ chainId: base.id });
    }
  }, [isConnected, chainId, switchChain]);

  const handleConnect = () => {
    // Get Coinbase Wallet connector (Smart Wallet)
    const coinbaseConnector = connectors.find(c => c.id === 'coinbaseWalletSDK');
    if (coinbaseConnector) {
      connect({ connector: coinbaseConnector });
    } else {
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
                {chainId !== base.id && (
                  <p className="login-network-warning">
                    ⚠️ Switching to Base Mainnet...
                  </p>
                )}
              </div>

              <button
                onClick={handleAuthenticate}
                disabled={isAuthenticating || chainId !== base.id}
                className="login-auth-button"
              >
                {chainId !== base.id ? (
                  <>
                    <span className="login-spinner"></span>
                    Switching Network...
                  </>
                ) : isAuthenticating ? (
                  <>
                    <span className="login-spinner"></span>
                    Authenticating...
                  </>
                ) : (
                  'Sign Message to Continue'
                )}
              </button>

              {error && (
                <div className="login-error">
                  {error}
                </div>
              )}

              <p className="login-info">
                You'll be asked to sign a message to prove wallet ownership. This is free and doesn't require gas.
              </p>
            </>
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
