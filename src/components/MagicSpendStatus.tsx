import React from 'react';
import { formatEther } from 'viem';
import { useMagicSpend } from '../hooks/useMagicSpend';
import './MagicSpendStatus.css';

/**
 * Component to display Magic Spend status and pending transactions
 */
export function MagicSpendStatus() {
  const {
    isAvailable,
    balance,
    pendingTransactions,
    isLoading,
    error,
    refreshPendingTransactions,
  } = useMagicSpend();

  if (!isAvailable) {
    return null;
  }

  return (
    <div className="magic-spend-status">
      <div className="magic-spend-header">
        <h3>Magic Spend</h3>
        {isLoading && <span className="loading-indicator">Loading...</span>}
      </div>

      <div className="magic-spend-balance">
        <span className="balance-label">Available Balance:</span>
        <span className="balance-value">{formatEther(balance)} ETH</span>
      </div>

      {error && (
        <div className="magic-spend-error" role="alert">
          {error}
        </div>
      )}

      {pendingTransactions.length > 0 && (
        <div className="pending-transactions">
          <div className="pending-header">
            <h4>Pending Transactions</h4>
            <button
              onClick={refreshPendingTransactions}
              className="refresh-button"
              aria-label="Refresh pending transactions"
            >
              ↻
            </button>
          </div>

          <ul className="transaction-list">
            {pendingTransactions.map((tx) => (
              <li key={tx.hash} className="transaction-item">
                <div className="transaction-info">
                  <span className="transaction-hash" title={tx.hash}>
                    {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}
                  </span>
                  <span className="transaction-amount">
                    {formatEther(tx.amount)} ETH
                  </span>
                </div>
                <div className="transaction-meta">
                  <span className={`transaction-status status-${tx.status}`}>
                    {tx.status}
                  </span>
                  <span className="transaction-time">
                    {new Date(tx.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
