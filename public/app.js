"use strict";

const state = {
  csrfToken: null,
  latestRecommendation: null,
  maxUploadBytes: 5 * 1024 * 1024,
  previewUrl: null
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));
const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const EMPTY_RECOMMENDATION_HTML = `
  <strong>Ready when your photo is.</strong>
  <span>The recommendation engine can run with preferences only, but a photo gives the fit brief more signal.</span>
`;

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };
    return entities[char];
  });
}

function setStatus(text, kind = "neutral") {
  const status = $("#apiStatus");
  status.textContent = text;
  status.dataset.kind = kind;
}

function getEmptyRecommendationState() {
  return {
    title: "Your plan appears here after the first run.",
    solutionClass: "empty-state",
    solutionHtml: EMPTY_RECOMMENDATION_HTML,
    totalPrice: "$0",
    priceLinesHtml: "",
    checkoutDisabled: true,
    checkoutNote: "No checkout yet."
  };
}

function clearRecommendation() {
  const empty = getEmptyRecommendationState();
  state.latestRecommendation = null;
  $("#resultTitle").textContent = empty.title;
  $("#solutionBody").className = empty.solutionClass;
  $("#solutionBody").innerHTML = empty.solutionHtml;
  $("#totalPrice").textContent = empty.totalPrice;
  $("#priceLines").innerHTML = empty.priceLinesHtml;
  $("#checkoutButton").disabled = empty.checkoutDisabled;
  $("#checkoutNote").textContent = empty.checkoutNote;
}

function selectedValues(name) {
  return $$(`input[name="${name}"]:checked`).map((input) => input.value);
}

function validatePhotoFile(file, maxUploadBytes = state.maxUploadBytes) {
  if (!file) return { ok: false, message: "Choose a photo before uploading." };
  const allowedTypes = new Set(["image/png", "image/jpeg", "image/webp"]);
  if (!allowedTypes.has(file.type)) {
    return { ok: false, message: "Only PNG, JPG, or WebP photos are accepted." };
  }
  if (file.size > maxUploadBytes) {
    const limitMb = Math.round(maxUploadBytes / (1024 * 1024));
    return { ok: false, message: `Photo is larger than the ${limitMb} MB limit.` };
  }
  return { ok: true };
}

function collectProfile() {
  return {
    styleMode: $("#styleMode").value,
    serviceMode: $("#serviceMode").value,
    occasions: selectedValues("occasion"),
    colors: selectedValues("color"),
    favoriteStyleIcon: $("#favoriteStyleIcon").value,
    fitGoal: $("#fitGoal").value,
    careTolerance: $("#careTolerance").value,
    height: $("#height").value,
    waist: $("#waist").value,
    shoe: $("#shoe").value,
    budget: Number($("#budget").value)
  };
}

async function api(path, options = {}) {
  const headers = new Headers(options.headers || {});
  if (state.csrfToken && options.method && options.method !== "GET") {
    headers.set("X-CSRF-Token", state.csrfToken);
  }
  const response = await fetch(path, { ...options, headers });
  const data = await response.json();
  if (!response.ok) {
    const message = data.message || data.error || "Request failed";
    throw new Error(message);
  }
  return data;
}

function renderPrice(pricing) {
  $("#totalPrice").textContent = currency.format(pricing.total);
  $("#priceLines").innerHTML = pricing.lines
    .map(
      (line) => `
        <div class="price-line">
          <span>${escapeHtml(line.label)}</span>
          <strong>${currency.format(line.amount)}</strong>
        </div>
      `
    )
    .join("");
}

function renderRecommendation(recommendation) {
  state.latestRecommendation = recommendation;
  $("#resultTitle").textContent = recommendation.headline;
  renderPrice(recommendation.pricing);
  $("#checkoutButton").disabled = false;
  $("#checkoutNote").textContent = recommendation.pricing.service.description;
  $("#fitSignal").textContent = recommendation.upload ? "Photo tuned" : "Preference tuned";
  $("#capsuleDepth").textContent = `${recommendation.items.length} items`;

  const itemCards = recommendation.items
    .map(
      (item) => `
        <article class="item-card">
          <span class="kicker">${escapeHtml(item.category)}</span>
          <h3>${escapeHtml(item.name)}</h3>
          <strong>${currency.format(item.price)}</strong>
          <p>${escapeHtml(item.why)}</p>
          <p><b>Fit:</b> ${escapeHtml(item.fit)}</p>
          <div class="tagline">
            ${(item.colors || []).map((color) => `<span>${escapeHtml(color)}</span>`).join("")}
          </div>
        </article>
      `
    )
    .join("");

  $("#solutionBody").className = "recommendation-summary";
  $("#solutionBody").innerHTML = `
    <div class="summary-grid">
      <div class="summary-tile">
        <span class="kicker">Verdict</span>
        <p>${escapeHtml(recommendation.verdict)}</p>
      </div>
      <div class="summary-tile">
        <span class="kicker">Colors</span>
        <p>${escapeHtml(recommendation.colorStory.base.join(", "))} with ${escapeHtml(recommendation.colorStory.accent)}</p>
      </div>
      <div class="summary-tile">
        <span class="kicker">Photo</span>
        <p>${recommendation.upload ? `${escapeHtml(recommendation.upload.name)} accepted, not retained.` : "No photo uploaded yet."}</p>
      </div>
    </div>
    <div>
      <h3>Capsule items</h3>
      <div class="capsule-grid">${itemCards}</div>
    </div>
    <div class="summary-grid">
      <div class="summary-tile">
        <span class="kicker">Outfit formulas</span>
        <ul class="fit-list">${recommendation.outfitFormulas.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      </div>
      <div class="summary-tile">
        <span class="kicker">Fit plan</span>
        <ul class="fit-list">${recommendation.fitPlan.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      </div>
      <div class="summary-tile">
        <span class="kicker">RAG sources</span>
        <ul class="source-list">${recommendation.sources.map((source) => `<li>${escapeHtml(source.title)}</li>`).join("")}</ul>
      </div>
    </div>
  `;
}

async function uploadPhoto(file) {
  const validation = validatePhotoFile(file);
  if (!validation.ok) {
    $("#uploadMeta").textContent = validation.message;
    setStatus("Upload blocked", "error");
    return;
  }
  setStatus("Scanning", "busy");
  const preview = $("#photoPreview");
  if (state.previewUrl) URL.revokeObjectURL(state.previewUrl);
  state.previewUrl = URL.createObjectURL(file);
  preview.src = state.previewUrl;
  $("#uploadTitle").textContent = file.name;
  $("#uploadMeta").textContent = `${Math.round(file.size / 1024)} KB selected`;
  const data = await api("/api/upload", {
    method: "POST",
    headers: {
      "Content-Type": file.type,
      "X-File-Name": file.name
    },
    body: file
  });
  $("#uploadMeta").textContent = `${data.file.kind.toUpperCase()} accepted. Not retained.`;
  setStatus("Photo accepted", "ok");
}

async function buildCapsule(event) {
  event.preventDefault();
  setStatus("Building", "busy");
  const data = await api("/api/recommendations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ profile: collectProfile() })
  });
  renderRecommendation(data.recommendation);
  setStatus("Capsule ready", "ok");
}

async function checkout() {
  if (!state.latestRecommendation) return;
  $("#checkoutButton").disabled = true;
  $("#checkoutNote").textContent = "Creating checkout...";
  try {
    const data = await api("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recommendationId: state.latestRecommendation.id,
        total: state.latestRecommendation.pricing.total
      })
    });
    $("#checkoutNote").textContent = `Order ${data.orderId} created. Hosted payment would open next.`;
  } catch (error) {
    $("#checkoutNote").textContent = error.message;
    $("#checkoutButton").disabled = false;
  }
}

function resetForm() {
  $("#styleForm").reset();
  $("#budget").value = "900";
  $("#budgetValue").textContent = "$900";
  if (state.previewUrl) URL.revokeObjectURL(state.previewUrl);
  state.previewUrl = null;
  $("#photoPreview").removeAttribute("src");
  $("#uploadTitle").textContent = "Add a full-body or recent outfit photo";
  $("#uploadMeta").textContent = "PNG, JPG, or WebP. Validated before styling.";
  clearRecommendation();
  setStatus(state.csrfToken ? "Secure session" : "Offline", state.csrfToken ? "ok" : "error");
}

async function init() {
  try {
    const session = await api("/api/session");
    state.csrfToken = session.csrfToken;
    state.maxUploadBytes = session.maxUploadBytes || state.maxUploadBytes;
    setStatus("Secure session", "ok");
  } catch {
    setStatus("Offline", "error");
  }

  $("#budget").addEventListener("input", (event) => {
    $("#budgetValue").textContent = currency.format(Number(event.target.value));
  });
  $("#photoInput").addEventListener("change", (event) => {
    uploadPhoto(event.target.files[0]).catch((error) => {
      $("#uploadMeta").textContent = error.message;
      setStatus("Upload blocked", "error");
    });
  });
  $("#styleForm").addEventListener("submit", (event) => {
    buildCapsule(event).catch((error) => {
      setStatus("Try again", "error");
      $("#solutionBody").className = "empty-state";
      $("#solutionBody").innerHTML = `<strong>Could not build capsule.</strong><span>${escapeHtml(error.message)}</span>`;
    });
  });
  $("#checkoutButton").addEventListener("click", checkout);
  $("#resetButton").addEventListener("click", resetForm);
}

if (typeof document !== "undefined") {
  init();
}

if (typeof module !== "undefined") {
  module.exports = { escapeHtml, getEmptyRecommendationState, validatePhotoFile };
}
