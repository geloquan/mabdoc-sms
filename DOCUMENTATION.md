# SMS Sender Application

A React Native Android application for automated SMS sending with system monitoring and health reporting capabilities.

## Features

### System Monitoring
- **Battery Monitoring**: Tracks battery level and charging status
- **Memory Usage**: Monitors RAM usage in real-time
- **Network Monitoring**: Checks internet connectivity and estimates network speed
- **Permissions**: Manages SMS and phone state permissions

### API Integration
The application performs periodic API calls to:
1. **GET** `/api/sms/machine` - Fetches SMS data at configurable intervals
2. **POST** `/api/sms/machine/health` - Sends system health data at configurable intervals
3. **GET** `/api/sms/machine/command` - Fetches and executes remote commands at configurable intervals

### Settings Management
- Configurable API endpoint URL
- Basic authentication (username/password)
- Adjustable intervals for each API endpoint:
  - SMS data fetching interval
  - Health data posting interval
  - Command fetching interval
- Import/Export settings as JSON

### Background Operation
- Auto-starts on device boot
- Runs periodic API calls in the background
- Maintains operation even when app is minimized

### Command Execution
The application can receive and execute system-level commands from the API, including:
- Device restart/reboot
- Custom app-wide commands

### Logs and Queue Management (NEW)
The application now includes comprehensive logging and queue management features:

#### Encrypted Logs Storage
- **Automatic Logging**: All API calls (SMS, Health, Command) are automatically logged
- **Secure Storage**: Logs are encrypted using device-specific AES encryption keys
- **Rich Metadata**: Each log entry includes:
  - Request and response data
  - Execution duration
  - Success/failure status
  - Error messages (if any)
  - Timestamps
- **Search and Filter**: Logs can be searched by keyword and filtered by:
  - Type (SMS, Health, Command)
  - Status (Success, Failed)
- **Storage Limit**: Maximum 1,000 log entries (oldest entries are automatically removed)
- **Import/Export**: Logs can be exported and imported in encrypted JSON format

#### Command Queue
- **Queue Management**: All commands from the API are queued before execution
- **Status Tracking**: Each queue item tracks:
  - Pending, Executing, Completed, or Failed status
  - Execution timestamps
  - Error messages
  - Retry counts
- **Secure Storage**: Queue data is encrypted using the same encryption as logs
- **Search and Filter**: Queue items can be searched and filtered by status
- **Storage Limit**: Maximum 500 queue items
- **Import/Export**: Queue can be exported and imported in encrypted JSON format

#### Security Features
- **Device-Specific Encryption**: Encryption keys are generated from device-specific information
- **AES Encryption**: Industry-standard AES encryption for all stored data
- **Unreadable by Foreigners**: Encrypted data cannot be read without the device's encryption key
- **Secure Import/Export**: Exported data remains encrypted and can only be decrypted on the same device

## Installation

### Prerequisites
- Node.js >= 20
- React Native development environment set up
- Android SDK

### Setup

1. Clone the repository
```bash
git clone <repository-url>
cd mabdoc-sms
```

2. Install dependencies
```bash
npm install
```

3. For Android, link the required permissions (already configured in AndroidManifest.xml)

4. Run on Android device/emulator
```bash
npm run android
```

## Required Permissions

The app requires the following Android permissions:
- `INTERNET` - For API communication
- `SEND_SMS` - For SMS functionality
- `READ_SMS` - For SMS management
- `RECEIVE_SMS` - For SMS receiving
- `READ_PHONE_STATE` - For device information
- `ACCESS_NETWORK_STATE` - For network monitoring
- `BATTERY_STATS` - For battery monitoring
- `RECEIVE_BOOT_COMPLETED` - For auto-start on boot

## Configuration

### Settings Screen
Access the settings screen from the dashboard to configure:

1. **API URL**: The base URL for your API server
2. **Username**: Authentication username
3. **Password**: Authentication password
4. **SMS Interval**: Time in seconds between SMS data fetches (default: 60s)
5. **Health Interval**: Time in seconds between health data posts (default: 120s)
6. **Command Interval**: Time in seconds between command fetches (default: 60s)

### Import/Export Settings

You can export your settings as JSON for backup or sharing:

```json
{
  "apiUrl": "https://api.example.com",
  "username": "your-username",
  "password": "your-password",
  "smsInterval": 60,
  "healthInterval": 120,
  "commandInterval": 60
}
```

To import settings, tap the "Import" button and paste the JSON configuration.

## API Endpoints

### 1. GET /api/sms/machine
Fetches SMS-related data from the server.

**Headers:**
- `Authorization: Basic <base64-encoded-credentials>`
- `Content-Type: application/json`

### 2. POST /api/sms/machine/health
Sends system health data to the server.

**Headers:**
- `Authorization: Basic <base64-encoded-credentials>`
- `Content-Type: application/json`

**Request Body:**
```json
{
  "batteryLevel": 85.5,
  "batteryCharging": true,
  "ramUsage": 45.2,
  "networkSpeed": {
    "download": 50,
    "upload": 10
  },
  "hasInternetAccess": true,
  "hasSmsPermission": true,
  "timestamp": 1234567890
}
```

### 3. GET /api/sms/machine/command
Fetches commands to execute on the device.

**Headers:**
- `Authorization: Basic <base64-encoded-credentials>`
- `Content-Type: application/json`

**Response:**
```json
{
  "command": "restart",
  "parameters": {}
}
```

## Architecture

### Directory Structure
```
src/
├── components/      # Reusable UI components
├── screens/         # Screen components
│   ├── DashboardScreen.tsx
│   └── SettingsScreen.tsx
├── services/        # Business logic and API services
│   ├── ApiService.ts
│   ├── BackgroundTaskService.ts
│   ├── SettingsService.ts
│   └── SystemMonitorService.ts
├── utils/           # Utility functions
│   └── CommandExecutor.ts
├── types/           # TypeScript type definitions
│   └── index.ts
└── config/          # Configuration constants
    └── constants.ts
```

### Key Components

1. **SettingsService**: Manages app settings using AsyncStorage
2. **SystemMonitorService**: Monitors device health metrics
3. **ApiService**: Handles all API communications with Basic Auth and automatic logging
4. **BackgroundTaskService**: Manages periodic background tasks and queue execution
5. **CommandExecutor**: Executes remote commands
6. **EncryptionService**: Provides AES encryption for secure data storage
7. **LogsService**: Manages encrypted storage and retrieval of API logs
8. **QueueService**: Manages encrypted command queue with status tracking

## User Interface

### Dashboard Screen
The main screen displays:
- Real-time system health metrics
- Battery level and charging status
- RAM usage
- Network connectivity and speed
- SMS permissions status
- Navigation buttons to Settings, Logs, and Queue screens

### Settings Screen
Configure all application settings:
- API URL and credentials
- Polling intervals for each endpoint
- Import/Export settings as JSON

### Logs Screen (NEW)
View and manage API call logs:
- **View**: See all API calls with detailed information
- **Search**: Search logs by keyword
- **Filter**: Filter by type (SMS, Health, Command) or status (Success, Failed)
- **Statistics**: View total logs, success count, and failure count
- **Export**: Export encrypted logs for backup or analysis
- **Import**: Import previously exported logs
- **Clear**: Remove all logs from storage

### Queue Screen (NEW)
Manage the command queue:
- **View**: See all queued commands with status
- **Search**: Search queue by command name or parameters
- **Filter**: Filter by status (Pending, Executing, Completed, Failed)
- **Statistics**: View queue statistics by status
- **Export**: Export encrypted queue for backup
- **Import**: Import previously exported queue
- **Clear Done**: Remove completed commands
- **Clear All**: Remove all queue items
- **Remove**: Remove individual queue items

## Development

### Linting
```bash
npm run lint
```

### Type Checking
```bash
npx tsc --noEmit
```

### Testing
```bash
npm test
```

## Auto-Start Configuration

The app is configured to automatically start when the device boots using `BootReceiver`. This is implemented in:
- `android/app/src/main/java/com/mabdocsms/BootReceiver.kt`
- Configured in `AndroidManifest.xml`

## Security Considerations

1. **Credentials**: Store API credentials securely. Consider using more secure storage mechanisms for production.
2. **HTTPS**: Always use HTTPS for API communications in production.
3. **Command Execution**: Be cautious with remote command execution. Validate and sanitize all commands.
4. **Permissions**: Request only necessary permissions and explain their usage to users.
5. **Encrypted Storage**: Logs and queue data are encrypted using device-specific AES keys
6. **Data Protection**: Encrypted data cannot be read on other devices or without proper decryption keys
7. **Export Security**: Exported logs and queue remain encrypted and require the same device to decrypt

## Known Limitations

1. **CPU Usage**: Direct CPU usage monitoring is not available in React Native and has been excluded from health reporting.
2. **Network Speed**: Network speed is estimated based on connection type, not actual measured speed.
3. **Command Execution**: Device restart requires special permissions and may not work on all devices without root access.

## Troubleshooting

### App doesn't auto-start on boot
- Check that the `RECEIVE_BOOT_COMPLETED` permission is granted
- Some manufacturers require additional settings to allow apps to auto-start

### Background tasks stop running
- Check device battery optimization settings
- Some devices aggressively kill background processes to save battery

### API calls fail
- Verify the API URL is correct and accessible
- Check that credentials are properly configured
- Ensure the device has internet connectivity

## License

[Your License Here]

## Contributing

[Contribution guidelines here]
