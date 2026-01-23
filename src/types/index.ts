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
