import CryptoJS from 'crypto-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/constants';

class EncryptionUtil {
  private encryptionKey: string | null = null;

  /**
   * Initialize or retrieve the encryption key
   * The key is generated once and stored securely
   * 
   * NOTE: For production use, consider using react-native-get-random-values
   * or a cryptographically secure random number generator
   */
  async getEncryptionKey(): Promise<string> {
    if (this.encryptionKey) {
      return this.encryptionKey;
    }

    try {
      // Try to retrieve existing key
      let key = await AsyncStorage.getItem(STORAGE_KEYS.ENCRYPTION_KEY);

      if (!key) {
        // Generate a new key if none exists
        // NOTE: CryptoJS.lib.WordArray.random() uses Math.random() internally
        // For production, use a cryptographically secure random source
        key = CryptoJS.lib.WordArray.random(256 / 8).toString();
        await AsyncStorage.setItem(STORAGE_KEYS.ENCRYPTION_KEY, key);
      }

      this.encryptionKey = key;
      return key;
    } catch (error) {
      console.error('Error getting encryption key:', error);
      // Fallback to a session-only key if AsyncStorage fails
      if (!this.encryptionKey) {
        this.encryptionKey = CryptoJS.lib.WordArray.random(256 / 8).toString();
      }
      return this.encryptionKey;
    }
  }

  /**
   * Encrypt data using AES encryption
   */
  async encrypt(data: any): Promise<string> {
    try {
      const key = await this.getEncryptionKey();
      const jsonString = JSON.stringify(data);
      const encrypted = CryptoJS.AES.encrypt(jsonString, key).toString();
      return encrypted;
    } catch (error) {
      console.error('Error encrypting data:', error);
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypt data using AES decryption
   */
  async decrypt(encryptedData: string): Promise<any> {
    try {
      const key = await this.getEncryptionKey();
      const decrypted = CryptoJS.AES.decrypt(encryptedData, key);
      const jsonString = decrypted.toString(CryptoJS.enc.Utf8);

      if (!jsonString) {
        throw new Error('Decryption failed - invalid key or corrupted data');
      }

      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Error decrypting data:', error);
      throw new Error('Decryption failed');
    }
  }
}

export default new EncryptionUtil();
