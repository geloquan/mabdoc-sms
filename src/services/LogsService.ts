import AsyncStorage from '@react-native-async-storage/async-storage';
import { LogEntry, LogType } from '../types';
import EncryptionService from './EncryptionService';
import { STORAGE_KEYS } from '../config/constants';

/**
 * Service for managing API call logs with encrypted storage.
 * Logs are stored securely and cannot be read by unauthorized parties.
 */
class LogsService {
  private readonly MAX_LOGS = 1000; // Maximum number of logs to store
  private readonly STORAGE_KEY = STORAGE_KEYS.LOGS || '@mabdoc_logs';

  /**
   * Add a new log entry.
   * @param log - The log entry to add
   */
  async addLog(log: LogEntry): Promise<void> {
    try {
      const logs = await this.getLogs();
      
      // Add the new log at the beginning
      logs.unshift(log);
      
      // Trim to max size
      if (logs.length > this.MAX_LOGS) {
        logs.splice(this.MAX_LOGS);
      }
      
      await this.saveLogs(logs);
    } catch (error) {
      console.error('Error adding log:', error);
      throw error;
    }
  }

  /**
   * Get all logs (decrypted).
   * @returns Array of log entries
   */
  async getLogs(): Promise<LogEntry[]> {
    try {
      const encryptedData = await AsyncStorage.getItem(this.STORAGE_KEY);
      
      if (!encryptedData) {
        return [];
      }
      
      const logs = EncryptionService.decrypt(encryptedData);
      return Array.isArray(logs) ? logs : [];
    } catch (error) {
      console.error('Error getting logs:', error);
      return [];
    }
  }

  /**
   * Save logs (encrypted).
   * @param logs - Array of log entries to save
   */
  private async saveLogs(logs: LogEntry[]): Promise<void> {
    try {
      const encryptedData = EncryptionService.encrypt(logs);
      await AsyncStorage.setItem(this.STORAGE_KEY, encryptedData);
    } catch (error) {
      console.error('Error saving logs:', error);
      throw error;
    }
  }

  /**
   * Filter logs by type.
   * @param type - The log type to filter by
   * @returns Filtered array of log entries
   */
  async getLogsByType(type: LogType): Promise<LogEntry[]> {
    const logs = await this.getLogs();
    return logs.filter(log => log.type === type);
  }

  /**
   * Search logs by keyword.
   * @param keyword - The keyword to search for
   * @returns Filtered array of log entries
   */
  async searchLogs(keyword: string): Promise<LogEntry[]> {
    const logs = await this.getLogs();
    const lowerKeyword = keyword.toLowerCase();
    
    return logs.filter(log => {
      const searchableText = JSON.stringify({
        type: log.type,
        endpoint: log.endpoint,
        error: log.error,
        request: log.request,
        response: log.response,
      }).toLowerCase();
      
      return searchableText.includes(lowerKeyword);
    });
  }

  /**
   * Filter logs by date range.
   * @param startDate - Start timestamp
   * @param endDate - End timestamp
   * @returns Filtered array of log entries
   */
  async getLogsByDateRange(startDate: number, endDate: number): Promise<LogEntry[]> {
    const logs = await this.getLogs();
    return logs.filter(log => log.timestamp >= startDate && log.timestamp <= endDate);
  }

  /**
   * Filter logs by success status.
   * @param success - Whether to filter for successful or failed logs
   * @returns Filtered array of log entries
   */
  async getLogsByStatus(success: boolean): Promise<LogEntry[]> {
    const logs = await this.getLogs();
    return logs.filter(log => log.success === success);
  }

  /**
   * Clear all logs.
   */
  async clearLogs(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing logs:', error);
      throw error;
    }
  }

  /**
   * Export logs as encrypted JSON string.
   * @returns Encrypted JSON string
   */
  async exportLogs(): Promise<string | null> {
    try {
      const encryptedData = await AsyncStorage.getItem(this.STORAGE_KEY);
      
      if (!encryptedData) {
        return JSON.stringify({ logs: [], encrypted: true });
      }
      
      // Return the encrypted data wrapped in a JSON structure
      return JSON.stringify({
        logs: encryptedData,
        encrypted: true,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Error exporting logs:', error);
      return null;
    }
  }

  /**
   * Import logs from encrypted JSON string.
   * @param jsonString - The JSON string containing encrypted logs
   * @returns Success status
   */
  async importLogs(jsonString: string): Promise<boolean> {
    try {
      const importData = JSON.parse(jsonString);
      
      if (!importData.encrypted || !importData.logs) {
        console.error('Invalid import format');
        return false;
      }
      
      // Verify the data can be decrypted
      const logs = EncryptionService.decrypt(importData.logs);
      
      if (!Array.isArray(logs)) {
        console.error('Invalid logs data');
        return false;
      }
      
      // Save the encrypted data
      await AsyncStorage.setItem(this.STORAGE_KEY, importData.logs);
      return true;
    } catch (error) {
      console.error('Error importing logs:', error);
      return false;
    }
  }

  /**
   * Get logs statistics.
   * @returns Statistics object
   */
  async getLogsStats(): Promise<{
    total: number;
    byType: Record<LogType, number>;
    successCount: number;
    failureCount: number;
  }> {
    const logs = await this.getLogs();
    
    const stats = {
      total: logs.length,
      byType: {
        [LogType.SMS]: 0,
        [LogType.HEALTH]: 0,
        [LogType.COMMAND]: 0,
      },
      successCount: 0,
      failureCount: 0,
    };
    
    logs.forEach(log => {
      stats.byType[log.type]++;
      if (log.success) {
        stats.successCount++;
      } else {
        stats.failureCount++;
      }
    });
    
    return stats;
  }
}

export default new LogsService();
