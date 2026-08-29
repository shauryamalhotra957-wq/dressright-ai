"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { calculateCapsulePrice } = require("../server/lib/pricing");

test("pricing ignores negative and non-finite catalog prices", () => {
  const result = calculateCapsulePrice([
    { price: 100 },
    { price: -50 },
    { price: Number.NaN },
    { price: Infinity }
  ], "ai");
  assert.equal(result.subtotal, 100);
  assert.ok(Number.isFinite(result.total));
});
