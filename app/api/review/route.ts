/**
 * GET /api/review?id=<renderId>
 *
 * output/v2/<renderId>/ 폴더를 읽어 plan 데이터 + 파일 존재 여부를 반환.
 * 유료 API 호출 없음 — 로컬 파일 읽기 전용.
 */

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// output 루트: 프로젝트 루트 기준
const OUTPUT_ROOT = path.join(process.cwd(), "output", "v2");
// public/videos 경로 (최종 mp4 복사본이 있는 경우)
const PUBLIC_VIDEOS_ROOT = path.join(process.cwd(), "public", "videos");

// ── 타입 ─────────────────────────────────────────────────────────────────────

interface SceneReview {
  sceneNumber: number;
  durationSec: number;
  narration: string;
  caption: string;
  emphasis?: string;
  imagePrompt?: string;
  motion?: string;
  visualAnchorId?: string;
  imageProvider?: string;
  // 파일 존재 여부
  sceneImageExists: boolean;
  sceneImagePath: string | null; // public URL for <img> tag (relative)
  coverImageExists: boolean;
  segmentExists: boolean;
}

interface ReviewData {
  renderId: string;
  referenceStyle: string | null;
  title: string | null;
  sceneCount: number;
  estimatedDuration: number | null;
  // 최종 mp4 (public/videos 또는 output 내)
  videoPublicUrl: string | null;
  videoExists: boolean;
  narrationExists: boolean;
  isPartial: boolean;
  generatedSceneCount: number;
  failedScenes: number[];
  scenes: SceneReview[];
  // 원본 plan 메타
  warnings?: unknown[];
  savedAt?: string;
}

// ── helper: plan.json 또는 partial_plan.json 읽기 ────────────────────────────

function readPlanFile(dir: string): { data: Record<string, unknown>; partial: boolean } | null {
  const planPath = path.join(dir, "plan.json");
  const partialPath = path.join(dir, "partial_plan.json");

  if (fs.existsSync(planPath)) {
    try {
      return { data: JSON.parse(fs.readFileSync(planPath, "utf-8")), partial: false };
    } catch {
      return null;
    }
  }
  if (fs.existsSync(partialPath)) {
    try {
      return { data: JSON.parse(fs.readFileSync(partialPath, "utf-8")), partial: true };
    } catch {
      return null;
    }
  }
  return null;
}

// ── helper: output 내 이미지를 /api/review/image 로 서빙할 URL 생성 ──────────

function makeImageUrl(renderId: string, filename: string): string {
  return `/api/review/image?id=${renderId}&file=${encodeURIComponent(filename)}`;
}

// ── GET handler ───────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const renderId = searchParams.get("id")?.trim();

  if (!renderId) {
    return NextResponse.json({ error: "renderId가 필요합니다." }, { status: 400 });
  }

  const renderDir = path.join(OUTPUT_ROOT, renderId);

  if (!fs.existsSync(renderDir)) {
    return NextResponse.json(
      { error: `렌더 폴더를 찾을 수 없습니다: output/v2/${renderId}` },
      { status: 404 },
    );
  }

  const planResult = readPlanFile(renderDir);
  if (!planResult) {
    return NextResponse.json(
      { error: "plan.json 또는 partial_plan.json을 읽을 수 없습니다." },
      { status: 404 },
    );
  }

  const { data: plan, partial } = planResult;

  // ── 최종 mp4 경로 탐색 ────────────────────────────────────────────────────
  // 1) public/videos/<renderId>.mp4
  // 2) output/v2/<renderId>/<renderId>.mp4
  // 3) output/v2/<renderId>/manual_test.mp4 (fallback)
  let videoPublicUrl: string | null = null;
  let videoExists = false;

  const publicVideoPath = path.join(PUBLIC_VIDEOS_ROOT, `${renderId}.mp4`);
  const outputVideoPath = path.join(renderDir, `${renderId}.mp4`);
  const fallbackVideoPath = path.join(renderDir, "manual_test.mp4");

  if (fs.existsSync(publicVideoPath)) {
    videoExists = true;
    videoPublicUrl = `/videos/${renderId}.mp4`;
  } else if (fs.existsSync(outputVideoPath)) {
    videoExists = true;
    // output 폴더는 public이 아니므로 image 서빙 API 경유
    videoPublicUrl = `/api/review/image?id=${renderId}&file=${encodeURIComponent(`${renderId}.mp4`)}`;
  } else if (fs.existsSync(fallbackVideoPath)) {
    videoExists = true;
    videoPublicUrl = `/api/review/image?id=${renderId}&file=manual_test.mp4`;
  }

  // ── narration 존재 여부 ───────────────────────────────────────────────────
  const narrationExists = fs.existsSync(path.join(renderDir, "narration.mp3"));

  // ── scenes 처리 ───────────────────────────────────────────────────────────
  type RawScene = Record<string, unknown>;
  const rawScenes: RawScene[] = Array.isArray(plan.scenes) ? (plan.scenes as RawScene[]) : [];

  const scenes: SceneReview[] = rawScenes.map((s, idx) => {
    const sceneNum: number = typeof s.sceneNumber === "number" ? s.sceneNumber : idx + 1;

    const sceneImageFile = `scene_${sceneNum}.png`;
    const coverImageFile = `cover_${sceneNum}.jpg`;
    const segmentFile = `segment_${sceneNum}.mp4`;

    const sceneImageExists = fs.existsSync(path.join(renderDir, sceneImageFile));
    const coverImageExists = fs.existsSync(path.join(renderDir, coverImageFile));
    const segmentExists = fs.existsSync(path.join(renderDir, segmentFile));

    return {
      sceneNumber: sceneNum,
      durationSec: typeof s.durationSec === "number" ? s.durationSec : 0,
      narration: typeof s.narration === "string" ? s.narration : "",
      caption: typeof s.caption === "string" ? s.caption : "",
      emphasis: typeof s.emphasis === "string" ? s.emphasis : undefined,
      imagePrompt: typeof s.imagePrompt === "string" ? s.imagePrompt : undefined,
      motion: typeof s.motion === "string" ? s.motion : undefined,
      visualAnchorId: typeof s.visualAnchorId === "string" ? s.visualAnchorId : undefined,
      imageProvider: typeof s.imageProvider === "string" ? s.imageProvider : undefined,
      sceneImageExists,
      sceneImagePath: sceneImageExists ? makeImageUrl(renderId, sceneImageFile) : null,
      coverImageExists,
      segmentExists,
    };
  });

  const result: ReviewData = {
    renderId,
    referenceStyle:
      typeof plan.referenceStyle === "string" ? plan.referenceStyle : null,
    title: typeof plan.title === "string" ? plan.title : null,
    sceneCount: scenes.length,
    estimatedDuration:
      typeof plan.estimatedDuration === "number" ? plan.estimatedDuration : null,
    videoPublicUrl,
    videoExists,
    narrationExists,
    isPartial: partial || (plan._partial === true),
    generatedSceneCount:
      typeof plan._generatedSceneCount === "number"
        ? plan._generatedSceneCount
        : scenes.filter((s) => s.sceneImageExists).length,
    failedScenes: Array.isArray(plan._failedScenes)
      ? (plan._failedScenes as number[])
      : [],
    scenes,
    warnings: Array.isArray(plan._warnings) ? plan._warnings : undefined,
    savedAt:
      typeof plan._savedAt === "string" ? plan._savedAt : undefined,
  };

  return NextResponse.json(result);
}
