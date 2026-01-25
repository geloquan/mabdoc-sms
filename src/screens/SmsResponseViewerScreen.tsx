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
import SmsResponseStorageService from '../services/SmsResponseStorageService';
import { SmsResponse } from '../types';

const SmsResponseViewerScreen: React.FC = () => {
  const [responses, setResponses] = useState<SmsResponse[]>([]);
  const [filteredResponses, setFilteredResponses] = useState<SmsResponse[]>([]);
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'success' | 'failed' | 'no_job'>('all');
  const [stats, setStats] = useState({
    total: 0,
    successCount: 0,
    failedCount: 0,
    noJobCount: 0,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadResponses();
  }, []);

  useEffect(() => {
    filterResponses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [responses, searchText, filterStatus]);

  const loadResponses = async () => {
    const loadedResponses = await SmsResponseStorageService.getResponses();
    const loadedStats = await SmsResponseStorageService.getResponseStats();
    setResponses(loadedResponses);
    setStats(loadedStats);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadResponses();
    setRefreshing(false);
  };

  const filterResponses = () => {
    let filtered = responses;

    if (filterStatus !== 'all') {
      filtered = filtered.filter(response => response.status === filterStatus);
    }

    if (searchText) {
      filtered = filtered.filter(response => {
        const searchLower = searchText.toLowerCase();
        return (
          (response.phoneNumber?.toLowerCase().includes(searchLower)) ||
          (response.message?.toLowerCase().includes(searchLower)) ||
          (response.error?.toLowerCase().includes(searchLower)) ||
          (response.jobId?.toString().includes(searchLower))
        );
      });
    }

    setFilteredResponses(filtered);
  };

  const handleExport = async () => {
    const exported = await SmsResponseStorageService.exportResponses();
    if (exported) {
      await Share.share({
        message: exported,
        title: 'SMS Responses Export',
      });
    } else {
      Alert.alert('Error', 'Failed to export SMS responses');
    }
  };

  const handleImport = () => {
    Alert.prompt(
      'Import SMS Responses',
      'Paste the JSON data',
      async (text) => {
        if (text) {
          const success = await SmsResponseStorageService.importResponses(text, false);
          if (success) {
            Alert.alert('Success', 'SMS responses imported successfully');
            await loadResponses();
          } else {
            Alert.alert('Error', 'Failed to import SMS responses. Invalid JSON.');
          }
        }
      },
      'plain-text',
    );
  };

  const handleClearResponses = () => {
    Alert.alert(
      'Clear All SMS Responses',
      'Are you sure you want to delete all SMS responses? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            const success = await SmsResponseStorageService.clearAllResponses();
            if (success) {
              Alert.alert('Success', 'All SMS responses cleared');
              await loadResponses();
            } else {
              Alert.alert('Error', 'Failed to clear SMS responses');
            }
          },
        },
      ],
    );
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const renderResponse = (response: SmsResponse) => {
    const isExpanded = expandedId === response.id;
    const statusColor = 
      response.status === 'success' ? '#4CAF50' : 
      response.status === 'failed' ? '#F44336' : 
      '#FFC107';

    return (
      <TouchableOpacity
        key={response.id}
        style={styles.responseCard}
        onPress={() => toggleExpand(response.id)}>
        {/* Light View - Always Visible */}
        <View style={styles.responseHeader}>
          <View style={styles.responseHeaderLeft}>
            <Text style={styles.responseStatus}>
              {response.status.toUpperCase()}
            </Text>
            {response.phoneNumber && (
              <Text style={styles.phoneNumber}>📱 {response.phoneNumber}</Text>
            )}
            {response.jobId && (
              <Text style={styles.jobId}>Job #{response.jobId}</Text>
            )}
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>
              {response.status === 'success' ? '✓' : response.status === 'failed' ? '✗' : '○'}
            </Text>
          </View>
        </View>

        <Text style={styles.responseTime}>
          {new Date(response.timestamp).toLocaleString()}
        </Text>

        {response.message && !isExpanded && (
          <Text style={styles.messagePreview} numberOfLines={1}>
            {response.message}
          </Text>
        )}

        {/* Full Details - Visible on Click */}
        {isExpanded && (
          <View style={styles.responseDetails}>
            {response.message && (
              <View style={styles.detailSection}>
                <Text style={styles.detailTitle}>Message:</Text>
                <Text style={styles.detailText}>{response.message}</Text>
              </View>
            )}

            {response.error && (
              <View style={styles.detailSection}>
                <Text style={styles.detailTitle}>Error:</Text>
                <Text style={styles.errorText}>{response.error}</Text>
              </View>
            )}

            <View style={styles.detailSection}>
              <Text style={styles.detailTitle}>Metadata:</Text>
              {response.metadata.duration && (
                <Text style={styles.detailText}>
                  Duration: {response.metadata.duration}ms
                </Text>
              )}
              {response.metadata.attempts && (
                <Text style={styles.detailText}>
                  Attempts: {response.metadata.attempts}
                </Text>
              )}
              {response.metadata.priority !== undefined && (
                <Text style={styles.detailText}>
                  Priority: {response.metadata.priority}
                </Text>
              )}
              {response.metadata.batteryLevel !== undefined && 
               response.metadata.batteryLevel !== null &&
               !isNaN(response.metadata.batteryLevel) && (
                <Text style={styles.detailText}>
                  Battery: {response.metadata.batteryLevel.toFixed(1)}%
                </Text>
              )}
              {response.metadata.networkType && (
                <Text style={styles.detailText}>
                  Network: {response.metadata.networkType}
                </Text>
              )}
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailTitle}>Response ID:</Text>
              <Text style={styles.detailTextSmall}>{response.id}</Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📱 SMS Responses</Text>
        <View style={styles.statsContainer}>
          <Text style={styles.statText}>Total: {stats.total}</Text>
          <Text style={styles.statText}>Success: {stats.successCount}</Text>
          <Text style={styles.statText}>Failed: {stats.failedCount}</Text>
          <Text style={styles.statText}>No Job: {stats.noJobCount}</Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Search by phone, message, job ID..."
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filterStatus === 'all' && styles.filterButtonActive]}
          onPress={() => setFilterStatus('all')}>
          <Text style={[styles.filterButtonText, filterStatus === 'all' && styles.filterButtonTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filterStatus === 'success' && styles.filterButtonActive]}
          onPress={() => setFilterStatus('success')}>
          <Text style={[styles.filterButtonText, filterStatus === 'success' && styles.filterButtonTextActive]}>
            Success
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filterStatus === 'failed' && styles.filterButtonActive]}
          onPress={() => setFilterStatus('failed')}>
          <Text style={[styles.filterButtonText, filterStatus === 'failed' && styles.filterButtonTextActive]}>
            Failed
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filterStatus === 'no_job' && styles.filterButtonActive]}
          onPress={() => setFilterStatus('no_job')}>
          <Text style={[styles.filterButtonText, filterStatus === 'no_job' && styles.filterButtonTextActive]}>
            No Job
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.responsesList}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {filteredResponses.length === 0 ? (
          <Text style={styles.emptyText}>No SMS responses found</Text>
        ) : (
          filteredResponses.map(renderResponse)
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
          onPress={handleClearResponses}>
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
    marginHorizontal: 3,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#2196F3',
  },
  filterButtonText: {
    fontSize: 11,
    color: '#666',
  },
  filterButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  responsesList: {
    flex: 1,
    padding: 10,
  },
  responseCard: {
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
  responseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  responseHeaderLeft: {
    flex: 1,
  },
  responseStatus: {
    fontSize: 10,
    color: '#2196F3',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  phoneNumber: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    marginBottom: 2,
  },
  jobId: {
    fontSize: 11,
    color: '#666',
  },
  responseTime: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
  },
  messagePreview: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  statusBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  responseDetails: {
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
    fontSize: 12,
    color: '#666',
  },
  detailTextSmall: {
    fontSize: 10,
    color: '#999',
    fontFamily: 'monospace',
  },
  errorText: {
    fontSize: 12,
    color: '#F44336',
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
    backgroundColor: '#2196F3',
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

export default SmsResponseViewerScreen;
