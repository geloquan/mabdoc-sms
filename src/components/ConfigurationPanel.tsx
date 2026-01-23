import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import SettingsService from '../services/SettingsService';
import { AppSettings } from '../types';

interface ConfigurationPanelProps {
  collapsed?: boolean;
}

const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({
  collapsed: initialCollapsed = true,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [deviceInfo, setDeviceInfo] = useState({
    deviceId: '',
    deviceName: '',
    systemVersion: '',
    appVersion: '',
    buildNumber: '',
  });

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    // Load settings
    const currentSettings = await SettingsService.getSettings();
    setSettings(currentSettings);

    // Load device info
    const info = {
      deviceId: await DeviceInfo.getUniqueId(),
      deviceName: `${await DeviceInfo.getManufacturer()} ${await DeviceInfo.getModel()}`,
      systemVersion: await DeviceInfo.getSystemVersion(),
      appVersion: await DeviceInfo.getVersion(),
      buildNumber: await DeviceInfo.getBuildNumber(),
    };
    setDeviceInfo(info);
  };

  // Helper function for consistent password masking
  const maskPassword = (password: string, maxLength: number = 20): string => {
    if (!password) return '';
    return '•'.repeat(Math.min(password.length, maxLength));
  };

  const getConfigurationJSON = () => {
    if (!settings) return {};
    
    return {
      device: {
        id: deviceInfo.deviceId,
        name: deviceInfo.deviceName,
        systemVersion: deviceInfo.systemVersion,
        appVersion: deviceInfo.appVersion,
        buildNumber: deviceInfo.buildNumber,
      },
      configuration: {
        apiUrl: settings.apiUrl,
        username: settings.username,
        // Hide password for security, show masked version
        password: maskPassword(settings.password),
        intervals: {
          sms: `${settings.smsInterval}s`,
          health: `${settings.healthInterval}s`,
          command: `${settings.commandInterval}s`,
        },
      },
      deployment: {
        type: 'Multi-Device SMS Sender',
        role: 'SMS Processing Unit',
        note: 'This device is part of a distributed SMS sending network',
      },
    };
  };

  const renderConfigValue = (label: string, value: string) => (
    <View style={styles.configRow}>
      <Text style={styles.configLabel}>{label}:</Text>
      <Text style={styles.configValue}>{value}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setIsCollapsed(!isCollapsed)}
        activeOpacity={0.7}>
        <View style={styles.headerLeft}>
          <Text style={styles.icon}>⚙️</Text>
          <Text style={styles.headerTitle}>SMS Sender Configuration</Text>
        </View>
        <Text style={styles.collapseIcon}>{isCollapsed ? '▼' : '▲'}</Text>
      </TouchableOpacity>

      {!isCollapsed && settings && (
        <View style={styles.content}>
          {/* Device Information Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📱 Device Information</Text>
            {renderConfigValue('Device ID', deviceInfo.deviceId)}
            {renderConfigValue('Device Name', deviceInfo.deviceName)}
            {renderConfigValue('System Version', deviceInfo.systemVersion)}
            {renderConfigValue('App Version', `${deviceInfo.appVersion} (${deviceInfo.buildNumber})`)}
          </View>

          {/* API Configuration Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🌐 API Configuration</Text>
            {renderConfigValue('API URL', settings.apiUrl || 'Not configured')}
            {renderConfigValue('Username', settings.username || 'Not configured')}
            {renderConfigValue('Password', maskPassword(settings.password) || 'Not configured')}
          </View>

          {/* Polling Intervals Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⏱️ Polling Intervals</Text>
            {renderConfigValue('SMS Fetch', `Every ${settings.smsInterval} seconds`)}
            {renderConfigValue('Health Report', `Every ${settings.healthInterval} seconds`)}
            {renderConfigValue('Command Fetch', `Every ${settings.commandInterval} seconds`)}
          </View>

          {/* JSON Configuration Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📋 JSON Configuration (Developer View)</Text>
            <ScrollView style={styles.jsonContainer} horizontal>
              <Text style={styles.jsonText}>
                {JSON.stringify(getConfigurationJSON(), null, 2)}
              </Text>
            </ScrollView>
          </View>

          {/* Deployment Info */}
          <View style={styles.deploymentInfo}>
            <Text style={styles.deploymentTitle}>🚀 Deployment Information</Text>
            <Text style={styles.deploymentText}>
              This device is part of a distributed SMS sender network. Multiple units execute the same job and operations for redundancy and scalability.
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 20,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#2196F3',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    fontSize: 24,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
  },
  collapseIcon: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#2196F3',
  },
  configRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  configLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    width: 140,
  },
  configValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    fontFamily: 'monospace',
  },
  jsonContainer: {
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    padding: 12,
    maxHeight: 300,
  },
  jsonText: {
    color: '#d4d4d4',
    fontSize: 12,
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  deploymentInfo: {
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  deploymentTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1976D2',
    marginBottom: 6,
  },
  deploymentText: {
    fontSize: 13,
    color: '#555',
    lineHeight: 20,
  },
});

export default ConfigurationPanel;
