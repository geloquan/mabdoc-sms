import { AppSettings, ApiResponse, CommandResponse, SystemHealth, LogEntry, QueueEntry } from '../types';
import { API_ENDPOINTS } from '../config/constants';
import { encode } from 'base-64';
import LogStorageService from './LogStorageService';
import QueueStorageService from './QueueStorageService';
import { v4 as uuidv4 } from 'uuid';

class ApiService {
  private getHeaders(settings: AppSettings): Record<string, string> {
    const credentials = encode(
      `${settings.username}:${settings.password}`,
    );

    return {
      'Content-Type': 'application/json',
      Authorization: `Basic ${credentials}`,
    };
  }

  private generateId(): string {
    return uuidv4();
  }

  async fetchSmsData(settings: AppSettings): Promise<ApiResponse> {
    const startTime = Date.now();
    const logEntry: LogEntry = {
      id: this.generateId(),
      endpoint: API_ENDPOINTS.SMS,
      timestamp: startTime,
      type: 'sms',
      request: {
        method: 'GET',
        headers: this.getHeaders(settings),
      },
      metadata: {},
    };

    try {
      const url = `${settings.apiUrl}${API_ENDPOINTS.SMS}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(settings),
      });

      const data = await response.json();
      
      logEntry.response = {
        status: response.status,
        data,
      };
      logEntry.metadata.duration = Date.now() - startTime;
      
      // Store log asynchronously
      LogStorageService.addLog(logEntry).catch(console.error);

      return {
        success: response.ok,
        data,
      };
    } catch (error) {
      console.error('Error fetching SMS data:', error);
      
      logEntry.response = {
        status: 0,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      logEntry.metadata.duration = Date.now() - startTime;
      
      // Store log asynchronously
      LogStorageService.addLog(logEntry).catch(console.error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async sendHealthData(
    settings: AppSettings,
    health: SystemHealth,
  ): Promise<ApiResponse> {
    const startTime = Date.now();
    const logEntry: LogEntry = {
      id: this.generateId(),
      endpoint: API_ENDPOINTS.HEALTH,
      timestamp: startTime,
      type: 'health',
      request: {
        method: 'POST',
        headers: this.getHeaders(settings),
        body: health,
      },
      metadata: {
        batteryLevel: health.batteryLevel,
        networkType: health.hasInternetAccess ? 'connected' : 'disconnected',
      },
    };

    try {
      const url = `${settings.apiUrl}${API_ENDPOINTS.HEALTH}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(settings),
        body: JSON.stringify(health),
      });

      const data = await response.json();
      
      logEntry.response = {
        status: response.status,
        data,
      };
      logEntry.metadata.duration = Date.now() - startTime;
      
      // Store log asynchronously
      LogStorageService.addLog(logEntry).catch(console.error);

      return {
        success: response.ok,
        data,
      };
    } catch (error) {
      console.error('Error sending health data:', error);
      
      logEntry.response = {
        status: 0,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      logEntry.metadata.duration = Date.now() - startTime;
      
      // Store log asynchronously
      LogStorageService.addLog(logEntry).catch(console.error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async fetchCommands(
    settings: AppSettings,
  ): Promise<ApiResponse<CommandResponse>> {
    try {
      const url = `${settings.apiUrl}${API_ENDPOINTS.COMMAND}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(settings),
      });

      const data = await response.json();
      
      // Store command in queue
      if (data && data.command) {
        const queueEntry: QueueEntry = {
          id: this.generateId(),
          command: data.command,
          parameters: data.parameters,
          status: 'pending',
          timestamp: Date.now(),
          metadata: {},
        };
        QueueStorageService.addToQueue(queueEntry).catch(console.error);
      }

      return {
        success: response.ok,
        data,
      };
    } catch (error) {
      console.error('Error fetching commands:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export default new ApiService();

