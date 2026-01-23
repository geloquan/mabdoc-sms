# Changelog

## [Unreleased] - 2026-01-23

### Added
- **ConfigurationPanel Component**: New collapsible component on Dashboard showing SMS Sender configuration
  - Displays device information (ID, model, system version)
  - Shows API configuration (URL, username, masked password)
  - Displays polling intervals for SMS, Health, and Command endpoints
  - Provides JSON configuration view for developers and maintainers
  - Collapsed by default for clean UI
  - Includes deployment information for multi-device context

### Enhanced
- **Dashboard UI/UX**: Modernized the dashboard with improved visual design
  - Added emoji icons for better visual hierarchy
  - Improved color scheme with modern gradients and shadows
  - Better spacing and typography for readability
  - Navigation buttons now display with icons
  - Health status cards have improved styling with left border indicators

### Critical Permissions for 24/7 Operation
- **Android Permissions**: Added all necessary permissions for continuous operation
  - `FOREGROUND_SERVICE`: Enables foreground service for continuous operation
  - `WAKE_LOCK`: Prevents device from sleeping during critical operations
  - `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`: Exempts app from battery optimization
  - `SCHEDULE_EXACT_ALARM`: Ensures precise timing for periodic tasks
  - `USE_EXACT_ALARM`: Alternative alarm permission for Android 12+
  
- **Battery Optimization**: MainActivity now requests battery optimization exemption on startup
  - Automatically prompts user to exempt app from battery restrictions
  - Ensures app can run 24/7 without being killed by system

- **Enhanced Boot Receiver**: Improved auto-start reliability
  - Added support for `LOCKED_BOOT_COMPLETED` for direct boot mode
  - Added support for `REBOOT` intent
  - Added logging for debugging boot issues
  - Better error handling and multiple boot intent support

- **Runtime Permissions**: Updated SystemMonitorService to request all SMS permissions at once
  - `SEND_SMS`, `READ_SMS`, `RECEIVE_SMS`, `READ_PHONE_STATE`

### Technical Details
The application is now optimized for deployment on multiple Android units performing the same job:
- Each device displays its unique ID and configuration
- Configuration can be viewed in JSON format for easy comparison across devices
- All devices can run 24/7 without interruption from battery optimization
- Auto-start on boot is more reliable across different Android manufacturers

### Developer Notes
The ConfigurationPanel is specifically designed for developers and maintainers to:
1. Quickly verify configuration across multiple deployed units
2. Debug connection and polling interval settings
3. Identify devices by their unique ID and hardware information
4. Copy JSON configuration for documentation or troubleshooting

### UI Preview
Dashboard now includes:
- Header with app title and subtitle "Multi-Device SMS Processing Unit"
- Three navigation buttons (Logs, Queue, Settings) with icons
- **ConfigurationPanel** (collapsed by default) showing:
  - Device Information
  - API Configuration
  - Polling Intervals
  - JSON Configuration for developers
  - Deployment context
- System Health section with improved visual indicators
