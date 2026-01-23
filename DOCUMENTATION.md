# SMS Sender Application

A React Native Android application for automated SMS sending with system monitoring, health reporting, and secure data logging capabilities.

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

### Secure Data Logging
- **Encrypted Storage**: All logs and queue data are encrypted using AES-256 encryption
- **API Logs**: Automatically logs all API calls with rich metadata
  - Request/response details
  - Timestamps and duration
  - Success/error status
  - Battery level and network type at time of request
- **Command Queue**: Stores and manages remote commands in a queue
  - Laravel v11-style queue implementation
  - Status tracking (pending, processing, completed, failed)
  - Retry failed commands
  - Rich metadata support
- **Search & Filter**: Powerful search and filtering capabilities
  - Filter by type (SMS/Health logs)
  - Filter by status (pending, completed, failed)
  - Text search across all fields
  - Date range filtering
- **Import/Export**: Export logs and queue data as JSON for backup or analysis
- **Privacy**: Data is encrypted and unreadable without the app's encryption key

### Background Operation
- Auto-starts on device boot
- Runs periodic API calls in the background
- Maintains operation even when app is minimized

### Command Execution
The application can receive and execute system-level commands from the API, including:
- Device restart/reboot
- Custom app-wide commands

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

### Basic Permissions
- `INTERNET` - For API communication
- `ACCESS_NETWORK_STATE` - For network monitoring

### SMS Permissions (Runtime)
- `SEND_SMS` - For SMS functionality
- `READ_SMS` - For SMS management
- `RECEIVE_SMS` - For SMS receiving
- `READ_PHONE_STATE` - For device information

### 24/7 Operation Permissions (Critical)
- `BATTERY_STATS` - For battery monitoring
- `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS` - Exempts app from battery optimization (requested at startup)
- `WAKE_LOCK` - Prevents device from sleeping during critical operations
- `FOREGROUND_SERVICE` - Enables continuous background operation
- `SCHEDULE_EXACT_ALARM` - Ensures precise timing for periodic tasks (Android 12+)
- `USE_EXACT_ALARM` - Alternative exact alarm permission (Android 12+)

### Auto-Start Permissions
- `RECEIVE_BOOT_COMPLETED` - For auto-start on device boot
- `LOCKED_BOOT_COMPLETED` - For auto-start in direct boot mode (Android 7+)

**Important**: The app automatically requests battery optimization exemption on first launch to ensure uninterrupted 24/7 operation. Users should approve this request for optimal performance.

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

## Data Storage and Security

### Encryption
All logs and queue data are encrypted using AES-256 encryption before being stored locally. The encryption key is automatically generated and stored securely on first use.

### Log Entry Format
```json
{
  "id": "1234567890-abc123",
  "endpoint": "/api/sms/machine",
  "timestamp": 1234567890000,
  "type": "sms",
  "request": {
    "method": "GET",
    "headers": {...},
    "body": {...}
  },
  "response": {
    "status": 200,
    "data": {...},
    "error": null
  },
  "metadata": {
    "duration": 150,
    "batteryLevel": 85.5,
    "networkType": "wifi"
  }
}
```

### Queue Entry Format
```json
{
  "id": "1234567890-xyz789",
  "command": "restart",
  "parameters": {...},
  "status": "pending",
  "timestamp": 1234567890000,
  "executedAt": null,
  "result": null,
  "error": null,
  "metadata": {
    "retryCount": 0,
    "priority": 1
  }
}
```

### Storage Limits
- **Logs**: Maximum 1000 entries (oldest entries are automatically removed)
- **Queue**: Maximum 500 entries

## User Interface

### Dashboard Screen
- **Modern Design**: Updated with improved visual hierarchy and iconography
- **Configuration Panel**: Collapsible panel (collapsed by default) showing:
  - Device information (ID, model, system version, app version)
  - API configuration (URL, username, masked password)
  - Polling intervals (SMS, Health, Command)
  - JSON configuration view for developers
  - Deployment context for multi-device setups
- **System Health Monitoring**: Real-time display of:
  - Battery level and charging status
  - RAM usage
  - Network connectivity and speed
  - SMS permissions
- **Quick Navigation**: Icon-based buttons to:
  - Settings
  - Logs viewer
  - Command queue viewer

### Settings Screen
- API configuration
- Authentication settings
- Polling intervals
- Import/Export settings

### Logs Viewer Screen
- View all API logs
- Filter by type (SMS/Health)
- Search functionality
- Expandable log details
- Export/Import logs
- Statistics display:
  - Total logs
  - Success count
  - Error count

### Queue Viewer Screen
- View command queue
- Filter by status (pending, processing, completed, failed)
- Search functionality
- Expandable queue entry details
- Retry failed commands
- Clear completed entries
- Export/Import queue
- Statistics display:
  - Total entries
  - Pending count
  - Completed count
  - Failed count

## Architecture

### Directory Structure
```
src/
├── components/      # Reusable UI components
│   └── ConfigurationPanel.tsx  # NEW: Collapsible configuration display
├── screens/         # Screen components
│   ├── DashboardScreen.tsx
│   ├── SettingsScreen.tsx
│   ├── LogViewerScreen.tsx
│   └── QueueViewerScreen.tsx
├── services/        # Business logic and API services
│   ├── ApiService.ts
│   ├── BackgroundTaskService.ts
│   ├── SettingsService.ts
│   ├── SystemMonitorService.ts
│   ├── LogStorageService.ts
│   └── QueueStorageService.ts
├── utils/           # Utility functions
│   ├── CommandExecutor.ts
│   └── EncryptionUtil.ts
├── types/           # TypeScript type definitions
│   └── index.ts
└── config/          # Configuration constants
    └── constants.ts
```

### Key Components

1. **SettingsService**: Manages app settings using AsyncStorage
2. **SystemMonitorService**: Monitors device health metrics
3. **ApiService**: Handles all API communications with Basic Auth, logs all requests
4. **BackgroundTaskService**: Manages periodic background tasks
5. **CommandExecutor**: Executes remote commands and updates queue status
6. **LogStorageService**: Manages encrypted storage of API logs with search/filter capabilities
7. **QueueStorageService**: Manages encrypted command queue with status tracking
8. **EncryptionUtil**: Provides AES-256 encryption/decryption for secure data storage

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
