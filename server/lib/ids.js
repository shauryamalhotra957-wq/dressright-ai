"use strict";

const crypto = require("crypto");

function publicId(prefix) {
  if (!/^[a-z][a-z0-9_]*$/i.test(prefix)) {
    throw new Error("invalid_id_prefix");
  }
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "")}`;
}

module.exports = {
  publicId
};
