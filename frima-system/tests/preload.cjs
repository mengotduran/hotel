const Module = require("node:module");
const path = require("node:path");

const stub = path.join(__dirname, "next-cache-stub.cjs");
const original = Module._resolveFilename;

Module._resolveFilename = function (request, ...rest) {
  if (request === "next/cache") return stub;
  return original.call(this, request, ...rest);
};
