import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueueEntry } from '../types';
import { STORAGE_KEYS } from '../config/constants';
import EncryptionUtil from '../utils/EncryptionUtil';

class QueueStorageService {
  private readonly MAX_QUEUE_SIZE = 500; // Maximum number of queue entries

  /**
   * Add a new queue entry
   */
  async addToQueue(entry: QueueEntry): Promise<boolean> {
    try {
      const queue = await this.getQueue();
      queue.push(entry);

      // Keep only the most recent MAX_QUEUE_SIZE entries
      // Remove only completed or failed entries if over limit
      if (queue.length > this.MAX_QUEUE_SIZE) {
        const sorted = [...queue].sort((a, b) => {
          // Prioritize keeping pending and processing entries
          if (a.status === 'pending' || a.status === 'processing') {
            if (b.status === 'completed' || b.status === 'failed') {
              return -1; // Keep a
            }
          }
          if (b.status === 'pending' || b.status === 'processing') {
            if (a.status === 'completed' || a.status === 'failed') {
              return 1; // Keep b
            }
          }
          // Sort by timestamp for entries with same priority
          return a.timestamp - b.timestamp;
        });
        // Keep the entries we want to preserve
        const entriesToKeep = sorted.slice(0, this.MAX_QUEUE_SIZE);
        await this.saveQueue(entriesToKeep);
      } else {
        await this.saveQueue(queue);
      }

      return true;
    } catch (error) {
      console.error('Error adding to queue:', error);
      return false;
    }
  }

  /**
   * Get all queue entries (decrypted)
   */
  async getQueue(): Promise<QueueEntry[]> {
    try {
      const encryptedData = await AsyncStorage.getItem(STORAGE_KEYS.QUEUE);
      if (!encryptedData) {
        return [];
      }

      const queue = await EncryptionUtil.decrypt(encryptedData);
      return Array.isArray(queue) ? queue : [];
    } catch (error) {
      console.error('Error getting queue:', error);
      return [];
    }
  }

  /**
   * Save queue (encrypted)
   */
  private async saveQueue(queue: QueueEntry[]): Promise<void> {
    try {
      const encryptedData = await EncryptionUtil.encrypt(queue);
      await AsyncStorage.setItem(STORAGE_KEYS.QUEUE, encryptedData);
    } catch (error) {
      console.error('Error saving queue:', error);
      throw error;
    }
  }

  /**
   * Get next pending entry from queue
   */
  async getNextPending(): Promise<QueueEntry | null> {
    try {
      const queue = await this.getQueue();
      return queue.find(entry => entry.status === 'pending') || null;
    } catch (error) {
      console.error('Error getting next pending:', error);
      return null;
    }
  }

  /**
   * Update queue entry status
   */
  async updateEntryStatus(
    id: string,
    status: QueueEntry['status'],
    result?: any,
    error?: string
  ): Promise<boolean> {
    try {
      const queue = await this.getQueue();
      const index = queue.findIndex(entry => entry.id === id);

      if (index === -1) {
        return false;
      }

      queue[index].status = status;
      if (status === 'completed' || status === 'failed') {
        queue[index].executedAt = Date.now();
      }
      if (result !== undefined) {
        queue[index].result = result;
      }
      if (error) {
        queue[index].error = error;
      }

      await this.saveQueue(queue);
      return true;
    } catch (err) {
      console.error('Error updating entry status:', err);
      return false;
    }
  }

  /**
   * Search queue entries
   */
  async searchQueue(criteria: {
    command?: string;
    status?: QueueEntry['status'];
    startDate?: number;
    endDate?: number;
    searchText?: string;
  }): Promise<QueueEntry[]> {
    try {
      const queue = await this.getQueue();

      return queue.filter(entry => {
        if (criteria.command && entry.command !== criteria.command) {
          return false;
        }

        if (criteria.status && entry.status !== criteria.status) {
          return false;
        }

        if (criteria.startDate && entry.timestamp < criteria.startDate) {
          return false;
        }

        if (criteria.endDate && entry.timestamp > criteria.endDate) {
          return false;
        }

        if (criteria.searchText) {
          const searchLower = criteria.searchText.toLowerCase();
          const entryString = JSON.stringify(entry).toLowerCase();
          if (!entryString.includes(searchLower)) {
            return false;
          }
        }

        return true;
      });
    } catch (error) {
      console.error('Error searching queue:', error);
      return [];
    }
  }

  /**
   * Delete completed entries older than specified days
   */
  async deleteOldEntries(daysToKeep: number): Promise<number> {
    try {
      const queue = await this.getQueue();
      const cutoffDate = Date.now() - daysToKeep * 24 * 60 * 60 * 1000;

      const filteredQueue = queue.filter(entry => {
        // Keep pending and processing entries
        if (entry.status === 'pending' || entry.status === 'processing') {
          return true;
        }
        // Keep recent completed/failed entries
        return entry.timestamp >= cutoffDate;
      });

      const deletedCount = queue.length - filteredQueue.length;
      await this.saveQueue(filteredQueue);
      return deletedCount;
    } catch (error) {
      console.error('Error deleting old entries:', error);
      return 0;
    }
  }

  /**
   * Clear all completed and failed entries
   */
  async clearCompleted(): Promise<number> {
    try {
      const queue = await this.getQueue();
      const filteredQueue = queue.filter(
        entry => entry.status === 'pending' || entry.status === 'processing'
      );
      const deletedCount = queue.length - filteredQueue.length;

      await this.saveQueue(filteredQueue);
      return deletedCount;
    } catch (error) {
      console.error('Error clearing completed:', error);
      return 0;
    }
  }

  /**
   * Clear all queue entries
   */
  async clearAllQueue(): Promise<boolean> {
    try {
      await this.saveQueue([]);
      return true;
    } catch (error) {
      console.error('Error clearing queue:', error);
      return false;
    }
  }

  /**
   * Export queue (decrypted JSON)
   */
  async exportQueue(): Promise<string | null> {
    try {
      const queue = await this.getQueue();
      return JSON.stringify(queue, null, 2);
    } catch (error) {
      console.error('Error exporting queue:', error);
      return null;
    }
  }

  /**
   * Import queue from JSON
   */
  async importQueue(jsonString: string, append: boolean = false): Promise<boolean> {
    try {
      const importedQueue = JSON.parse(jsonString);

      if (!Array.isArray(importedQueue)) {
        console.error('Invalid queue format - must be an array');
        return false;
      }

      // Validate queue entries
      const validEntries = importedQueue.filter(entry =>
        entry.id &&
        entry.command &&
        entry.timestamp &&
        entry.status &&
        ['pending', 'processing', 'completed', 'failed'].includes(entry.status)
      );

      if (validEntries.length === 0) {
        console.error('No valid queue entries found');
        return false;
      }

      if (append) {
        const existingQueue = await this.getQueue();
        const combinedQueue = [...existingQueue, ...validEntries];
        // Remove duplicates based on ID
        const uniqueQueue = combinedQueue.filter(
          (entry, index, self) => index === self.findIndex(e => e.id === entry.id)
        );
        await this.saveQueue(uniqueQueue.slice(0, this.MAX_QUEUE_SIZE));
      } else {
        await this.saveQueue(validEntries.slice(0, this.MAX_QUEUE_SIZE));
      }

      return true;
    } catch (error) {
      console.error('Error importing queue:', error);
      return false;
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    oldestEntry?: number;
    newestEntry?: number;
  }> {
    try {
      const queue = await this.getQueue();

      if (queue.length === 0) {
        return {
          total: 0,
          pending: 0,
          processing: 0,
          completed: 0,
          failed: 0,
        };
      }

      return {
        total: queue.length,
        pending: queue.filter(e => e.status === 'pending').length,
        processing: queue.filter(e => e.status === 'processing').length,
        completed: queue.filter(e => e.status === 'completed').length,
        failed: queue.filter(e => e.status === 'failed').length,
        oldestEntry: queue[0]?.timestamp,
        newestEntry: queue[queue.length - 1]?.timestamp,
      };
    } catch (error) {
      console.error('Error getting queue stats:', error);
      return {
        total: 0,
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
      };
    }
  }

  /**
   * Retry a failed queue entry
   */
  async retryEntry(id: string): Promise<boolean> {
    try {
      const queue = await this.getQueue();
      const index = queue.findIndex(entry => entry.id === id);

      if (index === -1) {
        return false;
      }

      const entry = queue[index];
      if (entry.status !== 'failed') {
        return false; // Can only retry failed entries
      }

      entry.status = 'pending';
      entry.error = undefined;
      entry.executedAt = undefined;
      entry.metadata.retryCount = (entry.metadata.retryCount || 0) + 1;

      await this.saveQueue(queue);
      return true;
    } catch (error) {
      console.error('Error retrying entry:', error);
      return false;
    }
  }
}

export default new QueueStorageService();
