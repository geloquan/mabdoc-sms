/**
 * @format
 */

import EncryptionUtil from '../src/utils/EncryptionUtil';

describe('EncryptionUtil', () => {
  test('should encrypt and decrypt data correctly', async () => {
    const testData = {
      message: 'Hello, World!',
      number: 42,
      nested: { value: 'test' },
    };

    const encrypted = await EncryptionUtil.encrypt(testData);
    expect(encrypted).toBeTruthy();
    expect(typeof encrypted).toBe('string');

    const decrypted = await EncryptionUtil.decrypt(encrypted);
    expect(decrypted).toEqual(testData);
  });

  test('should generate a consistent encryption key', async () => {
    const key1 = await EncryptionUtil.getEncryptionKey();
    const key2 = await EncryptionUtil.getEncryptionKey();
    expect(key1).toBe(key2);
  });

  test('should handle empty data', async () => {
    const testData = {};
    const encrypted = await EncryptionUtil.encrypt(testData);
    const decrypted = await EncryptionUtil.decrypt(encrypted);
    expect(decrypted).toEqual(testData);
  });

  test('should handle arrays', async () => {
    const testData = [1, 2, 3, 'test', { key: 'value' }];
    const encrypted = await EncryptionUtil.encrypt(testData);
    const decrypted = await EncryptionUtil.decrypt(encrypted);
    expect(decrypted).toEqual(testData);
  });

  test('should fail to decrypt with wrong data', async () => {
    await expect(EncryptionUtil.decrypt('invalid-data')).rejects.toThrow();
  });
});
