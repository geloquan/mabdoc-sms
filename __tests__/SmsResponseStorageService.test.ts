/**
 * @format
 */

import SmsResponseStorageService from '../src/services/SmsResponseStorageService';
import { SmsResponse } from '../src/types';

describe('SmsResponseStorageService', () => {
  beforeEach(async () => {
    // Clear responses before each test
    await SmsResponseStorageService.clearAllResponses();
  });

  test('should add and retrieve SMS responses', async () => {
    const response: SmsResponse = {
      id: 'test-1',
      timestamp: Date.now(),
      jobId: 123,
      phoneNumber: '+1234567890',
      message: 'Test message',
      status: 'success',
      metadata: {
        duration: 100,
        priority: 1,
      },
    };

    const added = await SmsResponseStorageService.addResponse(response);
    expect(added).toBe(true);

    const responses = await SmsResponseStorageService.getResponses();
    expect(responses).toHaveLength(1);
    expect(responses[0]).toEqual(response);
  });

  test('should search responses by status', async () => {
    const successResponse: SmsResponse = {
      id: 'success-1',
      timestamp: Date.now(),
      jobId: 1,
      phoneNumber: '+1234567890',
      message: 'Test',
      status: 'success',
      metadata: {},
    };

    const failedResponse: SmsResponse = {
      id: 'failed-1',
      timestamp: Date.now(),
      status: 'failed',
      error: 'Network error',
      metadata: {},
    };

    await SmsResponseStorageService.addResponse(successResponse);
    await SmsResponseStorageService.addResponse(failedResponse);

    const successResults = await SmsResponseStorageService.searchResponses({
      status: 'success',
    });
    expect(successResults).toHaveLength(1);
    expect(successResults[0].id).toBe('success-1');

    const failedResults = await SmsResponseStorageService.searchResponses({
      status: 'failed',
    });
    expect(failedResults).toHaveLength(1);
    expect(failedResults[0].id).toBe('failed-1');
  });

  test('should get correct statistics', async () => {
    const responses: SmsResponse[] = [
      {
        id: 'r1',
        timestamp: Date.now(),
        status: 'success',
        metadata: {},
      },
      {
        id: 'r2',
        timestamp: Date.now(),
        status: 'success',
        metadata: {},
      },
      {
        id: 'r3',
        timestamp: Date.now(),
        status: 'failed',
        metadata: {},
      },
      {
        id: 'r4',
        timestamp: Date.now(),
        status: 'no_job',
        metadata: {},
      },
    ];

    for (const response of responses) {
      await SmsResponseStorageService.addResponse(response);
    }

    const stats = await SmsResponseStorageService.getResponseStats();
    expect(stats.total).toBe(4);
    expect(stats.successCount).toBe(2);
    expect(stats.failedCount).toBe(1);
    expect(stats.noJobCount).toBe(1);
  });

  test('should clear all responses', async () => {
    const response: SmsResponse = {
      id: 'test-1',
      timestamp: Date.now(),
      status: 'success',
      metadata: {},
    };

    await SmsResponseStorageService.addResponse(response);
    const responses = await SmsResponseStorageService.getResponses();
    expect(responses).toHaveLength(1);

    await SmsResponseStorageService.clearAllResponses();
    const emptyResponses = await SmsResponseStorageService.getResponses();
    expect(emptyResponses).toHaveLength(0);
  });

  test('should export and import responses', async () => {
    const response: SmsResponse = {
      id: 'test-1',
      timestamp: Date.now(),
      jobId: 123,
      phoneNumber: '+1234567890',
      message: 'Test message',
      status: 'success',
      metadata: {},
    };

    await SmsResponseStorageService.addResponse(response);
    const exported = await SmsResponseStorageService.exportResponses();
    expect(exported).toBeTruthy();

    await SmsResponseStorageService.clearAllResponses();
    const imported = await SmsResponseStorageService.importResponses(exported!, false);
    expect(imported).toBe(true);

    const responses = await SmsResponseStorageService.getResponses();
    expect(responses).toHaveLength(1);
    expect(responses[0].id).toBe('test-1');
  });
});
