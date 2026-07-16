"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { publicId } = require("../server/lib/ids");

test("publicId creates prefixed cryptographic identifiers", () => {
  const first = publicId("ord");
  const second = publicId("ord");

  assert.match(first, /^ord_[a-f0-9]{32}$/);
  assert.match(second, /^ord_[a-f0-9]{32}$/);
  assert.notEqual(first, second);
});

test("publicId rejects malformed prefixes", () => {
  assert.throws(() => publicId("../order"), /invalid_id_prefix/);
});
