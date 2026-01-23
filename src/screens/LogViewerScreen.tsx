import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Share,
  RefreshControl,
} from 'react-native';
import LogStorageService from '../services/LogStorageService';
import { LogEntry } from '../types';

const LogViewerScreen: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'sms' | 'health'>('all');
  const [stats, setStats] = useState({
    total: 0,
    smsLogs: 0,
    healthLogs: 0,
    successCount: 0,
    errorCount: 0,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadLogs();
  }, []);

  useEffect(() => {
    filterLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logs, searchText, filterType]);

  const loadLogs = async () => {
    const loadedLogs = await LogStorageService.getLogs();
    const loadedStats = await LogStorageService.getLogStats();
    setLogs(loadedLogs);
    setStats(loadedStats);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLogs();
    setRefreshing(false);
  };

  const filterLogs = () => {
    let filtered = logs;

    if (filterType !== 'all') {
      filtered = filtered.filter(log => log.type === filterType);
    }

    if (searchText) {
      filtered = filtered.filter(log => {
        const searchLower = searchText.toLowerCase();
        return (
          log.endpoint.toLowerCase().includes(searchLower) ||
          JSON.stringify(log.response?.data).toLowerCase().includes(searchLower) ||
          log.response?.error?.toLowerCase().includes(searchLower)
        );
      });
    }

    setFilteredLogs(filtered);
  };

  const handleExport = async () => {
    const exported = await LogStorageService.exportLogs();
    if (exported) {
      await Share.share({
        message: exported,
        title: 'API Logs Export',
      });
    } else {
      Alert.alert('Error', 'Failed to export logs');
    }
  };

  const handleImport = () => {
    Alert.prompt(
      'Import Logs',
      'Paste the JSON logs data',
      async (text) => {
        if (text) {
          const success = await LogStorageService.importLogs(text, false);
          if (success) {
            Alert.alert('Success', 'Logs imported successfully');
            await loadLogs();
          } else {
            Alert.alert('Error', 'Failed to import logs. Invalid JSON.');
          }
        }
      },
      'plain-text',
    );
  };

  const handleClearLogs = () => {
    Alert.alert(
      'Clear All Logs',
      'Are you sure you want to delete all logs? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            const success = await LogStorageService.clearAllLogs();
            if (success) {
              Alert.alert('Success', 'All logs cleared');
              await loadLogs();
            } else {
              Alert.alert('Error', 'Failed to clear logs');
            }
          },
        },
      ],
    );
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const renderLog = (log: LogEntry) => {
    const isExpanded = expandedId === log.id;
    const isSuccess = log.response?.status && log.response.status >= 200 && log.response.status < 300;
    const isError = log.response?.status && log.response.status >= 400;

    return (
      <TouchableOpacity
        key={log.id}
        style={styles.logCard}
        onPress={() => toggleExpand(log.id)}>
        <View style={styles.logHeader}>
          <View style={styles.logHeaderLeft}>
            <Text style={styles.logType}>{log.type.toUpperCase()}</Text>
            <Text style={styles.logEndpoint}>{log.endpoint}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              isSuccess ? styles.statusSuccess : undefined,
              isError ? styles.statusError : undefined,
              !log.response ? styles.statusPending : undefined,
            ]}>
            <Text style={styles.statusText}>
              {log.response?.status || 'PENDING'}
            </Text>
          </View>
        </View>

        <Text style={styles.logTime}>
          {new Date(log.timestamp).toLocaleString()}
        </Text>

        {log.metadata.duration && (
          <Text style={styles.logMetadata}>
            Duration: {log.metadata.duration}ms
          </Text>
        )}

        {isExpanded && (
          <View style={styles.logDetails}>
            {log.request && (
              <View style={styles.detailSection}>
                <Text style={styles.detailTitle}>Request:</Text>
                <Text style={styles.detailText}>
                  Method: {log.request.method}
                </Text>
                {log.request.body && (
                  <Text style={styles.detailText}>
                    Body: {JSON.stringify(log.request.body, null, 2)}
                  </Text>
                )}
              </View>
            )}

            {log.response && (
              <View style={styles.detailSection}>
                <Text style={styles.detailTitle}>Response:</Text>
                <Text style={styles.detailText}>
                  Status: {log.response.status}
                </Text>
                {log.response.data && (
                  <Text style={styles.detailText}>
                    Data: {JSON.stringify(log.response.data, null, 2)}
                  </Text>
                )}
                {log.response.error && (
                  <Text style={styles.errorText}>
                    Error: {log.response.error}
                  </Text>
                )}
              </View>
            )}

            {Object.keys(log.metadata).length > 0 && (
              <View style={styles.detailSection}>
                <Text style={styles.detailTitle}>Metadata:</Text>
                <Text style={styles.detailText}>
                  {JSON.stringify(log.metadata, null, 2)}
                </Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>API Logs</Text>
        <View style={styles.statsContainer}>
          <Text style={styles.statText}>Total: {stats.total}</Text>
          <Text style={styles.statText}>Success: {stats.successCount}</Text>
          <Text style={styles.statText}>Errors: {stats.errorCount}</Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Search logs..."
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filterType === 'all' && styles.filterButtonActive]}
          onPress={() => setFilterType('all')}>
          <Text style={[styles.filterButtonText, filterType === 'all' && styles.filterButtonTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filterType === 'sms' && styles.filterButtonActive]}
          onPress={() => setFilterType('sms')}>
          <Text style={[styles.filterButtonText, filterType === 'sms' && styles.filterButtonTextActive]}>
            SMS ({stats.smsLogs})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filterType === 'health' && styles.filterButtonActive]}
          onPress={() => setFilterType('health')}>
          <Text style={[styles.filterButtonText, filterType === 'health' && styles.filterButtonTextActive]}>
            Health ({stats.healthLogs})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.logsList}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {filteredLogs.length === 0 ? (
          <Text style={styles.emptyText}>No logs found</Text>
        ) : (
          filteredLogs.map(renderLog)
        )}
      </ScrollView>

      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.actionButton} onPress={handleExport}>
          <Text style={styles.actionButtonText}>Export</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleImport}>
          <Text style={styles.actionButtonText}>Import</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.dangerButton]}
          onPress={handleClearLogs}>
          <Text style={styles.actionButtonText}>Clear All</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statText: {
    fontSize: 12,
    color: '#666',
  },
  searchContainer: {
    padding: 10,
    backgroundColor: '#fff',
  },
  searchInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterButton: {
    flex: 1,
    padding: 8,
    marginHorizontal: 5,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#666',
  },
  filterButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  logsList: {
    flex: 1,
    padding: 10,
  },
  logCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  logHeaderLeft: {
    flex: 1,
  },
  logType: {
    fontSize: 10,
    color: '#007AFF',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  logEndpoint: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  logTime: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
  },
  logMetadata: {
    fontSize: 11,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: '#999',
  },
  statusSuccess: {
    backgroundColor: '#4CAF50',
  },
  statusError: {
    backgroundColor: '#F44336',
  },
  statusPending: {
    backgroundColor: '#FFC107',
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  logDetails: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  detailSection: {
    marginBottom: 10,
  },
  detailTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 11,
    color: '#666',
    fontFamily: 'monospace',
  },
  errorText: {
    fontSize: 11,
    color: '#F44336',
    fontFamily: 'monospace',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 20,
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  dangerButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default LogViewerScreen;
