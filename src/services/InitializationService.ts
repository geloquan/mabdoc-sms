import { v4 as uuidv4 } from 'uuid';
import LogStorageService from './LogStorageService';
import QueueStorageService from './QueueStorageService';
import SmsResponseStorageService from './SmsResponseStorageService';
import CommandExecutor from '../utils/CommandExecutor';
import { LogEntry, QueueEntry, SmsResponse } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

class InitializationService {
  private readonly DUMMY_DATA_KEY = '@app_dummy_data_initialized';

  /**
   * Initialize the app on startup
   * - Load data from secure storage
   * - Execute pending queue entries
   * - Populate dummy data on first launch
   */
  async initialize(): Promise<void> {
    console.log('🚀 Initializing application...');

    try {
      // Load data from secure storage and execute pending queue entries
      await this.loadAndExecutePendingQueue();

      // Populate dummy data on first launch
      await this.populateDummyDataIfNeeded();

      console.log('✅ Application initialized successfully');
    } catch (error) {
      console.error('❌ Error during initialization:', error);
    }
  }

  /**
   * Load all stored data from secure storage and execute pending queue entries
   */
  private async loadAndExecutePendingQueue(): Promise<void> {
    console.log('📂 Loading stored data...');

    const [logs, queue, smsResponses] = await Promise.all([
      LogStorageService.getLogs(),
      QueueStorageService.getQueue(),
      SmsResponseStorageService.getResponses(),
    ]);

    console.log(`📊 Loaded ${logs.length} logs, ${queue.length} queue entries, ${smsResponses.length} SMS responses`);

    // Execute pending queue entries
    await this.executePendingQueueEntries(queue);
  }

  /**
   * Execute pending queue entries on app start
   */
  private async executePendingQueueEntries(queue: QueueEntry[]): Promise<void> {
    console.log('⚙️ Executing pending queue entries...');

    const pendingEntries = queue.filter(entry => entry.status === 'pending');

    if (pendingEntries.length === 0) {
      console.log('ℹ️ No pending queue entries to execute');
      return;
    }

    console.log(`🔄 Found ${pendingEntries.length} pending entries to execute`);

    // Execute pending entries one by one
    for (const entry of pendingEntries) {
      try {
        await CommandExecutor.executeQueueEntry(entry);
        console.log(`✅ Executed queue entry: ${entry.command}`);
      } catch (error) {
        console.error(`❌ Failed to execute queue entry: ${entry.command}`, error);
      }
    }
  }

  /**
   * Populate dummy data on first launch
   */
  private async populateDummyDataIfNeeded(): Promise<void> {
    try {
      const initialized = await AsyncStorage.getItem(this.DUMMY_DATA_KEY);

      if (initialized === 'true') {
        console.log('ℹ️ Dummy data already initialized');
        return;
      }

      console.log('📝 Populating dummy data...');

      await this.generateDummyLogs();
      await this.generateDummyQueue();
      await this.generateDummySmsResponses();

      await AsyncStorage.setItem(this.DUMMY_DATA_KEY, 'true');
      console.log('✅ Dummy data populated successfully');
    } catch (error) {
      console.error('❌ Error populating dummy data:', error);
    }
  }

  /**
   * Generate dummy log entries
   */
  private async generateDummyLogs(): Promise<void> {
    const dummyLogs: LogEntry[] = [
      // SMS logs
      {
        id: uuidv4(),
        endpoint: '/api/sms/machine/queue/jobs/claim',
        timestamp: Date.now() - 3600000, // 1 hour ago
        type: 'sms',
        request: {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: {},
        },
        response: {
          status: 200,
          data: {
            jobId: 101,
            phoneNumber: '+1234567890',
            message: 'Your verification code is 123456',
          },
        },
        metadata: {
          duration: 245,
          networkType: 'wifi',
          batteryLevel: 85,
        },
      },
      {
        id: uuidv4(),
        endpoint: '/api/sms/machine/queue/jobs/claim',
        timestamp: Date.now() - 7200000, // 2 hours ago
        type: 'sms',
        request: {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: {},
        },
        response: {
          status: 200,
          data: {
            jobId: 102,
            phoneNumber: '+9876543210',
            message: 'Hello, this is a test message from the system.',
          },
        },
        metadata: {
          duration: 312,
          networkType: 'cellular',
          batteryLevel: 78,
        },
      },
      {
        id: uuidv4(),
        endpoint: '/api/sms/machine/queue/jobs/claim',
        timestamp: Date.now() - 10800000, // 3 hours ago
        type: 'sms',
        request: {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: {},
        },
        response: {
          status: 404,
          data: null,
          error: 'No SMS jobs available in queue',
        },
        metadata: {
          duration: 156,
          networkType: 'wifi',
          batteryLevel: 72,
        },
      },
      // Health logs
      {
        id: uuidv4(),
        endpoint: '/api/sms/machine/health',
        timestamp: Date.now() - 1800000, // 30 minutes ago
        type: 'health',
        request: {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: {
            batteryLevel: 85,
            batteryCharging: false,
            ramUsage: 45.5,
            hasInternetAccess: true,
            hasSmsPermission: true,
          },
        },
        response: {
          status: 200,
          data: { success: true },
        },
        metadata: {
          duration: 189,
          networkType: 'wifi',
          batteryLevel: 85,
        },
      },
      {
        id: uuidv4(),
        endpoint: '/api/sms/machine/health',
        timestamp: Date.now() - 3900000, // 65 minutes ago
        type: 'health',
        request: {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: {
            batteryLevel: 78,
            batteryCharging: true,
            ramUsage: 52.3,
            hasInternetAccess: true,
            hasSmsPermission: true,
          },
        },
        response: {
          status: 200,
          data: { success: true },
        },
        metadata: {
          duration: 203,
          networkType: 'wifi',
          batteryLevel: 78,
        },
      },
    ];

    for (const log of dummyLogs) {
      await LogStorageService.addLog(log);
    }

    console.log(`📊 Generated ${dummyLogs.length} dummy log entries`);
  }

  /**
   * Generate dummy queue entries
   */
  private async generateDummyQueue(): Promise<void> {
    const dummyQueue: QueueEntry[] = [
      // Pending entry
      {
        id: uuidv4(),
        command: 'restart',
        parameters: { reason: 'scheduled_maintenance' },
        status: 'pending',
        timestamp: Date.now() - 600000, // 10 minutes ago
        metadata: {
          priority: 1,
          retryCount: 0,
        },
      },
      // Completed entry
      {
        id: uuidv4(),
        command: 'update_settings',
        parameters: { smsInterval: 60 },
        status: 'completed',
        timestamp: Date.now() - 3600000, // 1 hour ago
        executedAt: Date.now() - 3540000, // 59 minutes ago
        result: { success: true },
        metadata: {
          priority: 2,
          retryCount: 0,
        },
      },
      // Failed entry
      {
        id: uuidv4(),
        command: 'send_notification',
        parameters: { message: 'System update available' },
        status: 'failed',
        timestamp: Date.now() - 7200000, // 2 hours ago
        executedAt: Date.now() - 7140000, // 1 hour 59 minutes ago
        error: 'Network timeout - unable to reach notification service',
        metadata: {
          priority: 3,
          retryCount: 2,
        },
      },
      // Processing entry
      {
        id: uuidv4(),
        command: 'sync_data',
        parameters: { dataType: 'logs' },
        status: 'processing',
        timestamp: Date.now() - 300000, // 5 minutes ago
        metadata: {
          priority: 2,
          retryCount: 0,
        },
      },
      // Another pending entry
      {
        id: uuidv4(),
        command: 'cleanup_old_data',
        parameters: { daysToKeep: 30 },
        status: 'pending',
        timestamp: Date.now() - 1800000, // 30 minutes ago
        metadata: {
          priority: 3,
          retryCount: 0,
        },
      },
    ];

    for (const entry of dummyQueue) {
      await QueueStorageService.addToQueue(entry);
    }

    console.log(`📋 Generated ${dummyQueue.length} dummy queue entries`);
  }

  /**
   * Generate dummy SMS response entries
   */
  private async generateDummySmsResponses(): Promise<void> {
    const dummySmsResponses: SmsResponse[] = [
      // Success response
      {
        id: uuidv4(),
        timestamp: Date.now() - 3600000, // 1 hour ago
        jobId: 101,
        phoneNumber: '+1234567890',
        message: 'Your verification code is 123456',
        status: 'success',
        metadata: {
          duration: 1250,
          attempts: 1,
          priority: 1,
          batteryLevel: 85,
          networkType: 'wifi',
        },
      },
      // Another success response
      {
        id: uuidv4(),
        timestamp: Date.now() - 7200000, // 2 hours ago
        jobId: 102,
        phoneNumber: '+9876543210',
        message: 'Hello, this is a test message from the system.',
        status: 'success',
        metadata: {
          duration: 980,
          attempts: 1,
          priority: 2,
          batteryLevel: 78,
          networkType: 'cellular',
        },
      },
      // Failed response
      {
        id: uuidv4(),
        timestamp: Date.now() - 10800000, // 3 hours ago
        jobId: 103,
        phoneNumber: '+1122334455',
        message: 'Your order has been shipped. Track at: example.com/track',
        status: 'failed',
        error: 'SMS permission denied',
        metadata: {
          duration: 0,
          attempts: 3,
          priority: 1,
          batteryLevel: 72,
          networkType: 'wifi',
        },
      },
      // No job response
      {
        id: uuidv4(),
        timestamp: Date.now() - 1800000, // 30 minutes ago
        status: 'no_job',
        metadata: {
          duration: 156,
          attempts: 1,
          batteryLevel: 85,
          networkType: 'wifi',
        },
      },
      // Success with different phone number
      {
        id: uuidv4(),
        timestamp: Date.now() - 5400000, // 1.5 hours ago
        jobId: 104,
        phoneNumber: '+5566778899',
        message: 'Reminder: Your appointment is tomorrow at 2 PM.',
        status: 'success',
        metadata: {
          duration: 1100,
          attempts: 1,
          priority: 1,
          batteryLevel: 80,
          networkType: 'cellular',
        },
      },
      // Another failed response
      {
        id: uuidv4(),
        timestamp: Date.now() - 14400000, // 4 hours ago
        jobId: 105,
        phoneNumber: '+4455667788',
        message: 'Your payment has been received. Thank you!',
        status: 'failed',
        error: 'Network error - no connectivity',
        metadata: {
          duration: 5000,
          attempts: 2,
          priority: 2,
          batteryLevel: 68,
          networkType: 'none',
        },
      },
    ];

    for (const response of dummySmsResponses) {
      await SmsResponseStorageService.addResponse(response);
    }

    console.log(`📱 Generated ${dummySmsResponses.length} dummy SMS response entries`);
  }

  /**
   * Reset dummy data (for testing purposes)
   */
  async resetDummyData(): Promise<void> {
    await AsyncStorage.removeItem(this.DUMMY_DATA_KEY);
    await LogStorageService.clearAllLogs();
    await QueueStorageService.clearAllQueue();
    await SmsResponseStorageService.clearAllResponses();
    console.log('🔄 Dummy data reset complete');
  }
}

export default new InitializationService();
