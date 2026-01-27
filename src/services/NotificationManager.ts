/**
 * NotificationManager
 * 
 * Manages transaction notifications and notification history.
 * Provides methods to add, update, and dismiss notifications.
 * Persists notification history in session storage.
 * 
 * Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7
 */

import { TransactionStatus } from '../components/TransactionNotification';

export interface Notification {
  id: string;
  hash: string;
  status: TransactionStatus;
  network: 'mainnet' | 'sepolia';
  error?: string;
  timestamp: number;
}

export type NotificationListener = (notifications: Notification[]) => void;

/**
 * NotificationManager class
 * 
 * Singleton pattern for managing notifications across the application.
 */
class NotificationManagerClass {
  private notifications: Notification[] = [];
  private listeners: Set<NotificationListener> = new Set();
  private readonly STORAGE_KEY = 'transaction_notifications';
  private readonly MAX_HISTORY = 50;

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Add a new notification
   */
  addNotification(
    hash: string,
    status: TransactionStatus,
    network: 'mainnet' | 'sepolia' = 'mainnet',
    error?: string
  ): string {
    const id = `${hash}-${Date.now()}`;
    const notification: Notification = {
      id,
      hash,
      status,
      network,
      error,
      timestamp: Date.now(),
    };

    this.notifications.unshift(notification);
    this.trimHistory();
    this.saveToStorage();
    this.notifyListeners();

    return id;
  }

  /**
   * Update an existing notification
   */
  updateNotification(
    id: string,
    status: TransactionStatus,
    error?: string
  ): void {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.status = status;
      if (error) {
        notification.error = error;
      }
      notification.timestamp = Date.now();
      this.saveToStorage();
      this.notifyListeners();
    }
  }

  /**
   * Update notification by hash (if ID not available)
   */
  updateNotificationByHash(
    hash: string,
    status: TransactionStatus,
    error?: string
  ): void {
    const notification = this.notifications.find(n => n.hash === hash);
    if (notification) {
      notification.status = status;
      if (error) {
        notification.error = error;
      }
      notification.timestamp = Date.now();
      this.saveToStorage();
      this.notifyListeners();
    }
  }

  /**
   * Dismiss a notification
   */
  dismissNotification(id: string): void {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.saveToStorage();
    this.notifyListeners();
  }

  /**
   * Get all notifications
   */
  getNotifications(): Notification[] {
    return [...this.notifications];
  }

  /**
   * Get active notifications (not confirmed or failed)
   */
  getActiveNotifications(): Notification[] {
    return this.notifications.filter(
      n => n.status === 'submitted' || n.status === 'pending'
    );
  }

  /**
   * Get notification history
   */
  getHistory(): Notification[] {
    return this.getNotifications();
  }

  /**
   * Clear all notifications
   */
  clearAll(): void {
    this.notifications = [];
    this.saveToStorage();
    this.notifyListeners();
  }

  /**
   * Clear notification history
   */
  clearHistory(): void {
    this.clearAll();
  }

  /**
   * Subscribe to notification changes
   */
  subscribe(listener: NotificationListener): () => void {
    this.listeners.add(listener);
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of changes
   */
  private notifyListeners(): void {
    const notifications = this.getNotifications();
    this.listeners.forEach(listener => {
      try {
        listener(notifications);
      } catch (error) {
        console.error('Error in notification listener:', error);
      }
    });
  }

  /**
   * Trim history to max size
   */
  private trimHistory(): void {
    if (this.notifications.length > this.MAX_HISTORY) {
      this.notifications = this.notifications.slice(0, this.MAX_HISTORY);
    }
  }

  /**
   * Save notifications to session storage
   */
  private saveToStorage(): void {
    try {
      sessionStorage.setItem(
        this.STORAGE_KEY,
        JSON.stringify(this.notifications)
      );
    } catch (error) {
      console.error('Failed to save notifications to storage:', error);
    }
  }

  /**
   * Load notifications from session storage
   */
  private loadFromStorage(): void {
    try {
      const stored = sessionStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.notifications = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load notifications from storage:', error);
      this.notifications = [];
    }
  }
}

// Export singleton instance
export const NotificationManager = new NotificationManagerClass();

/**
 * React hook for using NotificationManager
 */
export function useNotifications() {
  const [notifications, setNotifications] = React.useState<Notification[]>(
    NotificationManager.getNotifications()
  );

  React.useEffect(() => {
    const unsubscribe = NotificationManager.subscribe(setNotifications);
    return unsubscribe;
  }, []);

  return {
    notifications,
    activeNotifications: notifications.filter(
      n => n.status === 'submitted' || n.status === 'pending'
    ),
    addNotification: NotificationManager.addNotification.bind(NotificationManager),
    updateNotification: NotificationManager.updateNotification.bind(NotificationManager),
    updateNotificationByHash: NotificationManager.updateNotificationByHash.bind(NotificationManager),
    dismissNotification: NotificationManager.dismissNotification.bind(NotificationManager),
    clearAll: NotificationManager.clearAll.bind(NotificationManager),
  };
}

// Import React for hook
import React from 'react';

</content>
</file></function_calls>

<function_calls>
<invoke name="executePwsh">
<parameter name="command">npm test -- src/components/LoadingIndicator --run