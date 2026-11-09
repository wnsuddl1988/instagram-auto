/**
 * Server-only local approval ledger for publishability decisions.
 *
 * Backed by .money-shorts-local/publishability-approvals.json (gitignored).
 * Uses Node fs/path — never import this in client components.
 *
 * Safety invariants:
 * - recordLocalPublishabilityApproval() calls evaluatePublishabilityDecision()
 *   and refuses to write unless canMarkPublishable === true.
 * - Never mutates the FactCard. Never sets isPublishable=true.
 * - No Date.now() / new Date() — caller must inject recordedAt/createdAt.
 * - Atomic-ish write: write to .tmp then rename.
 */

import * as fs from "fs";
import * as path from "path";
import type { FactCard } from "@/lib/source-facts/types";
import {
  evaluatePublishabilityDecision,
  type PublishabilityDecisionInput,
  type PublishabilityDecisionOptions,
  type PublishabilityDecisionResult,
} from "./publishability";

export const LOCAL_LEDGER_SCHEMA_VERSION =
  "money_shorts_local_approval_ledger_v1" as const;

const LEDGER_DIR = ".money-shorts-local";
const LEDGER_FILE = "publishability-approvals.json";

function getLedgerPath(): string {
  return path.join(process.cwd(), LEDGER_DIR, LEDGER_FILE);
}

export interface LocalApprovalRecord {
  schemaVersion: typeof LOCAL_LEDGER_SCHEMA_VERSION;
  approvalId: string;
  factCardId: string;
  /** Verbatim result from evaluatePublishabilityDecision at the time of recording. */
  decisionResult: PublishabilityDecisionResult;
  /** Audit fields copied from the Fact Card at time of approval (no inference). */
  audit: {
    sourceName: string;
    sourceUrl: string;
    primarySourceProviderId: string;
    citationCount: number;
    publishedDate: string;
    dataPeriod: string;
    isMock: boolean;
  };
  recordedAt: string;
  createdAt?: string;
}

export interface LocalApprovalLedger {
  schemaVersion: typeof LOCAL_LEDGER_SCHEMA_VERSION;
  approvals: LocalApprovalRecord[];
}

/**
 * Raw read result — distinguishes missing (safe to treat as empty) from
 * invalid_json (must NOT be silently overwritten).
 */
export type RawReadLedgerResult =
  | { ok: true; ledger: LocalApprovalLedger }
  | { ok: false; reason: "missing" }
  | { ok: false; reason: "invalid_json"; detail: string };

export type RecordApprovalResult =
  | { ok: true; record: LocalApprovalRecord }
  | { ok: false; reason: "not_eligible"; blockerCodes: string[] }
  | { ok: false; reason: "write_failed"; detail: string };

/**
 * Raw ledger read — returns full result discrimination including "missing".
 * Callers that need to distinguish corrupt files from empty ones should use this.
 */
export function readLocalPublishabilityApprovalLedgerRaw(): RawReadLedgerResult {
  const ledgerPath = getLedgerPath();
  if (!fs.existsSync(ledgerPath)) {
    return { ok: false, reason: "missing" };
  }
  let raw: string;
  try {
    raw = fs.readFileSync(ledgerPath, "utf-8");
  } catch {
    return { ok: false, reason: "invalid_json", detail: "file read error" };
  }
  try {
    const parsed = JSON.parse(raw) as LocalApprovalLedger;
    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.approvals)) {
      return { ok: false, reason: "invalid_json", detail: "unexpected structure" };
    }
    return { ok: true, ledger: parsed };
  } catch (e) {
    return {
      ok: false,
      reason: "invalid_json",
      detail: e instanceof Error ? e.message : String(e),
    };
  }
}

/**
 * Public read helper. Missing file returns an empty ledger (ok: true).
 * Invalid JSON returns ok: false with reason "invalid_json" — never treated as empty.
 */
export type ReadLedgerResult =
  | { ok: true; ledger: LocalApprovalLedger }
  | { ok: false; reason: "invalid_json"; detail: string };

export function readLocalPublishabilityApprovalLedger(): ReadLedgerResult {
  const raw = readLocalPublishabilityApprovalLedgerRaw();
  if (raw.ok) return raw;
  if (raw.reason === "missing") {
    return {
      ok: true,
      ledger: { schemaVersion: LOCAL_LEDGER_SCHEMA_VERSION, approvals: [] },
    };
  }
  return raw;
}

/** Look up a single approval record by factCardId. Returns null when none found. */
export function getLocalPublishabilityApproval(
  factCardId: string,
): LocalApprovalRecord | null {
  const result = readLocalPublishabilityApprovalLedger();
  if (!result.ok) return null;
  return (
    result.ledger.approvals.find((r) => r.factCardId === factCardId) ?? null
  );
}

export interface RecordApprovalOptions extends PublishabilityDecisionOptions {
  approvalId?: string;
  /** ISO datetime string injected by caller. Required — no new Date() here. */
  recordedAt: string;
}

/**
 * Record a publishability approval for an eligible Fact Card.
 *
 * Calls evaluatePublishabilityDecision() first; refuses unless canMarkPublishable=true.
 * Does NOT mutate the FactCard, set isPublishable=true, or trigger any render/export.
 */
export function recordLocalPublishabilityApproval(
  factCard: FactCard,
  input: PublishabilityDecisionInput,
  options: RecordApprovalOptions,
): RecordApprovalResult {
  const decisionResult = evaluatePublishabilityDecision(factCard, input, {
    decisionResultId: options.decisionResultId,
    createdAt: options.createdAt,
  });

  if (!decisionResult.canMarkPublishable) {
    return {
      ok: false,
      reason: "not_eligible",
      blockerCodes: decisionResult.blockerCodes,
    };
  }

  const approvalId =
    options.approvalId ?? `approval-${factCard.id}-${options.recordedAt}`;

  const record: LocalApprovalRecord = {
    schemaVersion: LOCAL_LEDGER_SCHEMA_VERSION,
    approvalId,
    factCardId: factCard.id,
    decisionResult,
    audit: {
      sourceName: factCard.sourceName,
      sourceUrl: factCard.sourceUrl,
      primarySourceProviderId: factCard.primarySourceProviderId,
      citationCount: factCard.citations.length,
      publishedDate: factCard.publishedDate,
      dataPeriod: factCard.dataPeriod,
      isMock: factCard.isMock,
    },
    recordedAt: options.recordedAt,
    createdAt: options.createdAt,
  };

  const ledgerPath = getLedgerPath();
  const ledgerDir = path.dirname(ledgerPath);

  try {
    if (!fs.existsSync(ledgerDir)) {
      fs.mkdirSync(ledgerDir, { recursive: true });
    }

    // Read existing ledger. Missing → empty. Invalid JSON → block write to preserve corrupt file.
    const existing = readLocalPublishabilityApprovalLedgerRaw();
    if (!existing.ok && existing.reason === "invalid_json") {
      return {
        ok: false,
        reason: "write_failed",
        detail: `existing ledger is corrupt (${existing.detail}) — preserved for inspection`,
      };
    }
    const approvals: LocalApprovalRecord[] =
      existing.ok ? existing.ledger.approvals : [];

    // Replace existing record for this factCardId if present, else append
    const idx = approvals.findIndex((r) => r.factCardId === factCard.id);
    if (idx >= 0) {
      approvals[idx] = record;
    } else {
      approvals.push(record);
    }

    const updatedLedger: LocalApprovalLedger = {
      schemaVersion: LOCAL_LEDGER_SCHEMA_VERSION,
      approvals,
    };

    // Atomic-ish write: write to .tmp then rename
    const tmpPath = ledgerPath + ".tmp";
    fs.writeFileSync(tmpPath, JSON.stringify(updatedLedger, null, 2), "utf-8");
    fs.renameSync(tmpPath, ledgerPath);

    return { ok: true, record };
  } catch (e) {
    return {
      ok: false,
      reason: "write_failed",
      detail: e instanceof Error ? e.message : String(e),
    };
  }
}
