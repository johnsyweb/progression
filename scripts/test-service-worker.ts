#!/usr/bin/env node

/**
 * Script to test that the service worker is built correctly
 * Usage: pnpm run build && node scripts/test-service-worker.js
 */

import { readFileSync, existsSync } from "fs";
import { join, resolve } from "path";

const distPath = resolve(process.cwd(), "dist");
const swPath = join(distPath, "sw.js");

console.log("Testing service worker build...\n");

if (!existsSync(swPath)) {
  console.error("❌ sw.js not found at:", swPath);
  console.error("   Please run 'pnpm run build' first.");
  process.exit(1);
}

const swCode = readFileSync(swPath, "utf-8");

// Test 1: Check for event listeners
console.log("1. Checking for event listeners...");
const hasAddEventListener = swCode.includes("addEventListener");
const hasInstall = swCode.includes('"install"') || swCode.includes("'install'");
const hasFetch = swCode.includes('"fetch"') || swCode.includes("'fetch'");

if (hasAddEventListener && hasInstall && hasFetch) {
  console.log("   ✅ Event listeners found");
} else {
  console.error("   ❌ Missing event listeners");
  console.error(`      addEventListener: ${hasAddEventListener}`);
  console.error(`      install: ${hasInstall}`);
  console.error(`      fetch: ${hasFetch}`);
  process.exit(1);
}

// Test 2: Check no import/export statements
console.log("2. Checking for ES module syntax...");
const hasImport = /^import\s+/m.test(swCode);
const hasExport = /^export\s+/m.test(swCode);

if (!hasImport && !hasExport) {
  console.log("   ✅ No import/export statements found");
} else {
  console.error("   ❌ Found ES module syntax (should be plain JavaScript)");
  console.error(`      import: ${hasImport}`);
  console.error(`      export: ${hasExport}`);
  process.exit(1);
}

// Test 3: Check for SVG generation code
console.log("3. Checking for SVG generation code...");
const hasSVGCode =
  swCode.includes("1200") || // SVG width
  swCode.includes("630") || // SVG height
  swCode.includes("<svg") ||
  swCode.includes("svg+xml");

if (hasSVGCode) {
  console.log("   ✅ SVG generation code found");
} else {
  console.error("   ❌ SVG generation code not found");
  process.exit(1);
}

// Test 4: Check file size (should be reasonable, not empty)
console.log("4. Checking file size...");
const fileSize = swCode.length;
if (fileSize > 1000) {
  console.log(`   ✅ File size looks reasonable (${fileSize} bytes)`);
} else {
  console.error(`   ❌ File size is suspiciously small (${fileSize} bytes)`);
  process.exit(1);
}

console.log("\n✅ All service worker build tests passed!");
console.log(`\n   File: ${swPath}`);
console.log(`   Size: ${fileSize} bytes`);
