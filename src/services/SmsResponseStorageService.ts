import AsyncStorage from '@react-native-async-storage/async-storage';
import { SmsResponse } from '../types';
import { STORAGE_KEYS } from '../config/constants';
import EncryptionUtil from '../utils/EncryptionUtil';

class SmsResponseStorageService {
  private readonly MAX_RESPONSES = 500; // Maximum number of responses to store

  /**
   * Add a new SMS response entry
   */
  async addResponse(response: SmsResponse): Promise<boolean> {
    try {
      const responses = await this.getResponses();
      responses.unshift(response); // Add to the beginning

      // Keep only the most recent MAX_RESPONSES entries
      if (responses.length > this.MAX_RESPONSES) {
        responses.splice(this.MAX_RESPONSES);
      }

      await this.saveResponses(responses);
      return true;
    } catch (error) {
      console.error('Error adding SMS response:', error);
      return false;
    }
  }

  /**
   * Get all SMS responses (decrypted)
   */
  async getResponses(): Promise<SmsResponse[]> {
    try {
      const encryptedData = await AsyncStorage.getItem(STORAGE_KEYS.SMS_RESPONSES);
      if (!encryptedData) {
        return [];
      }

      const responses = await EncryptionUtil.decrypt(encryptedData);
      return Array.isArray(responses) ? responses : [];
    } catch (error) {
      console.error('Error getting SMS responses:', error);
      return [];
    }
  }

  /**
   * Save SMS responses (encrypted)
   */
  private async saveResponses(responses: SmsResponse[]): Promise<void> {
    try {
      const encryptedData = await EncryptionUtil.encrypt(responses);
      await AsyncStorage.setItem(STORAGE_KEYS.SMS_RESPONSES, encryptedData);
    } catch (error) {
      console.error('Error saving SMS responses:', error);
      throw error;
    }
  }

  /**
   * Search SMS responses by criteria
   */
  async searchResponses(criteria: {
    status?: 'success' | 'failed' | 'no_job';
    phoneNumber?: string;
    startDate?: number;
    endDate?: number;
    searchText?: string;
  }): Promise<SmsResponse[]> {
    try {
      const responses = await this.getResponses();

      return responses.filter(response => {
        if (criteria.status && response.status !== criteria.status) {
          return false;
        }

        if (criteria.phoneNumber && response.phoneNumber !== criteria.phoneNumber) {
          return false;
        }

        if (criteria.startDate && response.timestamp < criteria.startDate) {
          return false;
        }

        if (criteria.endDate && response.timestamp > criteria.endDate) {
          return false;
        }

        if (criteria.searchText) {
          const searchLower = criteria.searchText.toLowerCase();
          const searchableText = [
            response.phoneNumber || '',
            response.message || '',
            response.status,
            response.error || '',
          ].join(' ').toLowerCase();
          
          if (!searchableText.includes(searchLower)) {
            return false;
          }
        }

        return true;
      });
    } catch (error) {
      console.error('Error searching SMS responses:', error);
      return [];
    }
  }

  /**
   * Delete old SMS responses
   */
  async deleteOldResponses(daysToKeep: number): Promise<number> {
    try {
      const responses = await this.getResponses();
      const cutoffDate = Date.now() - daysToKeep * 24 * 60 * 60 * 1000;
      const filteredResponses = responses.filter(response => response.timestamp >= cutoffDate);
      const deletedCount = responses.length - filteredResponses.length;

      await this.saveResponses(filteredResponses);
      return deletedCount;
    } catch (error) {
      console.error('Error deleting old SMS responses:', error);
      return 0;
    }
  }

  /**
   * Clear all SMS responses
   */
  async clearAllResponses(): Promise<boolean> {
    try {
      await this.saveResponses([]);
      return true;
    } catch (error) {
      console.error('Error clearing SMS responses:', error);
      return false;
    }
  }

  /**
   * Export SMS responses (decrypted JSON)
   */
  async exportResponses(): Promise<string | null> {
    try {
      const responses = await this.getResponses();
      return JSON.stringify(responses, null, 2);
    } catch (error) {
      console.error('Error exporting SMS responses:', error);
      return null;
    }
  }

  /**
   * Import SMS responses from JSON
   */
  async importResponses(jsonString: string, append: boolean = false): Promise<boolean> {
    try {
      const importedResponses = JSON.parse(jsonString);

      if (!Array.isArray(importedResponses)) {
        console.error('Invalid SMS responses format - must be an array');
        return false;
      }

      // Validate response entries
      const validResponses = importedResponses.filter(response =>
        response.id &&
        response.timestamp &&
        response.status &&
        (response.status === 'success' || response.status === 'failed' || response.status === 'no_job')
      );

      if (validResponses.length === 0) {
        console.error('No valid SMS response entries found');
        return false;
      }

      if (append) {
        const existingResponses = await this.getResponses();
        const combinedResponses = [...validResponses, ...existingResponses];
        // Remove duplicates based on ID
        const uniqueResponses = combinedResponses.filter(
          (response, index, self) => index === self.findIndex(r => r.id === response.id)
        );
        await this.saveResponses(uniqueResponses.slice(0, this.MAX_RESPONSES));
      } else {
        await this.saveResponses(validResponses.slice(0, this.MAX_RESPONSES));
      }

      return true;
    } catch (error) {
      console.error('Error importing SMS responses:', error);
      return false;
    }
  }

  /**
   * Get SMS response statistics
   */
  async getResponseStats(): Promise<{
    total: number;
    successCount: number;
    failedCount: number;
    noJobCount: number;
    oldestResponse?: number;
    newestResponse?: number;
  }> {
    try {
      const responses = await this.getResponses();

      if (responses.length === 0) {
        return {
          total: 0,
          successCount: 0,
          failedCount: 0,
          noJobCount: 0,
        };
      }

      return {
        total: responses.length,
        successCount: responses.filter(r => r.status === 'success').length,
        failedCount: responses.filter(r => r.status === 'failed').length,
        noJobCount: responses.filter(r => r.status === 'no_job').length,
        oldestResponse: responses[responses.length - 1]?.timestamp,
        newestResponse: responses[0]?.timestamp,
      };
    } catch (error) {
      console.error('Error getting SMS response stats:', error);
      return {
        total: 0,
        successCount: 0,
        failedCount: 0,
        noJobCount: 0,
      };
    }
  }
}

export default new SmsResponseStorageService();
