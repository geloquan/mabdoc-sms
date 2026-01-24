import AsyncStorage from '@react-native-async-storage/async-storage';
import {AppSettings} from '../types';
import {API_ENDPOINTS} from '../config/constants';
import {encode} from 'base-64';

const TOKEN_KEY = '@auth_token';

interface AuthResult {
  success: boolean;
  token?: string;
  error?: string;
}

class AuthService {
  private authenticationPromise: Promise<AuthResult> | null = null;

  async authenticate(settings: AppSettings): Promise<AuthResult> {
    // If an authentication is already in progress, return the existing promise
    if (this.authenticationPromise) {
      //console.log('🔄 Authentication already in progress, returning existing promise');
      return this.authenticationPromise;
    }

    //console.log('🔐 ===== AUTHENTICATION START =====');
    //console.log('👤 Username:', settings.username);
    //console.log('🌐 API URL:', settings.apiUrl);
    //console.log('🎯 Auth Endpoint:', API_ENDPOINTS.AUTH);

    const fullUrl = `${settings.apiUrl}${API_ENDPOINTS.AUTH}`;
    //console.log('📍 Full URL:', fullUrl);

    // Create and store the authentication promise
    this.authenticationPromise = this.performAuthentication(fullUrl, settings);

    try {
      const result = await this.authenticationPromise;
      return result;
    } finally {
      // Clear the promise after completion (success or failure)
      this.authenticationPromise = null;
    }
  }

  private async performAuthentication(fullUrl: string, settings: AppSettings): Promise<AuthResult> {
    try {
      // Encode credentials for Basic Auth
      const credentials = encode(`${settings.username}:${settings.password}`);
      //console.log('🔑 Credentials encoded (length):', credentials.length);

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`,
        'Accept': 'application/json',
      };

      //console.log('📋 Request headers:', Object.keys(headers));
      //console.log('📋 Authorization header:', `Basic ${credentials.substring(0, 20)}...`);

      //console.log('🚀 Sending POST request...');
      const response = await fetch(fullUrl, {
        method: 'POST',
        headers,
      });

      //console.log('📥 Response received');
      //console.log('📊 Status:', response.status);
      //console.log('📊 Status Text:', response.statusText);
      //console.log('📊 OK:', response.ok);
      //console.log('📊 Headers:', JSON.stringify(Object.fromEntries(response.headers.entries())));

      // Get response text first for debugging
      const responseText = await response.text();
      //console.log('📄 Response body (first 500 chars):', responseText.substring(0, 500));

      if (!response.ok) {
        //console.error('❌ Response not OK');

        // Try to parse as JSON for error message
        try {
          const errorData = JSON.parse(responseText);
          //console.error('❌ Error data:', JSON.stringify(errorData, null, 2));
          return {
            success: false,
            error: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          };
        } catch (parseError) {
          //console.error('❌ Response is not JSON, likely HTML error page');
          //console.error('❌ First 200 chars:', responseText.substring(0, 200));
          return {
            success: false,
            error: `HTTP ${response.status}: ${response.statusText} (Non-JSON response)`,
          };
        }
      }

      // Parse successful response
      let data;
      try {
        const cleanText = responseText.replace(/`/g, '').trim();
        if (cleanText) {
          //console.log('API Response:', cleanText);
          data = JSON.parse(cleanText);
        }
        //console.log('✅ Response parsed successfully');
        //console.log('📦 Response data:', JSON.stringify(data, null, 2));
      } catch (parseError) {
        //console.error('❌ Failed to parse successful response as JSON');
        //console.error('❌ Parse error:', parseError);
        //console.error('❌ Response text:', responseText);
        return {
          success: false,
          error: 'Invalid JSON response from server',
        };
      }

      if (!data.token) {
        //console.error('❌ No token in response');
        //console.error('❌ Response keys:', Object.keys(data));
        return {
          success: false,
          error: 'No token received from server',
        };
      }

      // Save token
      //console.log('💾 Saving token...');
      await this.saveToken(data.token);
      //console.log('✅ Token saved successfully');
      //console.log('👤 User:', data.name);

      //console.log('🔐 ===== AUTHENTICATION SUCCESS =====');
      return {
        success: true,
        token: data.token,
      };

    } catch (error) {
      //console.error('❌ ===== AUTHENTICATION ERROR =====');
      //console.error('Error type:', error instanceof Error ? 'Error' : typeof error);
      //console.error('Error message:', error instanceof Error ? error.message : 'Unknown');
      //console.error('Error stack:', error instanceof Error ? error.stack : 'N/A');

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
      //console.log('💾 Saving token to AsyncStorage...');
      await AsyncStorage.setItem(TOKEN_KEY, token);
      //console.log('✅ Token saved to AsyncStorage');
    } catch (error) {
      //console.error('❌ Failed to save token:', error);
      throw error;
    }
  }

  async getToken(): Promise<string | null> {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (token) {
        //console.log('✅ Token found in storage (length):', token.length);
      } else {
        //console.log('ℹ️ No token found in storage');
      }
      return token;
    } catch (error) {
      //console.error('❌ Failed to get token:', error);
      return null;
    }
  }

  async clearToken(): Promise<void> {
    try {
      //console.log('🗑️ Clearing token from storage...');
      await AsyncStorage.removeItem(TOKEN_KEY);
      //console.log('✅ Token cleared');
    } catch (error) {
      //console.error('❌ Failed to clear token:', error);
    }
  }
}

export default new AuthService();
