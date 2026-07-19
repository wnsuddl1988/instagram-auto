import { readFileSync } from "node:fs";
import { join } from "node:path";

const repoRoot = process.cwd();
const read = (path) =>
  readFileSync(join(repoRoot, path), "utf8");

const core = read(
  "lib/money-shorts-youtube-only-recovery.mjs",
);
const overlay = read(
  "lib/money-shorts-youtube-only-recovery-overlay.mjs",
);
const operator = read("lib/owner-web-operator.ts");
const route = read(
  "app/api/money-shorts/operator/route.ts",
);
const wizard = read("components/VideoCreationWizard.tsx");

let passed = 0;
let failed = 0;
function check(label, condition) {
  if (condition) {
    passed += 1;
    console.log(`PASS ${label}`);
  } else {
    failed += 1;
    console.error(`FAIL ${label}`);
  }
}

check(
  "overlay module is pure read-model code",
  !/\bfetch\s*\(|googleapis|graph\.facebook|@vercel\/blob|process\.env|writeFile|renameSync|unlinkSync|rmSync|spawn/u.test(
    overlay,
  ),
);
check(
  "core exports strict claim/preflight/event/result validators",
  [
    "validateMoneyShortsYoutubeOnlyRecoveryClaimEvidence",
    "validateMoneyShortsYoutubeOnlyRecoveryPreflightForClaim",
    "validateMoneyShortsYoutubeOnlyRecoveryEventEvidence",
    "validateMoneyShortsYoutubeOnlyRecoveryResultEvidence",
  ].every((name) =>
    core.includes(`export function ${name}`),
  ),
);
check(
  "overlay requires one discovered candidate and no unknown files",
  overlay.includes(
    "evidenceBundle.candidateCount !== 1",
  ) &&
    overlay.includes(
      "evidenceBundle.unknownFileCount !== 0",
    ),
);
check(
  "overlay validates every immutable event file in order",
  overlay.includes(
    "MONEY_SHORTS_YOUTUBE_ONLY_RECOVERY_EVENT_TRANSITIONS",
  ) &&
    overlay.includes(
      "validateMoneyShortsYoutubeOnlyRecoveryEventEvidence",
    ) &&
    overlay.includes(
      "eventFile.evidence.latestEventSha256",
    ) === false &&
    overlay.includes(
      "resultFile.evidence.latestEventSha256 !==",
    ),
);
check(
  "complete requires exact current YouTube ledger id and record metadata",
  overlay.includes(
    "ledgerEvidence?.youtubeAlreadyPublished === true",
  ) &&
    overlay.includes(
      "ledgerEvidence.youtubePublishedIdReference === videoId",
    ) &&
    overlay.includes("validYoutubeLedgerRecord") &&
    overlay.includes(
      "record.metadata.recoveryFingerprint ===",
    ) &&
    overlay.includes(
      "record.metadata.ownerResolutionSha256 ===",
    ),
);
check(
  "complete overlay keeps all mutation and retry authority disabled",
  overlay.includes("genericDualUploadBlocked: true") &&
    overlay.includes("automaticRetryAllowed: false") &&
    overlay.includes("externalRecoveryEnabled: false") &&
    overlay.includes("youtubePublishAllowed: false") &&
    overlay.includes("ledgerMutationAllowed: false"),
);
check(
  "operator scans only fixed local recovery root",
  operator.includes(
    'WIZARD_YOUTUBE_ONLY_RECOVERY_ROOT =\n  "C:\\\\tmp\\\\money-shorts-os\\\\youtube-only-part1-recovery-v1"',
  ) &&
    operator.includes(
      "readWizardYoutubeOnlyRecoveryEvidenceBundle",
    ),
);
check(
  "preflight-only directory does not apply an armed overlay",
  operator.includes(
    "if (!existsSync(paths.recoveryDir))",
  ) &&
    operator.includes(
      "dry-run preflight만 있는 디렉터리는 실제 recovery",
    ),
);
check(
  "operator accepts only byte-identical write-once committed-source sidecars",
  operator.includes(
    "committedSourceSha256ByName",
  ) &&
    operator.includes(".committed-source") &&
    operator.includes(
      "committedSourceFile.sha256 !==\n          expectedCommittedSourceSha256",
    ),
);
check(
  "operator derives ledger evidence and exact record from one snapshot",
    operator.includes(
      "readWizardPublishLedgerSnapshotForUnit",
    ) &&
    operator.includes("readPublishLedgerReadOnly") &&
    operator.includes("youtubeLedgerRecord:") &&
    operator.includes("ledgerSnapshot.youtubeRecord"),
);
check(
  "operator reconstructs source target-clean state only for a present overlay",
  operator.indexOf("if (recoveryBundle.present)") <
      operator.indexOf(
        "const sourceLedgerEvidence =",
      ) &&
    operator.includes(
      "instagramAlreadyPublished: false",
    ) &&
    operator.includes(
      "youtubeAlreadyPublished: false",
    ),
);
check(
  "upload-ready API returns the overlaid recovery states",
  route.includes(
    "const items = listWizardUploadReadyItems();",
  ) &&
    route.includes("raw: { items }") &&
    operator.includes("youtubeOnlyRecovery,"),
);
check(
  "generic actual upload remains fail-closed after any recovery evidence",
  route.includes(
    '(recovery) => recovery.state !== "not_started"',
  ) &&
    route.includes(
      '"PUBLISH_RECOVERY_MANUAL_REVIEW_REQUIRED"',
    ),
);
check(
  "wizard renders read-only YouTube recovery integrity evidence",
  wizard.includes(
    'data-testid="wizard-youtube-only-recovery-overlay"',
  ) &&
    wizard.includes(
      "recovery.youtubeOnlyRecovery.valid",
    ) &&
    wizard.includes("writeLockReleased === true") &&
    wizard.includes("writeLockReleased === false") &&
    wizard.includes(
      "자동 재시도·자동 재업로드 0회",
    ),
);
check(
  "wizard overlay adds no execution action",
  !/wizard-youtube-only-recovery-overlay[\s\S]{0,3000}postAction\(/u.test(
    wizard,
  ),
);

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exitCode = 1;
