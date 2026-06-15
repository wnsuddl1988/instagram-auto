/**
 * POST /api/manual-render
 *
 * 수동 AI 이미지(manual_ai_images)가 모두 accepted된 상태에서
 * render_plan.json을 저장하고 로컬 무음 렌더를 실행한다.
 *
 * 보안:
 *  - 외부 API (OpenAI / Imagen / Pexels / Pollinations / ElevenLabs) 호출 없음
 *  - narrationPath 미설정 → 완전 무음 렌더
 *  - jobId는 영문·숫자·하이픈·언더스코어만 허용 (경로 주입 방지)
 *  - localImagePath는 서버가 관리하는 MANUAL_IMAGES_BASE 내부만 허용
 *  - shell: false 대신 execAsync 사용하되 인자는 allowlisted path만 사용
 *  - output 경로는 MANUAL_JOBS_BASE 내부로 고정
 *
 * Actions:
 *  action=save-plan  — render_plan.json + state.json 저장
 *  action=render     — 무음 렌더 실행 (save-plan 먼저 필요)
 *  action=load-state — state.json 불러오기 (새로고침 복구)
 */

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import type { GeneratedReelV2 } from "@/lib/openai";

const execAsync = promisify(exec);

const PROJECT_ROOT = path.resolve(process.cwd());
/** 수동 이미지 원본 폴더 */
const MANUAL_IMAGES_BASE = path.join(PROJECT_ROOT, "output", "v2", "manual_ai_images");
/** 상태·plan·영상 저장 폴더 */
const MANUAL_JOBS_BASE = path.join(PROJECT_ROOT, "output", "v2", "manual_ai_jobs");

// ── 유틸 ─────────────────────────────────────────────────────────────────────

/** jobId 패턴 검증 */
function isValidJobId(id: unknown): id is string {
  return typeof id === "string" && /^[a-zA-Z0-9_-]{1,64}$/.test(id);
}

/** 경로가 baseDir 내부인지 확인 (path traversal 방지) */
function isInsideBase(targetPath: string, baseDir: string): boolean {
  const resolved = path.resolve(targetPath);
  const base = path.resolve(baseDir);
  return resolved.startsWith(base + path.sep) || resolved === base;
}

async function resolvePython(): Promise<string> {
  const candidates = [
    process.env.PYTHON_PATH,
    "python",
    "py",
    "python3",
  ].filter(Boolean) as string[];

  for (const cmd of candidates) {
    try {
      await execAsync(`"${cmd}" --version`);
      return cmd;
    } catch {
      // 다음 후보
    }
  }
  throw new Error("Python 실행 파일을 찾지 못했습니다. PYTHON_PATH 환경변수를 설정해주세요.");
}

// ── 라우터 ────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  if (action === "save-plan") return handleSavePlan(req);
  if (action === "render") return handleRender(req);
  if (action === "load-state") return handleLoadState(req);
  if (action === "save-state") return handleSaveState(req);

  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}

// ── save-plan ─────────────────────────────────────────────────────────────────

/**
 * request body:
 *   jobId           — string
 *   plan            — GeneratedReelV2 (원본 plan)
 *   manualLocalImages — { [sceneNumber: string]: string } (등록된 절대경로)
 *   manualSceneStatuses — { [sceneNumber: string]: string }
 *
 * 동작:
 *  1. 모든 씬이 accepted + localImagePath 존재하는지 검증
 *  2. localImagePath가 MANUAL_IMAGES_BASE 내부인지 검증
 *  3. render_plan.json 저장 (원본 plan + scenes[].localImagePath 병합)
 *  4. state.json 저장 (jobId, 씬별 status + registeredLocalImagePath, updatedAt)
 */
async function handleSavePlan(req: NextRequest) {
  let body: {
    jobId?: unknown;
    plan?: unknown;
    manualLocalImages?: unknown;
    manualSceneStatuses?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const { jobId, plan, manualLocalImages, manualSceneStatuses } = body;

  if (!isValidJobId(jobId)) {
    return NextResponse.json({ error: "jobId must be alphanumeric/hyphen/underscore (max 64)" }, { status: 400 });
  }

  if (typeof plan !== "object" || plan === null || !Array.isArray((plan as GeneratedReelV2).scenes)) {
    return NextResponse.json({ error: "plan with scenes[] required" }, { status: 400 });
  }

  const typedPlan = plan as GeneratedReelV2;
  const localImages = (manualLocalImages ?? {}) as Record<string, string>;
  const statuses = (manualSceneStatuses ?? {}) as Record<string, string>;

  // ── 전체 씬 검증 ────────────────────────────────────────────────────────────

  const sceneValidationErrors: string[] = [];

  for (const sc of typedPlan.scenes) {
    const sceneNum = String(sc.sceneNumber);
    const status = statuses[sceneNum];
    const imgPath = localImages[sceneNum];

    if (status !== "accepted") {
      sceneValidationErrors.push(`씬 ${sceneNum}: 미승인 상태 (${status ?? "없음"})`);
      continue;
    }
    if (!imgPath) {
      sceneValidationErrors.push(`씬 ${sceneNum}: localImagePath 없음`);
      continue;
    }
    // localImagePath가 MANUAL_IMAGES_BASE 내부인지 확인
    if (!isInsideBase(imgPath, MANUAL_IMAGES_BASE)) {
      sceneValidationErrors.push(`씬 ${sceneNum}: localImagePath가 허용 범위 밖 (${imgPath})`);
    }
    // 실제 파일 존재 확인
    if (!fs.existsSync(imgPath)) {
      sceneValidationErrors.push(`씬 ${sceneNum}: 파일 없음 (${imgPath})`);
    }
  }

  if (sceneValidationErrors.length > 0) {
    return NextResponse.json({
      error: "모든 씬이 승인되지 않았거나 이미지가 없습니다.",
      details: sceneValidationErrors,
    }, { status: 400 });
  }

  // ── render_plan 구성 ─────────────────────────────────────────────────────────

  const renderPlan = {
    ...typedPlan,
    narrationPath: null, // 무음 렌더 — TTS 없음
    scenes: typedPlan.scenes.map((sc) => ({
      ...sc,
      localImagePath: localImages[String(sc.sceneNumber)],
      imageProvider: "manual" as const,
    })),
    _manualRender: true,
    _savedAt: new Date().toISOString(),
  };

  // ── 저장 ─────────────────────────────────────────────────────────────────────

  const jobDir = path.join(MANUAL_JOBS_BASE, jobId);
  try {
    fs.mkdirSync(jobDir, { recursive: true });
  } catch (err) {
    return NextResponse.json({ error: `jobDir 생성 실패: ${String(err)}` }, { status: 500 });
  }

  const planPath = path.join(jobDir, "render_plan.json");
  try {
    fs.writeFileSync(planPath, JSON.stringify(renderPlan, null, 2), "utf-8");
  } catch (err) {
    return NextResponse.json({ error: `render_plan.json 저장 실패: ${String(err)}` }, { status: 500 });
  }

  // state.json: 비밀값/Chrome 경로 미포함
  const stateEntries = typedPlan.scenes.map((sc) => {
    const sceneNum = String(sc.sceneNumber);
    return {
      sceneNumber: sc.sceneNumber,
      status: statuses[sceneNum] ?? "awaiting_user_generation",
      registeredLocalImagePath: localImages[sceneNum] ?? null,
      updatedAt: new Date().toISOString(),
    };
  });

  const statePath = path.join(jobDir, "state.json");
  try {
    fs.writeFileSync(
      statePath,
      JSON.stringify({ jobId, scenes: stateEntries, savedAt: new Date().toISOString() }, null, 2),
      "utf-8"
    );
  } catch (err) {
    return NextResponse.json({ error: `state.json 저장 실패: ${String(err)}` }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    planPath,
    statePath,
    sceneCount: typedPlan.scenes.length,
  });
}

// ── render ────────────────────────────────────────────────────────────────────

/**
 * request body:
 *   jobId — string
 *
 * 동작:
 *  1. render_plan.json이 존재하는지 확인
 *  2. python/render_v2.py <planPath> <outputPath> 실행
 *  3. 무음 MP4 경로 반환 + public 폴더 서빙
 */
async function handleRender(req: NextRequest) {
  let body: { jobId?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const { jobId } = body;
  if (!isValidJobId(jobId)) {
    return NextResponse.json({ error: "jobId must be alphanumeric/hyphen/underscore (max 64)" }, { status: 400 });
  }

  const jobDir = path.join(MANUAL_JOBS_BASE, jobId);
  const planPath = path.join(jobDir, "render_plan.json");

  if (!fs.existsSync(planPath)) {
    return NextResponse.json({
      error: "render_plan.json이 없습니다. 먼저 save-plan을 실행하세요.",
    }, { status: 400 });
  }

  // plan 내 localImagePath 재검증 (render 직전 이중 보안)
  let planData: ReturnType<typeof JSON.parse>;
  try {
    planData = JSON.parse(fs.readFileSync(planPath, "utf-8"));
  } catch (err) {
    return NextResponse.json({ error: `render_plan.json 파싱 실패: ${String(err)}` }, { status: 500 });
  }

  const scenes: Array<{ sceneNumber?: number; localImagePath?: string }> =
    planData.scenes ?? [];

  for (const sc of scenes) {
    const imgPath = sc.localImagePath;
    if (!imgPath || !isInsideBase(imgPath, MANUAL_IMAGES_BASE)) {
      return NextResponse.json({
        error: `씬 ${sc.sceneNumber}: localImagePath가 허용 범위 밖`,
      }, { status: 403 });
    }
    if (!fs.existsSync(imgPath)) {
      return NextResponse.json({
        error: `씬 ${sc.sceneNumber}: 이미지 파일 없음 (${imgPath})`,
      }, { status: 400 });
    }
  }

  // 출력 경로
  const outputPath = path.join(jobDir, "silent_preview.mp4");

  // Python 실행
  let pythonCmd: string;
  try {
    pythonCmd = await resolvePython();
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }

  const scriptPath = path.join(PROJECT_ROOT, "python", "render_v2.py");

  // 인자는 서버가 생성한 allowlisted path만 사용 (사용자 입력 없음)
  const runCommand = `"${pythonCmd}" "${scriptPath}" "${planPath}" "${outputPath}"`;

  try {
    const { stdout, stderr } = await execAsync(runCommand, {
      timeout: 300_000,
      maxBuffer: 50 * 1024 * 1024,
    });
    if (stderr) console.warn("[manual-render python stderr]", stderr);
    if (stdout) console.log("[manual-render python stdout]", stdout);
  } catch (err) {
    return NextResponse.json({
      error: `Python 렌더 실패: ${String(err)}`,
    }, { status: 500 });
  }

  if (!fs.existsSync(outputPath)) {
    return NextResponse.json({ error: "렌더 결과물이 생성되지 않았습니다." }, { status: 500 });
  }

  // public/videos 에 복사 (브라우저 미리보기용)
  const publicVideosDir = path.join(PROJECT_ROOT, "public", "videos");
  fs.mkdirSync(publicVideosDir, { recursive: true });
  const publicFileName = `manual_silent_${jobId}.mp4`;
  const publicVideoPath = path.join(publicVideosDir, publicFileName);
  fs.copyFileSync(outputPath, publicVideoPath);

  return NextResponse.json({
    ok: true,
    outputPath,
    videoUrl: `/videos/${publicFileName}`,
  });
}

// ── load-state ────────────────────────────────────────────────────────────────

/**
 * request body:
 *   jobId — string
 *
 * 동작: state.json을 읽어 반환 (새로고침 복구용)
 */
async function handleLoadState(req: NextRequest) {
  let body: { jobId?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const { jobId } = body;
  if (!isValidJobId(jobId)) {
    return NextResponse.json({ error: "invalid jobId" }, { status: 400 });
  }

  const statePath = path.join(MANUAL_JOBS_BASE, jobId, "state.json");
  if (!fs.existsSync(statePath)) {
    return NextResponse.json({ found: false });
  }

  try {
    const stateData = JSON.parse(fs.readFileSync(statePath, "utf-8"));
    return NextResponse.json({ found: true, state: stateData });
  } catch (err) {
    return NextResponse.json({ error: `state.json 읽기 실패: ${String(err)}` }, { status: 500 });
  }
}

// ── save-state ────────────────────────────────────────────────────────────────

/**
 * request body:
 *   jobId, currentSceneNumber, selectedProfileAlias, scenes[]
 *
 * 동작: 이미지 등록/승인/반려 시 즉시 호출 — 새로고침 복구용
 * 보안: 비밀값·다운로드 원본 경로 저장 금지 (서버에서 강제)
 */
async function handleSaveState(req: NextRequest) {
  let body: {
    jobId?: unknown;
    currentSceneNumber?: unknown;
    selectedProfileAlias?: unknown;
    scenes?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const { jobId, currentSceneNumber, selectedProfileAlias, scenes } = body;
  if (!isValidJobId(jobId)) {
    return NextResponse.json({ error: "invalid jobId" }, { status: 400 });
  }
  if (typeof currentSceneNumber !== "number" || currentSceneNumber < 1 || currentSceneNumber > 99) {
    return NextResponse.json({ error: "invalid currentSceneNumber" }, { status: 400 });
  }
  if (!Array.isArray(scenes)) {
    return NextResponse.json({ error: "scenes must be array" }, { status: 400 });
  }

  // 저장 허용 필드만 추출 (비밀값·Chrome 경로·다운로드 원본 경로 제외)
  const safeScenes = (scenes as Record<string, unknown>[]).map((s) => ({
    sceneNumber: typeof s.sceneNumber === "number" ? s.sceneNumber : 0,
    status: typeof s.status === "string" ? s.status : "awaiting_user_generation",
    registeredLocalImagePath: typeof s.registeredLocalImagePath === "string"
      ? s.registeredLocalImagePath
      : null,
  }));

  const stateToSave = {
    jobId,
    currentSceneNumber,
    selectedProfileAlias: typeof selectedProfileAlias === "string" ? selectedProfileAlias : "GPT 1",
    updatedAt: new Date().toISOString(),
    scenes: safeScenes,
  };

  const jobDir = path.join(MANUAL_JOBS_BASE, jobId as string);
  fs.mkdirSync(jobDir, { recursive: true });
  const statePath = path.join(jobDir, "state.json");

  try {
    fs.writeFileSync(statePath, JSON.stringify(stateToSave, null, 2), "utf-8");
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: `state.json 저장 실패: ${String(err)}` }, { status: 500 });
  }
}
