import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { ColorHarmonyMatcher } from '../src/utils/color_harmony_matcher.js';

describe('ColorHarmonyMatcher Test Suite', () => {
  test('neutral colors pair with high compatibility', () => {
    const res = ColorHarmonyMatcher.evaluatePairHarmony('charcoal', 'olive');
    assert.strictEqual(res.harmonyType, 'NEUTRAL_ACCENT');
    assert.strictEqual(res.compatibilityScore, 95);
  });

  test('navy and camel exhibit high-contrast complementary harmony', () => {
    // navy (215) and camel (35) -> diff = 180 (exact complementary)
    const res = ColorHarmonyMatcher.evaluatePairHarmony('navy', 'camel');
    assert.strictEqual(res.harmonyType, 'COMPLEMENTARY');
    assert.strictEqual(res.compatibilityScore, 90);
  });

  test('adjacent hues exhibit analogous harmony', () => {
    // rust (20) and camel (35) -> diff = 15 (analogous)
    const res = ColorHarmonyMatcher.evaluatePairHarmony('rust', 'camel');
    assert.strictEqual(res.harmonyType, 'ANALOGOUS');
    assert.strictEqual(res.compatibilityScore, 85);
  });
});
