/**
 * owner-web-operator.ts — 웹 운영 콘솔(/money-shorts)이 호출하는 safe local control helper.
 *
 * task: owner-web-operator-ui-local-control-v1
 * task: owner-web-auto-topic-refresh-and-upload-button-v1 (확인 게이트형 실제 업로드)
 *
 * 이 모듈의 목적은 **이미 검증된 기존 automation 스크립트**를, 웹 버튼에서 안전하게 감싸는 것이다.
 * 대부분의 action은 no-live/preflight-only다. 유일한 예외는 `actualUpload`이며, 이것만
 * final E2E runner를 `--arm`으로 실행할 수 있다.
 *
 * 보안 계약(가드가 강제):
 * - 실행 가능한 명령은 buildOperatorCommand에 하드코딩된 것뿐이다. 임의 명령/셸 문자열 없음.
 * - spawnSync(process.execPath, argsArray, { shell:false }) 만 사용한다.
 * - `--live`는 어떤 경로로도 붙지 않는다.
 * - 실게시를 여는 `--arm`은 `actualUpload` 분기에서만 생성되고(ARM_ARG_TOKEN, 단일 지점),
 *   runOperatorScript는 호출자가 `allowArm:true`를 명시했을 때만 이를 통과시킨다(이중 방어).
 *   route는 Owner 확인 게이트(체크 2개 + "업로드" 입력) + 영상/게시 전 점검 evidence를
 *   서버에서 검증한 뒤에만 allowArm을 부여한다.
 * - `.env`/`.env.local` 등 secret 파일을 직접 읽지 않는다.
 * - child env는 승인된 6개 key만 전달하며, 값은 읽어서 전달만 하고 절대 출력/파생/저장하지 않는다.
 * - stdout/stderr는 반환 전 secret-shaped 토큰을 REDACTED로 치환한다.
 * - Vercel/production runtime에서는 로컬 스크립트 실행 action을 LOCAL_AUTOMATION_REQUIRES_LOCAL_DEV로 차단한다.
 */

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";

// ── 상수 ─────────────────────────────────────────────────────────────────────

/** 웹에서 호출 가능한 action enum. 이 목록 밖의 값은 전부 거부된다. */
export const OPERATOR_ACTIONS = [
  "status",
  "credentialPreflight",
  "readyPreflight",
  "readyDuplicateGuard",
  "finalE2ePreflight",
  // ── 자동 쇼츠 만들기 위저드 (task: owner-one-click-video-creation-ui-v1) ──
  "topicRecommend", // 로컬 topic bank 기반 새 주제 묶음 생성 (spawn 없음, 외부 API 없음)
  "scriptPreview", // 규칙 기반 대본 생성/미리보기 (spawn 없음, 읽기 전용)
  "voiceSample", // 선택 대본 기반 local_mock TTS 시안 생성 (무료, 외부 API 없음)
  "videoCreate", // 로컬 파이프라인 dry-run으로 시안 영상 생성 (업로드 없음)
  "previewStatus", // 생성된 시안 영상 파일 상태 확인 (spawn 없음, 읽기 전용)
  // ── 게시 전 점검 + 실제 업로드 (task: owner-web-auto-topic-refresh-and-upload-button-v1) ──
  "wizardPreflight", // 선택 주제로 만든 영상 기준 게시 전 점검 (--arm 없음, 외부 호출 0)
  "actualUpload", // Owner 명시 확인 후 실제 업로드 (final E2E runner --arm; 서버 confirm 게이트 필수)
  // ── 실제 제작 파이프라인 (task: owner-web-real-script-voice-visual-generation-pipeline-v1) ──
  // 아래 3개 create는 Owner가 로컬 웹 버튼을 눌렀을 때만 실행되는 live 생성 경로다(업로드 아님).
  // 키/세션 없으면 스크립트가 fail-closed로 종료하고, 산출물은 전부 C:\tmp 아래에만 쓴다.
  "realTtsCreate", // 확정 대본(script-final) 기반 ElevenLabs 고정 목소리 실제 TTS 생성
  "realSceneImagesCreate", // 대본 6장면 기반 ChatGPT+Playwright 실제 장면 이미지 생성
  "finalVideoCreate", // 실제 음성 + 실제 이미지 6장 + 자막 + 모션으로 최종 mp4 합성
  "realMediaStatus", // 실제 음성/이미지/최종 영상 준비 상태 + media quality gate (읽기 전용, spawn 없음)
] as const;

export type OperatorAction = (typeof OPERATOR_ACTIONS)[number];

/** child process에 전달 가능한 승인된 credential key 이름. 값은 여기 없다. */
export const APPROVED_ENV_KEY_NAMES = [
  "INSTAGRAM_BUSINESS_ACCOUNT_ID",
  "INSTAGRAM_ACCESS_TOKEN",
  "YOUTUBE_CLIENT_ID",
  "YOUTUBE_CLIENT_SECRET",
  "YOUTUBE_REFRESH_TOKEN",
  "BLOB_READ_WRITE_TOKEN",
] as const;

/**
 * 실제 미디어 생성(realTtsCreate) child에만 필요한 추가 key 이름. 값은 여기 없다.
 * Next dev 서버 런타임 process.env(.env.local 자동 로드)에서 개별 복사만 하며,
 * 로그/응답/summary 어디에도 값·길이·prefix·hash를 넣지 않는다.
 * (ANTHROPIC_API_KEY는 child에 전달하지 않는다 — Claude 보정은 서버 in-process fetch 전용.)
 */
export const MEDIA_ENV_KEY_NAMES = [
  "ELEVENLABS_API_KEY",
  "ELEVENLABS_VOICE_ID",
  "ELEVENLABS_MODEL_ID",
  "ELEVENLABS_VOICE_LABEL",
] as const;

/** node 실행에 필요한 non-secret OS 변수만 개별 상속(broad spread 금지). */
const SAFE_CHILD_OS_ENV_KEYS = [
  "SystemRoot",
  "windir",
  "SystemDrive",
  "PATH",
  "Path",
  "PATHEXT",
  "COMSPEC",
  "TEMP",
  "TMP",
  "HOME",
  "NUMBER_OF_PROCESSORS",
  "PROCESSOR_ARCHITECTURE",
] as const;

const SPAWN_TIMEOUT_MS = 120_000;
const MAX_OUTPUT_CHARS = 20_000;

export const LOCAL_ONLY_BLOCKER = "LOCAL_AUTOMATION_REQUIRES_LOCAL_DEV";

/** 이 helper가 실행할 수 있는 유일한 스크립트 목록(repo-relative, 하드코딩). */
const SCRIPT_ENTRYPOINT = "scripts/run-owner-daily-automation-entrypoint.mjs";
const SCRIPT_ORCHESTRATOR = "scripts/run-dual-platform-final-publish-orchestrator.mjs";
const SCRIPT_FINAL_E2E = "scripts/run-final-e2e-dual-platform-publish-once.mjs";
const SCRIPT_MOCK_TTS = "scripts/build-local-mock-tts-audio-from-script.mjs";
const SCRIPT_LOCAL_PIPELINE_DRY_RUN = "scripts/run-local-money-shorts-pipeline-dry-run.mjs";
// 실제 제작 파이프라인 — 검증된 기존 ElevenLabs scene-paced 스크립트를 재사용하고,
// 이미지/최종 영상은 wizard 전용 once 스크립트를 쓴다(전부 repo-relative 하드코딩).
const SCRIPT_ELEVENLABS_SCENE_TTS = "scripts/build-elevenlabs-scene-paced-tts-from-script.mjs";
const SCRIPT_REAL_SCENE_IMAGES = "scripts/run-owner-real-scene-images-from-wizard-script-once.mjs";
const SCRIPT_REAL_VIDEO = "scripts/run-owner-real-video-from-wizard-assets-once.mjs";

/**
 * 자동 쇼츠 만들기 위저드가 소비하는 로컬 fixture(repo-relative, 하드코딩, 읽기 전용).
 * 사용자 입력은 이 경로들에 절대 섞이지 않는다.
 */
const FIXTURE_TOPIC_REPORT = "scripts/fixtures/topic_candidate_report.v1.json";
const FIXTURE_SCRIPT_COMPILER_OUTPUT = "scripts/fixtures/money-shorts-retention-script-compiler.output.v1.json";

/**
 * 위저드 산출물 저장 위치(레포 밖 고정 경로, 하드코딩).
 * 파이프라인 스크립트 자체가 repo 안 out-dir을 거부하므로 이중 방어가 된다.
 */
export const WIZARD_VIDEO_OUT_ROOT = "C:\\tmp\\money-shorts-os\\web-wizard-create-v1";
export const WIZARD_VOICE_OUT_DIR = "C:\\tmp\\money-shorts-os\\web-wizard-voice-v1";

/** 위저드가 topic별로 생성하는 입력 JSON의 루트(레포 밖 고정). */
const WIZARD_INPUTS_ROOT = "C:\\tmp\\money-shorts-os\\web-wizard-create-v1\\inputs";

/** 클릭마다 생성한 주제 묶음을 누적 저장하는 로컬 카탈로그(레포 밖 고정). 대본/영상 단계가 여기서 주제를 되찾는다. */
const WIZARD_TOPIC_CATALOG_PATH = "C:\\tmp\\money-shorts-os\\web-wizard-create-v1\\topics\\wizard-topic-catalog.json";
/** 카테고리별 최근 노출 시드 기록 — "다른 주제 보기"가 순서만 섞지 않게 최근 것을 제외한다. */
const WIZARD_TOPIC_RECENT_PATH = "C:\\tmp\\money-shorts-os\\web-wizard-create-v1\\topics\\wizard-topic-recent-shown.json";

/**
 * 실제 게시 기록 원장(레포 밖 고정). 이전 실게시 기록(t2_salary_3days 등)이 들어 있는
 * canonical ledger이며, runner의 duplicate guard와 성공 기록이 모두 이 파일을 쓴다.
 */
const WIZARD_PUBLISH_LEDGER_PATH =
  "C:\\tmp\\money-shorts-os\\final-e2e-ready-content-unit-and-publish-one-v1\\publish-ledger.json";

/**
 * 이미 게시 완료된 evidence 콘텐츠 id — 어떤 경로로도 재업로드 금지(이중 방어).
 * runner 자체도 t1을 하드 차단하고, ledger duplicate guard가 t2를 차단하지만 여기서 한 번 더 막는다.
 */
export const BLOCKED_PUBLISHED_CONTENT_IDS = ["t1_lifestyle_inflation", "t2_salary_3days"] as const;

/** 위저드 시안 영상 스트리밍이 허용되는 유일한 경로 prefix. */
const WIZARD_VIDEO_ALLOWED_PREFIX = "C:\\tmp\\money-shorts-os\\";

/**
 * final E2E runner의 gate 1을 통과하기 위한 승인 문구. 이것은 secret이 아니라
 * Owner 승인 문자열이며, 이 문구만으로는 아무것도 게시되지 않는다.
 * runner에서 **실제 게시 경로를 여는 유일한 인자는 `--arm`**이다.
 * (`--arm` 없으면 runner는 gate 9에서 PREFLIGHT_ONLY_OK로 종료한다 — wizardPreflight가 이 모드다.)
 */
const FINAL_E2E_PREFLIGHT_APPROVAL = "APPROVE_FINAL_E2E_AUTOMATION_PUBLISH_ONE_NEW_CONTENT_UNIT";

/**
 * 절대 인자에 등장해서는 안 되는 토큰. 실행 직전 한 번 더 검사한다(이중 방어).
 */
const FORBIDDEN_ARG_TOKENS = ["--live"] as const;

/**
 * 실제 게시를 여는 유일한 인자. buildOperatorCommand의 `actualUpload` 분기에서만 생성되고,
 * runOperatorScript는 호출자가 `allowArm: true`를 명시했을 때만 이 인자를 통과시킨다.
 * (route는 Owner 확인 게이트(체크 2개 + "업로드" 입력)를 통과한 actualUpload에서만 allowArm을 준다.)
 */
const ARM_ARG_TOKEN = "--arm";

// ── 런타임 판별 ───────────────────────────────────────────────────────────────

/**
 * 로컬 dev runtime인지 판정한다. Vercel(또는 production build)에서는 로컬 `C:\tmp` 파일과
 * 로컬 스크립트를 신뢰할 수 없으므로 스크립트 실행 action을 차단한다.
 * env 값을 읽지만 credential이 아닌 플랫폼 표식만 사용하며, 값 자체를 반환하지 않는다.
 */
export function isLocalDevRuntime(): boolean {
  if (process.env.VERCEL === "1" || typeof process.env.VERCEL_ENV === "string") return false;
  return process.env.NODE_ENV !== "production";
}

/** repo root. Next.js 서버 프로세스의 cwd가 repo root다. */
export function getRepoRoot(): string {
  return process.cwd();
}

// ── secret-safe 출력 처리 ─────────────────────────────────────────────────────

/**
 * child 출력에서 secret-shaped 값을 제거한다. 스크립트들은 이미 값을 출력하지 않지만,
 * 웹으로 나가는 경로이므로 방어적으로 한 번 더 치환한다.
 */
export function sanitizeOutput(text: string): string {
  return String(text ?? "")
    .replace(/access_token=[^&\s"']+/gi, "access_token=REDACTED")
    .replace(/EAA[A-Za-z0-9]{8,}/g, "REDACTED_TOKEN")
    .replace(/ya29\.[A-Za-z0-9_-]{8,}/g, "REDACTED_TOKEN")
    .replace(/vercel_blob_rw_[A-Za-z0-9_]{8,}/g, "REDACTED_TOKEN")
    .replace(/GOCSPX-[A-Za-z0-9_-]+/g, "REDACTED_TOKEN")
    .replace(/"(client_secret|refresh_token|access_token|clientSecret|refreshToken)"\s*:\s*"[^"]*"/gi, '"$1":"REDACTED"')
    .slice(0, MAX_OUTPUT_CHARS);
}

/**
 * 스크립트 stdout에서 첫 번째 최상위 JSON 오브젝트를 뽑는다.
 * (entrypoint는 배너 텍스트 + JSON을 함께 출력하므로 그대로 JSON.parse할 수 없다.)
 */
export function extractFirstJsonObject(stdout: string): unknown | null {
  const start = stdout.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < stdout.length; i += 1) {
    const ch = stdout[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "{") depth += 1;
    else if (ch === "}") {
      depth -= 1;
      if (depth === 0) {
        try {
          return JSON.parse(stdout.slice(start, i + 1));
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

/**
 * final E2E runner가 `--arm` 없이 실행됐을 때 out-dir에 남기는 preflight 결과 파일명.
 * (armed 실행의 `final-e2e-publish-result.json`과 다른 파일이며, 이 helper는 armed를 실행하지 않는다.)
 */
export const FINAL_E2E_PREFLIGHT_RESULT_FILENAME = "final-e2e-publish-preflight.json";

/**
 * runner는 result를 stdout이 아니라 out-dir 파일에 쓴다(stdout에는 경로만 출력).
 * 그래서 preflight 판정을 위해 그 파일을 읽는다. 이 파일은 runner가 secret-free로 보장하며,
 * 방어적으로 sanitize를 한 번 더 통과시킨다.
 */
export function readFinalE2ePreflightResult(outDir: string): unknown | null {
  const p = join(outDir, FINAL_E2E_PREFLIGHT_RESULT_FILENAME);
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(sanitizeOutput(readFileSync(p, "utf8")));
  } catch {
    return null;
  }
}

// ── child env (승인된 key만) ──────────────────────────────────────────────────

/**
 * 승인된 6개 credential key의 **존재 여부만** 반환한다. 값/길이/prefix/hash 없음.
 */
export function readCredentialPresence(): Record<string, boolean> {
  const presence: Record<string, boolean> = {};
  for (const name of APPROVED_ENV_KEY_NAMES) {
    const v = process.env[name];
    presence[name] = typeof v === "string" && v !== "";
  }
  return presence;
}

/**
 * child process env를 구성한다. parent env broad spread 없이,
 * non-secret OS 변수 화이트리스트 + 승인된 credential key 6개만 개별 복사한다.
 * 값은 이 객체 안에만 존재하며 로그/반환값에 절대 넣지 않는다.
 *
 * `includeMediaEnv === true`일 때만 `MEDIA_ENV_KEY_NAMES`(ELEVENLABS 4키)를 추가 복사한다.
 * 기본값은 false — 실제 TTS 생성(realTtsCreate) child에만 전달되고, 이미지/영상/게시 전 점검/
 * 실제 업로드 등 다른 어떤 child에도 ELEVENLABS 키가 들어가지 않는다.
 */
function buildSanitizedChildEnv(opts?: { includeMediaEnv?: boolean }): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = Object.create(null);
  for (const name of SAFE_CHILD_OS_ENV_KEYS) {
    const v = process.env[name];
    if (typeof v === "string") env[name] = v;
  }
  for (const name of APPROVED_ENV_KEY_NAMES) {
    const v = process.env[name];
    if (typeof v === "string" && v !== "") env[name] = v;
  }
  // 실제 TTS 생성 child에만 전달하는 미디어 key(이름 고정 allowlist). 값은 child env에만 존재한다.
  if (opts?.includeMediaEnv === true) {
    for (const name of MEDIA_ENV_KEY_NAMES) {
      const v = process.env[name];
      if (typeof v === "string" && v !== "") env[name] = v;
    }
  }
  return env;
}

// ── 경로 검증 ────────────────────────────────────────────────────────────────

/**
 * finalE2ePreflight가 받는 3개 경로를 검증한다.
 * - 절대 경로만 허용(상대 경로/셸 메타문자 차단)
 * - 인자로 넘어갈 문자열에 `--` 접두 옵션이나 null byte가 없어야 한다
 */
export function validateOperatorPath(value: unknown, label: string): { ok: true; path: string } | { ok: false; reason: string } {
  if (typeof value !== "string" || value.trim() === "") {
    return { ok: false, reason: `${label}_missing` };
  }
  const raw = value.trim();
  if (raw.includes("\0")) return { ok: false, reason: `${label}_invalid_null_byte` };
  if (raw.startsWith("-")) return { ok: false, reason: `${label}_must_not_start_with_dash` };
  if (!isAbsolute(raw)) return { ok: false, reason: `${label}_must_be_absolute_path` };
  return { ok: true, path: raw };
}

// ── action → 명령 매핑(하드코딩) ──────────────────────────────────────────────

export type OperatorCommand = { script: string; args: string[] };

/**
 * action별 실행 명령을 만든다. 스크립트 경로와 인자는 전부 하드코딩되며,
 * 사용자 입력은 finalE2ePreflight의 3개 경로(검증 통과분)만 값으로 들어간다.
 * `--arm`은 어떤 분기에서도 추가되지 않는다.
 */
export function buildOperatorCommand(
  action: OperatorAction,
  input?: { contentUnitPath?: string; ledgerPath?: string; outDir?: string; topicId?: string },
): { ok: true; command: OperatorCommand } | { ok: false; reason: string } {
  switch (action) {
    case "credentialPreflight":
      return { ok: true, command: { script: SCRIPT_ENTRYPOINT, args: ["--credential-preflight"] } };

    case "readyPreflight":
    case "readyDuplicateGuard":
      // 둘 다 default evidence content unit에 대한 no-live preflight를 읽는다.
      // (readyDuplicateGuard는 같은 결과의 duplicatePublishReference를 해석해 보여준다.)
      return { ok: true, command: { script: SCRIPT_ORCHESTRATOR, args: ["--preflight"] } };

    case "finalE2ePreflight": {
      const cu = validateOperatorPath(input?.contentUnitPath, "contentUnitPath");
      if (!cu.ok) return { ok: false, reason: cu.reason };
      const ld = validateOperatorPath(input?.ledgerPath, "ledgerPath");
      if (!ld.ok) return { ok: false, reason: ld.reason };
      const od = validateOperatorPath(input?.outDir, "outDir");
      if (!od.ok) return { ok: false, reason: od.reason };
      if (!existsSync(cu.path)) return { ok: false, reason: "contentUnitPath_not_found" };
      // --arm 없음 → runner gate 9에서 PREFLIGHT_ONLY_OK로 종료(외부 호출 0).
      return {
        ok: true,
        command: {
          script: SCRIPT_FINAL_E2E,
          args: [
            "--approval",
            FINAL_E2E_PREFLIGHT_APPROVAL,
            "--content-unit",
            cu.path,
            "--ledger",
            ld.path,
            "--out-dir",
            od.path,
          ],
        },
      };
    }

    case "voiceSample": {
      // local_mock TTS: 선택 주제의 대본으로 생성한 tts script를 입력으로 쓴다(실제 음성 아님, 외부 API 0).
      // 경로는 전부 safeSlug 기반 repo 밖 절대경로 — 사용자 입력 원문은 args에 들어가지 않는다.
      const builtVoice = buildWizardVideoInputsForTopic(input?.topicId ?? "");
      if (!builtVoice.ok) return { ok: false, reason: builtVoice.reason };
      return {
        ok: true,
        command: {
          script: SCRIPT_MOCK_TTS,
          args: [
            "--tts-script",
            builtVoice.paths.ttsScriptPath,
            "--out-dir",
            join(WIZARD_VOICE_OUT_DIR, builtVoice.paths.safeSlug),
          ],
        },
      };
    }

    case "videoCreate": {
      // 선택 주제(topicId)의 대본으로 topic-specific 입력 4종을 repo 밖에 생성하고,
      // 그 생성 파일로 로컬 파이프라인 dry-run을 돌린다. 고정 base-rate fixture를 쓰지 않는다.
      // topicId가 없거나 대본이 없으면 fail-closed(다른 주제로 몰래 만들지 않는다).
      const built = buildWizardVideoInputsForTopic(input?.topicId ?? "");
      if (!built.ok) return { ok: false, reason: built.reason };
      const p = built.paths;
      // 생성 경로는 전부 safeSlug 기반 repo 밖 절대경로 — 사용자 입력 원문은 args에 들어가지 않는다.
      return {
        ok: true,
        command: {
          script: SCRIPT_LOCAL_PIPELINE_DRY_RUN,
          args: [
            "--manifest",
            p.manifestPath,
            "--tts-script",
            p.ttsScriptPath,
            "--upload-metadata",
            p.uploadMetadataPath,
            "--owner-approval",
            p.ownerApprovalPath,
            "--out-root",
            p.outRoot,
          ],
        },
      };
    }

    case "wizardPreflight": {
      // 선택 주제로 만든 시안 영상 기준 게시 전 점검 — final E2E runner를 --arm 없이 실행한다.
      // runner는 gate 9에서 PREFLIGHT_ONLY_OK로 종료하며 외부 호출이 0이다.
      const builtUnit = buildWizardContentUnitForTopic(input?.topicId ?? "");
      if (!builtUnit.ok) return { ok: false, reason: builtUnit.reason };
      return {
        ok: true,
        command: {
          script: SCRIPT_FINAL_E2E,
          args: [
            "--approval",
            FINAL_E2E_PREFLIGHT_APPROVAL,
            "--content-unit",
            builtUnit.paths.contentUnitPath,
            "--ledger",
            builtUnit.paths.ledgerPath,
            "--out-dir",
            builtUnit.paths.publishOutDir,
          ],
        },
      };
    }

    case "actualUpload": {
      // 실제 업로드 — 유일하게 ARM_ARG_TOKEN(--arm)이 붙는 분기.
      // route가 Owner 확인 게이트(체크 2개 + "업로드" 입력)를 서버에서 검증한 뒤에만 도달하고,
      // 실행은 runOperatorScript의 allowArm 게이트를 한 번 더 통과해야 한다.
      const builtUnit = buildWizardContentUnitForTopic(input?.topicId ?? "");
      if (!builtUnit.ok) return { ok: false, reason: builtUnit.reason };
      if ((BLOCKED_PUBLISHED_CONTENT_IDS as readonly string[]).includes(builtUnit.paths.contentId)) {
        return { ok: false, reason: "content_already_published_evidence" };
      }
      // 게시 전 점검 통과 evidence가 같은 content unit에 대해 존재해야 한다(fail-closed).
      const pf = readWizardPublishPreflight(input?.topicId ?? "");
      if (
        !pf ||
        pf.status !== "PREFLIGHT_ONLY_OK" ||
        pf.contentUnitManifestPath !== resolve(builtUnit.paths.contentUnitPath)
      ) {
        return { ok: false, reason: "preflight_evidence_missing" };
      }
      return {
        ok: true,
        command: {
          script: SCRIPT_FINAL_E2E,
          args: [
            "--approval",
            FINAL_E2E_PREFLIGHT_APPROVAL,
            "--content-unit",
            builtUnit.paths.contentUnitPath,
            "--ledger",
            builtUnit.paths.ledgerPath,
            "--out-dir",
            builtUnit.paths.publishOutDir,
            ARM_ARG_TOKEN,
          ],
        },
      };
    }

    case "realTtsCreate": {
      // 확정 대본(script-final) 기반 실제 ElevenLabs TTS — 검증된 scene-paced 스크립트 재사용.
      // 대본이 확정(대본 만들기 클릭)되지 않았으면 fail-closed. --arm/upload 인자 없음.
      const real = buildWizardRealPipelineInputs(input?.topicId ?? "");
      if (!real.ok) return { ok: false, reason: real.reason };
      return {
        ok: true,
        command: {
          script: SCRIPT_ELEVENLABS_SCENE_TTS,
          args: ["--tts-script", real.paths.realTtsScriptPath, "--out-dir", real.paths.ttsOutDir],
        },
      };
    }

    case "realSceneImagesCreate": {
      // 대본 6장면 기준 실제 장면 이미지 생성(ChatGPT+Playwright). 대본 확정 전이면 fail-closed.
      const real = buildWizardRealPipelineInputs(input?.topicId ?? "");
      if (!real.ok) return { ok: false, reason: real.reason };
      return {
        ok: true,
        command: {
          script: SCRIPT_REAL_SCENE_IMAGES,
          args: ["--script", real.paths.scriptFinalPath, "--out-dir", real.paths.imagesOutDir],
        },
      };
    }

    case "finalVideoCreate": {
      // 실제 음성 + 실제 이미지 6장이 모두 준비된 뒤에만 최종 mp4 합성을 허용한다(fail-closed).
      const real = buildWizardRealPipelineInputs(input?.topicId ?? "");
      if (!real.ok) return { ok: false, reason: real.reason };
      const media = readWizardRealMediaState(input?.topicId ?? "");
      if (!media.realTts.ready) return { ok: false, reason: "real_tts_required" };
      if (!media.realImages.ready) return { ok: false, reason: "real_scene_images_required" };
      return {
        ok: true,
        command: {
          script: SCRIPT_REAL_VIDEO,
          args: [
            "--script",
            real.paths.scriptFinalPath,
            "--tts-script",
            real.paths.realTtsScriptPath,
            "--audio-summary",
            real.paths.ttsSummaryPath,
            "--images-dir",
            real.paths.imagesOutDir,
            "--out-dir",
            real.paths.videoOutDir,
          ],
        },
      };
    }

    case "status":
    case "topicRecommend":
    case "scriptPreview":
    case "previewStatus":
    case "realMediaStatus":
      // 읽기 전용 action — 스크립트를 실행하지 않는다.
      return { ok: false, reason: "read_only_action_runs_no_script" };

    default:
      return { ok: false, reason: "unsupported_action" };
  }
}

// ── 실행 ─────────────────────────────────────────────────────────────────────

export type OperatorRunResult = {
  ran: boolean;
  exitCode: number | null;
  stdout: string;
  stderr: string;
  json: unknown | null;
  timedOut: boolean;
};

/**
 * 하드코딩된 스크립트를 spawnSync로 실행한다.
 * shell:false, args 배열, timeout, cwd=repo root, sanitized child env, sanitized output.
 *
 * `--arm`(실제 게시)은 opts.allowArm === true 인 호출에서만 통과한다. route는 Owner 확인
 * 게이트를 통과한 `actualUpload`에서만 allowArm을 넘기므로, 다른 어떤 action도 실게시 인자를
 * 실행에 실어 보낼 수 없다(이중 방어).
 */
export function runOperatorScript(
  command: OperatorCommand,
  opts?: {
    allowArm?: boolean;
    timeoutMs?: number;
    /**
     * child env에 추가하는 non-secret 실행 마커(예: ALLOW_CHATGPT_IMAGE="1").
     * route가 action별로 하드코딩한 값만 넘긴다 — 사용자 입력/secret 값 금지.
     */
    extraEnv?: Record<string, string>;
    /**
     * true일 때만 ELEVENLABS 미디어 key를 child env에 전달한다(기본 false).
     * route는 실제 TTS 생성(realTtsCreate)에서만 true를 넘긴다.
     */
    includeMediaEnv?: boolean;
  },
): OperatorRunResult {
  const repoRoot = getRepoRoot();
  const scriptAbs = resolve(join(repoRoot, command.script));

  // 이중 방어: 실행 직전 금지 토큰 재검사.
  for (const arg of command.args) {
    for (const forbidden of FORBIDDEN_ARG_TOKENS) {
      if (arg === forbidden) {
        return { ran: false, exitCode: null, stdout: "", stderr: `forbidden_arg:${forbidden}`, json: null, timedOut: false };
      }
    }
    if (arg === ARM_ARG_TOKEN && opts?.allowArm !== true) {
      return { ran: false, exitCode: null, stdout: "", stderr: "forbidden_arg:--arm_without_confirmation", json: null, timedOut: false };
    }
  }
  if (!existsSync(scriptAbs)) {
    return { ran: false, exitCode: null, stdout: "", stderr: "script_not_found", json: null, timedOut: false };
  }

  const childEnv = buildSanitizedChildEnv({ includeMediaEnv: opts?.includeMediaEnv === true });
  for (const [k, v] of Object.entries(opts?.extraEnv ?? {})) childEnv[k] = v;

  const result = spawnSync(process.execPath, [scriptAbs, ...command.args], {
    cwd: repoRoot,
    env: childEnv,
    shell: false,
    timeout: opts?.timeoutMs ?? SPAWN_TIMEOUT_MS,
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024,
  });

  const stdout = sanitizeOutput(result.stdout ?? "");
  const stderr = sanitizeOutput(result.stderr ?? "");
  return {
    ran: true,
    exitCode: typeof result.status === "number" ? result.status : null,
    stdout,
    stderr,
    json: extractFirstJsonObject(stdout),
    timedOut: result.error != null && (result.error as NodeJS.ErrnoException).code === "ETIMEDOUT",
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// 자동 쇼츠 만들기 위저드 — 읽기 전용 데이터 (fixture/산출물 소비, spawn 없음)
// ══════════════════════════════════════════════════════════════════════════════

function readRepoJson(relPath: string): unknown | null {
  const p = resolve(join(getRepoRoot(), relPath));
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

function readAbsJson(absPath: string): unknown | null {
  if (!existsSync(absPath)) return null;
  try {
    return JSON.parse(readFileSync(absPath, "utf8"));
  } catch {
    return null;
  }
}

function fileBytes(absPath: string): number | null {
  try {
    return existsSync(absPath) ? statSync(absPath).size : null;
  } catch {
    return null;
  }
}

export type WizardTopic = {
  topicId: string;
  title: string;
  hook: string;
  reason: string;
  /** true면 규칙 기반 대본 엔진 결과가 이미 로컬에 있다(대본 만들기 즉시 가능). */
  scriptReady: boolean;
  recommended: boolean;
  /** 생성 주제의 카테고리 id(8개 중 하나). fixture 유래 주제는 없을 수 있다. */
  category?: string;
  /** 생성 주제의 훅 유형(반전/숫자/실수/루틴/심리/꿀팁). */
  angle?: string;
  /** 로컬 품질 평가 종합 점수(0~100). 품질 필터를 통과한 후보만 화면에 온다. */
  qualityScore?: number;
  /** 재작성으로 고친 부분(있으면 "다듬음" 배지 표시용). */
  rewrittenReasons?: string[];
};

/**
 * 주제 추천 카탈로그. 두 로컬 소스를 합친다(모두 repo fixture, 읽기 전용):
 * 1) 규칙 기반 대본 컴파일러 output — 대본까지 이미 준비된 주제
 * 2) topic candidate report — 검증된 주제 후보 풀(대본 엔진 연결 전)
 */
export function readTopicCatalog(): WizardTopic[] | null {
  const compiled = readRepoJson(FIXTURE_SCRIPT_COMPILER_OUTPUT) as {
    topics?: Array<{
      topicId?: string;
      selectedCandidateId?: string;
      candidates?: Array<{
        candidateId?: string;
        selectedHookText?: string;
        script?: { topic?: string; angle?: string };
      }>;
    }>;
  } | null;
  const report = readRepoJson(FIXTURE_TOPIC_REPORT) as {
    candidates?: Array<{
      topic_id?: string;
      title?: string;
      core_hook?: string;
      why_people_care?: string;
    }>;
    recommended?: Array<{ topic_id?: string }>;
  } | null;

  if (!compiled && !report) return null;

  const topics: WizardTopic[] = [];

  for (const t of compiled?.topics ?? []) {
    const cand = (t.candidates ?? []).find((c) => c.candidateId === t.selectedCandidateId) ?? (t.candidates ?? [])[0];
    if (!t.topicId || !cand?.script?.topic) continue;
    topics.push({
      topicId: t.topicId,
      title: cand.script.topic,
      hook: cand.selectedHookText ?? "",
      reason: cand.script.angle ?? "",
      scriptReady: true,
      recommended: false,
    });
  }

  const recommendedIds = new Set((report?.recommended ?? []).map((r) => r.topic_id).filter(Boolean));
  for (const c of report?.candidates ?? []) {
    if (!c.topic_id || !c.title) continue;
    topics.push({
      topicId: c.topic_id,
      title: c.title,
      hook: c.core_hook ?? "",
      reason: c.why_people_care ?? "",
      scriptReady: false,
      recommended: recommendedIds.has(c.topic_id),
    });
  }

  return topics.length > 0 ? topics : null;
}

// ══════════════════════════════════════════════════════════════════════════════
// 새 주제 추천 — 로컬 topic bank 기반 생성 (외부 API 0, 클릭마다 새 묶음)
// task: owner-web-auto-topic-refresh-and-upload-button-v1
// ══════════════════════════════════════════════════════════════════════════════

/** 위저드 카테고리 id(웹 UI와 동일). */
export const WIZARD_CATEGORY_IDS = ["finance", "ai", "meme", "news", "tmi", "game", "animal", "celeb"] as const;
export type WizardCategoryId = (typeof WIZARD_CATEGORY_IDS)[number];

const CATEGORY_LABELS: Record<WizardCategoryId, string> = {
  finance: "재테크팁",
  ai: "AI생성활용",
  meme: "밈&짤",
  news: "충격뉴스",
  tmi: "TMI지식",
  game: "게임클립",
  animal: "귀여운동물",
  celeb: "셀럽엔터",
};

type WizardTopicAngle = "반전" | "숫자" | "실수" | "루틴" | "심리" | "꿀팁";

/**
 * topic bank의 씨앗 1개 — 대본 생성에 필요한 구조를 전부 갖는다.
 *
 * 프리미엄(돈·심리) 씨앗 계약: finance 씨앗은 아래 선택 필드를 전부 채운다.
 * - empathy      : 문제 공감 한 문장(씬 2). 대본 흐름 = 후킹→공감→심리→반전→행동→저장.
 * - points       : [심리 원인, 반전 문장, 행동 전환] 순서 고정(씬 3~5).
 * - angleNote    : 돈+심리+행동 구조가 드러나는 한 줄 설명(UI 추천 이유로 노출).
 * - moneyAnchor / psychologyAnchor / successAnchor : 주제의 3축 라벨.
 * - visualMetaphor: 영상화 가능한 장면 한 컷.
 * 자막 계약: hook/empathy/points/save는 trimCaption(22자)에 잘리지 않게 22자 이하로 쓴다.
 */
type WizardTopicSeed = {
  slug: string; // [a-z0-9-]만. topicId = gen-<category>-<slug>
  title: string;
  hook: string;
  angle: WizardTopicAngle;
  points: [string, string, string];
  save: string; // 저장/행동 유도 문구 — 행동 시점(다음 월급날/결제 전/오늘 밤 등) 포함
  empathy?: string;
  angleNote?: string;
  moneyAnchor?: string;
  psychologyAnchor?: string;
  successAnchor?: string;
  visualMetaphor?: string;
};

/**
 * 로컬 topic bank — finance는 프리미엄 돈·심리 엔진(48개), 나머지 7개 카테고리 × 12개 씨앗.
 * 특정 인물/사건/검증 불가한 수치 주장 없이 evergreen 주제만 담는다.
 * finance는 절약 요령 나열이 아니라 돈×심리×성공/습관이 결합된 자기인식형 주제만 담는다
 * (커피값/티끌/무지출/통장 쪼개기류 저품질 절약팁 금지).
 * 이미 게시된 t1_lifestyle_inflation / t2_salary_3days / base-rate 계열은 넣지 않는다.
 */
const TOPIC_BANK: Record<WizardCategoryId, WizardTopicSeed[]> = {
  finance: [
    // ── A. 월급날 심리 ──
    { slug: "payday-rich-act", title: "월급 들어온 날 배달앱부터 켜는 사람", hook: "월급 알림 뜨자마자 배달앱 켰다면", angle: "심리", empathy: "월급날엔 결제 버튼이 가벼워지죠", points: ["입금 알림이 소비 허가증이 된다", "금액이 아니라 그날 기분이 문제죠", "월급날엔 결제 대신 이체만 하세요"], save: "다음 월급날 아침에 열어 보세요", angleNote: "월급(돈) × 보상심리 × 월급날 첫 선택 구조", moneyAnchor: "월급", psychologyAnchor: "보상심리", successAnchor: "매일의 선택 구조", visualMetaphor: "월급 입금 알림과 커지는 장바구니 화면" },
    { slug: "payday-vanish-reserved", title: "월급은 쓰기도 전에 자동이체로 사라진다", hook: "월급날 잔고, 저녁이면 이미 반토막", angle: "반전", empathy: "스치는 월급에 의지를 탓하게 되죠", points: ["자동 결제가 내 선택보다 빠르다", "의지가 아니라 예약된 구조 문제죠", "예약된 돈부터 한 줄씩 확인하세요"], save: "다음 월급날 전날 밤에 꺼내 보세요", angleNote: "자동이체(돈) × 자기합리화 × 반복 지출 구조", moneyAnchor: "자동이체", psychologyAnchor: "자기합리화", successAnchor: "반복 패턴", visualMetaphor: "월급 입금 직후 줄줄이 빠지는 자동이체 목록" },
    { slug: "payday-first-hour", title: "월급날 첫 한 시간이 그달 잔고를 정한다", hook: "월급 들어온 첫 한 시간, 뭐부터 했나요", angle: "반전", empathy: "월말의 후회는 언제나 늦다", points: ["결심은 잔액과 같이 줄어든다", "이기는 쪽은 의지가 아니라 순서죠", "들어오자마자 먼저 나눠 두세요"], save: "다음 월급날 첫 1시간에 쓰세요", angleNote: "현금흐름(돈) × 지연만족 실패 × 첫 순서 설계", moneyAnchor: "현금흐름", psychologyAnchor: "지연만족 실패", successAnchor: "매일의 선택 구조", visualMetaphor: "세 칸으로 나뉘어 이체되는 월급 화면" },
    { slug: "raise-same-anxiety", title: "연봉 올랐는데 잔고는 그대로인 사람", hook: "월급 올랐는데 왜 통장은 그대로일까", angle: "반전", empathy: "수입이 늘어도 마음은 쫓긴다", points: ["지출 기준선이 소득을 따라 오르죠", "부족한 건 소득이 아니라 기준이다", "오른 만큼 절반은 못 본 돈으로"], save: "다음 월급 인상 전에 꼭 읽어 보세요", angleNote: "지출 기준선(돈) × 충분함의 부재 × 기준선 관리", moneyAnchor: "지출 기준선", psychologyAnchor: "충분함의 부재", successAnchor: "기준선", visualMetaphor: "소득과 나란히 오르는 지출 그래프" },
    { slug: "payday-mood-spend", title: "퇴근길 보상소비가 월급을 먼저 먹는다", hook: "힘든 날 퇴근길에 꼭 뭘 사는 사람", angle: "심리", empathy: "월급날 결제는 빠르고 과감해지죠", points: ["보상심리가 브레이크를 푼다", "고생한 보상이 다음 달 짐이 되죠", "보상은 돈 말고 시간으로 즐기세요"], save: "다음 월급날 결제 전에 여세요", angleNote: "소비(돈) × 보상심리 × 반복되는 월급날 패턴", moneyAnchor: "소비", psychologyAnchor: "보상심리", successAnchor: "반복 패턴", visualMetaphor: "월급날 밤 쌓이는 결제 알림 스택" },
    { slug: "debt-pay-order", title: "빚 갚는데 안 줄면 갚는 날짜부터 봐라", hook: "빚 갚는데 이상하게 안 줄어든다면", angle: "반전", empathy: "갚는데도 이상하게 줄지 않죠", points: ["하루 사이 마음이 핑계를 만든다", "상환은 결심이 아니라 순서 문제죠", "상환 이체를 입금 직후로 옮기세요"], save: "다음 월급날 전에 순서를 바꾸세요", angleNote: "빚(돈) × 자기합리화 × 이체 순서 설계", moneyAnchor: "빚", psychologyAnchor: "자기합리화", successAnchor: "매일의 선택 구조", visualMetaphor: "입금 직후 맨 위로 올라간 상환 이체 줄" },
    // ── B. 소비 심리 ──
    { slug: "buy-anxiety-not-thing", title: "장바구니에 담는 건 물건이 아니라 불안이다", hook: "우울한 날 장바구니만 늘어나는 사람", angle: "심리", empathy: "불안한 날일수록 결제가 늘죠", points: ["쇼핑은 가장 비싼 진정제다", "그 결제는 물건값이 아니라 감정값", "사기 전에 지금 기분을 적어 보세요"], save: "오늘 밤 장바구니 열기 전에 보세요", angleNote: "소비(돈) × 불안 × 감정-지출 반복 패턴", moneyAnchor: "소비", psychologyAnchor: "불안", successAnchor: "반복 패턴", visualMetaphor: "새벽 장바구니 화면과 쌓인 택배 상자" },
    { slug: "midnight-checkout", title: "새벽에 결제 누르고 아침에 후회하는 사람", hook: "밤에 지른 택배, 아침에 취소하고 싶죠", angle: "심리", empathy: "아침에 취소하고 싶은 주문, 있죠", points: ["피로는 판단보다 욕구를 깨운다", "밤의 소비는 선택이 아니라 회피죠", "밤엔 결제 말고 담기까지만 하세요"], save: "오늘 밤 열두 시 전에 저장하세요", angleNote: "소비(돈) × 통제감 저하 × 밤 시간 선택 구조", moneyAnchor: "소비", psychologyAnchor: "통제감", successAnchor: "매일의 선택 구조", visualMetaphor: "어두운 방에서 홀로 빛나는 결제 화면" },
    { slug: "this-much-is-fine", title: "이 정도는 괜찮다는 말이 통장을 비운다", hook: "결제 전에 이 정도는 괜찮다 했다면", angle: "심리", empathy: "하나하나는 다 그럴 만했다", points: ["합리화는 지출에 이야기를 입힌다", "무너지는 건 금액이 아니라 기준이죠", "괜찮아 쓸 횟수를 미리 정하세요"], save: "다음 결제 직전에 한 번 여세요", angleNote: "소비(돈) × 자기합리화 × 기준선 침식", moneyAnchor: "소비", psychologyAnchor: "자기합리화", successAnchor: "기준선", visualMetaphor: "그럴듯한 이유가 붙은 영수증 더미" },
    { slug: "regret-pattern", title: "산 걸 후회하는 자리가 매달 똑같은 사람", hook: "택배 뜯자마자 또 후회했다면", angle: "심리", empathy: "환불은 귀찮고 후회는 잊힌다", points: ["뇌는 결제의 아픔을 빨리 지운다", "기록 없는 후회는 다시 반복되죠", "후회한 소비만 한 줄씩 남기세요"], save: "다음 결제일 전에 목록을 보세요", angleNote: "소비(돈) × 자기합리화 × 후회-반복 패턴", moneyAnchor: "소비", psychologyAnchor: "자기합리화", successAnchor: "반복 패턴", visualMetaphor: "잊힌 영수증과 다시 열리는 결제 화면" },
    { slug: "discount-emotion", title: "세일 알림 뜨면 합리화부터 하는 사람", hook: "세일 알림에 안 사면 손해라 느꼈다면", angle: "반전", empathy: "세일 기간엔 지갑이 먼저 반응하죠", points: ["할인은 득템 감정으로 판단을 덮죠", "안 샀다면 전부 아낀 돈이다", "목록에 없던 세일은 넘기세요"], save: "다음 세일 알림 오면 먼저 여세요", angleNote: "소비(돈) × 보상심리 × 지출 기준선 방어", moneyAnchor: "소비", psychologyAnchor: "보상심리", successAnchor: "기준선", visualMetaphor: "빨간 할인 표시와 길어지는 결제 내역" },
    { slug: "emotion-invoice", title: "카드값 두꺼운 달엔 감정이 먼저 무너졌다", hook: "이번 달 카드값이 유난히 두껍다면", angle: "심리", empathy: "힘든 달일수록 청구서가 두껍죠", points: ["스트레스는 소비로 출구를 찾는다", "카드값 관리는 사실 감정 관리죠", "지출 옆에 그날 기분도 적어 보세요"], save: "다음 청구서 오는 날 읽어 보세요", angleNote: "소비(돈) × 불안 × 감정 지출의 축적", moneyAnchor: "소비", psychologyAnchor: "불안", successAnchor: "보이지 않는 축적", visualMetaphor: "감정 표시가 붙은 카드 청구서 한 장" },
    // ── C. 비교와 체면 ──
    { slug: "highlight-vs-balance", title: "남 피드 보다 내 잔고 확인하는 밤", hook: "피드 보다가 내 잔고 열어 봤다면", angle: "심리", empathy: "피드를 닫으면 내 삶이 작아 보이죠", points: ["남의 무대와 내 대기실을 비교하죠", "보이는 소비 뒤 잔액은 아무도 몰라요", "부러울 땐 원하는 걸 적어 보세요"], save: "오늘 밤 피드 열기 전에 저장하세요", angleNote: "잔액(돈) × 비교 × 남 기준선에 끌려가는 소비", moneyAnchor: "잔액", psychologyAnchor: "비교", successAnchor: "기준선", visualMetaphor: "화려한 피드 옆에 놓인 내 잔액 화면" },
    { slug: "face-spending", title: "모임 전날 없어 보일까 봐 지르는 사람", hook: "모임 전날 밤 옷부터 사고 있다면", angle: "심리", empathy: "모임 전날의 쇼핑엔 이유가 있죠", points: ["체면 소비는 시선에 내는 보험료죠", "남들은 내 소비를 기억하지 않아요", "누구에게 보여 줄 건지 물어보세요"], save: "다음 모임 전날 밤에 열어 보세요", angleNote: "소비(돈) × 체면 × 시선 지출 반복", moneyAnchor: "소비", psychologyAnchor: "체면", successAnchor: "반복 패턴", visualMetaphor: "모임 전날 밤의 쇼핑 화면과 옷장" },
    { slug: "look-rich-vs-be-rich", title: "부자로 보이려는 결제가 통장을 먼저 턴다", hook: "부자처럼 보이려고 지른 적 있다면", angle: "반전", empathy: "보이는 건 빠르고 쌓임은 느리죠", points: ["보이는 소비는 박수를 받고 끝나죠", "진짜 부는 안 보이는 곳에서 자라요", "박수받을 소비 하나를 이체로 바꿔요"], save: "다음 결제일 전에 하나만 바꾸세요", angleNote: "자산(돈) × 체면 × 보이지 않는 축적", moneyAnchor: "자산", psychologyAnchor: "체면", successAnchor: "보이지 않는 축적", visualMetaphor: "쇼핑백과 조용히 오르는 계좌 그래프" },
    { slug: "peer-money-pace", title: "친구 앞 지출 맞추다 내 통장만 빈다", hook: "친구랑 놀면 내 잔고만 먼저 빈다면", angle: "심리", empathy: "같이 놀면 씀씀이도 닮아 가죠", points: ["소속감은 지출을 맞추라고 조르죠", "관계는 돈이 아니라 시간이 지킨다", "내 소비 속도를 정하고 만나세요"], save: "다음 약속 잡기 전에 읽어 보세요", angleNote: "소비(돈) × 비교 × 내 기준선 지키기", moneyAnchor: "소비", psychologyAnchor: "비교", successAnchor: "기준선", visualMetaphor: "더치페이 화면과 서로 다른 잔액" },
    { slug: "gift-overreach", title: "선물 고를 때 성의 없어 보일까 무리하는 사람", hook: "선물 앞에서 적게 쓰면 미안해진다면", angle: "심리", empathy: "적게 쓰면 성의 없어 보일까 걱정되죠", points: ["선물 금액은 관계 불안의 온도계죠", "남는 건 가격이 아니라 정확함이다", "상한을 정하고 고르기 시작하세요"], save: "다음 선물 고르기 전에 여세요", angleNote: "소비(돈) × 체면 × 관계 지출 기준선", moneyAnchor: "소비", psychologyAnchor: "체면", successAnchor: "기준선", visualMetaphor: "가격표 앞에서 망설이는 손" },
    { slug: "big-visible-first", title: "크게 보이려 지른 것이 선택지를 잠근다", hook: "남 눈 때문에 큰 결제 지른 적 있다면", angle: "반전", empathy: "큰 지출일수록 남 눈이 먼저 뜨죠", points: ["규모의 소비는 체면과 붙어 다니죠", "선택권을 줄이는 소비가 제일 비싸요", "유지비까지 넣어 다시 계산하세요"], save: "큰 결제 전날 밤에 꼭 읽어 보세요", angleNote: "자산(돈) × 체면 × 장기 유지비 판단", moneyAnchor: "자산", psychologyAnchor: "체면", successAnchor: "장기 행동", visualMetaphor: "큰 쇼핑 뒤에 길게 붙는 유지비 목록" },
    // ── D. 불안과 통제감 ──
    { slug: "control-before-balance", title: "잔고 확인이 무서워 앱을 미루는 사람", hook: "잔고 볼 용기가 안 나 앱을 닫았다면", angle: "심리", empathy: "잔액 확인이 무서워 미루게 되죠", points: ["모르는 상태가 소비를 더 부른다", "문제의 절반은 숫자가 아니라 안개죠", "주 1회, 잔액을 그냥 보기만 하세요"], save: "오늘 밤 자기 전에 한 번 여세요", angleNote: "잔액(돈) × 통제감 × 확인 습관", moneyAnchor: "잔액", psychologyAnchor: "통제감", successAnchor: "매일의 선택 구조", visualMetaphor: "열지 못하고 밀어 둔 은행 앱 아이콘" },
    { slug: "anxiety-scroll-buy", title: "불안해서 켠 폰을 결제로 닫는 밤", hook: "잠 안 와 켠 폰이 결제로 끝났다면", angle: "심리", empathy: "생각을 멈추려 폰을 켠 밤, 많죠", points: ["불안은 즉시 눌리는 버튼을 찾아요", "결제는 불안을 끄지 않고 미룬다", "불안한 밤엔 결제 앱 대신 메모를"], save: "오늘 밤 폰 켜기 전에 저장하세요", angleNote: "소비(돈) × 불안 × 밤 반복 패턴", moneyAnchor: "소비", psychologyAnchor: "불안", successAnchor: "반복 패턴", visualMetaphor: "밤마다 반복되는 결제 알림 기록" },
    { slug: "emergency-courage", title: "비상금 없는 사람은 거절부터 못 한다", hook: "잔고 없어 하기 싫은 일 떠맡은 적 있죠", angle: "반전", empathy: "여유가 없으면 거절도 어렵다", points: ["잔고가 없으면 선택도 남의 것이 되죠", "비상금은 지출이 아니라 거절할 힘", "쓸 일 없어도 매달 조금씩 옮기세요"], save: "다음 월급날 이체 한 줄 추가하세요", angleNote: "현금흐름(돈) × 통제감 × 보이지 않는 축적", moneyAnchor: "현금흐름", psychologyAnchor: "통제감", successAnchor: "보이지 않는 축적", visualMetaphor: "잠겨 있어 더 든든한 통장 하나" },
    { slug: "debt-look-away", title: "고지서 안 뜯고 쌓아 두면 빚만 자란다", hook: "카드 고지서 안 뜯고 쌓아 뒀다면", angle: "심리", empathy: "고지서를 안 뜯고 쌓아 둔 적 있죠", points: ["회피는 이자보다 빨리 불어난다", "크기보다 모른다는 게 진짜 문제죠", "총액을 딱 한 번 정확히 적으세요"], save: "오늘 밤 십 분만 내서 확인하세요", angleNote: "빚(돈) × 불안 회피 × 직면 습관", moneyAnchor: "빚", psychologyAnchor: "불안", successAnchor: "장기 행동", visualMetaphor: "뜯지 않은 고지서 더미" },
    { slug: "income-stop-rehearsal", title: "월급 끊기는 상상을 피할수록 더 위험하다", hook: "월급 끊기면 어쩌나 생각만 미뤘다면", angle: "반전", empathy: "생각만 해도 불안해 덮어 두게 되죠", points: ["막연한 두려움은 준비를 미룬다", "구체적 상상은 불안을 계획으로 바꿔요", "석 달 버틸 비용을 숫자로 적으세요"], save: "이번 주말에 삼십 분만 계산하세요", angleNote: "현금흐름(돈) × 불안 × 장기 대비 행동", moneyAnchor: "현금흐름", psychologyAnchor: "불안", successAnchor: "장기 행동", visualMetaphor: "석 달 치 생활비를 적은 메모 한 장" },
    { slug: "money-talk-silence", title: "돈 얘기 미루는 집에서 돈 문제가 자란다", hook: "가족과 돈 얘기를 자꾸 미뤘다면", angle: "심리", empathy: "가까울수록 돈 얘기가 어렵죠", points: ["회피는 갈등이 아니라 불안 때문이죠", "숫자를 공유하면 걱정은 절반이 돼요", "이번 달 지출 하나만 같이 여세요"], save: "이번 주말 저녁 십 분만 얘기하세요", angleNote: "현금흐름(돈) × 불안 × 대화 습관", moneyAnchor: "현금흐름", psychologyAnchor: "불안", successAnchor: "매일의 선택 구조", visualMetaphor: "식탁 위에 함께 펼친 가계 화면" },
    // ── E. 기준선 ──
    { slug: "baseline-poverty", title: "이번 달만 하던 지출이 기본값으로 굳는다", hook: "예전엔 사치였던 게 지금은 기본이라면", angle: "반전", empathy: "예전엔 사치였던 게 기본이 됐죠", points: ["익숙한 편안함은 지출로 안 보인다", "위험한 건 큰 소비가 아니라 기본값", "기본이 된 지출 하나를 찾아보세요"], save: "다음 결제일 전에 하나 점검하세요", angleNote: "지출 기준선(돈) × 충분함의 부재 × 기본값 관리", moneyAnchor: "지출 기준선", psychologyAnchor: "충분함의 부재", successAnchor: "기준선", visualMetaphor: "해마다 높아지는 기본 지출 계단" },
    { slug: "taste-one-way", title: "한 번 올린 씀씀이는 혼자 안 내려온다", hook: "좋은 거 한 번 쓰고 예전 게 불편했다면", angle: "심리", empathy: "한 번 좋은 걸 쓰면 예전 게 불편하죠", points: ["취향 상승은 기준선을 끌어올린다", "비싼 건 취향이 아니라 못 돌아감이죠", "올리기 전에 유지비부터 물으세요"], save: "다음 업그레이드 욕심 전에 여세요", angleNote: "지출 기준선(돈) × 지연만족 실패 × 기준선 상승", moneyAnchor: "지출 기준선", psychologyAnchor: "지연만족 실패", successAnchor: "기준선", visualMetaphor: "점점 비싸지는 같은 품목 영수증 비교" },
    { slug: "designed-normal", title: "남들 다 사니까 사는 건 누가 정한 기준일까", hook: "남들 다 쓰니까 나도 산 적 있다면", angle: "반전", empathy: "남들 다 쓰니까 쓰게 되는 게 있죠", points: ["광고와 피드가 눈높이를 정한다", "기본값을 의심하는 게 진짜 절약이죠", "원래 그런 거야 목록을 만들어 보세요"], save: "오늘 밤 정기 결제 목록 옆에 두세요", angleNote: "소비(돈) × 비교 × 설계된 기본값 의심", moneyAnchor: "소비", psychologyAnchor: "비교", successAnchor: "기준선", visualMetaphor: "모두 똑같이 들고 있는 신상품 화면" },
    { slug: "enough-line", title: "얼마면 충분한지 모르면 벌어도 계속 쫓긴다", hook: "얼마 있으면 안심되냐 물으면 막막했죠", angle: "심리", empathy: "목표 금액은 늘 뒤로 밀리죠", points: ["기준 없는 목표는 도착해도 지나쳐요", "부족이 아니라 끝을 안 정한 거다", "이번 달 충분했던 순간을 적으세요"], save: "다음 월급날 목표 세우기 전에 보세요", angleNote: "자산(돈) × 충분함의 부재 × 장기 목표 설계", moneyAnchor: "자산", psychologyAnchor: "충분함의 부재", successAnchor: "장기 행동", visualMetaphor: "계속 늘어나는 목표 금액 메모" },
    { slug: "exception-to-fixed", title: "이번 한 번만이 어느새 매달 나가는 돈", hook: "특별한 날 지출이 매달 찍힌다면", angle: "반전", empathy: "특별한 날 지출이 매달 보이죠", points: ["예외 지출은 죄책감을 빨리 잃는다", "고정 지출 대부분은 예외로 시작했죠", "석 달 반복된 예외에 이름 붙이세요"], save: "다음 결제일에 예외 목록을 보세요", angleNote: "지출 기준선(돈) × 자기합리화 × 예외의 고착", moneyAnchor: "지출 기준선", psychologyAnchor: "자기합리화", successAnchor: "반복 패턴", visualMetaphor: "매달 같은 자리에 찍히는 예외 결제" },
    { slug: "scale-eats-income", title: "수입 늘 때마다 살림 키워 안 남기는 사람", hook: "월급 오를 때마다 살림도 커졌다면", angle: "심리", empathy: "수입이 늘 때마다 살림도 커졌죠", points: ["규모는 커지면 저절로 유지된다", "남는 돈은 수입이 아니라 규모가 정해요", "규모 키우기 전 반년만 미루세요"], save: "다음 큰 지출 결정 전에 열어 보세요", angleNote: "현금흐름(돈) × 지연만족 실패 × 규모 기준선", moneyAnchor: "현금흐름", psychologyAnchor: "지연만족 실패", successAnchor: "기준선", visualMetaphor: "수입과 함께 커지는 살림 평면도" },
    // ── F. 보이지 않는 부와 선택권 ──
    { slug: "wealth-is-options", title: "돈 없을 때 제일 아픈 건 고를 수 없다는 것", hook: "돈 없어서 원치 않는 걸 골랐던 적 있죠", angle: "반전", empathy: "돈이 없을 때 제일 아픈 건 못 고름", points: ["돈은 고를 수 있을 때 힘이 세다", "모은 돈의 정체는 미래의 선택지죠", "저축에 선택권 산 돈이라 적으세요"], save: "다음 이체하는 날 이름을 바꾸세요", angleNote: "자산(돈) × 통제감 × 보이지 않는 축적", moneyAnchor: "자산", psychologyAnchor: "통제감", successAnchor: "보이지 않는 축적", visualMetaphor: "잠긴 문이 하나씩 열리는 복도" },
    { slug: "buy-back-time", title: "돈 모으는 사람은 사실 시간을 사 모은다", hook: "돈 때문에 시간을 팔아 본 적 있다면", angle: "반전", empathy: "돈 때문에 시간을 파는 날이 많죠", points: ["소비는 시간을 쓰고 자산은 벌어 줘요", "최고의 소비는 시간을 돌려받는 것", "시간을 사 주는 지출인지 물으세요"], save: "다음 큰 결제 전에 이 질문을 하세요", angleNote: "자산(돈) × 통제감 × 장기 시간 관점", moneyAnchor: "자산", psychologyAnchor: "통제감", successAnchor: "장기 행동", visualMetaphor: "시계와 맞바꾸는 지폐 한 장" },
    { slug: "quiet-money-wins", title: "아무도 안 보는 이체가 결국 나를 부자로 만든다", hook: "자랑할 데 없는 저축은 재미없었죠", angle: "반전", empathy: "쌓이는 돈은 티가 안 나 재미없죠", points: ["보여 주는 돈은 박수 속에 사라져요", "쌓임은 지루함을 견딘 값이다", "재미없는 이체 하나를 자동으로"], save: "다음 월급날 이체 한 줄 거세요", angleNote: "자동이체(돈) × 지연만족 × 보이지 않는 축적", moneyAnchor: "자동이체", psychologyAnchor: "지연만족 실패", successAnchor: "보이지 않는 축적", visualMetaphor: "소리 없이 계단을 오르는 잔액 그래프" },
    { slug: "freedom-price", title: "그만두고 싶어도 못 그만두는 건 고정비 탓", hook: "그만두고 싶은데 카드값 때문에 참았죠", angle: "숫자", empathy: "연봉이 올라도 자유는 멀게 느껴지죠", points: ["나가는 돈이 클수록 못 그만둔다", "자유의 가격은 내 한 달 생활비죠", "한 달 최소 생활비를 계산해 보세요"], save: "이번 주말 삼십 분만 계산하세요", angleNote: "현금흐름(돈) × 통제감 × 자유의 단위 계산", moneyAnchor: "현금흐름", psychologyAnchor: "통제감", successAnchor: "장기 행동", visualMetaphor: "지출 줄이 짧아질수록 열리는 문" },
    { slug: "unseen-savings", title: "자랑 못 한 저축만 끝까지 내 편에 남는다", hook: "저축은 아무도 칭찬 안 해 지루했죠", angle: "심리", empathy: "저축은 아무도 칭찬해 주지 않죠", points: ["인정받는 소비가 저축보다 달콤해요", "박수는 순간이고 잔액은 남는다", "지출 하나를 아무도 모르게 이체로"], save: "다음 월급날 조용히 실행해 보세요", angleNote: "자산(돈) × 체면 × 보이지 않는 축적", moneyAnchor: "자산", psychologyAnchor: "체면", successAnchor: "보이지 않는 축적", visualMetaphor: "어디에도 올리지 않은 통장 화면" },
    { slug: "ready-money-luck", title: "기회를 놓친 건 잔고가 없어서였다", hook: "돈 없어서 좋은 기회 흘려보낸 적 있죠", angle: "반전", empathy: "돈 때문에 흘려보낸 기회가 있죠", points: ["잔액이 없으면 시야가 좁아진다", "여윳돈은 운을 잡는 손이다", "기회 계좌라는 통장을 만들어 보세요"], save: "다음 월급날 기회 계좌부터 만드세요", angleNote: "잔액(돈) × 통제감 × 기회 대비 축적", moneyAnchor: "잔액", psychologyAnchor: "통제감", successAnchor: "보이지 않는 축적", visualMetaphor: "기회라고 적힌 비어 있던 통장" },
    // ── G. 결제 구조의 심리 ──
    { slug: "default-beats-will", title: "돈 모으는 사람은 참지 않고 자동이체를 잠근다", hook: "저축 결심만 매달 반복하고 있다면", angle: "반전", empathy: "결심은 매달 하는데 결과는 같죠", points: ["의지는 소모품이라 월말엔 바닥나요", "이기는 건 성실함이 아니라 설정이죠", "저축을 첫 자동이체 순서로 올리세요"], save: "다음 월급날 전에 순서를 바꾸세요", angleNote: "자동이체(돈) × 지연만족 실패 × 시스템 설계", moneyAnchor: "자동이체", psychologyAnchor: "지연만족 실패", successAnchor: "매일의 선택 구조", visualMetaphor: "맨 위로 올라간 저축 이체 줄" },
    { slug: "subscribe-identity", title: "구독 해지 버튼 앞에서 손이 멈추는 사람", hook: "안 쓰는 구독 해지를 자꾸 미뤘다면", angle: "심리", empathy: "안 쓰는데 해지가 망설여지죠", points: ["구독엔 되고 싶은 내가 걸려 있어요", "결제를 멈춰도 나는 줄지 않는다", "정체성 결제엔 이름을 붙여 보세요"], save: "다음 결제 알림이 오면 여세요", angleNote: "구독(돈) × 자기합리화 × 반복 결제 정체성", moneyAnchor: "구독", psychologyAnchor: "자기합리화", successAnchor: "반복 패턴", visualMetaphor: "안 쓰는데 매달 뜨는 결제 알림" },
    { slug: "numb-small-auto", title: "몇천 원 자동결제가 돈 감각을 마취시킨다", hook: "몇천 원쯤이야 하고 넘긴 결제 많다면", angle: "반전", empathy: "몇천 원쯤이야 하고 넘긴 게 여럿이죠", points: ["반복 결제는 지출 감각을 마취시켜요", "무감각 습관은 큰돈에도 옮는다", "하나를 수동으로 바꿔 감각을 깨우세요"], save: "다음 결제일 전에 하나만 바꾸세요", angleNote: "구독(돈) × 통제감 × 무감각 반복 패턴", moneyAnchor: "구독", psychologyAnchor: "통제감", successAnchor: "반복 패턴", visualMetaphor: "매달 조용히 지나가는 소액 결제 줄" },
    { slug: "easy-pay-cost", title: "간편결제가 쉬운 만큼 내 돈도 쉽게 샌다", hook: "손가락 한 번에 결제, 쓴 느낌도 없었죠", angle: "반전", empathy: "손가락 하나로 끝나 쓴 느낌이 없죠", points: ["마찰 없는 결제는 고민 틈을 없애요", "불편함은 사실 공짜 브레이크였죠", "큰 금액은 일부러 불편하게 내세요"], save: "오늘 밤 간편결제 설정을 여세요", angleNote: "소비(돈) × 지연만족 실패 × 결제 마찰 설계", moneyAnchor: "소비", psychologyAnchor: "지연만족 실패", successAnchor: "매일의 선택 구조", visualMetaphor: "원클릭 버튼과 사라지는 고민 시간" },
    { slug: "alert-off-spend-up", title: "잔액 알림 끈 날부터 지출이 늘어난다", hook: "잔액 알림 스트레스라 꺼 버렸다면", angle: "심리", empathy: "알림이 스트레스라 꺼 버렸죠", points: ["싫은 숫자를 피하면 감각이 무뎌져요", "불안이 아니라 정보를 끈 거다", "결제 알림 하나만 다시 켜 보세요"], save: "오늘 밤 알림 설정을 다시 여세요", angleNote: "잔액(돈) × 불안 회피 × 정보 습관", moneyAnchor: "잔액", psychologyAnchor: "불안", successAnchor: "매일의 선택 구조", visualMetaphor: "다시 켜지는 잔액 알림 화면" },
    { slug: "ledger-app-3days", title: "가계부가 삼 일 만에 끝난 건 의지 탓이 아니다", hook: "가계부 앱 깔고 삼 일 만에 지웠다면", angle: "심리", empathy: "설치와 삭제를 반복한 앱, 있죠", points: ["완벽한 기록 욕심이 시작을 무겁게 해요", "기록의 목적은 완벽이 아니라 목격", "하루 딱 한 건만 적기로 다시 시작"], save: "오늘 밤 제일 큰 지출 하나만 적으세요", angleNote: "소비(돈) × 자기합리화 × 지속 가능한 습관", moneyAnchor: "소비", psychologyAnchor: "자기합리화", successAnchor: "장기 행동", visualMetaphor: "다시 깔린 가계부 앱의 첫 화면" },
    // ── H. 장기 행동과 축적 ──
    { slug: "boring-gets-rich", title: "돈 모으는 길이 지루해서 다들 중간에 내린다", hook: "짜릿한 돈 버는 법만 찾아다녔다면", angle: "반전", empathy: "짜릿한 비법을 찾아다녔었죠", points: ["재미를 좇는 돈은 수업료를 낸다", "지루함을 견디는 게 드문 재능이죠", "지루한 이체 하나를 길게 거세요"], save: "다음 월급날 장기 이체를 시작하세요", angleNote: "자동이체(돈) × 지연만족 실패 × 장기 반복", moneyAnchor: "자동이체", psychologyAnchor: "지연만족 실패", successAnchor: "장기 행동", visualMetaphor: "십 년째 이어지는 이체 기록 한 줄" },
    { slug: "payment-is-vote", title: "결제할 때마다 미래의 나에게 한 표를 던진다", hook: "오늘 결제, 어떤 나에게 투표한 걸까요", angle: "심리", empathy: "하루하루 결제는 사소해 보이죠", points: ["작은 선택이 소비 정체성이 된다", "잔액은 과거의 내가 투표한 결과죠", "어떤 나에게 투표할지 묻고 내세요"], save: "다음 결제 직전에 떠올려 보세요", angleNote: "소비(돈) × 자기합리화 × 매일의 선택 구조", moneyAnchor: "소비", psychologyAnchor: "자기합리화", successAnchor: "매일의 선택 구조", visualMetaphor: "투표함에 들어가는 카드 한 장" },
    { slug: "restart-after-fail", title: "과소비한 다음 날 아침이 진짜 시험이다", hook: "한 번 과소비하고 다 놓아 버렸다면", angle: "심리", empathy: "한 번 무너지면 다 놓게 되죠", points: ["실패 후 회피가 손실을 두 배로 해요", "복구력이 계획보다 중요하다", "무너진 다음 날 그냥 루틴을 반복"], save: "과소비한 다음 날 아침에 여세요", angleNote: "현금흐름(돈) × 자기합리화 × 복구 반복", moneyAnchor: "현금흐름", psychologyAnchor: "자기합리화", successAnchor: "반복 패턴", visualMetaphor: "하루 무너진 뒤 다시 이어지는 기록" },
    { slug: "waiting-for-jackpot", title: "한 방을 기다리는 동안 통장은 조용히 늙는다", hook: "월급으론 어림없다며 한 방만 기다렸다면", angle: "반전", empathy: "월급으론 어림없다는 말, 익숙하죠", points: ["한 방 심리는 오늘을 가볍게 만들어요", "역전은 대부분 반복의 끝에서 온다", "이번 달 반복할 한 가지를 정하세요"], save: "다음 월급날 반복 항목을 확인하세요", angleNote: "자산(돈) × 지연만족 실패 × 축적의 힘", moneyAnchor: "자산", psychologyAnchor: "지연만족 실패", successAnchor: "보이지 않는 축적", visualMetaphor: "매달 같은 날 찍히는 작은 이체 도장" },
    { slug: "order-over-amount", title: "아껴도 안 모였다면 이체 순서가 거꾸로였다", hook: "아끼는데도 월말이 늘 빠듯했다면", angle: "반전", empathy: "아끼는데도 월말이 늘 빠듯하죠", points: ["남으면 저축은 실패하는 설계예요", "성공하는 지출엔 정해진 차례가 있죠", "저축과 상환을 맨 앞 순서로 옮기세요"], save: "다음 월급날 이체 순서를 바꾸세요", angleNote: "현금흐름(돈) × 지연만족 실패 × 순서 설계", moneyAnchor: "현금흐름", psychologyAnchor: "지연만족 실패", successAnchor: "매일의 선택 구조", visualMetaphor: "순서를 바꾼 이체 목록 화면" },
    { slug: "spending-tells-story", title: "결제 내역이 내 속마음을 나보다 먼저 안다", hook: "지난달 내역에서 낯선 내가 보였다면", angle: "심리", empathy: "내역에서 낯선 내가 보일 때 있죠", points: ["소비는 결핍과 욕망의 기록이다", "돈 관리는 숫자가 아니라 이야기 수정", "지난달 반복된 문장을 찾아보세요"], save: "이번 주말 지난달 내역을 읽으세요", angleNote: "소비(돈) × 자기합리화 × 정체성 서사", moneyAnchor: "소비", psychologyAnchor: "자기합리화", successAnchor: "반복 패턴", visualMetaphor: "자서전처럼 넘겨 보는 결제 내역" },
  ],
  ai: [
    { slug: "ai-daily-brief", title: "AI로 아침 브리핑 만드는 법", hook: "출근길 5분을 비서로 바꿔보세요", angle: "꿀팁", points: ["관심 주제 목록 미리 만들기", "매일 같은 질문 틀 재사용하기", "요약은 세 줄로 제한하기"], save: "브리핑 질문 틀을 저장해 두세요" },
    { slug: "ai-photo-fix", title: "흔들린 사진, 지우기 전에 할 일", hook: "지우지 말고 살려 보세요", angle: "꿀팁", points: ["밝기와 노이즈 자동 보정 쓰기", "배경 지우개로 잡티 정리하기", "원본은 항상 따로 남기기"], save: "사진 정리 전에 한 번 시도해 보세요" },
    { slug: "ai-study-partner", title: "AI에게 설명시키면 공부가 빨라진다", hook: "읽지 말고 물어보세요", angle: "심리", points: ["모르는 부분만 콕 집어 묻기", "예시를 두 개씩 요청하기", "마지막엔 스스로 요약하기"], save: "공부할 때 쓰는 질문법으로 저장하세요" },
    { slug: "ai-writing-draft", title: "빈 화면 공포 없애는 AI 초안법", hook: "처음부터 잘 쓰려니 안 써집니다", angle: "실수", points: ["일단 AI에게 초안 시키기", "내 말투로 고치며 다듬기", "사실 확인은 직접 하기"], save: "글 쓸 일 있을 때 꺼내 보세요" },
    { slug: "ai-travel-plan", title: "여행 계획, AI로 반나절 만에", hook: "계획 짜다 지치는 사람 주목", angle: "꿀팁", points: ["날짜와 예산 먼저 알려주기", "동선 기준으로 일정 요청하기", "예약 전 운영시간 직접 확인하기"], save: "여행 전 체크리스트로 저장해 두세요" },
    { slug: "ai-prompt-3parts", title: "AI 답이 달라지는 질문 공식", hook: "질문만 바꿔도 답이 달라집니다", angle: "숫자", points: ["역할·상황·형식 세 가지 주기", "원하는 예시 하나 보여주기", "부족하면 이어서 좁혀 묻기"], save: "질문 공식 세 가지를 저장해 두세요" },
    { slug: "ai-meeting-notes", title: "회의록 정리, AI에게 맡기는 법", hook: "회의 끝나고 30분 아껴 보세요", angle: "꿀팁", points: ["메모를 넣어 요약 요청하기", "결정사항과 할 일 분리 요청하기", "이름과 숫자는 직접 재확인하기"], save: "다음 회의 때 바로 써먹게 저장하세요" },
    { slug: "ai-recipe-fridge", title: "냉장고 재료로 저녁 메뉴 뽑기", hook: "오늘 뭐 먹지, 고민 끝내는 법", angle: "꿀팁", points: ["남은 재료 그대로 나열하기", "조리시간 상한 정해 주기", "없는 재료 대체안 물어보기"], save: "저녁 고민될 때 꺼내 쓰세요" },
    { slug: "ai-english-tutor", title: "AI랑 영어 말하기 연습하는 법", hook: "학원 없이도 말문이 트입니다", angle: "루틴", points: ["상황극 파트너로 설정하기", "내 문장 교정 요청하기", "같은 상황 반복해 익히기"], save: "영어 연습 루틴으로 저장해 두세요" },
    { slug: "ai-fact-check", title: "AI 답변, 그대로 믿으면 안 되는 이유", hook: "그럴듯한 말과 사실은 다릅니다", angle: "실수", points: ["출처를 함께 요청하기", "숫자와 날짜는 따로 검색하기", "중요한 결정엔 원문 확인하기"], save: "AI 쓸 때 기본 습관으로 저장하세요" },
    { slug: "ai-side-content", title: "AI로 콘텐츠 초안 뽑는 순서", hook: "혼자서도 팀처럼 만들 수 있어요", angle: "꿀팁", points: ["주제 후보 여러 개 뽑기", "고른 주제로 개요 짜기", "초안은 내 경험으로 채우기"], save: "콘텐츠 만들 때 순서대로 따라 해보세요" },
    { slug: "ai-voice-memo", title: "말로 남기고 글로 받는 메모법", hook: "타이핑보다 말이 빠릅니다", angle: "루틴", points: ["이동 중엔 음성 메모로 남기기", "AI로 문장 정리 시키기", "할 일만 골라 목록화하기"], save: "메모 습관 바꾸고 싶다면 저장하세요" },
  ],
  meme: [
    { slug: "meme-timing", title: "밈은 타이밍이 90%인 이유", hook: "늦은 밈은 아재 개그가 됩니다", angle: "심리", points: ["유행 초입에 빠르게 올라타기", "한 김 식으면 비틀어 쓰기", "우리끼리 맥락을 입혀 쓰기"], save: "밈 타이밍 감 잡을 때 참고하세요" },
    { slug: "reaction-folder", title: "반응 짤 폴더 정리법", hook: "필요한 짤은 항상 안 보입니다", angle: "꿀팁", points: ["감정별 폴더로 나누기", "자주 쓰는 짤 즐겨찾기", "한 달에 한 번 비우기"], save: "짤 부자 되고 싶다면 저장하세요" },
    { slug: "group-chat-meme", title: "단톡방 분위기 살리는 짤 사용법", hook: "같은 짤도 넣는 순간이 다릅니다", angle: "꿀팁", points: ["대화 흐름 끊지 않게 쓰기", "설명이 필요한 짤은 피하기", "상대가 웃을 짤인지 먼저 생각하기"], save: "단톡방 필수 매너로 저장해 두세요" },
    { slug: "make-own-meme", title: "내 사진으로 밈 만드는 법", hook: "저작권 걱정 없는 재료는 내 사진", angle: "꿀팁", points: ["표정이 살아있는 컷 고르기", "글씨는 크고 짧게 얹기", "반복해서 쓸 포맷 만들기"], save: "밈 만들기 도전할 때 참고하세요" },
    { slug: "meme-caption", title: "짤에 얹는 한 줄 뽑는 법", hook: "같은 짤도 문구가 반을 먹습니다", angle: "꿀팁", points: ["상황을 한 줄로 압축하기", "말줄임표로 여운 주기", "과한 설명은 빼기"], save: "문구 고민될 때 꺼내 보세요" },
    { slug: "meme-copyright", title: "짤 쓰다 곤란해지는 경우", hook: "그 짤, 아무 데나 쓰면 안 됩니다", angle: "실수", points: ["상업 계정은 권리 확인하기", "연예인 짤은 특히 조심하기", "무료 소스나 내 촬영분 쓰기"], save: "계정 운영자라면 꼭 저장하세요" },
    { slug: "inside-joke", title: "우리끼리 밈 만드는 법", hook: "아는 사람만 웃는 밈이 제일 셉니다", angle: "심리", points: ["반복되는 상황 포착하기", "별명과 유행어로 굳히기", "기념일마다 다시 소환하기"], save: "모임 분위기 메이커라면 저장하세요" },
    { slug: "meme-format-swap", title: "유행 포맷 비틀어 쓰는 법", hook: "그대로 따라 하면 반만 웃깁니다", angle: "꿀팁", points: ["포맷 구조만 빌려오기", "소재는 내 일상에서 찾기", "예상을 한 번 배반하기"], save: "포맷 활용법으로 저장해 두세요" },
    { slug: "gif-vs-still", title: "움짤과 정지짤, 언제 뭘 쓸까", hook: "타이밍 개그는 움짤이 이깁니다", angle: "꿀팁", points: ["리액션은 움짤로 크게", "정보 전달은 정지짤로", "용량 큰 방에선 정지짤 배려"], save: "짤 고를 때 기준으로 저장하세요" },
    { slug: "meme-archive", title: "레전드 짤 잃어버리지 않는 법", hook: "그 짤 어디 갔지, 그만 겪으세요", angle: "루틴", points: ["클라우드에 짤 백업하기", "키워드로 파일명 바꾸기", "베스트만 따로 모으기"], save: "짤 관리 루틴으로 저장해 두세요" },
    { slug: "text-meme", title: "글자만으로 웃기는 법", hook: "이미지 없어도 밈이 됩니다", angle: "꿀팁", points: ["리듬감 있게 끊어 쓰기", "기대를 살짝 배반하기", "유행어는 한 번만 쓰기"], save: "드립 실력 늘리고 싶다면 저장하세요" },
    { slug: "meme-manner", title: "밈으로 상처 주지 않는 선", hook: "웃자고 한 말에 정색하게 만들지 마세요", angle: "꿀팁", points: ["특정인 비하 밈 거르기", "단톡방 성격에 맞춰 쓰기", "애매하면 안 보내기"], save: "밈 매너 기준으로 저장해 두세요" },
  ],
  news: [
    { slug: "headline-trap", title: "제목만 보고 믿으면 안 되는 이유", hook: "충격적인 제목일수록 의심하세요", angle: "실수", points: ["본문 끝까지 읽고 판단하기", "날짜부터 확인하기", "다른 매체와 교차 확인하기"], save: "뉴스 볼 때 기본 습관으로 저장하세요" },
    { slug: "old-news-recycle", title: "몇 년 전 뉴스가 오늘 또 도는 이유", hook: "그 소식, 사실 재탕일 수 있어요", angle: "반전", points: ["작성일과 수정일 확인하기", "이미지 원본 검색해 보기", "공식 발표 찾아보기"], save: "속지 않는 법으로 저장해 두세요" },
    { slug: "stat-misread", title: "숫자 기사에 속지 않는 법", hook: "퍼센트는 거짓말을 잘합니다", angle: "숫자", points: ["기준이 되는 모수 확인하기", "비교 대상이 뭔지 보기", "극단 사례 일반화 조심하기"], save: "숫자 기사 볼 때 꺼내 보세요" },
    { slug: "viral-rumor", title: "떠도는 소문 30초 검증법", hook: "퍼나르기 전에 딱 30초만", angle: "꿀팁", points: ["최초 출처 찾아보기", "공식 계정 발표 확인하기", "확실할 때만 공유하기"], save: "가족 단톡방 지킴이로 저장하세요" },
    { slug: "clickbait-words", title: "낚시 기사 거르는 단어들", hook: "이 단어가 나오면 일단 멈추세요", angle: "꿀팁", points: ["충격·경악은 감정 유도 신호", "알고 보니는 재구성 신호", "따옴표 제목은 발언 확인하기"], save: "기사 거를 때 기준으로 저장하세요" },
    { slug: "photo-context", title: "사진 한 장이 만드는 오해", hook: "사진은 진짜, 설명이 가짜일 때", angle: "반전", points: ["촬영 시점과 장소 확인하기", "잘린 부분 상상해 보기", "원본 맥락 검색하기"], save: "이미지 검증법으로 저장해 두세요" },
    { slug: "expert-quote", title: "전문가 인용 기사 읽는 법", hook: "전문가에 따르면, 을 조심하세요", angle: "꿀팁", points: ["실명과 소속 있는지 보기", "발언 전체 맥락 찾기", "반대 의견도 검색해 보기"], save: "균형 잡힌 뉴스 읽기로 저장하세요" },
    { slug: "algorithm-bubble", title: "내 뉴스만 다른 이유", hook: "우리는 같은 세상을 다르게 봅니다", angle: "심리", points: ["추천 피드 밖 뉴스도 보기", "다른 성향 매체 하나 구독하기", "제목만 소비하지 않기"], save: "정보 편식 막는 법으로 저장하세요" },
    { slug: "breaking-news-wait", title: "속보일수록 기다려야 하는 이유", hook: "첫 보도는 자주 틀립니다", angle: "반전", points: ["속보는 확정이 아님 기억하기", "몇 시간 뒤 후속 보도 보기", "정정 보도 확인하는 습관 갖기"], save: "큰 소식일수록 침착하게, 저장하세요" },
    { slug: "money-news-read", title: "경제 뉴스에서 진짜 봐야 할 것", hook: "무서운 경제 기사, 핵심은 따로 있어요", angle: "꿀팁", points: ["나에게 닿는 영향부터 보기", "일회성인지 추세인지 구분하기", "공포 문장보다 수치 보기"], save: "경제 뉴스 읽는 법으로 저장하세요" },
    { slug: "sns-source", title: "SNS발 소식이 빠른 대신 잃는 것", hook: "빠른 만큼 틀릴 확률도 큽니다", angle: "실수", points: ["원본 계정 신뢰도 보기", "캡처는 조작 가능성 기억하기", "언론 보도로 재확인하기"], save: "SNS 소식 접할 때 저장해 두세요" },
    { slug: "fact-vs-opinion", title: "사실과 의견 구분하는 연습", hook: "기사에도 의견이 섞여 있습니다", angle: "꿀팁", points: ["확인 가능한 문장 찾기", "형용사 많은 문단 의심하기", "내 결론은 사실 위에 세우기"], save: "미디어 읽기 기본기로 저장하세요" },
  ],
  tmi: [
    { slug: "why-earworm", title: "노래가 머릿속에서 안 나가는 이유", hook: "그 노래, 왜 하루 종일 맴돌까요", angle: "심리", points: ["뇌는 끝나지 않은 걸 붙잡는 편", "끝까지 들으면 멈추기도 함", "다른 몰입 활동으로 덮기"], save: "궁금증 해소용으로 저장해 두세요" },
    { slug: "why-yawn-spread", title: "하품은 왜 옮을까", hook: "옆 사람 하품에 나도 모르게", angle: "심리", points: ["공감 반응과 관련이 깊다고 알려짐", "가까운 사이일수록 잘 옮음", "피곤 신호일 수 있으니 휴식하기"], save: "재밌는 상식으로 저장해 두세요" },
    { slug: "fridge-door-open", title: "냉장고 문 자주 열면 생기는 일", hook: "문 여는 순간 전기가 샙니다", angle: "꿀팁", points: ["찬 공기가 빠지며 재냉각 시작", "자주 여닫을수록 부담 커짐", "꺼낼 것 정하고 한 번에 열기"], save: "전기 아끼는 습관으로 저장하세요" },
    { slug: "battery-heat-myth", title: "배터리, 충전보다 열이 문제", hook: "밤새 충전이 습관이라면 잠깐", angle: "반전", points: ["요즘 기기는 보호 회로가 기본", "높은 온도가 더 해로운 편", "케이스 벗겨 열 식히며 충전하기"], save: "배터리 오래 쓰는 팁으로 저장하세요" },
    { slug: "why-time-flies", title: "나이 들수록 시간이 빨라지는 느낌", hook: "어릴 때 여름방학은 길었는데", angle: "심리", points: ["새로운 경험이 시간을 늘림", "반복 일상은 기억이 압축됨", "작은 새 경험 자주 만들기"], save: "시간 늦추는 법으로 저장해 두세요" },
    { slug: "shower-ideas", title: "샤워할 때 아이디어가 떠오르는 이유", hook: "좋은 생각은 왜 꼭 샤워 중일까", angle: "심리", points: ["긴장이 풀리면 발상이 자유로움", "딴생각이 연결을 만들어 냄", "떠오르면 바로 메모하기"], save: "아이디어 잡는 법으로 저장하세요" },
    { slug: "sleep-rhythm", title: "같은 7시간인데 개운함이 다른 이유", hook: "잠은 양보다 리듬입니다", angle: "반전", points: ["초반 깊은 잠 비중이 큰 편", "취침 시간 일정하게 맞추기", "자기 전 화면 밝기 줄이기"], save: "꿀잠 루틴으로 저장해 두세요" },
    { slug: "why-rain-smell", title: "비 오기 전 흙냄새의 정체", hook: "비 냄새는 사실 땅의 냄새입니다", angle: "꿀팁", points: ["마른 땅이 젖으며 향이 올라옴", "흙 속 미생물 향이 주인공", "비 오는 날 산책에서 느껴보기"], save: "산책이 좋아지는 상식으로 저장하세요" },
    { slug: "hiccup-stop", title: "딸꾹질이 갑자기 멈추는 이유", hook: "놀라면 멈춘다는 말, 근거 있을까", angle: "꿀팁", points: ["호흡 리듬이 바뀌면 멈추기도 함", "숨 참기와 찬물이 흔한 방법", "오래 계속되면 진료 받기"], save: "딸꾹질 날 때 꺼내 보세요" },
    { slug: "left-hand-world", title: "왼손잡이가 불편한 세상인 이유", hook: "가위질 어려운 건 당신 탓이 아니에요", angle: "반전", points: ["도구 다수가 오른손 기준 설계", "양손 연습은 좋은 두뇌 자극", "왼손잡이용 도구도 찾아보기"], save: "몰랐던 배려 포인트로 저장하세요" },
    { slug: "goosebumps-why", title: "소름은 왜 돋을까", hook: "감동해도 추워도 같은 소름", angle: "심리", points: ["털 세우던 반응의 흔적으로 알려짐", "감정 자극에도 같은 회로 작동", "음악 소름은 몰입의 신호"], save: "재밌는 몸 상식으로 저장하세요" },
    { slug: "doorway-effect", title: "방에 들어가면 할 일을 까먹는 이유", hook: "문을 지나는 순간 리셋됩니다", angle: "심리", points: ["공간이 바뀌면 기억 맥락 전환", "이동 전 한 번 소리 내 말하기", "메모가 가장 확실한 보험"], save: "건망증 대처법으로 저장해 두세요" },
  ],
  game: [
    { slug: "clip-hotkey", title: "인생샷 클립, 단축키가 만든다", hook: "명장면은 예고 없이 옵니다", angle: "꿀팁", points: ["클립 저장 단축키 미리 설정", "최근 구간 저장 기능 켜두기", "저장 후 바로 이름 붙이기"], save: "클립 놓치기 싫다면 저장하세요" },
    { slug: "clip-edit-15s", title: "게임 클립 15초 편집 공식", hook: "하이라이트는 앞에 나와야 합니다", angle: "숫자", points: ["결정 장면을 첫 3초에 배치", "전후 맥락은 한 컷만", "자막은 짧게 상황 설명"], save: "클립 편집할 때 공식으로 저장하세요" },
    { slug: "tilt-control", title: "연패 중 멘탈 지키는 법", hook: "오늘따라 안 풀리는 날, 있죠", angle: "심리", points: ["세 판 지면 자리에서 일어나기", "리플레이로 내 실수 하나만 찾기", "피곤할 땐 랭크 대신 일반전"], save: "멘탈 흔들릴 때 꺼내 보세요" },
    { slug: "squad-comm", title: "팀게임 소통, 이것만 지켜도 이깁니다", hook: "정보만 말해도 절반은 캐리입니다", angle: "꿀팁", points: ["감정 빼고 위치와 상황만 말하기", "죽고 나서 훈수 두지 않기", "잘한 플레이는 크게 칭찬하기"], save: "팀운 올리는 법으로 저장하세요" },
    { slug: "new-game-learn", title: "새 게임 빨리 느는 법", hook: "튜토리얼만 믿으면 늦습니다", angle: "꿀팁", points: ["기본 조작을 몸에 먼저 익히기", "한 캐릭터, 한 무기만 파기", "고수 플레이 하나만 따라 하기"], save: "입문할 때 로드맵으로 저장하세요" },
    { slug: "play-time-box", title: "한 판만이 세 시간 되는 이유", hook: "시간 순삭에는 구조가 있습니다", angle: "루틴", points: ["시작 전 끝낼 시간 정하기", "판 수로 약속하지 않기", "알람에 다음 일정 이름 붙이기"], save: "겜생 균형 지키는 법으로 저장하세요" },
    { slug: "replay-review", title: "리플레이 복기, 프로만 하는 게 아니다", hook: "같은 실수를 반복하는 이유", angle: "꿀팁", points: ["진 판 딱 하나만 다시 보기", "내 시점 말고 상대 시점 보기", "고칠 점은 한 번에 하나만"], save: "실력 정체기라면 저장하세요" },
    { slug: "gear-budget", title: "장비 욕심, 어디까지가 실속일까", hook: "장비 탓은 반은 맞고 반은 틀립니다", angle: "반전", points: ["반응 체감 큰 장비부터 보기", "모니터와 마우스가 체감 큰 편", "세일 시즌에 갈아타기"], save: "장비 지름 전에 꺼내 보세요" },
    { slug: "clip-share-manner", title: "클립 공유 매너", hook: "내 캐리 영상이 남의 흑역사일 수도", angle: "실수", points: ["팀원 닉네임 가리기", "비하 자막 넣지 않기", "상대 조롱 클립은 올리지 않기"], save: "클립 올리기 전에 확인하세요" },
    { slug: "warmup-routine", title: "랭크 전 10분 워밍업", hook: "첫 판을 연습판으로 쓰지 마세요", angle: "루틴", points: ["조준·조작 연습 모드 5분", "가볍게 일반전 한 판", "컨디션 확인 후 랭크 시작"], save: "랭크 루틴으로 저장해 두세요" },
    { slug: "story-game-slow", title: "스토리 게임은 천천히가 이득", hook: "스킵하면 재미도 스킵됩니다", angle: "꿀팁", points: ["대사와 기록 읽으며 진행하기", "사이드 퀘스트 먼저 즐기기", "엔딩 후 해석 찾아보기"], save: "명작 즐기는 법으로 저장하세요" },
    { slug: "save-often", title: "세이브는 습관이다", hook: "세 시간이 날아가는 건 한순간", angle: "실수", points: ["구간마다 수동 저장 습관", "자동 저장 과신하지 않기", "슬롯 두 개 이상 번갈아 쓰기"], save: "쓰라린 경험 있다면 저장하세요" },
  ],
  animal: [
    { slug: "cat-slow-blink", title: "고양이가 천천히 눈 감는 의미", hook: "그 눈빛, 사실 애정 표현입니다", angle: "꿀팁", points: ["느린 깜빡임은 편안함 신호", "같이 천천히 깜빡여 화답하기", "억지로 눈 맞추지 않기"], save: "집사 필수 상식으로 저장하세요" },
    { slug: "dog-walk-sniff", title: "산책은 냄새 맡는 시간입니다", hook: "산책이 운동만은 아니에요", angle: "반전", points: ["킁킁거림은 정보 수집 시간", "재촉 말고 기다려 주기", "코스를 가끔 바꿔 주기"], save: "산책 습관 점검용으로 저장하세요" },
    { slug: "pet-water-intake", title: "물 잘 안 마시는 아이 돕는 법", hook: "물그릇 위치만 바꿔도 달라집니다", angle: "꿀팁", points: ["물그릇 여러 곳에 두기", "그릇 재질 바꿔 보기", "변화가 크면 수의사 상담"], save: "반려인 체크리스트로 저장하세요" },
    { slug: "cat-box-love", title: "고양이는 왜 상자에 들어갈까", hook: "비싼 집보다 택배 상자인 이유", angle: "심리", points: ["좁은 공간이 주는 안정감", "높은 곳과 숨을 곳 함께 주기", "상자 하나는 남겨 두기"], save: "냥집사 상식으로 저장해 두세요" },
    { slug: "dog-tail-signs", title: "꼬리만 봐도 기분이 보인다", hook: "흔든다고 다 반가운 게 아닙니다", angle: "반전", points: ["높이와 속도 함께 보기", "몸 전체 신호와 같이 읽기", "경직됐다면 거리 두기"], save: "강아지 언어 사전으로 저장하세요" },
    { slug: "pet-alone-time", title: "혼자 두고 나갈 때 미안함 줄이기", hook: "빈집 시간, 준비하면 달라집니다", angle: "루틴", points: ["나가기 전 산책과 놀이로 에너지 빼기", "노즈워크 장난감 남겨 두기", "인사는 담백하게 하기"], save: "외출 루틴으로 저장해 두세요" },
    { slug: "cat-night-zoomies", title: "새벽 우다다의 이유", hook: "새벽 3시 운동회에는 이유가 있어요", angle: "꿀팁", points: ["남은 에너지가 폭발하는 시간", "자기 전 사냥놀이로 빼 주기", "낮에 충분히 놀아 주기"], save: "꿀잠 원하는 집사라면 저장하세요" },
    { slug: "dog-food-change", title: "사료 바꿀 때 지켜야 할 것", hook: "한 번에 바꾸면 탈이 나기 쉽습니다", angle: "실수", points: ["기존 사료에 조금씩 섞기", "일주일 넘게 천천히 전환", "상태 이상하면 수의사 상담"], save: "사료 교체 전 꼭 저장하세요" },
    { slug: "pet-photo-tips", title: "반려동물 인생샷 찍는 법", hook: "움직여서 못 찍는 게 아닙니다", angle: "꿀팁", points: ["연사 모드로 순간 잡기", "눈높이 맞춰 앉아 찍기", "간식은 렌즈 옆에 들기"], save: "인생샷 도전할 때 참고하세요" },
    { slug: "new-pet-first-week", title: "입양 첫 주, 하지 말아야 할 것", hook: "잘해주고 싶은 마음이 부담될 때", angle: "실수", points: ["첫 주는 조용한 적응 시간 주기", "손님 초대 미루기", "이름 부르며 간식으로 친해지기"], save: "입양 준비 중이라면 저장하세요" },
    { slug: "summer-paw-care", title: "여름 산책, 발바닥부터 챙기세요", hook: "한낮 바닥은 생각보다 뜨겁습니다", angle: "꿀팁", points: ["손등으로 바닥 온도 확인", "한낮 피해 아침저녁 산책", "산책 후 발 상태 확인"], save: "여름 반려 루틴으로 저장하세요" },
    { slug: "pet-dental-habit", title: "이 닦기 거부하는 아이 길들이기", hook: "치약보다 순서가 중요합니다", angle: "루틴", points: ["입 주변 만지기부터 익숙하게", "맛보기용 치약으로 시작", "짧게 자주, 칭찬은 크게"], save: "양치 훈련 로드맵으로 저장하세요" },
  ],
  celeb: [
    { slug: "fan-budget", title: "덕질 지출, 행복하게 관리하는 법", hook: "탕진잼도 계획이 필요합니다", angle: "꿀팁", points: ["월 덕질 예산 먼저 정하기", "한정판은 하루 자고 결정하기", "기록하면 만족도가 올라감"], save: "행복한 덕질을 위해 저장하세요" },
    { slug: "concert-prep", title: "공연 관람 준비물 체크리스트", hook: "현장에서 후회하는 것들, 미리 챙겨요", angle: "꿀팁", points: ["티켓과 신분증 이중 확인", "보조배터리와 물 준비", "이동 동선 미리 확인"], save: "공연 가기 전 꺼내 보세요" },
    { slug: "fan-content-line", title: "팬 콘텐츠 만들 때 지킬 선", hook: "사랑이 민폐가 되지 않으려면", angle: "실수", points: ["공식 가이드라인 확인하기", "2차 창작 표기 지키기", "수익화는 특히 신중하게"], save: "창작하는 팬이라면 저장하세요" },
    { slug: "bias-privacy", title: "좋아할수록 지켜야 할 거리", hook: "사생활은 응원 대상이 아닙니다", angle: "꿀팁", points: ["공식 활동 중심으로 응원하기", "사적 공간 정보 공유하지 않기", "루머 확산에 동참하지 않기"], save: "성숙한 팬 문화로 저장해 두세요" },
    { slug: "merch-storage", title: "굿즈 보관법이 가치를 바꾼다", hook: "쌓아두면 짐, 정리하면 컬렉션", angle: "꿀팁", points: ["직사광선 피해 보관하기", "포토카드는 슬리브에 넣기", "전시 공간 하나 정해 두기"], save: "굿즈 부자라면 저장하세요" },
    { slug: "fandom-friend", title: "덕질 친구 사귀는 법", hook: "같이 좋아하면 두 배로 즐겁습니다", angle: "꿀팁", points: ["온라인 매너부터 지키기", "호칭과 거리감 천천히 좁히기", "금전 거래는 신중하게"], save: "덕질 라이프 팁으로 저장하세요" },
    { slug: "fandom-balance", title: "밤샘 덕질과 일상 지키기", hook: "본진은 결국 내 일상입니다", angle: "루틴", points: ["몰아보기 시간 정해 두기", "수면 시간은 지키기", "현생 목표와 같이 굴리기"], save: "지속 가능한 덕질을 위해 저장하세요" },
    { slug: "event-manner", title: "팬 행사 현장 매너", hook: "모두의 추억을 지키는 방법", angle: "꿀팁", points: ["줄서기 새치기하지 않기", "촬영 규정 미리 확인", "스태프 안내 따르기"], save: "현장 갈 일 있다면 저장하세요" },
    { slug: "rumor-response", title: "내 최애 루머 대처법", hook: "화나도 퍼나르면 지는 겁니다", angle: "실수", points: ["출처 없는 글 공유하지 않기", "공식 입장 기다리기", "악성 게시물은 신고로 대응"], save: "팬심 지키는 법으로 저장하세요" },
    { slug: "return-fan", title: "휴덕 후 복귀하는 법", hook: "돌아오는 덕질이 제일 달콤합니다", angle: "꿀팁", points: ["최근 활동부터 따라잡기", "커뮤니티 분위기 먼저 파악", "무리한 소비로 보상하지 않기"], save: "복귀 덕후 가이드로 저장하세요" },
    { slug: "fan-account-run", title: "팬 계정 운영 기본기", hook: "정보 계정은 신뢰가 생명입니다", angle: "꿀팁", points: ["출처 표기 습관화하기", "확인 안 된 소식엔 물음표", "분쟁 글과는 거리 두기"], save: "계정 운영 원칙으로 저장하세요" },
    { slug: "goods-dupe-check", title: "가짜 굿즈 거르는 법", hook: "공식인 척하는 가품, 많습니다", angle: "실수", points: ["공식 판매처 목록 확인", "시세보다 지나치게 싸면 의심", "거래는 안전결제로 하기"], save: "지갑 지키는 법으로 저장하세요" },
  ],
};

/** 클릭 한 번에 보여줄 주제 수(8~12 요구 범위 안, bank 12개 중 무작위 부분집합). */
const WIZARD_TOPIC_BATCH_SIZE = 9;

/** 카탈로그에 저장하는 생성 주제 레코드. */
type WizardGeneratedTopicRecord = WizardTopicSeed & { topicId: string; category: WizardCategoryId };

function readWizardTopicCatalogFile(): Record<string, WizardGeneratedTopicRecord> {
  const parsed = readAbsJson(WIZARD_TOPIC_CATALOG_PATH) as {
    schemaVersion?: string;
    topics?: Record<string, WizardGeneratedTopicRecord>;
  } | null;
  return parsed && typeof parsed.topics === "object" && parsed.topics != null ? parsed.topics : {};
}

/** 생성 주제 1건을 카탈로그에서 되찾는다(대본/영상 단계 재현용). */
function readWizardGeneratedTopic(topicId: string): WizardGeneratedTopicRecord | null {
  const rec = readWizardTopicCatalogFile()[topicId];
  if (!rec || typeof rec.title !== "string" || !Array.isArray(rec.points)) return null;
  return rec;
}

/** 카테고리별 최근 노출 slug 목록(오래된 것 → 최신 순). 파일이 없으면 빈 기록. */
function readRecentShownSeedSlugs(): Record<string, string[]> {
  const parsed = readAbsJson(WIZARD_TOPIC_RECENT_PATH) as {
    schemaVersion?: string;
    recentByCategory?: Record<string, unknown>;
  } | null;
  const raw = parsed?.recentByCategory;
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, string[]> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (Array.isArray(v)) out[k] = v.filter((s): s is string => typeof s === "string");
  }
  return out;
}

/** 최근 노출 기록 저장 — 실패해도 추천 자체는 계속한다(anti-repeat만 약해질 뿐). */
function writeRecentShownSeedSlugs(map: Record<string, string[]>): void {
  try {
    mkdirSync(dirname(WIZARD_TOPIC_RECENT_PATH), { recursive: true });
    writeFileSync(
      WIZARD_TOPIC_RECENT_PATH,
      JSON.stringify({ schemaVersion: "wizard_topic_recent_shown_v1", recentByCategory: map }, null, 2),
      "utf8",
    );
  } catch {
    // no-op
  }
}

/**
 * 클릭마다 새 주제 묶음을 만든다. 단순 셔플이 아니라 anti-repeat:
 * 최근에 보여준 시드(창 크기 = pool - batch)를 후보에서 빼고 뽑아서,
 * pool이 batch의 2배 이상이면 연속 두 배치는 겹치지 않는다
 * (finance 48개 기준 연속 5회 클릭 = 45개 전부 서로 다른 주제).
 * 생성된 주제는 레포 밖 카탈로그 파일에 누적 저장되어, 이후 대본/음성/영상 단계가
 * topicId만으로 같은 주제 구조를 되찾을 수 있다. 외부 API/LLM 호출 없음.
 */
export function generateWizardTopicBatch(
  category: WizardCategoryId,
): {
  batchId: string;
  category: WizardCategoryId;
  topics: WizardTopic[];
  rejected: Array<{ title: string; overallScore: number; rejectReasons: string[] }>;
} | null {
  const pool = TOPIC_BANK[category];
  if (!pool || pool.length === 0) return null;
  const strict = category === "finance"; // 재테크팁만 엄격 기준(콘텐츠 실패가 반복된 카테고리).

  // 1) 최근 노출 제외 — 남은 후보가 batch보다 적으면 오래된 노출부터 후보로 복귀.
  const recentMap = readRecentShownSeedSlugs();
  const recent = recentMap[category] ?? [];
  const recentSet = new Set(recent);
  const candidates = pool.filter((s) => !recentSet.has(s.slug));
  for (const slug of recent) {
    if (candidates.length >= WIZARD_TOPIC_BATCH_SIZE) break;
    const seed = pool.find((s) => s.slug === slug);
    if (seed && !candidates.includes(seed)) candidates.push(seed);
  }

  // 2) Fisher–Yates 셔플 — batch보다 넉넉히(overfetch) 확보해 품질 필터에 여유를 준다.
  const shuffled = [...candidates];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const overfetch = shuffled.slice(0, Math.min(WIZARD_TOPIC_BATCH_SIZE * 2, shuffled.length));

  // 3) 품질 판정 → 약하면 rewrite 한 번 → 통과 후보만 상위로. 탈락 후보는 details용으로 모은다.
  type Judged = {
    seed: WizardTopicSeed;
    judgment: WizardQualityJudgment;
    rewrittenReasons: string[];
  };
  const judgedAll: Judged[] = overfetch.map((seed) => {
    let s = seed;
    let judgment = judgeTopicSeed(s, strict);
    let rewrittenReasons: string[] = [];
    if (!judgment.passed) {
      const rw = rewriteWeakSeed(s);
      if (rw.reasons.length > 0) {
        const rejudged = judgeTopicSeed(rw.seed, strict);
        // 재작성이 점수를 올린 경우에만 채택(회귀 방지).
        if (rejudged.overallScore >= judgment.overallScore) {
          s = rw.seed;
          judgment = { ...rejudged, rewriteReasons: rw.reasons };
          rewrittenReasons = rw.reasons;
        }
      }
    }
    return { seed: s, judgment, rewrittenReasons };
  });

  const passers = judgedAll
    .filter((j) => j.judgment.passed)
    .sort((a, b) => b.judgment.overallScore - a.judgment.overallScore);
  const rejects = judgedAll.filter((j) => !j.judgment.passed);

  // 통과 후보가 batch보다 적으면(엄격 기준으로 다 걸렸을 때) 차선책으로 상위 점수 후보를 채운다.
  // 단, 절대 하한(FLOOR) 미만은 채우기에서도 제외 — 약한 후보를 화면에 그대로 내보내지 않는다.
  // (그 결과 화면 후보가 batch보다 적어질 수 있음을 허용: 품질 우선.)
  const HARD_FLOOR = 70;
  const backfill = judgedAll
    .filter((j) => !j.judgment.passed && j.judgment.overallScore >= HARD_FLOOR)
    .sort((a, b) => b.judgment.overallScore - a.judgment.overallScore);
  const ordered = passers.length >= WIZARD_TOPIC_BATCH_SIZE ? passers : [...passers, ...backfill];
  const picked = ordered.slice(0, Math.min(WIZARD_TOPIC_BATCH_SIZE, ordered.length));

  // 4) 최근 노출 창 갱신 — 실제로 화면에 낸 seed만 기록.
  const pickedSlugs = new Set(picked.map((p) => p.seed.slug));
  const windowSize = Math.max(0, pool.length - WIZARD_TOPIC_BATCH_SIZE);
  recentMap[category] = [...recent.filter((s) => !pickedSlugs.has(s)), ...picked.map((p) => p.seed.slug)].slice(-windowSize);
  writeRecentShownSeedSlugs(recentMap);

  const records: Array<WizardGeneratedTopicRecord & { _judged: Judged }> = picked.map((p) => ({
    ...p.seed,
    topicId: `gen-${category}-${p.seed.slug}`,
    category,
    _judged: p,
  }));

  // 카탈로그 병합 저장(레포 밖). topicId가 씨앗별로 고정이라 병합은 멱등이다.
  try {
    const existing = readWizardTopicCatalogFile();
    for (const r of records) {
      const { _judged, ...clean } = r;
      existing[r.topicId] = clean;
    }
    mkdirSync(dirname(WIZARD_TOPIC_CATALOG_PATH), { recursive: true });
    writeFileSync(
      WIZARD_TOPIC_CATALOG_PATH,
      JSON.stringify({ schemaVersion: "wizard_topic_catalog_v1", topics: existing }, null, 2),
      "utf8",
    );
  } catch {
    return null; // 카탈로그를 못 쓰면 downstream 재현이 불가능하므로 fail-closed.
  }

  const batchId = `${category}-${Date.now().toString(36)}`;
  return {
    batchId,
    category,
    topics: records.map((r) => ({
      topicId: r.topicId,
      title: r.title,
      hook: r.hook,
      // 프리미엄 시드는 돈+심리+행동 구조 설명(angleNote)을 추천 이유로 그대로 보여준다.
      reason: r.angleNote ?? `${CATEGORY_LABELS[category]} · ${r.angle}형 훅`,
      scriptReady: true, // 대본 생성에 필요한 구조(title/hook/points/save)를 전부 갖는다.
      recommended: false,
      category,
      angle: r.angle,
      qualityScore: r._judged.judgment.overallScore,
      rewrittenReasons: r._judged.rewrittenReasons,
    })),
    rejected: rejects
      .sort((a, b) => b.judgment.overallScore - a.judgment.overallScore)
      .slice(0, 12)
      .map((j) => ({
        title: j.seed.title,
        overallScore: j.judgment.overallScore,
        rejectReasons: j.judgment.rejectReasons,
      })),
  };
}

// ── 규칙 기반 대본 생성(생성 주제용) ─────────────────────────────────────────

const ANGLE_CURIOSITY: Record<WizardTopicAngle, string> = {
  반전: "많이들 반대로 알고 있는 부분이에요.",
  숫자: "기준을 알면 판단이 쉬워집니다.",
  실수: "흔한 실수부터 잡는 게 가장 빠릅니다.",
  루틴: "거창할 것 없이 순서만 지키면 됩니다.",
  심리: "이유를 알면 행동이 달라집니다.",
  꿀팁: "오늘 바로 써먹을 수 있게 정리했어요.",
};

const ANGLE_TWIST: Record<WizardTopicAngle, string> = {
  반전: "핵심은 방향을 바꾸는 것, 그게 전부입니다.",
  숫자: "숫자로 기준을 세우면 흔들리지 않아요.",
  실수: "이것만 피해도 절반은 성공입니다.",
  루틴: "작게 시작해야 오래갑니다.",
  심리: "내 탓이 아니라 구조의 문제였던 거죠.",
  꿀팁: "세 가지 중 하나만 오늘 해보세요.",
};

/** 결정적 훅/전달력 점수(같은 주제는 항상 같은 점수). 규칙 기반 추정치다. */
function estimateScores(seed: WizardTopicSeed): { hookScore: number; clarityScore: number } {
  let hook = 82;
  if (/[?까요]$/.test(seed.hook) || seed.hook.includes("?")) hook += 4;
  if (seed.hook.length <= 20) hook += 4;
  if (seed.angle === "반전" || seed.angle === "심리") hook += 3;
  let clarity = 84;
  if (seed.points.every((p) => p.length <= 20)) clarity += 5;
  if (seed.title.length <= 24) clarity += 3;
  return { hookScore: Math.min(95, hook), clarityScore: Math.min(95, clarity) };
}

/** 문장 끝에 마침표가 없으면 붙인다(낭독문 연결용). */
function endSentence(s: string): string {
  const t = s.trim();
  return /[.!?…]$/.test(t) ? t : `${t}.`;
}

// ── 로컬 품질 평가기 (judge) — 외부 API 없이 텍스트 규칙으로 후보를 점수화한다 ──
// (task: owner-web-local-script-quality-judge-rewrite-engine-v1)
// 목적: "좋아 보이는 문장을 더 쓰는" 대신, 여러 후보를 만들어 점수화하고
//       약한 후보는 rewrite하거나 탈락시켜 상위 후보만 화면에 남긴다.

/** 실제 소비/돈 생활 장면 키워드 — 제목·훅에 있으면 "내 얘기" 구체성이 산다. */
const LIVING_SCENE_KEYWORDS = [
  "월급", "배달", "구독", "카드값", "장바구니", "세일", "퇴근길", "결제", "친구", "이번 달만", "이번 한 번만",
  "할부", "택배", "잔고", "통장", "고지서", "가계부", "알림", "모임", "선물", "피드", "폰", "저축", "이체",
  "소비", "지출", "빚", "살림", "연봉", "수입", "고정비", "비상금", "씀씀이", "구입", "쇼핑", "청구서", "환불",
];
/** 화면에 실제로 보여줄 수 있는(시각화 가능) 오브젝트 키워드. */
const VISUALIZABLE_KEYWORDS = [
  "배달앱", "배달", "장바구니", "택배", "고지서", "청구서", "카드", "통장", "잔고", "결제", "알림", "폰", "화면",
  "옷", "가계부", "구독", "영수증", "지폐", "시계", "쇼핑", "피드", "은행", "앱",
];
/** 추상어 — 구체 행동 없이 단독으로 쓰면 "내 얘기" 느낌이 죽는다. */
const ABSTRACT_ONLY_WORDS = ["선택권", "기준선", "불안", "체면", "비교", "보상심리", "자기합리화", "미래의 나", "정체성", "충분함"];
/** 설명체/훈계/일반론 종결·표현 — AI 말투 감점.
 *  하십시오체 종결은 전부 "니다"로 끝난다(합니다/습니다/입힙니다/봅니다/됩니다 등) → "니다" 종결 전반을 감지. */
const AI_TONE_PATTERNS = /(니다(?=[.!?]?(\s|$))|해야 한다|하십시오|명심하|반드시 기억)/;
/** 약한 설명형 제목 패턴(이유/방법/공통점/체크리스트류). */
const WEAK_TITLE_PATTERN = /(이유|방법|공통점|체크리스트|리뷰법|절약법|돈 모으는 법|부자 되는 법)/;
/** 자기폭로/자기인식 어투 — "내 얘기 같다"를 만드는 표현. */
const SELF_RECOGNITION_PATTERN = /(했다면|적 있|적 없|하는 사람|해 본 적|그런 적|해 봤|본 적 있|해 봤죠|비운|비웠|잠근|멈추는|미룬)/;

/** 로컬 품질 평가 결과 — 축별 0~100 점수 + 탈락/재작성 사유 + 통과 여부. */
export type WizardQualityJudgment = {
  retentionScore: number; // 첫 3초 붙잡는 힘(훅 길이·질문/반전·구체 행동)
  selfRecognitionScore: number; // "내 얘기 같다"는 자기인식
  clarityScore: number; // 요지가 한 문장으로 분명한가
  visualizabilityScore: number; // 영상으로 보여줄 장면이 있는가
  antiAiToneScore: number; // AI 말투/훈계/일반론이 적은가(높을수록 좋음)
  specificityScore: number; // 실제 행동/장면 구체성(추상 비유 과다 감점)
  overallScore: number; // 가중 종합
  rejectReasons: string[]; // 통과 못 한 이유(사람이 읽는 한국어)
  rewriteReasons: string[]; // 재작성으로 고친 이유(rewrite pass가 채운다)
  passed: boolean; // 최소 기준 통과 여부
};

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

/**
 * seed(또는 rewrite된 seed) 하나를 7개 축으로 평가한다. 결정적(같은 입력→같은 점수).
 * 외부 API/LLM 없이 제목/훅/points/save 텍스트 규칙만 쓴다.
 * strict=true(재테크팁)면 통과 기준을 높인다.
 */
export function judgeTopicSeed(seed: WizardTopicSeed, strict: boolean): WizardQualityJudgment {
  const title = seed.title ?? "";
  const hook = seed.hook ?? "";
  const points = seed.points ?? [];
  const save = seed.save ?? "";
  const empathy = seed.empathy ?? "";
  const first3 = `${hook} ${empathy || points[0] || ""}`;
  const allText = `${title} ${hook} ${empathy} ${points.join(" ")} ${save}`;
  const reject: string[] = [];

  const sceneHits = LIVING_SCENE_KEYWORDS.filter((k) => title.includes(k) || hook.includes(k)).length;
  const visualHits = VISUALIZABLE_KEYWORDS.filter((k) => allText.includes(k)).length;
  const abstractOnly =
    ABSTRACT_ONLY_WORDS.some((a) => title.includes(a)) &&
    !LIVING_SCENE_KEYWORDS.some((c) => title.includes(c));

  // 1) retention — 훅 길이(짧을수록↑) + 질문/반전 어투 + 첫 3초 구체 행동
  let retention = 70;
  if (hook.length <= 20) retention += 10;
  else if (hook.length > 30) retention -= 8;
  if (/[?까요죠]$/.test(hook.trim()) || hook.includes("?")) retention += 6;
  if (SELF_RECOGNITION_PATTERN.test(first3)) retention += 8;
  if (sceneHits === 0) { retention -= 12; reject.push("첫 3초에 붙잡을 실제 행동이 약합니다"); }

  // 2) selfRecognition — 자기폭로 어투 + 생활 장면
  let self = 60;
  if (SELF_RECOGNITION_PATTERN.test(`${title} ${hook}`)) self += 22;
  if (sceneHits >= 1) self += 10;
  if (sceneHits >= 2) self += 6;
  if (!SELF_RECOGNITION_PATTERN.test(`${title} ${hook}`) && sceneHits === 0) {
    self -= 18;
    reject.push("'내 얘기 같다'는 자기인식이 약합니다");
  }

  // 3) clarity — 요지가 한 문장으로 분명한가(points 길이·접속 과다)
  let clarity = 80;
  if (points.every((p) => p.length <= 22)) clarity += 8;
  const longPoints = points.filter((p) => p.length > 26).length;
  if (longPoints > 0) { clarity -= longPoints * 6; reject.push("핵심 문장이 한눈에 안 들어옵니다"); }

  // 4) visualizability — 화면에 보여줄 오브젝트가 있는가
  let visual = 62;
  if (seed.visualMetaphor && seed.visualMetaphor.length > 0) visual += 14;
  if (visualHits >= 1) visual += 12;
  if (visualHits >= 3) visual += 6;
  if (visualHits === 0 && !seed.visualMetaphor) { visual -= 14; reject.push("영상으로 보여줄 장면이 부족합니다"); }

  // 5) antiAiTone — 설명체/훈계/일반론이 적을수록↑
  let antiAi = 92;
  const aiHitList = [hook, ...points, empathy].filter((t) => AI_TONE_PATTERNS.test(t));
  if (aiHitList.length > 0) { antiAi -= aiHitList.length * 14; reject.push("설명체·훈계 말투가 남아 있습니다"); }
  if (WEAK_TITLE_PATTERN.test(title)) { antiAi -= 20; reject.push("제목에 이유/방법/공통점류 설명형 패턴이 있습니다"); }

  // 6) specificity — 실제 행동/장면 구체성(추상 단독 감점)
  let specificity = 66;
  specificity += Math.min(24, sceneHits * 8);
  if (abstractOnly) { specificity -= 22; reject.push("추상어가 구체 행동 없이 단독으로 쓰였습니다"); }
  if (/[.。]$/.test(title.trim())) { specificity -= 6; }

  const scores = {
    retentionScore: clamp(retention),
    selfRecognitionScore: clamp(self),
    clarityScore: clamp(clarity),
    visualizabilityScore: clamp(visual),
    antiAiToneScore: clamp(antiAi),
    specificityScore: clamp(specificity),
  };
  // 가중 종합 — 자기인식·retention·antiAi를 무겁게(콘텐츠 실패 원인 축).
  const overall = clamp(
    scores.retentionScore * 0.22 +
      scores.selfRecognitionScore * 0.24 +
      scores.clarityScore * 0.14 +
      scores.visualizabilityScore * 0.12 +
      scores.antiAiToneScore * 0.16 +
      scores.specificityScore * 0.12,
  );
  const passThreshold = strict ? 82 : 72;
  const passed = overall >= passThreshold && !AI_TONE_PATTERNS.test(hook) && !WEAK_TITLE_PATTERN.test(title);
  return { ...scores, overallScore: overall, rejectReasons: [...new Set(reject)], rewriteReasons: [], passed };
}

/**
 * 약한 seed를 로컬 규칙으로 한 번 재작성한다(외부 API 없음). 고친 부분은 rewriteReasons에 남긴다.
 * - 설명체 종결(~습니다/됩니다/입니다/셉니다) → 단정형(~다)
 * - 제목의 이유/방법/공통점류 → 잘라내고 자기폭로형으로
 * - 추상어 단독 제목 → 생활 장면 힌트를 덧붙임(가능할 때만)
 * 재작성해도 못 살리면 passed=false를 유지해 상위 후보에서 탈락시킨다.
 */
export function rewriteWeakSeed(seed: WizardTopicSeed): { seed: WizardTopicSeed; reasons: string[] } {
  const reasons: string[] = [];
  const declarativize = (s: string): string => {
    let out = s;
    const before = out;
    out = out
      .replace(/됩니다(?=[.!?]?$)/, "된다")
      .replace(/입니다(?=[.!?]?$)/, "이다")
      .replace(/셉니다(?=[.!?]?$)/, "세다")
      .replace(/합니다(?=[.!?]?$)/, "한다")
      .replace(/습니다(?=[.!?]?$)/, "다");
    if (out !== before) reasons.push("설명체 종결을 단정형으로 고침");
    return out;
  };

  const next: WizardTopicSeed = {
    ...seed,
    hook: declarativize(seed.hook),
    empathy: seed.empathy ? declarativize(seed.empathy) : seed.empathy,
    points: seed.points.map((p) => declarativize(p)) as [string, string, string],
  };

  // 제목의 약한 설명형 패턴을 제거(끝에 붙은 "…의 이유" 등을 잘라낸다).
  if (WEAK_TITLE_PATTERN.test(next.title)) {
    const trimmed = next.title
      .replace(/,?\s*그?\s*(진짜\s*)?(이유|방법|공통점|체크리스트|리뷰법|절약법)$/, "")
      .replace(/(이유|방법|공통점|체크리스트|리뷰법|절약법)/g, "")
      .replace(/\s{2,}/g, " ")
      .trim();
    if (trimmed.length >= 8 && trimmed !== next.title) {
      next.title = trimmed;
      reasons.push("제목의 설명형(이유/방법)을 걷어냄");
    }
  }

  return { seed: next, reasons: [...new Set(reasons)] };
}

/** 장면 플랜 1칸 — 골든 샘플 6단계(후킹→공감→심리→반전→행동→저장)에 1:1 대응. */
export type WizardScriptScene = {
  id: "hook" | "empathy" | "psychology" | "twist" | "action" | "save";
  label: string;
  narration: string;
  captionText: string;
  visualCue: string; // 이 장면이 어떤 그림/시각 증거로 보여야 하는지(골든 샘플: 이미지가 스토리의 증거)
};

/**
 * 골든 샘플 6단계 장면 플랜을 만든다. 각 장면은 자막 + 시각 증거(visualCue)를 갖는다.
 * (절대규칙: 이미지가 caption 없이도 주제를 전달해야 하고, 카드/타이포는 renderer가 얹는다.)
 */
function buildScenePlan(a: {
  hook: string;
  empathy: string;
  psych: string;
  twist: string;
  action: string;
  save: string;
  visualMetaphor?: string;
  psychologyAnchor?: string;
  successAnchor?: string;
}): WizardScriptScene[] {
  return [
    { id: "hook", label: "1. 후킹", narration: a.hook, captionText: a.hook, visualCue: `${a.visualMetaphor ?? "주제 핵심 오브젝트"} + 큰 훅 카드(첫 2초)` },
    { id: "empathy", label: "2. 공감", narration: a.empathy, captionText: a.empathy, visualCue: "시청자가 '내 얘기'라고 느낄 일상 재현 컷" },
    { id: "psychology", label: "3. 심리 원인", narration: a.psych, captionText: a.psych, visualCue: `심리가 드러나는 클로즈업 (키워드: ${a.psychologyAnchor ?? "심리"})` },
    { id: "twist", label: "4. 반전", narration: a.twist, captionText: a.twist, visualCue: "앞 장면과 반대 구도의 대비 컷 — 착시가 깨지는 순간" },
    { id: "action", label: "5. 행동 전환", narration: a.action, captionText: a.action, visualCue: `손이 실제로 실행하는 장면 (키워드: ${a.successAnchor ?? "행동"})` },
    { id: "save", label: "6. 저장 CTA", narration: a.save, captionText: a.save, visualCue: "핵심 문장 타이포 카드 + 저장 유도" },
  ];
}

/** 골든 샘플 계열 자가 점검 결과(참고용 boolean — 통과 못 해도 차단하지 않고 표시만). */
export type WizardGoldenSampleChecks = {
  selfRelevantHook: boolean; // 훅이 '내 얘기'로 읽히는가
  hasCausalBridges: boolean; // 문제→원인→반전→행동 사이 다리 문장이 있는가
  concreteActionWithTiming: boolean; // 행동 제안에 실행 시점이 있는가
  captionsWithinLimit: boolean; // 자막이 화면 길이(22자) 안인가
};

/**
 * 생성 주제 레코드 → 대본(WizardScriptPreview 동일 구조). topicId가 같으면 항상 같은 대본.
 *
 * 프리미엄 시드(empathy 보유)는 "들킨 느낌"의 자기인식 흐름으로 낭독문을 만든다:
 * 1문장 구체 행동(hook) → 2문장 그 행동 뒤 심리(empathy) → 3문장 돈이 새는 진짜 지점(p1)
 * → [다리: 진짜 문제는 따로] → 반전(p2) → 행동 전환(p3) → 저장 CTA(save).
 * 첫 3문장 안에 실제 행동·심리·돈 새는 패턴이 모두 있어야 한다.
 * "왜 그럴까요?" 같은 질문형 브리지를 남발하지 않고, 반전 앞 다리 1개만 쓴다.
 * "첫째/둘째/셋째" 나열형 문구를 쓰지 않는다. 일반 시드는 기존 나열형 구성을 유지한다.
 */
/** 스타일별 프리미엄 낭독문을 조립한다. 자막 6줄 계약(hook/empathy/p1/p2/p3/save)은 스타일과 무관하게 유지. */
function assemblePremiumVoiceover(
  style: ScriptStyle,
  parts: { hook: string; curiosity: string; p1: string; p2: string; p3: string; save: string },
): string {
  const { hook, curiosity, p1, p2, p3, save } = parts;
  const e = endSentence;
  if (style === "hook_heavy") {
    // 훅을 두 번 때린다: 첫 문장 강한 행동 훅 + 곧바로 돈 새는 지점.
    return [e(hook), e(p1), e(curiosity), "여기서 통장이 무너진다.", e(p2), e(p3), e(save)].join(" ");
  }
  if (style === "reversal") {
    // 반전을 앞으로: 통념 → 뒤집기.
    return [e(hook), e(curiosity), "그런데 반대였다.", e(p1), e(p2), e(p3), e(save)].join(" ");
  }
  // empathy(기본): 구체 행동 → 심리 → 돈 새는 지점 → 절제된 다리 1개.
  return [e(hook), e(curiosity), e(p1), "진짜 문제는 따로 있다.", e(p2), e(p3), e(save)].join(" ");
}

/** 낭독문 텍스트를 보고 스타일별 강점을 소폭 가산한다(결정적, 최고점 선택용). */
function scoreVoiceoverStyle(style: ScriptStyle, base: WizardQualityJudgment, voiceover: string): number {
  let bonus = 0;
  if (style === "hook_heavy" && /무너진다|여기서/.test(voiceover)) bonus += 3;
  if (style === "reversal" && /반대|진짜 문제/.test(voiceover)) bonus += 2;
  if (style === "empathy" && /적 있|했다면|그런 적/.test(voiceover)) bonus += 4; // 자기인식 흐름 우대
  return clamp(base.overallScore + bonus);
}

function buildScriptFromGeneratedTopic(rec: WizardGeneratedTopicRecord): WizardScriptPreview {
  const [p1, p2, p3] = rec.points;
  const isPremium = typeof rec.empathy === "string" && rec.empathy.trim().length > 0;
  const strict = rec.category === "finance";
  const curiosity = isPremium ? rec.empathy!.trim() : (ANGLE_CURIOSITY[rec.angle] ?? ANGLE_CURIOSITY["꿀팁"]);
  // 프리미엄은 points[1]이 반전 문장이므로 twist 슬롯에도 그 문장을 쓴다(대본 구조 표기용).
  const twist = isPremium ? p2 : (ANGLE_TWIST[rec.angle] ?? ANGLE_TWIST["꿀팁"]);

  // 대본을 하나만 내지 않고 3스타일 후보를 만들어 최고점을 기본으로 고른다.
  const baseJudgment = judgeTopicSeed(rec, strict);
  const parts = { hook: rec.hook, curiosity, p1, p2, p3, save: rec.save };
  const styleOrder: ScriptStyle[] = ["hook_heavy", "empathy", "reversal"];
  const candidates = styleOrder.map((style) => {
    const voiceover = isPremium
      ? assemblePremiumVoiceover(style, parts)
      : `${rec.hook} ${curiosity} 첫째, ${p1}. 둘째, ${p2}. 셋째, ${p3}. ${twist} ${rec.save}.`;
    return { style, voiceover, score: scoreVoiceoverStyle(style, baseJudgment, voiceover) };
  });
  // 최고점 선택(동점이면 styleOrder 우선순위 유지 = 안정 정렬).
  const best = candidates.reduce((a, b) => (b.score > a.score ? b : a), candidates[0]);
  const fullVoiceover = best.voiceover;
  // 표시 점수는 선택된 후보(스타일 보너스 반영) 기준으로 일관되게 맞춘다.
  const judgment: WizardQualityJudgment = { ...baseJudgment, overallScore: best.score };

  const { hookScore, clarityScore } = estimateScores(rec);
  const captionLines = [rec.hook, curiosity, p1, p2, p3, rec.save];

  // 사람이 읽는 품질 요약(좋은 이유 / 고친 부분 / 주의할 점) — 2~4줄용.
  const goodReasons: string[] = [];
  if (baseJudgment.selfRecognitionScore >= 78) goodReasons.push("훅이 '내 얘기' 같아 첫 3초가 강합니다");
  if (baseJudgment.retentionScore >= 78) goodReasons.push("첫 문장에 실제 행동이 있어 끝까지 봅니다");
  if (baseJudgment.visualizabilityScore >= 74) goodReasons.push("영상으로 보여줄 장면이 분명합니다");
  if (baseJudgment.antiAiToneScore >= 85) goodReasons.push("설명체·훈계 말투가 거의 없습니다");
  if (goodReasons.length === 0) goodReasons.push("자기인식형 훅 구조를 지키고 있습니다");

  const fixedParts = [...baseJudgment.rewriteReasons];
  if (fixedParts.length === 0) fixedParts.push("자동 재작성 없이 기준을 통과했습니다");

  const watchOuts = [...baseJudgment.rejectReasons];
  if (watchOuts.length === 0) watchOuts.push("특별한 약점은 발견되지 않았습니다");

  return {
    topicId: rec.topicId,
    title: rec.title,
    hook: rec.hook,
    hookLine: rec.hook,
    curiosity,
    points: [...rec.points],
    twist,
    action: rec.save,
    captionLines,
    fullVoiceover,
    scenes: buildScenePlan({
      hook: rec.hook,
      empathy: curiosity,
      psych: p1,
      twist: p2,
      action: p3,
      save: rec.save,
      visualMetaphor: rec.visualMetaphor,
      psychologyAnchor: rec.psychologyAnchor,
      successAnchor: rec.successAnchor,
    }),
    captionFirstLineHook: rec.hook,
    uploadCaptionDraft: `${rec.hook}\n${curiosity}\n\n${p2}\n${p3}\n\n${rec.save}`,
    goldenSampleChecks: {
      // 자기인식형: 2인칭 지칭 또는 "~했다면/~적 있죠/~하는 사람" 같은 들킨-느낌 어투를 인정.
      selfRelevantHook:
        /(나|내 |내가|당신|우리|했다면|적 있|하는 사람|계신가요|있나요|있었나요|비웠|잠근)/.test(
          `${rec.title} ${rec.hook} ${curiosity}`,
        ),
      hasCausalBridges: isPremium,
      concreteActionWithTiming: /(월급|결제|오늘|이번 주|주말|밤|아침|다음)/.test(rec.save),
      captionsWithinLimit: captionLines.every((c) => c.length <= 22),
    },
    hookScore,
    clarityScore,
    quality: judgment,
    selectedStyle: SCRIPT_STYLE_LABELS[best.style],
    qualitySummary: {
      goodReasons: goodReasons.slice(0, 3),
      fixedParts: fixedParts.slice(0, 3),
      watchOuts: watchOuts.slice(0, 3),
    },
    candidateScores: candidates.map((c) => ({
      style: SCRIPT_STYLE_LABELS[c.style],
      overallScore: c.score,
      selected: c.style === best.style,
    })),
  };
}

export type WizardScriptPreview = {
  topicId: string;
  title: string;
  hook: string;
  /** 첫 2초 훅(=hook, UI 표기용 명시 필드) */
  hookLine: string;
  curiosity: string;
  points: string[];
  twist: string;
  action: string;
  captionLines: string[];
  fullVoiceover: string;
  /** 골든 샘플 6단계 장면/자막 플랜 */
  scenes: WizardScriptScene[];
  /** 업로드 caption 첫 줄(훅) */
  captionFirstLineHook: string;
  /** 업로드용 설명 초안 */
  uploadCaptionDraft: string;
  goldenSampleChecks: WizardGoldenSampleChecks;
  hookScore: number | null;
  clarityScore: number | null;
  /** 로컬 품질 평가 — 대본 후보를 점수화한 결과(최고점 후보 기준). */
  quality: WizardQualityJudgment;
  /** 선택된 후보 스타일(강한 후킹형/공감형/반전형 중 최고점). */
  selectedStyle: string;
  /** 사람이 읽는 요약: 좋은 이유 / 고친 부분 / 주의할 점 (각 2~4줄용). */
  qualitySummary: {
    goodReasons: string[];
    fixedParts: string[];
    watchOuts: string[];
  };
  /** 후보 3안 점수(개발자 details용). */
  candidateScores: Array<{ style: string; overallScore: number; selected: boolean }>;
};

/** 대본 스타일 후보 — 같은 주제를 3가지 앵글로 조립해 최고점을 고른다. */
type ScriptStyle = "hook_heavy" | "empathy" | "reversal";
const SCRIPT_STYLE_LABELS: Record<ScriptStyle, string> = {
  hook_heavy: "강한 후킹형",
  empathy: "공감형",
  reversal: "반전형",
};

/** 선택한 주제의 규칙 기반 대본(이미 컴파일된 로컬 결과)을 돌려준다. 없으면 null. */
export function readScriptPreview(topicId: string): WizardScriptPreview | null {
  const compiled = readRepoJson(FIXTURE_SCRIPT_COMPILER_OUTPUT) as {
    topics?: Array<{
      topicId?: string;
      selectedCandidateId?: string;
      candidates?: Array<{
        candidateId?: string;
        selectedHookText?: string;
        script?: {
          topic?: string;
          hook?: string;
          curiosity?: string;
          points?: string[];
          twist_or_reframe?: string;
          action_or_save_reason?: string;
          caption_lines?: string[];
          full_voiceover?: string;
        };
        scores?: { hook_score?: number; script_clarity_score?: number };
      }>;
    }>;
  } | null;
  const t = (compiled?.topics ?? []).find((x) => x.topicId === topicId);
  if (!t) {
    // 컴파일 fixture에 없으면 생성 주제 카탈로그에서 찾아 규칙 기반으로 대본을 만든다.
    const generated = readWizardGeneratedTopic(topicId);
    return generated ? buildScriptFromGeneratedTopic(generated) : null;
  }
  const cand = (t.candidates ?? []).find((c) => c.candidateId === t.selectedCandidateId) ?? (t.candidates ?? [])[0];
  const s = cand?.script;
  if (!s?.topic) return null;
  const hook = cand?.selectedHookText ?? s.hook ?? "";
  const points = s.points ?? [];
  const captionLines = s.caption_lines ?? [];
  const action = s.action_or_save_reason ?? "";
  const fullVoiceover = s.full_voiceover ?? "";
  return {
    topicId,
    title: s.topic,
    hook,
    hookLine: hook,
    curiosity: s.curiosity ?? "",
    points,
    twist: s.twist_or_reframe ?? "",
    action,
    captionLines,
    fullVoiceover,
    // 컴파일 fixture 대본도 같은 6단계 장면 플랜으로 노출한다(시각 큐는 일반형).
    scenes: buildScenePlan({
      hook,
      empathy: s.curiosity ?? "",
      psych: points[0] ?? "",
      twist: s.twist_or_reframe ?? points[1] ?? "",
      action: points[2] ?? action,
      save: action,
    }),
    captionFirstLineHook: hook,
    uploadCaptionDraft: `${hook}\n\n${fullVoiceover}`.trim(),
    goldenSampleChecks: {
      selfRelevantHook: /(나|내 |내가|당신|우리)/.test(`${s.topic} ${hook}`),
      hasCausalBridges: !/첫째|둘째|셋째/.test(fullVoiceover),
      concreteActionWithTiming: /(월급|결제|오늘|이번 주|주말|밤|아침|다음)/.test(action),
      captionsWithinLimit: captionLines.every((c) => c.length <= 22),
    },
    hookScore: cand?.scores?.hook_score ?? null,
    clarityScore: cand?.scores?.script_clarity_score ?? null,
    // fixture 대본도 같은 로컬 품질 평가기로 점수화한다(seed 형태로 변환 후 judge).
    ...(() => {
      const pseudoSeed: WizardTopicSeed = {
        slug: "fixture",
        title: s.topic ?? "",
        hook,
        angle: "심리",
        points: [points[0] ?? "", points[1] ?? "", points[2] ?? ""],
        save: action,
        empathy: s.curiosity ?? "",
      };
      const judgment = judgeTopicSeed(pseudoSeed, false);
      return {
        quality: judgment,
        selectedStyle: "컴파일 대본",
        qualitySummary: {
          goodReasons: judgment.overallScore >= 75 ? ["컴파일된 대본 기준을 통과했습니다"] : ["컴파일된 로컬 대본입니다"],
          fixedParts: ["자동 재작성 없이 그대로 사용합니다"],
          watchOuts: judgment.rejectReasons.length > 0 ? judgment.rejectReasons.slice(0, 3) : ["특별한 약점은 발견되지 않았습니다"],
        },
        candidateScores: [{ style: "컴파일 대본", overallScore: judgment.overallScore, selected: true }],
      };
    })(),
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// 선택 주제 → topic-specific 파이프라인 입력 생성 (repo 밖, no-upload, no-secret)
// ══════════════════════════════════════════════════════════════════════════════

/**
 * 검증된 topicId를 파일시스템/경로에 안전한 slug로 변환한다.
 * 영문 소문자/숫자/하이픈만 남기며, 이 값만 경로 조각으로 쓴다(사용자 입력 원문은 경로에 넣지 않음).
 * 결과가 비면 null(입력 생성 자체를 막는다).
 */
export function toSafeTopicSlug(topicId: string): string | null {
  const slug = String(topicId ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  return slug.length > 0 ? slug : null;
}

/** 한 캡션 줄을 ASS/자막 폭에 맞게 자른다(원본 대본 텍스트만 사용, 새 주장 생성 금지). */
function trimCaption(text: string, max = 22): string {
  const t = String(text ?? "").trim();
  if (t.length <= max) return t;
  return t.slice(0, max - 1).trimEnd() + "…";
}

export type WizardVideoInputPaths = {
  topicId: string;
  safeSlug: string;
  inputDir: string;
  outRoot: string;
  manifestPath: string;
  ttsScriptPath: string;
  uploadMetadataPath: string;
  ownerApprovalPath: string;
  /** 실제 mp4 자막으로 구워질 씬별 캡션(검증용으로 route가 참조). */
  sceneCaptions: string[];
};

/**
 * 선택한 ready 주제의 대본으로 topic-specific 파이프라인 입력 4종을 repo 밖에 생성한다.
 * 기존 provider fixture schema를 따르되 manifestId/ids/captions/title/caption을
 * 선택 주제에 맞게 채워, 파이프라인이 만드는 mp4 자막·upload payload에 주제가 반영되게 한다.
 *
 * 안전 계약:
 * - 모든 경로는 repo 밖 WIZARD_INPUTS_ROOT\<safeSlug> 아래. safeSlug는 [a-z0-9-]만.
 * - local_mock / notUploaded:true / ownerApprovalRequired:true / actualUploadAllowed:false 유지.
 * - 외부 API/secret/upload 없음. 데이터 파일만 쓴다.
 */
export function buildWizardVideoInputsForTopic(topicId: string): { ok: true; paths: WizardVideoInputPaths } | { ok: false; reason: string } {
  const safeSlug = toSafeTopicSlug(topicId);
  if (!safeSlug) return { ok: false, reason: "topic_id_invalid_or_empty" };

  // 확정 대본(Claude 보정 반영본)이 있으면 그것을 쓴다 — 시안/최종이 같은 대본을 공유한다.
  const script = readWizardFinalScript(topicId) ?? readScriptPreview(topicId);
  if (!script) return { ok: false, reason: "script_not_compiled_for_topic" };

  // 6씬 구조로 대본을 매핑한다. narration은 원본 대본 텍스트만 사용한다.
  const points = script.points.length > 0 ? script.points : [];
  const sceneNarrations = [
    script.hook,
    script.curiosity || points[0] || script.hook,
    points[0] || script.curiosity || script.hook,
    points[1] || points[0] || script.twist,
    points[2] || script.twist || points[1] || script.action,
    script.action || script.twist,
  ].map((s) => String(s ?? "").trim() || script.hook);

  // 자막은 대본이 이미 만든 caption_lines를 우선 사용(없으면 narration에서 파생).
  const capSource = script.captionLines.length > 0 ? script.captionLines : sceneNarrations;
  const sceneCaptions = [0, 1, 2, 3, 4, 5].map((i) => trimCaption(capSource[i] ?? sceneNarrations[i] ?? script.hook));

  const sceneDur = [4, 5, 6, 6, 4, 5];
  const sceneStart = [0, 4, 9, 15, 21, 25];
  const sceneEnd = [4, 9, 15, 21, 25, 30];
  const sceneRoles = ["hook", "signal", "why_expert_interpretation", "life_impact", "watch_scenario_outlook", "action_closing"];

  const manifestId = `rp-wizard-${safeSlug}`;
  const sourceId = `money-shorts-wizard-${safeSlug}`;
  const ttsPackageId = `tts-${sourceId}`;

  const renderManifest = {
    schemaVersion: "money_shorts_render_plan_v1",
    manifestId,
    sourceId,
    sourceType: "script_package",
    factCardIds: [`fact-card-wizard-${safeSlug}`],
    sourceCitationIds: [`citation-wizard-${safeSlug}`],
    timelineId: `timeline-${sourceId}`,
    ttsPackageId,
    imagePromptPackageId: null,
    chartCardPackageId: null,
    riskLevel: "unchecked",
    createdAt: "2026-07-08T00:00:00+09:00",
    wizardTopicId: topicId,
    wizardTopicTitle: script.title,
    outputSpec: {
      codec: "h264",
      audioCodec: "aac",
      container: "mp4",
      crf: 23,
      audioBitrateKbps: 128,
      fps: 30,
      dimensions: { widthPx: 1080, heightPx: 1920 },
      plannedOutputPath: `output/planned/${sourceId}.mp4`,
    },
    imageInputs: [0, 1, 2, 3, 4, 5].map((i) => ({
      sceneId: `scene-${sourceId}-${i + 1}`,
      sceneIndex: i + 1,
      assetPath: `assets/images/${sourceId}/scene-${i + 1}.jpg`,
      assetSourceType: "placeholder",
      imagePromptPackageId: null,
      sceneImagePromptId: null,
      chartCardPackageId: null,
      durationSec: sceneDur[i],
      motionType: "card_slide",
    })),
    audioInput: {
      ttsPackageId,
      voiceProfileId: "voice-local-mock",
      provider: "local_mock",
      assetPath: `assets/audio/${ttsPackageId}.mp3`,
      plannedDurationSec: 30,
    },
    captionOverlays: [0, 1, 2, 3, 4, 5].map((i) => ({
      sceneId: `scene-${sourceId}-${i + 1}`,
      sceneIndex: i + 1,
      captionText: sceneCaptions[i],
      showAtSec: sceneStart[i],
      hideAtSec: sceneEnd[i],
      captionStyle: "bold_short_center_lower",
    })),
    sourceOverlays: [
      {
        sourceName: `wizard-local-mock-${safeSlug}`,
        sourceUrl: `https://placeholder.source/wizard-${safeSlug}`,
        publishedDate: "placeholder",
        showAtSec: 27,
        hideAtSec: 30,
      },
    ],
    // render duration plan (data-only). render script reads estimatedDurationSec; falls back to imageInputs sum.
    renderPlan: {
      fullCommand: "render-plan placeholder (data-only — not executed from JSON)",
      fragments: [],
      plannedOutputPath: `output/planned/${sourceId}.mp4`,
      estimatedDurationSec: 30,
    },
  };

  const ttsScript = {
    schemaVersion: "money_shorts_tts_script_v1",
    scriptId: `tts-script-wizard-${safeSlug}-local-mock`,
    manifestId,
    factCardId: `fact-card-wizard-${safeSlug}`,
    ttsProvider: "local_mock",
    ttsMode: "local_mock",
    voiceProfile: "local_mock_placeholder",
    targetDurationSec: 30,
    wizardTopicId: topicId,
    riskNotes: [
      "local_mock TTS: Windows placeholder noise audio — not real speech.",
      "Final voice quality must be validated with ElevenLabs or OpenAI TTS in a dedicated quality-check task.",
      "Narration text is derived from the selected topic's rule-based script for reference.",
      "This mux task validates pipeline (audio track attachment, duration, codec) only — not voice quality.",
    ],
    scenes: [0, 1, 2, 3, 4, 5].map((i) => ({
      sceneNumber: i + 1,
      sceneRole: sceneRoles[i],
      durationSec: sceneDur[i],
      startSec: sceneStart[i],
      endSec: sceneEnd[i],
      ttsText: sceneNarrations[i],
      narration: sceneNarrations[i],
      captionText: sceneCaptions[i],
    })),
  };

  // upload metadata — 선택 title/caption/hashtags 기반, no-upload 마커 유지.
  const cleanTitle = script.title.trim();
  const hookLine = script.hook.trim();
  const bodyLines = [script.curiosity, ...points, script.twist, script.action]
    .map((x) => String(x ?? "").trim())
    .filter((x) => x.length > 0);
  const description = `${hookLine}\n\n${bodyLines.join("\n")}\n\n주의: 이 영상은 투자 권고가 아닙니다. 생활 지출 점검의 단서로만 활용하세요.`;
  const igCaption = `${cleanTitle}\n\n${hookLine}\n\n투자 권고 아님 — 내 지출 구조 점검용 정보입니다.`;
  const hashtags = ["재테크", "생활경제", "돈관리", "경제신호", "쇼츠"];

  const uploadMetadata = {
    schemaVersion: "money_shorts_upload_metadata_v1",
    metadataId: `upload-metadata-wizard-${safeSlug}-local-mock`,
    sourceManifestId: manifestId,
    mode: "local_mock",
    ownerApprovalRequired: true,
    notUploaded: true,
    wizardTopicId: topicId,
    wizardTopicTitle: cleanTitle,
    platforms: ["youtube_shorts", "instagram_reels"],
    youtube_shorts: {
      title: `${cleanTitle} #재테크 #생활경제 #쇼츠`.slice(0, 100),
      description,
      hashtags,
      visibilityPlan: "owner_review_first",
      categoryId: "27",
      defaultLanguage: "ko",
      madeForKids: false,
    },
    instagram_reels: {
      caption: igCaption,
      hashtags: [...hashtags, "인스타릴스"],
      visibilityPlan: "owner_review_first",
    },
    riskNotes: [
      "local_mock: no real account, channel, token, or credential used.",
      "ownerApprovalRequired=true — Owner must review and approve before any actual upload.",
      "notUploaded=true — this is a data-only payload. No upload has occurred.",
      "Title/description/caption are derived from the selected topic's rule-based script draft. Owner should review before upload.",
      "No OAuth, accessToken, refreshToken, or API credentials are present in this fixture.",
    ],
  };

  const ownerApproval = {
    schemaVersion: "money_shorts_owner_upload_approval_v1",
    approvalId: `owner-approval-wizard-${safeSlug}-local-mock-001`,
    mode: "local_mock",
    approvalStatus: "approved",
    approvedFor: "dry_run_upload_ready_packet_only",
    uploadPayloadId: `upload-payload-${manifestId}-local-mock`,
    sourceManifestId: manifestId,
    approvedPlatforms: ["youtube_shorts", "instagram_reels"],
    ownerApprovalRequired: true,
    actualUploadAllowed: false,
    actualUploadPerformed: false,
    approvalTimestamp: "2026-07-08T00:00:00.000Z",
    approvalNotes: "local_mock dry-run only — no real account, channel, token, credential, or upload allowed.",
    riskNotes: [
      "local_mock: this is a simulated owner approval fixture for pipeline validation only.",
      "actualUploadAllowed=false — no actual upload may occur from this approval.",
      "actualUploadPerformed=false — confirmed no upload has been performed.",
      "approvedFor=dry_run_upload_ready_packet_only — approval covers packet generation only.",
      "Real upload requires a separate explicit Owner approval with live credentials, channel, and account.",
    ],
  };

  const inputDir = join(WIZARD_INPUTS_ROOT, safeSlug);
  const outRoot = join(WIZARD_VIDEO_OUT_ROOT, safeSlug);
  const manifestPath = join(inputDir, "render-manifest.visual-only.json");
  const ttsScriptPath = join(inputDir, "tts-script.local-mock.json");
  const uploadMetadataPath = join(inputDir, "upload-metadata.local-mock.json");
  const ownerApprovalPath = join(inputDir, "owner-upload-approval.local-mock.json");

  try {
    mkdirSync(inputDir, { recursive: true });
    writeFileSync(manifestPath, JSON.stringify(renderManifest, null, 2), "utf8");
    writeFileSync(ttsScriptPath, JSON.stringify(ttsScript, null, 2), "utf8");
    writeFileSync(uploadMetadataPath, JSON.stringify(uploadMetadata, null, 2), "utf8");
    writeFileSync(ownerApprovalPath, JSON.stringify(ownerApproval, null, 2), "utf8");
  } catch (e) {
    return { ok: false, reason: `input_write_failed:${(e as Error).message}` };
  }

  return {
    ok: true,
    paths: {
      topicId,
      safeSlug,
      inputDir,
      outRoot,
      manifestPath,
      ttsScriptPath,
      uploadMetadataPath,
      ownerApprovalPath,
      sceneCaptions,
    },
  };
}

export type WizardVoiceStatus = {
  exists: boolean;
  durationSec: number | null;
  audioPath: string | null;
  audioBytes: number | null;
  notRealSpeech: boolean;
};

/** 음성 시안 산출물 상태(local_mock TTS summary). */
export function readVoiceSampleStatus(topicId?: string | null): WizardVoiceStatus {
  const slug = topicId ? toSafeTopicSlug(topicId) : null;
  const voiceDir = slug ? join(WIZARD_VOICE_OUT_DIR, slug) : WIZARD_VOICE_OUT_DIR;
  const summary = readAbsJson(join(voiceDir, "local-mock-tts-audio-summary.json")) as {
    audioPath?: string;
    rawAudioDurationSec?: number;
    notRealSpeech?: boolean;
  } | null;
  const audioPath = typeof summary?.audioPath === "string" ? summary.audioPath : null;
  return {
    exists: audioPath != null && existsSync(audioPath),
    durationSec: typeof summary?.rawAudioDurationSec === "number" ? summary.rawAudioDurationSec : null,
    audioPath,
    audioBytes: audioPath ? fileBytes(audioPath) : null,
    notRealSpeech: summary?.notRealSpeech !== false,
  };
}

export type WizardVideoStatus = {
  exists: boolean;
  flowStatus: string | null;
  steps: Array<{ id: string; status: string }>;
  muxedMp4Path: string | null;
  muxedMp4Bytes: number | null;
  silentMp4Path: string | null;
  silentMp4Bytes: number | null;
  notUploaded: boolean;
  /** 이 산출물이 어떤 선택 주제로 만들어졌는지(입력 manifest에서 확인). */
  topicId: string | null;
  topicTitle: string | null;
};

/**
 * topicId → 산출물 out-root를 고른다. topicId가 유효하면 topic별 폴더,
 * 없으면 기존 고정 폴더(하위 호환)를 쓴다. 반환 경로는 항상 repo 밖.
 */
function wizardOutRootFor(topicId?: string | null): string {
  const slug = topicId ? toSafeTopicSlug(topicId) : null;
  return slug ? join(WIZARD_VIDEO_OUT_ROOT, slug) : WIZARD_VIDEO_OUT_ROOT;
}

/** 시안 영상 파이프라인 산출물 상태(run summary + mp4 파일 존재/크기). */
export function readWizardVideoStatus(topicId?: string | null): WizardVideoStatus {
  const outRoot = wizardOutRootFor(topicId);
  const summary = readAbsJson(join(outRoot, "pipeline-run-summary.local-mock.json")) as {
    flowStatus?: string;
    // 파이프라인 summary의 step 항목은 { step, status, exitCode } 형식이다.
    steps?: Array<{ step?: string; id?: string; status?: string }>;
    artifacts?: { visualOnlyMp4?: string; ttsMuxMp4?: string };
    notUploaded?: boolean;
  } | null;
  const muxed = typeof summary?.artifacts?.ttsMuxMp4 === "string" ? summary.artifacts.ttsMuxMp4 : null;
  const silent = typeof summary?.artifacts?.visualOnlyMp4 === "string" ? summary.artifacts.visualOnlyMp4 : null;

  // 생성 manifest에서 이 산출물의 실제 주제를 확인한다(검증/표시용).
  let topicOfArtifact: string | null = null;
  let titleOfArtifact: string | null = null;
  const slug = topicId ? toSafeTopicSlug(topicId) : null;
  if (slug) {
    const manifest = readAbsJson(join(WIZARD_INPUTS_ROOT, slug, "render-manifest.visual-only.json")) as {
      wizardTopicId?: string;
      wizardTopicTitle?: string;
    } | null;
    topicOfArtifact = typeof manifest?.wizardTopicId === "string" ? manifest.wizardTopicId : null;
    titleOfArtifact = typeof manifest?.wizardTopicTitle === "string" ? manifest.wizardTopicTitle : null;
  }

  return {
    exists: muxed != null && existsSync(muxed),
    flowStatus: summary?.flowStatus ?? null,
    steps: (summary?.steps ?? [])
      .map((s) => ({ id: s.step ?? s.id ?? "", status: s.status ?? "" }))
      .filter((s) => s.id !== "" && s.status !== ""),
    muxedMp4Path: muxed,
    muxedMp4Bytes: muxed ? fileBytes(muxed) : null,
    silentMp4Path: silent,
    silentMp4Bytes: silent ? fileBytes(silent) : null,
    notUploaded: summary?.notUploaded !== false,
    topicId: topicOfArtifact,
    topicTitle: titleOfArtifact,
  };
}

/**
 * 시안 영상 파일 바이트를 돌려준다(브라우저 미리보기 스트림용).
 * 경로는 클라이언트 입력이 아니라 파이프라인 summary에서만 나오며,
 * `C:\tmp\money-shorts-os\` 아래의 `.mp4`만 허용한다(경로 조작 원천 차단).
 */
export function readWizardVideoBytes(which: "muxed" | "silent" | "final", topicId?: string | null): Buffer | null {
  let p: string | null = null;
  if (which === "final") {
    // 최종 영상(실제 음성+실제 이미지) — real-video summary가 가리키는 파일만 신뢰한다.
    p = readWizardRealMediaState(topicId ?? "").finalVideo.mp4Path;
  } else {
    const status = readWizardVideoStatus(topicId);
    p = which === "muxed" ? status.muxedMp4Path : status.silentMp4Path;
  }
  if (!p) return null;
  const abs = resolve(p);
  if (!abs.startsWith(WIZARD_VIDEO_ALLOWED_PREFIX)) return null;
  if (!abs.toLowerCase().endsWith(".mp4")) return null;
  if (!existsSync(abs)) return null;
  try {
    return readFileSync(abs);
  } catch {
    return null;
  }
}

/**
 * 실제 TTS 오디오 바이트(브라우저 audio player 스트림용).
 * 경로는 클라이언트 입력이 아니라 TTS summary에서만 나오며,
 * `C:\tmp\money-shorts-os\` 아래의 .mp3/.m4a만 허용한다(경로 조작 원천 차단).
 */
export function readWizardRealAudioBytes(topicId?: string | null): { bytes: Buffer; contentType: string } | null {
  const media = readWizardRealMediaState(topicId ?? "");
  const p = media.realTts.audioPath;
  if (!p) return null;
  const abs = resolve(p);
  if (!abs.startsWith(WIZARD_VIDEO_ALLOWED_PREFIX)) return null;
  const lower = abs.toLowerCase();
  const contentType = lower.endsWith(".mp3") ? "audio/mpeg" : lower.endsWith(".m4a") ? "audio/mp4" : null;
  if (!contentType) return null;
  if (!existsSync(abs)) return null;
  try {
    return { bytes: readFileSync(abs), contentType };
  } catch {
    return null;
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// 게시 전 점검 + 실제 업로드 — content unit 생성/preflight·result 읽기
// task: owner-web-auto-topic-refresh-and-upload-button-v1
// ══════════════════════════════════════════════════════════════════════════════

/** 카테고리별 업로드용 해시태그(8~12개, 금지 트렌드 단어 없음 — orchestrator gate 기준). */
const CATEGORY_HASHTAGS: Record<WizardCategoryId, string[]> = {
  finance: ["재테크", "돈관리", "절약", "저축", "생활경제", "월급관리", "소비습관", "가계부", "경제공부", "쇼츠"],
  ai: ["AI활용", "인공지능", "생산성", "자기계발", "꿀팁", "디지털활용", "업무자동화", "공부법", "라이프핵", "쇼츠"],
  meme: ["짤", "유머", "웃음", "단톡방", "카톡", "인터넷문화", "드립", "일상유머", "소통", "쇼츠"],
  news: ["미디어리터러시", "정보확인", "팩트체크", "뉴스읽기", "상식", "정보", "디지털리터러시", "생활정보", "알쓸신잡", "쇼츠"],
  tmi: ["상식", "과학상식", "생활과학", "궁금증", "알쓸신잡", "지식", "호기심", "일상과학", "생활꿀팁", "쇼츠"],
  game: ["게임", "게이머", "게임클립", "이스포츠", "게임팁", "멘탈관리", "취미", "플레이팁", "게임문화", "쇼츠"],
  animal: ["반려동물", "강아지", "고양이", "펫스타그램", "반려생활", "집사", "멍멍이", "냥이", "동물상식", "쇼츠"],
  celeb: ["덕질", "팬문화", "팬활동", "굿즈", "공연", "취미생활", "덕후", "팬심", "케이팝", "쇼츠"],
};

/** 카테고리별 YouTube categoryId(표준 카테고리). */
const CATEGORY_YT_ID: Record<WizardCategoryId, string> = {
  finance: "27", // Education
  ai: "28", // Science & Technology
  meme: "24", // Entertainment
  news: "24",
  tmi: "27",
  game: "20", // Gaming
  animal: "15", // Pets & Animals
  celeb: "24",
};

export type WizardPublishPaths = {
  topicId: string;
  safeSlug: string;
  contentId: string;
  version: string;
  contentUnitPath: string;
  publishOutDir: string;
  ledgerPath: string;
  muxedMp4Path: string;
  titleBase: string;
};

/**
 * 선택 주제로 만든 시안 영상을 dual_platform_content_unit_v1 스키마로 감싼다.
 * 게시 전 점검(wizardPreflight, --arm 없음)과 실제 업로드(actualUpload, --arm)가
 * 같은 content unit을 사용한다. 데이터 파일만 쓰며 외부 호출은 없다.
 *
 * fail-closed: 대본 없음/영상 없음/경로 비신뢰면 ok:false.
 */
export function buildWizardContentUnitForTopic(
  topicId: string,
): { ok: true; paths: WizardPublishPaths } | { ok: false; reason: string } {
  const safeSlug = toSafeTopicSlug(topicId);
  if (!safeSlug) return { ok: false, reason: "topic_id_invalid_or_empty" };

  const script = readWizardFinalScript(topicId) ?? readScriptPreview(topicId);
  if (!script) return { ok: false, reason: "script_not_compiled_for_topic" };

  // media quality gate — 실제 음성 + 실제 장면 이미지 + 최종 mp4가 전부 준비된 경우에만
  // 게시 전 점검/실제 업로드용 content unit을 만든다. 시안(색상 카드/테스트 소리)은
  // 어떤 경로로도 업로드 대상이 될 수 없다(fail-closed).
  const media = readWizardRealMediaState(topicId);
  if (!media.realTts.ready) return { ok: false, reason: "real_tts_required" };
  if (!media.realImages.ready) return { ok: false, reason: "real_scene_images_required" };
  if (!media.finalVideo.ready || !media.finalVideo.mp4Path) return { ok: false, reason: "final_mp4_required" };
  if (!media.mediaQualityGate.ok) return { ok: false, reason: "media_quality_gate_not_ready" };

  const muxedAbs = resolve(media.finalVideo.mp4Path);
  if (!muxedAbs.startsWith(WIZARD_VIDEO_ALLOWED_PREFIX) || !muxedAbs.toLowerCase().endsWith(".mp4")) {
    return { ok: false, reason: "video_path_untrusted" };
  }

  const contentId = `wizard-${safeSlug}`;
  if ((BLOCKED_PUBLISHED_CONTENT_IDS as readonly string[]).includes(contentId)) {
    return { ok: false, reason: "content_already_published_evidence" };
  }

  const generated = readWizardGeneratedTopic(topicId);
  const category = (generated?.category ?? "finance") as WizardCategoryId;
  const hashtags = CATEGORY_HASHTAGS[category] ?? CATEGORY_HASHTAGS.finance;

  const titleBase = script.title.trim().slice(0, 95);
  const description = `${script.fullVoiceover}`.trim();
  const callToAction = `${script.action.trim().replace(/\.$/, "")} · 팔로우하면 다음 팁을 바로 받아요`;

  const contentUnit = {
    schemaVersion: "dual_platform_content_unit_v1",
    _note:
      "web wizard가 선택 주제로 생성한 content unit. 실제 TTS + 실제 장면 이미지로 합성한 최종 mp4 기준이며 " +
      "(media quality gate 통과분만), 실제 게시는 final E2E runner의 모든 gate(중복/키/승인/--arm)를 통과해야만 일어난다.",
    contentId,
    version: "v1",
    wizardTopicId: topicId,
    instagramSourcePath: muxedAbs,
    youtubeSourcePath: muxedAbs,
    instagramMetadata: {
      captionFirstLineHook: script.hook,
      caption: description,
      hashtags,
      callToAction,
      forbiddenUnrelatedTrendTags: true,
    },
    youtubeMetadata: {
      titleBase,
      titleWithShortsSuffix: `${titleBase} #Shorts`.slice(0, 100),
      descriptionBase: description,
      tags: hashtags,
      categoryId: CATEGORY_YT_ID[category] ?? "22",
      defaultLanguage: "ko",
      privacyStatus: "public",
      selfDeclaredMadeForKids: false,
    },
    existingPublishedKeys: [],
  };

  const publishOutDir = join(WIZARD_VIDEO_OUT_ROOT, safeSlug, "publish");
  const contentUnitPath = join(publishOutDir, `dual_platform_content_unit.${contentId}.v1.json`);
  try {
    mkdirSync(publishOutDir, { recursive: true });
    writeFileSync(contentUnitPath, JSON.stringify(contentUnit, null, 2), "utf8");
  } catch (e) {
    return { ok: false, reason: `content_unit_write_failed:${(e as Error).message}` };
  }

  return {
    ok: true,
    paths: {
      topicId,
      safeSlug,
      contentId,
      version: "v1",
      contentUnitPath,
      publishOutDir,
      ledgerPath: WIZARD_PUBLISH_LEDGER_PATH,
      muxedMp4Path: muxedAbs,
      titleBase,
    },
  };
}

export type WizardPublishPreflight = {
  status: string | null;
  blockerCode: string | null;
  contentUnitManifestPath: string | null;
  credentialPresentCount: number | null;
};

/** wizardPreflight가 남긴 runner preflight 결과(JSON)를 읽는다(secret 없음 — status/blocker/경로만). */
export function readWizardPublishPreflight(topicId: string): WizardPublishPreflight | null {
  const slug = toSafeTopicSlug(topicId);
  if (!slug) return null;
  const p = join(WIZARD_VIDEO_OUT_ROOT, slug, "publish", "final-e2e-publish-preflight.json");
  const parsed = readAbsJson(p) as {
    status?: string;
    blockerCode?: string | null;
    contentUnitManifestPath?: string;
    credentialPresence?: Record<string, boolean>;
  } | null;
  if (!parsed) return null;
  const presence = parsed.credentialPresence ?? null;
  return {
    status: typeof parsed.status === "string" ? parsed.status : null,
    blockerCode: typeof parsed.blockerCode === "string" ? parsed.blockerCode : null,
    contentUnitManifestPath:
      typeof parsed.contentUnitManifestPath === "string" ? parsed.contentUnitManifestPath : null,
    credentialPresentCount: presence ? Object.values(presence).filter((v) => v === true).length : null,
  };
}

export type WizardPublishResult = {
  status: string | null;
  blockerCode: string | null;
  instagramMediaId: string | null;
  youtubeVideoId: string | null;
  youtubeUrl: string | null;
  partialExternalState: string | null;
  ledgerRecordedKeys: string[];
};

/** actualUpload가 남긴 runner result JSON을 읽는다(public id/url/status만 — secret 값 없음). */
export function readWizardPublishResult(topicId: string): WizardPublishResult | null {
  const slug = toSafeTopicSlug(topicId);
  if (!slug) return null;
  const p = join(WIZARD_VIDEO_OUT_ROOT, slug, "publish", "final-e2e-publish-result.json");
  const parsed = readAbsJson(p) as {
    status?: string;
    blockerCode?: string | null;
    partialExternalState?: string;
    executionResult?: {
      instagram?: { mediaId?: string | null };
      youtube?: { videoId?: string | null; url?: string | null };
      ledger?: { recordedKeys?: string[] };
    };
  } | null;
  if (!parsed) return null;
  return {
    status: typeof parsed.status === "string" ? parsed.status : null,
    blockerCode: typeof parsed.blockerCode === "string" ? parsed.blockerCode : null,
    instagramMediaId: parsed.executionResult?.instagram?.mediaId ?? null,
    youtubeVideoId: parsed.executionResult?.youtube?.videoId ?? null,
    youtubeUrl: parsed.executionResult?.youtube?.url ?? null,
    partialExternalState: typeof parsed.partialExternalState === "string" ? parsed.partialExternalState : null,
    ledgerRecordedKeys: Array.isArray(parsed.executionResult?.ledger?.recordedKeys)
      ? parsed.executionResult.ledger.recordedKeys.filter((k): k is string => typeof k === "string")
      : [],
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// 실제 제작 파이프라인 — Claude 대본 1회 보정 + 실제 TTS/이미지/최종 mp4 + media gate
// task: owner-web-real-script-voice-visual-generation-pipeline-v1
//
// 구조: 로컬 후보 여러 개 생성 → 로컬 judge 최고 후보 1개 선택(기존) → 그 1개만
// Claude API로 1회 보정 → 확정 대본(script-final.json) → 실제 TTS → 장면 이미지 →
// 최종 mp4 → media quality gate 통과 시에만 업로드 가능.
//
// 안전 계약:
// - Anthropic SDK 의존성 없음 — Node fetch만 사용하고 fetchImpl 주입으로 테스트한다.
// - ANTHROPIC_API_KEY는 서버 런타임 process.env에서만 읽고 child/로그/응답에 절대 넣지 않는다.
// - key 없음/HTTP 실패/JSON 파싱 실패/계약 검증 실패/judge 점수 회귀 → 로컬 대본 그대로 사용.
// - 이 helper의 네트워크 호출은 ANTHROPIC_API_URL 하나뿐이다(guard가 강제).
// ══════════════════════════════════════════════════════════════════════════════

/** Claude 보정이 호출하는 유일한 외부 URL(고정). 다른 어떤 네트워크 호출도 이 파일에 없다. */
export const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
/**
 * 보정 기본 모델 — Owner 비용 정책(기본 Haiku/Sonnet, Opus는 별도 승인)에 따라 Sonnet.
 * ANTHROPIC_POLISH_MODEL env로 오버라이드 가능(값은 모델 id 문자열, secret 아님).
 */
export const CLAUDE_POLISH_DEFAULT_MODEL = "claude-sonnet-4-6";
/**
 * 검증/점검 중 실제 Claude 호출을 잠그는 킬스위치.
 * env WIZARD_DISABLE_CLAUDE_POLISH=1 또는 marker 파일 존재 시 polish를 건너뛴다(로컬 대본 사용).
 * marker가 남아 있으면 UI note에 그대로 표시돼 Owner가 바로 알 수 있다.
 */
export const WIZARD_POLISH_DISABLE_MARKER = join(WIZARD_VIDEO_OUT_ROOT, "DISABLE_LIVE_CLAUDE_POLISH.marker");

export type WizardClaudePolishInfo = {
  applied: boolean;
  mode: "claude_polished" | "local_only";
  reasonCode:
    | "APPLIED"
    | "NO_API_KEY"
    | "POLISH_DISABLED"
    | "NOT_LOCAL_RUNTIME"
    | "API_ERROR"
    | "TIMEOUT"
    | "PARSE_FAILED"
    | "VALIDATION_FAILED";
  /** 사람이 읽는 한 줄(“Claude 보정 적용됨” / “Claude 보정 미적용 — 로컬 대본 사용 중”). secret 없음. */
  note: string;
  /** 보정에 사용한 모델 id(적용 시). */
  model: string | null;
  /** Claude가 보고한 고친 부분 요약(적용 시). */
  rewriteNotes: string[];
  /** 로컬 대본 judge 점수 vs 보정본 judge 점수(회귀 방지 근거). */
  localScore: number | null;
  polishedScore: number | null;
};

/** script-final.json 레코드 — 대본 확정본(보정 or 로컬) + 엔진 메타데이터. */
export type WizardFinalScriptRecord = {
  schemaVersion: "wizard_script_final_v1";
  topicId: string;
  mode: "claude_polished" | "local_only";
  localFingerprint: string;
  polish: WizardClaudePolishInfo;
  script: WizardScriptPreview;
};

/** 로컬 대본의 내용 지문 — 같은 대본이면 보정을 다시 호출하지 않는다(1회 구조). */
export function wizardScriptFingerprint(preview: WizardScriptPreview): string {
  return createHash("sha1")
    .update(JSON.stringify({ t: preview.title, v: preview.fullVoiceover, c: preview.captionLines }))
    .digest("hex");
}

/** Claude 반환 JSON 계약(검증 통과분). */
type PolishedScriptShape = {
  title: string;
  oneSentencePoint: string;
  hookLine: string;
  fullVoiceover: string;
  captionLines: string[];
  scenes: Array<{ label: string; caption: string; visualCue: string; narration: string }>;
  uploadCaptionDraft: string;
  rewriteNotes: string[];
};

/**
 * Claude 응답 텍스트 → 계약 검증. JSON 외 텍스트/필드 수 불일치/자막 22자 초과/
 * 설명체 종결/제목 약패턴 발견 시 실패(→ 로컬 대본 fallback).
 */
export function validatePolishedScript(raw: unknown): { ok: true; value: PolishedScriptShape } | { ok: false; reasons: string[] } {
  const reasons: string[] = [];
  const o = raw as Partial<PolishedScriptShape> | null;
  const str = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;

  if (!o || typeof o !== "object") return { ok: false, reasons: ["json_not_object"] };
  if (!str(o.title) || o.title.trim().length < 4 || o.title.trim().length > 40) reasons.push("title_invalid");
  if (str(o.title) && WEAK_TITLE_PATTERN.test(o.title)) reasons.push("title_weak_pattern");
  if (!str(o.hookLine) || o.hookLine.trim().length > 40) reasons.push("hookLine_invalid");
  if (!str(o.oneSentencePoint)) reasons.push("oneSentencePoint_invalid");
  if (!str(o.fullVoiceover) || o.fullVoiceover.trim().length < 40 || o.fullVoiceover.trim().length > 700) {
    reasons.push("fullVoiceover_invalid");
  }
  if (!Array.isArray(o.captionLines) || o.captionLines.length !== 6) reasons.push("captionLines_not_6");
  else {
    for (const c of o.captionLines) {
      if (!str(c) || c.trim().length > 22) { reasons.push("caption_over_22_or_empty"); break; }
    }
  }
  if (!Array.isArray(o.scenes) || o.scenes.length !== 6) reasons.push("scenes_not_6");
  else {
    for (const s of o.scenes) {
      if (!s || !str(s.label) || !str(s.caption) || !str(s.visualCue) || !str(s.narration)) {
        reasons.push("scene_fields_missing"); break;
      }
      if (s.caption.trim().length > 22) { reasons.push("scene_caption_over_22"); break; }
      if (s.visualCue.trim().length < 8) { reasons.push("scene_visualCue_too_short"); break; }
      if (s.narration.trim().length < 8 || s.narration.trim().length > 60) { reasons.push("scene_narration_length"); break; }
    }
  }
  if (!str(o.uploadCaptionDraft) || o.uploadCaptionDraft.trim().length < 10) reasons.push("uploadCaptionDraft_invalid");
  if (!Array.isArray(o.rewriteNotes) || o.rewriteNotes.some((n) => typeof n !== "string")) reasons.push("rewriteNotes_invalid");

  // 설명체(하십시오체 …니다 종결)·훈계 어투는 자막/낭독 전체에서 금지.
  const politeTargets = [
    ...(Array.isArray(o.captionLines) ? o.captionLines : []),
    ...(Array.isArray(o.scenes) ? o.scenes.flatMap((s) => [s?.caption ?? "", s?.narration ?? ""]) : []),
    o.fullVoiceover ?? "",
    o.hookLine ?? "",
  ];
  if (politeTargets.some((t) => AI_TONE_PATTERNS.test(String(t)))) reasons.push("polite_or_lecture_tone");

  if (reasons.length > 0) return { ok: false, reasons: [...new Set(reasons)] };
  const v = o as PolishedScriptShape;
  return {
    ok: true,
    value: {
      ...v,
      title: v.title.trim(),
      hookLine: v.hookLine.trim(),
      oneSentencePoint: v.oneSentencePoint.trim(),
      fullVoiceover: v.fullVoiceover.trim(),
      captionLines: v.captionLines.map((c) => c.trim()),
      scenes: v.scenes.map((s) => ({
        label: s.label.trim(),
        caption: s.caption.trim(),
        visualCue: s.visualCue.trim(),
        narration: s.narration.trim(),
      })),
      uploadCaptionDraft: v.uploadCaptionDraft.trim(),
      rewriteNotes: v.rewriteNotes.map((n) => n.trim()).filter((n) => n.length > 0).slice(0, 8),
    },
  };
}

const CLAUDE_POLISH_SYSTEM_PROMPT = [
  "당신은 한국어 숏폼(릴스/쇼츠) 대본 전문 에디터다. 입력으로 로컬 엔진이 만든 대본 JSON을 받는다.",
  "구조와 핵심 메시지는 유지하면서 첫 3초 훅, 문장 자연스러움, '내 얘기 같다'는 자기인식, 장면 시각 지시를 다듬어라.",
  "",
  "반드시 지켜야 하는 규칙:",
  "- 출력은 JSON 객체 하나만. 마크다운 코드펜스, 설명 문장, 주석을 절대 붙이지 마라.",
  "- captionLines는 정확히 6개, 각각 22자 이하(공백 포함).",
  '- scenes는 정확히 6개, 각 원소는 {"label","caption","visualCue","narration"} 형태.',
  "  caption은 22자 이하 화면 자막, narration은 그 장면에서 실제로 읽을 한국어 낭독 문장(8~60자),",
  "  visualCue는 자막 없이도 장면이 전달되게 하는 구체적 사진 묘사(글자/텍스트 없는 실사 장면).",
  "- 하십시오체('…합니다/…입니다' 등 '니다' 종결) 금지. 해요체와 단정형('…다')만 사용.",
  "- 제목에 '이유/방법/공통점/체크리스트' 같은 설명형 패턴 금지.",
  "- 훈계/일반론 금지. 실제 소비 행동과 생활 장면 중심.",
  "- fullVoiceover는 scenes의 narration 6개를 순서대로 자연스럽게 이은 전체 낭독문.",
  "",
  "출력 JSON 필드: title, oneSentencePoint, hookLine, fullVoiceover,",
  "captionLines(문자열 6개), scenes(6개: label/caption/visualCue/narration),",
  "uploadCaptionDraft(SNS 설명글 초안), rewriteNotes(무엇을 왜 고쳤는지 한국어 요약 배열).",
].join("\n");

/** 코드펜스가 붙어 와도 JSON 본문만 꺼낸다(그 외 prose 섞임은 parse 실패 → fallback). */
function extractJsonText(text: string): string {
  const t = text.trim();
  const fence = t.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  return fence ? fence[1].trim() : t;
}

/**
 * 로컬 최고 후보 대본 1개를 Claude API로 1회 보정한다.
 * - fetchImpl 주입 가능(테스트는 fake fetch만 사용, 실제 호출은 Owner 버튼 클릭 시 서버 런타임).
 * - 실패 시 어떤 경우에도 로컬 대본을 그대로 돌려준다(fail-open to local, 업로드와 무관).
 */
export async function polishWizardScriptWithClaude(
  local: WizardScriptPreview,
  opts?: {
    fetchImpl?: typeof globalThis.fetch;
    apiKey?: string | null;
    model?: string;
    timeoutMs?: number;
  },
): Promise<{ script: WizardScriptPreview; polish: WizardClaudePolishInfo }> {
  const localJudge = local.quality?.overallScore ?? null;
  const fallback = (reasonCode: WizardClaudePolishInfo["reasonCode"], noteTail: string): { script: WizardScriptPreview; polish: WizardClaudePolishInfo } => ({
    script: local,
    polish: {
      applied: false,
      mode: "local_only",
      reasonCode,
      note: `Claude 보정 미적용 — 로컬 대본 사용 중 (${noteTail})`,
      model: null,
      rewriteNotes: [],
      localScore: localJudge,
      polishedScore: null,
    },
  });

  const apiKey = opts?.apiKey !== undefined ? opts.apiKey : (process.env.ANTHROPIC_API_KEY ?? null);
  if (!apiKey || apiKey.trim() === "") return fallback("NO_API_KEY", "ANTHROPIC_API_KEY 없음");
  const fetchImpl = opts?.fetchImpl ?? globalThis.fetch;
  const model = opts?.model ?? process.env.ANTHROPIC_POLISH_MODEL ?? CLAUDE_POLISH_DEFAULT_MODEL;
  const timeoutMs = opts?.timeoutMs ?? 45_000;

  const userPayload = JSON.stringify(
    {
      title: local.title,
      hookLine: local.hookLine,
      fullVoiceover: local.fullVoiceover,
      captionLines: local.captionLines,
      scenes: local.scenes.map((s) => ({
        label: s.label,
        caption: s.captionText,
        visualCue: s.visualCue,
        narration: s.narration,
      })),
      uploadCaptionDraft: local.uploadCaptionDraft,
    },
    null,
    2,
  );

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let respText: string;
  try {
    const resp = await fetchImpl(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: 2048,
        system: CLAUDE_POLISH_SYSTEM_PROMPT,
        messages: [{ role: "user", content: `현재 대본:\n${userPayload}` }],
      }),
      signal: controller.signal,
    });
    if (!resp.ok) return fallback("API_ERROR", `API 응답 ${resp.status}`);
    const data = (await resp.json()) as {
      content?: Array<{ type?: string; text?: string }>;
      stop_reason?: string;
    };
    const textBlock = (data.content ?? []).find((b) => b?.type === "text" && typeof b.text === "string");
    if (!textBlock?.text) return fallback("API_ERROR", `응답에 텍스트 없음${data.stop_reason ? ` (stop: ${data.stop_reason})` : ""}`);
    respText = textBlock.text;
  } catch (e) {
    const aborted = (e as Error)?.name === "AbortError";
    return fallback(aborted ? "TIMEOUT" : "API_ERROR", aborted ? `${Math.round(timeoutMs / 1000)}초 초과` : "네트워크/호출 실패");
  } finally {
    clearTimeout(timer);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(extractJsonText(respText));
  } catch {
    return fallback("PARSE_FAILED", "JSON 파싱 실패");
  }
  const validated = validatePolishedScript(parsed);
  if (!validated.ok) return fallback("VALIDATION_FAILED", `계약 위반: ${validated.reasons.slice(0, 3).join(", ")}`);
  const v = validated.value;

  // 보정본을 로컬 judge로 재평가 — 점수가 유의미하게 떨어지면 보정을 버린다(품질 회귀 방지).
  const polishedJudgment = judgeTopicSeed(
    {
      slug: "claude-polish",
      title: v.title,
      hook: v.hookLine,
      angle: "심리",
      points: [v.scenes[2].narration, v.scenes[3].narration, v.scenes[4].narration] as [string, string, string],
      save: v.scenes[5].narration,
      empathy: v.scenes[1].narration,
    },
    false,
  );
  if (localJudge != null && polishedJudgment.overallScore < localJudge - 5) {
    return fallback("VALIDATION_FAILED", `로컬 judge 점수 회귀 (${polishedJudgment.overallScore} < ${localJudge})`);
  }

  const SCENE_IDS: WizardScriptScene["id"][] = ["hook", "empathy", "psychology", "twist", "action", "save"];
  const scenes: WizardScriptScene[] = v.scenes.map((s, i) => ({
    id: SCENE_IDS[i],
    label: s.label,
    narration: s.narration,
    captionText: s.caption,
    visualCue: s.visualCue,
  }));

  const script: WizardScriptPreview = {
    ...local,
    title: v.title,
    hook: v.hookLine,
    hookLine: v.hookLine,
    curiosity: scenes[1].narration,
    action: scenes[5].narration,
    captionLines: v.captionLines,
    fullVoiceover: v.fullVoiceover,
    scenes,
    captionFirstLineHook: v.hookLine,
    uploadCaptionDraft: v.uploadCaptionDraft,
    goldenSampleChecks: {
      ...local.goldenSampleChecks,
      captionsWithinLimit: v.captionLines.every((c) => c.length <= 22),
    },
    quality: polishedJudgment,
  };
  return {
    script,
    polish: {
      applied: true,
      mode: "claude_polished",
      reasonCode: "APPLIED",
      note: "Claude 보정 적용됨",
      model,
      rewriteNotes: v.rewriteNotes,
      localScore: localJudge,
      polishedScore: polishedJudgment.overallScore,
    },
  };
}

/** script-final.json 경로(topic별, repo 밖). */
function wizardFinalScriptPath(safeSlug: string): string {
  return join(WIZARD_INPUTS_ROOT, safeSlug, "script-final.json");
}

/** 확정 대본 레코드를 읽는다(없거나 형식이 다르면 null). */
export function readWizardFinalScriptRecord(topicId: string): WizardFinalScriptRecord | null {
  const slug = toSafeTopicSlug(topicId);
  if (!slug) return null;
  const parsed = readAbsJson(wizardFinalScriptPath(slug)) as WizardFinalScriptRecord | null;
  if (!parsed || parsed.schemaVersion !== "wizard_script_final_v1" || parsed.topicId !== topicId) return null;
  if (!parsed.script || typeof parsed.script.fullVoiceover !== "string") return null;
  return parsed;
}

/** 확정 대본(WizardScriptPreview)만 돌려준다 — TTS/이미지/영상/시안이 전부 이걸 소비한다. */
export function readWizardFinalScript(topicId: string): WizardScriptPreview | null {
  return readWizardFinalScriptRecord(topicId)?.script ?? null;
}

/** 검증/점검용 킬스위치 상태(env 또는 marker 파일). Owner 화면 note에 그대로 표시된다. */
export function isClaudePolishDisabled(): boolean {
  return process.env.WIZARD_DISABLE_CLAUDE_POLISH === "1" || existsSync(WIZARD_POLISH_DISABLE_MARKER);
}

/**
 * 대본 확정 진입점 — scriptPreview action이 호출한다.
 * 로컬 최고 후보(readScriptPreview 결과)를 받아:
 *   1) 같은 로컬 대본으로 이미 보정 완료된 캐시가 있으면 재사용(추가 API 호출 0회),
 *   2) 아니면 Claude 1회 보정 시도(키 없음/실패 시 로컬 그대로),
 *   3) 결과를 script-final.json으로 저장해 실제 TTS/이미지/영상 단계의 단일 입력으로 만든다.
 */
export async function ensureWizardFinalScript(
  topicId: string,
  local: WizardScriptPreview,
  opts?: { allowPolish?: boolean; fetchImpl?: typeof globalThis.fetch },
): Promise<WizardFinalScriptRecord> {
  const slug = toSafeTopicSlug(topicId) ?? "invalid";
  const fp = wizardScriptFingerprint(local);
  const disabled = isClaudePolishDisabled();
  const keyPresent = typeof process.env.ANTHROPIC_API_KEY === "string" && process.env.ANTHROPIC_API_KEY !== "";
  const polishAvailable = opts?.allowPolish !== false && !disabled && keyPresent;

  const cached = readWizardFinalScriptRecord(topicId);
  if (cached && cached.localFingerprint === fp) {
    // 보정 완료 캐시는 항상 재사용. local_only 캐시는 지금 보정이 가능해졌을 때만 다시 시도한다.
    if (cached.mode === "claude_polished" || !polishAvailable) return cached;
  }

  let record: WizardFinalScriptRecord;
  if (!polishAvailable) {
    const noteTail =
      opts?.allowPolish === false ? "배포 사이트에서는 보정하지 않음" : disabled ? "점검용 차단(marker/env) 활성" : "ANTHROPIC_API_KEY 없음";
    record = {
      schemaVersion: "wizard_script_final_v1",
      topicId,
      mode: "local_only",
      localFingerprint: fp,
      polish: {
        applied: false,
        mode: "local_only",
        reasonCode: opts?.allowPolish === false ? "NOT_LOCAL_RUNTIME" : disabled ? "POLISH_DISABLED" : "NO_API_KEY",
        note: `Claude 보정 미적용 — 로컬 대본 사용 중 (${noteTail})`,
        model: null,
        rewriteNotes: [],
        localScore: local.quality?.overallScore ?? null,
        polishedScore: null,
      },
      script: local,
    };
  } else {
    const polished = await polishWizardScriptWithClaude(local, { fetchImpl: opts?.fetchImpl });
    record = {
      schemaVersion: "wizard_script_final_v1",
      topicId,
      mode: polished.polish.mode,
      localFingerprint: fp,
      polish: polished.polish,
      script: polished.script,
    };
  }

  try {
    mkdirSync(join(WIZARD_INPUTS_ROOT, slug), { recursive: true });
    writeFileSync(wizardFinalScriptPath(slug), JSON.stringify(record, null, 2), "utf8");
  } catch {
    // 저장 실패 시에도 화면 표시는 가능하지만, 실제 TTS/이미지 단계는 파일이 없어 fail-closed된다.
    record.polish.note += " · 확정 대본 저장 실패(실제 생성 단계 진행 불가)";
  }
  return record;
}

// ── 실제 파이프라인 입력/상태 ────────────────────────────────────────────────

export type WizardRealPipelinePaths = {
  topicId: string;
  safeSlug: string;
  scriptFinalPath: string;
  realTtsScriptPath: string;
  ttsOutDir: string;
  ttsSummaryPath: string;
  imagesOutDir: string;
  videoOutDir: string;
};

/**
 * 실제 TTS/이미지/영상 단계의 공통 입력을 만든다.
 * - 확정 대본(script-final.json)이 없으면 fail-closed(대본 만들기 먼저).
 * - 실전용 tts-script는 scene durationSec을 내레이션 글자수(≈6자/초, 3~8초 clamp)로 산정해
 *   scene-paced TTS의 하드트림(단어 잘림)을 원천 차단한다. 이 duration이 최종 영상의
 *   scene 경계와 동일하게 쓰여 오디오/자막/이미지 싱크가 결정적으로 맞는다.
 */
export function buildWizardRealPipelineInputs(
  topicId: string,
): { ok: true; paths: WizardRealPipelinePaths } | { ok: false; reason: string } {
  const safeSlug = toSafeTopicSlug(topicId);
  if (!safeSlug) return { ok: false, reason: "topic_id_invalid_or_empty" };
  const record = readWizardFinalScriptRecord(topicId);
  if (!record) return { ok: false, reason: "script_final_missing" };
  const script = record.script;
  if (!Array.isArray(script.scenes) || script.scenes.length !== 6) return { ok: false, reason: "script_scenes_invalid" };

  const narrations = script.scenes.map((s) => String(s.narration ?? "").trim() || String(s.captionText ?? "").trim());
  if (narrations.some((n) => n.length < 4)) return { ok: false, reason: "script_scenes_invalid" };

  // 한국어 낭독 속도 보수치(≈6자/초) 기반 scene 길이 — 트림 대신 소폭 무음 패딩이 나오게 설계.
  const durations = narrations.map((n) => Math.min(8, Math.max(3, Math.ceil(n.length / 6))));
  const starts: number[] = [];
  let acc = 0;
  for (const d of durations) {
    starts.push(acc);
    acc += d;
  }
  const targetDurationSec = acc;

  const realTtsScript = {
    schemaVersion: "money_shorts_tts_script_v1",
    scriptId: `tts-script-wizard-${safeSlug}-elevenlabs`,
    manifestId: `rp-wizard-${safeSlug}`,
    factCardId: `fact-card-wizard-${safeSlug}`,
    ttsProvider: "elevenlabs",
    ttsMode: "elevenlabs_scene_paced",
    voiceProfile: "elevenlabs_fixed_voice",
    targetDurationSec,
    wizardTopicId: topicId,
    wizardTopicTitle: script.title,
    scriptMode: record.mode,
    riskNotes: [
      "Real ElevenLabs scene-paced TTS input generated from the confirmed wizard script (script-final.json).",
      "Scene durations are sized from narration length (~6 chars/sec, clamp 3..8s) to avoid tail-trim word cuts.",
      "No secret values are stored in this file.",
    ],
    scenes: script.scenes.map((s, i) => ({
      sceneNumber: i + 1,
      sceneRole: s.id,
      durationSec: durations[i],
      startSec: starts[i],
      endSec: starts[i] + durations[i],
      ttsText: narrations[i],
      narration: narrations[i],
      captionText: String(s.captionText ?? "").trim(),
    })),
  };

  const inputDir = join(WIZARD_INPUTS_ROOT, safeSlug);
  const realRoot = join(WIZARD_VIDEO_OUT_ROOT, safeSlug, "real");
  const realTtsScriptPath = join(inputDir, "tts-script.real.json");
  const ttsOutDir = join(realRoot, "tts");
  try {
    mkdirSync(inputDir, { recursive: true });
    writeFileSync(realTtsScriptPath, JSON.stringify(realTtsScript, null, 2), "utf8");
  } catch (e) {
    return { ok: false, reason: `input_write_failed:${(e as Error).message}` };
  }

  return {
    ok: true,
    paths: {
      topicId,
      safeSlug,
      scriptFinalPath: wizardFinalScriptPath(safeSlug),
      realTtsScriptPath,
      ttsOutDir,
      ttsSummaryPath: join(ttsOutDir, "elevenlabs-scene-paced-tts-summary.json"),
      imagesOutDir: join(realRoot, "images"),
      videoOutDir: join(realRoot, "video"),
    },
  };
}

export type WizardRealMediaState = {
  scriptEngine: {
    finalReady: boolean;
    mode: "claude_polished" | "local_only" | null;
    note: string | null;
    rewriteNotes: string[];
    polishDisabled: boolean;
    anthropicKeyPresent: boolean;
    elevenLabsKeyPresent: boolean;
  };
  realTts: {
    ready: boolean;
    audioPath: string | null;
    durationSec: number | null;
    provider: string | null;
    apiCallCount: number | null;
    missingEnv: string[];
  };
  realImages: {
    ready: boolean;
    generatedCount: number;
    expectedCount: number;
    dir: string | null;
    blocked: string | null;
  };
  finalVideo: {
    ready: boolean;
    mp4Path: string | null;
    durationSec: number | null;
    width: number | null;
    height: number | null;
    hasAudio: boolean;
    sizeBytes: number | null;
  };
  mediaQualityGate: {
    ok: boolean;
    reasons: string[];
    blockerCode: "REAL_TTS_REQUIRED" | "REAL_SCENE_IMAGES_REQUIRED" | "FINAL_MP4_REQUIRED" | null;
  };
};

/**
 * 실제 미디어(음성/이미지/최종 영상) 준비 상태 + media quality gate.
 * 전부 요약 파일 읽기만 한다(spawn/네트워크 0). 업로드 게이트가 이 결과를 재검증에 쓴다.
 * 테스트 소리(local_mock)/색상 카드 시안은 어떤 필드로도 ready가 되지 않는다.
 */
export function readWizardRealMediaState(topicId: string): WizardRealMediaState {
  const slug = topicId ? toSafeTopicSlug(topicId) : null;
  const realRoot = slug ? join(WIZARD_VIDEO_OUT_ROOT, slug, "real") : null;

  const record = slug ? readWizardFinalScriptRecord(topicId) : null;
  const scriptEngine: WizardRealMediaState["scriptEngine"] = {
    finalReady: record != null,
    mode: record?.mode ?? null,
    note: record?.polish.note ?? null,
    rewriteNotes: record?.polish.rewriteNotes ?? [],
    polishDisabled: isClaudePolishDisabled(),
    anthropicKeyPresent: typeof process.env.ANTHROPIC_API_KEY === "string" && process.env.ANTHROPIC_API_KEY !== "",
    elevenLabsKeyPresent:
      typeof process.env.ELEVENLABS_API_KEY === "string" &&
      process.env.ELEVENLABS_API_KEY !== "" &&
      typeof process.env.ELEVENLABS_VOICE_ID === "string" &&
      process.env.ELEVENLABS_VOICE_ID !== "",
  };

  // 실제 TTS — 검증된 scene-paced summary만 신뢰. liveApiCallPerformed=true + 파일 존재 필수.
  const ttsSummary = realRoot
    ? (readAbsJson(join(realRoot, "tts", "elevenlabs-scene-paced-tts-summary.json")) as {
        provider?: string;
        liveApiCallPerformed?: boolean;
        readinessFailure?: boolean;
        missingEnv?: string[];
        timelineAudioPath?: string | null;
        timelineDurationSec?: number | null;
        apiCallCount?: number;
      } | null)
    : null;
  const ttsAudioPath = typeof ttsSummary?.timelineAudioPath === "string" ? ttsSummary.timelineAudioPath : null;
  const ttsDuration = typeof ttsSummary?.timelineDurationSec === "number" ? ttsSummary.timelineDurationSec : null;
  const realTtsReady =
    ttsSummary?.provider === "elevenlabs" &&
    ttsSummary.liveApiCallPerformed === true &&
    ttsSummary.readinessFailure !== true &&
    ttsAudioPath != null &&
    existsSync(ttsAudioPath) &&
    ttsDuration != null &&
    ttsDuration >= 10 &&
    ttsDuration <= 70;
  const realTts: WizardRealMediaState["realTts"] = {
    ready: realTtsReady === true,
    audioPath: realTtsReady ? ttsAudioPath : null,
    durationSec: ttsDuration,
    provider: ttsSummary?.provider ?? null,
    apiCallCount: typeof ttsSummary?.apiCallCount === "number" ? ttsSummary.apiCallCount : null,
    missingEnv: Array.isArray(ttsSummary?.missingEnv) ? ttsSummary.missingEnv.filter((k): k is string => typeof k === "string") : [],
  };

  // 실제 장면 이미지 — 6장 전부 SAVED_OK + 파일 존재 + 세로형 최소 해상도.
  const imagesDir = realRoot ? join(realRoot, "images") : null;
  const imagesSummary = imagesDir
    ? (readAbsJson(join(imagesDir, "scene-images-summary.json")) as {
        schemaVersion?: string;
        mode?: string;
        allReady?: boolean;
        blockerCode?: string | null;
        scenes?: Array<{ sceneIndex?: number; file?: string; width?: number | null; height?: number | null; status?: string }>;
      } | null)
    : null;
  const sceneRows = Array.isArray(imagesSummary?.scenes) ? imagesSummary.scenes : [];
  const savedScenes = sceneRows.filter(
    (s) =>
      s.status === "SAVED_OK" &&
      typeof s.file === "string" &&
      existsSync(s.file) &&
      typeof s.width === "number" &&
      typeof s.height === "number" &&
      s.width >= 900 &&
      s.height >= 1200 &&
      s.height >= Math.round(s.width * 1.2),
  );
  const realImagesReady =
    imagesSummary?.mode === "chatgpt_playwright" && imagesSummary.allReady === true && sceneRows.length === 6 && savedScenes.length === 6;
  const realImages: WizardRealMediaState["realImages"] = {
    ready: realImagesReady === true,
    generatedCount: savedScenes.length,
    expectedCount: 6,
    dir: imagesDir,
    blocked: typeof imagesSummary?.blockerCode === "string" ? imagesSummary.blockerCode : null,
  };

  // 최종 mp4 — 실제 음성+실제 이미지 합성 summary + ffprobe 검증값 + 파일 존재.
  const videoSummary = realRoot
    ? (readAbsJson(join(realRoot, "video", "real-video-summary.json")) as {
        schemaVersion?: string;
        status?: string;
        finalMp4Path?: string;
        durationSec?: number;
        width?: number;
        height?: number;
        hasAudioStream?: boolean;
        hasVideoStream?: boolean;
        sizeBytes?: number;
        sceneCount?: number;
        audioProvider?: string;
        imageMode?: string;
      } | null)
    : null;
  const mp4Path = typeof videoSummary?.finalMp4Path === "string" ? videoSummary.finalMp4Path : null;
  const finalVideoReady =
    videoSummary?.schemaVersion === "wizard_real_video_summary_v1" &&
    videoSummary.status === "RENDER_MUX_OK" &&
    videoSummary.audioProvider === "elevenlabs" &&
    videoSummary.imageMode === "chatgpt_playwright" &&
    mp4Path != null &&
    existsSync(mp4Path) &&
    videoSummary.width === 1080 &&
    videoSummary.height === 1920 &&
    videoSummary.hasAudioStream === true &&
    videoSummary.hasVideoStream === true &&
    typeof videoSummary.durationSec === "number" &&
    videoSummary.durationSec >= 15 &&
    videoSummary.durationSec <= 60 &&
    typeof videoSummary.sizeBytes === "number" &&
    videoSummary.sizeBytes > 0 &&
    videoSummary.sceneCount === 6;
  const finalVideo: WizardRealMediaState["finalVideo"] = {
    ready: finalVideoReady === true,
    mp4Path: finalVideoReady ? mp4Path : null,
    durationSec: typeof videoSummary?.durationSec === "number" ? videoSummary.durationSec : null,
    width: typeof videoSummary?.width === "number" ? videoSummary.width : null,
    height: typeof videoSummary?.height === "number" ? videoSummary.height : null,
    hasAudio: videoSummary?.hasAudioStream === true,
    sizeBytes: typeof videoSummary?.sizeBytes === "number" ? videoSummary.sizeBytes : null,
  };

  const reasons: string[] = [];
  if (!realTts.ready) reasons.push("실제 음성이 아직 없습니다 (테스트 소리는 업로드 불가)");
  if (!realImages.ready) reasons.push(`실제 장면 이미지가 부족합니다 (${realImages.generatedCount}/6)`);
  if (!finalVideo.ready) reasons.push("실제 음성+이미지로 만든 최종 영상이 아직 없습니다 (시안 영상은 업로드 불가)");
  const blockerCode = !realTts.ready
    ? ("REAL_TTS_REQUIRED" as const)
    : !realImages.ready
      ? ("REAL_SCENE_IMAGES_REQUIRED" as const)
      : !finalVideo.ready
        ? ("FINAL_MP4_REQUIRED" as const)
        : null;

  return {
    scriptEngine,
    realTts,
    realImages,
    finalVideo,
    mediaQualityGate: { ok: reasons.length === 0, reasons, blockerCode },
  };
}
