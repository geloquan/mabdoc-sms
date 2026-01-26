import 'react-native-get-random-values';
import Aes from 'react-native-aes-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/constants';
import uuid from 'react-native-uuid';

class EncryptionUtil {
  private encryptionKey: string | null = null;

  async getEncryptionKey(): Promise<string> {
    if (this.encryptionKey) return this.encryptionKey;

    let key = await AsyncStorage.getItem(STORAGE_KEYS.ENCRYPTION_KEY);

    if (!key) {
      key =
        uuid.v4().toString().replace(/-/g, '') +
        uuid.v4().toString().replace(/-/g, '');
      await AsyncStorage.setItem(STORAGE_KEYS.ENCRYPTION_KEY, key);
    }

    this.encryptionKey = key;
    return key;
  }

  private async getKeyAndIv() {
    const key = await this.getEncryptionKey();

    const derivedKey = await Aes.sha256(key);

    // 16-byte IV
    const iv = (await Aes.randomKey(16)).toString();

    return { derivedKey, iv };
  }

  /**
   * Encrypt data using AES-256-CBC
   */
  async encrypt(data: any): Promise<string> {
    try {
      const { derivedKey, iv } = await this.getKeyAndIv();
      const plaintext = JSON.stringify(data);

      const cipher = await Aes.encrypt(
        plaintext,
        derivedKey,
        iv,
        'aes-256-cbc'
      );

      return `${iv}:${cipher}`;
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypt data using AES-256-CBC
   */
  async decrypt(encryptedData: string): Promise<any> {
    try {
      const key = await this.getEncryptionKey();
      const derivedKey = await Aes.sha256(key);

      const [iv, cipher] = encryptedData.split(':');

      if (!iv || !cipher) {
        throw new Error('Invalid encrypted payload');
      }

      const decrypted = await Aes.decrypt(
        cipher,
        derivedKey,
        iv,
        'aes-256-cbc'
      );

      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Decryption failed');
    }
  }
}

export default new EncryptionUtil();
