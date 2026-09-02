/**
 * Color Harmony Engine for Menswear Styling
 * Computes color wheel relationships: Monochromatic, Complementary, Analogous, and Seasonal Palettes.
 */

export class ColorHarmonyEngine {
  static HEX_TO_RGB(hex) {
    const clean = hex.replace("#", "");
    if (clean.length === 3) {
      return {
        r: parseInt(clean[0] + clean[0], 16),
        g: parseInt(clean[1] + clean[1], 16),
        b: parseInt(clean[2] + clean[2], 16),
      };
    }
    return {
      r: parseInt(clean.substring(0, 2), 16) || 0,
      g: parseInt(clean.substring(2, 4), 16) || 0,
      b: parseInt(clean.substring(4, 6), 16) || 0,
    };
  }

  static RGB_TO_HSL(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }

    return {
      h: Math.round(h * 360),
      s: Number((s * 100).toFixed(1)),
      l: Number((l * 100).toFixed(1)),
    };
  }

  static evaluateHarmony(hex1, hex2) {
    const rgb1 = this.HEX_TO_RGB(hex1);
    const rgb2 = this.HEX_TO_RGB(hex2);
    const hsl1 = this.RGB_TO_HSL(rgb1.r, rgb1.g, rgb1.b);
    const hsl2 = this.RGB_TO_HSL(rgb2.r, rgb2.g, rgb2.b);

    const hueDiff = Math.abs(hsl1.h - hsl2.h);
    const minHueDiff = Math.min(hueDiff, 360 - hueDiff);

    // Monochromatic (similar hue, variance in lightness)
    if (minHueDiff <= 15) {
      return { rule: "Monochromatic", score: 0.95, advice: "Tonal pairing with clean contrast" };
    }
    // Analogous (adjacent colors on wheel, 15 to 45 deg)
    if (minHueDiff > 15 && minHueDiff <= 45) {
      return { rule: "Analogous", score: 0.9, advice: "Harmonious adjacent tones for a refined aesthetic" };
    }
    // Complementary (opposing colors on wheel, 150 to 180 deg)
    if (minHueDiff >= 150 && minHueDiff <= 180) {
      return { rule: "Complementary", score: 0.85, advice: "Bold contrast; anchor with neutral base" };
    }

    // Neutral base handling (low saturation)
    if (hsl1.s <= 15 || hsl2.s <= 15) {
      return { rule: "Neutral-Accent", score: 0.92, advice: "Classic versatile neutral grounding" };
    }

    return { rule: "Custom-Blend", score: 0.75, advice: "Dynamic color balance" };
  }

  static getSeasonalPalette(season) {
    const palettes = {
      autumn: ["#2B1B17", "#8B4513", "#D2691E", "#556B2F", "#F4A460"],
      winter: ["#000000", "#191970", "#4682B4", "#708090", "#FFFFFF"],
      spring: ["#1C39BB", "#3CB371", "#FFD700", "#F0E68C", "#E6E6FA"],
      summer: ["#4A6B82", "#7B904B", "#B8C5D6", "#E8ECEF", "#D8BFD8"],
    };
    return palettes[season.toLowerCase()] || palettes.autumn;
  }
}
