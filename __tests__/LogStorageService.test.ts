/**
 * @format
 */

import LogStorageService from '../src/services/LogStorageService';
import { LogEntry } from '../src/types';

describe('LogStorageService', () => {
  beforeEach(async () => {
    // Clear logs before each test
    await LogStorageService.clearAllLogs();
  });

  test('should add and retrieve logs', async () => {
    const log: LogEntry = {
      id: 'test-1',
      endpoint: '/api/sms/machine',
      timestamp: Date.now(),
      type: 'sms',
      request: {
        method: 'GET',
        headers: {},
      },
      response: {
        status: 200,
        data: { success: true },
      },
      metadata: {
        duration: 100,
      },
    };

    const added = await LogStorageService.addLog(log);
    expect(added).toBe(true);

    const logs = await LogStorageService.getLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0]).toEqual(log);
  });

  test('should search logs by type', async () => {
    const smsLog: LogEntry = {
      id: 'sms-1',
      endpoint: '/api/sms/machine',
      timestamp: Date.now(),
      type: 'sms',
      metadata: {},
    };

    const healthLog: LogEntry = {
      id: 'health-1',
      endpoint: '/api/sms/machine/health',
      timestamp: Date.now(),
      type: 'health',
      metadata: {},
    };

    await LogStorageService.addLog(smsLog);
    await LogStorageService.addLog(healthLog);

    const smsLogs = await LogStorageService.searchLogs({ type: 'sms' });
    expect(smsLogs).toHaveLength(1);
    expect(smsLogs[0].type).toBe('sms');

    const healthLogs = await LogStorageService.searchLogs({ type: 'health' });
    expect(healthLogs).toHaveLength(1);
    expect(healthLogs[0].type).toBe('health');
  });

  test('should export and import logs', async () => {
    const log: LogEntry = {
      id: 'export-1',
      endpoint: '/api/test',
      timestamp: Date.now(),
      type: 'sms',
      metadata: { test: true },
    };

    await LogStorageService.addLog(log);

    const exported = await LogStorageService.exportLogs();
    expect(exported).toBeTruthy();

    await LogStorageService.clearAllLogs();
    const emptyLogs = await LogStorageService.getLogs();
    expect(emptyLogs).toHaveLength(0);

    const imported = await LogStorageService.importLogs(exported!, false);
    expect(imported).toBe(true);

    const importedLogs = await LogStorageService.getLogs();
    expect(importedLogs).toHaveLength(1);
    expect(importedLogs[0].id).toBe('export-1');
  });

  test('should get log statistics', async () => {
    const smsLog: LogEntry = {
      id: 'stat-sms-1',
      endpoint: '/api/sms/machine',
      timestamp: Date.now(),
      type: 'sms',
      response: { status: 200, data: {} },
      metadata: {},
    };

    const healthLog: LogEntry = {
      id: 'stat-health-1',
      endpoint: '/api/sms/machine/health',
      timestamp: Date.now(),
      type: 'health',
      response: { status: 500, data: {} },
      metadata: {},
    };

    await LogStorageService.addLog(smsLog);
    await LogStorageService.addLog(healthLog);

    const stats = await LogStorageService.getLogStats();
    expect(stats.total).toBe(2);
    expect(stats.smsLogs).toBe(1);
    expect(stats.healthLogs).toBe(1);
    expect(stats.successCount).toBe(1);
    expect(stats.errorCount).toBe(1);
  });

  test('should clear all logs', async () => {
    const log: LogEntry = {
      id: 'clear-1',
      endpoint: '/api/test',
      timestamp: Date.now(),
      type: 'sms',
      metadata: {},
    };

    await LogStorageService.addLog(log);
    let logs = await LogStorageService.getLogs();
    expect(logs).toHaveLength(1);

    await LogStorageService.clearAllLogs();
    logs = await LogStorageService.getLogs();
    expect(logs).toHaveLength(0);
  });
});
