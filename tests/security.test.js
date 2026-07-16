"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  enforceRateLimit,
  pruneExpiredRateBuckets
} = require("../server/lib/security");

function responseStub() {
  return {
    writeHead() {},
    end() {}
  };
}

test("expired rate-limit buckets are removed from server state", () => {
  const req = {
    socket: { remoteAddress: "rate-limit-cleanup-test" },
    url: "/api/health"
  };

  assert.equal(enforceRateLimit(req, responseStub(), 1), true);
  assert.equal(enforceRateLimit(req, responseStub(), 1), false);

  const removed = pruneExpiredRateBuckets(Date.now() + 60_001);
  assert.equal(removed, 1);
  assert.equal(enforceRateLimit(req, responseStub(), 1), true);
});
