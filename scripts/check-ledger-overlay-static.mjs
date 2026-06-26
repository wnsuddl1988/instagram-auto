/**
 * Static guard check for ledger-overlay.ts safety invariants and page.tsx integration.
 * No dependencies, no network, no fs writes, no ledger data access.
 * Exit 0 = all PASS. Exit 1 = at least one FAIL.
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const HELPER_PATH = resolve(__dirname, "../app/fact-cards/manual/package-preview/ledger-overlay.ts");
const PAGE_PATH   = resolve(__dirname, "../app/fact-cards/manual/package-preview/page.tsx");

const src = readFileSync(HELPER_PATH, "utf-8");
const lines = src.split("\n");

const pageSrc = readFileSync(PAGE_PATH, "utf-8");

let passed = 0;
let failed = 0;

function check(label, condition) {
  if (condition) {
    console.log(`  PASS  ${label}`);
    passed++;
  } else {
    console.error(`  FAIL  ${label}`);
    failed++;
  }
}

console.log(`\nStatic guard check: ledger-overlay.ts + page.tsx integration\n`);

// ── Forbidden usage ────────────────────────────────────────────────────────────
// Exclude comment lines for pattern checks that might appear in doc comments
const nonCommentLines = lines.filter((l) => !/^\s*(\/\/|\*)/.test(l)).join("\n");

console.log("[ Forbidden usage ]");
check(
  'no fs import (from "fs" or from "node:fs")',
  !src.includes('from "fs"') &&
    !src.includes("from 'fs'") &&
    !src.includes('from "node:fs"') &&
    !src.includes("from 'node:fs'"),
);
check(
  'no path import (from "path" or from "node:path")',
  !src.includes('from "path"') &&
    !src.includes("from 'path'") &&
    !src.includes('from "node:path"') &&
    !src.includes("from 'node:path'"),
);
check('no .money-shorts-local reference', !src.includes(".money-shorts-local"));
check("no process.env access",            !nonCommentLines.includes("process.env"));
check("no fetch( call",                   !nonCommentLines.includes("fetch("));
check("no Date.now() call",               !nonCommentLines.includes("Date.now()"));
check("no new Date()",                    !nonCommentLines.includes("new Date("));
check("no localStorage",                  !src.includes("localStorage"));
check("no sessionStorage",                !src.includes("sessionStorage"));
check("no navigator.clipboard",           !src.includes("navigator.clipboard"));

// ── Required exports ───────────────────────────────────────────────────────────
console.log("\n[ Required exports and symbols ]");
check("LedgerOverlayInactiveReason type exported",  src.includes("export type LedgerOverlayInactiveReason"));
check("LedgerOverlayResult type exported",          src.includes("export type LedgerOverlayResult"));
check("LEDGER_OVERLAY_INACTIVE_MESSAGES exported",  src.includes("export const LEDGER_OVERLAY_INACTIVE_MESSAGES"));
check("evaluateLedgerOverlay function exported",    src.includes("export function evaluateLedgerOverlay"));

// ── Inactive reason keys ───────────────────────────────────────────────────────
console.log("\n[ Inactive reason keys in LEDGER_OVERLAY_INACTIVE_MESSAGES ]");
check('"no_record" key present',                src.includes('"no_record"') || src.includes("no_record:"));
check('"mock_blocked" key present',             src.includes('"mock_blocked"') || src.includes("mock_blocked:"));
check('"ledger_stale_or_ineligible" key present', src.includes('"ledger_stale_or_ineligible"') || src.includes("ledger_stale_or_ineligible:"));

// ── Guard order (line-number-based) ────────────────────────────────────────────
console.log("\n[ Guard order ]");
const g1 = lines.findIndex((l) => l.includes("no_record") && l.includes("active: false"));
const g2 = lines.findIndex((l) => l.includes("mock_blocked") && l.includes("active: false"));
const g3 = lines.findIndex((l) => l.includes("ledger_stale_or_ineligible") && l.includes("active: false"));
// Guard 4 re-validation: look for evaluatePublishabilityDecision call (not import/comment lines)
const g4 = lines.findIndex(
  (l) => l.includes("evaluatePublishabilityDecision(") && !/^\s*(import|\/\/|\*)/.test(l),
);
// memory-only clone (exclude comment lines)
const clone = lines.findIndex(
  (l) => l.includes("isPublishable: true") && l.includes("...factCard") && !/^\s*(\/\/|\*)/.test(l),
);

check("Guard 1 (no_record) found",                  g1 >= 0);
check("Guard 2 (mock_blocked) found",               g2 >= 0);
check("Guard 3 (ledger_stale_or_ineligible) found", g3 >= 0);
check("Guard 4 (evaluatePublishabilityDecision) found", g4 >= 0);
check("memory-only clone ({ ...factCard, isPublishable: true }) found", clone >= 0);

check("Guard 1 before Guard 2",  g1 >= 0 && g2 >= 0 && g1 < g2);
check("Guard 2 before Guard 3",  g2 >= 0 && g3 >= 0 && g2 < g3);
check("Guard 3 before Guard 4",  g3 >= 0 && g4 >= 0 && g3 < g4);
check("Guard 4 before clone",    g4 >= 0 && clone >= 0 && g4 < clone);

// ── Page integration checks ────────────────────────────────────────────────────
console.log("\n[ page.tsx integration contract ]");
// Must import/reference helper symbols
check("page.tsx references evaluateLedgerOverlay",
  pageSrc.includes("evaluateLedgerOverlay"));
check("page.tsx references LEDGER_OVERLAY_INACTIVE_MESSAGES",
  pageSrc.includes("LEDGER_OVERLAY_INACTIVE_MESSAGES"));
// Must call the helper function (not inline IIFE)
check("page.tsx calls evaluateLedgerOverlay(",
  pageSrc.includes("evaluateLedgerOverlay("));
// Must use typed message map (not inline string literals per reason)
check("page.tsx uses LEDGER_OVERLAY_INACTIVE_MESSAGES[ledgerOverlayResult.reason]",
  pageSrc.includes("LEDGER_OVERLAY_INACTIVE_MESSAGES[ledgerOverlayResult.reason]"));
// Must NOT have inline type declarations (they moved to ledger-overlay.ts)
check("page.tsx has no inline 'type LedgerOverlayInactiveReason' declaration",
  !pageSrc.includes("type LedgerOverlayInactiveReason ="));
check("page.tsx has no inline 'type LedgerOverlayResult' declaration",
  !pageSrc.includes("type LedgerOverlayResult ="));
// Must NOT have old inline IIFE pattern
check("page.tsx has no inline IIFE for ledgerOverlayResult",
  !pageSrc.includes("const ledgerOverlayResult: LedgerOverlayResult = (() => {"));

// ── Summary ────────────────────────────────────────────────────────────────────
console.log(`\n──────────────────────────────────────`);
console.log(`Result: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  console.error(`\nFAIL — ${failed} invariant(s) violated`);
  process.exit(1);
} else {
  console.log(`\nPASS — all invariants satisfied`);
}
