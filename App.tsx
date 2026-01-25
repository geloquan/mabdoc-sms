/**
 * SMS Sender Application
 * @format
 */

import React, { useState, useEffect } from 'react';
import { StatusBar, StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import DashboardScreen from './src/screens/DashboardScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import LogViewerScreen from './src/screens/LogViewerScreen';
import QueueViewerScreen from './src/screens/QueueViewerScreen';
import BackgroundTaskService from './src/services/BackgroundTaskService';
import SystemMonitorService from './src/services/SystemMonitorService';
import AuthService from "./src/services/AuthService.ts";
import SettingsService from "./src/services/SettingsService.ts";

function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  const safeAreaInsets = useSafeAreaInsets();
  const [currentScreen, setCurrentScreen] = useState<'dashboard' | 'settings' | 'logs' | 'queue'>(
    'dashboard',
  );

  useEffect(() => {
    // Initialize the app
    initializeApp();

    return () => {
      // Cleanup when app unmounts
      BackgroundTaskService.stop();
    };
  }, []);

  const initializeApp = async () => {
    // Login
    await AuthService.login();

    // Request necessary permissions
    await SystemMonitorService.requestSmsPermission();

    // Start background tasks
    await BackgroundTaskService.start();
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'dashboard':
        return (
          <DashboardScreen
            onNavigateToSettings={() => setCurrentScreen('settings')}
            onNavigateToLogs={() => setCurrentScreen('logs')}
            onNavigateToQueue={() => setCurrentScreen('queue')}
          />
        );
      case 'settings':
        return <SettingsScreen />;
      case 'logs':
        return <LogViewerScreen />;
      case 'queue':
        return <QueueViewerScreen />;
      default:
        return (
          <DashboardScreen
            onNavigateToSettings={() => setCurrentScreen('settings')}
            onNavigateToLogs={() => setCurrentScreen('logs')}
            onNavigateToQueue={() => setCurrentScreen('queue')}
          />
        );
    }
  };

  return (
    <View style={[styles.container, { paddingTop: safeAreaInsets.top }]}>
      {renderScreen()}
      {currentScreen !== 'dashboard' && (
        <View style={styles.backButtonContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setCurrentScreen('dashboard')}>
            <Text style={styles.backButtonText}>Back to Dashboard</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  backButtonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  backButton: {
    backgroundColor: '#6c757d',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default App;
