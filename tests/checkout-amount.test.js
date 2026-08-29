"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { resolveCheckoutAmount } = require("../server");

test("checkout accepts only the server-priced recommendation amount", () => {
  const session = { recommendation: { pricing: { total: 512 } } };
  assert.deepEqual(resolveCheckoutAmount({ total: 512 }, session), { ok: true, amount: 512 });
  assert.equal(resolveCheckoutAmount({ total: 1 }, session).error, "amount_mismatch");
  assert.equal(resolveCheckoutAmount({}, {}).error, "recommendation_required");
});
