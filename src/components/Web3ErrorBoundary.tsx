/**
 * Web3ErrorBoundary Component
 * 
 * React Error Boundary specifically designed for Web3/blockchain errors.
 * Catches errors from wallet connections, transactions, and contract interactions.
 * 
 * Features:
 * - Catches and displays user-friendly error messages
 * - Classifies errors (network, contract, user rejection, system)
 * - Provides retry and reset options
 * - Logs errors for debugging
 * 
 * Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6
 */

import React, { Component, ReactNode, ErrorInfo } from 'react';
import './Web3ErrorBoundary.css';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorType: ErrorType;
}

type ErrorType = 'network' | 'contract' | 'user' | 'system';

/**
 * Classify error based on error message and properties
 */
function classifyError(error: Error): ErrorType {
  const message = error.message.toLowerCase();
  
  // User rejection errors
  if (
    message.includes('user rejected') ||
    message.includes('user denied') ||
    message.includes('user cancelled') ||
    message.includes('rejected by user')
  ) {
    return 'user';
  }
  
  // Network errors
  if (
    message.includes('network') ||
    message.includes('timeout') ||
    message.includes('connection') ||
    message.includes('fetch failed') ||
    message.includes('rpc')
  ) {
    return 'network';
  }
  
  // Contract errors
  if (
    message.includes('revert') ||
    message.includes('insufficient funds') ||
    message.includes('gas') ||
    message.includes('execution reverted')
  ) {
    return 'contract';
  }
  
  // Default to system error
  return 'system';
}

/**
 * Get user-friendly error message based on error type
 */
function getUserMessage(error: Error, errorType: ErrorType): string {
  switch (errorType) {
    case 'user':
      return 'Transaction was cancelled. No worries, you can try again when ready.';
    
    case 'network':
      return 'Network connection issue. Please check your internet and try again.';
    
    case 'contract':
      if (error.message.toLowerCase().includes('insufficient funds')) {
        return 'Insufficient funds to complete this transaction.';
      }
      return 'Transaction failed. This might be a temporary issue, please try again.';
    
    case 'system':
    default:
      return 'Something went wrong. Please try again or refresh the page.';
  }
}

/**
 * Check if error is recoverable (can be retried)
 */
function isRecoverable(errorType: ErrorType): boolean {
  return errorType === 'network' || errorType === 'user';
}

export class Web3ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorType: 'system',
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorType: classifyError(error),
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error for debugging
    console.error('Web3 Error Boundary caught an error:', error, errorInfo);
    
    // Update state with error info
    this.setState({
      errorInfo,
    });
    
    // TODO: Send to error monitoring service (Sentry, etc.)
    // errorMonitoring.captureException(error, { errorInfo });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorType: 'system',
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset);
      }

      // Default error UI
      const { error, errorType } = this.state;
      const userMessage = getUserMessage(error, errorType);
      const recoverable = isRecoverable(errorType);

      return (
        <div className="web3-error-boundary">
          <div className="error-container">
            <div className="error-icon">
              {errorType === 'user' ? '🚫' : errorType === 'network' ? '🌐' : '⚠️'}
            </div>
            
            <h2 className="error-title">
              {errorType === 'user' ? 'Transaction Cancelled' : 'Oops! Something went wrong'}
            </h2>
            
            <p className="error-message">{userMessage}</p>
            
            {process.env.NODE_ENV === 'development' && (
              <details className="error-details">
                <summary>Technical Details (Dev Only)</summary>
                <pre>{error.message}</pre>
                {this.state.errorInfo && (
                  <pre>{this.state.errorInfo.componentStack}</pre>
                )}
              </details>
            )}
            
            <div className="error-actions">
              {recoverable && (
                <button
                  onClick={this.handleReset}
                  className="error-button error-button-primary"
                >
                  Try Again
                </button>
              )}
              
              <button
                onClick={() => window.location.reload()}
                className="error-button error-button-secondary"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
