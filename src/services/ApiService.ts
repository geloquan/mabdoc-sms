import { AppSettings, ApiResponse, CommandResponse, SystemHealth, LogEntry, LogType } from '../types';
import { API_ENDPOINTS } from '../config/constants';
import { encode } from 'base-64';
import LogsService from './LogsService';

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

  private async createLog(
    type: LogType,
    endpoint: string,
    method: 'GET' | 'POST',
    request: any,
    response: ApiResponse,
    startTime: number,
  ): Promise<void> {
    const log: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      type,
      timestamp: Date.now(),
      endpoint,
      method,
      request,
      response: response.data,
      success: response.success,
      error: response.error,
      metadata: {
        duration: Date.now() - startTime,
      },
    };

    try {
      await LogsService.addLog(log);
    } catch (error) {
      console.error('Error logging API call:', error);
    }
  }

  async fetchSmsData(settings: AppSettings): Promise<ApiResponse> {
    const startTime = Date.now();
    try {
      const url = `${settings.apiUrl}${API_ENDPOINTS.SMS}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(settings),
      });

      const data = await response.json();
      const result = {
        success: response.ok,
        data,
      };

      await this.createLog(LogType.SMS, url, 'GET', null, result, startTime);
      return result;
    } catch (error) {
      console.error('Error fetching SMS data:', error);
      const result = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      await this.createLog(
        LogType.SMS,
        `${settings.apiUrl}${API_ENDPOINTS.SMS}`,
        'GET',
        null,
        result,
        startTime,
      );
      return result;
    }
  }

  async sendHealthData(
    settings: AppSettings,
    health: SystemHealth,
  ): Promise<ApiResponse> {
    const startTime = Date.now();
    try {
      const url = `${settings.apiUrl}${API_ENDPOINTS.HEALTH}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(settings),
        body: JSON.stringify(health),
      });

      const data = await response.json();
      const result = {
        success: response.ok,
        data,
      };

      await this.createLog(LogType.HEALTH, url, 'POST', health, result, startTime);
      return result;
    } catch (error) {
      console.error('Error sending health data:', error);
      const result = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      await this.createLog(
        LogType.HEALTH,
        `${settings.apiUrl}${API_ENDPOINTS.HEALTH}`,
        'POST',
        health,
        result,
        startTime,
      );
      return result;
    }
  }

  async fetchCommands(
    settings: AppSettings,
  ): Promise<ApiResponse<CommandResponse>> {
    const startTime = Date.now();
    try {
      const url = `${settings.apiUrl}${API_ENDPOINTS.COMMAND}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(settings),
      });

      const data = await response.json();
      const result = {
        success: response.ok,
        data,
      };

      await this.createLog(LogType.COMMAND, url, 'GET', null, result, startTime);
      return result;
    } catch (error) {
      console.error('Error fetching commands:', error);
      const result = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      await this.createLog(
        LogType.COMMAND,
        `${settings.apiUrl}${API_ENDPOINTS.COMMAND}`,
        'GET',
        null,
        result,
        startTime,
      );
      return result;
    }
  }
}

export default new ApiService();
