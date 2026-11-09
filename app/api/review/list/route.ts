/**
 * GET /api/review/list
 *
 * output/v2/ 폴더를 스캔해 렌더 목록을 반환.
 * - v2_ 또는 v2_render_ 로 시작하는 폴더만 대상
 * - plan.json / partial_plan.json 존재 여부
 * - hasVideo (public/videos/<id>.mp4 또는 output 내 mp4)
 * - sceneImageCount (scene_N.png 개수)
 * - coverCount (cover_N.jpg 개수)
 * - lastModified (폴더 mtime, ISO)
 * - 최신순 정렬
 *
 * 유료 API 호출 없음 — 로컬 파일 읽기 전용.
 */

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const OUTPUT_ROOT = path.join(process.cwd(), "output", "v2");
const PUBLIC_VIDEOS_ROOT = path.join(process.cwd(), "public", "videos");

export interface RenderListItem {
  renderId: string;
  hasPlan: boolean;
  hasPartialPlan: boolean;
  hasVideo: boolean;
  narrationExists: boolean;
  sceneImageCount: number;
  coverCount: number;
  lastModified: string; // ISO string
}

export interface RenderListResponse {
  items: RenderListItem[];
}

export async function GET() {
  // output/v2 폴더가 없으면 빈 목록 반환
  if (!fs.existsSync(OUTPUT_ROOT)) {
    return NextResponse.json<RenderListResponse>({ items: [] });
  }

  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(OUTPUT_ROOT, { withFileTypes: true });
  } catch {
    return NextResponse.json<RenderListResponse>({ items: [] });
  }

  const items: RenderListItem[] = [];

  for (const entry of entries) {
    // 디렉토리만, v2_ 접두어로 시작하는 것만
    if (!entry.isDirectory()) continue;
    if (!entry.name.startsWith("v2_")) continue;

    const renderId = entry.name;
    const dir = path.join(OUTPUT_ROOT, renderId);

    // plan 존재 여부
    const hasPlan = fs.existsSync(path.join(dir, "plan.json"));
    const hasPartialPlan = fs.existsSync(path.join(dir, "partial_plan.json"));

    // plan이 하나도 없으면 스킵 (불완전한 폴더)
    if (!hasPlan && !hasPartialPlan) continue;

    // 영상 존재 여부
    const hasVideoPublic = fs.existsSync(path.join(PUBLIC_VIDEOS_ROOT, `${renderId}.mp4`));
    const hasVideoOutput = fs.existsSync(path.join(dir, `${renderId}.mp4`));
    const hasVideoFallback = fs.existsSync(path.join(dir, "manual_test.mp4"));
    const hasVideo = hasVideoPublic || hasVideoOutput || hasVideoFallback;

    // narration
    const narrationExists = fs.existsSync(path.join(dir, "narration.mp3"));

    // scene_N.png 개수 세기
    let sceneImageCount = 0;
    let coverCount = 0;
    try {
      const files = fs.readdirSync(dir);
      for (const f of files) {
        if (/^scene_\d+\.png$/.test(f)) sceneImageCount++;
        if (/^cover_\d+\.jpg$/.test(f)) coverCount++;
      }
    } catch {
      // 읽기 실패 시 0 유지
    }

    // 폴더 mtime
    let lastModified = new Date(0).toISOString();
    try {
      const stat = fs.statSync(dir);
      lastModified = stat.mtime.toISOString();
    } catch {
      // 실패 시 epoch 유지
    }

    items.push({
      renderId,
      hasPlan,
      hasPartialPlan,
      hasVideo,
      narrationExists,
      sceneImageCount,
      coverCount,
      lastModified,
    });
  }

  // 최신순 정렬
  items.sort(
    (a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime(),
  );

  return NextResponse.json<RenderListResponse>({ items });
}
