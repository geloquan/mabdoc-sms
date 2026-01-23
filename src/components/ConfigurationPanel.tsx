import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { AppSettings } from '../types';

interface ConfigurationPanelProps {
  settings: AppSettings;
  deviceInfo: {
    deviceId: string;
    model: string;
    systemVersion: string;
  };
}

const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({
  settings,
  deviceInfo,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [animation] = useState(new Animated.Value(0));

  const toggleExpand = () => {
    const toValue = isExpanded ? 0 : 1;
    Animated.timing(animation, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setIsExpanded(!isExpanded);
  };

  const maxHeight = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 500], // Adjust based on content
  });

  const rotateArrow = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const renderConfigItem = (label: string, value: string) => (
    <View style={styles.configItem}>
      <Text style={styles.configLabel}>{label}</Text>
      <Text style={styles.configValue}>{value}</Text>
    </View>
  );

  const maskPassword = (password: string) => {
    return password ? '•'.repeat(Math.min(password.length, 12)) : 'Not set';
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={toggleExpand}
        activeOpacity={0.7}>
        <View style={styles.headerLeft}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>⚙️</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>SMS Sender Configuration</Text>
            <Text style={styles.headerSubtitle}>
              {isExpanded ? 'Tap to collapse' : 'Tap to view details'}
            </Text>
          </View>
        </View>
        <Animated.View style={{ transform: [{ rotate: rotateArrow }] }}>
          <Text style={styles.arrow}>▼</Text>
        </Animated.View>
      </TouchableOpacity>

      <Animated.View style={[styles.content, { maxHeight }]}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌐 API Configuration</Text>
          {renderConfigItem('API URL', settings.apiUrl || 'Not configured')}
          {renderConfigItem('Username', settings.username || 'Not set')}
          {renderConfigItem('Password', maskPassword(settings.password))}
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⏱️ Intervals (seconds)</Text>
          {renderConfigItem('SMS Check', `${settings.smsInterval}s`)}
          {renderConfigItem('Health Report', `${settings.healthInterval}s`)}
          {renderConfigItem('Command Check', `${settings.commandInterval}s`)}
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📱 Device Information</Text>
          {renderConfigItem('Device ID', deviceInfo.deviceId)}
          {renderConfigItem('Model', deviceInfo.model)}
          {renderConfigItem('Android Version', deviceInfo.systemVersion)}
        </View>

        <View style={styles.statusIndicator}>
          <View
            style={[
              styles.statusDot,
              settings.apiUrl ? styles.statusActive : styles.statusInactive,
            ]}
          />
          <Text style={styles.statusText}>
            {settings.apiUrl ? 'Configuration Complete' : 'Configuration Required'}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 20,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  arrow: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  content: {
    overflow: 'hidden',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  configItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  configLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  configValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 16,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusActive: {
    backgroundColor: '#4CAF50',
  },
  statusInactive: {
    backgroundColor: '#FF9800',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
});

export default ConfigurationPanel;
