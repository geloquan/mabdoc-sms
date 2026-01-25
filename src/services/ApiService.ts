import {
  ApiResponse,
  AppSettings,
  CommandResponse,
  LogEntry,
  QueueEntry,
  SystemHealth
} from '../types';
import {API_ENDPOINTS} from '../config/constants';
import {encode} from 'base-64';
import LogStorageService from './LogStorageService';
import QueueStorageService from './QueueStorageService';
import AuthService from './AuthService';
import {v4 as uuidv4} from 'uuid';
import SendSMS, {AndroidSuccessTypes} from 'react-native-sms';
import {ClaimQueueJobResource, SmsPayload} from "../types/api-resource.ts";

class ApiService {
  private async ensureAuthenticated(settings: AppSettings): Promise<boolean> {
    console.log('===== 🔐 Ensuring authentication... =====');
    const token = await AuthService.getToken();

    if (!token) {
      console.error('❌ No token configured. Please set up your worker token.');
      return false;
    }

    const authCheck = await AuthService.checkAuthentication(settings);

    if (authCheck.success) {
      console.log('✅ Authentication check successful - worker:', authCheck.data?.username);
      return true;
    }

    console.log('⚠️ Authentication check failed:', authCheck.error);
    return false;
  }

  private async getHeaders(): Promise<Record<string, string>> {
    const token = await AuthService.getToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  private generateId(): string {
    const id = uuidv4();
    console.log('🆔 Generated ID:', id);
    return id;
  }

  private async authenticatedFetch(
    url: string,
    options: RequestInit,
  ): Promise<any> {
    console.log('🌐 Making authenticated request...');
    console.log('📍 URL:', url);
    console.log('🔧 Method:', options.method);

    const token = await AuthService.getToken();

    if (!token) {
      console.error('❌ No token available');
      throw new Error('No authentication token available. Please configure your worker token.');
    }

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...options.headers,
    };

    console.log('📋 Request headers:', Object.keys(headers));

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });


      const text = await response.text();

      const cleanText = text.replace(/`/g, '').trim();

      if (response.status === 401) {
        await AuthService.clearToken();
        throw new Error('Unauthorized - token invalid or expired');
      }

      if (!cleanText) {
        console.log('ℹ️ Empty response body');
        return null;
      }

      const parsed = JSON.parse(cleanText);
      console.log('📥 Parsed response:', parsed);

      return parsed;

    } catch (error) {
      throw error;
    }
  }

  async fetchSmsData(settings: AppSettings): Promise<ApiResponse> {
    console.log('📱 ===== FETCH SMS DATA START =====');

    const isAuthenticated = await this.ensureAuthenticated(settings);
    if (!isAuthenticated) {
      console.error('❌ Authentication required but failed');
      return {
        success: false,
        error: 'Authentication failed - invalid or missing token',
      };
    }

    try {
      const url = `${settings.apiUrl}${API_ENDPOINTS.SMS}`;
      console.log('📍 Fetching SMS data from:', url);

      const response = await this.authenticatedFetch(
        url,
        {
          method: 'POST',
        }
      );

      if (response.status === 204) {
        return {success: true, data: null};
      }

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const jobResource = await response as {
        job: ClaimQueueJobResource
      };

      const job: ClaimQueueJobResource = jobResource.job;

      if (!job) {
        console.log('ℹ️ No job available');
        return {
          success: true,
          data: null,
        };
      }

      if (job.job_type !== 'send_sms') {
        throw new Error('Invalid job type');
      }

      const payload = job.payload as SmsPayload;

      if (!payload?.phone_number || !payload?.message) {
        throw new Error('Invalid SMS payload');
      }

      await this.sendSms(payload.phone_number, payload.message);

      return {
        success: true,
        data: job,
      };
    } catch (error) {
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
          console.log("✅ SMS sent successfully");
        } else if (cancelled) {
          console.warn("⚠️ SMS sending cancelled");
        } else if (error) {
          console.error("❌ SMS sending failed:", error);
        }
      }
    );
    console.log('📤 ===== SEND SMS END =====');
  }

  async sendHealthData(
    settings: AppSettings,
    health: SystemHealth,
  ): Promise<ApiResponse> {
    console.log('💊 ===== SEND HEALTH DATA START =====');
    const startTime = Date.now();
    const logEntry: LogEntry = {
      id: this.generateId(),
      endpoint: API_ENDPOINTS.HEALTH,
      timestamp: startTime,
      type: 'health',
      request: {
        method: 'POST',
        headers: {},
        body: health,
      },
      metadata: {
        batteryLevel: health.batteryLevel,
        networkType: health.hasInternetAccess ? 'connected' : 'disconnected',
      },
    };

    console.log('💊 Health data:', JSON.stringify(health, null, 2));

    try {
      const url = `${settings.apiUrl}${API_ENDPOINTS.HEALTH}`;
      console.log('📍 Sending health data to:', url);

      const response = await this.authenticatedFetch(
        url,
        {
          method: 'POST',
          body: JSON.stringify(health),
        }
      );

      const data = await response.json();
      console.log('📥 Health response:', JSON.stringify(data, null, 2));

      logEntry.response = {
        status: response.status,
        data,
      };
      logEntry.metadata.duration = Date.now() - startTime;

      LogStorageService.addLog(logEntry).catch(console.error);

      console.log('✅ Health data sent successfully');
      console.log('💊 ===== SEND HEALTH DATA END =====');

      return {
        success: response.ok,
        data,
      };
    } catch (error) {
      console.error('❌ ===== SEND HEALTH DATA ERROR =====');
      console.error('Error sending health data:', error);

      logEntry.response = {
        status: 0,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      logEntry.metadata.duration = Date.now() - startTime;

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
    console.log('⚡ ===== FETCH COMMANDS START =====');
    try {
      const url = `${settings.apiUrl}${API_ENDPOINTS.COMMAND}`;
      console.log('📍 Fetching commands from:', url);

      const response = await this.authenticatedFetch(
        url,
        {method: 'GET'}
      );

      const data = await response.json();
      console.log('📥 Commands response:', JSON.stringify(data, null, 2));

      if (data && data.command) {
        console.log('📋 Command found:', data.command);
        console.log('📋 Parameters:', JSON.stringify(data.parameters, null, 2));

        const queueEntry: QueueEntry = {
          id: this.generateId(),
          command: data.command,
          parameters: data.parameters,
          status: 'pending',
          timestamp: Date.now(),
          metadata: {},
        };

        console.log('💾 Adding command to queue...');
        QueueStorageService.addToQueue(queueEntry).catch(console.error);
      } else {
        console.log('ℹ️ No command in response');
      }

      console.log('✅ Commands fetched successfully');
      console.log('⚡ ===== FETCH COMMANDS END =====');

      return {
        success: response.ok,
        data,
      };
    } catch (error) {
      console.error('❌ ===== FETCH COMMANDS ERROR =====');
      console.error('Error fetching commands:', error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export default new ApiService();
