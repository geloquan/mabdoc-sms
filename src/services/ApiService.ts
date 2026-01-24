import {
  ApiResponse,
  AppSettings,
  CommandResponse,
  LogEntry,
  QueueEntry,
  SmsJob,
  SmsPayload,
  SystemHealth
} from '../types';
import {API_ENDPOINTS} from '../config/constants';
import {encode} from 'base-64';
import LogStorageService from './LogStorageService';
import QueueStorageService from './QueueStorageService';
import AuthService from './AuthService';
import {v4 as uuidv4} from 'uuid';
import SendSMS, {AndroidSuccessTypes} from 'react-native-sms';

class ApiService {
  private isReauthenticating = false;

  /**
   * Get headers for API requests with Bearer token authentication
   * Falls back to Basic auth if no token is available
   */
  private async getHeaders(settings: AppSettings): Promise<Record<string, string>> {
    const token = await AuthService.getToken();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      // Use Bearer token authentication if available
      headers.Authorization = `Bearer ${token}`;
    } else {
      // Fall back to Basic authentication
      const credentials = encode(
        `${settings.username}:${settings.password}`,
      );
      headers.Authorization = `Basic ${credentials}`;
    }

    return headers;
  }

  private generateId(): string {
    // Using uuid v4 for React Native compatibility
    // crypto.randomUUID() is not supported in React Native
    return uuidv4();
  }

  /**
   * Handle 401 Unauthorized responses by reauthenticating
   * @param settings Application settings
   * @returns Promise resolving to true if reauthentication succeeded
   */
  private async handleUnauthorized(settings: AppSettings): Promise<boolean> {
    if (this.isReauthenticating) {
      // Prevent multiple simultaneous reauthentication attempts
      return false;
    }

    this.isReauthenticating = true;

    try {
      console.log('🔐 Received 401 Unauthorized - attempting reauthentication...');
      const authResult = await AuthService.authenticate(settings);
      
      if (authResult.success) {
        console.log('✅ Reauthentication successful');
        return true;
      } else {
        console.error('❌ Reauthentication failed:', authResult.error);
        return false;
      }
    } catch (error) {
      console.error('❌ Reauthentication error:', error);
      return false;
    } finally {
      this.isReauthenticating = false;
    }
  }

  /**
   * Make an authenticated API request with automatic 401 handling
   * @param url Request URL
   * @param options Fetch options
   * @param settings Application settings
   * @param retryOn401 Whether to retry on 401 (default: true)
   * @returns Promise resolving to fetch Response
   */
  private async authenticatedFetch(
    url: string,
    options: RequestInit,
    settings: AppSettings,
    retryOn401 = true,
  ): Promise<Response> {
    const headers = await this.getHeaders(settings);
    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    // Handle 401 Unauthorized
    if (response.status === 401 && retryOn401) {
      const reauthSuccess = await this.handleUnauthorized(settings);
      
      if (reauthSuccess) {
        // Retry the request with new token
        const newHeaders = await this.getHeaders(settings);
        return fetch(url, {
          ...options,
          headers: {
            ...newHeaders,
            ...options.headers,
          },
        });
      }
    }

    return response;
  }


  async fetchSmsData(settings: AppSettings): Promise<ApiResponse> {
    try {
      const url = `${settings.apiUrl}${API_ENDPOINTS.SMS}`;
      const response = await this.authenticatedFetch(
        url,
        {method: 'GET'},
        settings,
      );

      console.log('📌 Status:', response.status, 'URL:', url);

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();

      const job: SmsJob | undefined = data.job;

      if (!job || job.job_type !== 'sms') {
        throw new Error('Invalid job type');
      }

      const payload = job.payload as SmsPayload;

      if (!payload?.phone_number || !payload?.message) {
        throw new Error('Invalid SMS payload');
      }

      this.sendSms(payload.phone_number, payload.message);

      return {
        success: true,
        data: job,
      };
    } catch (error) {
      console.error('Error fetching SMS data:', error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async sendSms(phoneNumber: string, message: string) {
    await SendSMS.send(
      {
        body: message,
        recipients: [phoneNumber],
        successTypes: [AndroidSuccessTypes.sent, AndroidSuccessTypes.queued],
      },
      (completed, cancelled, error) => {
        if (completed) {
          console.log("SMS sent successfully");
        } else if (cancelled) {
          console.log("SMS sending cancelled");
        } else if (error) {
          console.log("SMS sending failed");
        }
      }
    );
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
        headers: {}, // Will be populated after the request
        body: health,
      },
      metadata: {
        batteryLevel: health.batteryLevel,
        networkType: health.hasInternetAccess ? 'connected' : 'disconnected',
      },
    };

    try {
      const url = `${settings.apiUrl}${API_ENDPOINTS.HEALTH}`;
      const response = await this.authenticatedFetch(
        url,
        {
          method: 'POST',
          body: JSON.stringify(health),
        },
        settings,
      );

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
      const response = await this.authenticatedFetch(
        url,
        {method: 'GET'},
        settings,
      );

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

