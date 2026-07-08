"use strict";

const fs = require("fs");
const http = require("http");
const path = require("path");
const { URL } = require("url");

const { MAX_UPLOAD_BYTES, validateImageUpload } = require("./lib/uploads");
const { buildRecommendation } = require("./lib/recommendation");
const {
  cleanExpiredState,
  enforceRateLimit,
  getSession,
  readBody,
  requireCsrf,
  setSecurityHeaders,
  writeJson
} = require("./lib/security");

const ROOT = path.resolve(__dirname, "..");
const DEFAULT_PUBLIC_DIR = path.join(ROOT, "public");
const DEFAULT_DATA_DIR = path.join(ROOT, "data");
const JSON_LIMIT = 32 * 1024;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml"
};

function loadJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function safeStaticPath(publicDir, requestPath) {
  const decoded = decodeURIComponent(requestPath.split("?")[0]);
  const cleanPath = decoded === "/" ? "/index.html" : decoded;
  const publicRoot = path.resolve(publicDir);
  const resolved = path.resolve(publicRoot, `.${cleanPath}`);
  const relative = path.relative(publicRoot, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) return null;
  return resolved;
}

async function readJsonBody(req) {
  const body = await readBody(req, JSON_LIMIT);
  if (body.length === 0) return {};
  return JSON.parse(body.toString("utf8"));
}

function createServer(options = {}) {
  const publicDir = options.publicDir || DEFAULT_PUBLIC_DIR;
  const dataDir = options.dataDir || DEFAULT_DATA_DIR;
  const knowledgeDocs = options.knowledgeDocs || loadJson(path.join(dataDir, "style-knowledge.json"));
  const catalog = options.catalog || loadJson(path.join(dataDir, "catalog.json"));

  return http.createServer(async (req, res) => {
    setSecurityHeaders(res);
    cleanExpiredState();

    if (!enforceRateLimit(req, res, req.url.startsWith("/api/upload") ? 18 : 120)) return;

    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    const session = getSession(req, res);

    try {
      if (req.method === "GET" && url.pathname === "/api/health") {
        return writeJson(res, 200, { ok: true, service: "dressright-ai", timestamp: new Date().toISOString() });
      }

      if (req.method === "GET" && url.pathname === "/api/session") {
        return writeJson(res, 200, {
          csrfToken: session.csrf,
          maxUploadBytes: MAX_UPLOAD_BYTES,
          retainedUploads: false
        });
      }

      if (req.method === "GET" && url.pathname === "/api/style-options") {
        return writeJson(res, 200, {
          styleModes: ["minimal", "executive", "creative", "date", "travel"],
          serviceModes: ["ai", "hybrid", "concierge"],
          colors: ["navy", "charcoal", "white", "olive", "stone", "oxblood", "rust", "black"],
          occasions: ["office", "date", "travel", "weekend", "interview", "wedding"]
        });
      }

      if (req.method === "POST" && url.pathname === "/api/upload") {
        if (!requireCsrf(req, res, session)) return;
        const body = await readBody(req, MAX_UPLOAD_BYTES + 1);
        const validation = validateImageUpload({
          buffer: body,
          contentType: req.headers["content-type"],
          fileName: req.headers["x-file-name"]
        });
        if (!validation.ok) {
          return writeJson(res, validation.status, { error: validation.code, message: validation.message });
        }
        session.upload = validation.file;
        return writeJson(res, 200, {
          ok: true,
          file: validation.file,
          scan: {
            verdict: "accepted",
            retained: false,
            checks: ["MIME allowlist", "magic-byte match", "extension consistency", "active-content marker scan"]
          }
        });
      }

      if (req.method === "POST" && url.pathname === "/api/recommendations") {
        if (!requireCsrf(req, res, session)) return;
        const payload = await readJsonBody(req);
        const recommendation = buildRecommendation({
          rawProfile: payload.profile || {},
          uploadReport: session.upload,
          knowledgeDocs,
          catalog
        });
        return writeJson(res, 200, { ok: true, recommendation });
      }

      if (req.method === "POST" && url.pathname === "/api/checkout") {
        if (!requireCsrf(req, res, session)) return;
        const payload = await readJsonBody(req);
        const orderId = `ord_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
        return writeJson(res, 200, {
          ok: true,
          orderId,
          hostedCheckoutUrl: `/checkout/hosted-demo?order=${encodeURIComponent(orderId)}`,
          amount: payload.total || null,
          note: "Demo checkout created. Production should redirect to a PCI-compliant hosted payment page and keep card data off this server."
        });
      }

      if (req.method === "GET") {
        const filePath = safeStaticPath(publicDir, url.pathname);
        if (!filePath) return writeJson(res, 403, { error: "path_blocked" });
        if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
          return writeJson(res, 404, { error: "not_found" });
        }
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, {
          "Content-Type": MIME_TYPES[ext] || "application/octet-stream",
          "Cache-Control": [".html", ".css", ".js"].includes(ext) ? "no-store" : "public, max-age=3600"
        });
        fs.createReadStream(filePath).pipe(res);
        return;
      }

      writeJson(res, 405, { error: "method_not_allowed" });
    } catch (error) {
      const status = error.status || (error instanceof SyntaxError ? 400 : 500);
      writeJson(res, status, {
        error: status === 500 ? "server_error" : "bad_request",
        message: status === 500 ? "Unexpected server error." : error.message
      });
    }
  });
}

if (require.main === module) {
  const port = Number(process.env.PORT || 4173);
  const server = createServer();
  server.listen(port, "127.0.0.1", () => {
    console.log(`DressRight AI running at http://127.0.0.1:${port}`);
  });
}

module.exports = {
  createServer,
  safeStaticPath
};
