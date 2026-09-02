import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ColorHarmonyEngine } from "../server/lib/colorHarmony.js";

describe("ColorHarmonyEngine", () => {
  it("converts hex to RGB and HSL correctly", () => {
    const rgb = ColorHarmonyEngine.HEX_TO_RGB("#ffffff");
    assert.deepEqual(rgb, { r: 255, g: 255, b: 255 });

    const hsl = ColorHarmonyEngine.RGB_TO_HSL(255, 0, 0);
    assert.equal(hsl.h, 0);
    assert.equal(hsl.s, 100);
    assert.equal(hsl.l, 50);
  });

  it("identifies monochromatic and neutral pairings", () => {
    // Neutral charcoal + Navy
    const neutralEval = ColorHarmonyEngine.evaluateHarmony("#222222", "#191970");
    assert.equal(neutralEval.rule, "Neutral-Accent");
    assert.ok(neutralEval.score >= 0.9);

    // Monochromatic navies
    const monoEval = ColorHarmonyEngine.evaluateHarmony("#1a2a40", "#2c4870");
    assert.equal(monoEval.rule, "Monochromatic");
    assert.ok(monoEval.score >= 0.9);
  });

  it("identifies complementary contrast", () => {
    // Blue (240) and Amber/Orange (60)
    const compEval = ColorHarmonyEngine.evaluateHarmony("#0000ff", "#ffaa00");
    assert.ok(["Complementary", "Custom-Blend"].includes(compEval.rule));
    assert.ok(compEval.score > 0.7);
  });

  it("returns seasonal palette arrays", () => {
    const autumn = ColorHarmonyEngine.getSeasonalPalette("autumn");
    assert.ok(Array.isArray(autumn));
    assert.equal(autumn.length, 5);
  });
});
