import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { AppCircuitBreaker, AppCircuitOpenError, resilientAppExecute } from '../src/utils/appResilience.mjs';

describe('Application Resilience Unit & Boundary Suite', () => {
  test('AppCircuitBreaker opens on consecutive network failures', () => {
    const cb = new AppCircuitBreaker({ failureThreshold: 3, recoveryTimeoutMs: 100 });
    assert.equal(cb.state, 'CLOSED');
    assert.equal(cb.canExecute(), true);

    cb.recordFailure();
    cb.recordFailure();
    assert.equal(cb.state, 'CLOSED');

    cb.recordFailure();
    assert.equal(cb.state, 'OPEN');
    assert.equal(cb.canExecute(), false);
  });

  test('AppCircuitBreaker transitions to HALF_OPEN after timeout and recovers', async () => {
    const cb = new AppCircuitBreaker({ failureThreshold: 2, recoveryTimeoutMs: 50 });
    cb.recordFailure();
    cb.recordFailure();
    assert.equal(cb.state, 'OPEN');

    await new Promise((r) => setTimeout(r, 60));
    assert.equal(cb.canExecute(), true);
    assert.equal(cb.state, 'HALF_OPEN');

    cb.recordSuccess();
    assert.equal(cb.state, 'CLOSED');
  });

  test('resilientAppExecute smoothly degrades to local cache fallback', async () => {
    let attempts = 0;
    const networkSync = async () => {
      attempts += 1;
      throw new Error('503 Service Unavailable');
    };

    const localCacheFallback = { source: 'LOCAL_ENCRYPTED_CACHE', data: ['item1', 'item2'] };
    const res = await resilientAppExecute(networkSync, {
      fallback: () => localCacheFallback,
      maxRetries: 3,
      baseDelayMs: 5
    });

    assert.equal(attempts, 3);
    assert.deepEqual(res, localCacheFallback);
  });

  test('resilientAppExecute succeeds on primary execution path', async () => {
    const liveData = { source: 'CLOUD_ACTIVE', synced: true };
    const res = await resilientAppExecute(async () => liveData);
    assert.deepEqual(res, liveData);
  });
});
