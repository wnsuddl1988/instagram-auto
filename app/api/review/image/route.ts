/**
 * GET /api/review/image?id=<renderId>&file=<filename>
 *
 * output/v2/<renderId>/<filename> 을 읽어 바이너리로 반환.
 * png / jpg / mp4 / mp3 지원.
 * 유료 API 호출 없음 — 로컬 파일 서빙 전용.
 */

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const OUTPUT_ROOT = path.join(process.cwd(), "output", "v2");

const MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  mp4: "video/mp4",
  mp3: "audio/mpeg",
  webm: "video/webm",
};

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const renderId = searchParams.get("id")?.trim();
  const file = searchParams.get("file")?.trim();

  if (!renderId || !file) {
    return new NextResponse("id 및 file 파라미터가 필요합니다.", { status: 400 });
  }

  // path traversal 방지: 파일명에 "/" ".." 포함 금지
  const safeName = path.basename(file);
  if (safeName !== file.replace(/\\/g, "/").split("/").pop()) {
    return new NextResponse("잘못된 파일명입니다.", { status: 400 });
  }

  const filePath = path.join(OUTPUT_ROOT, renderId, safeName);

  if (!fs.existsSync(filePath)) {
    return new NextResponse("파일을 찾을 수 없습니다.", { status: 404 });
  }

  const ext = safeName.split(".").pop()?.toLowerCase() ?? "";
  const mimeType = MIME[ext] ?? "application/octet-stream";

  const buffer = fs.readFileSync(filePath);
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": mimeType,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
