/**
 * owner-web-operator.ts — 웹 운영 콘솔(/money-shorts)이 호출하는 safe local control helper.
 *
 * task: owner-web-operator-ui-local-control-v1
 *
 * 이 모듈의 유일한 목적은 **이미 검증된 기존 automation 스크립트**를, 웹 버튼에서
 * 안전하게(no-live, preflight-only) 호출할 수 있게 감싸는 것이다.
 *
 * 보안 계약(가드가 강제):
 * - 실행 가능한 명령은 아래 ACTION_COMMANDS에 하드코딩된 것뿐이다. 임의 명령/셸 문자열 없음.
 * - spawnSync(process.execPath, argsArray, { shell:false }) 만 사용한다.
 * - `--arm`, `--live`, `--approval` 같은 실행 인자는 어떤 경로로도 붙지 않는다.
 * - `.env`/`.env.local` 등 secret 파일을 직접 읽지 않는다.
 * - child env는 승인된 6개 key만 전달하며, 값은 읽어서 전달만 하고 절대 출력/파생/저장하지 않는다.
 * - stdout/stderr는 반환 전 secret-shaped 토큰을 REDACTED로 치환한다.
 * - Vercel/production runtime에서는 로컬 스크립트 실행 action을 LOCAL_AUTOMATION_REQUIRES_LOCAL_DEV로 차단한다.
 */

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { isAbsolute, join, resolve } from "node:path";

// ── 상수 ─────────────────────────────────────────────────────────────────────

/** 웹에서 호출 가능한 action enum. 이 목록 밖의 값은 전부 거부된다. */
export const OPERATOR_ACTIONS = [
  "status",
  "credentialPreflight",
  "readyPreflight",
  "readyDuplicateGuard",
  "finalE2ePreflight",
  // ── 자동 쇼츠 만들기 위저드 (task: owner-one-click-video-creation-ui-v1) ──
  "topicRecommend", // 로컬 fixture 기반 주제 추천 (spawn 없음, 읽기 전용)
  "scriptPreview", // 규칙 기반 대본 컴파일 결과 미리보기 (spawn 없음, 읽기 전용)
  "voiceSample", // local_mock TTS 시안 생성 (무료, 외부 API 없음)
  "videoCreate", // 로컬 파이프라인 dry-run으로 시안 영상 생성 (업로드 없음)
  "previewStatus", // 생성된 시안 영상 파일 상태 확인 (spawn 없음, 읽기 전용)
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
// voiceSample용 로컬 mock TTS 대본(주제 무관 — 음성 트랙 파이프라인 검증 전용).
const FIXTURE_TTS_SCRIPT = "scripts/fixtures/provider-candidate-tts-script.local-mock.json";

/**
 * 위저드 산출물 저장 위치(레포 밖 고정 경로, 하드코딩).
 * 파이프라인 스크립트 자체가 repo 안 out-dir을 거부하므로 이중 방어가 된다.
 */
export const WIZARD_VIDEO_OUT_ROOT = "C:\\tmp\\money-shorts-os\\web-wizard-create-v1";
export const WIZARD_VOICE_OUT_DIR = "C:\\tmp\\money-shorts-os\\web-wizard-voice-v1";

/** 위저드가 topic별로 생성하는 입력 JSON의 루트(레포 밖 고정). */
const WIZARD_INPUTS_ROOT = "C:\\tmp\\money-shorts-os\\web-wizard-create-v1\\inputs";

/** 위저드 시안 영상 스트리밍이 허용되는 유일한 경로 prefix. */
const WIZARD_VIDEO_ALLOWED_PREFIX = "C:\\tmp\\money-shorts-os\\";

/**
 * final E2E runner의 gate 1을 통과하기 위한 승인 문구. 이것은 secret이 아니라
 * Owner 승인 문자열이며, 이 문구만으로는 아무것도 게시되지 않는다.
 * runner에서 **실제 게시 경로를 여는 유일한 인자는 `--arm`**이고, 이 helper는 그것을 절대 붙이지 않는다.
 * (`--arm` 없으면 runner는 gate 9에서 PREFLIGHT_ONLY_OK로 종료한다.)
 */
const FINAL_E2E_PREFLIGHT_APPROVAL = "APPROVE_FINAL_E2E_AUTOMATION_PUBLISH_ONE_NEW_CONTENT_UNIT";

/**
 * 절대 인자에 등장해서는 안 되는 토큰. 실행 직전 한 번 더 검사한다(이중 방어).
 * live 게시를 여는 인자는 `--arm`(및 orchestrator의 `--live`)뿐이다.
 */
const FORBIDDEN_ARG_TOKENS = ["--arm", "--live"] as const;

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

    case "voiceSample":
      // local_mock TTS: 로컬 placeholder 소리(실제 음성 아님). 외부 API 0.
      // 인자 전부 하드코딩 — 사용자 입력이 args에 들어갈 여지가 없다.
      return {
        ok: true,
        command: {
          script: SCRIPT_MOCK_TTS,
          args: ["--tts-script", FIXTURE_TTS_SCRIPT, "--out-dir", WIZARD_VOICE_OUT_DIR],
        },
      };

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
 */
export function runOperatorScript(command: OperatorCommand): OperatorRunResult {
  const repoRoot = getRepoRoot();
  const scriptAbs = resolve(join(repoRoot, command.script));

  // 이중 방어: 실행 직전 금지 토큰 재검사.
  for (const arg of command.args) {
    for (const forbidden of FORBIDDEN_ARG_TOKENS) {
      if (arg === forbidden) {
        return { ran: false, exitCode: null, stdout: "", stderr: `forbidden_arg:${forbidden}`, json: null, timedOut: false };
      }
    }
  }
  if (!existsSync(scriptAbs)) {
    return { ran: false, exitCode: null, stdout: "", stderr: "script_not_found", json: null, timedOut: false };
  }

  const result = spawnSync(process.execPath, [scriptAbs, ...command.args], {
    cwd: repoRoot,
    env: buildSanitizedChildEnv(),
    shell: false,
    timeout: SPAWN_TIMEOUT_MS,
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
  if (!t) return null;
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
export function readVoiceSampleStatus(): WizardVoiceStatus {
  const summary = readAbsJson(join(WIZARD_VOICE_OUT_DIR, "local-mock-tts-audio-summary.json")) as {
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
