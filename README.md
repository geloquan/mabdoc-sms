# mabdoc-sms

## SMS Sender Application

A React Native Android application for automated SMS sending with system monitoring, health reporting, and secure data logging capabilities.

### Quick Start

```bash
npm install
npm run android
```

### Features

- 📱 **System Monitoring**: Battery, RAM, Network connectivity
- 🔄 **Automated API Calls**: Periodic health reporting and command fetching
- ⚙️ **Configurable Settings**: Adjustable intervals and API endpoints
- 🔐 **Secure Authentication**: Basic authentication support
- 📤 **Import/Export**: JSON-based settings, logs, and queue management
- 🚀 **Auto-Start**: Launches automatically on device boot
- 🔒 **Encrypted Storage**: AES-256 encrypted logs and queue data
- 📊 **Data Logging**: Comprehensive API call logging with rich metadata
- 🗂️ **Command Queue**: Laravel-style queue for remote commands
- 🔍 **Search & Filter**: Powerful filtering and search capabilities
- 📈 **Statistics**: Real-time statistics for logs and queue
- **NEW** 🎛️ **Configuration Panel**: Collapsible panel showing device and API configuration in JSON format (perfect for developers and multi-device deployments)
- **NEW** 🔋 **24/7 Operation**: Battery optimization exemption and wake locks ensure continuous operation
- **NEW** 🎨 **Modern UI/UX**: Redesigned dashboard with improved visual hierarchy and iconography

### Documentation

See [DOCUMENTATION.md](./DOCUMENTATION.md) for comprehensive documentation including:
- Detailed feature descriptions
- API endpoint specifications
- Configuration guide
- Architecture overview
- Data storage and encryption details
- Troubleshooting tips

### Example Configuration

See [settings-example.json](./settings-example.json) for a sample configuration file.

### Required Permissions

#### Runtime Permissions
- SMS (send/receive/read)
- Phone state access
- Internet access
- Network state monitoring

#### System Permissions for 24/7 Operation
- **Battery Optimization Exemption**: App requests to be excluded from battery optimization
- **Wake Lock**: Prevents device from sleeping during critical operations
- **Foreground Service**: Enables continuous background operation
- **Exact Alarms**: Ensures precise timing for periodic tasks
- **Boot Receiver**: Auto-start on device boot and reboot

The app automatically requests battery optimization exemption on first launch to ensure uninterrupted 24/7 operation.

### Development

```bash
# Lint
npm run lint

# Type check
npx tsc --noEmit

# Run on Android
npm run android

# Run on iOS
npm run ios

# Run tests
npm test
```

### API Endpoints

The application communicates with three main endpoints:

1. `GET /api/sms/machine` - Fetch SMS data (logged automatically)
2. `POST /api/sms/machine/health` - Send system health data (logged automatically)
3. `GET /api/sms/machine/command` - Fetch remote commands (queued automatically)

All endpoints use Basic Authentication. All API calls are automatically logged with encryption for security.

### Data Management

The app provides comprehensive data management features:

- **Logs Viewer**: View, search, and filter all API call logs
- **Queue Viewer**: Manage command queue with retry capabilities
- **Import/Export**: Backup and restore logs and queue data
- **Encryption**: All stored data is encrypted using AES-256
- **Statistics**: Real-time insights into API performance and queue status

---

This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

# Getting Started

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

## Step 1: Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

### Android

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

### iOS

For iOS, remember to install CocoaPods dependencies (this only needs to be run on first clone or after updating native deps).

The first time you create a new project, run the Ruby bundler to install CocoaPods itself:

```sh
bundle install
```

Then, and every time you update your native dependencies, run:

```sh
bundle exec pod install
```

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.
