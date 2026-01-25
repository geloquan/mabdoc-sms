import AsyncStorage from '@react-native-async-storage/async-storage';
import {AppSettings, MeResponse} from '../types';
import {API_ENDPOINTS} from '../config/constants';
import {encode} from 'base-64';
import SettingsService from "./SettingsService.ts";

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

  async clearToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
    } catch {
    }
  }

  async getToken(): Promise<string | null> {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      return token;
    } catch {
      return null;
    }
  }

  async checkAuthentication(settings: AppSettings): Promise<AuthCheckResult> {
    console.log('🔒===== Checking authentication status =====');

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
          console.warn('❌ Authentication failed: Invalid or expired token');
          await this.clearToken();
          return {
            success: false,
            error: 'Invalid or expired token',
          };
        }
      }

      const text = await response.text();
      const cleanText = text.replace(/`/g, '').trim();

      const data = JSON.parse(cleanText);

      console.log('✅ Authentication valid for user:', data.username);

      return {
        success: true,
        data: {
          id: data.id,
          username: data.username,
        },
      };
    } catch (error) {
      console.error('❌ Error checking authentication checkAuthentication():', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown authentication error',
      };
    }
  }

  async login(): Promise<void> {
    console.log('🔒===== Performing worker login =====');

    try {
      const settings = await SettingsService.getSettings();

      const fullUrl = `${settings.apiUrl}${API_ENDPOINTS.AUTH}`;

      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: settings.username,
          password: settings.password,
        }),
      });

      console.log('📥 Response status:', response.status);

      if (!response.ok) {
        throw new Error('Worker login failed');
      }

      const text = await response.text();

      const cleanText = text.replace(/`/g, '').trim();

      const data = JSON.parse(cleanText);

      await this.saveToken(data.token);
    } catch (error) {
      console.error('❌ Worker login error:', error);

      if (error instanceof SyntaxError) {
        throw new Error('Invalid response format from server');
      }

      if (error instanceof TypeError && error.message.includes('Network request failed')) {
        throw new Error('Network error. Check your internet connection and API URL.');
      }

      throw error;
    }
  }

}

export default new AuthService();
