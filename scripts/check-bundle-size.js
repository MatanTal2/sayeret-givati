#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
/*
 * Bundle-size budget check. Run after `next build`.
 *
 * Reads the largest first-load entrypoint from `.next/build-manifest.json`,
 * sums its chunks, gzips them, and prints the total. Fails (exit 1) if the
 * gzipped total exceeds the per-phase budget in `bundle-budget.json`.
 *
 * Phase 0/1/2: informational only (no thresholds set).
 * Phase 3 PR wires this script into CI and sets `maxFirstLoadKB`.
 *
 * Refs: docs/spec/offline-first.md (Phase 2, audit note N5).
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const NEXT_DIR = path.join(PROJECT_ROOT, '.next');
const MANIFEST = path.join(NEXT_DIR, 'build-manifest.json');
const BUDGET = path.join(PROJECT_ROOT, 'bundle-budget.json');

function fail(msg) {
  console.error(`[bundle-size] ${msg}`);
  process.exit(1);
}

if (!fs.existsSync(MANIFEST)) {
  fail(`build-manifest.json not found at ${MANIFEST}. Run 'next build' first.`);
}

const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
const budget = fs.existsSync(BUDGET) ? JSON.parse(fs.readFileSync(BUDGET, 'utf8')) : {};

function gzippedSize(filePath) {
  const buf = fs.readFileSync(filePath);
  return zlib.gzipSync(buf, { level: 9 }).length;
}

const pages = manifest.pages || {};
let largest = { route: null, gzipBytes: 0 };
for (const [route, chunks] of Object.entries(pages)) {
  let total = 0;
  for (const chunk of chunks) {
    const full = path.join(NEXT_DIR, chunk);
    if (!fs.existsSync(full)) continue;
    total += gzippedSize(full);
  }
  if (total > largest.gzipBytes) {
    largest = { route, gzipBytes: total };
  }
}

if (!largest.route) {
  fail('No pages found in build manifest.');
}

const kb = (largest.gzipBytes / 1024).toFixed(2);
console.log(`[bundle-size] Largest entrypoint: ${largest.route}`);
console.log(`[bundle-size] Gzipped first-load JS: ${kb} KB`);

const cap = budget.maxFirstLoadKB;
if (typeof cap === 'number') {
  if (largest.gzipBytes / 1024 > cap) {
    fail(`Budget exceeded — ${kb} KB > ${cap} KB cap. Bump bundle-budget.json or trim deps.`);
  }
  console.log(`[bundle-size] Under cap (${cap} KB).`);
} else {
  console.log('[bundle-size] No cap configured — informational only.');
}
