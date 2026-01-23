import DeviceInfo from 'react-native-device-info';
import NetInfo from '@react-native-community/netinfo';
import { PermissionsAndroid, Platform } from 'react-native';
import { SystemHealth } from '../types';

class SystemMonitorService {
  async getBatteryLevel(): Promise<number> {
    try {
      return await DeviceInfo.getBatteryLevel();
    } catch (error) {
      console.error('Error getting battery level:', error);
      return 0;
    }
  }

  async isBatteryCharging(): Promise<boolean> {
    try {
      return await DeviceInfo.isBatteryCharging();
    } catch (error) {
      console.error('Error checking battery charging:', error);
      return false;
    }
  }

  async getMemoryInfo(): Promise<{ total: number; used: number; usagePercent: number }> {
    try {
      const totalMemory = await DeviceInfo.getTotalMemory();
      const usedMemory = await DeviceInfo.getUsedMemory();
      const usagePercent = (usedMemory / totalMemory) * 100;
      
      return {
        total: totalMemory,
        used: usedMemory,
        usagePercent,
      };
    } catch (error) {
      console.error('Error getting memory info:', error);
      return { total: 0, used: 0, usagePercent: 0 };
    }
  }

  async checkInternetConnection(): Promise<boolean> {
    try {
      const state = await NetInfo.fetch();
      return state.isConnected ?? false;
    } catch (error) {
      console.error('Error checking internet connection:', error);
      return false;
    }
  }

  async measureNetworkSpeed(): Promise<{ download: number; upload: number }> {
    // Simple network speed estimation based on connection type
    try {
      const state = await NetInfo.fetch();
      const connectionType = state.type;
      
      // Rough estimates based on connection type
      const speedEstimates: Record<string, { download: number; upload: number }> = {
        wifi: { download: 50, upload: 10 },
        cellular: { download: 10, upload: 2 },
        ethernet: { download: 100, upload: 50 },
        none: { download: 0, upload: 0 },
      };

      return speedEstimates[connectionType] || { download: 0, upload: 0 };
    } catch (error) {
      console.error('Error measuring network speed:', error);
      return { download: 0, upload: 0 };
    }
  }

  async checkSmsPermission(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.SEND_SMS,
        );
        return granted;
      } catch (error) {
        console.error('Error checking SMS permission:', error);
        return false;
      }
    }
    return false;
  }

  async requestSmsPermission(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.SEND_SMS,
          {
            title: 'SMS Permission',
            message: 'This app needs access to send SMS messages',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (error) {
        console.error('Error requesting SMS permission:', error);
        return false;
      }
    }
    return false;
  }

  async getSystemHealth(): Promise<SystemHealth> {
    const batteryLevel = await this.getBatteryLevel();
    const batteryCharging = await this.isBatteryCharging();
    const memoryInfo = await this.getMemoryInfo();
    const hasInternetAccess = await this.checkInternetConnection();
    const networkSpeed = await this.measureNetworkSpeed();
    const hasSmsPermission = await this.checkSmsPermission();

    return {
      batteryLevel: batteryLevel * 100,
      batteryCharging,
      cpuUsage: 0, // CPU usage is not directly available in React Native
      ramUsage: memoryInfo.usagePercent,
      networkSpeed,
      hasInternetAccess,
      hasSmsPermission,
      timestamp: Date.now(),
    };
  }
}

export default new SystemMonitorService();
