export const DEFAULT_SETTINGS = {
  apiUrl: '',
  username: '',
  password: '',
  smsInterval: 60,
  healthInterval: 120,
  commandInterval: 60,
};

export const STORAGE_KEYS = {
  SETTINGS: '@app_settings',
};

export const API_ENDPOINTS = {
  SMS: '/api/sms/machine',
  HEALTH: '/api/sms/machine/health',
  COMMAND: '/api/sms/machine/command',
};
