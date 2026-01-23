# 24/7 Operation Permissions Summary

## Overview
This document details all permissions and configurations added to ensure the SMS Sender application can run continuously, 24/7, and automatically start on device boot.

## Android Manifest Permissions

### Critical Permissions Added

1. **WAKE_LOCK**
   - Purpose: Prevents the device from going into deep sleep
   - Ensures background tasks continue running
   - Critical for 24/7 operation

2. **REQUEST_IGNORE_BATTERY_OPTIMIZATIONS**
   - Purpose: Allows the app to request exemption from battery optimization
   - Prevents Android from killing the app to save battery
   - Implemented in MainActivity.kt to request at startup

3. **FOREGROUND_SERVICE**
   - Purpose: Enables the app to run foreground services
   - Provides higher priority for background operations
   - Less likely to be killed by the system

4. **FOREGROUND_SERVICE_DATA_SYNC**
   - Purpose: Specific type declaration for data synchronization services
   - Required for Android 14+ (API 34+)
   - Used for SMS fetching and health reporting

5. **SCHEDULE_EXACT_ALARM**
   - Purpose: Allows scheduling exact alarms for Android 12+ (API 31+)
   - Ensures tasks run at precise intervals
   - Critical for time-sensitive SMS operations

6. **USE_EXACT_ALARM**
   - Purpose: Alternative permission for exact alarms
   - Provides flexibility across Android versions

7. **POST_NOTIFICATIONS**
   - Purpose: Required for Android 13+ (API 33+) to show notifications
   - Allows foreground service notifications
   - Keeps user informed of app status

8. **DISABLE_KEYGUARD**
   - Purpose: Allows the app to unlock the screen if needed
   - Useful for critical operations that require user attention

9. **REQUEST_COMPANION_RUN_IN_BACKGROUND**
   - Purpose: Allows companion devices to run in background
   - Supports multi-device deployments

10. **REQUEST_COMPANION_START_FOREGROUND_SERVICES_FROM_BACKGROUND**
    - Purpose: Enables starting foreground services from background
    - Ensures services can restart if stopped

### Existing Permissions (Retained)
- INTERNET
- SEND_SMS
- READ_SMS
- RECEIVE_SMS
- READ_PHONE_STATE
- ACCESS_NETWORK_STATE
- BATTERY_STATS
- RECEIVE_BOOT_COMPLETED

## Code Implementations

### 1. MainActivity.kt - Battery Optimization Exemption

```kotlin
override fun onCreate(savedInstanceState: Bundle?) {
  super.onCreate(savedInstanceState)
  requestBatteryOptimizationExemption()
}

private fun requestBatteryOptimizationExemption() {
  if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
    val packageName = packageName
    val pm = getSystemService(POWER_SERVICE) as PowerManager
    
    if (!pm.isIgnoringBatteryOptimizations(packageName)) {
      val intent = Intent().apply {
        action = Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS
        data = Uri.parse("package:$packageName")
      }
      startActivity(intent)
    }
  }
}
```

**What it does:**
- Checks if battery optimization is enabled
- Opens system dialog to request exemption
- User must approve for full 24/7 operation

### 2. App.tsx - Runtime Permission Requests

```typescript
const initializeApp = async () => {
  await SystemMonitorService.requestSmsPermission();
  
  if (Platform.OS === 'android') {
    const permissions = [
      PermissionsAndroid.PERMISSIONS.SEND_SMS,
      PermissionsAndroid.PERMISSIONS.READ_SMS,
      PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
      PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
    ];
    
    // Add notification permission for Android 13+
    if (Platform.Version >= 33) {
      permissions.push(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
    }
    
    await PermissionsAndroid.requestMultiple(permissions);
  }
  
  await BackgroundTaskService.start();
};
```

**What it does:**
- Requests all SMS-related permissions
- Conditionally requests notification permission for Android 13+
- Starts background services after permissions granted

### 3. BootReceiver.kt - Auto-Start on Boot

```kotlin
class BootReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action == Intent.ACTION_BOOT_COMPLETED ||
        intent.action == "android.intent.action.QUICKBOOT_POWERON") {
      val i = Intent(context, MainActivity::class.java)
      i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      context.startActivity(i)
    }
  }
}
```

**What it does:**
- Listens for device boot completion
- Automatically launches the app
- Handles both normal and quick boot scenarios

## User Setup Requirements

### First Launch
1. Install the application
2. Launch the app
3. Grant SMS permissions when prompted
4. Grant notification permission (Android 13+)
5. Approve battery optimization exemption
6. Configure API settings

### Verification Checklist
- [ ] SMS permissions granted
- [ ] Battery optimization disabled for the app
- [ ] App auto-starts after device reboot
- [ ] Background services running continuously
- [ ] API health reports sending successfully

## Multi-Device Deployment

The application is designed to run on multiple Android devices simultaneously:

- Each device has a unique Device ID (displayed in configuration panel)
- All devices connect to the same API endpoint
- Devices operate independently
- Central server can identify each device by its ID

## Android Version Compatibility

### Android 6.0+ (API 23)
- Battery optimization exemption available
- Runtime permissions required

### Android 8.0+ (API 26)
- Foreground service notifications required
- Background execution limits apply

### Android 12+ (API 31)
- Exact alarm scheduling permission required
- Enhanced background restrictions

### Android 13+ (API 33)
- Runtime notification permission required

### Android 14+ (API 34)
- Foreground service type declaration required

## Troubleshooting

### App Stops Running
1. Check battery optimization is disabled
2. Verify all permissions are granted
3. Check if device has aggressive battery saving modes
4. Review manufacturer-specific settings (Xiaomi, Huawei, etc.)

### Doesn't Start on Boot
1. Verify RECEIVE_BOOT_COMPLETED permission
2. Check if boot receiver is registered
3. Some manufacturers require manual auto-start permission

### Background Tasks Not Running
1. Verify WAKE_LOCK permission
2. Check foreground service is active
3. Review background restrictions in device settings
