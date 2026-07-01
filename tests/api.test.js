"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { createServer, safeStaticPath } = require("../server");

function listen(server) {
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve(server.address().port));
  });
}

test("static path resolver blocks traversal", () => {
  const publicDir = process.cwd();
  assert.equal(safeStaticPath(publicDir, "/../../secret.txt"), null);
});

test("API session, CSRF, and recommendation flow", async () => {
  const server = createServer();
  const port = await listen(server);
  const base = `http://127.0.0.1:${port}`;
  try {
    const sessionResponse = await fetch(`${base}/api/session`);
    const cookie = sessionResponse.headers.get("set-cookie");
    const session = await sessionResponse.json();
    assert.ok(session.csrfToken);

    const blocked = await fetch(`${base}/api/recommendations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie
      },
      body: JSON.stringify({ profile: {} })
    });
    assert.equal(blocked.status, 403);

    const recommendationResponse = await fetch(`${base}/api/recommendations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": session.csrfToken,
        Cookie: cookie
      },
      body: JSON.stringify({
        profile: {
          styleMode: "travel",
          serviceMode: "ai",
          occasions: ["travel"],
          colors: ["olive"],
          budget: 850
        }
      })
    });
    assert.equal(recommendationResponse.status, 200);
    const data = await recommendationResponse.json();
    assert.equal(data.ok, true);
    assert.ok(data.recommendation.pricing.total > 0);
  } finally {
    server.close();
  }
});
