#!/usr/bin/env node
/**
 * patch-vite.js  —  postinstall script that guards against a Vite 7 bug.
 *
 * Bug: EnvironmentPluginContainer.transform() crashes with
 *   "TypeError: Cannot read properties of undefined (reading 'call')"
 * when a plugin registers transform as { filter: {...} } but omits the
 * `handler` property.  Vite calls handler.call(...) without a null check.
 *
 * Fix: insert `if (!handler) { ...; continue; }` before the .call() line.
 *
 * This script is run automatically via "postinstall" in package.json so the
 * fix re-applies every time `npm install` is executed.
 */

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { resolve, dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Path to the Vite chunk that contains the PluginContainer transform loop
const VITE_CHUNK = resolve(
  __dirname,
  "../node_modules/vite/dist/node/chunks/config.js"
);

// The exact string we want to replace (tabs must match the minified source)
const OLD = [
  "const handler = getHookHandler(plugin.transform);",
  "\t\t\ttry {",
  "\t\t\t\tresult = await this.handleHookPromise(handler.call(ctx, code, id, optionsWithSSR));",
  "\t\t\t} catch (e$1) {",
  "\t\t\t\tctx.error(e$1);",
  "\t\t\t}",
].join("\n");

// The replacement: add a guard that skips plugins whose transform handler is undefined
const NEW = [
  "const handler = getHookHandler(plugin.transform);",
  // Guard: skip the plugin instead of crashing — logs a warning for traceability
  "\t\t\tif (!handler) { console.warn('[vite-patch] undefined transform.handler in plugin:', plugin.name); continue; }",
  "\t\t\ttry {",
  "\t\t\t\tresult = await this.handleHookPromise(handler.call(ctx, code, id, optionsWithSSR));",
  "\t\t\t} catch (e$1) {",
  "\t\t\t\tctx.error(e$1);",
  "\t\t\t}",
].join("\n");

let src;
try {
  src = readFileSync(VITE_CHUNK, "utf8");
} catch {
  console.log("[vite-patch] vite chunk not found — skipping patch");
  process.exit(0);
}

if (src.includes("[vite-guard]")) {
  // Already patched (e.g. second npm install run)
  console.log("[vite-patch] already applied — skipping");
  process.exit(0);
}

if (!src.includes(OLD)) {
  console.warn(
    "[vite-patch] expected code not found — Vite may have been updated; patch skipped"
  );
  process.exit(0);
}

writeFileSync(VITE_CHUNK, src.replace(OLD, NEW), "utf8");
console.log("[vite-patch] patched vite/dist/node/chunks/config.js — undefined transform.handler guard applied");
