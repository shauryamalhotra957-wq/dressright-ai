"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { escapeHtml, validatePhotoFile } = require("../public/app");

const html = readFileSync("public/index.html", "utf8");

test("escapeHtml encodes dynamic UI error text", () => {
  assert.equal(escapeHtml(`<img src=x onerror="alert('x')">`), "&lt;img src=x onerror=&quot;alert(&#39;x&#39;)&quot;&gt;");
});

test("validatePhotoFile blocks unsupported and oversized selections before upload", () => {
  assert.equal(validatePhotoFile({ type: "image/png", size: 1024 }).ok, true);
  assert.equal(validatePhotoFile({ type: "image/svg+xml", size: 1024 }).message, "Only PNG, JPG, or WebP photos are accepted.");
  assert.equal(validatePhotoFile({ type: "image/jpeg", size: 6 * 1024 * 1024 }, 5 * 1024 * 1024).message, "Photo is larger than the 5 MB limit.");
});

test("upload and API status updates are exposed to assistive tech", () => {
  assert.match(html, /id="apiStatus"[^>]*role="status"[^>]*aria-live="polite"/);
  assert.match(html, /id="uploadMeta"[^>]*aria-live="polite"/);
});
