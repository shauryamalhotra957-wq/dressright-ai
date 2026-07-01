"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { calculateCapsulePrice } = require("../server/lib/pricing");

test("pricing includes service, tax, shipping, and alteration lines", () => {
  const pricing = calculateCapsulePrice(
    [
      { price: 248 },
      { price: 96 },
      { price: 128 }
    ],
    "hybrid"
  );
  assert.equal(pricing.subtotal, 472);
  assert.equal(pricing.stylingFee, 79);
  assert.equal(pricing.shipping, 18);
  assert.ok(pricing.taxEstimate > 0);
  assert.equal(pricing.lines.length, 5);
});

test("shipping is free above capsule threshold", () => {
  const pricing = calculateCapsulePrice([{ price: 600 }], "ai");
  assert.equal(pricing.shipping, 0);
});
