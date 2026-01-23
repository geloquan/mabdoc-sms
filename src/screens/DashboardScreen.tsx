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
        <Text style={styles.title}>SMS Sender Dashboard</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={onNavigateToLogs}>
            <Text style={styles.headerButtonText}>Logs</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={onNavigateToQueue}>
            <Text style={styles.headerButtonText}>Queue</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={onNavigateToSettings}>
            <Text style={styles.headerButtonText}>Settings</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>System Health</Text>

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
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 5,
  },
  headerButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  headerButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  healthItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  healthItemLeft: {
    flex: 1,
  },
  healthLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  healthValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusGood: {
    backgroundColor: '#4CAF50',
  },
  statusBad: {
    backgroundColor: '#F44336',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  timestampContainer: {
    marginTop: 15,
    alignItems: 'center',
  },
  timestampText: {
    fontSize: 12,
    color: '#999',
  },
});

export default DashboardScreen;
