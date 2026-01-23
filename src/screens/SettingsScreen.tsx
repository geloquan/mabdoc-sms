import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
} from 'react-native';
import SettingsService from '../services/SettingsService';
import BackgroundTaskService from '../services/BackgroundTaskService';
import { AppSettings } from '../types';
import { DEFAULT_SETTINGS } from '../config/constants';

const SettingsScreen: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    const loadedSettings = await SettingsService.getSettings();
    setSettings(loadedSettings);
    setIsLoading(false);
  };

  const handleSave = async () => {
    const success = await SettingsService.saveSettings(settings);
    if (success) {
      Alert.alert('Success', 'Settings saved successfully');
      await BackgroundTaskService.restart();
    } else {
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  const handleExport = async () => {
    const exported = await SettingsService.exportSettings();
    if (exported) {
      await Share.share({
        message: exported,
        title: 'App Settings',
      });
    } else {
      Alert.alert('Error', 'Failed to export settings');
    }
  };

  const handleImport = () => {
    Alert.prompt(
      'Import Settings',
      'Paste the JSON settings',
      async (text) => {
        if (text) {
          const success = await SettingsService.importSettings(text);
          if (success) {
            Alert.alert('Success', 'Settings imported successfully');
            await loadSettings();
            await BackgroundTaskService.restart();
          } else {
            Alert.alert('Error', 'Failed to import settings. Invalid JSON.');
          }
        }
      },
      'plain-text',
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>SMS Sender Settings</Text>

        <Text style={styles.label}>API URL</Text>
        <TextInput
          style={styles.input}
          value={settings.apiUrl}
          onChangeText={(text) => setSettings({ ...settings, apiUrl: text })}
          placeholder="https://api.example.com"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Username</Text>
        <TextInput
          style={styles.input}
          value={settings.username}
          onChangeText={(text) => setSettings({ ...settings, username: text })}
          placeholder="Enter username"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          value={settings.password}
          onChangeText={(text) => setSettings({ ...settings, password: text })}
          placeholder="Enter password"
          secureTextEntry
          autoCapitalize="none"
        />

        <Text style={styles.label}>SMS Interval (seconds)</Text>
        <TextInput
          style={styles.input}
          value={String(settings.smsInterval)}
          onChangeText={(text) =>
            setSettings({ ...settings, smsInterval: parseInt(text, 10) || 60 })
          }
          keyboardType="numeric"
          placeholder="60"
        />

        <Text style={styles.label}>Health Interval (seconds)</Text>
        <TextInput
          style={styles.input}
          value={String(settings.healthInterval)}
          onChangeText={(text) =>
            setSettings({ ...settings, healthInterval: parseInt(text, 10) || 120 })
          }
          keyboardType="numeric"
          placeholder="120"
        />

        <Text style={styles.label}>Command Interval (seconds)</Text>
        <TextInput
          style={styles.input}
          value={String(settings.commandInterval)}
          onChangeText={(text) =>
            setSettings({ ...settings, commandInterval: parseInt(text, 10) || 60 })
          }
          keyboardType="numeric"
          placeholder="60"
        />

        <TouchableOpacity style={styles.button} onPress={handleSave}>
          <Text style={styles.buttonText}>Save Settings</Text>
        </TouchableOpacity>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleExport}>
            <Text style={styles.buttonText}>Export</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleImport}>
            <Text style={styles.buttonText}>Import</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 15,
    marginBottom: 5,
    color: '#555',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  secondaryButton: {
    backgroundColor: '#6c757d',
    flex: 1,
    marginHorizontal: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

export default SettingsScreen;
