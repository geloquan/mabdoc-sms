import AsyncStorage from '@react-native-async-storage/async-storage';
import { SmsFetchingState, SmsResponse, AppSettings } from '../types';
import { STORAGE_KEYS } from '../config/constants';
import SmsResponseStorageService from './SmsResponseStorageService';
import ApiService from './ApiService';
import SystemMonitorService from './SystemMonitorService';
import { v4 as uuidv4 } from 'uuid';
import { ClaimQueueJobResource, SmsPayload } from '../types/api-resource';

class SmsFetchingService {
  private state: SmsFetchingState = {
    isPaused: false,
    totalFetched: 0,
    totalSuccess: 0,
    totalFailed: 0,
  };

  /**
   * Initialize the service by loading state from storage
   */
  async initialize(): Promise<void> {
    console.log('📱 Initializing SMS Fetching Service...');
    const savedState = await this.loadState();
    if (savedState) {
      this.state = savedState;
      console.log('📱 Loaded state:', this.state);
    }
  }

  /**
   * Get current fetching state
   */
  getState(): SmsFetchingState {
    return { ...this.state };
  }

  /**
   * Check if fetching is paused
   */
  isPaused(): boolean {
    return this.state.isPaused;
  }

  /**
   * Pause SMS fetching
   */
  async pause(): Promise<void> {
    console.log('⏸️ Pausing SMS fetching...');
    this.state.isPaused = true;
    this.state.lastPauseTimestamp = Date.now();
    await this.saveState();
    console.log('⏸️ SMS fetching paused');
  }

  /**
   * Resume SMS fetching (requires authentication check externally)
   */
  async resume(): Promise<void> {
    console.log('▶️ Resuming SMS fetching...');
    this.state.isPaused = false;
    await this.saveState();
    console.log('▶️ SMS fetching resumed');
  }

  /**
   * Fetch SMS data from API and process it
   * This is the centralized method that should be called by background service
   */
  async fetchAndProcessSms(settings: AppSettings): Promise<SmsResponse> {
    const startTime = Date.now();
    const responseId = uuidv4();

    console.log('📱 ===== FETCH AND PROCESS SMS START =====');
    console.log('📱 Response ID:', responseId);

    // Check if paused
    if (this.state.isPaused) {
      console.log('⏸️ SMS fetching is paused, skipping...');
      const response: SmsResponse = {
        id: responseId,
        timestamp: startTime,
        status: 'no_job',
        error: 'SMS fetching is paused',
        metadata: {
          duration: Date.now() - startTime,
        },
      };
      // Return early without saving when paused
      return response;
    }

    try {
      // Get system health for metadata
      const health = await SystemMonitorService.getSystemHealth();

      // Fetch SMS data from API
      const apiResponse = await ApiService.fetchSmsData(settings);

      const duration = Date.now() - startTime;

      // Process the response
      if (!apiResponse.success) {
        console.error('❌ API call failed:', apiResponse.error);
        
        const response: SmsResponse = {
          id: responseId,
          timestamp: startTime,
          status: 'failed',
          error: apiResponse.error,
          metadata: {
            duration,
            batteryLevel: health.batteryLevel,
            networkType: health.hasInternetAccess ? 'connected' : 'disconnected',
          },
        };

        // Update state
        this.state.totalFetched++;
        this.state.totalFailed++;
        this.state.lastFetchTimestamp = startTime;
        await this.saveState();

        // Save response
        await SmsResponseStorageService.addResponse(response);

        console.log('📱 ===== FETCH AND PROCESS SMS END (FAILED) =====');
        return response;
      }

      // Check if there was a job
      if (!apiResponse.data) {
        console.log('ℹ️ No job available');
        
        const response: SmsResponse = {
          id: responseId,
          timestamp: startTime,
          status: 'no_job',
          metadata: {
            duration,
            batteryLevel: health.batteryLevel,
            networkType: health.hasInternetAccess ? 'connected' : 'disconnected',
          },
        };

        // Update state (don't count no_job as failed)
        this.state.lastFetchTimestamp = startTime;
        await this.saveState();

        // Save response
        await SmsResponseStorageService.addResponse(response);

        console.log('📱 ===== FETCH AND PROCESS SMS END (NO JOB) =====');
        return response;
      }

      // We have a job
      const job = apiResponse.data as ClaimQueueJobResource;
      const payload = job.payload as SmsPayload;

      console.log('✅ Job processed successfully');
      console.log('📱 Job ID:', job.id);
      console.log('📱 Phone:', payload.phone_number);

      const response: SmsResponse = {
        id: responseId,
        timestamp: startTime,
        jobId: job.id,
        phoneNumber: payload.phone_number,
        message: payload.message,
        status: 'success',
        metadata: {
          duration,
          attempts: job.attempts,
          priority: job.priority,
          batteryLevel: health.batteryLevel,
          networkType: health.hasInternetAccess ? 'connected' : 'disconnected',
        },
      };

      // Update state
      this.state.totalFetched++;
      this.state.totalSuccess++;
      this.state.lastFetchTimestamp = startTime;
      await this.saveState();

      // Save response
      await SmsResponseStorageService.addResponse(response);

      console.log('📱 ===== FETCH AND PROCESS SMS END (SUCCESS) =====');
      return response;

    } catch (error) {
      console.error('❌ Error in fetchAndProcessSms:', error);
      
      const response: SmsResponse = {
        id: responseId,
        timestamp: startTime,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          duration: Date.now() - startTime,
        },
      };

      // Update state
      this.state.totalFetched++;
      this.state.totalFailed++;
      this.state.lastFetchTimestamp = startTime;
      await this.saveState();

      // Save response
      await SmsResponseStorageService.addResponse(response);

      console.log('📱 ===== FETCH AND PROCESS SMS END (ERROR) =====');
      return response;
    }
  }

  /**
   * Reset statistics
   */
  async resetStats(): Promise<void> {
    console.log('🔄 Resetting SMS fetching statistics...');
    this.state.totalFetched = 0;
    this.state.totalSuccess = 0;
    this.state.totalFailed = 0;
    this.state.lastFetchTimestamp = undefined;
    await this.saveState();
    console.log('🔄 Statistics reset');
  }

  /**
   * Save state to storage
   */
  private async saveState(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.SMS_FETCHING_STATE,
        JSON.stringify(this.state)
      );
    } catch (error) {
      console.error('Error saving SMS fetching state:', error);
    }
  }

  /**
   * Load state from storage
   */
  private async loadState(): Promise<SmsFetchingState | null> {
    try {
      const stateJson = await AsyncStorage.getItem(STORAGE_KEYS.SMS_FETCHING_STATE);
      if (stateJson) {
        return JSON.parse(stateJson);
      }
      return null;
    } catch (error) {
      console.error('Error loading SMS fetching state:', error);
      return null;
    }
  }
}

export default new SmsFetchingService();
