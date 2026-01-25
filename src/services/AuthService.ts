import AsyncStorage from '@react-native-async-storage/async-storage';
import {AppSettings, MeResponse} from '../types';
import {API_ENDPOINTS} from '../config/constants';
import {encode} from 'base-64';

const TOKEN_KEY = '@auth_token';

interface AuthResult {
  success: boolean;
  token?: string;
  error?: string;
}

interface AuthCheckResult {
  success: boolean;
  data?: MeResponse;
  error?: string;
}

class AuthService {
  private authenticationPromise: Promise<AuthResult> | null = null;

  async authenticate(settings: AppSettings): Promise<AuthResult> {
    if (this.authenticationPromise) {
      return this.authenticationPromise;
    }
    const fullUrl = `${settings.apiUrl}${API_ENDPOINTS.AUTH}`;

    this.authenticationPromise = this.performAuthentication(fullUrl, settings);

    try {
      const result = await this.authenticationPromise;
      return result;
    } finally {
      this.authenticationPromise = null;
    }
  }

  private async performAuthentication(fullUrl: string, settings: AppSettings): Promise<AuthResult> {
    try {
      const credentials = encode(`${settings.username}:${settings.password}`);

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`,
        'Accept': 'application/json',
      };


      const response = await fetch(fullUrl, {
        method: 'POST',
        headers,
      });

      const responseText = await response.text();

      if (!response.ok) {

        try {
          const errorData = JSON.parse(responseText);
          return {
            success: false,
            error: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          };
        } catch {
          return {
            success: false,
            error: `HTTP ${response.status}: ${response.statusText} (Non-JSON response)`,
          };
        }
      }

      let data;
      try {
        const cleanText = responseText.replace(/`/g, '').trim();
        if (cleanText) {
          data = JSON.parse(cleanText);
        }
      } catch {
        return {
          success: false,
          error: 'Invalid JSON response from server',
        };
      }

      if (!data.token) {
        return {
          success: false,
          error: 'No token received from server',
        };
      }

      await this.saveToken(data.token);

      return {
        success: true,
        token: data.token,
      };

    } catch (error) {
      if (error instanceof TypeError && error.message.includes('Network request failed')) {
        return {
          success: false,
          error: 'Network request failed. Check API URL and internet connection.',
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown authentication error',
      };
    }
  }

  async saveToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(TOKEN_KEY, token);
    } catch {
      throw new Error('Failed to save token');
    }
  }

  async getToken(): Promise<string | null> {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (token) {
      } else {
      }
      return token;
    } catch {
      return null;
    }
  }

  async checkAuthentication(settings: AppSettings): Promise<AuthCheckResult> {
    try {
      const token = await this.getToken();
      
      if (!token) {
        return {
          success: false,
          error: 'No token available',
        };
      }

      const fullUrl = `${settings.apiUrl}${API_ENDPOINTS.ME}`;
      
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token is invalid or expired
          await this.clearToken();
          return {
            success: false,
            error: 'Authentication expired',
          };
        }
        
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const data = await response.json();
      
      if (typeof data.id !== 'number' || typeof data.username !== 'string' || !data.username) {
        return {
          success: false,
          error: 'Invalid response from server',
        };
      }

      return {
        success: true,
        data: {
          id: data.id,
          username: data.username,
        },
      };
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('Network request failed')) {
        return {
          success: false,
          error: 'Network request failed. Check API URL and internet connection.',
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async clearToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
    } catch {
    }
  }
}

export default new AuthService();
