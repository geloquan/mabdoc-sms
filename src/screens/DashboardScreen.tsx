import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import SystemMonitorService from '../services/SystemMonitorService';
import ConfigurationPanel from '../components/ConfigurationPanel';
import SmsFetchingService from '../services/SmsFetchingService';
import AuthService from '../services/AuthService';
import SettingsService from '../services/SettingsService';
import { SystemHealth, SmsFetchingState } from '../types';

interface DashboardScreenProps {
  onNavigateToSettings: () => void;
  onNavigateToLogs: () => void;
  onNavigateToQueue: () => void;
  onNavigateToSmsResponses: () => void;
}

const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onNavigateToSettings,
  onNavigateToLogs,
  onNavigateToQueue,
  onNavigateToSmsResponses,
}) => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [fetchingState, setFetchingState] = useState<SmsFetchingState | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    const healthData = await SystemMonitorService.getSystemHealth();
    const state = SmsFetchingService.getState();
    setHealth(healthData);
    setFetchingState(state);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handlePauseResume = async () => {
    if (!fetchingState) return;

    if (fetchingState.isPaused) {
      // Resuming - requires authentication
      Alert.alert(
        'Resume SMS Fetching',
        'Authentication required to resume SMS fetching. Please confirm.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Confirm',
            onPress: async () => {
              try {
                const settings = await SettingsService.getSettings();
                const authCheck = await AuthService.checkAuthentication(settings);
                
                if (authCheck.success) {
                  await SmsFetchingService.resume();
                  await loadData();
                  Alert.alert('Success', 'SMS fetching resumed');
                } else {
                  Alert.alert('Authentication Failed', 'Could not verify credentials. Please check your settings.');
                }
              } catch (error) {
                Alert.alert('Error', 'Failed to resume SMS fetching');
              }
            },
          },
        ],
      );
    } else {
      // Pausing - no authentication required
      Alert.alert(
        'Pause SMS Fetching',
        'Are you sure you want to pause SMS fetching?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Pause',
            style: 'destructive',
            onPress: async () => {
              try {
                await SmsFetchingService.pause();
                await loadData();
                Alert.alert('Success', 'SMS fetching paused');
              } catch (error) {
                Alert.alert('Error', 'Failed to pause SMS fetching');
              }
            },
          },
        ],
      );
    }
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
            onPress={onNavigateToSmsResponses}>
            <Text style={styles.navButtonIcon}>📨</Text>
            <Text style={styles.navButtonText}>SMS</Text>
          </TouchableOpacity>
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

      {/* SMS Fetching Control */}
      {fetchingState && (
        <View style={styles.controlSection}>
          <Text style={styles.sectionTitle}>📡 SMS Fetching Control</Text>
          <View style={styles.controlCard}>
            <View style={styles.controlInfo}>
              <Text style={styles.controlLabel}>Status:</Text>
              <Text style={[
                styles.controlStatus,
                fetchingState.isPaused ? styles.controlStatusPaused : styles.controlStatusActive
              ]}>
                {fetchingState.isPaused ? '⏸️ PAUSED' : '▶️ ACTIVE'}
              </Text>
            </View>
            <View style={styles.controlStats}>
              <Text style={styles.controlStatText}>Fetched: {fetchingState.totalFetched}</Text>
              <Text style={styles.controlStatText}>Success: {fetchingState.totalSuccess}</Text>
              <Text style={styles.controlStatText}>Failed: {fetchingState.totalFailed}</Text>
            </View>
            <TouchableOpacity
              style={[
                styles.controlButton,
                fetchingState.isPaused ? styles.controlButtonResume : styles.controlButtonPause
              ]}
              onPress={handlePauseResume}>
              <Text style={styles.controlButtonText}>
                {fetchingState.isPaused ? '▶️ Resume' : '⏸️ Pause'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

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
  controlSection: {
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 10,
  },
  controlCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  controlInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  controlLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  controlStatus: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  controlStatusActive: {
    color: '#4CAF50',
  },
  controlStatusPaused: {
    color: '#FF9800',
  },
  controlStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 6,
  },
  controlStatText: {
    fontSize: 12,
    color: '#666',
  },
  controlButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  controlButtonPause: {
    backgroundColor: '#FF9800',
  },
  controlButtonResume: {
    backgroundColor: '#4CAF50',
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
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
