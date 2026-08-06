import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const root = resolve(process.cwd());
const moduleCache = new Map();

function statusSnapshot() {
  const result = spawnSync("git", ["status", "--porcelain=v1", "-z"], { cwd: root, encoding: "utf8", windowsHide: true, maxBuffer: 16 * 1024 * 1024 });
  if (result.status !== 0 || result.error) throw new Error(result.stderr || result.error?.message || "git status failed");
  return result.stdout;
}

function resolveTypeScriptModule(fromFile, specifier) {
  const base = resolve(dirname(fromFile), specifier);
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`]) {
    if (existsSync(candidate)) return candidate;
  }
  throw new Error(`Unable to resolve TypeScript module: ${specifier} from ${fromFile}`);
}

function loadTypeScriptModule(filePath) {
  const absolutePath = resolve(root, filePath);
  const cached = moduleCache.get(absolutePath);
  if (cached) return cached.exports;
  const moduleRecord = { exports: {} };
  moduleCache.set(absolutePath, moduleRecord);
  const source = readFileSync(absolutePath, "utf8");
  const output = ts.transpileModule(source, {
    fileName: absolutePath,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const localRequire = (specifier) => specifier.startsWith(".")
    ? loadTypeScriptModule(resolveTypeScriptModule(absolutePath, specifier))
    : require(specifier);
  const execute = new Function("require", "module", "exports", "__filename", "__dirname", output);
  execute(localRequire, moduleRecord, moduleRecord.exports, absolutePath, dirname(absolutePath));
  return moduleRecord.exports;
}

const fixtureModule = loadTypeScriptModule("lib/editorial-v2/publish-fixture.ts");
const packageModule = loadTypeScriptModule("lib/editorial-v2/publish-package.ts");
const ledgerModule = loadTypeScriptModule("lib/editorial-v2/publish-ledger-session.ts");
const recoveryModule = loadTypeScriptModule("lib/editorial-v2/publish-recovery.ts");
const validationModule = loadTypeScriptModule("lib/editorial-v2/publish-validation.ts");
const bridgeModule = loadTypeScriptModule("lib/editorial-v2/publish-bridge.ts");

const statusBefore = statusSnapshot();
let summary = null;

try {
  const fixture = fixtureModule.buildSyntheticPublishFixture();
  const repeatedFixture = fixtureModule.buildSyntheticPublishFixture();
  assert.deepEqual(repeatedFixture, fixture);
  assert.notEqual(repeatedFixture.publishPackage, fixture.publishPackage);
  const context = { approvedRenderIntegration: fixture.approvedRenderIntegration, ledger: fixture.emptyLedger, rightsResolvedForPlanning: true, paidPossibleOwnerConfirmation: true };
  const initialValidation = validationModule.summarizePublishValidation([
    ...validationModule.validatePublishIntegration(fixture.publishPackage, context),
    ...bridgeModule.validatePublishBridgePlan(bridgeModule.buildPublishBridgePlan(fixture.publishPackage, recoveryModule.buildPublishRecoveryPlan(fixture.publishPackage, fixture.emptyLedger)), fixture.publishPackage),
  ]);
  assert.equal(initialValidation.blockingIssueCount, 0);
  assert.equal(initialValidation.executionEligible, false);

  const instagram = fixture.publishPackage.platformPackages.find((entry) => entry.platformId === "instagram_reels");
  const youtube = fixture.publishPackage.platformPackages.find((entry) => entry.platformId === "youtube_shorts");
  assert.ok(instagram);
  assert.ok(youtube);
  let ledger = fixture.emptyLedger;
  ledger = ledgerModule.recordSessionPublicationAttempt(ledger, { attemptId: "synthetic-instagram-attempt-1", platformId: "instagram_reels", dedupeKey: instagram.dedupeKey.value, attemptOrdinal: 1, status: "dry_run_success", requestedAtIso: "2026-08-06T00:00:00.000Z", completedAtIso: "2026-08-06T00:00:01.000Z", failureCode: null, failureMessage: null, retryable: false, identityMatchAtAttempt: true, externalExecution: false, dryRun: true });
  ledger = ledgerModule.recordSessionPublicationAttempt(ledger, { attemptId: "synthetic-youtube-attempt-1", platformId: "youtube_shorts", dedupeKey: youtube.dedupeKey.value, attemptOrdinal: 1, status: "dry_run_failed", requestedAtIso: "2026-08-06T00:00:00.000Z", completedAtIso: "2026-08-06T00:00:01.000Z", failureCode: "SYNTHETIC_RETRYABLE_FAILURE", failureMessage: "Synthetic no-network failure", retryable: true, identityMatchAtAttempt: true, externalExecution: false, dryRun: true });
  const recovery = recoveryModule.buildPublishRecoveryPlan(fixture.publishPackage, ledger);
  assert.deepEqual(recovery.successfulPlatformIds, ["instagram_reels"]);
  assert.deepEqual(recovery.failedPlatformIds, ["youtube_shorts"]);
  assert.deepEqual(recovery.retryablePlatformIds, ["youtube_shorts"]);
  const retryPackage = recoveryModule.buildFailedPlatformRetryPackage(fixture.publishPackage, recovery);
  assert.deepEqual(retryPackage.platformPackages.map((entry) => entry.platformId), ["youtube_shorts"]);
  ledger = ledgerModule.recordSessionPublicationAttempt(ledger, { attemptId: "synthetic-youtube-attempt-2", platformId: "youtube_shorts", dedupeKey: youtube.dedupeKey.value, attemptOrdinal: 2, status: "dry_run_success", requestedAtIso: "2026-08-06T00:00:02.000Z", completedAtIso: "2026-08-06T00:00:03.000Z", failureCode: null, failureMessage: null, retryable: false, identityMatchAtAttempt: true, externalExecution: false, dryRun: true }, true);
  assert.equal(ledger.platformStates.find((state) => state.platformId === "instagram_reels")?.latestStatus, "dry_run_success");
  assert.equal(ledger.platformStates.find((state) => state.platformId === "youtube_shorts")?.latestStatus, "dry_run_success");
  assert.throws(() => ledgerModule.recordSessionPublicationAttempt(ledger, { attemptId: "synthetic-instagram-duplicate", platformId: "instagram_reels", dedupeKey: instagram.dedupeKey.value, attemptOrdinal: 2, status: "planned", requestedAtIso: "2026-08-06T00:00:04.000Z", completedAtIso: null, failureCode: null, failureMessage: null, retryable: false, identityMatchAtAttempt: true, externalExecution: false, dryRun: true }), /publication_dedupe_key_blocked/u);

  const buildInput = {
    approvedRenderIntegration: fixture.approvedRenderIntegration,
    selectedPlatforms: ["instagram_reels", "youtube_shorts"],
    expectedDestinationIdentities: fixture.expectedDestinations,
    observedDestinationIdentities: fixture.observedDestinations,
    platformMetadata: fixture.publishPackage.platformPackages.map((entry) => entry.metadata),
    scheduleIntent: fixture.immediateIntent,
    rightsResolvedForPlanning: true,
    paidPossible: false,
    paidPossibleOwnerConfirmation: true,
    createdFromSessionIdentity: "slice7-synthetic-session",
  };
  const wrongObserved = fixture.observedDestinations.map((identity) => identity.platformId === "youtube_shorts" ? { ...identity, stableDestinationId: "synthetic-wrong-account" } : identity);
  const wrongAccountPackage = packageModule.buildPublishPackage({ ...buildInput, observedDestinationIdentities: wrongObserved });
  const wrongAccountIssues = validationModule.validatePublishIntegration(wrongAccountPackage, { ...context, ledger: fixture.emptyLedger });
  assert.ok(wrongAccountIssues.some((entry) => entry.code === "wrong_account_destination_mismatch" && entry.blocking));

  const pastSchedule = { ...fixture.scheduledIntent, scheduledAtIso: "2026-08-05T00:00:00.000Z" };
  const pastPackage = packageModule.buildPublishPackage({ ...buildInput, scheduleIntent: pastSchedule });
  const pastIssues = validationModule.validatePublishIntegration(pastPackage, { ...context, ledger: fixture.emptyLedger });
  assert.ok(pastIssues.some((entry) => entry.code === "publish_schedule_in_past" && entry.blocking));

  const missingOwnerExpected = fixture.expectedDestinations.map((identity) => identity.platformId === "instagram_reels" ? { ...identity, ownerConfirmation: false } : identity);
  const missingOwnerPackage = packageModule.buildPublishPackage({ ...buildInput, expectedDestinationIdentities: missingOwnerExpected });
  const missingOwnerIssues = validationModule.validatePublishIntegration(missingOwnerPackage, { ...context, ledger: fixture.emptyLedger });
  assert.ok(missingOwnerIssues.some((entry) => entry.code === "owner_account_confirmation_missing" && entry.blocking));

  const scheduleChangedPackage = packageModule.buildPublishPackage({ ...buildInput, scheduleIntent: fixture.scheduledIntent });
  assert.deepEqual(scheduleChangedPackage.platformPackages.map((entry) => entry.dedupeKey.value), fixture.publishPackage.platformPackages.map((entry) => entry.dedupeKey.value));
  assert.equal(fixture.publishPackage.executionReady, false);
  assert.equal(fixture.publishPackage.externalCallExecuted, false);
  assert.equal(fixture.publishPackage.uploadExecuted, false);
  assert.equal(fixture.publishPackage.publicationExecuted, false);
  assert.equal(bridgeModule.buildPublishBridgePlan(fixture.publishPackage, recovery).executionReady, false);
  summary = {
    packageId: fixture.publishPackage.packageId,
    instagramDryRun: "success",
    youtubeInitialDryRun: "failed",
    retryablePlatformIds: recovery.retryablePlatformIds,
    retryPackagePlatformIds: retryPackage.platformPackages.map((entry) => entry.platformId),
    youtubeRetryDryRun: "success",
    duplicateSuccessBlocked: true,
    wrongAccountBlocked: true,
    pastScheduleBlocked: true,
    missingOwnerConfirmationBlocked: true,
    executionReady: false,
    externalExecution: false,
    uploadExecuted: false,
    publicationExecuted: false,
    syntheticOnly: true,
  };
} finally {
  const statusAfter = statusSnapshot();
  if (statusAfter !== statusBefore) throw new Error("repository status changed during Slice 7 synthetic publish dry-run");
}

console.log(JSON.stringify({ ...summary, repositoryStatusUnchanged: true }));
console.log("SHORTS_EDITORIAL_OS_V2_SLICE7_SYNTHETIC_PUBLISH_DRY_RUN_PASS");
