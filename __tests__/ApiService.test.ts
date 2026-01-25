import ApiService from '../src/services/ApiService';
import AuthService from '../src/services/AuthService';

// Mock AuthService
jest.mock('../src/services/AuthService', () => ({
  getToken: jest.fn(),
  authenticate: jest.fn(),
  clearToken: jest.fn(),
  hasValidToken: jest.fn(),
  checkAuthentication: jest.fn(),
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
      (AuthService.authenticate as jest.Mock).mockResolvedValue({
        success: true,
        token: 'new-token',
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
        ok: true,
        status: 200,
        json: async () => ({success: true}),
      });

      await ApiService.sendHealthData(mockSettings, mockHealthData);

      expect((global as any).fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: expect.stringMatching(/^Bearer /),
          }),
        }),
      );
    });
  });

  describe('Authentication check with /me endpoint', () => {
    it('should verify authentication with /me endpoint when token exists', async () => {
      const mockToken = 'test-bearer-token';
      (AuthService.getToken as jest.Mock).mockResolvedValue(mockToken);
      (AuthService.checkAuthentication as jest.Mock).mockResolvedValue({
        success: true,
        data: { id: 1, username: 'testuser' },
      });

      ((global as any).fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({job: null}),
      });

      const result = await ApiService.fetchSmsData(mockSettings);

      expect(AuthService.getToken).toHaveBeenCalled();
      expect(AuthService.checkAuthentication).toHaveBeenCalledWith(mockSettings);
      expect(result.success).toBe(false); // No job in response
    });

    it('should re-authenticate when /me endpoint check fails', async () => {
      const mockToken = 'expired-token';
      (AuthService.getToken as jest.Mock).mockResolvedValue(mockToken);
      (AuthService.checkAuthentication as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Authentication expired',
      });
      (AuthService.authenticate as jest.Mock).mockResolvedValue({
        success: true,
        token: 'new-token',
      });

      ((global as any).fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({job: null}),
      });

      const result = await ApiService.fetchSmsData(mockSettings);

      expect(AuthService.checkAuthentication).toHaveBeenCalledWith(mockSettings);
      expect(AuthService.authenticate).toHaveBeenCalledWith(mockSettings);
      expect(result.success).toBe(false); // No job in response
    });

    it('should authenticate when no token exists', async () => {
      (AuthService.getToken as jest.Mock).mockResolvedValue(null);
      (AuthService.authenticate as jest.Mock).mockResolvedValue({
        success: true,
        token: 'new-token',
      });

      ((global as any).fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({job: null}),
      });

      const result = await ApiService.fetchSmsData(mockSettings);

      expect(AuthService.checkAuthentication).not.toHaveBeenCalled();
      expect(AuthService.authenticate).toHaveBeenCalledWith(mockSettings);
      expect(result.success).toBe(false); // No job in response
    });
  });
});
