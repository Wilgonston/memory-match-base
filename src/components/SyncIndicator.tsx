/**
 * SyncIndicator Component
 * 
 * Shows blockchain sync status in the UI
 */

import { useSyncManager } from '../hooks/useSyncManager';
import './SyncIndicator.css';

export function SyncIndicator() {
  const { syncStatus } = useSyncManager();

  if (!syncStatus.isSyncing) {
    return null;
  }

  return (
    <div className="sync-indicator">
      <div className="sync-spinner" />
      <span className="sync-text">Syncing to blockchain...</span>
    </div>
  );
}
