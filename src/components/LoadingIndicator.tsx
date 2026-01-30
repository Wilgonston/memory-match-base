/**
 * LoadingIndicator Component
 * 
 * Displays loading state for blockchain operations with operation type and progress.
 * 
 * Features:
 * - Shows operation type (e.g., "Connecting wallet...", "Saving progress...")
 * - Animated spinner
 * - Optional estimated time
 * - Optional cancel button for cancellable operations
 * 
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5
 */

import { ReactNode } from 'react';
import './LoadingIndicator.css';

export interface LoadingIndicatorProps {
  /** Operation being performed */
  operation: string;
  /** Optional estimated time in seconds */
  estimatedTime?: number;
  /** Whether operation can be cancelled */
  cancellable?: boolean;
  /** Callback when cancel is clicked */
  onCancel?: () => void;
  /** Additional message for long-running operations */
  stillWorking?: boolean;
  /** Custom icon or element */
  icon?: ReactNode;
  /** Progress percentage (0-100) */
  progress?: number;
  /** Progress details (e.g., "Loading 50/100 levels") */
  progressDetails?: string;
}

/**
 * LoadingIndicator component
 * 
 * @example
 * ```tsx
 * <LoadingIndicator 
 *   operation="Connecting wallet" 
 *   estimatedTime={3}
 * />
 * 
 * <LoadingIndicator 
 *   operation="Saving progress" 
 *   cancellable={true}
 *   onCancel={() => console.log('Cancelled')}
 * />
 * ```
 */
export function LoadingIndicator({
  operation,
  estimatedTime,
  cancellable = false,
  onCancel,
  stillWorking = false,
  icon,
  progress,
  progressDetails,
}: LoadingIndicatorProps) {
  return (
    <div className="loading-indicator">
      <div className="loading-content">
        {icon || (
          <div className="loading-spinner">
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
          </div>
        )}
        
        <div className="loading-text">
          <p className="loading-operation">{operation}</p>
          
          {progress !== undefined && (
            <div className="loading-progress-bar">
              <div 
                className="loading-progress-fill" 
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
          
          {progressDetails && (
            <p className="loading-progress-details">{progressDetails}</p>
          )}
          
          {estimatedTime && !stillWorking && !progress && (
            <p className="loading-estimate">
              Estimated time: ~{estimatedTime}s
            </p>
          )}
          
          {stillWorking && (
            <p className="loading-still-working">
              Still working on it... Thanks for your patience!
            </p>
          )}
        </div>
        
        {cancellable && onCancel && (
          <button
            onClick={onCancel}
            className="loading-cancel-button"
            aria-label="Cancel operation"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Inline loading indicator for smaller spaces
 */
export function InlineLoadingIndicator({ operation }: { operation: string }) {
  return (
    <div className="inline-loading-indicator">
      <div className="inline-spinner"></div>
      <span className="inline-text">{operation}</span>
    </div>
  );
}

/**
 * Success animation component
 */
export function SuccessAnimation({ message }: { message: string }) {
  return (
    <div className="success-animation">
      <div className="success-checkmark">
        <svg viewBox="0 0 52 52" className="success-svg">
          <circle className="success-circle" cx="26" cy="26" r="25" fill="none"/>
          <path className="success-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
        </svg>
      </div>
      <p className="success-message">{message}</p>
    </div>
  );
}
