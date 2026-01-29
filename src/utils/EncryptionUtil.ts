import CryptoJS from 'crypto-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/constants';

class EncryptionUtil {
  private encryptionKey: string | null = null;

  async getEncryptionKey(): Promise<string> {
    if (this.encryptionKey) return this.encryptionKey;

    let key = await AsyncStorage.getItem(STORAGE_KEYS.ENCRYPTION_KEY);

    if (!key) {
      // Generate a cryptographically secure 256-bit (32-byte) key
      key = CryptoJS.lib.WordArray.random(32).toString(CryptoJS.enc.Hex);
      await AsyncStorage.setItem(STORAGE_KEYS.ENCRYPTION_KEY, key);
    }

    this.encryptionKey = key;
    return key;
  }

  /**
   * Encrypt data using AES-256-CBC
   */
  async encrypt(data: any): Promise<string> {
    console.log('=== Encrypting data ===');

    try {
      const key = await this.getEncryptionKey();

      console.log('Encryption key retrieved:', key);

      const plaintext = JSON.stringify(data);

      console.log('Encrypting plaintext:', plaintext);

      const iv = CryptoJS.lib.WordArray.random(16);

      console.log('Generated IV for encryption:', iv.toString(CryptoJS.enc.Hex));

      const keyWordArray = CryptoJS.enc.Hex.parse(key);

      console.log('Encrypting data with key:', key);

      const encrypted = CryptoJS.AES.encrypt(plaintext, keyWordArray, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });

      const ivHex = iv.toString(CryptoJS.enc.Hex);
      const ciphertext = encrypted.ciphertext.toString(CryptoJS.enc.Hex);

      return `${ivHex}:${ciphertext}`;
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

      const [ivHex, ciphertext] = encryptedData.split(':');

      if (!ivHex || !ciphertext) {
        throw new Error('Invalid encrypted payload');
      }

      // Convert hex strings to WordArrays
      const iv = CryptoJS.enc.Hex.parse(ivHex);
      const keyWordArray = CryptoJS.enc.Hex.parse(key);
      const ciphertextWordArray = CryptoJS.enc.Hex.parse(ciphertext);

      // Create cipher params object
      const cipherParams = CryptoJS.lib.CipherParams.create({
        ciphertext: ciphertextWordArray,
      });

      // Decrypt using AES-256-CBC
      const decrypted = CryptoJS.AES.decrypt(cipherParams, keyWordArray, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });

      // Convert to UTF-8 string
      const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);

      if (!decryptedText) {
        throw new Error('Decryption failed - invalid key or corrupted data');
      }

      return JSON.parse(decryptedText);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Decryption failed');
    }
  }
}

export default new EncryptionUtil();
