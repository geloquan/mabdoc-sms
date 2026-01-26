/**
 * @format
 */

/* global jest */

// Mock AsyncStorage with in-memory storage
const mockStorage = new Map();

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn((key, value) => {
    mockStorage.set(key, value);
    return Promise.resolve();
  }),
  getItem: jest.fn((key) => {
    return Promise.resolve(mockStorage.get(key) || null);
  }),
  removeItem: jest.fn((key) => {
    mockStorage.delete(key);
    return Promise.resolve();
  }),
  getAllKeys: jest.fn(() => {
    return Promise.resolve(Array.from(mockStorage.keys()));
  }),
  multiSet: jest.fn((pairs) => {
    pairs.forEach(([key, value]) => mockStorage.set(key, value));
    return Promise.resolve();
  }),
  multiGet: jest.fn((keys) => {
    return Promise.resolve(keys.map(key => [key, mockStorage.get(key) || null]));
  }),
  multiRemove: jest.fn((keys) => {
    keys.forEach(key => mockStorage.delete(key));
    return Promise.resolve();
  }),
  clear: jest.fn(() => {
    mockStorage.clear();
    return Promise.resolve();
  }),
}));

// Mock react-native-device-info
jest.mock('react-native-device-info', () => ({
  getBatteryLevel: jest.fn(() => Promise.resolve(0.85)),
  isBatteryCharging: jest.fn(() => Promise.resolve(true)),
  getTotalMemory: jest.fn(() => Promise.resolve(4000000000)),
  getUsedMemory: jest.fn(() => Promise.resolve(2000000000)),
}));

// Mock @react-native-community/netinfo
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() => Promise.resolve({
    isConnected: true,
    type: 'wifi',
  })),
  addEventListener: jest.fn(() => jest.fn()),
}));

// Mock react-native-permissions
jest.mock('react-native-permissions', () => ({
  PERMISSIONS: {
    ANDROID: {
      SEND_SMS: 'android.permission.SEND_SMS',
    },
  },
  RESULTS: {
    GRANTED: 'granted',
    DENIED: 'denied',
  },
  check: jest.fn(() => Promise.resolve('granted')),
  request: jest.fn(() => Promise.resolve('granted')),
}));

// Mock react-native-background-actions
jest.mock('react-native-background-actions', () => ({
  start: jest.fn(() => Promise.resolve()),
  stop: jest.fn(() => Promise.resolve()),
  isRunning: jest.fn(() => Promise.resolve(false)),
}));

// Mock react-native-get-random-values
jest.mock('react-native-get-random-values', () => {
  // Polyfill crypto.getRandomValues for the test environment
  if (typeof global.crypto === 'undefined') {
    global.crypto = {};
  }
  if (typeof global.crypto.getRandomValues === 'undefined') {
    global.crypto.getRandomValues = function(array) {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
      return array;
    };
  }
  return {};
});

// Mock react-native-aes-crypto
jest.mock('react-native-aes-crypto', () => ({
  __esModule: true,
  default: {
    encrypt: jest.fn((text, key, iv, algorithm) => {
      // Simple mock encryption - just base64 encode the text with a prefix
      const encoded = Buffer.from(text).toString('base64');
      return Promise.resolve(encoded);
    }),
    decrypt: jest.fn((cipher, key, iv, algorithm) => {
      // Simple mock decryption - just base64 decode
      const decoded = Buffer.from(cipher, 'base64').toString('utf8');
      return Promise.resolve(decoded);
    }),
    sha256: jest.fn((text) => {
      // Return a mock 256-bit hash (64 hex characters)
      return Promise.resolve('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef');
    }),
    randomKey: jest.fn((length) => {
      // Generate a random key of the specified length
      let key = '';
      const chars = '0123456789abcdef';
      for (let i = 0; i < length * 2; i++) {
        key += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return Promise.resolve(key);
    }),
  },
}));

// Mock react-native-uuid
jest.mock('react-native-uuid', () => ({
  __esModule: true,
  default: {
    v4: jest.fn(() => {
      // Generate a mock UUID v4
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }),
  },
}));

// Mock react-native-sms
jest.mock('react-native-sms', () => ({
  __esModule: true,
  default: jest.fn((options, callback) => {
    if (callback) {
      callback(true, 'Message sent successfully');
    }
  }),
  AndroidSuccessTypes: {
    all: 'all',
    inbox: 'inbox',
    sent: 'sent',
    draft: 'draft',
    outbox: 'outbox',
    failed: 'failed',
    queued: 'queued',
  },
}));
