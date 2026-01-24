import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthService from '../src/services/AuthService';
import {STORAGE_KEYS} from '../src/config/constants';

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));

(global as any).fetch = jest.fn();

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    it('should authenticate successfully and store token', async () => {
      const mockToken = 'test-token-123';
      const mockSettings = {
        apiUrl: 'https://api.example.com',
        username: 'testuser',
        password: 'testpass',
        smsInterval: 60,
        healthInterval: 120,
        commandInterval: 60,
      };

      ((global as any).fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({token: mockToken}),
      });

      (AsyncStorage.setItem as jest.Mock).mockResolvedValueOnce(undefined);

      const result = await AuthService.authenticate(mockSettings);

      expect(result.success).toBe(true);
      expect(result.data?.token).toBe(mockToken);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.AUTH_TOKEN,
        expect.stringContaining(mockToken),
      );
    });

    it('should handle authentication failure', async () => {
      const mockSettings = {
        apiUrl: 'https://api.example.com',
        username: 'testuser',
        password: 'wrongpass',
        smsInterval: 60,
        healthInterval: 120,
        commandInterval: 60,
      };

      ((global as any).fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      const result = await AuthService.authenticate(mockSettings);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Authentication failed');
    });

    it('should handle network errors', async () => {
      const mockSettings = {
        apiUrl: 'https://api.example.com',
        username: 'testuser',
        password: 'testpass',
        smsInterval: 60,
        healthInterval: 120,
        commandInterval: 60,
      };

      ((global as any).fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await AuthService.authenticate(mockSettings);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });
  });

  describe('getToken', () => {
    it('should retrieve valid token', async () => {
      const mockToken = 'test-token-123';
      const mockAuthToken = {
        token: mockToken,
        expiresAt: Date.now() + 3600000, // 1 hour in future
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(mockAuthToken),
      );

      const token = await AuthService.getToken();

      expect(token).toBe(mockToken);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith(STORAGE_KEYS.AUTH_TOKEN);
    });

    it('should return null if no token exists', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      const token = await AuthService.getToken();

      expect(token).toBeNull();
    });

    it('should return null and clear expired token', async () => {
      const mockAuthToken = {
        token: 'expired-token',
        expiresAt: Date.now() - 3600000, // 1 hour in past
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(mockAuthToken),
      );
      (AsyncStorage.removeItem as jest.Mock).mockResolvedValueOnce(undefined);

      const token = await AuthService.getToken();

      expect(token).toBeNull();
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.AUTH_TOKEN);
    });
  });

  describe('clearToken', () => {
    it('should clear token from storage', async () => {
      (AsyncStorage.removeItem as jest.Mock).mockResolvedValueOnce(undefined);

      await AuthService.clearToken();

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.AUTH_TOKEN);
    });
  });

  describe('hasValidToken', () => {
    it('should return true if valid token exists', async () => {
      const mockAuthToken = {
        token: 'test-token-123',
        expiresAt: Date.now() + 3600000,
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(mockAuthToken),
      );

      const hasToken = await AuthService.hasValidToken();

      expect(hasToken).toBe(true);
    });

    it('should return false if no token exists', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      const hasToken = await AuthService.hasValidToken();

      expect(hasToken).toBe(false);
    });
  });
});
