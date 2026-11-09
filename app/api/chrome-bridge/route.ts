/**
 * Chrome Bridge API
 *
 * POST /api/chrome-bridge/launch      — allowlisted Chrome 프로필 실행
 * POST /api/chrome-bridge/scan        — allowlisted downloadDir 에서 새 이미지 감지
 * POST /api/chrome-bridge/register    — 감지 파일을 프로젝트 관리 폴더로 안전하게 복사
 * POST /api/chrome-bridge/open-folder — allowlisted output 경로만 탐색기(explorer)로 열기
 *
 * 보안:
 *  - 임의 경로·URL·명령 주입 불가 (allowlist 대조 필수)
 *  - shell: false, 고정 인자만 사용
 *  - AppData 내부 파일 읽기 없음
 *  - 인증정보·쿠키·세션 접근 없음
 *  - register: 원본 파일 삭제·수정 없음, allowlist 외부 경로 차단
 *  - open-folder: MANUAL_IMAGES_BASE 하위 경로만 허용
 */

import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import {
  CHROME_EXE,
  ALLOWED_DOWNLOAD_DIRS,
  getProfileByAlias,
} from "@/lib/chromeProfiles";

/** 프로젝트 루트 기준 수동 AI 이미지 저장 폴더 */
const PROJECT_ROOT = path.resolve(process.cwd());
const MANUAL_IMAGES_BASE = path.join(PROJECT_ROOT, "output", "v2", "manual_ai_images");

const ALLOWED_EXTS = new Set([".png", ".jpg", ".jpeg", ".webp"]);
const MIN_FILE_SIZE = 1024; // 0바이트·임시 파일 제외 (1 KB 기준)

// ── 유틸 ─────────────────────────────────────────────────────────────────────

/** downloadDir 가 allowlist 에 속하는지 확인 */
function isAllowedDir(dir: string): boolean {
  return ALLOWED_DOWNLOAD_DIRS.has(dir);
}

// ── 라우터 ────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  if (action === "launch") return handleLaunch(req);
  if (action === "scan") return handleScan(req);
  if (action === "register") return handleRegister(req);
  if (action === "open-folder") return handleOpenFolder(req);

  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}

/**
 * GET /api/chrome-bridge?action=preview&alias=GPT+1&fileName=xxx.png
 * allowlisted downloadDir 내 이미지 파일을 안전하게 서빙한다.
 * - alias + fileName만 허용 (절대경로 클라이언트 노출 없음)
 * - allowlisted downloadDir 내부인지 재검증
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  if (url.searchParams.get("action") !== "preview") {
    return new NextResponse("action must be preview", { status: 400 });
  }
  const alias = url.searchParams.get("alias");
  const fileName = url.searchParams.get("fileName");

  if (!alias || !fileName) {
    return new NextResponse("alias and fileName required", { status: 400 });
  }
  if (fileName.includes("/") || fileName.includes("\\") || fileName.includes("..")) {
    return new NextResponse("invalid fileName", { status: 400 });
  }

  const profile = getProfileByAlias(alias);
  if (!profile) return new NextResponse("unknown alias", { status: 403 });
  if (!isAllowedDir(profile.downloadDir)) return new NextResponse("downloadDir not in allowlist", { status: 403 });

  const ext = path.extname(fileName).toLowerCase();
  if (!ALLOWED_EXTS.has(ext)) return new NextResponse("extension not allowed", { status: 400 });

  const fullPath = path.resolve(path.join(profile.downloadDir, fileName));
  const resolvedDir = path.resolve(profile.downloadDir);
  if (!fullPath.startsWith(resolvedDir + path.sep)) {
    return new NextResponse("path traversal denied", { status: 403 });
  }

  const MIME_MAP: Record<string, string> = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
  };

  try {
    const raw = fs.readFileSync(fullPath);
    const buf = raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength) as ArrayBuffer;
    return new NextResponse(buf as unknown as BodyInit, {
      status: 200,
      headers: { "Content-Type": MIME_MAP[ext] ?? "image/png", "Cache-Control": "no-store" },
    });
  } catch {
    return new NextResponse("file not found", { status: 404 });
  }
}

// ── launch ────────────────────────────────────────────────────────────────────

async function handleLaunch(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const alias: unknown = body.alias;

  if (typeof alias !== "string") {
    return NextResponse.json({ error: "alias required" }, { status: 400 });
  }

  const profile = getProfileByAlias(alias);
  if (!profile) {
    return NextResponse.json(
      { error: "unknown profile alias — not in allowlist" },
      { status: 403 }
    );
  }

  // 고정 인자, shell:false — 명령 주입 불가
  const args = [
    `--user-data-dir=${profile.userDataDir}`,
    profile.url,
  ];

  try {
    const child = spawn(CHROME_EXE, args, {
      detached: true,
      shell: false,
      stdio: "ignore",
    });
    child.on("error", () => { /* detached child errors ignored */ });
    child.unref();
  } catch (err: unknown) {
    const e = err as NodeJS.ErrnoException;
    // Chrome 실행 파일을 찾을 수 없는 경우
    if (e.code === "ENOENT") {
      return NextResponse.json(
        { error: "Chrome 실행 파일을 찾을 수 없습니다. 설치 경로를 확인하세요.", code: "ENOENT" },
        { status: 500 }
      );
    }
    // 이미 실행 중인 경우 (프로파일 잠금)
    if (e.code === "EACCES" || e.code === "EPERM" || e.code === "EBUSY") {
      return NextResponse.json(
        { error: `${profile.alias}이(가) 이미 실행 중입니다.`, code: "ALREADY_RUNNING" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: `Chrome 실행 실패: ${String(err)}`, code: e.code ?? "UNKNOWN" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    alias: profile.alias,
    url: profile.url,
  });
}

// ── scan ──────────────────────────────────────────────────────────────────────

async function handleScan(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const alias: unknown = body.alias;
  const since: unknown = body.since; // ISO string or epoch ms

  if (typeof alias !== "string") {
    return NextResponse.json({ error: "alias required" }, { status: 400 });
  }

  const profile = getProfileByAlias(alias);
  if (!profile) {
    return NextResponse.json(
      { error: "unknown profile alias — not in allowlist" },
      { status: 403 }
    );
  }

  const downloadDir = profile.downloadDir;
  if (!isAllowedDir(downloadDir)) {
    // 이중 방어 — allowlist 불일치 시 거부
    return NextResponse.json(
      { error: "downloadDir not in allowlist" },
      { status: 403 }
    );
  }

  // since 파싱 — 없으면 5분 전
  const sinceMs =
    typeof since === "number"
      ? since
      : typeof since === "string"
      ? new Date(since).getTime()
      : Date.now() - 5 * 60 * 1000;

  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(downloadDir, { withFileTypes: true });
  } catch {
    // 폴더가 없으면 빈 목록 반환
    return NextResponse.json({ files: [] });
  }

  const candidates = entries
    .filter((e) => e.isFile())
    .filter((e) => ALLOWED_EXTS.has(path.extname(e.name).toLowerCase()))
    .map((e) => {
      const fullPath = path.join(downloadDir, e.name);
      try {
        const stat = fs.statSync(fullPath);
        return {
          name: e.name,
          path: fullPath,
          size: stat.size,
          createdMs: stat.birthtimeMs || stat.mtimeMs,
          modifiedMs: stat.mtimeMs,
        };
      } catch {
        return null;
      }
    })
    .filter(
      (f): f is NonNullable<typeof f> =>
        f !== null &&
        f.size >= MIN_FILE_SIZE &&
        // 임시 다운로드 파일 제외 (.crdownload, .part 등)
        !f.name.endsWith(".crdownload") &&
        !f.name.endsWith(".part") &&
        // since 이후 생성·수정된 파일만
        (f.createdMs >= sinceMs || f.modifiedMs >= sinceMs)
    )
    .sort((a, b) => b.modifiedMs - a.modifiedMs); // 최신순

  return NextResponse.json({ files: candidates });
}

// ── register ──────────────────────────────────────────────────────────────────

/**
 * 감지된 이미지를 프로젝트 관리 폴더로 안전하게 복사한다.
 *
 * Request body:
 *   alias       — Chrome 프로필 별칭 (allowlist 검증용)
 *   fileName    — 감지된 파일명 (경로 아님)
 *   jobId       — 렌더 job ID (영문·숫자·하이픈·언더스코어 만 허용)
 *   sceneNumber — 씬 번호 (1~99 정수)
 *
 * 보안:
 *   - alias → downloadDir 를 allowlist에서 resolve (클라이언트가 임의 경로 주입 불가)
 *   - fileName 에 경로 구분자 포함 시 거부
 *   - 확인된 fullSrcPath 가 allowlisted downloadDir 내부인지 재검증
 *   - jobId / sceneNumber 패턴 검증으로 경로 조작 차단
 *   - 원본 파일은 복사만 하고 삭제·수정 없음
 *   - 동일 씬 재등록 시 임시 파일 → rename 으로 원자적 교체
 */
async function handleRegister(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const alias: unknown = body.alias;
  const fileName: unknown = body.fileName;
  const jobId: unknown = body.jobId;
  const sceneNumber: unknown = body.sceneNumber;

  // ── 입력 검증 ──────────────────────────────────────────────────────────────

  if (typeof alias !== "string") {
    return NextResponse.json({ error: "alias required" }, { status: 400 });
  }
  if (typeof fileName !== "string" || fileName.trim() === "") {
    return NextResponse.json({ error: "fileName required" }, { status: 400 });
  }
  // fileName 에 경로 구분자 포함 여부 확인 (경로 조작 방지)
  if (fileName.includes("/") || fileName.includes("\\") || fileName.includes("..")) {
    return NextResponse.json({ error: "fileName must not contain path separators" }, { status: 400 });
  }
  // 확장자 검증
  const ext = path.extname(fileName).toLowerCase();
  if (!ALLOWED_EXTS.has(ext)) {
    return NextResponse.json({ error: `extension not allowed: ${ext}` }, { status: 400 });
  }
  // jobId: 영문·숫자·하이픈·언더스코어만 허용 (경로 조작 방지)
  if (typeof jobId !== "string" || !/^[a-zA-Z0-9_-]{1,64}$/.test(jobId)) {
    return NextResponse.json({ error: "jobId must be alphanumeric/hyphen/underscore (max 64)" }, { status: 400 });
  }
  // sceneNumber: 1~99 정수
  if (typeof sceneNumber !== "number" || !Number.isInteger(sceneNumber) || sceneNumber < 1 || sceneNumber > 99) {
    return NextResponse.json({ error: "sceneNumber must be integer 1~99" }, { status: 400 });
  }

  // ── 프로필 → downloadDir resolve ──────────────────────────────────────────

  const profile = getProfileByAlias(alias);
  if (!profile) {
    return NextResponse.json({ error: "unknown profile alias" }, { status: 403 });
  }
  const downloadDir = profile.downloadDir;
  if (!isAllowedDir(downloadDir)) {
    return NextResponse.json({ error: "downloadDir not in allowlist" }, { status: 403 });
  }

  // ── 원본 경로 검증 ────────────────────────────────────────────────────────

  const fullSrcPath = path.join(downloadDir, fileName);
  // resolve 후 allowlist 내부인지 재검증 (path traversal 방어)
  const resolvedSrc = path.resolve(fullSrcPath);
  const resolvedDir = path.resolve(downloadDir);
  if (!resolvedSrc.startsWith(resolvedDir + path.sep) && resolvedSrc !== resolvedDir) {
    return NextResponse.json({ error: "source path is outside allowlisted downloadDir" }, { status: 403 });
  }

  let srcStat: fs.Stats;
  try {
    srcStat = fs.statSync(resolvedSrc);
  } catch {
    return NextResponse.json({ error: `source file not found: ${fileName}` }, { status: 404 });
  }
  if (!srcStat.isFile()) {
    return NextResponse.json({ error: "source is not a file" }, { status: 400 });
  }
  if (srcStat.size < MIN_FILE_SIZE) {
    return NextResponse.json({ error: `file too small (${srcStat.size} bytes) — likely incomplete` }, { status: 400 });
  }
  if (fileName.endsWith(".crdownload") || fileName.endsWith(".part")) {
    return NextResponse.json({ error: "temporary download file not allowed" }, { status: 400 });
  }

  // ── 대상 경로 구성 ────────────────────────────────────────────────────────

  const sceneStr = String(sceneNumber).padStart(2, "0");
  const destDir = path.join(MANUAL_IMAGES_BASE, jobId);
  const destFileName = `scene_${sceneStr}${ext}`;
  const destPath = path.join(destDir, destFileName);
  const tempPath = path.join(destDir, `scene_${sceneStr}_tmp${ext}`);

  // 대상 디렉터리 생성
  try {
    fs.mkdirSync(destDir, { recursive: true });
  } catch (err) {
    return NextResponse.json({ error: `failed to create dest dir: ${String(err)}` }, { status: 500 });
  }

  // ── 원자적 복사 (임시 → rename) ───────────────────────────────────────────

  try {
    fs.copyFileSync(resolvedSrc, tempPath);
    // 원본 크기와 복사 크기 검증
    const copyStat = fs.statSync(tempPath);
    if (copyStat.size !== srcStat.size) {
      fs.unlinkSync(tempPath);
      return NextResponse.json({ error: "copy size mismatch — retry" }, { status: 500 });
    }
    // 원자적 rename (동일 씬 재등록 시 기존 파일 안전 교체)
    fs.renameSync(tempPath, destPath);
  } catch (err) {
    // 임시 파일 정리
    try { fs.unlinkSync(tempPath); } catch { /* ignore */ }
    return NextResponse.json({ error: `copy failed: ${String(err)}` }, { status: 500 });
  }

  // 원본 파일이 여전히 존재하는지 확인 (삭제/수정 없음 보장)
  try {
    fs.statSync(resolvedSrc);
  } catch {
    // 원본이 사라졌다면 경고 (우리 코드는 삭제하지 않음 — 외부 원인)
    console.warn(`[chrome-bridge/register] source file gone after copy: ${resolvedSrc}`);
  }

  return NextResponse.json({
    ok: true,
    destPath,
    jobId,
    sceneNumber,
    fileName: destFileName,
    sourceSize: srcStat.size,
  });
}

// ── open-folder ───────────────────────────────────────────────────────────────

/**
 * allowlisted output 경로만 Windows 탐색기로 연다.
 *
 * Request body:
 *   jobId — string (영문·숫자·하이픈·언더스코어만 허용)
 *
 * 보안:
 *   - MANUAL_IMAGES_BASE/<jobId> 경로만 허용 (임의 경로 주입 불가)
 *   - shell: false, explorer.exe 고정 인자만 사용
 *   - 폴더가 없으면 404 반환
 */
async function handleOpenFolder(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const jobId: unknown = body.jobId;

  if (typeof jobId !== "string" || !/^[a-zA-Z0-9_-]{1,64}$/.test(jobId)) {
    return NextResponse.json({ error: "jobId must be alphanumeric/hyphen/underscore (max 64)" }, { status: 400 });
  }

  const targetDir = path.join(MANUAL_IMAGES_BASE, jobId);
  const resolvedTarget = path.resolve(targetDir);
  const resolvedBase = path.resolve(MANUAL_IMAGES_BASE);

  // MANUAL_IMAGES_BASE 내부인지 재검증 (path traversal 방어)
  if (!resolvedTarget.startsWith(resolvedBase + path.sep) && resolvedTarget !== resolvedBase) {
    return NextResponse.json({ error: "target path is outside allowlisted base" }, { status: 403 });
  }

  if (!fs.existsSync(resolvedTarget)) {
    return NextResponse.json({ error: `폴더가 없습니다: ${resolvedTarget}` }, { status: 404 });
  }

  try {
    // Windows 전용: explorer.exe, shell:false
    const child = spawn("explorer.exe", [resolvedTarget], {
      detached: true,
      shell: false,
      stdio: "ignore",
    });
    child.unref();
  } catch (err) {
    return NextResponse.json({ error: `폴더 열기 실패: ${String(err)}` }, { status: 500 });
  }

  return NextResponse.json({ ok: true, openedPath: resolvedTarget });
}
