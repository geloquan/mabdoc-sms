import AsyncStorage from '@react-native-async-storage/async-storage';
import {encode} from 'base-64';
import {STORAGE_KEYS, API_ENDPOINTS} from '../config/constants';
import {AppSettings, ApiResponse} from '../types';

interface AuthToken {
  token: string;
  expiresAt?: number;
}

class AuthService {
  /**
   * Authenticate with the API and store the token
   * @param settings Application settings containing credentials
   * @returns Promise resolving to authentication response
   */
  async authenticate(settings: AppSettings): Promise<ApiResponse<AuthToken>> {
    try {
      const url = `${settings.apiUrl}${API_ENDPOINTS.AUTH}`;
      const credentials = encode(`${settings.username}:${settings.password}`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${credentials}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Authentication failed with status ${response.status}`);
      }

      const data = await response.json();
      const token = data.token || data.access_token;

      if (!token) {
        throw new Error('No token received from authentication endpoint');
      }

      // Store the token
      const authToken: AuthToken = {
        token,
        expiresAt: data.expires_at || data.expiresAt,
      };

      await this.setToken(authToken);

      return {
        success: true,
        data: authToken,
      };
    } catch (error) {
      console.error('Authentication error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown authentication error',
      };
    }
  }

  /**
   * Store authentication token in AsyncStorage
   * @param authToken Token object to store
   */
  async setToken(authToken: AuthToken): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, JSON.stringify(authToken));
    } catch (error) {
      console.error('Error storing auth token:', error);
      throw error;
    }
  }

  /**
   * Retrieve authentication token from AsyncStorage
   * @returns Promise resolving to token string or null
   */
  async getToken(): Promise<string | null> {
    try {
      const tokenData = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      if (!tokenData) {
        return null;
      }

      const authToken: AuthToken = JSON.parse(tokenData);

      // Check if token is expired
      if (authToken.expiresAt && authToken.expiresAt < Date.now()) {
        await this.clearToken();
        return null;
      }

      return authToken.token;
    } catch (error) {
      console.error('Error retrieving auth token:', error);
      return null;
    }
  }

  /**
   * Clear authentication token from AsyncStorage
   */
  async clearToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    } catch (error) {
      console.error('Error clearing auth token:', error);
    }
  }

  /**
   * Check if a valid token exists
   * @returns Promise resolving to boolean
   */
  async hasValidToken(): Promise<boolean> {
    const token = await this.getToken();
    return token !== null;
  }
}

export default new AuthService();
