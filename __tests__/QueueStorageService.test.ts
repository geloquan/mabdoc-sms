/**
 * @format
 */

import QueueStorageService from '../src/services/QueueStorageService';
import { QueueEntry } from '../src/types';

describe('QueueStorageService', () => {
  beforeEach(async () => {
    // Clear queue before each test
    await QueueStorageService.clearAllQueue();
  });

  test('should add and retrieve queue entries', async () => {
    const entry: QueueEntry = {
      id: 'test-1',
      command: 'restart',
      parameters: { force: true },
      status: 'pending',
      timestamp: Date.now(),
      metadata: {},
    };

    const added = await QueueStorageService.addToQueue(entry);
    expect(added).toBe(true);

    const queue = await QueueStorageService.getQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0]).toEqual(entry);
  });

  test('should get next pending entry', async () => {
    const pending: QueueEntry = {
      id: 'pending-1',
      command: 'test',
      status: 'pending',
      timestamp: Date.now(),
      metadata: {},
    };

    const completed: QueueEntry = {
      id: 'completed-1',
      command: 'test2',
      status: 'completed',
      timestamp: Date.now(),
      metadata: {},
    };

    await QueueStorageService.addToQueue(completed);
    await QueueStorageService.addToQueue(pending);

    const next = await QueueStorageService.getNextPending();
    expect(next).not.toBeNull();
    expect(next?.id).toBe('pending-1');
    expect(next?.status).toBe('pending');
  });

  test('should update entry status', async () => {
    const entry: QueueEntry = {
      id: 'update-1',
      command: 'test',
      status: 'pending',
      timestamp: Date.now(),
      metadata: {},
    };

    await QueueStorageService.addToQueue(entry);

    const updated = await QueueStorageService.updateEntryStatus(
      'update-1',
      'completed',
      { result: 'success' }
    );
    expect(updated).toBe(true);

    const queue = await QueueStorageService.getQueue();
    expect(queue[0].status).toBe('completed');
    expect(queue[0].result).toEqual({ result: 'success' });
  });

  test('should search queue by status', async () => {
    const pending: QueueEntry = {
      id: 'search-pending',
      command: 'test',
      status: 'pending',
      timestamp: Date.now(),
      metadata: {},
    };

    const failed: QueueEntry = {
      id: 'search-failed',
      command: 'test',
      status: 'failed',
      timestamp: Date.now(),
      metadata: {},
    };

    await QueueStorageService.addToQueue(pending);
    await QueueStorageService.addToQueue(failed);

    const pendingEntries = await QueueStorageService.searchQueue({ status: 'pending' });
    expect(pendingEntries).toHaveLength(1);
    expect(pendingEntries[0].status).toBe('pending');

    const failedEntries = await QueueStorageService.searchQueue({ status: 'failed' });
    expect(failedEntries).toHaveLength(1);
    expect(failedEntries[0].status).toBe('failed');
  });

  test('should export and import queue', async () => {
    const entry: QueueEntry = {
      id: 'export-1',
      command: 'test',
      status: 'pending',
      timestamp: Date.now(),
      metadata: {},
    };

    await QueueStorageService.addToQueue(entry);

    const exported = await QueueStorageService.exportQueue();
    expect(exported).toBeTruthy();

    await QueueStorageService.clearAllQueue();
    const emptyQueue = await QueueStorageService.getQueue();
    expect(emptyQueue).toHaveLength(0);

    const imported = await QueueStorageService.importQueue(exported!, false);
    expect(imported).toBe(true);

    const importedQueue = await QueueStorageService.getQueue();
    expect(importedQueue).toHaveLength(1);
    expect(importedQueue[0].id).toBe('export-1');
  });

  test('should get queue statistics', async () => {
    const pending: QueueEntry = {
      id: 'stat-pending',
      command: 'test',
      status: 'pending',
      timestamp: Date.now(),
      metadata: {},
    };

    const completed: QueueEntry = {
      id: 'stat-completed',
      command: 'test',
      status: 'completed',
      timestamp: Date.now(),
      metadata: {},
    };

    const failed: QueueEntry = {
      id: 'stat-failed',
      command: 'test',
      status: 'failed',
      timestamp: Date.now(),
      metadata: {},
    };

    await QueueStorageService.addToQueue(pending);
    await QueueStorageService.addToQueue(completed);
    await QueueStorageService.addToQueue(failed);

    const stats = await QueueStorageService.getQueueStats();
    expect(stats.total).toBe(3);
    expect(stats.pending).toBe(1);
    expect(stats.completed).toBe(1);
    expect(stats.failed).toBe(1);
  });

  test('should retry failed entry', async () => {
    const entry: QueueEntry = {
      id: 'retry-1',
      command: 'test',
      status: 'failed',
      timestamp: Date.now(),
      error: 'Test error',
      metadata: {},
    };

    await QueueStorageService.addToQueue(entry);

    const retried = await QueueStorageService.retryEntry('retry-1');
    expect(retried).toBe(true);

    const queue = await QueueStorageService.getQueue();
    expect(queue[0].status).toBe('pending');
    expect(queue[0].error).toBeUndefined();
    expect(queue[0].metadata.retryCount).toBe(1);
  });

  test('should clear completed entries', async () => {
    const pending: QueueEntry = {
      id: 'clear-pending',
      command: 'test',
      status: 'pending',
      timestamp: Date.now(),
      metadata: {},
    };

    const completed: QueueEntry = {
      id: 'clear-completed',
      command: 'test',
      status: 'completed',
      timestamp: Date.now(),
      metadata: {},
    };

    await QueueStorageService.addToQueue(pending);
    await QueueStorageService.addToQueue(completed);

    const deletedCount = await QueueStorageService.clearCompleted();
    expect(deletedCount).toBe(1);

    const queue = await QueueStorageService.getQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0].status).toBe('pending');
  });
});
