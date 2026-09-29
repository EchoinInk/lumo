/**
 * Analytics Queue
 * 
 * Offline-safe event queueing.
 * Batches events for efficient delivery.
 */

import type { AnalyticsQueueEntry, AnalyticsEventPayload, AnalyticsConfig } from '@/types/analytics';

class AnalyticsQueue {
  private queue: AnalyticsQueueEntry[] = [];
  private config: AnalyticsConfig = {
    enabled: true,
    batchSize: 10,
    flushInterval: 30000, // 30 seconds
    maxQueueSize: 100,
  };
  private flushTimer: ReturnType<typeof setInterval> | null = null;

  /**
   * Initialize queue with configuration
   */
  initialize(config: Partial<AnalyticsConfig>): void {
    this.config = { ...this.config, ...config };
    this.startFlushTimer();
  }

  /**
   * Add event to queue
   */
  add(event: AnalyticsEventPayload): void {
    if (!this.config.enabled) {
      return;
    }

    const entry: AnalyticsQueueEntry = {
      id: this.generateId(),
      event,
      timestamp: Date.now(),
      retryCount: 0,
    };

    this.queue.push(entry);

    // Enforce max queue size
    if (this.queue.length > this.config.maxQueueSize) {
      this.queue.shift(); // Remove oldest
    }

    // Flush if batch size reached
    if (this.queue.length >= this.config.batchSize) {
      this.flush();
    }
  }

  /**
   * Flush queue (send events to provider)
   */
  async flush(): Promise<void> {
    if (this.queue.length === 0) {
      return;
    }

    const eventsToSend = [...this.queue];
    this.queue = [];

    try {
      // In a real implementation, this would send to analytics provider
      // For now, we just log
      if (__DEV__) {
        console.log('[Analytics Queue] Flushing events:', eventsToSend.length);
      }

      // Simulate successful flush
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      // Re-queue failed events
      eventsToSend.forEach(entry => {
        entry.retryCount++;
        if (entry.retryCount < 3) {
          this.queue.push(entry);
        }
      });

      console.warn('[Analytics Queue] Flush failed, re-queued events:', error);
    }
  }

  /**
   * Get queue size
   */
  size(): number {
    return this.queue.length;
  }

  /**
   * Clear queue
   */
  clear(): void {
    this.queue = [];
  }

  /**
   * Start automatic flush timer
   */
  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  /**
   * Stop automatic flush timer
   */
  stopFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Enable/disable queue
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }
}

// Singleton instance
export const analyticsQueue = new AnalyticsQueue();
