import { AppSettings, ApiResponse, CommandResponse, SystemHealth } from '../types';
import { API_ENDPOINTS } from '../config/constants';

class ApiService {
  private getHeaders(settings: AppSettings): HeadersInit {
    const credentials = Buffer.from(
      `${settings.username}:${settings.password}`,
    ).toString('base64');

    return {
      'Content-Type': 'application/json',
      Authorization: `Basic ${credentials}`,
    };
  }

  async fetchSmsData(settings: AppSettings): Promise<ApiResponse> {
    try {
      const url = `${settings.apiUrl}${API_ENDPOINTS.SMS}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(settings),
      });

      const data = await response.json();
      return {
        success: response.ok,
        data,
      };
    } catch (error) {
      console.error('Error fetching SMS data:', error);
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
    try {
      const url = `${settings.apiUrl}${API_ENDPOINTS.HEALTH}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(settings),
        body: JSON.stringify(health),
      });

      const data = await response.json();
      return {
        success: response.ok,
        data,
      };
    } catch (error) {
      console.error('Error sending health data:', error);
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
