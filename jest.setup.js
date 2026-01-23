/**
 * @format
 */

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
