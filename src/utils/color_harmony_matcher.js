/**
 * Menswear Color Harmony & Palette Matcher.
 * Evaluates clothing item color pairings using hue angle relationships (complementary, analogous, triadic).
 */
export class ColorHarmonyMatcher {
  static HUE_ANGLES = {
    navy: 215,
    olive: 95,
    burgundy: 345,
    camel: 35,
    charcoal: 0, // Neutral
    white: 0,    // Neutral
    black: 0,    // Neutral
    rust: 20,
    sky: 200,
  };

  static isNeutral(colorName) {
    const neutralSet = new Set(['charcoal', 'white', 'black', 'grey', 'gray', 'cream']);
    return neutralSet.has(colorName.toLowerCase());
  }

  static evaluatePairHarmony(color1, color2) {
    const c1 = color1.toLowerCase().trim();
    const c2 = color2.toLowerCase().trim();

    if (ColorHarmonyMatcher.isNeutral(c1) || ColorHarmonyMatcher.isNeutral(c2)) {
      return { harmonyType: 'NEUTRAL_ACCENT', compatibilityScore: 95, description: 'Neutrals pair seamlessly with all palette shades.' };
    }

    const h1 = ColorHarmonyMatcher.HUE_ANGLES[c1];
    const h2 = ColorHarmonyMatcher.HUE_ANGLES[c2];

    if (h1 === undefined || h2 === undefined) {
      return { harmonyType: 'UNKNOWN', compatibilityScore: 50, description: 'Color not in standard menswear wheel.' };
    }

    const diff = Math.abs(h1 - h2);
    const circularDiff = Math.min(diff, 360 - diff);

    if (circularDiff >= 150 && circularDiff <= 210) {
      return { harmonyType: 'COMPLEMENTARY', compatibilityScore: 90, description: 'High contrast complementary balance.' };
    }

    if (circularDiff <= 45) {
      return { harmonyType: 'ANALOGOUS', compatibilityScore: 85, description: 'Cohesive, low-contrast tonal harmony.' };
    }

    if (circularDiff >= 100 && circularDiff <= 140) {
      return { harmonyType: 'TRIADIC', compatibilityScore: 80, description: 'Dynamic, balanced triadic accent.' };
    }

    return { harmonyType: 'MODERATE_CONTRAST', compatibilityScore: 65, description: 'Wearable contrast with neutral grounding.' };
  }
}
