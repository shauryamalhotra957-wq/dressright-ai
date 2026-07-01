"use strict";

const { retrieveStyleIntel } = require("./rag");
const { calculateCapsulePrice } = require("./pricing");

const ALLOWED_STYLE_MODES = new Set(["minimal", "executive", "creative", "date", "travel"]);
const ALLOWED_SERVICE_MODES = new Set(["ai", "hybrid", "concierge"]);
const ALLOWED_CARE = new Set(["very-low", "normal", "fine-with-tailoring"]);
const ALLOWED_FIT = new Set(["slimmer", "balanced", "relaxed"]);

const CATEGORY_ORDER = ["jacket", "shirt", "trouser", "shoe", "accessory", "outerwear"];

function scrubText(value, max = 80) {
  return String(value || "")
    .replace(/[<>]/g, "")
    .replace(/\b(ignore|override|system prompt|developer message|jailbreak|exfiltrate|malware|password)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function sanitizeProfile(raw = {}) {
  const occasions = Array.isArray(raw.occasions) ? raw.occasions : [];
  const colors = Array.isArray(raw.colors) ? raw.colors : [];
  const styleMode = ALLOWED_STYLE_MODES.has(raw.styleMode) ? raw.styleMode : "minimal";
  const serviceMode = ALLOWED_SERVICE_MODES.has(raw.serviceMode) ? raw.serviceMode : "hybrid";
  const careTolerance = ALLOWED_CARE.has(raw.careTolerance) ? raw.careTolerance : "very-low";
  const fitGoal = ALLOWED_FIT.has(raw.fitGoal) ? raw.fitGoal : "balanced";
  const budget = Math.max(350, Math.min(2500, Number(raw.budget) || 900));

  return {
    styleMode,
    serviceMode,
    careTolerance,
    fitGoal,
    budget,
    favoriteStyleIcon: scrubText(raw.favoriteStyleIcon, 64),
    height: scrubText(raw.height, 20),
    waist: scrubText(raw.waist, 12),
    shoe: scrubText(raw.shoe, 12),
    occasions: occasions.map((item) => scrubText(item, 32)).filter(Boolean).slice(0, 6),
    colors: colors.map((item) => scrubText(item, 24)).filter(Boolean).slice(0, 5)
  };
}

function chooseCapsuleItems(retrievedItems, budget) {
  const chosen = [];
  const seen = new Set();

  for (const category of CATEGORY_ORDER) {
    const candidate = retrievedItems.find((item) => item.category === category && !seen.has(item.id));
    if (candidate) {
      chosen.push(candidate);
      seen.add(candidate.id);
    }
  }

  for (const item of retrievedItems) {
    if (chosen.length >= 7) break;
    const projected = chosen.reduce((sum, current) => sum + current.price, 0) + item.price;
    if (!seen.has(item.id) && (projected <= budget * 1.05 || chosen.length < 5)) {
      chosen.push(item);
      seen.add(item.id);
    }
  }

  return chosen.slice(0, 7);
}

function buildColorStory(profile, items) {
  const colors = Array.from(new Set(items.flatMap((item) => item.colors || []))).slice(0, 5);
  const preferred = profile.colors.length ? profile.colors : colors;
  return {
    base: preferred.slice(0, 3),
    accent: colors.find((color) => !preferred.includes(color)) || "oxblood",
    note: "Everything can be worn in at least three pairings, so getting dressed becomes a default path instead of a decision tree."
  };
}

function buildRecommendation({ rawProfile, uploadReport, knowledgeDocs, catalog }) {
  const profile = sanitizeProfile(rawProfile);
  const retrieved = retrieveStyleIntel({ profile, knowledgeDocs, catalog, limit: 4 });
  const items = chooseCapsuleItems(retrieved.items, profile.budget);
  const pricing = calculateCapsulePrice(items, profile.serviceMode);
  const colorStory = buildColorStory(profile, items);
  const mainDoc = retrieved.docs[0];
  const formulaItems = {
    jacket: items.find((item) => item.category === "jacket"),
    shirt: items.find((item) => item.category === "shirt"),
    trouser: items.find((item) => item.category === "trouser"),
    shoe: items.find((item) => item.category === "shoe")
  };

  return {
    id: `rec_${Date.now().toString(36)}`,
    profile,
    upload: uploadReport
      ? {
          id: uploadReport.id,
          name: uploadReport.name,
          kind: uploadReport.kind,
          retained: false,
          note: "Photo was validated and summarized for this session; the binary image is not retained by the demo server."
        }
      : null,
    headline: profile.favoriteStyleIcon
      ? `A ${profile.styleMode} capsule with ${profile.favoriteStyleIcon}-level polish`
      : `A ${profile.styleMode} capsule for low-effort polish`,
    verdict: mainDoc ? mainDoc.summary : "A compact capsule wardrobe will reduce decisions while improving fit and consistency.",
    colorStory,
    outfitFormulas: [
      `${formulaItems.jacket?.name || "Jacket"} + ${formulaItems.shirt?.name || "shirt"} + ${formulaItems.trouser?.name || "trouser"} + ${formulaItems.shoe?.name || "shoe"}`,
      `${formulaItems.shirt?.name || "Knit"} + ${items.find((item) => item.category === "outerwear")?.name || "weather layer"} + ${formulaItems.trouser?.name || "trouser"}`,
      `${items.find((item) => item.category === "accessory")?.name || "quiet accessory"} added only when the outfit needs intention`
    ],
    fitPlan: [
      profile.height ? `Use stated height (${profile.height}) to narrow jacket length and trouser inseam.` : "Collect height before purchase to reduce return risk.",
      profile.waist ? `Start trouser search at waist ${profile.waist}; reserve alterations for break and taper.` : "Confirm waist before checkout and prefer brands with free exchanges.",
      profile.shoe ? `Order shoes around size ${profile.shoe} with one backup size when return shipping is free.` : "Confirm shoe size before buying leather shoes."
    ],
    carePlan:
      profile.careTolerance === "very-low"
        ? "Prioritize machine-washable trousers, wipe-clean shoes, and layers that do not need pressing."
        : "Allow one tailoring pass and occasional dry cleaning for the highest-polish pieces.",
    sources: retrieved.docs.map((doc) => ({
      id: doc.id,
      title: doc.title,
      score: Number(doc.score.toFixed(3))
    })),
    items,
    pricing,
    nextActions: [
      "Approve the capsule",
      "Confirm size and delivery address in hosted checkout",
      "Human stylist swaps any out-of-stock items before purchase",
      "Ship all approved pieces together with return labels"
    ],
    safeguards: [
      "RAG sources are curated style documents and catalog records, not raw user prompt instructions.",
      "The uploaded photo binary is validated and discarded after session summarization.",
      "Payment is designed for a hosted checkout provider so card data never touches this app server."
    ]
  };
}

module.exports = {
  sanitizeProfile,
  buildRecommendation
};
