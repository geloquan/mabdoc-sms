import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueueItem } from '../types';
import EncryptionService from './EncryptionService';
import { STORAGE_KEYS } from '../config/constants';

/**
 * Service for managing command queue with encrypted storage.
 * Queue items are stored securely and cannot be read by unauthorized parties.
 */
class QueueService {
  private readonly MAX_QUEUE_SIZE = 500; // Maximum number of queue items to store
  private readonly STORAGE_KEY = STORAGE_KEYS.QUEUE || '@mabdoc_queue';

  /**
   * Add a new item to the queue.
   * @param item - The queue item to add
   */
  async addToQueue(item: QueueItem): Promise<void> {
    try {
      const queue = await this.getQueue();
      
      // Add the new item at the end
      queue.push(item);
      
      // Trim to max size
      if (queue.length > this.MAX_QUEUE_SIZE) {
        queue.shift(); // Remove oldest item
      }
      
      await this.saveQueue(queue);
    } catch (error) {
      console.error('Error adding to queue:', error);
      throw error;
    }
  }

  /**
   * Get all queue items (decrypted).
   * @returns Array of queue items
   */
  async getQueue(): Promise<QueueItem[]> {
    try {
      const encryptedData = await AsyncStorage.getItem(this.STORAGE_KEY);
      
      if (!encryptedData) {
        return [];
      }
      
      const queue = EncryptionService.decrypt(encryptedData);
      return Array.isArray(queue) ? queue : [];
    } catch (error) {
      console.error('Error getting queue:', error);
      return [];
    }
  }

  /**
   * Save queue (encrypted).
   * @param queue - Array of queue items to save
   */
  private async saveQueue(queue: QueueItem[]): Promise<void> {
    try {
      const encryptedData = EncryptionService.encrypt(queue);
      await AsyncStorage.setItem(this.STORAGE_KEY, encryptedData);
    } catch (error) {
      console.error('Error saving queue:', error);
      throw error;
    }
  }

  /**
   * Update a queue item.
   * @param id - The queue item ID
   * @param updates - Partial updates to apply
   */
  async updateQueueItem(id: string, updates: Partial<QueueItem>): Promise<void> {
    try {
      const queue = await this.getQueue();
      const index = queue.findIndex(item => item.id === id);
      
      if (index === -1) {
        console.warn(`Queue item ${id} not found`);
        return;
      }
      
      queue[index] = { ...queue[index], ...updates };
      await this.saveQueue(queue);
    } catch (error) {
      console.error('Error updating queue item:', error);
      throw error;
    }
  }

  /**
   * Get pending queue items.
   * @returns Array of pending queue items
   */
  async getPendingItems(): Promise<QueueItem[]> {
    const queue = await this.getQueue();
    return queue.filter(item => item.status === 'pending');
  }

  /**
   * Get queue items by status.
   * @param status - The status to filter by
   * @returns Filtered array of queue items
   */
  async getItemsByStatus(status: QueueItem['status']): Promise<QueueItem[]> {
    const queue = await this.getQueue();
    return queue.filter(item => item.status === status);
  }

  /**
   * Search queue items by keyword.
   * @param keyword - The keyword to search for
   * @returns Filtered array of queue items
   */
  async searchQueue(keyword: string): Promise<QueueItem[]> {
    const queue = await this.getQueue();
    const lowerKeyword = keyword.toLowerCase();
    
    return queue.filter(item => {
      const searchableText = JSON.stringify({
        command: item.command,
        parameters: item.parameters,
        status: item.status,
        error: item.error,
      }).toLowerCase();
      
      return searchableText.includes(lowerKeyword);
    });
  }

  /**
   * Filter queue items by date range.
   * @param startDate - Start timestamp
   * @param endDate - End timestamp
   * @returns Filtered array of queue items
   */
  async getQueueByDateRange(startDate: number, endDate: number): Promise<QueueItem[]> {
    const queue = await this.getQueue();
    return queue.filter(item => item.timestamp >= startDate && item.timestamp <= endDate);
  }

  /**
   * Remove a queue item by ID.
   * @param id - The queue item ID to remove
   */
  async removeQueueItem(id: string): Promise<void> {
    try {
      const queue = await this.getQueue();
      const filteredQueue = queue.filter(item => item.id !== id);
      await this.saveQueue(filteredQueue);
    } catch (error) {
      console.error('Error removing queue item:', error);
      throw error;
    }
  }

  /**
   * Clear all queue items.
   */
  async clearQueue(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing queue:', error);
      throw error;
    }
  }

  /**
   * Clear completed queue items.
   */
  async clearCompletedItems(): Promise<void> {
    try {
      const queue = await this.getQueue();
      const activeQueue = queue.filter(item => item.status !== 'completed');
      await this.saveQueue(activeQueue);
    } catch (error) {
      console.error('Error clearing completed items:', error);
      throw error;
    }
  }

  /**
   * Export queue as encrypted JSON string.
   * @returns Encrypted JSON string
   */
  async exportQueue(): Promise<string | null> {
    try {
      const encryptedData = await AsyncStorage.getItem(this.STORAGE_KEY);
      
      if (!encryptedData) {
        return JSON.stringify({ queue: [], encrypted: true });
      }
      
      // Return the encrypted data wrapped in a JSON structure
      return JSON.stringify({
        queue: encryptedData,
        encrypted: true,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Error exporting queue:', error);
      return null;
    }
  }

  /**
   * Import queue from encrypted JSON string.
   * @param jsonString - The JSON string containing encrypted queue
   * @returns Success status
   */
  async importQueue(jsonString: string): Promise<boolean> {
    try {
      const importData = JSON.parse(jsonString);
      
      if (!importData.encrypted || !importData.queue) {
        console.error('Invalid import format');
        return false;
      }
      
      // Verify the data can be decrypted
      const queue = EncryptionService.decrypt(importData.queue);
      
      if (!Array.isArray(queue)) {
        console.error('Invalid queue data');
        return false;
      }
      
      // Save the encrypted data
      await AsyncStorage.setItem(this.STORAGE_KEY, importData.queue);
      return true;
    } catch (error) {
      console.error('Error importing queue:', error);
      return false;
    }
  }

  /**
   * Get queue statistics.
   * @returns Statistics object
   */
  async getQueueStats(): Promise<{
    total: number;
    pending: number;
    executing: number;
    completed: number;
    failed: number;
  }> {
    const queue = await this.getQueue();
    
    const stats = {
      total: queue.length,
      pending: 0,
      executing: 0,
      completed: 0,
      failed: 0,
    };
    
    queue.forEach(item => {
      stats[item.status]++;
    });
    
    return stats;
  }
}

export default new QueueService();
