"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { createServer, safeStaticPath } = require("../server");

function listen(server) {
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve(server.address().port));
  });
}

test("static path resolver blocks traversal", () => {
  const publicDir = path.join(process.cwd(), "public");
  assert.equal(safeStaticPath(publicDir, "/../../secret.txt"), null);
  assert.equal(safeStaticPath(publicDir, "/../publicity/secret.txt"), null);
  assert.equal(safeStaticPath(publicDir, "/%zz"), null);
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

    const crossOriginBlocked = await fetch(`${base}/api/recommendations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": session.csrfToken,
        Cookie: cookie,
        Origin: "https://malicious.example"
      },
      body: JSON.stringify({ profile: {} })
    });
    assert.equal(crossOriginBlocked.status, 403);
    assert.equal((await crossOriginBlocked.json()).error, "bad_origin");

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

test("session endpoint tolerates malformed cookie encoding", async () => {
  const server = createServer();
  const port = await listen(server);
  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/session`, {
      headers: { Cookie: "dressright_session=%zz; theme=dark" }
    });
    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.ok(payload.csrfToken);
    assert.match(response.headers.get("set-cookie"), /dressright_session=/);
  } finally {
    server.close();
  }
});
