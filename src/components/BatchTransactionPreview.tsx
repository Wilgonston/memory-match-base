import React from 'react';
import { formatEther } from 'viem';
import { useBatchTransactions } from '../hooks/useBatchTransactions';
import './BatchTransactionPreview.css';

interface BatchTransactionPreviewProps {
  onExecute?: () => void;
  onCancel?: () => void;
}

/**
 * Component to display batch transaction preview before execution
 */
export function BatchTransactionPreview({ onExecute, onCancel }: BatchTransactionPreviewProps) {
  const {
    batchSize,
    preview,
    isExecuting,
    error,
    previewBatch,
    executeBatch,
    clearBatch,
  } = useBatchTransactions();

  const [showPreview, setShowPreview] = React.useState(false);

  React.useEffect(() => {
    if (batchSize > 0 && !showPreview) {
      previewBatch();
      setShowPreview(true);
    }
  }, [batchSize, showPreview, previewBatch]);

  const handleExecute = async () => {
    try {
      await executeBatch();
      setShowPreview(false);
      onExecute?.();
    } catch (err) {
      // Error is handled by the hook
    }
  };

  const handleCancel = () => {
    clearBatch();
    setShowPreview(false);
    onCancel?.();
  };

  if (!showPreview || batchSize === 0) {
    return null;
  }

  return (
    <div className="batch-preview-overlay">
      <div className="batch-preview-modal">
        <div className="batch-preview-header">
          <h3>Batch Transaction Preview</h3>
          <button
            onClick={handleCancel}
            className="close-button"
            aria-label="Close preview"
          >
            ×
          </button>
        </div>

        <div className="batch-preview-content">
          {error && (
            <div className="batch-preview-error" role="alert">
              {error}
            </div>
          )}

          {preview && (
            <>
              <div className="batch-preview-summary">
                <div className="summary-item">
                  <span className="summary-label">Operations:</span>
                  <span className="summary-value">{preview.operations.length}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Estimated Gas:</span>
                  <span className="summary-value">
                    {formatEther(preview.totalGas)} ETH
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Sponsored:</span>
                  <span className={`summary-value ${preview.sponsored ? 'sponsored' : 'not-sponsored'}`}>
                    {preview.sponsored ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>

              {preview.errors.length > 0 && (
                <div className="batch-preview-errors">
                  <h4>Validation Errors:</h4>
                  <ul>
                    {preview.errors.map((err, index) => (
                      <li key={index}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="batch-preview-operations">
                <h4>Operations:</h4>
                <ul className="operations-list">
                  {preview.operations.map((op, index) => (
                    <li key={index} className="operation-item">
                      <div className="operation-description">{op.description}</div>
                      <div className="operation-details">
                        <span className="operation-target" title={op.target}>
                          {op.target.slice(0, 10)}...{op.target.slice(-8)}
                        </span>
                        {op.value > 0n && (
                          <span className="operation-value">
                            {formatEther(op.value)} ETH
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>

        <div className="batch-preview-actions">
          <button
            onClick={handleCancel}
            className="cancel-button"
            disabled={isExecuting}
          >
            Cancel
          </button>
          <button
            onClick={handleExecute}
            className="execute-button"
            disabled={isExecuting || (preview?.errors.length ?? 0) > 0}
          >
            {isExecuting ? 'Executing...' : 'Execute Batch'}
          </button>
        </div>
      </div>
    </div>
  );
}
