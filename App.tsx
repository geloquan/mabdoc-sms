/**
 * SMS Sender Application
 * @format
 */

import React, { useState, useEffect } from 'react';
import { StatusBar, StyleSheet, View, TouchableOpacity, Text, PermissionsAndroid, Platform } from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import DashboardScreen from './src/screens/DashboardScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import BackgroundTaskService from './src/services/BackgroundTaskService';
import SystemMonitorService from './src/services/SystemMonitorService';

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
  const [currentScreen, setCurrentScreen] = useState<'dashboard' | 'settings'>(
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
    // Request necessary permissions
    await SystemMonitorService.requestSmsPermission();
    
    // Request additional permissions for 24/7 operation on Android
    if (Platform.OS === 'android') {
      try {
        const permissions = [
          PermissionsAndroid.PERMISSIONS.SEND_SMS,
          PermissionsAndroid.PERMISSIONS.READ_SMS,
          PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
          PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
        ];
        
        // Request notification permission for Android 13+
        if (Platform.Version >= 33) {
          permissions.push(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
        }
        
        await PermissionsAndroid.requestMultiple(permissions);
      } catch (error) {
        console.error('Error requesting permissions:', error);
      }
    }

    // Start background tasks
    await BackgroundTaskService.start();
  };

  return (
    <View style={[styles.container, { paddingTop: safeAreaInsets.top }]}>
      {currentScreen === 'dashboard' ? (
        <DashboardScreen
          onNavigateToSettings={() => setCurrentScreen('settings')}
        />
      ) : (
        <View style={styles.container}>
          <SettingsScreen />
          <View style={styles.backButtonContainer}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setCurrentScreen('dashboard')}>
              <Text style={styles.backButtonText}>Back to Dashboard</Text>
            </TouchableOpacity>
          </View>
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
