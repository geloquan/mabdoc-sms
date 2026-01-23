import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppSettings } from '../types';
import { STORAGE_KEYS, DEFAULT_SETTINGS } from '../config/constants';

class SettingsService {
  async getSettings(): Promise<AppSettings> {
    try {
      const settingsJson = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (settingsJson) {
        return JSON.parse(settingsJson);
      }
      return DEFAULT_SETTINGS;
    } catch (error) {
      console.error('Error getting settings:', error);
      return DEFAULT_SETTINGS;
    }
  }

  async saveSettings(settings: AppSettings): Promise<boolean> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.SETTINGS,
        JSON.stringify(settings),
      );
      return true;
    } catch (error) {
      console.error('Error saving settings:', error);
      return false;
    }
  }

  async importSettings(jsonString: string): Promise<boolean> {
    try {
      const settings = JSON.parse(jsonString);
      
      // Validate that required properties exist
      if (
        typeof settings.apiUrl !== 'string' ||
        typeof settings.username !== 'string' ||
        typeof settings.password !== 'string' ||
        typeof settings.smsInterval !== 'number' ||
        typeof settings.healthInterval !== 'number' ||
        typeof settings.commandInterval !== 'number'
      ) {
        console.error('Invalid settings format');
        return false;
      }
      
      return await this.saveSettings(settings);
    } catch (error) {
      console.error('Error importing settings:', error);
      return false;
    }
  }

  async exportSettings(): Promise<string | null> {
    try {
      const settings = await this.getSettings();
      return JSON.stringify(settings, null, 2);
    } catch (error) {
      console.error('Error exporting settings:', error);
      return null;
    }
  }
}

export default new SettingsService();
