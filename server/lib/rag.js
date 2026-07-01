"use strict";

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "be",
  "but",
  "by",
  "for",
  "from",
  "i",
  "in",
  "is",
  "it",
  "like",
  "me",
  "my",
  "of",
  "on",
  "or",
  "that",
  "the",
  "to",
  "with"
]);

function tokenize(input) {
  return String(input || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

function textForDoc(doc) {
  return [doc.title, doc.summary, ...(doc.tags || []), ...(doc.advice || [])].join(" ");
}

function textForItem(item) {
  return [
    item.name,
    item.category,
    item.why,
    item.fit,
    item.care,
    ...(item.colors || []),
    ...(item.tags || [])
  ].join(" ");
}

function scoreTokens(queryTokens, candidateTokens, boostedTerms = []) {
  if (queryTokens.length === 0) return 0;
  const counts = new Map();
  for (const token of candidateTokens) counts.set(token, (counts.get(token) || 0) + 1);
  let score = 0;
  for (const token of queryTokens) score += counts.get(token) || 0;
  for (const term of boostedTerms) {
    const normalized = String(term || "").toLowerCase();
    if (normalized && counts.has(normalized)) score += 2.5;
  }
  return score / Math.sqrt(candidateTokens.length || 1);
}

function buildQuery(profile = {}) {
  return [
    profile.styleMode,
    profile.serviceMode,
    profile.colorComfort,
    profile.favoriteStyleIcon,
    profile.budget,
    profile.fitGoal,
    profile.careTolerance,
    ...(profile.occasions || []),
    ...(profile.colors || [])
  ].join(" ");
}

function retrieveStyleIntel({ profile, knowledgeDocs, catalog, limit = 4 }) {
  const query = buildQuery(profile);
  const queryTokens = tokenize(query);
  const boosted = [
    profile.styleMode,
    profile.colorComfort,
    profile.fitGoal,
    profile.careTolerance,
    ...(profile.occasions || []),
    ...(profile.colors || [])
  ];

  const docs = knowledgeDocs
    .map((doc) => ({
      ...doc,
      score: scoreTokens(queryTokens, tokenize(textForDoc(doc)), boosted)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  const items = catalog
    .map((item) => ({
      ...item,
      score: scoreTokens(queryTokens, tokenize(textForItem(item)), boosted)
    }))
    .sort((a, b) => b.score - a.score || a.price - b.price);

  return {
    query,
    docs,
    items
  };
}

module.exports = {
  tokenize,
  retrieveStyleIntel
};
