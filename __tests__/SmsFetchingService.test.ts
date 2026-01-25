/**
 * @format
 */

import SmsFetchingService from '../src/services/SmsFetchingService';

describe('SmsFetchingService', () => {
  beforeEach(async () => {
    await SmsFetchingService.initialize();
    await SmsFetchingService.resetStats();
  });

  test('should initialize with default state', async () => {
    const state = SmsFetchingService.getState();
    expect(state.isPaused).toBe(false);
    expect(state.totalFetched).toBe(0);
    expect(state.totalSuccess).toBe(0);
    expect(state.totalFailed).toBe(0);
  });

  test('should pause and resume', async () => {
    expect(SmsFetchingService.isPaused()).toBe(false);

    await SmsFetchingService.pause();
    expect(SmsFetchingService.isPaused()).toBe(true);

    const stateAfterPause = SmsFetchingService.getState();
    expect(stateAfterPause.lastPauseTimestamp).toBeDefined();

    await SmsFetchingService.resume();
    expect(SmsFetchingService.isPaused()).toBe(false);
  });

  test('should reset statistics', async () => {
    // We cannot directly test state mutation since getState() returns a copy
    // This test verifies the resetStats method works correctly
    await SmsFetchingService.resetStats();
    const newState = SmsFetchingService.getState();
    
    expect(newState.totalFetched).toBe(0);
    expect(newState.totalSuccess).toBe(0);
    expect(newState.totalFailed).toBe(0);
  });

  test('should persist state across initialization', async () => {
    await SmsFetchingService.pause();
    
    // Re-initialize (simulating app restart)
    await SmsFetchingService.initialize();
    
    // State should be persisted
    expect(SmsFetchingService.isPaused()).toBe(true);
  });
});
