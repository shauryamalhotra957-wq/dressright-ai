"use strict";

const crypto = require("crypto");

const sessions = new Map();
const rateBuckets = new Map();
const WINDOW_MS = 60_000;

function randomToken(bytes = 24) {
  return crypto.randomBytes(bytes).toString("base64url");
}

function parseCookies(header = "") {
  return Object.fromEntries(
    String(header)
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf("=");
        if (index === -1) return [part, ""];
        return [decodeURIComponent(part.slice(0, index)), decodeURIComponent(part.slice(index + 1))];
      })
  );
}

function setSecurityHeaders(res) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  res.setHeader(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self'",
      "img-src 'self' data: blob:",
      "connect-src 'self'",
      "font-src 'self'",
      "object-src 'none'",
      "base-uri 'none'",
      "frame-ancestors 'none'",
      "form-action 'self'"
    ].join("; ")
  );
}

function getClientKey(req) {
  return `${req.socket.remoteAddress || "local"}:${req.url.split("?")[0]}`;
}

function enforceRateLimit(req, res, limit = 120) {
  const now = Date.now();
  const key = getClientKey(req);
  const bucket = rateBuckets.get(key);
  if (!bucket || now - bucket.started > WINDOW_MS) {
    rateBuckets.set(key, { started: now, count: 1 });
    return true;
  }
  bucket.count += 1;
  if (bucket.count > limit) {
    res.writeHead(429, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "rate_limited", message: "Too many requests. Please wait a minute." }));
    return false;
  }
  return true;
}

function getSession(req, res) {
  const cookies = parseCookies(req.headers.cookie);
  const existing = cookies.dressright_session;
  if (existing && sessions.has(existing)) {
    const session = sessions.get(existing);
    session.lastSeen = Date.now();
    return session;
  }
  const id = randomToken();
  const session = {
    id,
    csrf: randomToken(),
    upload: null,
    createdAt: Date.now(),
    lastSeen: Date.now()
  };
  sessions.set(id, session);
  res.setHeader(
    "Set-Cookie",
    `dressright_session=${encodeURIComponent(id)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=7200`
  );
  return session;
}

function sameOriginAllowed(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  const host = req.headers.host;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

function requireCsrf(req, res, session) {
  if (!sameOriginAllowed(req)) {
    res.writeHead(403, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "bad_origin", message: "Cross-origin writes are blocked." }));
    return false;
  }
  const submitted = req.headers["x-csrf-token"];
  if (!submitted || submitted !== session.csrf) {
    res.writeHead(403, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "csrf_failed", message: "Security token missing or invalid." }));
    return false;
  }
  return true;
}

function writeJson(res, status, payload, extraHeaders = {}) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", ...extraHeaders });
  res.end(JSON.stringify(payload));
}

function readBody(req, maxBytes) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    req.on("data", (chunk) => {
      total += chunk.length;
      if (total > maxBytes) {
        reject(Object.assign(new Error("request_too_large"), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function cleanExpiredState() {
  const cutoff = Date.now() - 2 * 60 * 60 * 1000;
  for (const [id, session] of sessions) {
    if (session.lastSeen < cutoff) sessions.delete(id);
  }
}

module.exports = {
  cleanExpiredState,
  enforceRateLimit,
  getSession,
  readBody,
  requireCsrf,
  setSecurityHeaders,
  writeJson
};
