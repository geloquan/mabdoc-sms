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

  private async ensureAuthenticated(settings: AppSettings): Promise<boolean> {

    const token = await AuthService.getToken();

    if (token) {
      // Check if the token is still valid by calling /api/sms/machine/me
      const authCheck = await AuthService.checkAuthentication(settings);
      
      if (authCheck.success) {
        console.log('✅ Authentication check successful - user:', authCheck.data?.username);
        return true;
      }
      
      console.log('⚠️ Authentication check failed:', authCheck.error);
      // Token is invalid or expired, need to re-authenticate
    }

    // No token or token is invalid, authenticate
    const authResult = await AuthService.authenticate(settings);

    if (authResult.success) {
      console.log('✅ Authentication successful');
      return true;
    } else {
      console.error('❌ Authentication failed:', authResult.error);
      return false;
    }
  }

  private async getHeaders(settings: AppSettings): Promise<Record<string, string>> {
    console.log('🔑 Getting headers...');
    const token = await AuthService.getToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      console.log('✅ Using Bearer token authentication');
      headers.Authorization = `Bearer ${token}`;
    } else {
      console.log('⚠️ No token found, falling back to Basic authentication');
      const credentials = encode(
        `${settings.username}:${settings.password}`,
      );
      headers.Authorization = `Basic ${credentials}`;
      console.log('📝 Basic auth credentials:', `${settings.username}:***`);
    }

    return headers;
  }

  private generateId(): string {
    const id = uuidv4();
    console.log('🆔 Generated ID:', id);
    return id;
  }

  private async handleUnauthorized(settings: AppSettings): Promise<boolean> {
    if (this.isReauthenticating) {
      console.log('⏳ Already reauthenticating, skipping...');
      return false;
    }

    this.isReauthenticating = true;

    try {
      console.log('🔐 Received 401 Unauthorized - attempting reauthentication...');
      console.log('🔐 Settings:', {username: settings.username, apiUrl: settings.apiUrl});

      const authResult = await AuthService.authenticate(settings);

      if (authResult.success) {
        console.log('✅ Reauthentication successful');
        console.log('🎫 New token received');
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
      console.log('🔓 Reauthentication lock released');
    }
  }


  private async authenticatedFetch(
    url: string,
    options: RequestInit,
    settings: AppSettings,
    retryOn401 = true,
  ): Promise<Response> {
    console.log('🌐 Making authenticated request...');
    console.log('📍 URL:', url);
    console.log('🔧 Method:', options.method);
    console.log('🔄 Retry on 401:', retryOn401);

    // Get or refresh token
    let token = await AuthService.getToken();
    console.log('🔑 Token retrieved:', token ? `Yes (length: ${token.length})` : 'No');
    console.log('🔑 Token preview:', token ? `${token.substring(0, 30)}...` : 'N/A');


    if (!token) {
      console.log('🔑 No token found, authenticating...');
      const authResult = await AuthService.authenticate(settings);

      if (!authResult.success || !authResult.token) {
        console.error('❌ Authentication failed:', authResult.error);
        throw new Error(`Authentication failed: ${authResult.error}`);
      }

      token = authResult.token;
      console.log('✅ Authentication successful, token obtained');
    }

    // Build headers with Bearer token
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...options.headers,
    };

    console.log('📋 Request headers:', Object.keys(headers));

    const response = await fetch(url, {
      ...options,
      headers,
    });

    console.log('📥 Response status:', response.status);
    console.log('📥 Response ok:', response.ok);

    // if (response.status === 401 && retryOn401) {
    if (false) {
      console.warn('⚠️ 401 Unauthorized - token expired, re-authenticating...');

      await AuthService.clearToken();

      const authResult = await AuthService.authenticate(settings);

      if (!authResult.success || !authResult.token) {
        console.error('❌ Re-authentication failed:', authResult.error);
        return response; // Return the 401 response
      }

      console.log('✅ Re-authentication successful, retrying request...');

      const newHeaders = {
        'Authorization': `Bearer ${authResult.token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...options.headers,
      };

      return fetch(url, {
        ...options,
        headers: newHeaders,
      });
    }

    return response;
  }

  async fetchSmsData(settings: AppSettings): Promise<ApiResponse> {
    console.log('📱 ===== FETCH SMS DATA START =====');

    const isAuthenticated = await this.ensureAuthenticated(settings);
    if (!isAuthenticated) {
      console.error('❌ Authentication required but failed');
      return {
        success: false,
        error: 'Authentication failed',
      };
    }

    try {
      const url = `${settings.apiUrl}${API_ENDPOINTS.SMS}`;
      console.log('📍 Fetching SMS data from:', url);
      console.log('⚙️ Settings:', {username: settings.username, apiUrl: settings.apiUrl});

      const response = await this.authenticatedFetch(
        url,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            job_types: ['send_sms'],
          }),
        },
        settings,
      );

      console.log('📌 Response Status:', response.status);
      console.log('📌 Response URL:', url);

      console.log('🔍 Response Headers:', Object.fromEntries(response.headers.entries()));
      console.log('🔍 Allow Header:', response.headers.get('Allow'));

      if (!response.ok) {
        console.error('❌ API request failed with status:', response.status);
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      console.log('📦 Response data:', JSON.stringify(data, null, 2));

      const job: SmsJob | undefined = data.job;

      if (!job) {
        console.error('❌ No job found in response');
        throw new Error('No job found in response');
      }

      console.log('📋 Job type:', job.job_type);
      if (job.job_type !== 'sms') {
        console.error('❌ Invalid job type:', job.job_type);
        throw new Error('Invalid job type');
      }

      const payload = job.payload as SmsPayload;
      console.log('📦 SMS Payload:', JSON.stringify(payload, null, 2));

      if (!payload?.phone_number || !payload?.message) {
        console.error('❌ Invalid SMS payload - missing phone_number or message');
        console.error('   Phone:', payload?.phone_number);
        console.error('   Message:', payload?.message);
        throw new Error('Invalid SMS payload');
      }

      console.log('📞 Sending SMS to:', payload.phone_number);
      console.log('💬 Message preview:', payload.message.substring(0, 50) + '...');

      await this.sendSms(payload.phone_number, payload.message);

      console.log('✅ SMS data fetched and sent successfully');
      console.log('📱 ===== FETCH SMS DATA END =====');

      return {
        success: true,
        data: job,
      };
    } catch (error) {
      console.error('❌ ===== FETCH SMS DATA ERROR =====');
      console.error('Error fetching SMS data:', error);
      console.error('Error type:', error instanceof Error ? 'Error' : typeof error);
      console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async sendSms(phoneNumber: string, message: string) {
    console.log('📤 ===== SEND SMS START =====');
    console.log('📞 Phone number:', phoneNumber);
    console.log('💬 Message length:', message.length);
    console.log('💬 Message:', message);

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
        },
        settings,
      );

      const data = await response.json();
      console.log('📥 Health response:', JSON.stringify(data, null, 2));

      logEntry.response = {
        status: response.status,
        data,
      };
      logEntry.metadata.duration = Date.now() - startTime;
      console.log('⏱️ Request duration:', logEntry.metadata.duration, 'ms');

      // Store log asynchronously
      console.log('💾 Storing health log...');
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
    console.log('⚡ ===== FETCH COMMANDS START =====');
    try {
      const url = `${settings.apiUrl}${API_ENDPOINTS.COMMAND}`;
      console.log('📍 Fetching commands from:', url);

      const response = await this.authenticatedFetch(
        url,
        {method: 'GET'},
        settings,
      );

      const data = await response.json();
      console.log('📥 Commands response:', JSON.stringify(data, null, 2));

      // Store command in queue
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
