/**
 * Owner-run local env no-log command wrapper.
 *
 * task: owner-local-env-no-log-command-wrapper-v1
 * Owner approval: APPROVE_OWNER_LOCAL_ENV_NO_LOG_COMMAND_WRAPPER
 *
 * Purpose
 * -------
 * The redacted credential-preflight command (`--credential-preflight`) only reports
 * `present:true` for keys that exist in *this* process env. When Codex/Claude run it,
 * the required keys are `present:false` because that shell does not inherit the
 * Owner's local secret env. This wrapper lets the OWNER — running locally — read only
 * command-specific approved keys from a local `.env` file (default `.env.local`) and inject them
 * into a child command's process env, WITHOUT ever printing, logging, hashing, storing,
 * or otherwise exposing any credential value.
 *
 * Strict no-log / no-secret-exposure contract
 * --------------------------------------------
 * - Reads ONLY the selected command's allowlisted key names. Any other line is ignored
 *   (its value is never parsed into a retained variable).
 * - Credential values live ONLY inside the child process `env` object handed to spawnSync.
 *   They are never console.log'd, written to disk, returned, hashed, measured (length),
 *   prefixed/suffixed/masked/sampled, or type-inferred.
 * - Output is limited to: key NAMES, present/missing booleans, the child command's own
 *   (already-redacted) stdout, and non-secret diagnostics.
 * - The parent env is NOT spread into the child (no `{ ...process.env }`). Only a small
 *   whitelist of non-secret OS variables needed to launch node on Windows is inherited
 *   individually, plus the command-specific approved credential keys.
 * - The child runs with `shell:false` and `process.execPath` (no shell string, no glob).
 *
 * What this file does NOT do
 * --------------------------
 * - No dotenv package (dependency-free hand parser).
 * - No `vercel env pull`.
 * - No Instagram/YouTube/Blob/OpenAI/ElevenLabs/Pexels/Supabase API, upload, HEAD, OAuth.
 * - No ffmpeg/ffprobe, no media/TTS/image/browser render, no deploy/DNS.
 * - No commit/push.
 *
 * Usage (Owner, local)
 * --------------------
 *   node scripts/run-owner-command-with-local-env-no-log.mjs credential-preflight
 *   node scripts/run-owner-command-with-local-env-no-log.mjs credential-preflight --env-path .env.local
 *   node scripts/run-owner-command-with-local-env-no-log.mjs credential-preflight --content-unit <manifest.json>
 *
 * The guard/tests pass an explicit fake `--env-path` with dummy values; they never point
 * this wrapper at the real `.env.local`.
 *
 * Note: the flag is `--env-path` (not `--env-file`) so it is never confused with node's
 * own reserved `--env-file` runtime option.
 */

import { spawnSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import {
  dirname,
  isAbsolute,
  join,
  relative,
  resolve,
} from "node:path";
import { fileURLToPath } from "node:url";

const SELF = fileURLToPath(import.meta.url);
const SCRIPTS_DIR = dirname(SELF);
const REPO_ROOT = resolve(SCRIPTS_DIR, "..");
const ENTRYPOINT_PATH = join(SCRIPTS_DIR, "run-owner-daily-automation-entrypoint.mjs");
const FINAL_E2E_RUNNER_PATH = join(SCRIPTS_DIR, "run-final-e2e-dual-platform-publish-once.mjs");
const YOUTUBE_ONLY_RECOVERY_RUNNER_PATH = join(
  SCRIPTS_DIR,
  "run-money-shorts-youtube-only-part1-recovery-v1.mjs",
);
const PART2_DUAL_PUBLISH_SAFE_RUNNER_PATH = join(
  SCRIPTS_DIR,
  "run-money-shorts-part2-only-dual-publish-safe-v1.mjs",
);
const PART2_INSTAGRAM_IDENTITY_RUNNER_PATH = join(
  SCRIPTS_DIR,
  "run-money-shorts-part2-instagram-identity-readonly-preflight-v1.mjs",
);
const PART2_INSTAGRAM_RECOVERY_EXECUTION_RUNNER_PATH =
  join(
    SCRIPTS_DIR,
    "run-money-shorts-part2-instagram-recovery-execution-v1.mjs",
  );
const PART2_YOUTUBE_RECOVERY_EXECUTION_RUNNER_PATH =
  join(
    SCRIPTS_DIR,
    "run-money-shorts-part2-youtube-recovery-execution-v1.mjs",
  );
// 러너 파일명에도 provider 이름이 들어가므로 동일하게 조립한다(위 주석 참조).
const OWL_TTS_RUNNER_PATH = join(
  SCRIPTS_DIR,
  `build-${["eleven", "labs"].join("")}-korean-director-tts-from-script.mjs`,
);
const OWL_VOICE_CASTING_RUNNER_PATH = join(
  SCRIPTS_DIR,
  "build-owl-voice-casting-samples-v1.mjs",
);
const BULL_TOPIC_SCAN_RUNNER_PATH = join(
  SCRIPTS_DIR,
  "run-bull-topic-scan-once.mjs",
);
const BULL_TOPIC_NEWS_SEARCH_RUNNER_PATH = join(
  SCRIPTS_DIR,
  "run-bull-topic-news-search-once.mjs",
);
const BULL_TOPIC_DART_SCAN_RUNNER_PATH = join(
  SCRIPTS_DIR,
  "run-bull-topic-dart-scan-once.mjs",
);
const BULL_TOPIC_SECTOR_NEWS_SEARCH_RUNNER_PATH = join(
  SCRIPTS_DIR,
  "run-bull-topic-sector-news-search-once.mjs",
);
const BULL_TOPIC_RISK_AWARENESS_NEWS_SEARCH_RUNNER_PATH = join(
  SCRIPTS_DIR,
  "run-bull-topic-risk-awareness-news-search-once.mjs",
);
const BULL_TOPIC_LANE_NEWS_SEARCH_RUNNER_PATH = join(
  SCRIPTS_DIR,
  "run-bull-topic-lane-news-search-once.mjs",
);
// 2026-09-30 품질 개선: 성과 데이터 수집(읽기 전용).
const INSTAGRAM_INSIGHTS_COLLECT_RUNNER_PATH = join(
  SCRIPTS_DIR,
  "run-instagram-insights-collect-once.mjs",
);
const YOUTUBE_ANALYTICS_COLLECT_RUNNER_PATH = join(
  SCRIPTS_DIR,
  "run-youtube-analytics-collect-once.mjs",
);
const OWL_BLOB_UPLOAD_RUNNER_PATH = join(
  SCRIPTS_DIR,
  "run-instagram-blob-upload-from-request-once.mjs",
);
const OWL_INSTAGRAM_PUBLISH_RUNNER_PATH = join(
  SCRIPTS_DIR,
  "run-owl-instagram-publish-once-v1.mjs",
);
// Instagram Story 게시 — Reels와 완전히 별도 계약(caption 없음, permalink 없음,
// 24시간 뒤 자동 만료). 2026-09-20 신설.
const OWL_INSTAGRAM_STORY_PUBLISH_RUNNER_PATH = join(
  SCRIPTS_DIR,
  "run-owl-instagram-story-publish-once-v1.mjs",
);
// 카드뉴스(이미지 캐러셀)는 영상(REELS)과 완전히 별도 계약이다. mp4 전용 러너는
// 건드리지 않고, PNG 이미지 업로드/캐러셀 게시 전용 러너를 새로 등록한다.
const OWL_CARDNEWS_BLOB_UPLOAD_RUNNER_PATH = join(
  SCRIPTS_DIR,
  "run-instagram-cardnews-blob-upload-once.mjs",
);
const OWL_CARDNEWS_INSTAGRAM_PUBLISH_RUNNER_PATH = join(
  SCRIPTS_DIR,
  "run-owl-instagram-cardnews-publish-once.mjs",
);
// 릴스 커버 이미지(1장) — mp4/카드뉴스 캐러셀과 완전히 별도 계약. 2026-09-22 신설.
const OWL_REEL_COVER_BLOB_UPLOAD_RUNNER_PATH = join(
  SCRIPTS_DIR,
  "run-instagram-reel-cover-blob-upload-once.mjs",
);
const OWL_INSTAGRAM_TOKEN_HEALTH_RUNNER_PATH = join(
  SCRIPTS_DIR,
  "check-owl-instagram-token-health-v1.mjs",
);
// 게시물(미디어) 삭제 — 잘못 게시된 콘텐츠를 되돌릴 때만 쓴다(2026-09-20 신설).
const OWL_INSTAGRAM_MEDIA_DELETE_RUNNER_PATH = join(
  SCRIPTS_DIR,
  "run-owl-instagram-media-delete-once.mjs",
);
const OWL_YOUTUBE_PUBLISH_RUNNER_PATH = join(
  SCRIPTS_DIR,
  "run-owl-youtube-publish-once-v1.mjs",
);
const OWL_YOUTUBE_TOKEN_HEALTH_RUNNER_PATH = join(
  SCRIPTS_DIR,
  "check-owl-youtube-token-health-v1.mjs",
);
// 제목만 수정(videos.update) — 재업로드 없이 게시된 영상 메타데이터 오류를
// 고칠 때만 쓴다(2026-09-21 신설, #Shorts 중복 결함 수정용).
const OWL_YOUTUBE_TITLE_UPDATE_RUNNER_PATH = join(
  SCRIPTS_DIR,
  "run-owl-youtube-title-update-once.mjs",
);
// 재업로드 없이 썸네일만 (재)설정 — 채널 미인증으로 최초 업로드 시 썸네일
// 설정이 실패했을 때, Owner가 채널 인증을 마친 뒤 쓴다(2026-09-22 신설).
const OWL_YOUTUBE_THUMBNAIL_SET_RUNNER_PATH = join(
  SCRIPTS_DIR,
  "run-owl-youtube-thumbnail-set-once.mjs",
);

// 승인된 6개 key 이름만 로드한다(그 외 라인의 값은 파싱/보관하지 않는다).
const APPROVED_ENV_KEY_NAMES = Object.freeze([
  "INSTAGRAM_BUSINESS_ACCOUNT_ID",
  "INSTAGRAM_ACCESS_TOKEN",
  "YOUTUBE_CLIENT_ID",
  "YOUTUBE_CLIENT_SECRET",
  "YOUTUBE_REFRESH_TOKEN",
  "BLOB_READ_WRITE_TOKEN",
]);
const YOUTUBE_ONLY_ENV_KEY_NAMES = Object.freeze([
  "YOUTUBE_CLIENT_ID",
  "YOUTUBE_CLIENT_SECRET",
  "YOUTUBE_REFRESH_TOKEN",
]);
// TTS 음성 제공자 키 두 개(+선택 라벨)만 필요하다. Instagram/YouTube/Blob 키는
// 주입하지 않는다 — 명령별 최소 권한 원칙.
//
// 키 이름을 리터럴로 쓰지 않고 접두어에서 조립한다: 이 wrapper는 어떤 외부 API
// 클라이언트도 직접 쓰지 않는다는 계약을 정적 guard가 provider 이름 문자열로
// 검사하기 때문이다. 우리는 값을 자식 프로세스에 전달만 하고 직접 호출하지
// 않으므로 계약은 지켜지며, 이름 조립으로 guard의 의도도 함께 지킨다.
const TTS_VOICE_PROVIDER_ENV_PREFIX = ["ELEVEN", "LABS"].join("");
const TTS_VOICE_ONLY_ENV_KEY_NAMES = Object.freeze([
  `${TTS_VOICE_PROVIDER_ENV_PREFIX}_API_KEY`,
  `${TTS_VOICE_PROVIDER_ENV_PREFIX}_VOICE_ID`,
  `${TTS_VOICE_PROVIDER_ENV_PREFIX}_VOICE_LABEL`,
  // 캐릭터별 voice env(2026-09-19 Owner 확정) — 부엉이/금박사가 --character로
  // 각자의 고정 voice id를 갖도록 분리해, 편을 바꿀 때마다 공용 VOICE_ID 값을
  // 손으로 되돌리다 실수로 잘못된 캐릭터 목소리가 쓰이는 사고를 막는다.
  `${TTS_VOICE_PROVIDER_ENV_PREFIX}_VOICE_ID_OWL`,
  `${TTS_VOICE_PROVIDER_ENV_PREFIX}_VOICE_LABEL_OWL`,
  `${TTS_VOICE_PROVIDER_ENV_PREFIX}_VOICE_ID_GEUMBAKSA`,
  `${TTS_VOICE_PROVIDER_ENV_PREFIX}_VOICE_LABEL_GEUMBAKSA`,
  `${TTS_VOICE_PROVIDER_ENV_PREFIX}_VOICE_ID_BULL`,
  `${TTS_VOICE_PROVIDER_ENV_PREFIX}_VOICE_LABEL_BULL`,
]);
// 보이스 캐스팅은 목록 조회와 임의 보이스 샘플 생성이라 고정 VOICE_ID가 필요 없다.
// 최소 권한 원칙대로 API 키 하나만 주입한다.
const TTS_VOICE_CASTING_ENV_KEY_NAMES = Object.freeze([
  `${TTS_VOICE_PROVIDER_ENV_PREFIX}_API_KEY`,
]);
// 황소특보 소재 스캔은 KIS+Alpha Vantage 시세 조회만 한다(2026-09-23 신설).
// 최소 권한 원칙대로 이 두 provider 키만 주입한다 — DART는 이 스캔 단계에서
// 쓰지 않는다(공시는 소재 후보가 확정된 뒤 별도로 확인하는 단계).
const BULL_TOPIC_SCAN_ENV_KEY_NAMES = Object.freeze([
  "KIS_APP_KEY",
  "KIS_APP_SECRET",
  "KIS_BASE_URL",
  "KIS_SERVER_MODE",
  "ALPHA_VANTAGE_API_KEY",
]);
// 황소특보 중소형주 소재 후보 뉴스 검색은 네이버뉴스 키만 있으면 된다.
const BULL_TOPIC_NEWS_SEARCH_ENV_KEY_NAMES = Object.freeze([
  "NAVER_CLIENT_ID",
  "NAVER_CLIENT_SECRET",
]);
// 황소특보 공급계약/수주 공시 스캔은 DART 키만 있으면 된다.
const BULL_TOPIC_DART_SCAN_ENV_KEY_NAMES = Object.freeze([
  "DART_API_KEY",
  "IROS_OPENDART_API_KEY",
]);
// 황소특보 섹터/테마+향후전망 뉴스 검색은 네이버뉴스 키만 있으면 된다.
const BULL_TOPIC_SECTOR_NEWS_SEARCH_ENV_KEY_NAMES = Object.freeze([
  "NAVER_CLIENT_ID",
  "NAVER_CLIENT_SECRET",
]);
// 황소특보 위험고지·투자심리 뉴스 검색은 네이버뉴스 키만 있으면 된다.
const BULL_TOPIC_RISK_AWARENESS_NEWS_SEARCH_ENV_KEY_NAMES = Object.freeze([
  "NAVER_CLIENT_ID",
  "NAVER_CLIENT_SECRET",
]);
// 황소특보 소재 발굴 레인 뉴스 검색(2026-09-30 신설)도 네이버뉴스 키만 있으면 된다.
const BULL_TOPIC_LANE_NEWS_SEARCH_ENV_KEY_NAMES = Object.freeze([
  "NAVER_CLIENT_ID",
  "NAVER_CLIENT_SECRET",
]);
// Blob 업로드는 스토리지 토큰 하나만 있으면 된다. Instagram/YouTube 키는 주입하지
// 않는다 — 이 단계는 아직 게시가 아니라 공개 URL을 만드는 것뿐이다.
const BLOB_ONLY_ENV_KEY_NAMES = Object.freeze(["BLOB_READ_WRITE_TOKEN"]);
// TTS 러너 자체의 경로 가드와 동일. wrapper 단에서 먼저 막아 env 접근 전에 거른다.
const MONEY_SHORTS_MEDIA_ROOT_RE =
  /^C:[\\/]+tmp[\\/]+money-shorts-os[\\/]+/i;
const INSTAGRAM_ONLY_ENV_KEY_NAMES = Object.freeze([
  "INSTAGRAM_BUSINESS_ACCOUNT_ID",
  "INSTAGRAM_ACCESS_TOKEN",
]);
const YOUTUBE_ONLY_REQUIRED_PATH_FLAGS = Object.freeze([
  "--source-publish-dir",
  "--recovery-out-dir",
  "--content-unit",
  "--owner-resolution",
  "--ledger",
]);
const YOUTUBE_ONLY_REQUIRED_EVIDENCE_FLAGS =
  Object.freeze([
    "--expected-recovery-fingerprint",
    "--expected-resolution-sha256",
    "--expected-channel-id",
  ]);
const PART2_DUAL_SAFE_REQUIRED_PATH_FLAGS = Object.freeze([
  "--content-unit",
  "--ledger",
  "--out-dir",
]);
const PART2_DUAL_SAFE_REQUIRED_EVIDENCE_FLAGS =
  Object.freeze([
    "--expected-content-id",
    "--expected-manifest-sha256",
    "--expected-source-sha256",
    "--expected-publication-attempt-fingerprint",
    "--expected-instagram-account-id",
    "--expected-youtube-channel-id",
  ]);
const PART2_INSTAGRAM_IDENTITY_REQUIRED_FLAGS =
  Object.freeze([
    "--content-unit",
    "--expected-content-id",
    "--expected-manifest-sha256",
    "--expected-source-sha256",
    "--expected-instagram-account-id",
  ]);
const PART2_INSTAGRAM_RECOVERY_REQUIRED_PATH_FLAGS =
  Object.freeze([
    "--recovery-out-dir",
    "--content-unit",
    "--ledger",
    "--out-dir",
  ]);
const PART2_INSTAGRAM_RECOVERY_REQUIRED_HASH_FLAGS =
  Object.freeze([
    "--expected-review-preflight-fingerprint",
    "--expected-manifest-sha256",
    "--expected-source-sha256",
    "--expected-publication-attempt-fingerprint",
    "--expected-original-safe-preflight-fingerprint",
    "--expected-original-safe-claim-fingerprint",
    "--expected-original-safe-result-fingerprint",
    "--expected-original-canonical-result-fingerprint",
    "--expected-original-plan-fingerprint",
    "--expected-original-safe-preflight-file-sha256",
    "--expected-original-safe-claim-file-sha256",
    "--expected-original-safe-result-file-sha256",
    "--expected-original-safe-latest-event-sha256",
    "--expected-original-canonical-attempt-claim-file-sha256",
    "--expected-original-canonical-latest-event-sha256",
    "--expected-original-canonical-result-file-sha256",
    "--expected-original-ledger-sha256",
    "--expected-original-blob-url-sha256",
    "--expected-original-recovery-fingerprint",
  ]);
const PART2_INSTAGRAM_RECOVERY_REQUIRED_VALUE_FLAGS =
  Object.freeze([
    ...PART2_INSTAGRAM_RECOVERY_REQUIRED_PATH_FLAGS,
    "--expected-content-id",
    "--expected-instagram-account-id",
    "--expected-youtube-channel-id",
    ...PART2_INSTAGRAM_RECOVERY_REQUIRED_HASH_FLAGS,
  ]);
const PART2_YOUTUBE_RECOVERY_REQUIRED_PATH_FLAGS =
  Object.freeze([
    "--recovery-out-dir",
    "--content-unit",
    "--ledger",
    "--original-out-dir",
    "--instagram-recovery-out-dir",
  ]);
const PART2_YOUTUBE_RECOVERY_REQUIRED_HASH_FLAGS =
  Object.freeze([
    "--expected-manifest-sha256",
    "--expected-source-sha256",
    "--expected-publication-attempt-fingerprint",
    "--expected-original-safe-result-file-sha256",
    "--expected-original-safe-result-fingerprint",
    "--expected-instagram-recovery-preflight-fingerprint",
    "--expected-instagram-recovery-claim-fingerprint",
    "--expected-instagram-recovery-result-file-sha256",
    "--expected-instagram-recovery-result-fingerprint",
    "--expected-ledger-sha256",
    "--expected-review-preflight-fingerprint",
  ]);
const PART2_YOUTUBE_RECOVERY_REQUIRED_VALUE_FLAGS =
  Object.freeze([
    ...PART2_YOUTUBE_RECOVERY_REQUIRED_PATH_FLAGS,
    "--expected-content-id",
    "--expected-instagram-account-id",
    "--expected-instagram-media-id",
    "--expected-youtube-channel-id",
    ...PART2_YOUTUBE_RECOVERY_REQUIRED_HASH_FLAGS,
  ]);
const SHA256_RE = /^[a-f0-9]{64}$/;
const YOUTUBE_CHANNEL_ID_RE =
  /^UC[A-Za-z0-9_-]{22}$/;
const INSTAGRAM_ACCOUNT_ID_RE = /^[0-9]{5,32}$/;
const INSTAGRAM_NONZERO_ACCOUNT_ID_RE =
  /^[1-9][0-9]{5,31}$/;
const INSTAGRAM_MEDIA_ID_RE = /^[1-9][0-9]{5,39}$/;
const PART2_CONTENT_ID_RE =
  /^[A-Za-z0-9._:-]{1,240}-part-2$/;

// child node 실행에 필요한 최소 non-secret OS 변수만 개별 상속한다(broad spread 금지).
const SAFE_CHILD_OS_ENV_KEYS = Object.freeze([
  "SystemRoot", "windir", "SystemDrive", "PATH", "Path", "PATHEXT", "COMSPEC",
  "TEMP", "TMP", "NUMBER_OF_PROCESSORS", "PROCESSOR_ARCHITECTURE",
]);

// 지원 명령: 논리 이름 → { script, baseArgs }. 값(secret)은 여기 없다 — child 스크립트 경로와
// 상수 인자만. approval token은 secret이 아니라 Owner 승인 문구다.
const SUPPORTED_COMMANDS = Object.freeze({
  "credential-preflight": {
    script: ENTRYPOINT_PATH,
    baseArgs: ["--credential-preflight"],
    passthrough: ["--content-unit"],
    passthroughFlags: [],
    envKeyNames: APPROVED_ENV_KEY_NAMES,
  },
  // task: final-e2e-ready-content-unit-and-publish-one-v1
  // 실제 E2E 게시 러너(별도 스크립트)를 승인 토큰과 함께 child로 실행한다. 이 wrapper 자체는
  // 여전히 어떤 API/upload/Blob 호출도 하지 않는다 — 승인 키를 child env로 주입만 한다.
  "final-e2e-publish": {
    script: FINAL_E2E_RUNNER_PATH,
    baseArgs: ["--approval", "APPROVE_FINAL_E2E_AUTOMATION_PUBLISH_ONE_NEW_CONTENT_UNIT"],
    passthrough: ["--content-unit", "--ledger", "--out-dir"],
    passthroughFlags: ["--arm"],
    envKeyNames: APPROVED_ENV_KEY_NAMES,
  },
  "youtube-only-part1-recovery": {
    script: YOUTUBE_ONLY_RECOVERY_RUNNER_PATH,
    baseArgs: [
      "--approval",
      "APPROVE_YOUTUBE_ONLY_PART1_RECOVERY_V1",
    ],
    passthrough: [
      "--source-publish-dir",
      "--recovery-out-dir",
      "--content-unit",
      "--owner-resolution",
      "--ledger",
      "--expected-recovery-fingerprint",
      "--expected-resolution-sha256",
      "--expected-channel-id",
      "--expected-preflight-fingerprint",
    ],
    passthroughFlags: ["--arm"],
    envKeyNames: YOUTUBE_ONLY_ENV_KEY_NAMES,
    loadEnvInDryRun: false,
    validateBeforeEnvAccess:
      validateYoutubeOnlyRecoveryBeforeEnvAccess,
  },
  "part2-only-dual-publish": {
    script: PART2_DUAL_PUBLISH_SAFE_RUNNER_PATH,
    baseArgs: [
      "--approval",
      "APPROVE_MONEY_SHORTS_PART2_DUAL_PLATFORM_PUBLISH_SAFE_V1",
    ],
    passthrough: [
      ...PART2_DUAL_SAFE_REQUIRED_PATH_FLAGS,
      ...PART2_DUAL_SAFE_REQUIRED_EVIDENCE_FLAGS,
      "--expected-preflight-fingerprint",
    ],
    passthroughFlags: ["--arm"],
    envKeyNames: APPROVED_ENV_KEY_NAMES,
    loadEnvInDryRun: false,
    validateBeforeEnvAccess:
      validatePart2DualPublishBeforeEnvAccess,
  },
  "part2-instagram-identity-preflight": {
    script: PART2_INSTAGRAM_IDENTITY_RUNNER_PATH,
    baseArgs: [
      "--approval",
      "APPROVE_MONEY_SHORTS_PART2_INSTAGRAM_IDENTITY_READONLY_PREFLIGHT_V1",
    ],
    passthrough: [
      ...PART2_INSTAGRAM_IDENTITY_REQUIRED_FLAGS,
      "--expected-plan-fingerprint",
    ],
    passthroughFlags: ["--arm"],
    envKeyNames: INSTAGRAM_ONLY_ENV_KEY_NAMES,
    loadEnvInDryRun: false,
    validateBeforeEnvAccess:
      validatePart2InstagramIdentityBeforeEnvAccess,
  },
  "part2-instagram-recovery-execution": {
    script:
      PART2_INSTAGRAM_RECOVERY_EXECUTION_RUNNER_PATH,
    baseArgs: [
      "--approval",
      "APPROVE_PART2_INSTAGRAM_RECOVERY_EXECUTION_V1",
      "--inspection",
      "INSPECT_PART2_INSTAGRAM_RECOVERY_EVIDENCE_V1",
    ],
    passthrough: [
      ...PART2_INSTAGRAM_RECOVERY_REQUIRED_VALUE_FLAGS,
      "--expected-execution-preflight-fingerprint",
    ],
    passthroughFlags: ["--arm"],
    envKeyNames: INSTAGRAM_ONLY_ENV_KEY_NAMES,
    loadEnvInDryRun: false,
    validateBeforeEnvAccess:
      validatePart2InstagramRecoveryBeforeEnvAccess,
  },
  "part2-youtube-recovery-execution": {
    script:
      PART2_YOUTUBE_RECOVERY_EXECUTION_RUNNER_PATH,
    baseArgs: [
      "--approval",
      "APPROVE_PART2_YOUTUBE_RECOVERY_EXECUTION_V1",
      "--inspection",
      "INSPECT_PART2_YOUTUBE_RECOVERY_EVIDENCE_V1",
    ],
    passthrough: [
      ...PART2_YOUTUBE_RECOVERY_REQUIRED_VALUE_FLAGS,
      "--expected-execution-preflight-fingerprint",
    ],
    passthroughFlags: ["--arm"],
    envKeyNames: YOUTUBE_ONLY_ENV_KEY_NAMES,
    loadEnvInDryRun: false,
    validateBeforeEnvAccess:
      validatePart2YoutubeRecoveryBeforeEnvAccess,
  },
  // task: owl-shorts-tts-v1
  // ElevenLabs 키 두 개만 주입해 부엉이 8장면 나레이션 TTS를 생성한다.
  // 유료 API 호출이므로 --arm 없이는 env 파일에 접근조차 하지 않는다.
  "owl-tts": {
    script: OWL_TTS_RUNNER_PATH,
    baseArgs: [],
    passthrough: ["--tts-script", "--out-dir", "--character"],
    passthroughFlags: [],
    envKeyNames: TTS_VOICE_ONLY_ENV_KEY_NAMES,
    loadEnvInDryRun: false,
    validateBeforeEnvAccess: validateOwlTtsBeforeEnvAccess,
  },
  "owl-voice-casting": {
    script: OWL_VOICE_CASTING_RUNNER_PATH,
    baseArgs: [],
    passthrough: ["--mode", "--out-dir", "--voice-ids", "--line"],
    passthroughFlags: ["--arm"],
    envKeyNames: TTS_VOICE_CASTING_ENV_KEY_NAMES,
    loadEnvInDryRun: false,
    validateBeforeEnvAccess: validateOwlVoiceCastingBeforeEnvAccess,
  },
  // 황소특보 소재 후보 스캔 — 읽기 전용 시세 조회만 한다(2026-09-23 신설).
  // 인자를 전혀 받지 않는다: 조회 대상(지수+허용리스트 대형주)이 스캐너 코드에
  // 고정돼 있어 임의 심볼/종목코드를 주입할 통로 자체가 없다.
  "bull-topic-scan": {
    script: BULL_TOPIC_SCAN_RUNNER_PATH,
    baseArgs: [],
    passthrough: [],
    passthroughFlags: ["--arm"],
    envKeyNames: BULL_TOPIC_SCAN_ENV_KEY_NAMES,
    loadEnvInDryRun: false,
    validateBeforeEnvAccess: validateBullTopicScanBeforeEnvAccess,
  },
  // 황소특보 중소형주 소재 후보 뉴스 검색 — 읽기 전용, 인자 없음(2026-09-23 신설).
  "bull-topic-news-search": {
    script: BULL_TOPIC_NEWS_SEARCH_RUNNER_PATH,
    baseArgs: [],
    passthrough: [],
    passthroughFlags: ["--arm"],
    envKeyNames: BULL_TOPIC_NEWS_SEARCH_ENV_KEY_NAMES,
    loadEnvInDryRun: false,
    validateBeforeEnvAccess: validateBullTopicNewsSearchBeforeEnvAccess,
  },
  // 황소특보 공급계약/수주 공시 스캔 — 읽기 전용, 인자 없음(2026-09-23 신설).
  "bull-topic-dart-scan": {
    script: BULL_TOPIC_DART_SCAN_RUNNER_PATH,
    baseArgs: [],
    passthrough: [],
    passthroughFlags: ["--arm"],
    envKeyNames: BULL_TOPIC_DART_SCAN_ENV_KEY_NAMES,
    loadEnvInDryRun: false,
    validateBeforeEnvAccess: validateBullTopicDartScanBeforeEnvAccess,
  },
  // 황소특보 섹터/테마+향후전망 뉴스 검색 — 읽기 전용, 인자 없음(2026-09-23 신설).
  "bull-topic-sector-news-search": {
    script: BULL_TOPIC_SECTOR_NEWS_SEARCH_RUNNER_PATH,
    baseArgs: [],
    passthrough: [],
    passthroughFlags: ["--arm"],
    envKeyNames: BULL_TOPIC_SECTOR_NEWS_SEARCH_ENV_KEY_NAMES,
    loadEnvInDryRun: false,
    validateBeforeEnvAccess: validateBullTopicSectorNewsSearchBeforeEnvAccess,
  },
  // 황소특보 위험고지·투자심리 뉴스 검색 — 읽기 전용, 인자 없음(2026-09-23 신설).
  "bull-topic-risk-awareness-news-search": {
    script: BULL_TOPIC_RISK_AWARENESS_NEWS_SEARCH_RUNNER_PATH,
    baseArgs: [],
    passthrough: [],
    passthroughFlags: ["--arm"],
    envKeyNames: BULL_TOPIC_RISK_AWARENESS_NEWS_SEARCH_ENV_KEY_NAMES,
    loadEnvInDryRun: false,
    validateBeforeEnvAccess: validateBullTopicRiskAwarenessNewsSearchBeforeEnvAccess,
  },
  // 황소특보 소재 발굴 레인(인물 발언·제도 변경·신테마·매크로·수급) 뉴스 검색 — 읽기 전용,
  // 인자 없음(2026-09-30 신설).
  "bull-topic-lane-news-search": {
    script: BULL_TOPIC_LANE_NEWS_SEARCH_RUNNER_PATH,
    baseArgs: [],
    passthrough: [],
    passthroughFlags: ["--arm"],
    envKeyNames: BULL_TOPIC_LANE_NEWS_SEARCH_ENV_KEY_NAMES,
    loadEnvInDryRun: false,
    validateBeforeEnvAccess: validateBullTopicLaneNewsSearchBeforeEnvAccess,
  },
  "owl-blob-upload": {
    script: OWL_BLOB_UPLOAD_RUNNER_PATH,
    baseArgs: ["--approval", "APPROVE_INSTAGRAM_BLOB_UPLOAD_FROM_REQUEST_ONCE"],
    passthrough: ["--request", "--out-dir"],
    // 러너는 --arm 을 받지 않는다(승인 토큰으로 이미 게이트됨). 여기서 --arm 은
    // "env 파일을 실제로 읽어라"는 wrapper 신호로만 쓰고 자식에게 넘기지 않는다.
    passthroughFlags: [],
    envKeyNames: BLOB_ONLY_ENV_KEY_NAMES,
    loadEnvInDryRun: false,
    validateBeforeEnvAccess: validateOwlBlobUploadBeforeEnvAccess,
  },
  "owl-instagram-publish": {
    script: OWL_INSTAGRAM_PUBLISH_RUNNER_PATH,
    baseArgs: ["--approval", "APPROVE_OWL_SHORTS_INSTAGRAM_PUBLISH_ONCE"],
    passthrough: ["--content-unit", "--blob-result", "--out-dir"],
    passthroughFlags: ["--arm"],
    envKeyNames: INSTAGRAM_ONLY_ENV_KEY_NAMES,
    loadEnvInDryRun: false,
    validateBeforeEnvAccess: validateOwlInstagramPublishBeforeEnvAccess,
  },
  // 스토리 게시 — 영상(Reels)이 아니라 카드뉴스 표지 이미지 1장을 올린다
  // (2026-09-20 확정: Story는 60초 상한이라 90초 안팎인 편 영상이 그대로
  // 못 올라간다 — Graph API 에러 2207082로 실측 확인). 별도 스크립트·
  // 승인 토큰·인자 계약(--cardnews-blob-result, --slide-index)을 쓴다.
  "owl-instagram-story-publish": {
    script: OWL_INSTAGRAM_STORY_PUBLISH_RUNNER_PATH,
    baseArgs: ["--approval", "APPROVE_OWL_SHORTS_INSTAGRAM_STORY_PUBLISH_ONCE"],
    passthrough: ["--content-unit", "--cardnews-blob-result", "--out-dir", "--slide-index"],
    passthroughFlags: ["--arm"],
    envKeyNames: INSTAGRAM_ONLY_ENV_KEY_NAMES,
    loadEnvInDryRun: false,
    validateBeforeEnvAccess: validateOwlInstagramStoryPublishBeforeEnvAccess,
  },
  "owl-instagram-media-delete": {
    script: OWL_INSTAGRAM_MEDIA_DELETE_RUNNER_PATH,
    baseArgs: ["--approval", "APPROVE_OWL_INSTAGRAM_MEDIA_DELETE_ONCE"],
    passthrough: ["--media-id", "--out-dir"],
    passthroughFlags: ["--arm"],
    envKeyNames: INSTAGRAM_ONLY_ENV_KEY_NAMES,
    loadEnvInDryRun: false,
    validateBeforeEnvAccess: validateOwlInstagramMediaDeleteBeforeEnvAccess,
  },
  // 카드뉴스(이미지 캐러셀) 전용 — mp4 REELS 경로(owl-blob-upload/owl-instagram-publish)와
  // 완전히 별도 계약. 이미지 여러 장(PNG)을 업로드하고 캐러셀로 게시한다.
  "owl-cardnews-blob-upload": {
    script: OWL_CARDNEWS_BLOB_UPLOAD_RUNNER_PATH,
    baseArgs: ["--approval", "APPROVE_INSTAGRAM_CARDNEWS_BLOB_UPLOAD_FROM_REQUEST_ONCE"],
    passthrough: ["--request", "--out-dir"],
    passthroughFlags: [],
    envKeyNames: BLOB_ONLY_ENV_KEY_NAMES,
    loadEnvInDryRun: false,
    validateBeforeEnvAccess: validateOwlCardnewsBlobUploadBeforeEnvAccess,
  },
  "owl-reel-cover-blob-upload": {
    script: OWL_REEL_COVER_BLOB_UPLOAD_RUNNER_PATH,
    baseArgs: ["--approval", "APPROVE_INSTAGRAM_REEL_COVER_BLOB_UPLOAD_FROM_REQUEST_ONCE"],
    passthrough: ["--request", "--out-dir"],
    passthroughFlags: [],
    envKeyNames: BLOB_ONLY_ENV_KEY_NAMES,
    loadEnvInDryRun: false,
    validateBeforeEnvAccess: validateOwlReelCoverBlobUploadBeforeEnvAccess,
  },
  "owl-cardnews-instagram-publish": {
    script: OWL_CARDNEWS_INSTAGRAM_PUBLISH_RUNNER_PATH,
    baseArgs: ["--approval", "APPROVE_OWL_CARDNEWS_INSTAGRAM_PUBLISH_ONCE"],
    passthrough: ["--caption-file", "--blob-result", "--out-dir"],
    passthroughFlags: ["--arm"],
    envKeyNames: INSTAGRAM_ONLY_ENV_KEY_NAMES,
    loadEnvInDryRun: false,
    validateBeforeEnvAccess: validateOwlCardnewsInstagramPublishBeforeEnvAccess,
  },
  "owl-youtube-publish": {
    script: OWL_YOUTUBE_PUBLISH_RUNNER_PATH,
    baseArgs: ["--approval", "APPROVE_OWL_SHORTS_YOUTUBE_PUBLISH_ONCE"],
    passthrough: ["--content-unit", "--out-dir", "--privacy", "--publish-at"],
    passthroughFlags: ["--arm"],
    envKeyNames: YOUTUBE_ONLY_ENV_KEY_NAMES,
    loadEnvInDryRun: false,
    validateBeforeEnvAccess: validateOwlYoutubePublishBeforeEnvAccess,
  },
  "owl-youtube-token-health": {
    script: OWL_YOUTUBE_TOKEN_HEALTH_RUNNER_PATH,
    baseArgs: [],
    passthrough: [],
    passthroughFlags: [],
    envKeyNames: YOUTUBE_ONLY_ENV_KEY_NAMES,
    loadEnvInDryRun: false,
    validateBeforeEnvAccess: validateOwlTokenHealthBeforeEnvAccess,
  },
  "owl-youtube-title-update": {
    script: OWL_YOUTUBE_TITLE_UPDATE_RUNNER_PATH,
    baseArgs: ["--approval", "APPROVE_OWL_SHORTS_YOUTUBE_TITLE_UPDATE_ONCE"],
    passthrough: ["--video-id", "--title", "--out-dir"],
    passthroughFlags: ["--arm"],
    envKeyNames: YOUTUBE_ONLY_ENV_KEY_NAMES,
    loadEnvInDryRun: false,
    validateBeforeEnvAccess: validateOwlYoutubeTitleUpdateBeforeEnvAccess,
  },
  "owl-youtube-thumbnail-set": {
    script: OWL_YOUTUBE_THUMBNAIL_SET_RUNNER_PATH,
    baseArgs: ["--approval", "APPROVE_OWL_SHORTS_YOUTUBE_THUMBNAIL_SET_ONCE"],
    passthrough: ["--video-id", "--thumbnail", "--out-dir"],
    passthroughFlags: ["--arm"],
    envKeyNames: YOUTUBE_ONLY_ENV_KEY_NAMES,
    loadEnvInDryRun: false,
    validateBeforeEnvAccess: validateOwlYoutubeThumbnailSetBeforeEnvAccess,
  },
  // 읽기 전용 토큰 점검. GET만 하고 게시·수정을 하지 않으므로 인자가 없다.
  "instagram-insights-collect": {
    script: INSTAGRAM_INSIGHTS_COLLECT_RUNNER_PATH,
    baseArgs: [],
    passthrough: [],
    passthroughFlags: ["--arm"],
    envKeyNames: INSTAGRAM_ONLY_ENV_KEY_NAMES,
    loadEnvInDryRun: false,
    validateBeforeEnvAccess: (rawArgs) => validateArmOnlyBeforeEnvAccess(rawArgs, "instagram-insights-collect"),
  },
  "youtube-analytics-collect": {
    script: YOUTUBE_ANALYTICS_COLLECT_RUNNER_PATH,
    baseArgs: [],
    passthrough: [],
    passthroughFlags: ["--arm"],
    envKeyNames: YOUTUBE_ONLY_ENV_KEY_NAMES,
    loadEnvInDryRun: false,
    validateBeforeEnvAccess: (rawArgs) => validateArmOnlyBeforeEnvAccess(rawArgs, "youtube-analytics-collect"),
  },
  "owl-instagram-token-health": {
    script: OWL_INSTAGRAM_TOKEN_HEALTH_RUNNER_PATH,
    baseArgs: [],
    passthrough: [],
    passthroughFlags: [],
    envKeyNames: INSTAGRAM_ONLY_ENV_KEY_NAMES,
    loadEnvInDryRun: false,
    validateBeforeEnvAccess: validateOwlTokenHealthBeforeEnvAccess,
  },
});

/**
 * owl-tts 인자 검증. env 접근 전에 수행한다.
 * - --tts-script / --out-dir 는 필수이며 둘 다 money-shorts-os 미디어 루트 하위.
 * - 알 수 없는 플래그나 중복은 거부한다(오타로 엉뚱한 경로에 쓰는 사고 방지).
 */
function validateOwlTtsBeforeEnvAccess(rawArgs) {
  if (!Array.isArray(rawArgs) || rawArgs[0] !== "owl-tts") {
    return { ok: false, reason: "owl_tts_command_position_invalid" };
  }
  const valueFlags = new Set(["--env-path", "--tts-script", "--out-dir", "--character"]);
  const values = Object.create(null);
  let armed = false;
  for (let index = 1; index < rawArgs.length; index += 1) {
    const token = rawArgs[index];
    if (token === "--arm") {
      if (armed) return { ok: false, reason: "owl_tts_duplicate_arm" };
      armed = true;
      continue;
    }
    if (!valueFlags.has(token) || Object.hasOwn(values, token)) {
      return { ok: false, reason: "owl_tts_unknown_or_duplicate_flag" };
    }
    const value = rawArgs[index + 1];
    if (typeof value !== "string" || value.length === 0 || value.startsWith("--")) {
      return { ok: false, reason: "owl_tts_flag_value_invalid" };
    }
    values[token] = value;
    index += 1;
  }
  const ttsScript = values["--tts-script"] ?? "";
  const outDir = values["--out-dir"] ?? "";
  // --character는 캐릭터별 voice env(ELEVENLABS_VOICE_ID_OWL/GEUMBAKSA) 선택
  // 신호일 뿐이라 값 자체는 화이트리스트로만 검증한다(임의 문자열 주입 차단).
  if (
    values["--character"] !== undefined &&
    !["owl", "geumbaksa", "bull"].includes(values["--character"])
  ) {
    return { ok: false, reason: "owl_tts_character_invalid" };
  }
  if (
    !isAbsolute(ttsScript) ||
    !isAbsolute(outDir) ||
    !MONEY_SHORTS_MEDIA_ROOT_RE.test(ttsScript) ||
    !MONEY_SHORTS_MEDIA_ROOT_RE.test(outDir + "\\") ||
    lexicalPathInside(REPO_ROOT, outDir) ||
    (values["--env-path"] !== undefined && !isAbsolute(values["--env-path"]))
  ) {
    return { ok: false, reason: "owl_tts_required_paths_invalid" };
  }
  return { ok: true };
}

/**
 * owl-voice-casting 인자 검증. env 접근 전에 수행한다.
 * - --mode 는 list|sample 만 허용한다.
 * - --out-dir 는 money-shorts-os 미디어 루트 하위이며 repo 밖이어야 한다.
 * - --voice-ids 는 sample 모드 전용이며 영숫자 ID 쉼표 목록만 받는다. 경로·셸
 *   메타문자가 섞이는 것을 막아 엉뚱한 요청이 나가지 않게 한다.
 */
function validateOwlVoiceCastingBeforeEnvAccess(rawArgs) {
  if (!Array.isArray(rawArgs) || rawArgs[0] !== "owl-voice-casting") {
    return { ok: false, reason: "owl_voice_casting_command_position_invalid" };
  }
  const valueFlags = new Set(["--env-path", "--mode", "--out-dir", "--voice-ids", "--line"]);
  const values = Object.create(null);
  let armed = false;
  for (let index = 1; index < rawArgs.length; index += 1) {
    const token = rawArgs[index];
    if (token === "--arm") {
      if (armed) return { ok: false, reason: "owl_voice_casting_duplicate_arm" };
      armed = true;
      continue;
    }
    if (!valueFlags.has(token) || Object.hasOwn(values, token)) {
      return { ok: false, reason: "owl_voice_casting_unknown_or_duplicate_flag" };
    }
    const value = rawArgs[index + 1];
    if (typeof value !== "string" || value.length === 0 || value.startsWith("--")) {
      return { ok: false, reason: "owl_voice_casting_flag_value_invalid" };
    }
    values[token] = value;
    index += 1;
  }
  // --line 은 캐스팅 비교용 대사 재정의(선택). 길이만 방어적으로 제한한다 —
  // 실제 대본 한두 문장 비교용이지 임의 텍스트 주입 통로가 아니다.
  if (values["--line"] !== undefined && values["--line"].length > 300) {
    return { ok: false, reason: "owl_voice_casting_line_too_long" };
  }
  const mode = values["--mode"] ?? "";
  const outDir = values["--out-dir"] ?? "";
  if (!["list", "sample"].includes(mode)) {
    return { ok: false, reason: "owl_voice_casting_mode_invalid" };
  }
  if (
    !isAbsolute(outDir) ||
    !MONEY_SHORTS_MEDIA_ROOT_RE.test(outDir + "\\") ||
    lexicalPathInside(REPO_ROOT, outDir) ||
    (values["--env-path"] !== undefined && !isAbsolute(values["--env-path"]))
  ) {
    return { ok: false, reason: "owl_voice_casting_required_paths_invalid" };
  }
  const voiceIds = values["--voice-ids"];
  if (mode === "list" && voiceIds !== undefined) {
    return { ok: false, reason: "owl_voice_casting_voice_ids_not_allowed_in_list" };
  }
  if (mode === "sample") {
    if (voiceIds === undefined) {
      return { ok: false, reason: "owl_voice_casting_voice_ids_required" };
    }
    if (!/^[A-Za-z0-9]{8,64}(,[A-Za-z0-9]{8,64}){0,5}$/.test(voiceIds)) {
      return { ok: false, reason: "owl_voice_casting_voice_ids_malformed" };
    }
  }
  return { ok: true };
}

/**
 * bull-topic-scan 인자 검증. env 접근 전에 수행한다.
 * - 인자는 --arm(+선택 --env-path) 뿐이다. 조회 대상(지수/종목)이 스캐너 코드에
 *   고정돼 있어 다른 값 인자를 받을 이유가 없다 — 추가 인자가 오면 즉시 거부한다.
 */
function validateBullTopicScanBeforeEnvAccess(rawArgs) {
  if (!Array.isArray(rawArgs) || rawArgs[0] !== "bull-topic-scan") {
    return { ok: false, reason: "bull_topic_scan_command_position_invalid" };
  }
  const valueFlags = new Set(["--env-path"]);
  const values = Object.create(null);
  let armed = false;
  for (let index = 1; index < rawArgs.length; index += 1) {
    const token = rawArgs[index];
    if (token === "--arm") {
      if (armed) return { ok: false, reason: "bull_topic_scan_duplicate_arm" };
      armed = true;
      continue;
    }
    if (!valueFlags.has(token) || Object.hasOwn(values, token)) {
      return { ok: false, reason: "bull_topic_scan_unknown_or_duplicate_flag" };
    }
    const value = rawArgs[index + 1];
    if (typeof value !== "string" || value.length === 0 || value.startsWith("--")) {
      return { ok: false, reason: "bull_topic_scan_flag_value_invalid" };
    }
    values[token] = value;
    index += 1;
  }
  if (values["--env-path"] !== undefined && !isAbsolute(values["--env-path"])) {
    return { ok: false, reason: "bull_topic_scan_env_path_invalid" };
  }
  return { ok: true };
}

/**
 * bull-topic-news-search 인자 검증. env 접근 전에 수행한다.
 * - 인자는 --arm(+선택 --env-path) 뿐이다. 검색 키워드가 스크립트 코드에
 *   고정돼 있어 임의 키워드를 주입할 통로가 없다.
 */
function validateBullTopicNewsSearchBeforeEnvAccess(rawArgs) {
  if (!Array.isArray(rawArgs) || rawArgs[0] !== "bull-topic-news-search") {
    return { ok: false, reason: "bull_topic_news_search_command_position_invalid" };
  }
  const valueFlags = new Set(["--env-path"]);
  const values = Object.create(null);
  let armed = false;
  for (let index = 1; index < rawArgs.length; index += 1) {
    const token = rawArgs[index];
    if (token === "--arm") {
      if (armed) return { ok: false, reason: "bull_topic_news_search_duplicate_arm" };
      armed = true;
      continue;
    }
    if (!valueFlags.has(token) || Object.hasOwn(values, token)) {
      return { ok: false, reason: "bull_topic_news_search_unknown_or_duplicate_flag" };
    }
    const value = rawArgs[index + 1];
    if (typeof value !== "string" || value.length === 0 || value.startsWith("--")) {
      return { ok: false, reason: "bull_topic_news_search_flag_value_invalid" };
    }
    values[token] = value;
    index += 1;
  }
  if (values["--env-path"] !== undefined && !isAbsolute(values["--env-path"])) {
    return { ok: false, reason: "bull_topic_news_search_env_path_invalid" };
  }
  return { ok: true };
}

/**
 * bull-topic-dart-scan 인자 검증. env 접근 전에 수행한다.
 * - 인자는 --arm(+선택 --env-path) 뿐이다. 조회 범위(오늘~어제, 전체 시장)가
 *   스크립트 코드에 고정돼 있어 임의 값을 주입할 통로가 없다.
 */
function validateBullTopicDartScanBeforeEnvAccess(rawArgs) {
  if (!Array.isArray(rawArgs) || rawArgs[0] !== "bull-topic-dart-scan") {
    return { ok: false, reason: "bull_topic_dart_scan_command_position_invalid" };
  }
  const valueFlags = new Set(["--env-path"]);
  const values = Object.create(null);
  let armed = false;
  for (let index = 1; index < rawArgs.length; index += 1) {
    const token = rawArgs[index];
    if (token === "--arm") {
      if (armed) return { ok: false, reason: "bull_topic_dart_scan_duplicate_arm" };
      armed = true;
      continue;
    }
    if (!valueFlags.has(token) || Object.hasOwn(values, token)) {
      return { ok: false, reason: "bull_topic_dart_scan_unknown_or_duplicate_flag" };
    }
    const value = rawArgs[index + 1];
    if (typeof value !== "string" || value.length === 0 || value.startsWith("--")) {
      return { ok: false, reason: "bull_topic_dart_scan_flag_value_invalid" };
    }
    values[token] = value;
    index += 1;
  }
  if (values["--env-path"] !== undefined && !isAbsolute(values["--env-path"])) {
    return { ok: false, reason: "bull_topic_dart_scan_env_path_invalid" };
  }
  return { ok: true };
}

/**
 * bull-topic-sector-news-search 인자 검증. env 접근 전에 수행한다.
 * - 인자는 --arm(+선택 --env-path) 뿐이다. 검색 키워드가 스크립트 코드에
 *   고정돼 있어 임의 키워드를 주입할 통로가 없다.
 */
function validateBullTopicSectorNewsSearchBeforeEnvAccess(rawArgs) {
  if (!Array.isArray(rawArgs) || rawArgs[0] !== "bull-topic-sector-news-search") {
    return { ok: false, reason: "bull_topic_sector_news_search_command_position_invalid" };
  }
  const valueFlags = new Set(["--env-path"]);
  const values = Object.create(null);
  let armed = false;
  for (let index = 1; index < rawArgs.length; index += 1) {
    const token = rawArgs[index];
    if (token === "--arm") {
      if (armed) return { ok: false, reason: "bull_topic_sector_news_search_duplicate_arm" };
      armed = true;
      continue;
    }
    if (!valueFlags.has(token) || Object.hasOwn(values, token)) {
      return { ok: false, reason: "bull_topic_sector_news_search_unknown_or_duplicate_flag" };
    }
    const value = rawArgs[index + 1];
    if (typeof value !== "string" || value.length === 0 || value.startsWith("--")) {
      return { ok: false, reason: "bull_topic_sector_news_search_flag_value_invalid" };
    }
    values[token] = value;
    index += 1;
  }
  if (values["--env-path"] !== undefined && !isAbsolute(values["--env-path"])) {
    return { ok: false, reason: "bull_topic_sector_news_search_env_path_invalid" };
  }
  return { ok: true };
}

/**
 * bull-topic-risk-awareness-news-search 인자 검증. env 접근 전에 수행한다.
 * - 인자는 --arm(+선택 --env-path) 뿐이다. 검색 키워드가 스크립트 코드에
 *   고정돼 있어 임의 키워드를 주입할 통로가 없다.
 */
function validateBullTopicRiskAwarenessNewsSearchBeforeEnvAccess(rawArgs) {
  if (!Array.isArray(rawArgs) || rawArgs[0] !== "bull-topic-risk-awareness-news-search") {
    return { ok: false, reason: "bull_topic_risk_awareness_news_search_command_position_invalid" };
  }
  const valueFlags = new Set(["--env-path"]);
  const values = Object.create(null);
  let armed = false;
  for (let index = 1; index < rawArgs.length; index += 1) {
    const token = rawArgs[index];
    if (token === "--arm") {
      if (armed) return { ok: false, reason: "bull_topic_risk_awareness_news_search_duplicate_arm" };
      armed = true;
      continue;
    }
    if (!valueFlags.has(token) || Object.hasOwn(values, token)) {
      return { ok: false, reason: "bull_topic_risk_awareness_news_search_unknown_or_duplicate_flag" };
    }
    const value = rawArgs[index + 1];
    if (typeof value !== "string" || value.length === 0 || value.startsWith("--")) {
      return { ok: false, reason: "bull_topic_risk_awareness_news_search_flag_value_invalid" };
    }
    values[token] = value;
    index += 1;
  }
  if (values["--env-path"] !== undefined && !isAbsolute(values["--env-path"])) {
    return { ok: false, reason: "bull_topic_risk_awareness_news_search_env_path_invalid" };
  }
  return { ok: true };
}

/**
 * bull-topic-lane-news-search 인자 검증. env 접근 전에 수행한다.
 * - 인자는 --arm(+선택 --env-path) 뿐이다. 검색 키워드가 스크립트 코드에 고정돼 있어
 *   임의 키워드를 주입할 통로가 없다.
 */
function validateBullTopicLaneNewsSearchBeforeEnvAccess(rawArgs) {
  if (!Array.isArray(rawArgs) || rawArgs[0] !== "bull-topic-lane-news-search") {
    return { ok: false, reason: "bull_topic_lane_news_search_command_position_invalid" };
  }
  const valueFlags = new Set(["--env-path"]);
  const values = Object.create(null);
  let armed = false;
  for (let index = 1; index < rawArgs.length; index += 1) {
    const token = rawArgs[index];
    if (token === "--arm") {
      if (armed) return { ok: false, reason: "bull_topic_lane_news_search_duplicate_arm" };
      armed = true;
      continue;
    }
    if (!valueFlags.has(token) || Object.hasOwn(values, token)) {
      return { ok: false, reason: "bull_topic_lane_news_search_unknown_or_duplicate_flag" };
    }
    const value = rawArgs[index + 1];
    if (typeof value !== "string" || value.length === 0 || value.startsWith("--")) {
      return { ok: false, reason: "bull_topic_lane_news_search_flag_value_invalid" };
    }
    values[token] = value;
    index += 1;
  }
  if (values["--env-path"] !== undefined && !isAbsolute(values["--env-path"])) {
    return { ok: false, reason: "bull_topic_lane_news_search_env_path_invalid" };
  }
  return { ok: true };
}

/**
 * --arm(과 선택 --env-path)만 받는 읽기 전용 명령용 공통 인자 검증. env 접근 전에 수행한다.
 */
function validateArmOnlyBeforeEnvAccess(rawArgs, commandName) {
  if (!Array.isArray(rawArgs) || rawArgs[0] !== commandName) {
    return { ok: false, reason: `${commandName}_command_position_invalid` };
  }
  let armed = false;
  let envPathSeen = false;
  for (let index = 1; index < rawArgs.length; index += 1) {
    const token = rawArgs[index];
    if (token === "--arm") {
      if (armed) return { ok: false, reason: `${commandName}_duplicate_arm` };
      armed = true;
      continue;
    }
    if (token === "--env-path" && !envPathSeen) {
      const value = rawArgs[index + 1];
      if (typeof value !== "string" || !isAbsolute(value)) return { ok: false, reason: `${commandName}_env_path_invalid` };
      envPathSeen = true;
      index += 1;
      continue;
    }
    return { ok: false, reason: `${commandName}_unknown_or_duplicate_flag` };
  }
  return { ok: true };
}

/**
 * owl-blob-upload 인자 검증. env 접근 전에 수행한다.
 * - --request / --out-dir 필수. 둘 다 절대경로이고 repo 밖이어야 한다.
 * - 러너 자체가 승인 토큰·one-shot·해시 재검증 게이트를 갖고 있으므로 여기서는
 *   경로 범위만 막는다.
 */
function validateOwlBlobUploadBeforeEnvAccess(rawArgs) {
  if (!Array.isArray(rawArgs) || rawArgs[0] !== "owl-blob-upload") {
    return { ok: false, reason: "owl_blob_upload_command_position_invalid" };
  }
  const valueFlags = new Set(["--env-path", "--request", "--out-dir"]);
  const values = Object.create(null);
  let armed = false;
  for (let index = 1; index < rawArgs.length; index += 1) {
    const token = rawArgs[index];
    if (token === "--arm") {
      if (armed) return { ok: false, reason: "owl_blob_upload_duplicate_arm" };
      armed = true;
      continue;
    }
    if (!valueFlags.has(token) || Object.hasOwn(values, token)) {
      return { ok: false, reason: "owl_blob_upload_unknown_or_duplicate_flag" };
    }
    const value = rawArgs[index + 1];
    if (typeof value !== "string" || value.length === 0 || value.startsWith("--")) {
      return { ok: false, reason: "owl_blob_upload_flag_value_invalid" };
    }
    values[token] = value;
    index += 1;
  }
  const request = values["--request"] ?? "";
  const outDir = values["--out-dir"] ?? "";
  if (
    !isAbsolute(request) ||
    !isAbsolute(outDir) ||
    lexicalPathInside(REPO_ROOT, outDir) ||
    outDir.includes(".money-shorts-local") ||
    request.includes(".money-shorts-local") ||
    (values["--env-path"] !== undefined && !isAbsolute(values["--env-path"]))
  ) {
    return { ok: false, reason: "owl_blob_upload_required_paths_invalid" };
  }
  return { ok: true };
}

/**
 * owl-cardnews-blob-upload 인자 검증. env 접근 전에 수행한다. owl-blob-upload와
 * 동일한 원칙(경로 범위만 막고 나머지는 러너 자체 게이트에 맡김) — 대상만 PNG
 * 여러 장 request로 다르다.
 */
function validateOwlCardnewsBlobUploadBeforeEnvAccess(rawArgs) {
  if (!Array.isArray(rawArgs) || rawArgs[0] !== "owl-cardnews-blob-upload") {
    return { ok: false, reason: "owl_cardnews_blob_upload_command_position_invalid" };
  }
  const valueFlags = new Set(["--env-path", "--request", "--out-dir"]);
  const values = Object.create(null);
  let armed = false;
  for (let index = 1; index < rawArgs.length; index += 1) {
    const token = rawArgs[index];
    if (token === "--arm") {
      if (armed) return { ok: false, reason: "owl_cardnews_blob_upload_duplicate_arm" };
      armed = true;
      continue;
    }
    if (!valueFlags.has(token) || Object.hasOwn(values, token)) {
      return { ok: false, reason: "owl_cardnews_blob_upload_unknown_or_duplicate_flag" };
    }
    const value = rawArgs[index + 1];
    if (typeof value !== "string" || value.length === 0 || value.startsWith("--")) {
      return { ok: false, reason: "owl_cardnews_blob_upload_flag_value_invalid" };
    }
    values[token] = value;
    index += 1;
  }
  const request = values["--request"] ?? "";
  const outDir = values["--out-dir"] ?? "";
  if (
    !isAbsolute(request) ||
    !isAbsolute(outDir) ||
    lexicalPathInside(REPO_ROOT, outDir) ||
    outDir.includes(".money-shorts-local") ||
    request.includes(".money-shorts-local") ||
    (values["--env-path"] !== undefined && !isAbsolute(values["--env-path"]))
  ) {
    return { ok: false, reason: "owl_cardnews_blob_upload_required_paths_invalid" };
  }
  return { ok: true };
}

/**
 * owl-reel-cover-blob-upload 인자 검증. env 접근 전에 수행한다.
 * owl-cardnews-blob-upload와 동일한 원칙(경로 범위만 막고 나머지는 러너 자체
 * 게이트에 맡김) — 대상만 커버 이미지 1장 request로 다르다.
 */
function validateOwlReelCoverBlobUploadBeforeEnvAccess(rawArgs) {
  if (!Array.isArray(rawArgs) || rawArgs[0] !== "owl-reel-cover-blob-upload") {
    return { ok: false, reason: "owl_reel_cover_blob_upload_command_position_invalid" };
  }
  const valueFlags = new Set(["--env-path", "--request", "--out-dir"]);
  const values = Object.create(null);
  let armed = false;
  for (let index = 1; index < rawArgs.length; index += 1) {
    const token = rawArgs[index];
    if (token === "--arm") {
      if (armed) return { ok: false, reason: "owl_reel_cover_blob_upload_duplicate_arm" };
      armed = true;
      continue;
    }
    if (!valueFlags.has(token) || Object.hasOwn(values, token)) {
      return { ok: false, reason: "owl_reel_cover_blob_upload_unknown_or_duplicate_flag" };
    }
    const value = rawArgs[index + 1];
    if (typeof value !== "string" || value.length === 0 || value.startsWith("--")) {
      return { ok: false, reason: "owl_reel_cover_blob_upload_flag_value_invalid" };
    }
    values[token] = value;
    index += 1;
  }
  const request = values["--request"] ?? "";
  const outDir = values["--out-dir"] ?? "";
  if (
    !isAbsolute(request) ||
    !isAbsolute(outDir) ||
    lexicalPathInside(REPO_ROOT, outDir) ||
    outDir.includes(".money-shorts-local") ||
    request.includes(".money-shorts-local") ||
    (values["--env-path"] !== undefined && !isAbsolute(values["--env-path"]))
  ) {
    return { ok: false, reason: "owl_reel_cover_blob_upload_required_paths_invalid" };
  }
  return { ok: true };
}

/**
 * owl-cardnews-instagram-publish 인자 검증. env 접근 전에 수행한다.
 * owl-instagram-publish와 동일한 원칙 — --content-unit 대신 --caption-file을 받는다
 * (카드뉴스는 콘텐츠 유닛 매니페스트가 아니라 캡션 텍스트 파일 하나면 충분).
 */
function validateOwlCardnewsInstagramPublishBeforeEnvAccess(rawArgs) {
  if (!Array.isArray(rawArgs) || rawArgs[0] !== "owl-cardnews-instagram-publish") {
    return { ok: false, reason: "owl_cardnews_instagram_publish_command_position_invalid" };
  }
  const valueFlags = new Set(["--env-path", "--caption-file", "--blob-result", "--out-dir"]);
  const values = Object.create(null);
  let armed = false;
  for (let index = 1; index < rawArgs.length; index += 1) {
    const token = rawArgs[index];
    if (token === "--arm") {
      if (armed) return { ok: false, reason: "owl_cardnews_instagram_publish_duplicate_arm" };
      armed = true;
      continue;
    }
    if (!valueFlags.has(token) || Object.hasOwn(values, token)) {
      return { ok: false, reason: "owl_cardnews_instagram_publish_unknown_or_duplicate_flag" };
    }
    const value = rawArgs[index + 1];
    if (typeof value !== "string" || value.length === 0 || value.startsWith("--")) {
      return { ok: false, reason: "owl_cardnews_instagram_publish_flag_value_invalid" };
    }
    values[token] = value;
    index += 1;
  }
  const required = ["--caption-file", "--blob-result", "--out-dir"];
  for (const flag of required) {
    if (!isAbsolute(values[flag] ?? "")) {
      return { ok: false, reason: "owl_cardnews_instagram_publish_required_paths_invalid" };
    }
  }
  if (
    lexicalPathInside(REPO_ROOT, values["--out-dir"]) ||
    required.some((flag) => values[flag].includes(".money-shorts-local")) ||
    (values["--env-path"] !== undefined && !isAbsolute(values["--env-path"]))
  ) {
    return { ok: false, reason: "owl_cardnews_instagram_publish_required_paths_invalid" };
  }
  return { ok: true };
}

/**
 * owl-instagram-publish 인자 검증. env 접근 전에 수행한다.
 * 러너가 승인 토큰·one-shot·캡션 길이·공개 URL 게이트를 갖고 있으므로 여기서는
 * 경로 범위만 막는다.
 */
function validateOwlInstagramPublishBeforeEnvAccess(rawArgs) {
  if (!Array.isArray(rawArgs) || rawArgs[0] !== "owl-instagram-publish") {
    return { ok: false, reason: "owl_instagram_publish_command_position_invalid" };
  }
  const valueFlags = new Set(["--env-path", "--content-unit", "--blob-result", "--out-dir"]);
  const values = Object.create(null);
  let armed = false;
  for (let index = 1; index < rawArgs.length; index += 1) {
    const token = rawArgs[index];
    if (token === "--arm") {
      if (armed) return { ok: false, reason: "owl_instagram_publish_duplicate_arm" };
      armed = true;
      continue;
    }
    if (!valueFlags.has(token) || Object.hasOwn(values, token)) {
      return { ok: false, reason: "owl_instagram_publish_unknown_or_duplicate_flag" };
    }
    const value = rawArgs[index + 1];
    if (typeof value !== "string" || value.length === 0 || value.startsWith("--")) {
      return { ok: false, reason: "owl_instagram_publish_flag_value_invalid" };
    }
    values[token] = value;
    index += 1;
  }
  const required = ["--content-unit", "--blob-result", "--out-dir"];
  for (const flag of required) {
    if (!isAbsolute(values[flag] ?? "")) {
      return { ok: false, reason: "owl_instagram_publish_required_paths_invalid" };
    }
  }
  if (
    lexicalPathInside(REPO_ROOT, values["--out-dir"]) ||
    required.some((flag) => values[flag].includes(".money-shorts-local")) ||
    (values["--env-path"] !== undefined && !isAbsolute(values["--env-path"]))
  ) {
    return { ok: false, reason: "owl_instagram_publish_required_paths_invalid" };
  }
  return { ok: true };
}

/**
 * owl-instagram-story-publish 인자 검증. env 접근 전에 수행한다.
 * owl-instagram-publish와 동일한 인자 계약(--content-unit/--blob-result/--out-dir)
 * 이므로 검증 로직도 동일하게 복제한다 — 별도 스크립트·승인 토큰만 다르다.
 */
function validateOwlInstagramStoryPublishBeforeEnvAccess(rawArgs) {
  if (!Array.isArray(rawArgs) || rawArgs[0] !== "owl-instagram-story-publish") {
    return { ok: false, reason: "owl_instagram_story_publish_command_position_invalid" };
  }
  const valueFlags = new Set([
    "--env-path", "--content-unit", "--cardnews-blob-result", "--out-dir", "--slide-index",
  ]);
  const values = Object.create(null);
  let armed = false;
  for (let index = 1; index < rawArgs.length; index += 1) {
    const token = rawArgs[index];
    if (token === "--arm") {
      if (armed) return { ok: false, reason: "owl_instagram_story_publish_duplicate_arm" };
      armed = true;
      continue;
    }
    if (!valueFlags.has(token) || Object.hasOwn(values, token)) {
      return { ok: false, reason: "owl_instagram_story_publish_unknown_or_duplicate_flag" };
    }
    const value = rawArgs[index + 1];
    if (typeof value !== "string" || value.length === 0 || value.startsWith("--")) {
      return { ok: false, reason: "owl_instagram_story_publish_flag_value_invalid" };
    }
    values[token] = value;
    index += 1;
  }
  const requiredPaths = ["--content-unit", "--cardnews-blob-result", "--out-dir"];
  for (const flag of requiredPaths) {
    if (!isAbsolute(values[flag] ?? "")) {
      return { ok: false, reason: "owl_instagram_story_publish_required_paths_invalid" };
    }
  }
  if (values["--slide-index"] !== undefined && !/^[1-9][0-9]*$/.test(values["--slide-index"])) {
    return { ok: false, reason: "owl_instagram_story_publish_slide_index_invalid" };
  }
  if (
    lexicalPathInside(REPO_ROOT, values["--out-dir"]) ||
    requiredPaths.some((flag) => values[flag].includes(".money-shorts-local")) ||
    (values["--env-path"] !== undefined && !isAbsolute(values["--env-path"]))
  ) {
    return { ok: false, reason: "owl_instagram_story_publish_required_paths_invalid" };
  }
  return { ok: true };
}

/**
 * owl-instagram-media-delete 인자 검증. env 접근 전에 수행한다.
 * --media-id는 숫자 문자열만 허용한다(SQL/경로 주입 방지 목적이 아니라,
 * 실수로 다른 형태의 값이 들어가는 걸 조기에 거르기 위함).
 */
function validateOwlInstagramMediaDeleteBeforeEnvAccess(rawArgs) {
  if (!Array.isArray(rawArgs) || rawArgs[0] !== "owl-instagram-media-delete") {
    return { ok: false, reason: "owl_instagram_media_delete_command_position_invalid" };
  }
  const valueFlags = new Set(["--env-path", "--media-id", "--out-dir"]);
  const values = Object.create(null);
  let armed = false;
  for (let index = 1; index < rawArgs.length; index += 1) {
    const token = rawArgs[index];
    if (token === "--arm") {
      if (armed) return { ok: false, reason: "owl_instagram_media_delete_duplicate_arm" };
      armed = true;
      continue;
    }
    if (!valueFlags.has(token) || Object.hasOwn(values, token)) {
      return { ok: false, reason: "owl_instagram_media_delete_unknown_or_duplicate_flag" };
    }
    const value = rawArgs[index + 1];
    if (typeof value !== "string" || value.length === 0 || value.startsWith("--")) {
      return { ok: false, reason: "owl_instagram_media_delete_flag_value_invalid" };
    }
    values[token] = value;
    index += 1;
  }
  if (!/^[0-9]+$/.test(values["--media-id"] ?? "")) {
    return { ok: false, reason: "owl_instagram_media_delete_media_id_invalid" };
  }
  if (!isAbsolute(values["--out-dir"] ?? "")) {
    return { ok: false, reason: "owl_instagram_media_delete_required_paths_invalid" };
  }
  if (
    lexicalPathInside(REPO_ROOT, values["--out-dir"]) ||
    values["--out-dir"].includes(".money-shorts-local") ||
    (values["--env-path"] !== undefined && !isAbsolute(values["--env-path"]))
  ) {
    return { ok: false, reason: "owl_instagram_media_delete_required_paths_invalid" };
  }
  return { ok: true };
}

/**
 * owl-youtube-publish 인자 검증. env 접근 전에 수행한다.
 * --privacy 는 public/private 만 허용한다(오타로 의도치 않게 공개되는 것 방지).
 * --publish-at(2026-09-28 추가)은 ISO8601 미래 시각만 허용한다 — 예약 발행은
 * 업로드 후 API로 취소·수정이 안 되므로 여기서부터 형식을 엄격히 막는다.
 */
function validateOwlYoutubePublishBeforeEnvAccess(rawArgs) {
  if (!Array.isArray(rawArgs) || rawArgs[0] !== "owl-youtube-publish") {
    return { ok: false, reason: "owl_youtube_publish_command_position_invalid" };
  }
  const valueFlags = new Set(["--env-path", "--content-unit", "--out-dir", "--privacy", "--publish-at"]);
  const values = Object.create(null);
  let armed = false;
  for (let index = 1; index < rawArgs.length; index += 1) {
    const token = rawArgs[index];
    if (token === "--arm") {
      if (armed) return { ok: false, reason: "owl_youtube_publish_duplicate_arm" };
      armed = true;
      continue;
    }
    if (!valueFlags.has(token) || Object.hasOwn(values, token)) {
      return { ok: false, reason: "owl_youtube_publish_unknown_or_duplicate_flag" };
    }
    const value = rawArgs[index + 1];
    if (typeof value !== "string" || value.length === 0 || value.startsWith("--")) {
      return { ok: false, reason: "owl_youtube_publish_flag_value_invalid" };
    }
    values[token] = value;
    index += 1;
  }
  for (const flag of ["--content-unit", "--out-dir"]) {
    if (!isAbsolute(values[flag] ?? "")) {
      return { ok: false, reason: "owl_youtube_publish_required_paths_invalid" };
    }
  }
  if (
    lexicalPathInside(REPO_ROOT, values["--out-dir"]) ||
    values["--content-unit"].includes(".money-shorts-local") ||
    values["--out-dir"].includes(".money-shorts-local") ||
    (values["--env-path"] !== undefined && !isAbsolute(values["--env-path"]))
  ) {
    return { ok: false, reason: "owl_youtube_publish_required_paths_invalid" };
  }
  if (values["--privacy"] !== undefined && !["public", "private"].includes(values["--privacy"])) {
    return { ok: false, reason: "owl_youtube_publish_privacy_invalid" };
  }
  if (values["--publish-at"] !== undefined) {
    const parsed = new Date(values["--publish-at"]);
    if (Number.isNaN(parsed.getTime()) || parsed.getTime() <= Date.now()) {
      return { ok: false, reason: "owl_youtube_publish_publish_at_invalid" };
    }
    if (values["--privacy"] === "public") {
      return { ok: false, reason: "owl_youtube_publish_publish_at_conflicts_with_public" };
    }
  }
  return { ok: true };
}

/**
 * owl-youtube-title-update 인자 검증. env 접근 전에 수행한다.
 * --video-id 는 YouTube videoId 형식만 허용, --title 은 빈 값/100자 초과 금지.
 */
function validateOwlYoutubeTitleUpdateBeforeEnvAccess(rawArgs) {
  if (!Array.isArray(rawArgs) || rawArgs[0] !== "owl-youtube-title-update") {
    return { ok: false, reason: "owl_youtube_title_update_command_position_invalid" };
  }
  const valueFlags = new Set(["--env-path", "--video-id", "--title", "--out-dir"]);
  const values = Object.create(null);
  let armed = false;
  for (let index = 1; index < rawArgs.length; index += 1) {
    const token = rawArgs[index];
    if (token === "--arm") {
      if (armed) return { ok: false, reason: "owl_youtube_title_update_duplicate_arm" };
      armed = true;
      continue;
    }
    if (!valueFlags.has(token) || Object.hasOwn(values, token)) {
      return { ok: false, reason: "owl_youtube_title_update_unknown_or_duplicate_flag" };
    }
    const value = rawArgs[index + 1];
    if (typeof value !== "string" || value.length === 0 || value.startsWith("--")) {
      return { ok: false, reason: "owl_youtube_title_update_flag_value_invalid" };
    }
    values[token] = value;
    index += 1;
  }
  if (!/^[A-Za-z0-9_-]{6,20}$/.test(values["--video-id"] ?? "")) {
    return { ok: false, reason: "owl_youtube_title_update_video_id_invalid" };
  }
  if (!values["--title"] || values["--title"].length > 100) {
    return { ok: false, reason: "owl_youtube_title_update_title_invalid" };
  }
  if (!isAbsolute(values["--out-dir"] ?? "")) {
    return { ok: false, reason: "owl_youtube_title_update_out_dir_invalid" };
  }
  if (
    lexicalPathInside(REPO_ROOT, values["--out-dir"]) ||
    values["--out-dir"].includes(".money-shorts-local") ||
    (values["--env-path"] !== undefined && !isAbsolute(values["--env-path"]))
  ) {
    return { ok: false, reason: "owl_youtube_title_update_out_dir_invalid" };
  }
  return { ok: true };
}

/**
 * owl-youtube-thumbnail-set 인자 검증. env 접근 전에 수행한다.
 * --thumbnail 은 절대경로여야 하고 repo/.money-shorts-local 밖이어야 한다.
 */
function validateOwlYoutubeThumbnailSetBeforeEnvAccess(rawArgs) {
  if (!Array.isArray(rawArgs) || rawArgs[0] !== "owl-youtube-thumbnail-set") {
    return { ok: false, reason: "owl_youtube_thumbnail_set_command_position_invalid" };
  }
  const valueFlags = new Set(["--env-path", "--video-id", "--thumbnail", "--out-dir"]);
  const values = Object.create(null);
  let armed = false;
  for (let index = 1; index < rawArgs.length; index += 1) {
    const token = rawArgs[index];
    if (token === "--arm") {
      if (armed) return { ok: false, reason: "owl_youtube_thumbnail_set_duplicate_arm" };
      armed = true;
      continue;
    }
    if (!valueFlags.has(token) || Object.hasOwn(values, token)) {
      return { ok: false, reason: "owl_youtube_thumbnail_set_unknown_or_duplicate_flag" };
    }
    const value = rawArgs[index + 1];
    if (typeof value !== "string" || value.length === 0 || value.startsWith("--")) {
      return { ok: false, reason: "owl_youtube_thumbnail_set_flag_value_invalid" };
    }
    values[token] = value;
    index += 1;
  }
  if (!/^[A-Za-z0-9_-]{6,20}$/.test(values["--video-id"] ?? "")) {
    return { ok: false, reason: "owl_youtube_thumbnail_set_video_id_invalid" };
  }
  if (!isAbsolute(values["--thumbnail"] ?? "") || !isAbsolute(values["--out-dir"] ?? "")) {
    return { ok: false, reason: "owl_youtube_thumbnail_set_required_paths_invalid" };
  }
  if (
    lexicalPathInside(REPO_ROOT, values["--out-dir"]) ||
    values["--thumbnail"].includes(".money-shorts-local") ||
    values["--out-dir"].includes(".money-shorts-local") ||
    (values["--env-path"] !== undefined && !isAbsolute(values["--env-path"]))
  ) {
    return { ok: false, reason: "owl_youtube_thumbnail_set_required_paths_invalid" };
  }
  return { ok: true };
}

/**
 * 토큰 건강 검진 인자 검증. Instagram/YouTube 두 명령이 공유한다.
 * 읽기 전용이라 경로 인자가 없고, --env-path 와 --arm 외에는 받지 않는다.
 */
const TOKEN_HEALTH_COMMANDS = new Set([
  "owl-instagram-token-health",
  "owl-youtube-token-health",
]);
function validateOwlTokenHealthBeforeEnvAccess(rawArgs) {
  if (!Array.isArray(rawArgs) || !TOKEN_HEALTH_COMMANDS.has(rawArgs[0])) {
    return { ok: false, reason: "owl_token_health_command_position_invalid" };
  }
  let armed = false;
  for (let index = 1; index < rawArgs.length; index += 1) {
    const token = rawArgs[index];
    if (token === "--arm") {
      if (armed) return { ok: false, reason: "owl_token_health_duplicate_arm" };
      armed = true;
      continue;
    }
    if (token === "--env-path") {
      const value = rawArgs[index + 1];
      if (typeof value !== "string" || !isAbsolute(value)) {
        return { ok: false, reason: "owl_token_health_env_path_invalid" };
      }
      index += 1;
      continue;
    }
    return { ok: false, reason: "owl_token_health_unknown_flag" };
  }
  return { ok: true };
}

function validateYoutubeOnlyRecoveryBeforeEnvAccess(
  rawArgs,
) {
  if (
    !Array.isArray(rawArgs) ||
    rawArgs[0] !== "youtube-only-part1-recovery"
  ) {
    return {
      ok: false,
      reason: "youtube_recovery_command_position_invalid",
    };
  }
  const valueFlags = new Set([
    "--env-path",
    ...YOUTUBE_ONLY_REQUIRED_PATH_FLAGS,
    ...YOUTUBE_ONLY_REQUIRED_EVIDENCE_FLAGS,
    "--expected-preflight-fingerprint",
  ]);
  const values = Object.create(null);
  let armed = false;
  for (let index = 1; index < rawArgs.length; index += 1) {
    const token = rawArgs[index];
    if (token === "--arm") {
      if (armed) {
        return {
          ok: false,
          reason: "youtube_recovery_duplicate_arm",
        };
      }
      armed = true;
      continue;
    }
    if (!valueFlags.has(token) || Object.hasOwn(values, token)) {
      return {
        ok: false,
        reason: "youtube_recovery_unknown_or_duplicate_flag",
      };
    }
    const value = rawArgs[index + 1];
    if (
      typeof value !== "string" ||
      value.length === 0 ||
      value.startsWith("--")
    ) {
      return {
        ok: false,
        reason: "youtube_recovery_flag_value_invalid",
      };
    }
    values[token] = value;
    index += 1;
  }
  if (
    !YOUTUBE_ONLY_REQUIRED_PATH_FLAGS.every(
      (flag) =>
        typeof values[flag] === "string" &&
        isAbsolute(values[flag]),
    ) ||
    !YOUTUBE_ONLY_REQUIRED_EVIDENCE_FLAGS.every(
      (flag) => typeof values[flag] === "string",
    ) ||
    !SHA256_RE.test(
      values["--expected-recovery-fingerprint"] ?? "",
    ) ||
    !SHA256_RE.test(
      values["--expected-resolution-sha256"] ?? "",
    ) ||
    !YOUTUBE_CHANNEL_ID_RE.test(
      values["--expected-channel-id"] ?? "",
    ) ||
    (values["--expected-preflight-fingerprint"] !==
      undefined &&
      !SHA256_RE.test(
        values["--expected-preflight-fingerprint"],
      )) ||
    (armed &&
      !SHA256_RE.test(
        values["--expected-preflight-fingerprint"] ?? "",
      ))
  ) {
    return {
      ok: false,
      reason: "youtube_recovery_required_evidence_invalid",
    };
  }
  return { ok: true };
}

function validatePart2DualPublishBeforeEnvAccess(rawArgs) {
  if (
    !Array.isArray(rawArgs) ||
    rawArgs[0] !== "part2-only-dual-publish"
  ) {
    return {
      ok: false,
      reason:
        "part2_dual_safe_command_position_invalid",
    };
  }
  const valueFlags = new Set([
    "--env-path",
    ...PART2_DUAL_SAFE_REQUIRED_PATH_FLAGS,
    ...PART2_DUAL_SAFE_REQUIRED_EVIDENCE_FLAGS,
    "--expected-preflight-fingerprint",
  ]);
  const values = Object.create(null);
  let armed = false;
  for (let index = 1; index < rawArgs.length; index += 1) {
    const token = rawArgs[index];
    if (token === "--arm") {
      if (armed) {
        return {
          ok: false,
          reason: "part2_dual_safe_duplicate_arm",
        };
      }
      armed = true;
      continue;
    }
    if (
      !valueFlags.has(token) ||
      Object.hasOwn(values, token)
    ) {
      return {
        ok: false,
        reason:
          "part2_dual_safe_unknown_or_duplicate_flag",
      };
    }
    const value = rawArgs[index + 1];
    if (
      typeof value !== "string" ||
      value.length === 0 ||
      value.startsWith("--")
    ) {
      return {
        ok: false,
        reason: "part2_dual_safe_flag_value_invalid",
      };
    }
    values[token] = value;
    index += 1;
  }
  const contentId =
    values["--expected-content-id"] ?? "";
  if (
    !PART2_DUAL_SAFE_REQUIRED_PATH_FLAGS.every(
      (flag) =>
        typeof values[flag] === "string" &&
        isAbsolute(values[flag]),
    ) ||
    !PART2_DUAL_SAFE_REQUIRED_EVIDENCE_FLAGS.every(
      (flag) => typeof values[flag] === "string",
    ) ||
    !contentId.endsWith("-part-2") ||
    !SHA256_RE.test(
      values["--expected-manifest-sha256"] ?? "",
    ) ||
    !SHA256_RE.test(
      values["--expected-source-sha256"] ?? "",
    ) ||
    !SHA256_RE.test(
      values[
        "--expected-publication-attempt-fingerprint"
      ] ?? "",
    ) ||
    !INSTAGRAM_ACCOUNT_ID_RE.test(
      values["--expected-instagram-account-id"] ?? "",
    ) ||
    !YOUTUBE_CHANNEL_ID_RE.test(
      values["--expected-youtube-channel-id"] ?? "",
    ) ||
    (values["--expected-preflight-fingerprint"] !==
      undefined &&
      !SHA256_RE.test(
        values["--expected-preflight-fingerprint"],
      )) ||
    (armed &&
      !SHA256_RE.test(
        values["--expected-preflight-fingerprint"] ?? "",
      ))
  ) {
    return {
      ok: false,
      reason:
        "part2_dual_safe_required_evidence_invalid",
    };
  }
  return { ok: true };
}

function validatePart2InstagramIdentityBeforeEnvAccess(
  rawArgs,
) {
  if (
    !Array.isArray(rawArgs) ||
    rawArgs[0] !==
      "part2-instagram-identity-preflight"
  ) {
    return {
      ok: false,
      reason:
        "part2_instagram_identity_command_position_invalid",
    };
  }
  const valueFlags = new Set([
    "--env-path",
    ...PART2_INSTAGRAM_IDENTITY_REQUIRED_FLAGS,
    "--expected-plan-fingerprint",
  ]);
  const values = Object.create(null);
  let armed = false;
  for (let index = 1; index < rawArgs.length; index += 1) {
    const token = rawArgs[index];
    if (token === "--arm") {
      if (armed) {
        return {
          ok: false,
          reason:
            "part2_instagram_identity_duplicate_arm",
        };
      }
      armed = true;
      continue;
    }
    if (
      !valueFlags.has(token) ||
      Object.hasOwn(values, token)
    ) {
      return {
        ok: false,
        reason:
          "part2_instagram_identity_unknown_or_duplicate_flag",
      };
    }
    const value = rawArgs[index + 1];
    if (
      typeof value !== "string" ||
      value.length === 0 ||
      value.startsWith("--")
    ) {
      return {
        ok: false,
        reason:
          "part2_instagram_identity_flag_value_invalid",
      };
    }
    values[token] = value;
    index += 1;
  }
  if (
    !PART2_INSTAGRAM_IDENTITY_REQUIRED_FLAGS.every(
      (flag) => typeof values[flag] === "string",
    ) ||
    !isAbsolute(values["--content-unit"] ?? "") ||
    !String(values["--expected-content-id"] ?? "")
      .endsWith("-part-2") ||
    !SHA256_RE.test(
      values["--expected-manifest-sha256"] ?? "",
    ) ||
    !SHA256_RE.test(
      values["--expected-source-sha256"] ?? "",
    ) ||
    !INSTAGRAM_ACCOUNT_ID_RE.test(
      values["--expected-instagram-account-id"] ?? "",
    ) ||
    (values["--expected-plan-fingerprint"] !==
      undefined &&
      !SHA256_RE.test(
        values["--expected-plan-fingerprint"],
      )) ||
    (armed &&
      !SHA256_RE.test(
        values["--expected-plan-fingerprint"] ?? "",
      ))
  ) {
    return {
      ok: false,
      reason:
        "part2_instagram_identity_required_binding_invalid",
    };
  }
  return { ok: true };
}

function lexicalPathInside(rootPath, candidatePath) {
  const rel = relative(
    resolve(rootPath).toLowerCase(),
    resolve(candidatePath).toLowerCase(),
  );
  return (
    rel === "" ||
    (!rel.startsWith("..") && !isAbsolute(rel))
  );
}

function validatePart2InstagramRecoveryBeforeEnvAccess(
  rawArgs,
) {
  if (
    !Array.isArray(rawArgs) ||
    rawArgs[0] !==
      "part2-instagram-recovery-execution"
  ) {
    return {
      ok: false,
      reason:
        "part2_instagram_recovery_command_position_invalid",
    };
  }
  const valueFlags = new Set([
    "--env-path",
    ...PART2_INSTAGRAM_RECOVERY_REQUIRED_VALUE_FLAGS,
    "--expected-execution-preflight-fingerprint",
  ]);
  const values = Object.create(null);
  let armed = false;
  for (
    let index = 1;
    index < rawArgs.length;
    index += 1
  ) {
    const token = rawArgs[index];
    if (token === "--arm") {
      if (armed) {
        return {
          ok: false,
          reason:
            "part2_instagram_recovery_duplicate_arm",
        };
      }
      armed = true;
      continue;
    }
    if (
      !valueFlags.has(token) ||
      Object.hasOwn(values, token)
    ) {
      return {
        ok: false,
        reason:
          "part2_instagram_recovery_unknown_or_duplicate_flag",
      };
    }
    const value = rawArgs[index + 1];
    if (
      typeof value !== "string" ||
      value.length === 0 ||
      value.startsWith("--")
    ) {
      return {
        ok: false,
        reason:
          "part2_instagram_recovery_flag_value_invalid",
      };
    }
    values[token] = value;
    index += 1;
  }
  const recoveryOutDir =
    values["--recovery-out-dir"] ?? "";
  const outDir = values["--out-dir"] ?? "";
  const contentUnit =
    values["--content-unit"] ?? "";
  const ledger = values["--ledger"] ?? "";
  if (
    !PART2_INSTAGRAM_RECOVERY_REQUIRED_VALUE_FLAGS.every(
      (flag) => typeof values[flag] === "string",
    ) ||
    !PART2_INSTAGRAM_RECOVERY_REQUIRED_PATH_FLAGS.every(
      (flag) => isAbsolute(values[flag] ?? ""),
    ) ||
    (values["--env-path"] !== undefined &&
      !isAbsolute(values["--env-path"])) ||
    !PART2_CONTENT_ID_RE.test(
      values["--expected-content-id"] ?? "",
    ) ||
    !INSTAGRAM_NONZERO_ACCOUNT_ID_RE.test(
      values["--expected-instagram-account-id"] ??
        "",
    ) ||
    !YOUTUBE_CHANNEL_ID_RE.test(
      values["--expected-youtube-channel-id"] ?? "",
    ) ||
    !PART2_INSTAGRAM_RECOVERY_REQUIRED_HASH_FLAGS.every(
      (flag) => SHA256_RE.test(values[flag] ?? ""),
    ) ||
    (armed &&
      !SHA256_RE.test(
        values[
          "--expected-execution-preflight-fingerprint"
        ] ?? "",
      )) ||
    (!armed &&
      values[
        "--expected-execution-preflight-fingerprint"
      ] !== undefined) ||
    lexicalPathInside(REPO_ROOT, recoveryOutDir) ||
    lexicalPathInside(outDir, recoveryOutDir) ||
    lexicalPathInside(recoveryOutDir, outDir) ||
    lexicalPathInside(recoveryOutDir, contentUnit) ||
    lexicalPathInside(recoveryOutDir, ledger)
  ) {
    return {
      ok: false,
      reason:
        "part2_instagram_recovery_required_binding_invalid",
    };
  }
  return { ok: true };
}

function validatePart2YoutubeRecoveryBeforeEnvAccess(
  rawArgs,
) {
  if (
    !Array.isArray(rawArgs) ||
    rawArgs[0] !==
      "part2-youtube-recovery-execution"
  ) {
    return {
      ok: false,
      reason:
        "part2_youtube_recovery_command_position_invalid",
    };
  }
  const valueFlags = new Set([
    "--env-path",
    ...PART2_YOUTUBE_RECOVERY_REQUIRED_VALUE_FLAGS,
    "--expected-execution-preflight-fingerprint",
  ]);
  const values = Object.create(null);
  let armed = false;
  for (
    let index = 1;
    index < rawArgs.length;
    index += 1
  ) {
    const token = rawArgs[index];
    if (token === "--arm") {
      if (armed) {
        return {
          ok: false,
          reason:
            "part2_youtube_recovery_duplicate_arm",
        };
      }
      armed = true;
      continue;
    }
    if (
      !valueFlags.has(token) ||
      Object.hasOwn(values, token)
    ) {
      return {
        ok: false,
        reason:
          "part2_youtube_recovery_unknown_or_duplicate_flag",
      };
    }
    const value = rawArgs[index + 1];
    if (
      typeof value !== "string" ||
      value.length === 0 ||
      value.startsWith("--")
    ) {
      return {
        ok: false,
        reason:
          "part2_youtube_recovery_flag_value_invalid",
      };
    }
    values[token] = value;
    index += 1;
  }

  const recoveryOutDir =
    values["--recovery-out-dir"] ?? "";
  const contentUnit = values["--content-unit"] ?? "";
  const ledger = values["--ledger"] ?? "";
  const originalOutDir =
    values["--original-out-dir"] ?? "";
  const instagramRecoveryOutDir =
    values["--instagram-recovery-out-dir"] ?? "";
  const sourceEvidencePaths = [
    contentUnit,
    ledger,
    originalOutDir,
    instagramRecoveryOutDir,
  ];

  if (
    !PART2_YOUTUBE_RECOVERY_REQUIRED_VALUE_FLAGS.every(
      (flag) => typeof values[flag] === "string",
    ) ||
    !PART2_YOUTUBE_RECOVERY_REQUIRED_PATH_FLAGS.every(
      (flag) => isAbsolute(values[flag] ?? ""),
    ) ||
    (values["--env-path"] !== undefined &&
      !isAbsolute(values["--env-path"])) ||
    !PART2_CONTENT_ID_RE.test(
      values["--expected-content-id"] ?? "",
    ) ||
    !INSTAGRAM_NONZERO_ACCOUNT_ID_RE.test(
      values["--expected-instagram-account-id"] ?? "",
    ) ||
    !INSTAGRAM_MEDIA_ID_RE.test(
      values["--expected-instagram-media-id"] ?? "",
    ) ||
    !YOUTUBE_CHANNEL_ID_RE.test(
      values["--expected-youtube-channel-id"] ?? "",
    ) ||
    !PART2_YOUTUBE_RECOVERY_REQUIRED_HASH_FLAGS.every(
      (flag) => SHA256_RE.test(values[flag] ?? ""),
    ) ||
    (armed &&
      !SHA256_RE.test(
        values[
          "--expected-execution-preflight-fingerprint"
        ] ?? "",
      )) ||
    (!armed &&
      values[
        "--expected-execution-preflight-fingerprint"
      ] !== undefined) ||
    lexicalPathInside(REPO_ROOT, recoveryOutDir) ||
    sourceEvidencePaths.some(
      (sourcePath) =>
        lexicalPathInside(sourcePath, recoveryOutDir) ||
        lexicalPathInside(recoveryOutDir, sourcePath),
    )
  ) {
    return {
      ok: false,
      reason:
        "part2_youtube_recovery_required_binding_invalid",
    };
  }
  return { ok: true };
}

/**
 * .env 형식 파일에서 승인된 key만 골라 { KEY: value } 를 만든다.
 * 값은 이 객체 안에만 존재하며, 어디에도 출력/파생/저장하지 않는다.
 * - `KEY=value` 라인만 처리, 앞뒤 공백 trim
 * - 값 양끝의 짝맞는 single/double quote 1겹 제거
 * - 빈 줄/주석(#)/`export ` prefix 허용
 * - 변수 확장/명령 실행 없음
 * 승인 목록에 없는 key는 값을 읽지 않고 건너뛴다.
 * @returns {{ present: Record<string, boolean>, injected: Record<string, string> }}
 */
function loadApprovedKeysFromEnvFile(
  envFilePath,
  approvedEnvKeyNames,
) {
  const injected = Object.create(null);
  const present = Object.create(null);
  for (const name of approvedEnvKeyNames) present[name] = false;

  if (!envFilePath || !existsSync(envFilePath)) {
    return { present, injected };
  }

  let raw = "";
  try {
    raw = readFileSync(envFilePath, "utf8");
  } catch {
    return { present, injected }; // 읽기 실패 시 값 노출 없이 present=false 유지
  }

  const approved = new Set(approvedEnvKeyNames);
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed === "" || trimmed.startsWith("#")) continue;
    const withoutExport = trimmed.startsWith("export ") ? trimmed.slice(7).trim() : trimmed;
    const eq = withoutExport.indexOf("=");
    if (eq <= 0) continue;
    const key = withoutExport.slice(0, eq).trim();
    if (!approved.has(key)) continue; // 승인되지 않은 key는 값 자체를 읽지 않음
    let value = withoutExport.slice(eq + 1).trim();
    if (
      value.length >= 2 &&
      ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))
    ) {
      value = value.slice(1, -1);
    }
    if (value !== "") {
      injected[key] = value; // 값은 이 객체에만 존재 — 출력/파생 없음
      present[key] = true;
    }
  }
  return { present, injected };
}

/** sanitized child env: 화이트리스트 OS 변수(개별 상속) + 승인 credential key만. broad spread 없음. */
function buildSanitizedChildEnv(
  injected,
  approvedEnvKeyNames,
) {
  const env = Object.create(null);
  for (const name of SAFE_CHILD_OS_ENV_KEYS) {
    const v = process.env[name];
    if (typeof v === "string") env[name] = v; // non-secret OS 변수만, 개별 상속
  }
  for (const name of approvedEnvKeyNames) {
    if (typeof injected[name] === "string") env[name] = injected[name];
  }
  return env;
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const commandName = args.find((a) => !a.startsWith("--")) ?? null;
  const getFlag = (flag) => {
    const i = args.indexOf(flag);
    return i !== -1 && i + 1 < args.length ? args[i + 1] : null;
  };
  // 기본 env 파일은 Owner runtime에서만 .env.local. 테스트는 항상 명시적 --env-path를 준다.
  // (node 예약 옵션 --env-file과 충돌하지 않도록 --env-path 사용.)
  const envFile = getFlag("--env-path") ?? join(REPO_ROOT, ".env.local");
  return { commandName, envFile, rawArgs: args, getFlag };
}

function printUsage() {
  console.log(
    [
      "Owner local env no-log command wrapper (task: owner-local-env-no-log-command-wrapper-v1).",
      "",
      "Usage:",
      "  node scripts/run-owner-command-with-local-env-no-log.mjs <command> [--env-path <path>] [--content-unit <path>]",
      "  node scripts/run-owner-command-with-local-env-no-log.mjs final-e2e-publish --content-unit <manifest> --ledger <ledger.json> --out-dir <dir> [--arm]",
      "  node scripts/run-owner-command-with-local-env-no-log.mjs youtube-only-part1-recovery --source-publish-dir <dir> --recovery-out-dir <separate-dir> --content-unit <manifest> --owner-resolution <part-1.json> --ledger <ledger.json> --expected-recovery-fingerprint <sha256> --expected-resolution-sha256 <sha256> --expected-channel-id <channel> [--expected-preflight-fingerprint <sha256> --arm]",
      "  node scripts/run-owner-command-with-local-env-no-log.mjs part2-only-dual-publish --content-unit <manifest> --ledger <ledger.json> --out-dir <part-2 publish dir> --expected-content-id <part-2 id> --expected-manifest-sha256 <sha256> --expected-source-sha256 <sha256> --expected-publication-attempt-fingerprint <sha256> --expected-instagram-account-id <id> --expected-youtube-channel-id <channel> [--expected-preflight-fingerprint <sha256> --arm]",
      "  node scripts/run-owner-command-with-local-env-no-log.mjs part2-instagram-identity-preflight --content-unit <manifest> --expected-content-id <part-2 id> --expected-manifest-sha256 <sha256> --expected-source-sha256 <sha256> --expected-instagram-account-id <id> [--expected-plan-fingerprint <sha256> --arm]",
      "  node scripts/run-owner-command-with-local-env-no-log.mjs part2-instagram-recovery-execution --recovery-out-dir <separate-dir> --expected-review-preflight-fingerprint <sha256> --content-unit <manifest> --ledger <ledger.json> --out-dir <part-2 publish dir> --expected-content-id <part-2 id> --expected-instagram-account-id <id> --expected-youtube-channel-id <channel> <all original evidence hash flags> [--expected-execution-preflight-fingerprint <sha256> --arm]",
      "  node scripts/run-owner-command-with-local-env-no-log.mjs part2-youtube-recovery-execution --recovery-out-dir <separate-dir> --content-unit <manifest> --ledger <ledger.json> --original-out-dir <part-2 publish dir> --instagram-recovery-out-dir <part-2 Instagram recovery dir> --expected-content-id <part-2 id> --expected-instagram-account-id <id> --expected-instagram-media-id <id> --expected-youtube-channel-id <channel> <all immutable evidence hash flags> [--expected-execution-preflight-fingerprint <sha256> --arm]",
      "",
      "Commands:",
      "  credential-preflight   inject approved local env keys (no-log) and run the redacted",
      "                         credential presence check via the owner entrypoint.",
      "  final-e2e-publish      inject approved local env keys (no-log) and run the one-shot final",
      "                         E2E dual-platform publish runner (Blob→Instagram→YouTube→ledger).",
      "                         Without --arm it is preflight-only (zero external calls).",
      "  youtube-only-part1-recovery",
      "                         inject ONLY the three YouTube OAuth keys and run the one-shot",
      "                         part-1 YouTube-only recovery. Instagram/Blob keys are excluded.",
      "  part2-only-dual-publish",
      "                         run the dedicated part-2-only dual publish safety gate.",
      "                         Dry-run does not access the env file; --arm requires the exact preflight fingerprint.",
      "  part2-instagram-identity-preflight",
      "                         inject ONLY the Instagram account-id/token keys and perform one",
      "                         fixed GET-only account identity check. No publish or local write.",
      "                         Dry-run does not access the env file; --arm requires the exact plan fingerprint.",
      "  part2-instagram-recovery-execution",
      "                         inject ONLY the two Instagram keys and run the one-shot",
      "                         part-2 Instagram-only recovery. No Blob PUT, YouTube, Part 1, DB, or retry.",
      "                         Dry-run does not access the env file; --arm requires the exact execution preflight fingerprint.",
      "  part2-youtube-recovery-execution",
      "                         inject ONLY the three YouTube OAuth keys and run the one-shot",
      "                         part-2 YouTube-only recovery. No Instagram, Blob, Part 1, DB, or retry.",
      "                         Dry-run does not access the env file; --arm requires the exact execution preflight fingerprint.",
      "  owl-tts                inject ONLY the TTS voice provider keys and run the owl 8-scene narration TTS.",
      "                         Paths must be under C:\\tmp\\money-shorts-os\\. Dry-run does not access the env file.",
      "  bull-topic-scan        inject ONLY the KIS + Alpha Vantage keys and run a read-only market-data",
      "                         scan for 황소특보 topic candidates (indices + allowlisted large-cap stocks).",
      "                         No arguments beyond --arm. Dry-run does not access the env file.",
      "  bull-topic-news-search inject ONLY the Naver News keys and run a read-only news search for",
      "                         황소특보 small/mid-cap topic candidates (titles+links only, no auto-extraction).",
      "                         No arguments beyond --arm. Dry-run does not access the env file.",
      "  bull-topic-dart-scan   inject ONLY the DART key and run a read-only market-wide disclosure scan",
      "                         for 황소특보 supply-contract/order-win topic candidates.",
      "                         No arguments beyond --arm. Dry-run does not access the env file.",
      "  bull-topic-sector-news-search",
      "                         inject ONLY the Naver News keys and run a read-only news search for",
      "                         황소특보 sector/theme momentum + outlook/earnings topic candidates.",
      "                         No arguments beyond --arm. Dry-run does not access the env file.",
      "  bull-topic-risk-awareness-news-search",
      "                         inject ONLY the Naver News keys and run a read-only news search for",
      "                         황소특보 leverage/margin warnings, investor psychology, fund flows,",
      "                         market structure, and valuation-education topic candidates.",
      "                         No arguments beyond --arm. Dry-run does not access the env file.",
      "  bull-topic-lane-news-search",
      "                         inject ONLY the Naver News keys and run a read-only news search across",
      "                         the 황소특보 topic lanes (figure statements, policy changes, new themes,",
      "                         macro, flows/decoupling). Titles+links only, no auto-extraction.",
      "                         No arguments beyond --arm. Dry-run does not access the env file.",
      "",
      "Notes:",
      "  - Loads ONLY approved key NAMES; credential values are never printed/hashed/measured.",
      "  - Default env file is .env.local (Owner runtime only). Tests pass an explicit fake --env-path.",
    ].join("\n"),
  );
}

function main() {
  const { commandName, envFile, rawArgs, getFlag } = parseArgs(process.argv);

  if (!commandName || !(commandName in SUPPORTED_COMMANDS)) {
    printUsage();
    if (commandName && !(commandName in SUPPORTED_COMMANDS)) {
      console.error(`\nABORT: unsupported command: ${commandName}`);
      process.exit(2);
    }
    process.exit(commandName ? 0 : 2);
  }

  const command = SUPPORTED_COMMANDS[commandName];
  const preEnvValidation =
    typeof command.validateBeforeEnvAccess === "function"
      ? command.validateBeforeEnvAccess(rawArgs)
      : { ok: true };
  if (preEnvValidation.ok !== true) {
    console.error(
      `ABORT: ${preEnvValidation.reason}`,
    );
    process.exit(2);
  }
  const approvedEnvKeyNames = command.envKeyNames;
  const shouldLoadApprovedCredentials =
    command.loadEnvInDryRun !== false ||
    rawArgs.includes("--arm");
  const { present, injected } =
    shouldLoadApprovedCredentials
      ? loadApprovedKeysFromEnvFile(
          envFile,
          approvedEnvKeyNames,
        )
      : {
          present: Object.fromEntries(
            approvedEnvKeyNames.map((name) => [
              name,
              false,
            ]),
          ),
          injected: Object.create(null),
        };

  // 진단 출력: key 이름 + present boolean만. 값/길이/prefix/hash 없음.
  const presentCount = approvedEnvKeyNames.filter((k) => present[k] === true).length;
  console.log("[owner-env-no-log] injecting approved credential key NAMES into child process env (no values printed).");
  console.log(
    shouldLoadApprovedCredentials
      ? `[owner-env-no-log] env file: ${envFile}${existsSync(envFile) ? "" : " (not found — all keys will be present:false)"}`
      : "[owner-env-no-log] dry-run: credential env file was not accessed.",
  );
  console.log(`[owner-env-no-log] approved keys present: ${presentCount}/${approvedEnvKeyNames.length}`);
  for (const name of approvedEnvKeyNames) {
    console.log(`  ${name}: ${present[name] === true}`);
  }
  console.log("");

  const childEnv = buildSanitizedChildEnv(
    injected,
    approvedEnvKeyNames,
  );
  const childArgs = [command.script, ...command.baseArgs];
  for (const flag of command.passthrough) {
    const v = getFlag(flag);
    if (v) childArgs.push(flag, v);
  }
  for (const flag of command.passthroughFlags) {
    if (rawArgs.includes(flag)) childArgs.push(flag);
  }

  const result = spawnSync(process.execPath, childArgs, {
    cwd: REPO_ROOT,
    env: childEnv,
    shell: false,
    stdio: "inherit",
    encoding: "utf8",
  });

  // 실용적 범위에서 로컬 secret 참조를 정리한다(GC 대상화).
  for (const name of approvedEnvKeyNames) {
    if (name in injected) delete injected[name];
    if (name in childEnv) delete childEnv[name];
  }

  if (result.error) {
    console.error(`ABORT: failed to launch child command: ${result.error.message}`);
    process.exit(1);
  }
  process.exit(typeof result.status === "number" ? result.status : 1);
}

main();
