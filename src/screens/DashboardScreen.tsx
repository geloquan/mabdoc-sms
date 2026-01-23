import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import SystemMonitorService from '../services/SystemMonitorService';
import ConfigurationPanel from '../components/ConfigurationPanel';
import { SystemHealth } from '../types';

interface DashboardScreenProps {
  onNavigateToSettings: () => void;
  onNavigateToLogs: () => void;
  onNavigateToQueue: () => void;
}

const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onNavigateToSettings,
  onNavigateToLogs,
  onNavigateToQueue,
}) => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadHealth();
    const interval = setInterval(loadHealth, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadHealth = async () => {
    const healthData = await SystemMonitorService.getSystemHealth();
    setHealth(healthData);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHealth();
    setRefreshing(false);
  };

  const renderHealthItem = (label: string, value: string, status?: string) => (
    <View style={styles.healthItem}>
      <View style={styles.healthItemLeft}>
        <Text style={styles.healthLabel}>{label}</Text>
        <Text style={styles.healthValue}>{value}</Text>
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
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>📱 SMS Sender Dashboard</Text>
          <Text style={styles.subtitle}>Multi-Device SMS Processing Unit</Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={onNavigateToLogs}>
            <Text style={styles.navButtonIcon}>📄</Text>
            <Text style={styles.navButtonText}>Logs</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navButton}
            onPress={onNavigateToQueue}>
            <Text style={styles.navButtonIcon}>📋</Text>
            <Text style={styles.navButtonText}>Queue</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navButton}
            onPress={onNavigateToSettings}>
            <Text style={styles.navButtonIcon}>⚙️</Text>
            <Text style={styles.navButtonText}>Settings</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Configuration Panel - Collapsed by default */}
      <ConfigurationPanel collapsed={true} />

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>💚 System Health</Text>

        {health ? (
          <>
            {renderHealthItem(
              'Battery Level',
              `${health.batteryLevel.toFixed(1)}%`,
              health.batteryLevel > 20 ? 'good' : 'bad',
            )}

            {renderHealthItem(
              'Battery Status',
              health.batteryCharging ? 'Charging' : 'Not Charging',
            )}

            {renderHealthItem(
              'RAM Usage',
              `${health.ramUsage.toFixed(1)}%`,
              health.ramUsage < 80 ? 'good' : 'bad',
            )}

            {renderHealthItem(
              'Internet Access',
              health.hasInternetAccess ? 'Connected' : 'Disconnected',
              health.hasInternetAccess ? 'good' : 'bad',
            )}

            {renderHealthItem(
              'Network Speed (Down/Up)',
              `${health.networkSpeed.download} / ${health.networkSpeed.upload} Mbps`,
            )}

            {renderHealthItem(
              'SMS Permission',
              health.hasSmsPermission ? 'Granted' : 'Not Granted',
              health.hasSmsPermission ? 'good' : 'bad',
            )}

            <View style={styles.timestampContainer}>
              <Text style={styles.timestampText}>
                Last updated: {new Date(health.timestamp).toLocaleString()}
              </Text>
            </View>
          </>
        ) : (
          <Text>Loading system health...</Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  headerTop: {
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-around',
  },
  navButton: {
    flex: 1,
    backgroundColor: '#2196F3',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  navButtonIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  navButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#1a1a1a',
  },
  healthItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  healthItemLeft: {
    flex: 1,
  },
  healthLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
    fontWeight: '500',
  },
  healthValue: {
    fontSize: 18,
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
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  timestampContainer: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    alignItems: 'center',
  },
  timestampText: {
    fontSize: 13,
    color: '#1976D2',
    fontWeight: '500',
  },
});

export default DashboardScreen;
