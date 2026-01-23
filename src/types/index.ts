export interface AppSettings {
  apiUrl: string;
  username: string;
  password: string;
  smsInterval: number; // in seconds
  healthInterval: number; // in seconds
  commandInterval: number; // in seconds
}

export interface SystemHealth {
  batteryLevel: number;
  batteryCharging: boolean;
  ramUsage: number;
  networkSpeed: {
    download: number;
    upload: number;
  };
  hasInternetAccess: boolean;
  hasSmsPermission: boolean;
  timestamp: number;
}

export interface CommandResponse {
  command: string;
  parameters?: Record<string, any>;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export enum LogType {
  SMS = 'sms',
  HEALTH = 'health',
  COMMAND = 'command',
}

export interface LogEntry {
  id: string;
  type: LogType;
  timestamp: number;
  endpoint: string;
  method: 'GET' | 'POST';
  request?: any;
  response?: any;
  success: boolean;
  error?: string;
  metadata?: {
    duration?: number;
    statusCode?: number;
    [key: string]: any;
  };
}

export interface QueueItem {
  id: string;
  command: string;
  parameters?: Record<string, any>;
  timestamp: number;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  result?: any;
  error?: string;
  executedAt?: number;
  metadata?: {
    retryCount?: number;
    [key: string]: any;
  };
}
