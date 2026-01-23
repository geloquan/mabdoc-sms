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
import QueueStorageService from '../services/QueueStorageService';
import { QueueEntry } from '../types';

const QueueViewerScreen: React.FC = () => {
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [filteredQueue, setFilteredQueue] = useState<QueueEntry[]>([]);
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | QueueEntry['status']>('all');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadQueue();
  }, []);

  useEffect(() => {
    filterQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue, searchText, filterStatus]);

  const loadQueue = async () => {
    const loadedQueue = await QueueStorageService.getQueue();
    const loadedStats = await QueueStorageService.getQueueStats();
    setQueue(loadedQueue);
    setStats(loadedStats);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadQueue();
    setRefreshing(false);
  };

  const filterQueue = () => {
    let filtered = queue;

    if (filterStatus !== 'all') {
      filtered = filtered.filter(entry => entry.status === filterStatus);
    }

    if (searchText) {
      filtered = filtered.filter(entry => {
        const searchLower = searchText.toLowerCase();
        return (
          entry.command.toLowerCase().includes(searchLower) ||
          JSON.stringify(entry.parameters).toLowerCase().includes(searchLower) ||
          entry.error?.toLowerCase().includes(searchLower)
        );
      });
    }

    setFilteredQueue(filtered);
  };

  const handleExport = async () => {
    const exported = await QueueStorageService.exportQueue();
    if (exported) {
      await Share.share({
        message: exported,
        title: 'Command Queue Export',
      });
    } else {
      Alert.alert('Error', 'Failed to export queue');
    }
  };

  const handleImport = () => {
    Alert.prompt(
      'Import Queue',
      'Paste the JSON queue data',
      async (text) => {
        if (text) {
          const success = await QueueStorageService.importQueue(text, false);
          if (success) {
            Alert.alert('Success', 'Queue imported successfully');
            await loadQueue();
          } else {
            Alert.alert('Error', 'Failed to import queue. Invalid JSON.');
          }
        }
      },
      'plain-text',
    );
  };

  const handleClearCompleted = () => {
    Alert.alert(
      'Clear Completed',
      'Remove all completed and failed entries?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            const deletedCount = await QueueStorageService.clearCompleted();
            Alert.alert('Success', `Removed ${deletedCount} entries`);
            await loadQueue();
          },
        },
      ],
    );
  };

  const handleRetry = async (id: string) => {
    const success = await QueueStorageService.retryEntry(id);
    if (success) {
      Alert.alert('Success', 'Entry marked for retry');
      await loadQueue();
    } else {
      Alert.alert('Error', 'Failed to retry entry');
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getStatusColor = (status: QueueEntry['status']) => {
    switch (status) {
      case 'pending':
        return '#FFC107';
      case 'processing':
        return '#2196F3';
      case 'completed':
        return '#4CAF50';
      case 'failed':
        return '#F44336';
      default:
        return '#999';
    }
  };

  const renderQueueEntry = (entry: QueueEntry) => {
    const isExpanded = expandedId === entry.id;
    const statusColor = getStatusColor(entry.status);

    return (
      <TouchableOpacity
        key={entry.id}
        style={styles.queueCard}
        onPress={() => toggleExpand(entry.id)}>
        <View style={styles.queueHeader}>
          <View style={styles.queueHeaderLeft}>
            <Text style={styles.queueCommand}>{entry.command}</Text>
            <Text style={styles.queueTime}>
              {new Date(entry.timestamp).toLocaleString()}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{entry.status.toUpperCase()}</Text>
          </View>
        </View>

        {entry.executedAt && (
          <Text style={styles.queueMetadata}>
            Executed: {new Date(entry.executedAt).toLocaleString()}
          </Text>
        )}

        {entry.metadata.retryCount && (
          <Text style={styles.queueMetadata}>
            Retries: {entry.metadata.retryCount}
          </Text>
        )}

        {isExpanded && (
          <View style={styles.queueDetails}>
            {entry.parameters && Object.keys(entry.parameters).length > 0 && (
              <View style={styles.detailSection}>
                <Text style={styles.detailTitle}>Parameters:</Text>
                <Text style={styles.detailText}>
                  {JSON.stringify(entry.parameters, null, 2)}
                </Text>
              </View>
            )}

            {entry.result && (
              <View style={styles.detailSection}>
                <Text style={styles.detailTitle}>Result:</Text>
                <Text style={styles.detailText}>
                  {JSON.stringify(entry.result, null, 2)}
                </Text>
              </View>
            )}

            {entry.error && (
              <View style={styles.detailSection}>
                <Text style={styles.detailTitle}>Error:</Text>
                <Text style={styles.errorText}>{entry.error}</Text>
              </View>
            )}

            {Object.keys(entry.metadata).length > 0 && (
              <View style={styles.detailSection}>
                <Text style={styles.detailTitle}>Metadata:</Text>
                <Text style={styles.detailText}>
                  {JSON.stringify(entry.metadata, null, 2)}
                </Text>
              </View>
            )}

            {entry.status === 'failed' && (
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => handleRetry(entry.id)}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Command Queue</Text>
        <View style={styles.statsContainer}>
          <Text style={styles.statText}>Total: {stats.total}</Text>
          <Text style={styles.statText}>Pending: {stats.pending}</Text>
          <Text style={styles.statText}>Completed: {stats.completed}</Text>
          <Text style={styles.statText}>Failed: {stats.failed}</Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Search commands..."
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.filterButton, filterStatus === 'all' && styles.filterButtonActive]}
            onPress={() => setFilterStatus('all')}>
            <Text style={[styles.filterButtonText, filterStatus === 'all' && styles.filterButtonTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filterStatus === 'pending' && styles.filterButtonActive]}
            onPress={() => setFilterStatus('pending')}>
            <Text style={[styles.filterButtonText, filterStatus === 'pending' && styles.filterButtonTextActive]}>
              Pending ({stats.pending})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filterStatus === 'processing' && styles.filterButtonActive]}
            onPress={() => setFilterStatus('processing')}>
            <Text style={[styles.filterButtonText, filterStatus === 'processing' && styles.filterButtonTextActive]}>
              Processing ({stats.processing})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filterStatus === 'completed' && styles.filterButtonActive]}
            onPress={() => setFilterStatus('completed')}>
            <Text style={[styles.filterButtonText, filterStatus === 'completed' && styles.filterButtonTextActive]}>
              Completed ({stats.completed})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filterStatus === 'failed' && styles.filterButtonActive]}
            onPress={() => setFilterStatus('failed')}>
            <Text style={[styles.filterButtonText, filterStatus === 'failed' && styles.filterButtonTextActive]}>
              Failed ({stats.failed})
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView
        style={styles.queueList}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {filteredQueue.length === 0 ? (
          <Text style={styles.emptyText}>No queue entries found</Text>
        ) : (
          filteredQueue.map(renderQueueEntry)
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
          onPress={handleClearCompleted}>
          <Text style={styles.actionButtonText}>Clear Done</Text>
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
    fontSize: 11,
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
    padding: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterButton: {
    padding: 8,
    paddingHorizontal: 12,
    marginRight: 8,
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
  queueList: {
    flex: 1,
    padding: 10,
  },
  queueCard: {
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
  queueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  queueHeaderLeft: {
    flex: 1,
  },
  queueCommand: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
    marginBottom: 4,
  },
  queueTime: {
    fontSize: 11,
    color: '#999',
  },
  queueMetadata: {
    fontSize: 11,
    color: '#666',
    marginBottom: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  queueDetails: {
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
  retryButton: {
    backgroundColor: '#FFC107',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 10,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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

export default QueueViewerScreen;
