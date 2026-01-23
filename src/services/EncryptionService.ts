import CryptoJS from 'crypto-js';
import DeviceInfo from 'react-native-device-info';

/**
 * Encryption service for secure local storage.
 * Uses AES encryption to make data unreadable by unauthorized parties.
 */
class EncryptionService {
  private encryptionKey: string | null = null;

  /**
   * Initialize the encryption key based on device-specific information.
   * This creates a unique key per device that cannot be easily discovered.
   */
  async initialize(): Promise<void> {
    try {
      const deviceId = await DeviceInfo.getUniqueId();
      const deviceModel = await DeviceInfo.getModel();
      const appVersion = DeviceInfo.getVersion();
      
      // Create a complex key from device-specific data
      // This ensures the key is unique per device and difficult to reverse-engineer
      this.encryptionKey = CryptoJS.SHA256(
        `${deviceId}-${deviceModel}-${appVersion}-mabdoc-sms-secure-key`
      ).toString();
    } catch (error) {
      console.error('Error initializing encryption key:', error);
      // Fallback to a static key if device info is unavailable
      this.encryptionKey = CryptoJS.SHA256('mabdoc-sms-fallback-key').toString();
    }
  }

  /**
   * Encrypt data using AES encryption.
   * @param data - The data to encrypt (will be JSON stringified)
   * @returns Encrypted string
   */
  encrypt(data: any): string {
    if (!this.encryptionKey) {
      throw new Error('Encryption service not initialized');
    }

    try {
      const jsonString = JSON.stringify(data);
      const encrypted = CryptoJS.AES.encrypt(jsonString, this.encryptionKey);
      return encrypted.toString();
    } catch (error) {
      console.error('Error encrypting data:', error);
      throw error;
    }
  }

  /**
   * Decrypt data that was encrypted with the encrypt method.
   * @param encryptedData - The encrypted string
   * @returns Decrypted data (parsed from JSON)
   */
  decrypt(encryptedData: string): any {
    if (!this.encryptionKey) {
      throw new Error('Encryption service not initialized');
    }

    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey);
      const jsonString = decrypted.toString(CryptoJS.enc.Utf8);
      
      if (!jsonString) {
        throw new Error('Decryption failed - invalid key or corrupted data');
      }
      
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Error decrypting data:', error);
      throw error;
    }
  }

  /**
   * Hash data for verification purposes.
   * @param data - The data to hash
   * @returns Hash string
   */
  hash(data: any): string {
    const jsonString = JSON.stringify(data);
    return CryptoJS.SHA256(jsonString).toString();
  }
}

export default new EncryptionService();
