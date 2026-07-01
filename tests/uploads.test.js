"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { validateImageUpload, sniffImageKind } = require("../server/lib/uploads");

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.alloc(64)
]);
const jpeg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(64)]);

test("sniffs common image signatures", () => {
  assert.equal(sniffImageKind(png), "png");
  assert.equal(sniffImageKind(jpeg), "jpeg");
  assert.equal(sniffImageKind(Buffer.from("<svg></svg>")), null);
});

test("accepts an allowlisted image with matching MIME and extension", () => {
  const result = validateImageUpload({
    buffer: png,
    contentType: "image/png",
    fileName: "me.png"
  });
  assert.equal(result.ok, true);
  assert.equal(result.file.kind, "png");
  assert.equal(result.file.retained, false);
});

test("rejects MIME and magic-byte mismatch", () => {
  const result = validateImageUpload({
    buffer: png,
    contentType: "image/jpeg",
    fileName: "me.jpg"
  });
  assert.equal(result.ok, false);
  assert.equal(result.code, "magic_mismatch");
});

test("rejects active content markers", () => {
  const suspicious = Buffer.concat([png, Buffer.from("<script>alert(1)</script>")]);
  const result = validateImageUpload({
    buffer: suspicious,
    contentType: "image/png",
    fileName: "me.png"
  });
  assert.equal(result.ok, false);
  assert.equal(result.code, "active_content_detected");
});
