"use strict";

const crypto = require("crypto");
const path = require("path");

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const MIME_TO_KIND = new Map([
  ["image/png", "png"],
  ["image/jpeg", "jpeg"],
  ["image/webp", "webp"]
]);
const KIND_TO_EXTENSIONS = new Map([
  ["png", new Set([".png"])],
  ["jpeg", new Set([".jpg", ".jpeg"])],
  ["webp", new Set([".webp"])]
]);

function sniffImageKind(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) return null;
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "png";
  }
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "jpeg";
  }
  if (
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "webp";
  }
  return null;
}

function normalizeFileName(name) {
  const base = path.basename(String(name || "style-photo"));
  return base.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 96) || "style-photo";
}

function hasActiveContentMarkers(buffer) {
  const sample = buffer.subarray(0, Math.min(buffer.length, 4096)).toString("utf8").toLowerCase();
  return [
    "<script",
    "<svg",
    "<?xml",
    "<html",
    "%pdf",
    "mz",
    "pk\u0003\u0004"
  ].some((marker) => sample.includes(marker));
}

function validateImageUpload({ buffer, contentType, fileName }) {
  if (!Buffer.isBuffer(buffer)) {
    return { ok: false, status: 400, code: "upload_not_binary", message: "Upload must be binary image data." };
  }
  if (buffer.length === 0) {
    return { ok: false, status: 400, code: "upload_empty", message: "The image file is empty." };
  }
  if (buffer.length > MAX_UPLOAD_BYTES) {
    return {
      ok: false,
      status: 413,
      code: "upload_too_large",
      message: "Image is larger than the 5 MB limit."
    };
  }

  const normalizedType = String(contentType || "").split(";")[0].trim().toLowerCase();
  const expectedKind = MIME_TO_KIND.get(normalizedType);
  if (!expectedKind) {
    return {
      ok: false,
      status: 415,
      code: "mime_not_allowed",
      message: "Only PNG, JPEG, and WebP uploads are accepted."
    };
  }

  const magicKind = sniffImageKind(buffer);
  if (!magicKind || magicKind !== expectedKind) {
    return {
      ok: false,
      status: 415,
      code: "magic_mismatch",
      message: "The file signature does not match the declared image type."
    };
  }

  const safeName = normalizeFileName(fileName);
  const extension = path.extname(safeName).toLowerCase();
  if (extension && !KIND_TO_EXTENSIONS.get(magicKind).has(extension)) {
    return {
      ok: false,
      status: 415,
      code: "extension_mismatch",
      message: "The file extension does not match the image content."
    };
  }

  if (hasActiveContentMarkers(buffer)) {
    return {
      ok: false,
      status: 400,
      code: "active_content_detected",
      message: "The image contains active-content markers and was rejected."
    };
  }

  const sha256 = crypto.createHash("sha256").update(buffer).digest("hex");
  return {
    ok: true,
    file: {
      id: sha256.slice(0, 16),
      name: safeName,
      kind: magicKind,
      contentType: normalizedType,
      bytes: buffer.length,
      sha256,
      retained: false
    }
  };
}

module.exports = {
  MAX_UPLOAD_BYTES,
  sniffImageKind,
  validateImageUpload
};
