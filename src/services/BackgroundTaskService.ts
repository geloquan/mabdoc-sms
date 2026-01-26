import SettingsService from './SettingsService';
import ApiService from './ApiService';
import SystemMonitorService from './SystemMonitorService';
import CommandExecutor from '../utils/CommandExecutor';
import SmsFetchingService from './SmsFetchingService';

class BackgroundTaskService {
  private isRunning = false;
  private smsTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private healthTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private commandTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private isSmsRequestInProgress = false;
  private isHealthRequestInProgress = false;
  private isCommandRequestInProgress = false;

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Background tasks already running');
      return;
    }

    await SmsFetchingService.initialize();

    this.isRunning = true;
    const settings = await SettingsService.getSettings();

    const scheduleSmsTask = async () => {
      if (!this.isRunning) return;

      if (this.isSmsRequestInProgress) {
        console.log('SMS request already in progress, skipping this cycle');
        this.smsTimeoutId = setTimeout(scheduleSmsTask, settings.smsInterval * 1000);
        return;
      }

      this.isSmsRequestInProgress = true;
      try {
        const currentSettings = await SettingsService.getSettings();

        const response = await SmsFetchingService.fetchAndProcessSms(currentSettings);

        if (response.status === 'success') {
          console.log('SMS data fetched and processed successfully');
        } else if (response.status === 'no_job') {
          console.log('No SMS job available');
        } else {
          console.error('SMS fetch failed:', response.error);
        }
      } catch (error) {
        console.error('Error in SMS task:', error);
      } finally {
        this.isSmsRequestInProgress = false;
        if (this.isRunning) {
          this.smsTimeoutId = setTimeout(scheduleSmsTask, settings.smsInterval * 1000);
        }
      }
    };

    // Start health data posting with cooldown-based approach
    const scheduleHealthTask = async () => {
      if (!this.isRunning) return;

      // Skip if a request is already in progress
      if (this.isHealthRequestInProgress) {
        console.log('Health request already in progress, skipping this cycle');
        this.healthTimeoutId = setTimeout(scheduleHealthTask, settings.healthInterval * 1000);
        return;
      }

      this.isHealthRequestInProgress = true;
      try {
        const currentSettings = await SettingsService.getSettings();
        const health = await SystemMonitorService.getSystemHealth();
        const response = await ApiService.sendHealthData(currentSettings, health);
        if (response.success) {
          console.log('Health data sent successfully');
        }
      } catch (error) {
        console.error('Error in health task:', error);
      } finally {
        this.isHealthRequestInProgress = false;
        // Schedule next execution after the request completes (cooldown)
        if (this.isRunning) {
          this.healthTimeoutId = setTimeout(scheduleHealthTask, settings.healthInterval * 1000);
        }
      }
    };

    // Start command fetching with cooldown-based approach
    const scheduleCommandTask = async () => {
      if (!this.isRunning) return;

      if (this.isCommandRequestInProgress) {
        console.log('Command request already in progress, skipping this cycle');
        this.commandTimeoutId = setTimeout(scheduleCommandTask, settings.commandInterval * 1000);
        return;
      }

      this.isCommandRequestInProgress = true;
      try {
        const currentSettings = await SettingsService.getSettings();
        const response = await ApiService.fetchCommands(currentSettings);
        if (response.success && response.data) {
          await CommandExecutor.executeCommand(response.data);
        }
      } catch (error) {
        console.error('Error in command task:', error);
      } finally {
        this.isCommandRequestInProgress = false;
        // Schedule next execution after the request completes (cooldown)
        if (this.isRunning) {
          this.commandTimeoutId = setTimeout(scheduleCommandTask, settings.commandInterval * 1000);
        }
      }
    };

    scheduleSmsTask();
    // scheduleHealthTask();
    // scheduleCommandTask();

    console.log('Background tasks started with cooldown-based intervals');
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      console.log('Background tasks not running');
      return;
    }

    if (this.smsTimeoutId) {
      clearTimeout(this.smsTimeoutId);
      this.smsTimeoutId = null;
    }

    if (this.healthTimeoutId) {
      clearTimeout(this.healthTimeoutId);
      this.healthTimeoutId = null;
    }

    if (this.commandTimeoutId) {
      clearTimeout(this.commandTimeoutId);
      this.commandTimeoutId = null;
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
