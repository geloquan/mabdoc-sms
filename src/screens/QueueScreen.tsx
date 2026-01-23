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
import QueueService from '../services/QueueService';
import { QueueItem } from '../types';

const QueueScreen: React.FC = () => {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [filteredQueue, setFilteredQueue] = useState<QueueItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<QueueItem['status'] | 'all'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ total: 0, pending: 0, executing: 0, completed: 0, failed: 0 });

  useEffect(() => {
    loadQueue();
  }, []);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue, searchQuery, selectedStatus]);

  const loadQueue = async () => {
    const allQueue = await QueueService.getQueue();
    const queueStats = await QueueService.getQueueStats();
    setQueue(allQueue);
    setStats(queueStats);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadQueue();
    setRefreshing(false);
  };

  const applyFilters = () => {
    let filtered = [...queue];

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(item => item.status === selectedStatus);
    }

    // Search
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(item => {
        const searchableText = JSON.stringify({
          command: item.command,
          parameters: item.parameters,
          status: item.status,
        }).toLowerCase();
        return searchableText.includes(lowerQuery);
      });
    }

    setFilteredQueue(filtered);
  };

  const handleExport = async () => {
    const exported = await QueueService.exportQueue();
    if (exported) {
      await Share.share({
        message: exported,
        title: 'Encrypted Queue Data',
      });
    } else {
      Alert.alert('Error', 'Failed to export queue');
    }
  };

  const handleImport = () => {
    Alert.prompt(
      'Import Queue',
      'Paste the encrypted JSON queue data',
      async (text) => {
        if (text) {
          const success = await QueueService.importQueue(text);
          if (success) {
            Alert.alert('Success', 'Queue imported successfully');
            await loadQueue();
          } else {
            Alert.alert('Error', 'Failed to import queue. Invalid data.');
          }
        }
      },
      'plain-text',
    );
  };

  const handleClearQueue = () => {
    Alert.alert(
      'Clear Queue',
      'Are you sure you want to clear all queue items? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await QueueService.clearQueue();
            await loadQueue();
            Alert.alert('Success', 'Queue cleared');
          },
        },
      ],
    );
  };

  const handleClearCompleted = () => {
    Alert.alert(
      'Clear Completed',
      'Are you sure you want to clear all completed items?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'default',
          onPress: async () => {
            await QueueService.clearCompletedItems();
            await loadQueue();
            Alert.alert('Success', 'Completed items cleared');
          },
        },
      ],
    );
  };

  const handleRemoveItem = (id: string) => {
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await QueueService.removeQueueItem(id);
            await loadQueue();
          },
        },
      ],
    );
  };

  const renderQueueItem = (item: QueueItem) => {
    const statusColor = getStatusColor(item.status);
    
    return (
      <View key={item.id} style={styles.queueItem}>
        <View style={styles.queueHeader}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusBadgeText}>{item.status.toUpperCase()}</Text>
          </View>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemoveItem(item.id)}>
            <Text style={styles.removeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.queueCommand}>Command: {item.command}</Text>
        
        {item.parameters && Object.keys(item.parameters).length > 0 && (
          <Text style={styles.queueParameters} numberOfLines={2}>
            Parameters: {JSON.stringify(item.parameters)}
          </Text>
        )}
        
        <Text style={styles.queueTimestamp}>
          Queued: {new Date(item.timestamp).toLocaleString()}
        </Text>
        
        {item.executedAt && (
          <Text style={styles.queueTimestamp}>
            Executed: {new Date(item.executedAt).toLocaleString()}
          </Text>
        )}
        
        {item.error && (
          <Text style={styles.queueError} numberOfLines={2}>
            Error: {item.error}
          </Text>
        )}
        
        {item.metadata?.retryCount !== undefined && item.metadata.retryCount > 0 && (
          <Text style={styles.queueRetry}>
            Retry Count: {item.metadata.retryCount}
          </Text>
        )}
      </View>
    );
  };

  const getStatusColor = (status: QueueItem['status']): string => {
    switch (status) {
      case 'pending':
        return '#FF9800';
      case 'executing':
        return '#2196F3';
      case 'completed':
        return '#4CAF50';
      case 'failed':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Command Queue</Text>
        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>
            Total: {stats.total} | Pending: {stats.pending} | Executing: {stats.executing} | Completed: {stats.completed} | Failed: {stats.failed}
          </Text>
        </View>
      </View>

      <View style={styles.filterContainer}>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search queue..."
          placeholderTextColor="#999"
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterButtons}>
          <TouchableOpacity
            style={[styles.filterButton, selectedStatus === 'all' && styles.filterButtonActive]}
            onPress={() => setSelectedStatus('all')}>
            <Text style={[styles.filterButtonText, selectedStatus === 'all' && styles.filterButtonTextActive]}>
              All
            </Text>
          </TouchableOpacity>

          {(['pending', 'executing', 'completed', 'failed'] as QueueItem['status'][]).map((status) => (
            <TouchableOpacity
              key={status}
              style={[styles.filterButton, selectedStatus === status && styles.filterButtonActive]}
              onPress={() => setSelectedStatus(status)}>
              <Text style={[styles.filterButtonText, selectedStatus === status && styles.filterButtonTextActive]}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.queueContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        {filteredQueue.length > 0 ? (
          filteredQueue.map(renderQueueItem)
        ) : (
          <Text style={styles.emptyText}>No queue items found</Text>
        )}
      </ScrollView>

      <View style={styles.actionsContainer}>
        <TouchableOpacity style={[styles.actionButton, styles.exportButton]} onPress={handleExport}>
          <Text style={styles.actionButtonText}>Export</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, styles.importButton]} onPress={handleImport}>
          <Text style={styles.actionButtonText}>Import</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, styles.clearCompletedButton]} onPress={handleClearCompleted}>
          <Text style={styles.actionButtonText}>Clear Done</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, styles.clearButton]} onPress={handleClearQueue}>
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
    marginBottom: 5,
  },
  statsContainer: {
    marginTop: 5,
  },
  statsText: {
    fontSize: 11,
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
  queueContainer: {
    flex: 1,
    padding: 10,
  },
  queueItem: {
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
  queueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
  removeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F44336',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  queueCommand: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  queueParameters: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  queueTimestamp: {
    fontSize: 11,
    color: '#999',
    marginBottom: 2,
  },
  queueError: {
    fontSize: 12,
    color: '#F44336',
    marginTop: 4,
  },
  queueRetry: {
    fontSize: 11,
    color: '#FF9800',
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
    marginHorizontal: 3,
  },
  exportButton: {
    backgroundColor: '#2196F3',
  },
  importButton: {
    backgroundColor: '#4CAF50',
  },
  clearCompletedButton: {
    backgroundColor: '#FF9800',
  },
  clearButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default QueueScreen;
