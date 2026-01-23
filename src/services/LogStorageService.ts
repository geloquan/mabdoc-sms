import AsyncStorage from '@react-native-async-storage/async-storage';
import { LogEntry } from '../types';
import { STORAGE_KEYS } from '../config/constants';
import EncryptionUtil from '../utils/EncryptionUtil';

class LogStorageService {
  private readonly MAX_LOGS = 1000; // Maximum number of logs to store

  /**
   * Add a new log entry
   */
  async addLog(log: LogEntry): Promise<boolean> {
    try {
      const logs = await this.getLogs();
      logs.unshift(log); // Add to the beginning

      // Keep only the most recent MAX_LOGS entries
      if (logs.length > this.MAX_LOGS) {
        logs.splice(this.MAX_LOGS);
      }

      await this.saveLogs(logs);
      return true;
    } catch (error) {
      console.error('Error adding log:', error);
      return false;
    }
  }

  /**
   * Get all logs (decrypted)
   */
  async getLogs(): Promise<LogEntry[]> {
    try {
      const encryptedData = await AsyncStorage.getItem(STORAGE_KEYS.LOGS);
      if (!encryptedData) {
        return [];
      }

      const logs = await EncryptionUtil.decrypt(encryptedData);
      return Array.isArray(logs) ? logs : [];
    } catch (error) {
      console.error('Error getting logs:', error);
      return [];
    }
  }

  /**
   * Save logs (encrypted)
   */
  private async saveLogs(logs: LogEntry[]): Promise<void> {
    try {
      const encryptedData = await EncryptionUtil.encrypt(logs);
      await AsyncStorage.setItem(STORAGE_KEYS.LOGS, encryptedData);
    } catch (error) {
      console.error('Error saving logs:', error);
      throw error;
    }
  }

  /**
   * Search logs by criteria
   */
  async searchLogs(criteria: {
    type?: 'sms' | 'health';
    endpoint?: string;
    startDate?: number;
    endDate?: number;
    status?: number;
    searchText?: string;
  }): Promise<LogEntry[]> {
    try {
      const logs = await this.getLogs();

      return logs.filter(log => {
        if (criteria.type && log.type !== criteria.type) {
          return false;
        }

        if (criteria.endpoint && !log.endpoint.includes(criteria.endpoint)) {
          return false;
        }

        if (criteria.startDate && log.timestamp < criteria.startDate) {
          return false;
        }

        if (criteria.endDate && log.timestamp > criteria.endDate) {
          return false;
        }

        if (criteria.status && log.response?.status !== criteria.status) {
          return false;
        }

        if (criteria.searchText) {
          const searchLower = criteria.searchText.toLowerCase();
          const logString = JSON.stringify(log).toLowerCase();
          if (!logString.includes(searchLower)) {
            return false;
          }
        }

        return true;
      });
    } catch (error) {
      console.error('Error searching logs:', error);
      return [];
    }
  }

  /**
   * Delete logs older than specified days
   */
  async deleteOldLogs(daysToKeep: number): Promise<number> {
    try {
      const logs = await this.getLogs();
      const cutoffDate = Date.now() - daysToKeep * 24 * 60 * 60 * 1000;
      const filteredLogs = logs.filter(log => log.timestamp >= cutoffDate);
      const deletedCount = logs.length - filteredLogs.length;

      await this.saveLogs(filteredLogs);
      return deletedCount;
    } catch (error) {
      console.error('Error deleting old logs:', error);
      return 0;
    }
  }

  /**
   * Clear all logs
   */
  async clearAllLogs(): Promise<boolean> {
    try {
      await this.saveLogs([]);
      return true;
    } catch (error) {
      console.error('Error clearing logs:', error);
      return false;
    }
  }

  /**
   * Export logs (decrypted JSON)
   */
  async exportLogs(): Promise<string | null> {
    try {
      const logs = await this.getLogs();
      return JSON.stringify(logs, null, 2);
    } catch (error) {
      console.error('Error exporting logs:', error);
      return null;
    }
  }

  /**
   * Import logs from JSON
   */
  async importLogs(jsonString: string, append: boolean = false): Promise<boolean> {
    try {
      const importedLogs = JSON.parse(jsonString);

      if (!Array.isArray(importedLogs)) {
        console.error('Invalid logs format - must be an array');
        return false;
      }

      // Validate log entries
      const validLogs = importedLogs.filter(log =>
        log.id &&
        log.endpoint &&
        log.timestamp &&
        log.type &&
        (log.type === 'sms' || log.type === 'health')
      );

      if (validLogs.length === 0) {
        console.error('No valid log entries found');
        return false;
      }

      if (append) {
        const existingLogs = await this.getLogs();
        const combinedLogs = [...validLogs, ...existingLogs];
        // Remove duplicates based on ID
        const uniqueLogs = combinedLogs.filter(
          (log, index, self) => index === self.findIndex(l => l.id === log.id)
        );
        await this.saveLogs(uniqueLogs.slice(0, this.MAX_LOGS));
      } else {
        await this.saveLogs(validLogs.slice(0, this.MAX_LOGS));
      }

      return true;
    } catch (error) {
      console.error('Error importing logs:', error);
      return false;
    }
  }

  /**
   * Get log statistics
   */
  async getLogStats(): Promise<{
    total: number;
    smsLogs: number;
    healthLogs: number;
    successCount: number;
    errorCount: number;
    oldestLog?: number;
    newestLog?: number;
  }> {
    try {
      const logs = await this.getLogs();

      if (logs.length === 0) {
        return {
          total: 0,
          smsLogs: 0,
          healthLogs: 0,
          successCount: 0,
          errorCount: 0,
        };
      }

      return {
        total: logs.length,
        smsLogs: logs.filter(l => l.type === 'sms').length,
        healthLogs: logs.filter(l => l.type === 'health').length,
        successCount: logs.filter(l => l.response?.status && l.response.status >= 200 && l.response.status < 300).length,
        errorCount: logs.filter(l => l.response?.status && l.response.status >= 400).length,
        oldestLog: logs[logs.length - 1]?.timestamp,
        newestLog: logs[0]?.timestamp,
      };
    } catch (error) {
      console.error('Error getting log stats:', error);
      return {
        total: 0,
        smsLogs: 0,
        healthLogs: 0,
        successCount: 0,
        errorCount: 0,
      };
    }
  }
}

export default new LogStorageService();
