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

export interface LogEntry {
  id: string;
  endpoint: string;
  timestamp: number;
  type: 'sms' | 'health';
  request?: {
    method: string;
    headers: Record<string, string>;
    body?: any;
  };
  response?: {
    status: number;
    data: any;
    error?: string;
  };
  metadata: {
    duration?: number;
    networkType?: string;
    batteryLevel?: number;
    [key: string]: any;
  };
}

export interface QueueEntry {
  id: string;
  command: string;
  parameters?: Record<string, any>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  timestamp: number;
  executedAt?: number;
  result?: any;
  error?: string;
  metadata: {
    retryCount?: number;
    priority?: number;
    [key: string]: any;
  };
}
