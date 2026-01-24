import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthService from '../src/services/AuthService';

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
        text: async () => JSON.stringify({token: mockToken}),
        headers: {
          entries: () => [],
        },
      });

      (AsyncStorage.setItem as jest.Mock).mockResolvedValueOnce(undefined);

      const result = await AuthService.authenticate(mockSettings);

      expect(result.success).toBe(true);
      expect(result.token).toBe(mockToken);
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should deduplicate concurrent authentication requests', async () => {
      const mockToken = 'test-token-123';
      const mockSettings = {
        apiUrl: 'https://api.example.com',
        username: 'testuser',
        password: 'testpass',
        smsInterval: 60,
        healthInterval: 120,
        commandInterval: 60,
      };

      // Create a delayed response to ensure concurrent calls overlap
      ((global as any).fetch as jest.Mock).mockImplementationOnce(() => 
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              status: 200,
              text: async () => JSON.stringify({token: mockToken}),
              headers: {
                entries: () => [],
              },
            });
          }, 100);
        })
      );

      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      // Start two concurrent authentication requests
      const promise1 = AuthService.authenticate(mockSettings);
      const promise2 = AuthService.authenticate(mockSettings);

      const [result1, result2] = await Promise.all([promise1, promise2]);

      // Both should get the same successful result
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result1.token).toBe(mockToken);
      expect(result2.token).toBe(mockToken);

      // Fetch should only be called once despite two authenticate calls
      expect((global as any).fetch).toHaveBeenCalledTimes(1);
    });

    it('should allow new authentication after previous one completes', async () => {
      const mockToken1 = 'test-token-1';
      const mockToken2 = 'test-token-2';
      const mockSettings = {
        apiUrl: 'https://api.example.com',
        username: 'testuser',
        password: 'testpass',
        smsInterval: 60,
        healthInterval: 120,
        commandInterval: 60,
      };

      ((global as any).fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: async () => JSON.stringify({token: mockToken1}),
          headers: {
            entries: () => [],
          },
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: async () => JSON.stringify({token: mockToken2}),
          headers: {
            entries: () => [],
          },
        });

      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      // First authentication
      const result1 = await AuthService.authenticate(mockSettings);
      expect(result1.success).toBe(true);
      expect(result1.token).toBe(mockToken1);

      // Second authentication should create a new request
      const result2 = await AuthService.authenticate(mockSettings);
      expect(result2.success).toBe(true);
      expect(result2.token).toBe(mockToken2);

      // Fetch should be called twice for sequential requests
      expect((global as any).fetch).toHaveBeenCalledTimes(2);
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
        statusText: 'Unauthorized',
        text: async () => '',
        headers: {
          entries: () => [],
        },
      });

      const result = await AuthService.authenticate(mockSettings);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
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

      ((global as any).fetch as jest.Mock).mockRejectedValueOnce(
        new TypeError('Network request failed')
      );

      const result = await AuthService.authenticate(mockSettings);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('getToken', () => {
    it('should retrieve token from storage', async () => {
      const mockToken = 'test-token-123';

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(mockToken);

      const token = await AuthService.getToken();

      expect(token).toBe(mockToken);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('@auth_token');
    });

    it('should return null if no token exists', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      const token = await AuthService.getToken();

      expect(token).toBeNull();
    });
  });

  describe('clearToken', () => {
    it('should clear token from storage', async () => {
      (AsyncStorage.removeItem as jest.Mock).mockResolvedValueOnce(undefined);

      await AuthService.clearToken();

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@auth_token');
    });
  });
});
