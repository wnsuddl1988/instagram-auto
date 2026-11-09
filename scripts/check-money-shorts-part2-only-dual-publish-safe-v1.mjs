import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import * as nodeFs from "node:fs";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
  mkdirSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  buildMoneyShortsFinalVideoOwnerApprovalEvidence,
  buildMoneyShortsPublishPreflightBinding,
} from "../lib/money-shorts-final-video-owner-approval.mjs";
import {
  inspectMoneyShortsPublishAttemptEvidence,
  fingerprintMoneyShortsPublishAttemptBinding,
} from "../lib/money-shorts-publish-attempt-journal.mjs";
import {
  buildMoneyShortsPart2DualPublishSafePlan,
  moneyShortsPart2DualPublishSafePaths,
  validateMoneyShortsPart2DualPublishSafeAuthorization,
  writeMoneyShortsPart2DualPublishSafeEvidenceOnce,
} from "../lib/money-shorts-part2-dual-publish-safe.mjs";
import {
  classifyMoneyShortsPublishRecovery,
} from "../lib/money-shorts-publish-recovery.mjs";
import {
  buildPublishLedgerKey,
  readPublishLedgerReadOnly,
} from "../lib/publish-ledger-runtime.mjs";
import {
  writePublishLedgerRuntime,
} from "../lib/publish-ledger-runtime-write.mjs";
import {
  createMoneyShortsInstagramContainerOnce,
  inspectSafeEvidenceDirectory,
  readLedgerSnapshot,
  runMoneyShortsPart2DualPublishSafe,
} from "./run-money-shorts-part2-only-dual-publish-safe-v1.mjs";

let passed = 0;
let failed = 0;

function check(label, condition, detail = "") {
  if (condition) {
    passed += 1;
    console.log(`PASS ${label}`);
  } else {
    failed += 1;
    console.error(
      `FAIL ${label}${detail ? ` — ${detail}` : ""}`,
    );
  }
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function evidenceFingerprintMatches(
  evidence,
  field = "resultFingerprint",
) {
  if (
    typeof evidence?.[field] !== "string" ||
    !SHA256_RE.test(evidence[field])
  ) {
    return false;
  }
  const stable = structuredClone(evidence);
  const actual = stable[field];
  delete stable[field];
  return actual === sha256(JSON.stringify(stable));
}

const expectedInstagramAccountId = "17841400000000001";
const expectedYoutubeChannelId =
  "UCR23z78qDtyhHIaV29rSB9A";
const SHA256_RE = /^[a-f0-9]{64}$/;

function metadataContract(unit) {
  return sha256(
    JSON.stringify({
      discoveryMetadataContractVersion:
        unit.discoveryMetadataContractVersion,
      discoveryMetadataGate: unit.discoveryMetadataGate,
      instagramMetadata: unit.instagramMetadata,
      youtubeMetadata: unit.youtubeMetadata,
    }),
  );
}

function baseMetadata() {
  return {
    discoveryMetadataContractVersion:
      "money_shorts_platform_discovery_v1",
    discoveryMetadataGate: { ok: true, reasons: [] },
    instagramMetadata: {
      discoveryContractVersion:
        "money_shorts_platform_discovery_v1",
      primaryKeywords: ["노후준비", "연금", "돈관리"],
      captionFirstLineHook:
        "자산을 키우는 사람은 미래의 월급부터 만든다 2편",
      caption:
        "핵심 주제: 노후준비 · 연금 · 돈관리\n\n노후 준비는 큰 목돈보다 끊기지 않는 시간과 소비보다 앞선 순서가 만듭니다.\n\n개인 상황에 따라 결과는 달라질 수 있으며 투자 권유가 아닌 일반 금융 정보입니다.",
      hashtags: [
        "노후준비",
        "연금",
        "돈관리",
        "생활경제",
      ],
      callToAction:
        "다음 선택 전에 저장해 두고 필요한 사람에게 공유하세요.",
      recommendationEligibilityReviewRequired: true,
      originalContent: true,
      shareToFeed: true,
      forbiddenUnrelatedTrendTags: true,
    },
    youtubeMetadata: {
      discoveryContractVersion:
        "money_shorts_platform_discovery_v1",
      primaryKeywords: ["노후준비", "연금", "돈관리"],
      titleBase:
        "자산을 키우는 사람은 미래의 월급부터 만든다 2편",
      titleWithShortsSuffix:
        "자산을 키우는 사람은 미래의 월급부터 만든다 2편 #Shorts",
      descriptionBase:
        "노후 준비를 위한 미래 현금흐름과 돈 관리 순서를 설명합니다.\n\n핵심 주제: 노후준비 · 연금 · 돈관리\n\n개인 상황에 따라 결과는 달라질 수 있으며 투자 권유가 아닌 일반 금융 정보입니다.\n\n#Shorts #노후준비 #돈관리",
      tags: [
        "노후준비",
        "연금",
        "돈관리",
        "생활경제",
      ],
      categoryId: "27",
      defaultLanguage: "ko",
      privacyStatus: "public",
      selfDeclaredMadeForKids: false,
      containsSyntheticMedia: true,
    },
  };
}

function publishedRecord({
  contentId,
  platform,
  version,
  publishedId,
}) {
  return {
    key: buildPublishLedgerKey(
      contentId,
      platform,
      version,
    ),
    contentId,
    platform,
    version,
    variantId:
      platform === "instagram_reels"
        ? "instagram_reels_full_frame_1080x1920"
        : "youtube_shorts_letterbox_1080x1920",
    publishedId,
    ...(platform === "youtube_shorts"
      ? {
          publishedUrl:
            `https://www.youtube.com/shorts/${publishedId}`,
        }
      : {}),
    status: "published",
    publishedAtIso: "2026-07-19T00:00:00.000Z",
    metadata: { fixture: true },
  };
}

function createFixture(label) {
  const root = mkdtempSync(
    join(tmpdir(), `part2-dual-safe-${label}-`),
  );
  const outDir = join(root, "publish", "part-2");
  mkdirSync(outDir, { recursive: true });
  const sourcePath = join(root, "part-2-final.mp4");
  const sourceBytes = Buffer.from(
    `fixture-video-${label}-part-2`,
    "utf8",
  );
  writeFileSync(sourcePath, sourceBytes);
  const sourceSha256 = sha256(sourceBytes);
  const sourceSize = sourceBytes.length;
  const topicId = `finance-fixture-${label}`;
  const contentId = `wizard-${topicId}-part-2`;
  const part1ContentId = `wizard-${topicId}-part-1`;
  const version = "v5";
  const unit = {
    schemaVersion: "dual_platform_content_unit_v1",
    contentId,
    version,
    wizardTopicId: topicId,
    wizardProductionPartId: "part-2",
    series: {
      strategyContractVersion:
        "money_shorts_semantic_prehook_series_v1",
      canonicalTitle:
        "자산을 키우는 사람은 미래의 월급부터 만든다",
      platformTitle:
        "자산을 키우는 사람은 미래의 월급부터 만든다 2편",
      partNumber: 2,
      totalParts: 2,
      explicitContinuationCue: false,
      explicitPartMarker: true,
    },
    ...baseMetadata(),
    instagramSourcePath: sourcePath,
    youtubeSourcePath: sourcePath,
    existingPublishedKeys: [],
  };
  const metadataSha256 = metadataContract(unit);
  const part1 = {
    partId: "part-1",
    wizardScriptFingerprint: "a".repeat(40),
    audioSha256: "1".repeat(64),
    imageSetSha256: "2".repeat(64),
    finalMp4Sha256: "3".repeat(64),
    publishMetadataSha256: "4".repeat(64),
    durationSec: 47.97,
    sizeBytes: 100,
  };
  const part2 = {
    partId: "part-2",
    wizardScriptFingerprint: "b".repeat(40),
    audioSha256: "5".repeat(64),
    imageSetSha256: "6".repeat(64),
    finalMp4Sha256: sourceSha256,
    publishMetadataSha256: metadataSha256,
    durationSec: 46.13,
    sizeBytes: sourceSize,
  };
  unit.ownerFinalVideoApproval =
    buildMoneyShortsFinalVideoOwnerApprovalEvidence({
      topicId,
      parts: [part1, part2],
      acceptedAt: "2026-07-19T00:00:00.000Z",
    });
  unit.sourceIntegrity = {
    contractVersion:
      "money_shorts_final_video_owner_approval_v1",
    rootTopicId: topicId,
    productionPartId: "part-2",
    finalVideoApprovalFingerprint:
      unit.ownerFinalVideoApproval
        .finalVideoApprovalFingerprint,
    finalMp4Sha256: sourceSha256,
    publishMetadataSha256: metadataSha256,
    imageSetSha256: part2.imageSetSha256,
    audioSha256: part2.audioSha256,
    wizardScriptFingerprint:
      part2.wizardScriptFingerprint,
    durationSec: part2.durationSec,
    sizeBytes: sourceSize,
  };

  const manifestPath = join(
    outDir,
    `dual_platform_content_unit.${contentId}.${version}.json`,
  );
  writeFileSync(
    manifestPath,
    `${JSON.stringify(unit, null, 2)}\n`,
    "utf8",
  );
  const manifestSha256 = sha256(
    readFileSync(manifestPath),
  );
  const currentBinding = {
    contentId,
    version,
    productionPartId: "part-2",
    contentUnitManifestPath: manifestPath,
    contentUnitSha256: manifestSha256,
    instagramSourceSha256: sourceSha256,
    youtubeSourceSha256: sourceSha256,
    publishMetadataSha256: metadataSha256,
    finalVideoApprovalFingerprint:
      unit.ownerFinalVideoApproval
        .finalVideoApprovalFingerprint,
  };
  const publicationAttemptFingerprint =
    fingerprintMoneyShortsPublishAttemptBinding(
      currentBinding,
    );
  const genericBinding =
    buildMoneyShortsPublishPreflightBinding({
      current: {
        contentUnitManifestPath: manifestPath,
        contentUnitSha256: manifestSha256,
        instagramSourceSha256: sourceSha256,
        youtubeSourceSha256: sourceSha256,
        publishMetadataSha256: metadataSha256,
        finalVideoApprovalFingerprint:
          currentBinding.finalVideoApprovalFingerprint,
      },
      boundAt: "2026-07-19T00:00:00.000Z",
    });
  writeFileSync(
    join(outDir, "final-e2e-publish-preflight.json"),
    `${JSON.stringify({
      schemaVersion:
        "final_e2e_dual_platform_publish_result_v1",
      status: "PREFLIGHT_ONLY_OK",
      blockerCode: null,
      armed: false,
      contentId,
      version,
      wizardProductionPartId: "part-2",
      publicationAttemptFingerprint,
      ...genericBinding,
      artifactBindingVersion:
        genericBinding.schemaVersion,
    }, null, 2)}\n`,
    "utf8",
  );
  const ledgerPath = join(root, "publish-ledger.json");
  const initialRecords = [
    publishedRecord({
      contentId: part1ContentId,
      platform: "instagram_reels",
      version,
      publishedId: "17800000000000001",
    }),
    publishedRecord({
      contentId: part1ContentId,
      platform: "youtube_shorts",
      version,
      publishedId: "Part1YT001",
    }),
  ];
  writeFileSync(
    ledgerPath,
    `${JSON.stringify({
      schemaVersion: "publish_ledger_v1",
      records: initialRecords,
    }, null, 2)}\n`,
    "utf8",
  );
  const baseArgs = [
    "--approval",
    "APPROVE_MONEY_SHORTS_PART2_DUAL_PLATFORM_PUBLISH_SAFE_V1",
    "--content-unit",
    manifestPath,
    "--ledger",
    ledgerPath,
    "--out-dir",
    outDir,
    "--expected-content-id",
    contentId,
    "--expected-manifest-sha256",
    manifestSha256,
    "--expected-source-sha256",
    sourceSha256,
    "--expected-publication-attempt-fingerprint",
    publicationAttemptFingerprint,
    "--expected-instagram-account-id",
    expectedInstagramAccountId,
    "--expected-youtube-channel-id",
    expectedYoutubeChannelId,
  ];
  return {
    root,
    outDir,
    ledgerPath,
    manifestPath,
    contentId,
    part1ContentId,
    version,
    sourceSha256,
    currentBinding,
    initialRecords,
    baseArgs,
  };
}

function writeGenericPart2SafeRunnerHandoff(
  fixture,
  overrides = {},
) {
  const evidence = {
    schemaVersion:
      "final_e2e_dual_platform_publish_result_v1",
    approvalToken:
      "APPROVE_FINAL_E2E_AUTOMATION_PUBLISH_ONE_NEW_CONTENT_UNIT",
    status: "BLOCKED",
    blockerCode: "PART2_SAFE_RUNNER_REQUIRED",
    armed: true,
    finishedAtIso: "2026-07-19T00:00:01.000Z",
    contentUnitManifestPath: fixture.manifestPath,
    ledgerPath: fixture.ledgerPath,
    envSecretValuesPrinted: false,
    dotEnvLocalDirectRead: false,
    sideEffectCounters: {
      blobPutCount: 0,
      blobHeadCount: 0,
      instagramContainerCreateCount: 0,
      instagramStatusPollCount: 0,
      instagramPublishCount: 0,
      youtubeInsertCount: 0,
      ledgerWriteCount: 0,
      envSecretValuePrintCount: 0,
    },
    contentId: fixture.contentId,
    version: fixture.version,
    wizardProductionPartId: "part-2",
    contentUnitSha256:
      fixture.currentBinding.contentUnitSha256,
    instagramSourceSha256:
      fixture.currentBinding.instagramSourceSha256,
    youtubeSourceSha256:
      fixture.currentBinding.youtubeSourceSha256,
    publishMetadataSha256:
      fixture.currentBinding.publishMetadataSha256,
    finalVideoApprovalFingerprint:
      fixture.currentBinding
        .finalVideoApprovalFingerprint,
    publicationAttemptFingerprint:
      fingerprintMoneyShortsPublishAttemptBinding(
        fixture.currentBinding,
      ),
    ownerRunHint:
      "Use part2-only-dual-publish through the Owner no-log wrapper after its dedicated preflight.",
    ...overrides,
  };
  writeFileSync(
    join(fixture.outDir, "final-e2e-publish-result.json"),
    `${JSON.stringify(evidence, null, 2)}\n`,
    "utf8",
  );
  return evidence;
}

function fakeEnv(
  instagramId = expectedInstagramAccountId,
  instagramAccessToken = "fake-instagram-token",
) {
  return {
    INSTAGRAM_BUSINESS_ACCOUNT_ID: instagramId,
    INSTAGRAM_ACCESS_TOKEN: instagramAccessToken,
    YOUTUBE_CLIENT_ID: "fake-youtube-client",
    YOUTUBE_CLIENT_SECRET: "fake-youtube-secret",
    YOUTUBE_REFRESH_TOKEN: "fake-youtube-refresh",
    BLOB_READ_WRITE_TOKEN: "fake-blob-token",
  };
}

function successfulAdapters(calls, overrides = {}) {
  return {
    async verifyInstagramAccount() {
      calls.push("verifyInstagramAccount");
      return (
        overrides.instagramIdentity ?? {
          ok: true,
          accountId: expectedInstagramAccountId,
        }
      );
    },
    async verifyYoutubeChannel() {
      calls.push("verifyYoutubeChannel");
      return (
        overrides.youtubeIdentity ?? {
          ok: true,
          channelId: expectedYoutubeChannelId,
        }
      );
    },
    async putBlob() {
      calls.push("putBlob");
      return { url: "https://blob.example/part2.mp4" };
    },
    async headBlob() {
      calls.push("headBlob");
      return {
        ok: true,
        status: 200,
        headers: { get: () => "video/mp4" },
      };
    },
    async createInstagramContainer(input) {
      calls.push("createInstagramContainer");
      if (
        typeof overrides.instagramContainer === "function"
      ) {
        return overrides.instagramContainer(input);
      }
      return {
        ...(overrides.instagramContainer ?? {
          ok: true,
          containerId: "17900000000000001",
          diagnostic: {
            responseReceived: true,
            httpStatus: 200,
            responseOk: true,
            jsonParsed: true,
            containerIdPresent: true,
            providerError: {
              code: null,
              errorSubcode: null,
              type: null,
              isTransient: null,
            },
          },
        }),
      };
    },
    async readInstagramContainer() {
      calls.push("readInstagramContainer");
      return { ok: true, statusCode: "FINISHED" };
    },
    async publishInstagram() {
      calls.push("publishInstagram");
      return {
        ok: true,
        mediaId: "18000000000000001",
      };
    },
    async insertYoutube() {
      calls.push("insertYoutube");
      if (overrides.youtubeInsertThrows) {
        throw new Error("fixture insert unknown");
      }
      return { data: { id: "Part2YT002" } };
    },
    async sleep() {
      calls.push("sleep");
    },
  };
}

const invalidAuthorization =
  validateMoneyShortsPart2DualPublishSafeAuthorization({
    armed: false,
    approval: "WRONG",
  });
check(
  "wrong approval is rejected by pure authorization",
  invalidAuthorization.ok === false,
);
check(
  "part-1 binding is rejected by part-2 plan",
  buildMoneyShortsPart2DualPublishSafePlan({
    currentBinding: {
      contentId: "fixture-part-1",
      version: "v5",
      productionPartId: "part-1",
      contentUnitManifestPath: "C:\\tmp\\fixture.json",
      contentUnitSha256: "1".repeat(64),
      instagramSourceSha256: "2".repeat(64),
      youtubeSourceSha256: "2".repeat(64),
      publishMetadataSha256: "3".repeat(64),
      finalVideoApprovalFingerprint: "4".repeat(64),
    },
  }).ok === false,
);

let invalidEnvReadCount = 0;
const invalidRun =
  await runMoneyShortsPart2DualPublishSafe({
    argv: ["--approval", "WRONG"],
    envProvider: () => {
      invalidEnvReadCount += 1;
      return {};
    },
    adapterFactory: async () => {
      throw new Error("must not load adapter");
    },
  });
check(
  "authorization fails before filesystem/env/network",
  invalidRun.ok === false && invalidEnvReadCount === 0,
);

const diagnosticTokenSentinel =
  "DIAGNOSTIC_TOKEN_MUST_NOT_PERSIST";
const diagnosticMessageSentinel =
  "DIAGNOSTIC_RAW_MESSAGE_MUST_NOT_PERSIST";
const diagnosticParseSentinel =
  "DIAGNOSTIC_PARSE_ERROR_MUST_NOT_PERSIST";

async function invokeContainerSeam({
  status,
  ok,
  payload,
  jsonErrorMessage = null,
}) {
  const calls = [];
  const result =
    await createMoneyShortsInstagramContainerOnce({
      accountId: expectedInstagramAccountId,
      accessToken: diagnosticTokenSentinel,
      videoUrl: "https://blob.example/part2.mp4",
      caption: "safe fixture caption",
      shareToFeed: true,
      fetchImpl: async (url, init) => {
        calls.push({ url, init });
        return {
          status,
          ok,
          async json() {
            if (jsonErrorMessage) {
              throw new Error(jsonErrorMessage);
            }
            return payload;
          },
        };
      },
    });
  return { calls, result };
}

const graphErrorSeam = await invokeContainerSeam({
  status: 400,
  ok: false,
  payload: {
    error: {
      code: 190,
      error_subcode: 463,
      type: "OAuthException",
      is_transient: false,
      message: diagnosticMessageSentinel,
      fbtrace_id: diagnosticTokenSentinel,
    },
  },
});
const successNoIdSeam = await invokeContainerSeam({
  status: 200,
  ok: true,
  payload: {
    success: true,
    access_token: diagnosticTokenSentinel,
  },
});
const invalidJsonSeam = await invokeContainerSeam({
  status: 200,
  ok: true,
  payload: null,
  jsonErrorMessage: diagnosticParseSentinel,
});
const invalidIdSeam = await invokeContainerSeam({
  status: 200,
  ok: true,
  payload: {
    id: diagnosticTokenSentinel,
  },
});
const validIdSeam = await invokeContainerSeam({
  status: 200,
  ok: true,
  payload: {
    id: "17900000000000001",
    access_token: diagnosticTokenSentinel,
  },
});

check(
  "container seam preserves only structured Graph error diagnostics",
  graphErrorSeam.result.ok === false &&
    graphErrorSeam.result.containerId === null &&
    graphErrorSeam.result.diagnostic?.httpStatus === 400 &&
    graphErrorSeam.result.diagnostic?.responseOk === false &&
    graphErrorSeam.result.diagnostic?.jsonParsed === true &&
    graphErrorSeam.result.diagnostic?.containerIdPresent ===
      false &&
    graphErrorSeam.result.diagnostic?.providerError?.code ===
      190 &&
    graphErrorSeam.result.diagnostic?.providerError
      ?.errorSubcode === 463 &&
    graphErrorSeam.result.diagnostic?.providerError?.type ===
      "OAuthException" &&
    graphErrorSeam.result.diagnostic?.providerError
      ?.isTransient === false,
);
check(
  "container seam distinguishes HTTP 200 without an id",
  successNoIdSeam.result.ok === false &&
    successNoIdSeam.result.containerId === null &&
    successNoIdSeam.result.diagnostic?.httpStatus === 200 &&
    successNoIdSeam.result.diagnostic?.responseOk === true &&
    successNoIdSeam.result.diagnostic?.jsonParsed === true &&
    successNoIdSeam.result.diagnostic
      ?.containerIdPresent === false,
);
check(
  "container seam distinguishes a received non-JSON response",
  invalidJsonSeam.result.ok === false &&
    invalidJsonSeam.result.containerId === null &&
    invalidJsonSeam.result.diagnostic?.httpStatus === 200 &&
    invalidJsonSeam.result.diagnostic?.responseOk === true &&
    invalidJsonSeam.result.diagnostic?.jsonParsed === false &&
    invalidJsonSeam.result.diagnostic
      ?.containerIdPresent === false,
);
check(
  "container seam rejects a token-shaped provider id",
  invalidIdSeam.result.ok === false &&
    invalidIdSeam.result.containerId === null &&
    invalidIdSeam.result.diagnostic?.httpStatus === 200 &&
    invalidIdSeam.result.diagnostic?.responseOk === true &&
    invalidIdSeam.result.diagnostic?.jsonParsed === true &&
    invalidIdSeam.result.diagnostic?.containerIdPresent ===
      true &&
    !JSON.stringify(invalidIdSeam.result).includes(
      diagnosticTokenSentinel,
    ),
);
check(
  "container seam accepts only a valid public container id",
  validIdSeam.result.ok === true &&
    validIdSeam.result.containerId ===
      "17900000000000001" &&
    validIdSeam.result.diagnostic?.containerIdPresent ===
      true,
);
const seamRuns = [
  graphErrorSeam,
  successNoIdSeam,
  invalidJsonSeam,
  invalidIdSeam,
  validIdSeam,
];
check(
  "container seam keeps the exact one-POST v25 request surface",
  seamRuns.every(({ calls }) => {
    if (calls.length !== 1) return false;
    const [{ url, init }] = calls;
    return (
      url ===
        `https://graph.facebook.com/v25.0/${expectedInstagramAccountId}/media` &&
      init.method === "POST" &&
      init.redirect === "error" &&
      init.headers?.Authorization ===
        `Bearer ${diagnosticTokenSentinel}` &&
      init.headers?.["Content-Type"] ===
        "application/x-www-form-urlencoded" &&
      init.body?.get("media_type") === "REELS" &&
      init.body?.get("video_url") ===
        "https://blob.example/part2.mp4" &&
      init.body?.get("caption") ===
        "safe fixture caption" &&
      init.body?.get("share_to_feed") === "true" &&
      !url.includes(diagnosticTokenSentinel) &&
      !String(init.body).includes(
        diagnosticTokenSentinel,
      ) &&
      !String(init.body).includes("access_token")
    );
  }),
);
check(
  "container seam returns no token, raw message, trace, or parse error",
  seamRuns.every(({ result }) => {
    const serialized = JSON.stringify(result);
    return (
      !serialized.includes(diagnosticTokenSentinel) &&
      !serialized.includes(diagnosticMessageSentinel) &&
      !serialized.includes(diagnosticParseSentinel) &&
      !serialized.includes("fbtrace_id") &&
      !serialized.includes("message")
    );
  }),
);

const roots = [];
try {
  const handoffFixture = createFixture("generic-handoff");
  roots.push(handoffFixture.root);
  writeGenericPart2SafeRunnerHandoff(handoffFixture);
  const handoffDry =
    await runMoneyShortsPart2DualPublishSafe({
      argv: handoffFixture.baseArgs,
      envProvider: () => {
        throw new Error(
          "generic handoff dry-run must not read env",
        );
      },
    });
  check(
    "exact zero-side-effect generic part-2 result is accepted only as a safe-runner handoff",
    handoffDry.ok === true &&
      handoffDry.status === "PREFLIGHT_ONLY_OK" &&
      handoffDry.canonicalHandoffState ===
        "generic_part2_handoff",
    JSON.stringify(handoffDry),
  );
  const handoffCalls = [];
  const handoffArmed =
    await runMoneyShortsPart2DualPublishSafe({
      argv: [
        ...handoffFixture.baseArgs,
        "--expected-preflight-fingerprint",
        handoffDry.preflightFingerprint,
        "--arm",
      ],
      envProvider: () => fakeEnv(),
      adapterFactory: async () =>
        successfulAdapters(handoffCalls),
    });
  const handoffCanonical = JSON.parse(
    readFileSync(
      join(
        handoffFixture.outDir,
        "final-e2e-publish-result.json",
      ),
      "utf8",
    ),
  );
  check(
    "safe runner archives the generic handoff and replaces it with the successful canonical result",
    handoffArmed.ok === true &&
      handoffCanonical.status ===
        "PUBLISHED_DUAL_PLATFORM_OK" &&
      existsSync(
        join(
          handoffFixture.outDir,
          "final-e2e-publish-result.part2-safe-runner-required.handoff.json",
        ),
      ),
    JSON.stringify(handoffArmed),
  );
  check(
    "generic handoff promotion invokes only the dedicated part-2 adapters once",
    handoffCalls.join(",") ===
      [
        "verifyInstagramAccount",
        "verifyYoutubeChannel",
        "putBlob",
        "headBlob",
        "createInstagramContainer",
        "readInstagramContainer",
        "publishInstagram",
        "insertYoutube",
      ].join(","),
    handoffCalls.join(","),
  );

  const unsafeHandoffFixture = createFixture(
    "unsafe-generic-handoff",
  );
  roots.push(unsafeHandoffFixture.root);
  writeGenericPart2SafeRunnerHandoff(
    unsafeHandoffFixture,
    {
      sideEffectCounters: {
        blobPutCount: 1,
        blobHeadCount: 0,
        instagramContainerCreateCount: 0,
        instagramStatusPollCount: 0,
        instagramPublishCount: 0,
        youtubeInsertCount: 0,
        ledgerWriteCount: 0,
        envSecretValuePrintCount: 0,
      },
    },
  );
  let unsafeHandoffEnvReads = 0;
  const unsafeHandoff =
    await runMoneyShortsPart2DualPublishSafe({
      argv: unsafeHandoffFixture.baseArgs,
      envProvider: () => {
        unsafeHandoffEnvReads += 1;
        return fakeEnv();
      },
    });
  check(
    "any nonzero generic result side effect remains manual-review blocked before env access",
    unsafeHandoff.ok === false &&
      unsafeHandoffEnvReads === 0,
    JSON.stringify(unsafeHandoff),
  );

  const successFixture = createFixture("success");
  roots.push(successFixture.root);
  let dryEnvReads = 0;
  let dryAdapterLoads = 0;
  const dryRun =
    await runMoneyShortsPart2DualPublishSafe({
      argv: successFixture.baseArgs,
      envProvider: () => {
        dryEnvReads += 1;
        return fakeEnv();
      },
      adapterFactory: async () => {
        dryAdapterLoads += 1;
        return successfulAdapters([]);
      },
    });
  check(
    "dry-run creates exact safe preflight",
    dryRun.ok === true &&
      dryRun.status === "PREFLIGHT_ONLY_OK" &&
      SHA256_RE.test(
        String(dryRun.preflightFingerprint ?? ""),
      ) &&
      typeof dryRun.preflightPath === "string" &&
      existsSync(dryRun.preflightPath),
    JSON.stringify(dryRun),
  );
  check(
    "dry-run leaves an exact committed-source pair",
    existsSync(
      `${dryRun.preflightPath}.${dryRun.preflightFingerprint}.committed-source`,
    ),
  );
  const renameFailureEvidence = JSON.parse(
    readFileSync(dryRun.preflightPath, "utf8"),
  );
  const renameFailurePath = join(
    successFixture.root,
    "rename-failure",
    "evidence.json",
  );
  const renameFailureWrite =
    writeMoneyShortsPart2DualPublishSafeEvidenceOnce({
      path: renameFailurePath,
      evidence: renameFailureEvidence,
      fingerprintField: "preflightFingerprint",
      fsImpl: {
        ...nodeFs,
        renameSync() {
          throw new Error("injected rename failure");
        },
      },
    });
  check(
    "dedicated evidence writer rejects a prepared orphan after rename failure",
    renameFailureWrite.ok === false &&
      renameFailureWrite.reason ===
        "part2_dual_safe_evidence_commit_incomplete" &&
      existsSync(renameFailurePath) &&
      existsSync(
        `${renameFailurePath}.${dryRun.preflightFingerprint}.prepared`,
      ),
  );
  check(
    "dry-run has zero env/network/live action",
    dryEnvReads === 0 &&
      dryAdapterLoads === 0 &&
      dryRun.sideEffectCounters != null &&
      Object.values(dryRun.sideEffectCounters).every(
        (value) => value === 0,
      ),
  );
  const dryRepeat =
    await runMoneyShortsPart2DualPublishSafe({
      argv: successFixture.baseArgs,
      envProvider: () => {
        throw new Error("dry repeat env access");
      },
    });
  check(
    "identical dry-run is read-only and idempotent",
    dryRepeat.ok === true &&
      dryRepeat.alreadyPrepared === true &&
      dryRepeat.preflightFingerprint ===
        dryRun.preflightFingerprint,
  );
  let stalePreflightEnvReads = 0;
  const stalePreflight =
    await runMoneyShortsPart2DualPublishSafe({
      argv: [
        ...successFixture.baseArgs,
        "--expected-preflight-fingerprint",
        "f".repeat(64),
        "--arm",
      ],
      envProvider: () => {
        stalePreflightEnvReads += 1;
        return fakeEnv();
      },
    });
  check(
    "stale armed preflight fingerprint stops before env access",
    stalePreflight.ok === false &&
      stalePreflightEnvReads === 0,
  );

  const wrapperInvalid = spawnSync(
    process.execPath,
    [
      new URL(
        "./run-owner-command-with-local-env-no-log.mjs",
        import.meta.url,
      ).pathname.replace(/^\/([A-Za-z]:)/, "$1"),
      "part2-only-dual-publish",
      "--env-path",
      join(successFixture.root, "must-not-read.env"),
      ...successFixture.baseArgs.filter(
        (value, index, all) =>
          !(
            index === 0 &&
            value === "--approval"
          ) &&
          !(
            index === 1 &&
            all[0] === "--approval"
          ),
      ),
      "--arm",
    ],
    {
      cwd: process.cwd(),
      encoding: "utf8",
      env: {
        SystemRoot: process.env.SystemRoot,
        PATH: process.env.PATH,
        TEMP: process.env.TEMP,
        TMP: process.env.TMP,
      },
    },
  );
  const wrapperInvalidOutput =
    `${wrapperInvalid.stdout ?? ""}` +
    `${wrapperInvalid.stderr ?? ""}`;
  check(
    "wrapper rejects missing armed fingerprint before env diagnostics",
    wrapperInvalid.status !== 0 &&
      wrapperInvalidOutput.includes(
        "part2_dual_safe_required_evidence_invalid",
      ) &&
      !wrapperInvalidOutput.includes(
        "[owner-env-no-log] env file:",
      ),
  );

  let missingFingerprintEnvReads = 0;
  const missingFingerprint =
    await runMoneyShortsPart2DualPublishSafe({
      argv: [...successFixture.baseArgs, "--arm"],
      envProvider: () => {
        missingFingerprintEnvReads += 1;
        return fakeEnv();
      },
    });
  check(
    "armed run requires exact preflight before env access",
    missingFingerprint.ok === false &&
      missingFingerprintEnvReads === 0,
  );

  let mismatchedEnvAdapterLoads = 0;
  const mismatchedEnv =
    await runMoneyShortsPart2DualPublishSafe({
      argv: [
        ...successFixture.baseArgs,
        "--expected-preflight-fingerprint",
        dryRun.preflightFingerprint,
        "--arm",
      ],
      envProvider: () => fakeEnv("17841499999999999"),
      adapterFactory: async () => {
        mismatchedEnvAdapterLoads += 1;
        return successfulAdapters([]);
      },
    });
  check(
    "injected Instagram id mismatch stops before network and claim",
    mismatchedEnv.ok === false &&
      mismatchedEnvAdapterLoads === 0 &&
      !existsSync(
        join(
          successFixture.outDir,
          "final-e2e-publish-attempt-claim.json",
        ),
      ),
  );

  const calls = [];
  const success =
    await runMoneyShortsPart2DualPublishSafe({
      argv: [
        ...successFixture.baseArgs,
        "--expected-preflight-fingerprint",
        dryRun.preflightFingerprint,
        "--arm",
      ],
      envProvider: () => fakeEnv(),
      adapterFactory: async () =>
        successfulAdapters(calls),
    });
  check(
    "part-2 dedicated armed execution succeeds with fake adapters",
    success.ok === true &&
      success.status === "PART2_DUAL_PUBLISH_OK" &&
      success.instagramMediaId ===
        "18000000000000001" &&
      success.youtubeVideoId === "Part2YT002",
  );
  check(
    "both identities are verified before first mutation",
    calls.indexOf("verifyInstagramAccount") <
      calls.indexOf("putBlob") &&
      calls.indexOf("verifyYoutubeChannel") <
        calls.indexOf("putBlob"),
  );
  check(
    "each mutation adapter is invoked exactly once",
    [
      "putBlob",
      "createInstagramContainer",
      "publishInstagram",
      "insertYoutube",
    ].every(
      (name) =>
        calls.filter((candidate) => candidate === name)
          .length === 1,
    ),
  );
  check(
    "automatic retry and part-1 action counters remain zero",
    success.sideEffectCounters.automaticRetryCount === 0 &&
      success.sideEffectCounters.part1ActionCount === 0,
  );
  const successSafePaths =
    moneyShortsPart2DualPublishSafePaths(
      successFixture.outDir,
    );
  let previousSafeEvidenceSha256 = sha256(
    readFileSync(successSafePaths.claimPath),
  );
  let rawSafeEvidenceChainValid = true;
  const safeEventNames = nodeFs
    .readdirSync(successSafePaths.eventDir)
    .filter((name) => /^\d{2}-.*\.json$/.test(name))
    .sort();
  for (const eventName of safeEventNames) {
    const eventBytes = readFileSync(
      join(successSafePaths.eventDir, eventName),
    );
    const event = JSON.parse(eventBytes.toString("utf8"));
    if (
      event.previousEvidenceSha256 !==
      previousSafeEvidenceSha256
    ) {
      rawSafeEvidenceChainValid = false;
      break;
    }
    previousSafeEvidenceSha256 = sha256(eventBytes);
  }
  const safeResultEvidence = JSON.parse(
    readFileSync(
      successSafePaths.resultPath,
      "utf8",
    ),
  );
  check(
    "safe claim, events, and result form one raw-file SHA chain",
    safeEventNames.length > 0 &&
      rawSafeEvidenceChainValid &&
      safeResultEvidence.latestTransition === "complete" &&
      safeResultEvidence.latestEventSha256 ===
        previousSafeEvidenceSha256,
  );

  const containerFailureScenarios = [
    {
      label: "container-graph-400",
      status: 400,
      ok: false,
      payload: {
        error: {
          code: 190,
          error_subcode: 463,
          type: "OAuthException",
          is_transient: false,
          message: diagnosticMessageSentinel,
          fbtrace_id: diagnosticTokenSentinel,
        },
      },
      jsonErrorMessage: null,
      expectedDiagnostic: graphErrorSeam.result.diagnostic,
    },
    {
      label: "container-success-no-id",
      status: 200,
      ok: true,
      payload: {
        success: true,
        raw: diagnosticMessageSentinel,
      },
      jsonErrorMessage: null,
      expectedDiagnostic:
        successNoIdSeam.result.diagnostic,
    },
    {
      label: "container-invalid-json",
      status: 200,
      ok: true,
      payload: null,
      jsonErrorMessage: diagnosticParseSentinel,
      expectedDiagnostic:
        invalidJsonSeam.result.diagnostic,
    },
    {
      label: "container-token-shaped-id",
      status: 200,
      ok: true,
      payload: {
        id: diagnosticTokenSentinel,
      },
      jsonErrorMessage: null,
      expectedDiagnostic:
        invalidIdSeam.result.diagnostic,
    },
  ];
  for (const scenario of containerFailureScenarios) {
    const fixture = createFixture(scenario.label);
    roots.push(fixture.root);
    const dry =
      await runMoneyShortsPart2DualPublishSafe({
        argv: fixture.baseArgs,
      });
    const orchestrationCalls = [];
    const containerFetchCalls = [];
    let ledgerWriterCalls = 0;
    const failure =
      await runMoneyShortsPart2DualPublishSafe({
        argv: [
          ...fixture.baseArgs,
          "--expected-preflight-fingerprint",
          dry.preflightFingerprint,
          "--arm",
        ],
        envProvider: () =>
          fakeEnv(
            expectedInstagramAccountId,
            diagnosticTokenSentinel,
          ),
        adapterFactory: async ({
          credentials,
          expectedInstagramAccountId:
            boundInstagramAccountId,
        }) =>
          successfulAdapters(orchestrationCalls, {
            instagramContainer: async ({
              videoUrl,
              caption,
              shareToFeed,
            }) =>
              createMoneyShortsInstagramContainerOnce({
                accountId: boundInstagramAccountId,
                accessToken:
                  credentials.INSTAGRAM_ACCESS_TOKEN,
                videoUrl,
                caption,
                shareToFeed,
                fetchImpl: async (url, init) => {
                  containerFetchCalls.push({
                    url,
                    init,
                  });
                  return {
                    status: scenario.status,
                    ok: scenario.ok,
                    async json() {
                      if (scenario.jsonErrorMessage) {
                        throw new Error(
                          scenario.jsonErrorMessage,
                        );
                      }
                      return scenario.payload;
                    },
                  };
                },
              }),
          }),
        ledgerWriter: () => {
          ledgerWriterCalls += 1;
          return {
            ok: false,
            committed: false,
            lockReleased: true,
          };
        },
      });
    const failurePaths =
      moneyShortsPart2DualPublishSafePaths(
        fixture.outDir,
      );
    const failureSafeResult = JSON.parse(
      readFileSync(failurePaths.resultPath, "utf8"),
    );
    const failureCanonicalBytes = readFileSync(
      join(
        fixture.outDir,
        "final-e2e-publish-result.json",
      ),
    );
    const failureCanonical = JSON.parse(
      failureCanonicalBytes.toString("utf8"),
    );
    const failureEventText = nodeFs
      .readdirSync(failurePaths.eventDir)
      .filter((name) => /^\d{2}-.*\.json$/.test(name))
      .sort()
      .map((name) =>
        readFileSync(
          join(failurePaths.eventDir, name),
          "utf8",
        ),
      )
      .join("\n");
    const safeDiagnostic =
      failureSafeResult.publicState?.instagram
        ?.containerCreateDiagnostic;
    const canonicalDiagnostic =
      failureCanonical.executionResult?.instagram
        ?.containerCreateDiagnostic;
    check(
      `${scenario.label} stops before every downstream publication action`,
      failure.ok === false &&
        failure.blockerCode ===
          "PART2_DUAL_SAFE_INSTAGRAM_CONTAINER_NO_ID" &&
        containerFetchCalls.length === 1 &&
        orchestrationCalls.filter(
          (name) => name === "createInstagramContainer",
        ).length === 1 &&
        !orchestrationCalls.includes(
          "readInstagramContainer",
        ) &&
        !orchestrationCalls.includes("publishInstagram") &&
        !orchestrationCalls.includes("insertYoutube") &&
        !orchestrationCalls.includes("sleep") &&
        ledgerWriterCalls === 0 &&
        failure.sideEffectCounters
          .instagramContainerCreateCount === 1 &&
        failure.sideEffectCounters
          .instagramStatusPollCount === 0 &&
        failure.sideEffectCounters.instagramPublishCount ===
          0 &&
        failure.sideEffectCounters.youtubeInsertCount === 0 &&
        failure.sideEffectCounters.ledgerWriteCount === 0 &&
        failure.sideEffectCounters.automaticRetryCount === 0,
    );
    check(
      `${scenario.label} stores the same allowlisted diagnostic in both results`,
      JSON.stringify(safeDiagnostic) ===
        JSON.stringify(scenario.expectedDiagnostic) &&
        JSON.stringify(canonicalDiagnostic) ===
          JSON.stringify(scenario.expectedDiagnostic) &&
        failureSafeResult.automaticRetryAllowed === false &&
        failureSafeResult.externalRecoveryEnabled === false,
    );
    const attempt =
      inspectMoneyShortsPublishAttemptEvidence({
        outDir: fixture.outDir,
        currentBinding: fixture.currentBinding,
      });
    const allFailureEvidence = [
      JSON.stringify(failure),
      JSON.stringify(failureSafeResult),
      failureCanonicalBytes.toString("utf8"),
      failureEventText,
      readFileSync(failurePaths.claimPath, "utf8"),
      JSON.stringify(attempt.claimFile.evidence),
      JSON.stringify(attempt.events),
    ].join("\n");
    check(
      `${scenario.label} evidence excludes credentials and raw provider errors`,
      attempt.valid === true &&
        !allFailureEvidence.includes(
          diagnosticTokenSentinel,
        ) &&
        !allFailureEvidence.includes(
          diagnosticMessageSentinel,
        ) &&
        !allFailureEvidence.includes(
          diagnosticParseSentinel,
        ) &&
        !allFailureEvidence.includes("fbtrace_id") &&
        !allFailureEvidence.includes("access_token"),
    );
    const recovery =
      classifyMoneyShortsPublishRecovery({
        resultFile: {
          exists: true,
          parseOk: true,
          sha256: sha256(failureCanonicalBytes),
          evidence: failureCanonical,
        },
        attemptFile: attempt.claimFile,
        attemptEvidence: {
          present: attempt.exists === true,
          journalValid: attempt.valid === true,
          claimSha256: attempt.claimFile.sha256,
          eventCount: attempt.events.length,
          latestTransition:
            attempt.latestEvent?.transition,
          latestEventSha256:
            attempt.latestEvent?.eventSha256,
        },
        currentBinding: fixture.currentBinding,
        ledgerEvidence: {
          readOk: true,
          instagramAlreadyPublished: false,
          youtubeAlreadyPublished: false,
          instagramPublishedIdReference: null,
          youtubePublishedIdReference: null,
        },
      });
    check(
      `${scenario.label} remains ambiguous and manually gated`,
      recovery.state === "ambiguous" &&
        recovery.reason ===
          "instagram_publish_outcome_unknown" &&
        recovery.automaticRetryAllowed === false &&
        recovery.externalRecoveryEnabled === false &&
        recovery.recoverablePlatformCandidate === null,
    );
    const tamperedSafeResult =
      structuredClone(failureSafeResult);
    tamperedSafeResult.publicState.instagram
      .containerCreateDiagnostic.httpStatus =
      scenario.status === 400 ? 401 : 299;
    check(
      `${scenario.label} diagnostic is fingerprint-bound`,
      evidenceFingerprintMatches(failureSafeResult) &&
        evidenceFingerprintMatches(failureCanonical) &&
        !evidenceFingerprintMatches(tamperedSafeResult),
    );
  }

  const initialLedgerBytes = Buffer.from(
    `${JSON.stringify({
      schemaVersion: "publish_ledger_v1",
      records: successFixture.initialRecords,
    }, null, 2)}\n`,
    "utf8",
  );
  const changedLedgerBytes = Buffer.from(
    `${JSON.stringify({
      schemaVersion: "publish_ledger_v1",
      records: [
        ...successFixture.initialRecords,
        publishedRecord({
          contentId: "wizard-concurrent-other-part-1",
          platform: "youtube_shorts",
          version: successFixture.version,
          publishedId: "Concurrent001",
        }),
      ],
    }, null, 2)}\n`,
    "utf8",
  );
  let ledgerSnapshotReadCount = 0;
  const consistentLedgerSnapshot =
    readLedgerSnapshot(
      successFixture.ledgerPath,
      successFixture.contentId,
      successFixture.version,
      () => {
        ledgerSnapshotReadCount += 1;
        return ledgerSnapshotReadCount === 1
          ? initialLedgerBytes
          : changedLedgerBytes;
      },
    );
  check(
    "ledger snapshot hashes and parses one identical byte read",
    consistentLedgerSnapshot.ok === true &&
      ledgerSnapshotReadCount === 1 &&
      consistentLedgerSnapshot.sha256 ===
        sha256(initialLedgerBytes) &&
      consistentLedgerSnapshot.ledger.records.length ===
        successFixture.initialRecords.length &&
      consistentLedgerSnapshot.clean === true &&
      consistentLedgerSnapshot.instagramRecord === null &&
      consistentLedgerSnapshot.youtubeRecord === null,
  );

  const ledgerAfter = readPublishLedgerReadOnly(
    successFixture.ledgerPath,
  );
  check(
    "part-1 ledger records are byte-logically preserved",
    ledgerAfter.ok === true &&
      successFixture.initialRecords.every((expected) => {
        const actual = ledgerAfter.ledger.records.find(
          (record) => record.key === expected.key,
        );
        return (
          actual &&
          JSON.stringify(actual) === JSON.stringify(expected)
        );
      }),
  );
  check(
    "part-2 ledger receives exactly two matching records",
    ledgerAfter.ledger.records.filter(
      (record) =>
        record.contentId === successFixture.contentId &&
        record.version === successFixture.version,
    ).length === 2,
  );

  const committedFailureFixture =
    createFixture("ledger-committed-failure");
  roots.push(committedFailureFixture.root);
  const committedFailureDry =
    await runMoneyShortsPart2DualPublishSafe({
      argv: committedFailureFixture.baseArgs,
    });
  const committedFailure =
    await runMoneyShortsPart2DualPublishSafe({
      argv: [
        ...committedFailureFixture.baseArgs,
        "--expected-preflight-fingerprint",
        committedFailureDry.preflightFingerprint,
        "--arm",
      ],
      envProvider: () => fakeEnv(),
      adapterFactory: async () =>
        successfulAdapters([]),
      ledgerWriter: () => ({
        ok: false,
        committed: true,
        lockReleased: true,
        reason: "injected_ledger_readback_mismatch",
      }),
    });
  check(
    "committed ledger write with failed exact readback never succeeds",
    committedFailure.ok === false &&
      committedFailure.blockerCode ===
        "PART2_DUAL_SAFE_LEDGER_WRITE_FAILED",
    JSON.stringify(committedFailure),
  );

  const tamperedLedgerFixture =
    createFixture("ledger-full-binding");
  roots.push(tamperedLedgerFixture.root);
  const tamperedLedgerDry =
    await runMoneyShortsPart2DualPublishSafe({
      argv: tamperedLedgerFixture.baseArgs,
    });
  const tamperedLedger =
    await runMoneyShortsPart2DualPublishSafe({
      argv: [
        ...tamperedLedgerFixture.baseArgs,
        "--expected-preflight-fingerprint",
        tamperedLedgerDry.preflightFingerprint,
        "--arm",
      ],
      envProvider: () => fakeEnv(),
      adapterFactory: async () =>
        successfulAdapters([]),
      ledgerWriter: (path, ledger, options) => {
        const written = writePublishLedgerRuntime(
          path,
          ledger,
          options,
        );
        const changed = JSON.parse(
          readFileSync(path, "utf8"),
        );
        changed.records[0] = {
          ...changed.records[0],
          metadata: {
            ...changed.records[0].metadata,
            injectedConcurrentChange: true,
          },
        };
        writeFileSync(
          path,
          `${JSON.stringify(changed, null, 2)}\n`,
          "utf8",
        );
        return written;
      },
    });
  check(
    "final ledger readback is bound to the full expected bytes",
    tamperedLedger.ok === false &&
      tamperedLedger.blockerCode ===
        "PART2_DUAL_SAFE_LEDGER_READBACK_FAILED",
    JSON.stringify(tamperedLedger),
  );

  const attempt =
    inspectMoneyShortsPublishAttemptEvidence({
      outDir: successFixture.outDir,
      currentBinding: successFixture.currentBinding,
    });
  const canonicalResultPath = join(
    successFixture.outDir,
    "final-e2e-publish-result.json",
  );
  const canonicalBytes = readFileSync(
    canonicalResultPath,
  );
  const canonicalResult = JSON.parse(
    canonicalBytes.toString("utf8"),
  );
  const igRecord = ledgerAfter.ledger.records.find(
    (record) =>
      record.key ===
      buildPublishLedgerKey(
        successFixture.contentId,
        "instagram_reels",
        successFixture.version,
      ),
  );
  const ytRecord = ledgerAfter.ledger.records.find(
    (record) =>
      record.key ===
      buildPublishLedgerKey(
        successFixture.contentId,
        "youtube_shorts",
        successFixture.version,
      ),
  );
  const recovery =
    classifyMoneyShortsPublishRecovery({
      resultFile: {
        exists: true,
        parseOk: true,
        sha256: sha256(canonicalBytes),
        evidence: canonicalResult,
      },
      attemptFile: attempt.claimFile,
      attemptEvidence: {
        present: attempt.exists === true,
        journalValid: attempt.valid === true,
        claimSha256: attempt.claimFile.sha256,
      },
      currentBinding: successFixture.currentBinding,
      ledgerEvidence: {
        readOk: true,
        instagramAlreadyPublished: Boolean(igRecord),
        youtubeAlreadyPublished: Boolean(ytRecord),
        instagramPublishedIdReference:
          igRecord?.publishedId ?? null,
        youtubePublishedIdReference:
          ytRecord?.publishedId ?? null,
      },
    });
  check(
    "canonical result remains compatible with complete recovery classifier",
    recovery.state === "complete",
    `${recovery.state}/${recovery.reason}`,
  );

  let rerunAdapterLoads = 0;
  const rerun =
    await runMoneyShortsPart2DualPublishSafe({
      argv: [
        ...successFixture.baseArgs,
        "--expected-preflight-fingerprint",
        dryRun.preflightFingerprint,
        "--arm",
      ],
      envProvider: () => fakeEnv(),
      adapterFactory: async () => {
        rerunAdapterLoads += 1;
        return successfulAdapters([]);
      },
    });
  check(
    "any completed attempt blocks automatic rerun",
    rerun.ok === false && rerunAdapterLoads === 0,
  );

  const identityFixture = createFixture("identity");
  roots.push(identityFixture.root);
  const identityDry =
    await runMoneyShortsPart2DualPublishSafe({
      argv: identityFixture.baseArgs,
    });
  const identityCalls = [];
  const identityFailure =
    await runMoneyShortsPart2DualPublishSafe({
      argv: [
        ...identityFixture.baseArgs,
        "--expected-preflight-fingerprint",
        identityDry.preflightFingerprint,
        "--arm",
      ],
      envProvider: () => fakeEnv(),
      adapterFactory: async () =>
        successfulAdapters(identityCalls, {
          instagramIdentity: {
            ok: true,
            accountId: "17841411111111111",
          },
        }),
    });
  check(
    "Instagram API identity mismatch has zero mutations",
    identityFailure.ok === false &&
      identityCalls.join(",") ===
        "verifyInstagramAccount" &&
      identityFailure.sideEffectCounters.blobPutCount ===
        0 &&
      identityFailure.sideEffectCounters
        .instagramContainerCreateCount === 0 &&
      identityFailure.sideEffectCounters
        .youtubeInsertCount === 0,
  );
  const identityRerun =
    await runMoneyShortsPart2DualPublishSafe({
      argv: [
        ...identityFixture.baseArgs,
        "--expected-preflight-fingerprint",
        identityDry.preflightFingerprint,
        "--arm",
      ],
      envProvider: () => fakeEnv(),
      adapterFactory: async () =>
        successfulAdapters([]),
    });
  check(
    "identity mismatch evidence blocks automatic retry",
    identityRerun.ok === false,
  );

  const youtubeIdentityFixture =
    createFixture("youtube-identity");
  roots.push(youtubeIdentityFixture.root);
  const youtubeIdentityDry =
    await runMoneyShortsPart2DualPublishSafe({
      argv: youtubeIdentityFixture.baseArgs,
    });
  const youtubeIdentityCalls = [];
  const youtubeIdentityFailure =
    await runMoneyShortsPart2DualPublishSafe({
      argv: [
        ...youtubeIdentityFixture.baseArgs,
        "--expected-preflight-fingerprint",
        youtubeIdentityDry.preflightFingerprint,
        "--arm",
      ],
      envProvider: () => fakeEnv(),
      adapterFactory: async () =>
        successfulAdapters(youtubeIdentityCalls, {
          youtubeIdentity: {
            ok: true,
            channelId: "UCaaaaaaaaaaaaaaaaaaaaaa",
          },
        }),
    });
  check(
    "YouTube channel mismatch also has zero mutations",
    youtubeIdentityFailure.ok === false &&
      youtubeIdentityCalls.join(",") ===
        "verifyInstagramAccount,verifyYoutubeChannel" &&
      youtubeIdentityFailure.sideEffectCounters
        .blobPutCount === 0 &&
      youtubeIdentityFailure.sideEffectCounters
        .instagramContainerCreateCount === 0 &&
      youtubeIdentityFailure.sideEffectCounters
        .youtubeInsertCount === 0,
  );

  for (const [label, suffix] of [
    ["prepared", `${"e".repeat(64)}.prepared`],
    [
      "unknown committed-source",
      `${"e".repeat(64)}.committed-source`,
    ],
  ]) {
    const orphanFixture = createFixture(
      `orphan-${label.replaceAll(" ", "-")}`,
    );
    roots.push(orphanFixture.root);
    const orphanDry =
      await runMoneyShortsPart2DualPublishSafe({
        argv: orphanFixture.baseArgs,
      });
    const orphanPaths =
      moneyShortsPart2DualPublishSafePaths(
        orphanFixture.outDir,
      );
    writeFileSync(
      `${orphanPaths.preflightPath}.${suffix}`,
      "orphan",
      "utf8",
    );
    let orphanEnvReads = 0;
    let orphanAdapterLoads = 0;
    const orphanArmed =
      await runMoneyShortsPart2DualPublishSafe({
        argv: [
          ...orphanFixture.baseArgs,
          "--expected-preflight-fingerprint",
          orphanDry.preflightFingerprint,
          "--arm",
        ],
        envProvider: () => {
          orphanEnvReads += 1;
          return fakeEnv();
        },
        adapterFactory: async () => {
          orphanAdapterLoads += 1;
          return successfulAdapters([]);
        },
      });
    check(
      `${label} sidecar blocks before env and adapters`,
      orphanArmed.ok === false &&
        orphanArmed.reason ===
          "PART2_DUAL_SAFE_EVIDENCE_ORPHAN_OR_UNKNOWN_ENTRY" &&
        orphanEnvReads === 0 &&
        orphanAdapterLoads === 0,
      JSON.stringify(orphanArmed),
    );
  }

  const precreateOrphanFixture =
    createFixture("precreate-orphan");
  roots.push(precreateOrphanFixture.root);
  const precreateOrphanPaths =
    moneyShortsPart2DualPublishSafePaths(
      precreateOrphanFixture.outDir,
    );
  mkdirSync(precreateOrphanPaths.evidenceDir, {
    recursive: true,
  });
  writeFileSync(
    `${precreateOrphanPaths.preflightPath}.${"d".repeat(64)}.prepared`,
    "old-prepared",
    "utf8",
  );
  let precreateOrphanEnvReads = 0;
  const precreateOrphanDry =
    await runMoneyShortsPart2DualPublishSafe({
      argv: precreateOrphanFixture.baseArgs,
      envProvider: () => {
        precreateOrphanEnvReads += 1;
        return fakeEnv();
      },
    });
  check(
    "preflight creation rejects an older orphan before env access",
    precreateOrphanDry.ok === false &&
      precreateOrphanDry.reason ===
        "PART2_DUAL_SAFE_EVIDENCE_ORPHAN_OR_UNKNOWN_ENTRY" &&
      precreateOrphanEnvReads === 0,
  );

  const pairMismatchFixture =
    createFixture("pair-mismatch");
  roots.push(pairMismatchFixture.root);
  const pairMismatchDry =
    await runMoneyShortsPart2DualPublishSafe({
      argv: pairMismatchFixture.baseArgs,
    });
  const pairMismatchCommittedPath =
    `${pairMismatchDry.preflightPath}.${pairMismatchDry.preflightFingerprint}.committed-source`;
  rmSync(pairMismatchCommittedPath);
  writeFileSync(
    pairMismatchCommittedPath,
    "mismatched-committed-source",
    "utf8",
  );
  const pairMismatchRepeat =
    await runMoneyShortsPart2DualPublishSafe({
      argv: pairMismatchFixture.baseArgs,
      envProvider: () => {
        throw new Error("pair mismatch env access");
      },
    });
  check(
    "canonical and committed-source byte mismatch is fail-closed",
    pairMismatchRepeat.ok === false &&
      pairMismatchRepeat.reason ===
        "PART2_DUAL_SAFE_PREFLIGHT_COMMITTED_PAIR_MISMATCH",
  );

  const exactPreparedFixture =
    createFixture("exact-prepared");
  roots.push(exactPreparedFixture.root);
  const exactPreparedDry =
    await runMoneyShortsPart2DualPublishSafe({
      argv: exactPreparedFixture.baseArgs,
    });
  writeFileSync(
    `${exactPreparedDry.preflightPath}.${exactPreparedDry.preflightFingerprint}.prepared`,
    "rename-failure-orphan",
    "utf8",
  );
  const exactPreparedRepeat =
    await runMoneyShortsPart2DualPublishSafe({
      argv: exactPreparedFixture.baseArgs,
    });
  check(
    "exact-fingerprint prepared orphan is never accepted as committed",
    exactPreparedRepeat.ok === false &&
      exactPreparedRepeat.reason ===
        "PART2_DUAL_SAFE_EVIDENCE_ORPHAN_OR_UNKNOWN_ENTRY",
  );

  const lockFixture = createFixture("lock-hygiene");
  roots.push(lockFixture.root);
  const lockDry =
    await runMoneyShortsPart2DualPublishSafe({
      argv: lockFixture.baseArgs,
    });
  const lockPaths =
    moneyShortsPart2DualPublishSafePaths(
      lockFixture.outDir,
    );
  const missingLockInspection =
    inspectSafeEvidenceDirectory({
      paths: lockPaths,
      preflightFingerprint:
        lockDry.preflightFingerprint,
      allowLock: true,
      expectedLockIdentity: {
        dev: "0",
        ino: "0",
        size: "0",
        mtimeMs: "0",
        ctimeMs: "0",
      },
    });
  writeFileSync(lockPaths.lockPath, "owned", "utf8");
  const ownedLockStat = statSync(lockPaths.lockPath);
  const ownedLockIdentity = {
    dev: String(ownedLockStat.dev),
    ino: String(ownedLockStat.ino),
    size: String(ownedLockStat.size),
    mtimeMs: String(ownedLockStat.mtimeMs),
    ctimeMs: String(ownedLockStat.ctimeMs),
  };
  const ownedLockInspection =
    inspectSafeEvidenceDirectory({
      paths: lockPaths,
      preflightFingerprint:
        lockDry.preflightFingerprint,
      allowLock: true,
      expectedLockIdentity: ownedLockIdentity,
    });
  writeFileSync(
    lockPaths.lockPath,
    "replaced-or-mutated-lock",
    "utf8",
  );
  const changedLockInspection =
    inspectSafeEvidenceDirectory({
      paths: lockPaths,
      preflightFingerprint:
        lockDry.preflightFingerprint,
      allowLock: true,
      expectedLockIdentity: ownedLockIdentity,
    });
  check(
    "locked evidence requires the exact acquired lock identity",
    missingLockInspection.ok === false &&
      ownedLockInspection.ok === true &&
      changedLockInspection.ok === false &&
      changedLockInspection.reason ===
        "PART2_DUAL_SAFE_EXECUTION_LOCK_MISSING_OR_CHANGED",
  );

  const partialFixture = createFixture("partial");
  roots.push(partialFixture.root);
  const partialDry =
    await runMoneyShortsPart2DualPublishSafe({
      argv: partialFixture.baseArgs,
    });
  const partialCalls = [];
  const partial =
    await runMoneyShortsPart2DualPublishSafe({
      argv: [
        ...partialFixture.baseArgs,
        "--expected-preflight-fingerprint",
        partialDry.preflightFingerprint,
        "--arm",
      ],
      envProvider: () => fakeEnv(),
      adapterFactory: async () =>
        successfulAdapters(partialCalls, {
          youtubeInsertThrows: true,
        }),
    });
  check(
    "Instagram success and YouTube unknown is recorded as partial",
    partial.ok === false &&
      partial.partialExternalState ===
        "instagram_published_youtube_failed" &&
      partial.instagramMediaId ===
        "18000000000000001" &&
      partial.youtubeVideoId === null,
  );
  const partialLedger = readPublishLedgerReadOnly(
    partialFixture.ledgerPath,
  );
  check(
    "partial success writes no part-2 ledger records",
    partialLedger.ledger.records.every(
      (record) =>
        record.contentId !== partialFixture.contentId,
    ),
  );
  const partialAttempt =
    inspectMoneyShortsPublishAttemptEvidence({
      outDir: partialFixture.outDir,
      currentBinding: partialFixture.currentBinding,
    });
  const partialCanonicalBytes = readFileSync(
    join(
      partialFixture.outDir,
      "final-e2e-publish-result.json",
    ),
  );
  const partialRecovery =
    classifyMoneyShortsPublishRecovery({
      resultFile: {
        exists: true,
        parseOk: true,
        sha256: sha256(partialCanonicalBytes),
        evidence: JSON.parse(
          partialCanonicalBytes.toString("utf8"),
        ),
      },
      attemptFile: partialAttempt.claimFile,
      attemptEvidence: {
        present: partialAttempt.exists === true,
        journalValid: partialAttempt.valid === true,
        claimSha256:
          partialAttempt.claimFile.sha256,
        eventCount: partialAttempt.events.length,
        latestTransition:
          partialAttempt.latestEvent?.transition,
        latestEventSha256:
          partialAttempt.latestEvent?.eventSha256,
      },
      currentBinding: partialFixture.currentBinding,
      ledgerEvidence: {
        readOk: true,
        instagramAlreadyPublished: false,
        youtubeAlreadyPublished: false,
        instagramPublishedIdReference: null,
        youtubePublishedIdReference: null,
      },
    });
  check(
    "part-2 partial result is exposed as exact manual recovery state",
    partialRecovery.state === "ambiguous" &&
      partialRecovery.reason ===
        "youtube_publish_outcome_unknown" &&
      partialRecovery.instagramMediaId ===
        "18000000000000001" &&
      partialRecovery.recoverablePlatformCandidate === null &&
      partialRecovery.automaticRetryAllowed === false,
    `${partialRecovery.state}/${partialRecovery.reason}`,
  );
  const partialRetry =
    await runMoneyShortsPart2DualPublishSafe({
      argv: [
        ...partialFixture.baseArgs,
        "--expected-preflight-fingerprint",
        partialDry.preflightFingerprint,
        "--arm",
      ],
      envProvider: () => fakeEnv(),
      adapterFactory: async () =>
        successfulAdapters([]),
    });
  check(
    "partial publication cannot automatically rerun",
    partialRetry.ok === false,
  );

  const runnerSource = readFileSync(
    new URL(
      "./run-money-shorts-part2-only-dual-publish-safe-v1.mjs",
      import.meta.url,
    ),
    "utf8",
  );
  const genericSource = readFileSync(
    new URL(
      "./run-final-e2e-dual-platform-publish-once.mjs",
      import.meta.url,
    ),
    "utf8",
  );
  const wrapperSource = readFileSync(
    new URL(
      "./run-owner-command-with-local-env-no-log.mjs",
      import.meta.url,
    ),
    "utf8",
  );
  check(
    "YouTube verification and insert explicitly disable retry",
    (runnerSource.match(/retry:\s*false/g) ?? [])
      .length >= 2,
  );
  check(
    "Blob SDK retry is zero and multipart retry is disabled",
    runnerSource.includes(
      'process.env.VERCEL_BLOB_RETRIES = "0"',
    ) &&
      runnerSource.includes("multipart: false") &&
      runnerSource.includes("allowOverwrite: false"),
  );
  check(
    "both Instagram mutation POST requests fail closed on redirect",
    (
      runnerSource.match(
        /method:\s*"POST",[\s\S]{0,320}?redirect:\s*"error"/g,
      ) ?? []
    ).length >= 2,
  );
  check(
    "generic armed part-2 path is fail-closed",
    genericSource.includes(
      'armed && productionPartId === "part-2"',
    ) &&
      genericSource.includes(
        "PART2_SAFE_RUNNER_REQUIRED",
      ),
  );
  check(
    "no-log wrapper validates before env and skips env on dry-run",
    wrapperSource.includes(
      '"part2-only-dual-publish"',
    ) &&
      wrapperSource.includes(
        "validatePart2DualPublishBeforeEnvAccess",
      ) &&
      wrapperSource.includes("loadEnvInDryRun: false"),
  );
  check(
    "safe evidence paths are isolated under part-2 out-dir",
    moneyShortsPart2DualPublishSafePaths(
      successFixture.outDir,
    ).evidenceDir.startsWith(successFixture.outDir),
  );
} finally {
  for (const root of roots) {
    rmSync(root, { recursive: true, force: true });
  }
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exitCode = 1;
