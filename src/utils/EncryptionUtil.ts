import 'react-native-get-random-values';

import CryptoJS from 'crypto-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/constants';
import uuid from "react-native-uuid";

class EncryptionUtil {
  private encryptionKey: string | null = null;

  async getEncryptionKey(): Promise<string> {
    if (this.encryptionKey) {
      return this.encryptionKey;
    }

    try {
      let key = await AsyncStorage.getItem(STORAGE_KEYS.ENCRYPTION_KEY);

      if (!key) {
        key = uuid.v4().replace(/-/g, '') + uuid.v4().replace(/-/g, '');
        await AsyncStorage.setItem(STORAGE_KEYS.ENCRYPTION_KEY, key);
      }

      this.encryptionKey = key;
      return key;
    } catch (error) {
      console.error('Error getting encryption key:', error);
      if (!this.encryptionKey) {
        this.encryptionKey = uuid.v4().replace(/-/g, '') + uuid.v4().replace(/-/g, '');
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
