import BackgroundTaskService from '../src/services/BackgroundTaskService';
import SettingsService from '../src/services/SettingsService';
import ApiService from '../src/services/ApiService';
import SystemMonitorService from '../src/services/SystemMonitorService';

jest.mock('../src/services/SettingsService');
jest.mock('../src/services/ApiService');
jest.mock('../src/services/SystemMonitorService');
jest.mock('../src/utils/CommandExecutor', () => ({
  executeCommand: jest.fn(),
}));
jest.mock('react-native-sms', () => ({
  send: jest.fn(),
  default: {
    send: jest.fn(),
  },
}));
jest.mock('../src/services/LogStorageService', () => ({
  addLog: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../src/services/QueueStorageService', () => ({
  addToQueue: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../src/services/AuthService', () => ({
  getToken: jest.fn(),
  authenticate: jest.fn(),
  clearToken: jest.fn(),
}));

describe('BackgroundTaskService - Cooldown-based Intervals', () => {
  const mockSettings = {
    apiUrl: 'https://api.example.com',
    username: 'testuser',
    password: 'testpass',
    smsInterval: 1, // 1 second for faster testing
    healthInterval: 2,
    commandInterval: 1,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (SettingsService.getSettings as jest.Mock).mockResolvedValue(mockSettings);
    (SystemMonitorService.getSystemHealth as jest.Mock).mockResolvedValue({
      batteryLevel: 80,
      batteryCharging: false,
      ramUsage: 50,
      networkSpeed: {download: 100, upload: 50},
      hasInternetAccess: true,
      hasSmsPermission: true,
      timestamp: Date.now(),
    });
  });

  afterEach(async () => {
    await BackgroundTaskService.stop();
  });

  describe('Cooldown behavior', () => {
    it('should not queue multiple requests when request is in progress', async () => {
      let resolveSmsRequest: (() => void) | null = null;
      const smsRequestPromise = () => new Promise<{success: boolean}>((resolve) => {
        resolveSmsRequest = () => resolve({success: true});
      });

      (ApiService.fetchSmsData as jest.Mock).mockImplementation(smsRequestPromise);
      (ApiService.sendHealthData as jest.Mock).mockResolvedValue({success: true});
      (ApiService.fetchCommands as jest.Mock).mockResolvedValue({success: true, data: null});

      await BackgroundTaskService.start();

      // Wait for initial call
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(ApiService.fetchSmsData).toHaveBeenCalledTimes(1);

      // Wait for interval to potentially trigger while request is still in progress
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Should still be only 1 call since the first one hasn't completed
      expect(ApiService.fetchSmsData).toHaveBeenCalledTimes(1);

      // Complete the first request
      if (resolveSmsRequest) resolveSmsRequest();

      // Wait for next interval to trigger
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Now should have 2 calls
      expect(ApiService.fetchSmsData).toHaveBeenCalledTimes(2);
    }, 10000);
  });

  describe('Stop functionality', () => {
    it('should stop making requests after stop is called', async () => {
      (ApiService.fetchSmsData as jest.Mock).mockResolvedValue({success: true});
      (ApiService.sendHealthData as jest.Mock).mockResolvedValue({success: true});
      (ApiService.fetchCommands as jest.Mock).mockResolvedValue({success: true, data: null});
      
      await BackgroundTaskService.start();

      // Wait for initial calls
      await new Promise(resolve => setTimeout(resolve, 100));
      const smsCountBeforeStop = (ApiService.fetchSmsData as jest.Mock).mock.calls.length;

      await BackgroundTaskService.stop();

      // Wait to see if any more calls are made
      await new Promise(resolve => setTimeout(resolve, 2000));

      const smsCountAfterStop = (ApiService.fetchSmsData as jest.Mock).mock.calls.length;
      
      // Should not have made any new calls after stop
      expect(smsCountAfterStop).toBe(smsCountBeforeStop);
    }, 10000);
  });
});
