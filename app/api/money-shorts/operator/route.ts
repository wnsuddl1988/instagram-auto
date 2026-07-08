/**
 * /api/money-shorts/operator — 웹 운영 콘솔의 safe local control API.
 *
 * task: owner-web-operator-ui-local-control-v1
 *
 * GET  → 런타임 기본 상태(로컬 dev 여부, 실행 가능한 버튼, 업로드 키 준비 여부)
 * POST → { action, ...입력 } 형태의 고정 enum action 실행
 *
 * 이 route가 **하지 않는 것**(가드가 강제):
 * - 실제 Instagram publish / YouTube upload / Vercel Blob 조작 / ledger write
 * - `--arm` 실행, live 게시 경로 진입
 * - 임의 명령/셸 문자열 실행
 * - `.env`/`.env.local` 직접 read
 * - credential 값 또는 값 파생(길이/prefix/suffix/hash/masked) 출력
 *
 * 모든 실행은 lib/owner-web-operator.ts의 하드코딩된 스크립트 목록을 통해서만 이뤄지며,
 * spawnSync(process.execPath, argsArray, { shell:false, timeout, cwd:repoRoot })만 사용한다.
 */

import { NextResponse } from "next/server";

import {
  APPROVED_ENV_KEY_NAMES,
  LOCAL_ONLY_BLOCKER,
  OPERATOR_ACTIONS,
  type OperatorAction,
  buildOperatorCommand,
  isLocalDevRuntime,
  readCredentialPresence,
  readFinalE2ePreflightResult,
  runOperatorScript,
} from "@/lib/owner-web-operator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 로컬 스크립트 실행이 필요한 action(배포 사이트에서는 차단). */
const LOCAL_SCRIPT_ACTIONS: OperatorAction[] = [
  "credentialPreflight",
  "readyPreflight",
  "readyDuplicateGuard",
  "finalE2ePreflight",
];

type OperatorStatus = "success" | "blocked" | "error";

type OperatorResponse = {
  action: OperatorAction;
  status: OperatorStatus;
  /** 사람이 읽는 한 줄 요약(UI가 그대로 보여준다). */
  summary: string;
  /** 부가 설명(선택). */
  detail?: string;
  blockerCode?: string;
  /** raw JSON — UI의 <details> 안에만 표시된다. secret 없음. */
  raw?: unknown;
  /** 이 응답을 만들면서 외부 API/업로드/게시를 하지 않았음을 명시. */
  noLive: true;
};

const PRODUCTION_NOTICE =
  "이 기능은 로컬 실행 화면에서만 동작합니다. 배포 사이트에서는 상태 확인만 가능합니다.";

function json(body: OperatorResponse, httpStatus = 200) {
  return NextResponse.json(body, { status: httpStatus });
}

// ── GET: 기본 상태 ────────────────────────────────────────────────────────────

export async function GET() {
  const localDev = isLocalDevRuntime();
  const presence = readCredentialPresence();
  const readyCount = APPROVED_ENV_KEY_NAMES.filter((k) => presence[k] === true).length;

  return json({
    action: "status",
    status: "success",
    summary: localDev
      ? "로컬 실행 화면입니다. 아래 버튼으로 준비 상태를 확인할 수 있습니다."
      : "배포 사이트입니다. 상태 확인만 가능하고, 실제 준비 작업은 로컬 화면에서 실행합니다.",
    detail: PRODUCTION_NOTICE,
    raw: {
      localDev,
      // key 이름 + present boolean만. 값/길이/prefix/hash 없음.
      credentialKeyNames: [...APPROVED_ENV_KEY_NAMES],
      credentialPresence: presence,
      credentialReadyCount: readyCount,
      credentialRequiredCount: APPROVED_ENV_KEY_NAMES.length,
      availableActions: [...OPERATOR_ACTIONS],
      localScriptActions: LOCAL_SCRIPT_ACTIONS,
      actualUploadEnabled: false,
      actualUploadNote: "실제 업로드는 별도 승인 후 활성화됩니다. 지금은 게시 전 점검까지만 가능합니다.",
    },
    noLive: true,
  });
}

// ── POST: action 실행 ─────────────────────────────────────────────────────────

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json(
      { action: "status", status: "error", summary: "요청 형식이 올바르지 않습니다.", blockerCode: "INVALID_JSON_BODY", noLive: true },
      400,
    );
  }

  const rawAction = (body as { action?: unknown } | null)?.action;
  if (typeof rawAction !== "string" || !(OPERATOR_ACTIONS as readonly string[]).includes(rawAction)) {
    return json(
      {
        action: "status",
        status: "error",
        summary: "허용되지 않은 작업입니다.",
        blockerCode: "UNSUPPORTED_ACTION",
        noLive: true,
      },
      400,
    );
  }
  const action = rawAction as OperatorAction;

  // status는 스크립트를 실행하지 않는다.
  if (action === "status") {
    return GET();
  }

  // 배포 사이트에서는 로컬 스크립트 실행 action을 차단한다.
  if (LOCAL_SCRIPT_ACTIONS.includes(action) && !isLocalDevRuntime()) {
    return json({
      action,
      status: "blocked",
      summary: PRODUCTION_NOTICE,
      detail: "실제 영상 생성과 게시 준비는 Owner PC에서 pnpm dev로 연 로컬 화면에서 실행합니다.",
      blockerCode: LOCAL_ONLY_BLOCKER,
      noLive: true,
    });
  }

  const input = body as { contentUnitPath?: string; ledgerPath?: string; outDir?: string };
  const built = buildOperatorCommand(action, input);
  if (!built.ok) {
    return json({
      action,
      status: "error",
      summary: describeBuildFailure(built.reason),
      blockerCode: built.reason,
      noLive: true,
    });
  }

  const run = runOperatorScript(built.command);
  if (!run.ran) {
    return json({
      action,
      status: "error",
      summary: "점검 프로그램을 실행하지 못했습니다.",
      detail: run.stderr,
      blockerCode: "SCRIPT_NOT_RUN",
      noLive: true,
    });
  }
  if (run.timedOut) {
    return json({
      action,
      status: "error",
      summary: "점검이 시간 안에 끝나지 않았습니다. 잠시 후 다시 시도해 주세요.",
      blockerCode: "SCRIPT_TIMEOUT",
      noLive: true,
    });
  }

  // finalE2ePreflight runner는 결과를 stdout이 아니라 out-dir 파일에 쓴다(stdout은 경로만).
  // 그 파일이 있으면 그것을 판정 근거로 쓰고, 없으면 stdout/stderr로 폴백한다.
  // out-dir은 buildOperatorCommand가 이미 절대경로로 검증한 값을 그대로 사용한다.
  let parsed = run.json;
  if (action === "finalE2ePreflight") {
    const outDirIdx = built.command.args.indexOf("--out-dir");
    const validatedOutDir = outDirIdx !== -1 ? built.command.args[outDirIdx + 1] : null;
    if (validatedOutDir) parsed = readFinalE2ePreflightResult(validatedOutDir) ?? run.json;
  }

  return json(interpret(action, run.exitCode, parsed, run.stderr));
}

// ── 결과 해석: 사람이 읽는 요약을 서버에서 만든다 ─────────────────────────────

function describeBuildFailure(reason: string): string {
  if (reason === "contentUnitPath_not_found") return "콘텐츠 정보 파일을 찾을 수 없습니다. 경로를 다시 확인해 주세요.";
  if (reason.endsWith("_must_be_absolute_path")) return "경로는 전체 경로로 입력해 주세요. (예: C:\\tmp\\...)";
  if (reason.endsWith("_missing")) return "필요한 경로가 비어 있습니다. 3개 칸을 모두 채워 주세요.";
  return "입력한 경로를 사용할 수 없습니다.";
}

function interpret(
  action: OperatorAction,
  exitCode: number | null,
  parsed: unknown | null,
  stderr: string,
): OperatorResponse {
  const raw = parsed ?? { exitCode, stderr };

  if (action === "credentialPreflight") {
    const p = parsed as { allRequiredKeysPresent?: boolean; readyForCredentialResolution?: boolean } | null;
    const presence = readCredentialPresence();
    const ready = APPROVED_ENV_KEY_NAMES.filter((k) => presence[k] === true).length;
    const total = APPROVED_ENV_KEY_NAMES.length;
    const allPresent = p?.allRequiredKeysPresent === true || ready === total;
    return {
      action,
      status: allPresent ? "success" : "blocked",
      summary: allPresent
        ? `업로드 키 ${total}개가 모두 준비되어 있습니다.`
        : `업로드 키가 ${ready}/${total}개만 준비되어 있습니다. 남은 키를 채워야 게시할 수 있습니다.`,
      detail: "키의 존재 여부만 확인했고, 키 값은 읽거나 표시하지 않았습니다.",
      blockerCode: allPresent ? undefined : "CREDENTIALS_INCOMPLETE",
      raw,
      noLive: true,
    };
  }

  if (action === "readyPreflight") {
    const pf = (parsed as { preflight?: { preflightOk?: boolean; sourceFilesReady?: boolean } } | null)?.preflight;
    const ok = pf?.preflightOk === true;
    return {
      action,
      status: ok ? "success" : "blocked",
      summary: ok
        ? "시스템 준비 상태가 정상입니다. 영상 파일과 설정이 모두 확인됐습니다."
        : "아직 준비되지 않은 항목이 있습니다. 아래 자세한 내용을 확인해 주세요.",
      detail: "확인만 했고, 업로드나 게시는 실행하지 않았습니다.",
      blockerCode: ok ? undefined : "PREFLIGHT_NOT_READY",
      raw,
      noLive: true,
    };
  }

  if (action === "readyDuplicateGuard") {
    const ref = (parsed as { preflight?: { duplicatePublishReference?: { instagramAlreadyPublished?: boolean; youtubeAlreadyPublished?: boolean; retryForbidden?: boolean } } } | null)
      ?.preflight?.duplicatePublishReference;
    const blocked = ref?.instagramAlreadyPublished === true && ref?.youtubeAlreadyPublished === true && ref?.retryForbidden === true;
    return {
      action,
      status: blocked ? "success" : "blocked",
      summary: blocked
        ? "이미 올린 샘플이라 재업로드가 안전하게 차단됐습니다."
        : "재업로드 차단 상태를 확인하지 못했습니다. 아래 자세한 내용을 확인해 주세요.",
      detail: "같은 영상을 두 번 올리지 않도록 막는 장치가 작동 중인지 확인한 것입니다.",
      blockerCode: blocked ? undefined : "DUPLICATE_GUARD_UNVERIFIED",
      raw,
      noLive: true,
    };
  }

  // finalE2ePreflight — runner는 --arm 없이 실행되어 PREFLIGHT_ONLY_OK로 끝나야 정상.
  const status = (parsed as { status?: string } | null)?.status;
  if (status === "PREFLIGHT_ONLY_OK") {
    return {
      action,
      status: "success",
      summary: "게시 전 점검만 완료했습니다. 실제 업로드는 실행하지 않았습니다.",
      detail: "모든 사전 확인을 통과했습니다. 실제 업로드는 별도 승인 후 활성화됩니다.",
      raw,
      noLive: true,
    };
  }

  // runner가 이른 gate에서 멈추면 stdout JSON 없이 stderr에 `BLOCKED: <CODE>`만 남는다.
  const blockerCode =
    (parsed as { blockerCode?: string } | null)?.blockerCode ??
    /BLOCKED:\s*([A-Z0-9_]+)/.exec(stderr)?.[1] ??
    "PREFLIGHT_BLOCKED";

  return {
    action,
    status: "blocked",
    summary: describeE2eBlocker(blockerCode),
    detail: "확인만 했고, 실제 업로드는 실행하지 않았습니다.",
    blockerCode,
    raw,
    noLive: true,
  };
}

/** 게시 전 점검에서 막힌 이유를 Owner가 읽을 수 있는 한국어로 설명한다. */
function describeE2eBlocker(code: string): string {
  switch (code) {
    case "DUPLICATE_ALREADY_PUBLISHED":
      return "이미 올린 콘텐츠라 재업로드가 안전하게 차단됐습니다.";
    case "CREDENTIALS_ABSENT_OWNER_RUN_REQUIRED":
      return "업로드 키가 준비되지 않아 점검을 마치지 못했습니다.";
    case "DEFAULT_EVIDENCE_CONTENT_FORBIDDEN":
      return "이 콘텐츠는 이미 게시된 기본 샘플이라 사용할 수 없습니다.";
    case "CONTENT_UNIT_NOT_FOUND":
    case "CONTENT_UNIT_JSON_PARSE_FAILED":
      return "콘텐츠 정보 파일을 읽을 수 없습니다. 경로와 파일 내용을 확인해 주세요.";
    case "INSTAGRAM_SOURCE_NOT_FOUND":
    case "YOUTUBE_SOURCE_NOT_FOUND":
      return "영상 파일을 찾을 수 없습니다. 영상이 만들어졌는지 확인해 주세요.";
    case "METADATA_GATE_FAILED":
      return "제목·설명·해시태그에 보완할 항목이 있습니다.";
    case "RESULT_ALREADY_EXISTS_ONE_SHOT":
      return "이 폴더에는 이미 실행 결과가 있습니다. 다른 결과 저장 폴더를 지정해 주세요.";
    case "OUT_DIR_INSIDE_REPO":
    case "LEDGER_INSIDE_REPO":
      return "결과 저장 폴더와 기록 파일은 프로젝트 폴더 바깥에 있어야 합니다.";
    case "PUBLISH_LEDGER_READ_FAILED":
      return "업로드 기록 파일을 읽을 수 없습니다. 경로를 확인해 주세요.";
    default:
      return "게시 전 점검에서 막힌 항목이 있습니다. 아래 자세한 내용을 확인해 주세요.";
  }
}
