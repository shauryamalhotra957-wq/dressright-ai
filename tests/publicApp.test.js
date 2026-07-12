"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { escapeHtml } = require("../public/app");

test("escapeHtml encodes dynamic UI error text", () => {
  assert.equal(escapeHtml(`<img src=x onerror="alert('x')">`), "&lt;img src=x onerror=&quot;alert(&#39;x&#39;)&quot;&gt;");
});
