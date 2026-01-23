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
import LogsService from '../services/LogsService';
import { LogEntry, LogType } from '../types';

const LogsScreen: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<LogType | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'success' | 'failed'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ total: 0, successCount: 0, failureCount: 0 });

  useEffect(() => {
    loadLogs();
  }, []);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logs, searchQuery, selectedType, selectedStatus]);

  const loadLogs = async () => {
    const allLogs = await LogsService.getLogs();
    const logsStats = await LogsService.getLogsStats();
    setLogs(allLogs);
    setStats(logsStats);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLogs();
    setRefreshing(false);
  };

  const applyFilters = async () => {
    let filtered = [...logs];

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(log => log.type === selectedType);
    }

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(log => log.success === (selectedStatus === 'success'));
    }

    // Search
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(log => {
        const searchableText = JSON.stringify({
          type: log.type,
          endpoint: log.endpoint,
          error: log.error,
        }).toLowerCase();
        return searchableText.includes(lowerQuery);
      });
    }

    setFilteredLogs(filtered);
  };

  const handleExport = async () => {
    const exported = await LogsService.exportLogs();
    if (exported) {
      await Share.share({
        message: exported,
        title: 'Encrypted Logs Data',
      });
    } else {
      Alert.alert('Error', 'Failed to export logs');
    }
  };

  const handleImport = () => {
    Alert.prompt(
      'Import Logs',
      'Paste the encrypted JSON logs data',
      async (text) => {
        if (text) {
          const success = await LogsService.importLogs(text);
          if (success) {
            Alert.alert('Success', 'Logs imported successfully');
            await loadLogs();
          } else {
            Alert.alert('Error', 'Failed to import logs. Invalid data.');
          }
        }
      },
      'plain-text',
    );
  };

  const handleClearLogs = () => {
    Alert.alert(
      'Clear Logs',
      'Are you sure you want to clear all logs? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await LogsService.clearLogs();
            await loadLogs();
            Alert.alert('Success', 'All logs cleared');
          },
        },
      ],
    );
  };

  const renderLogItem = (log: LogEntry) => {
    const statusColor = log.success ? '#4CAF50' : '#F44336';
    
    return (
      <View key={log.id} style={styles.logItem}>
        <View style={styles.logHeader}>
          <View style={[styles.typeBadge, { backgroundColor: getTypeColor(log.type) }]}>
            <Text style={styles.typeBadgeText}>{log.type.toUpperCase()}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusBadgeText}>
              {log.success ? 'SUCCESS' : 'FAILED'}
            </Text>
          </View>
        </View>
        
        <Text style={styles.logEndpoint} numberOfLines={1}>
          {log.method} {log.endpoint}
        </Text>
        
        <Text style={styles.logTimestamp}>
          {new Date(log.timestamp).toLocaleString()}
        </Text>
        
        {log.error && (
          <Text style={styles.logError} numberOfLines={2}>
            Error: {log.error}
          </Text>
        )}
        
        {log.metadata?.duration && (
          <Text style={styles.logDuration}>
            Duration: {log.metadata.duration}ms
          </Text>
        )}
      </View>
    );
  };

  const getTypeColor = (type: LogType): string => {
    switch (type) {
      case LogType.SMS:
        return '#2196F3';
      case LogType.HEALTH:
        return '#4CAF50';
      case LogType.COMMAND:
        return '#FF9800';
      default:
        return '#9E9E9E';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>API Logs</Text>
        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>
            Total: {stats.total} | Success: {stats.successCount} | Failed: {stats.failureCount}
          </Text>
        </View>
      </View>

      <View style={styles.filterContainer}>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search logs..."
          placeholderTextColor="#999"
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterButtons}>
          <TouchableOpacity
            style={[styles.filterButton, selectedType === 'all' && styles.filterButtonActive]}
            onPress={() => setSelectedType('all')}>
            <Text style={[styles.filterButtonText, selectedType === 'all' && styles.filterButtonTextActive]}>
              All Types
            </Text>
          </TouchableOpacity>

          {Object.values(LogType).map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.filterButton, selectedType === type && styles.filterButtonActive]}
              onPress={() => setSelectedType(type)}>
              <Text style={[styles.filterButtonText, selectedType === type && styles.filterButtonTextActive]}>
                {type.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={[styles.filterButton, selectedStatus === 'success' && styles.filterButtonActive]}
            onPress={() => setSelectedStatus(selectedStatus === 'success' ? 'all' : 'success')}>
            <Text style={[styles.filterButtonText, selectedStatus === 'success' && styles.filterButtonTextActive]}>
              Success
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, selectedStatus === 'failed' && styles.filterButtonActive]}
            onPress={() => setSelectedStatus(selectedStatus === 'failed' ? 'all' : 'failed')}>
            <Text style={[styles.filterButtonText, selectedStatus === 'failed' && styles.filterButtonTextActive]}>
              Failed
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView
        style={styles.logsContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        {filteredLogs.length > 0 ? (
          filteredLogs.map(renderLogItem)
        ) : (
          <Text style={styles.emptyText}>No logs found</Text>
        )}
      </ScrollView>

      <View style={styles.actionsContainer}>
        <TouchableOpacity style={[styles.actionButton, styles.exportButton]} onPress={handleExport}>
          <Text style={styles.actionButtonText}>Export</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, styles.importButton]} onPress={handleImport}>
          <Text style={styles.actionButtonText}>Import</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, styles.clearButton]} onPress={handleClearLogs}>
          <Text style={styles.actionButtonText}>Clear</Text>
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
    marginBottom: 5,
  },
  statsContainer: {
    marginTop: 5,
  },
  statsText: {
    fontSize: 12,
    color: '#666',
  },
  filterContainer: {
    backgroundColor: '#fff',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    fontSize: 14,
    color: '#333',
  },
  filterButtons: {
    flexDirection: 'row',
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  logsContainer: {
    flex: 1,
    padding: 10,
  },
  logItem: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  logHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  typeBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  logEndpoint: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  logTimestamp: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
  },
  logError: {
    fontSize: 12,
    color: '#F44336',
    marginTop: 4,
  },
  logDuration: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 40,
    fontSize: 16,
  },
  actionsContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  actionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  exportButton: {
    backgroundColor: '#2196F3',
  },
  importButton: {
    backgroundColor: '#4CAF50',
  },
  clearButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default LogsScreen;
