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
  LOGS: '@app_logs',
  QUEUE: '@app_queue',
  ENCRYPTION_KEY: '@app_encryption_key',
};

export const API_ENDPOINTS = {
  SMS: '/api/sms/machine/queue/jobs/claim',
  HEALTH: '/api/sms/machine/health',
  COMMAND: '/api/sms/machine/command',
};
