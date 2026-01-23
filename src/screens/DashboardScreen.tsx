import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import SystemMonitorService from '../services/SystemMonitorService';
import SettingsService from '../services/SettingsService';
import ConfigurationPanel from '../components/ConfigurationPanel';
import { SystemHealth, AppSettings } from '../types';

interface DashboardScreenProps {
  onNavigateToSettings: () => void;
}

const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onNavigateToSettings,
}) => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [deviceInfo, setDeviceInfo] = useState({
    deviceId: '',
    model: '',
    systemVersion: '',
  });
  const [refreshing, setRefreshing] = useState(false);

  const loadHealth = async () => {
    const healthData = await SystemMonitorService.getSystemHealth();
    setHealth(healthData);
  };

  const loadSettings = async () => {
    const settingsData = await SettingsService.getSettings();
    setSettings(settingsData);
  };

  const loadDeviceInfo = async () => {
    const deviceId = await DeviceInfo.getUniqueId();
    const model = await DeviceInfo.getModel();
    const systemVersion = await DeviceInfo.getSystemVersion();
    setDeviceInfo({ deviceId, model, systemVersion });
  };

  useEffect(() => {
    const loadData = async () => {
      await loadHealth();
      await loadSettings();
      await loadDeviceInfo();
    };

    loadData();
    const interval = setInterval(loadHealth, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHealth();
    await loadSettings();
    await loadDeviceInfo();
    setRefreshing(false);
  };

  const renderHealthItem = (
    label: string,
    value: string,
    status?: string,
    emoji?: string,
  ) => (
    <View style={styles.healthItem}>
      <View style={styles.healthItemLeft}>
        {emoji && <Text style={styles.healthEmoji}>{emoji}</Text>}
        <View style={styles.healthTextContainer}>
          <Text style={styles.healthLabel}>{label}</Text>
          <Text style={styles.healthValue}>{value}</Text>
        </View>
      </View>
      {status && (
        <View
          style={[
            styles.statusBadge,
            status === 'good' ? styles.statusGood : styles.statusBad,
          ]}>
          <Text style={styles.statusText}>{status.toUpperCase()}</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>SMS Sender</Text>
          <Text style={styles.subtitle}>Multi-Device Dashboard</Text>
        </View>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={onNavigateToSettings}>
          <Text style={styles.settingsButtonText}>⚙️ Settings</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        {settings && (
          <ConfigurationPanel settings={settings} deviceInfo={deviceInfo} />
        )}

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>📊 System Health Monitor</Text>
          </View>

          {health ? (
            <View style={styles.cardContent}>
              {renderHealthItem(
                'Battery Level',
                `${health.batteryLevel.toFixed(1)}%`,
                health.batteryLevel > 20 ? 'good' : 'bad',
                '🔋',
              )}

              {renderHealthItem(
                'Battery Status',
                health.batteryCharging ? 'Charging' : 'Not Charging',
                undefined,
                '⚡',
              )}

              {renderHealthItem(
                'RAM Usage',
                `${health.ramUsage.toFixed(1)}%`,
                health.ramUsage < 80 ? 'good' : 'bad',
                '💾',
              )}

              {renderHealthItem(
                'Internet Access',
                health.hasInternetAccess ? 'Connected' : 'Disconnected',
                health.hasInternetAccess ? 'good' : 'bad',
                '🌐',
              )}

              {renderHealthItem(
                'Network Speed',
                `↓${health.networkSpeed.download} / ↑${health.networkSpeed.upload} Mbps`,
                undefined,
                '📶',
              )}

              {renderHealthItem(
                'SMS Permission',
                health.hasSmsPermission ? 'Granted' : 'Not Granted',
                health.hasSmsPermission ? 'good' : 'bad',
                '📱',
              )}

              <View style={styles.timestampContainer}>
                <Text style={styles.timestampText}>
                  🕒 Last updated: {new Date(health.timestamp).toLocaleString()}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading system health...</Text>
            </View>
          )}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>ℹ️ About 24/7 Operation</Text>
          <Text style={styles.infoText}>
            This SMS Sender is configured for continuous operation. It will:
          </Text>
          <Text style={styles.infoListItem}>• Start automatically on device boot</Text>
          <Text style={styles.infoListItem}>• Run in the background without interruption</Text>
          <Text style={styles.infoListItem}>• Bypass battery optimization restrictions</Text>
          <Text style={styles.infoListItem}>• Maintain wake locks for reliable operation</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a1a1a',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: '#657786',
    marginTop: 2,
    fontWeight: '500',
  },
  settingsButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  settingsButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f3f5',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  cardContent: {
    padding: 12,
  },
  healthItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginVertical: 4,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  healthItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  healthEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  healthTextContainer: {
    flex: 1,
  },
  healthLabel: {
    fontSize: 13,
    color: '#657786',
    marginBottom: 2,
    fontWeight: '500',
  },
  healthValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusGood: {
    backgroundColor: '#4CAF50',
  },
  statusBad: {
    backgroundColor: '#F44336',
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  timestampContainer: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e1e8ed',
    alignItems: 'center',
  },
  timestampText: {
    fontSize: 12,
    color: '#657786',
    fontWeight: '500',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#657786',
  },
  infoCard: {
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1565C0',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#1976D2',
    marginBottom: 8,
    lineHeight: 18,
  },
  infoListItem: {
    fontSize: 13,
    color: '#1976D2',
    marginLeft: 8,
    marginVertical: 2,
    lineHeight: 18,
  },
});

export default DashboardScreen;
