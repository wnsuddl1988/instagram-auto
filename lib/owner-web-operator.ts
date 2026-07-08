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
 */
function buildSanitizedChildEnv(): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = Object.create(null);
  for (const name of SAFE_CHILD_OS_ENV_KEYS) {
    const v = process.env[name];
    if (typeof v === "string") env[name] = v;
  }
  for (const name of APPROVED_ENV_KEY_NAMES) {
    const v = process.env[name];
    if (typeof v === "string" && v !== "") env[name] = v;
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

    case "status":
    case "topicRecommend":
    case "scriptPreview":
    case "previewStatus":
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
  opts?: { allowArm?: boolean; timeoutMs?: number },
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

  const result = spawnSync(process.execPath, [scriptAbs, ...command.args], {
    cwd: repoRoot,
    env: buildSanitizedChildEnv(),
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

/** topic bank의 씨앗 1개 — 대본 생성에 필요한 구조를 전부 갖는다. */
type WizardTopicSeed = {
  slug: string; // [a-z0-9-]만. topicId = gen-<category>-<slug>
  title: string;
  hook: string;
  angle: WizardTopicAngle;
  points: [string, string, string];
  save: string; // 저장/행동 유도 문구
};

/**
 * 로컬 topic bank — 8개 카테고리 × 12개 씨앗.
 * 특정 인물/사건/검증 불가한 수치 주장 없이, 생활 밀착형 evergreen 주제만 담는다.
 * 이미 게시된 t1_lifestyle_inflation / t2_salary_3days / base-rate 계열은 넣지 않는다.
 */
const TOPIC_BANK: Record<WizardCategoryId, WizardTopicSeed[]> = {
  finance: [
    { slug: "subscription-audit", title: "나도 모르게 새는 구독료 잡는 법", hook: "구독료, 합쳐 보면 생각보다 큽니다", angle: "실수", points: ["한 달 구독 목록 전부 적어보기", "석 달 안 쓴 서비스 해지하기", "연간 결제 전환 여부 따져보기"], save: "저장해 두고 이번 주말에 구독 정리해 보세요" },
    { slug: "pay-day-routine", title: "월급날 10분 루틴이 통장을 지킨다", hook: "월급날, 딱 10분이면 됩니다", angle: "루틴", points: ["고정비 통장 먼저 채우기", "생활비 한도 정해 옮기기", "남는 돈 자동으로 저축하기"], save: "월급날 알림에 이 루틴을 붙여 두세요" },
    { slug: "impulse-buy-24h", title: "지름신 잡는 24시간 규칙", hook: "사고 싶을 때, 딱 하루만 참아보세요", angle: "심리", points: ["장바구니에 담고 하루 기다리기", "내일도 갖고 싶은지 다시 보기", "같은 돈의 다른 쓰임 떠올리기"], save: "충동구매가 잦다면 저장해 두세요" },
    { slug: "coffee-math", title: "커피값 아끼라는 말이 틀린 이유", hook: "문제는 커피가 아닙니다", angle: "반전", points: ["작은 지출보다 고정비부터 보기", "통신비와 보험료 다시 견적 내기", "아끼는 돈은 바로 이체하기"], save: "고정비 점검 체크리스트로 저장하세요" },
    { slug: "emergency-fund", title: "비상금은 얼마가 적당할까", hook: "비상금, 감으로 정하면 부족합니다", angle: "숫자", points: ["한 달 필수 지출부터 계산하기", "석 달 치를 목표로 잡기", "꺼내 쓰기 어려운 통장에 두기"], save: "비상금 목표를 저장해 두고 채워가세요" },
    { slug: "card-statement", title: "카드 명세서 5분 리뷰법", hook: "명세서, 안 보면 계속 샙니다", angle: "루틴", points: ["카테고리별로 묶어서 보기", "이름 모를 결제 바로 확인하기", "다음 달 한도 미리 정하기"], save: "매달 말 이 방법으로 점검해 보세요" },
    { slug: "account-split", title: "통장 쪼개기, 3개면 충분한 이유", hook: "통장이 많다고 돈이 모이지 않아요", angle: "꿀팁", points: ["고정비·생활비·저축 딱 3개", "월급날 자동이체로 나누기", "생활비 통장만 들고 다니기"], save: "통장 정리할 때 꺼내 보게 저장하세요" },
    { slug: "small-saving-auto", title: "티끌 모아 태산이 진짜 되는 조건", hook: "방법이 틀리면 티끌은 티끌입니다", angle: "반전", points: ["자동이체로 사람 손 빼기", "금액보다 빈도 먼저 늘리기", "모은 돈은 목적 통장에 두기"], save: "자동 저축 세팅할 때 참고하세요" },
    { slug: "no-spend-day", title: "일주일에 하루, 무지출 데이의 힘", hook: "하루만 지갑을 닫아보세요", angle: "루틴", points: ["요일 정해 무지출 데이 만들기", "그날 쓸 뻔한 돈 기록하기", "기록한 만큼 저축으로 옮기기"], save: "이번 주 무지출 데이를 정해 보세요" },
    { slug: "price-per-use", title: "비싼 물건이 오히려 절약인 경우", hook: "가격 말고 횟수로 나눠 보세요", angle: "반전", points: ["사용 횟수로 개당 비용 계산하기", "자주 쓰는 물건에만 돈 쓰기", "한 번 쓸 물건은 빌리기"], save: "쇼핑 전에 꺼내 볼 수 있게 저장하세요" },
    { slug: "fixed-cost-diet", title: "고정비 다이어트 체크리스트", hook: "매달 나가는 돈부터 줄여야 빨라요", angle: "꿀팁", points: ["통신 요금제 다시 맞추기", "안 쓰는 멤버십 해지하기", "보험 보장 겹치는지 확인하기"], save: "고정비 점검할 때 이 순서대로 해보세요" },
    { slug: "money-diary-3lines", title: "하루 3줄 돈 일기의 효과", hook: "가계부, 3줄이면 충분합니다", angle: "루틴", points: ["오늘 쓴 돈 세 줄로 적기", "기분과 함께 적어 패턴 보기", "일주일마다 한 번 몰아 보기"], save: "오늘부터 3줄 돈 일기를 시작해 보세요" },
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

/**
 * 클릭마다 새 주제 묶음을 만든다: 선택 카테고리 bank에서 무작위 부분집합+순서.
 * 생성된 주제는 레포 밖 카탈로그 파일에 누적 저장되어, 이후 대본/음성/영상 단계가
 * topicId만으로 같은 주제 구조를 되찾을 수 있다. 외부 API 호출 없음.
 */
export function generateWizardTopicBatch(
  category: WizardCategoryId,
): { batchId: string; category: WizardCategoryId; topics: WizardTopic[] } | null {
  const pool = TOPIC_BANK[category];
  if (!pool || pool.length === 0) return null;

  // Fisher–Yates 셔플 후 앞에서 batch size만큼 자른다.
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const picked = shuffled.slice(0, Math.min(WIZARD_TOPIC_BATCH_SIZE, shuffled.length));

  const records: WizardGeneratedTopicRecord[] = picked.map((seed) => ({
    ...seed,
    topicId: `gen-${category}-${seed.slug}`,
    category,
  }));

  // 카탈로그 병합 저장(레포 밖). topicId가 씨앗별로 고정이라 병합은 멱등이다.
  try {
    const existing = readWizardTopicCatalogFile();
    for (const r of records) existing[r.topicId] = r;
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
      reason: `${CATEGORY_LABELS[category]} · ${r.angle}형 훅`,
      scriptReady: true, // 대본 생성에 필요한 구조(title/hook/points/save)를 전부 갖는다.
      recommended: false,
      category,
      angle: r.angle,
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

/** 생성 주제 레코드 → 대본(WizardScriptPreview 동일 구조). topicId가 같으면 항상 같은 대본. */
function buildScriptFromGeneratedTopic(rec: WizardGeneratedTopicRecord): WizardScriptPreview {
  const curiosity = ANGLE_CURIOSITY[rec.angle] ?? ANGLE_CURIOSITY["꿀팁"];
  const twist = ANGLE_TWIST[rec.angle] ?? ANGLE_TWIST["꿀팁"];
  const [p1, p2, p3] = rec.points;
  const fullVoiceover =
    `${rec.hook} ${curiosity} ` +
    `첫째, ${p1}. 둘째, ${p2}. 셋째, ${p3}. ` +
    `${twist} ${rec.save}.`;
  const { hookScore, clarityScore } = estimateScores(rec);
  return {
    topicId: rec.topicId,
    title: rec.title,
    hook: rec.hook,
    curiosity,
    points: [...rec.points],
    twist,
    action: rec.save,
    captionLines: [rec.hook, curiosity, p1, p2, p3, rec.save],
    fullVoiceover,
    hookScore,
    clarityScore,
  };
}

export type WizardScriptPreview = {
  topicId: string;
  title: string;
  hook: string;
  curiosity: string;
  points: string[];
  twist: string;
  action: string;
  captionLines: string[];
  fullVoiceover: string;
  hookScore: number | null;
  clarityScore: number | null;
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
  return {
    topicId,
    title: s.topic,
    hook: cand?.selectedHookText ?? s.hook ?? "",
    curiosity: s.curiosity ?? "",
    points: s.points ?? [],
    twist: s.twist_or_reframe ?? "",
    action: s.action_or_save_reason ?? "",
    captionLines: s.caption_lines ?? [],
    fullVoiceover: s.full_voiceover ?? "",
    hookScore: cand?.scores?.hook_score ?? null,
    clarityScore: cand?.scores?.script_clarity_score ?? null,
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

  const script = readScriptPreview(topicId);
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
export function readWizardVideoBytes(which: "muxed" | "silent", topicId?: string | null): Buffer | null {
  const status = readWizardVideoStatus(topicId);
  const p = which === "muxed" ? status.muxedMp4Path : status.silentMp4Path;
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

  const script = readScriptPreview(topicId);
  if (!script) return { ok: false, reason: "script_not_compiled_for_topic" };

  const video = readWizardVideoStatus(topicId);
  if (!video.exists || !video.muxedMp4Path) return { ok: false, reason: "video_not_created_yet" };
  const muxedAbs = resolve(video.muxedMp4Path);
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
      "web wizard가 선택 주제로 생성한 content unit. 시안 영상(색상 카드+테스트 소리) 기준이며, " +
      "실제 게시는 final E2E runner의 모든 gate(중복/키/승인/--arm)를 통과해야만 일어난다.",
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
