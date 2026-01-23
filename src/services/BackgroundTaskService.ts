import SettingsService from './SettingsService';
import ApiService from './ApiService';
import SystemMonitorService from './SystemMonitorService';
import CommandExecutor from '../utils/CommandExecutor';
import QueueService from './QueueService';
import { QueueItem } from '../types';

class BackgroundTaskService {
  private isRunning = false;
  private smsIntervalId: ReturnType<typeof setInterval> | null = null;
  private healthIntervalId: ReturnType<typeof setInterval> | null = null;
  private commandIntervalId: ReturnType<typeof setInterval> | null = null;

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Background tasks already running');
      return;
    }

    this.isRunning = true;
    const settings = await SettingsService.getSettings();

    // Start SMS data fetching interval
    this.smsIntervalId = setInterval(async () => {
      try {
        const currentSettings = await SettingsService.getSettings();
        const response = await ApiService.fetchSmsData(currentSettings);
        if (response.success) {
          console.log('SMS data fetched successfully:', response.data);
        }
      } catch (error) {
        console.error('Error in SMS interval:', error);
      }
    }, settings.smsInterval * 1000);

    // Start health data posting interval
    this.healthIntervalId = setInterval(async () => {
      try {
        const currentSettings = await SettingsService.getSettings();
        const health = await SystemMonitorService.getSystemHealth();
        const response = await ApiService.sendHealthData(currentSettings, health);
        if (response.success) {
          console.log('Health data sent successfully');
        }
      } catch (error) {
        console.error('Error in health interval:', error);
      }
    }, settings.healthInterval * 1000);

    // Start command fetching interval
    this.commandIntervalId = setInterval(async () => {
      try {
        const currentSettings = await SettingsService.getSettings();
        const response = await ApiService.fetchCommands(currentSettings);
        if (response.success && response.data) {
          // Add command to queue
          const queueItem: QueueItem = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
            command: response.data.command,
            parameters: response.data.parameters,
            timestamp: Date.now(),
            status: 'pending',
            metadata: {},
          };
          
          await QueueService.addToQueue(queueItem);
          
          // Execute the command
          try {
            await QueueService.updateQueueItem(queueItem.id, { status: 'executing' });
            await CommandExecutor.executeCommand(response.data);
            await QueueService.updateQueueItem(queueItem.id, {
              status: 'completed',
              executedAt: Date.now(),
            });
          } catch (error) {
            await QueueService.updateQueueItem(queueItem.id, {
              status: 'failed',
              error: error instanceof Error ? error.message : 'Unknown error',
              executedAt: Date.now(),
            });
          }
        }
      } catch (error) {
        console.error('Error in command interval:', error);
      }
    }, settings.commandInterval * 1000);

    console.log('Background tasks started');
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      console.log('Background tasks not running');
      return;
    }

    if (this.smsIntervalId) {
      clearInterval(this.smsIntervalId);
      this.smsIntervalId = null;
    }

    if (this.healthIntervalId) {
      clearInterval(this.healthIntervalId);
      this.healthIntervalId = null;
    }

    if (this.commandIntervalId) {
      clearInterval(this.commandIntervalId);
      this.commandIntervalId = null;
    }

    this.isRunning = false;
    console.log('Background tasks stopped');
  }

  async restart(): Promise<void> {
    await this.stop();
    await this.start();
  }
}

export default new BackgroundTaskService();
