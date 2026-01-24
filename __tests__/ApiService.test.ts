import ApiService from '../src/services/ApiService';
import AuthService from '../src/services/AuthService';

// Mock AuthService
jest.mock('../src/services/AuthService', () => ({
  getToken: jest.fn(),
  authenticate: jest.fn(),
  clearToken: jest.fn(),
  hasValidToken: jest.fn(),
}));

// Mock fetch
(global as any).fetch = jest.fn();

// Mock other dependencies
jest.mock('../src/services/LogStorageService', () => ({
  addLog: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../src/services/QueueStorageService', () => ({
  addToQueue: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('react-native-sms', () => ({
  send: jest.fn(),
  default: {
    send: jest.fn(),
  },
}));

describe('ApiService - Bearer Token Authentication', () => {
  const mockSettings = {
    apiUrl: 'https://api.example.com',
    username: 'testuser',
    password: 'testpass',
    smsInterval: 60,
    healthInterval: 120,
    commandInterval: 60,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Bearer token authentication', () => {
    it('should use Bearer token when available', async () => {
      const mockToken = 'test-bearer-token';
      (AuthService.getToken as jest.Mock).mockResolvedValue(mockToken);

      const mockHealthData = {
        batteryLevel: 80,
        batteryCharging: false,
        ramUsage: 50,
        networkSpeed: {download: 100, upload: 50},
        hasInternetAccess: true,
        hasSmsPermission: true,
        timestamp: Date.now(),
      };

      ((global as any).fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({success: true}),
      });

      await ApiService.sendHealthData(mockSettings, mockHealthData);

      expect((global as any).fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockToken}`,
          }),
        }),
      );
    });

    it('should use Basic auth when no token is available', async () => {
      (AuthService.getToken as jest.Mock).mockResolvedValue(null);

      const mockHealthData = {
        batteryLevel: 80,
        batteryCharging: false,
        ramUsage: 50,
        networkSpeed: {download: 100, upload: 50},
        hasInternetAccess: true,
        hasSmsPermission: true,
        timestamp: Date.now(),
      };

      ((global as any).fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({success: true}),
      });

      await ApiService.sendHealthData(mockSettings, mockHealthData);

      expect((global as any).fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: expect.stringMatching(/^Basic /),
          }),
        }),
      );
    });
  });

  describe('401 Unauthorized handling', () => {
    it('should reauthenticate and retry on 401', async () => {
      const oldToken = 'old-expired-token';
      const newToken = 'new-fresh-token';

      // First call returns old token, second call returns new token
      (AuthService.getToken as jest.Mock)
        .mockResolvedValueOnce(oldToken)
        .mockResolvedValueOnce(newToken);

      (AuthService.authenticate as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: {token: newToken},
      });

      const mockHealthData = {
        batteryLevel: 80,
        batteryCharging: false,
        ramUsage: 50,
        networkSpeed: {download: 100, upload: 50},
        hasInternetAccess: true,
        hasSmsPermission: true,
        timestamp: Date.now(),
      };

      // First request returns 401, second request succeeds
      ((global as any).fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: async () => ({error: 'Unauthorized'}),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({success: true}),
        });

      const result = await ApiService.sendHealthData(mockSettings, mockHealthData);

      expect(result.success).toBe(true);
      expect(AuthService.authenticate).toHaveBeenCalledWith(mockSettings);
      expect((global as any).fetch).toHaveBeenCalledTimes(2);
    });

    it('should fail if reauthentication fails', async () => {
      (AuthService.getToken as jest.Mock).mockResolvedValue('expired-token');
      (AuthService.authenticate as jest.Mock).mockResolvedValueOnce({
        success: false,
        error: 'Authentication failed',
      });

      const mockHealthData = {
        batteryLevel: 80,
        batteryCharging: false,
        ramUsage: 50,
        networkSpeed: {download: 100, upload: 50},
        hasInternetAccess: true,
        hasSmsPermission: true,
        timestamp: Date.now(),
      };

      ((global as any).fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({error: 'Unauthorized'}),
      });

      const result = await ApiService.sendHealthData(mockSettings, mockHealthData);

      expect(result.success).toBe(false);
      expect(AuthService.authenticate).toHaveBeenCalledWith(mockSettings);
    });
  });
});
