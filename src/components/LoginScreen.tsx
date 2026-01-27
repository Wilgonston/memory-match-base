import { useState } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { ConnectWallet } from '@coinbase/onchainkit/wallet';
import { setAuthentication } from '../utils/auth';
import './LoginScreen.css';

interface LoginScreenProps {
  onAuthenticated: () => void;
}

export function LoginScreen({ onAuthenticated }: LoginScreenProps) {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuthenticate = async () => {
    if (!address) return;

    setIsAuthenticating(true);
    setError(null);

    try {
      // Create authentication message
      const message = `Welcome to Memory Match BASE!\n\nSign this message to authenticate your wallet ownership.\n\nWallet: ${address}\nTimestamp: ${new Date().toISOString()}`;

      // Request signature from wallet
      await signMessageAsync({ message });

      // Store authentication
      setAuthentication(address);

      // Call success callback
      onAuthenticated();
    } catch (err) {
      console.error('Authentication failed:', err);
      setError('Authentication failed. Please try again.');
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
              // Fallback to original if improved version fails
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
              <div className="login-wallet-button">
                <ConnectWallet />
              </div>
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
              </div>

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
