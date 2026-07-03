import { NextRequest, NextResponse } from "next/server";
import { uploadInstagramReel } from "@/lib/instagram";
import { updateGenerationStatus } from "@/lib/supabase";
import { evaluateGoldenSampleUploadHardBlock } from "@/lib/upload-hard-block";

export async function POST(req: NextRequest) {
  // Golden Sample v3.2 Slice 0 — upload hard block (fail-closed).
  // 어떤 POST든(파싱 불가 body 포함) 업로드 side effect 이전에 guard가 평가되며,
  // body는 인가에 사용되지 않는다. uploadReady=false / automationExpansionReady=false
  // 상태에서는 항상 403이다.
  const body = await req.json().catch(() => null);

  const guard = evaluateGoldenSampleUploadHardBlock(body);
  if (guard.allowed !== true) {
    return NextResponse.json(
      {
        success: false,
        error: guard.error,
        uploadReady: guard.uploadReady,
        automationExpansionReady: guard.automationExpansionReady,
        blockerCodes: guard.blockerCodes,
      },
      { status: 403 }
    );
  }

  // ── 이하 레거시 업로드 경로: 위 guard가 fail-closed인 동안 도달 불가.
  //    미래 Owner 승인 slice에서 서버측 upload readiness contract가 추가되기 전에는
  //    uploadInstagramReel / updateGenerationStatus("uploaded")가 호출되지 않는다. ──
  try {
    const {
      generationId,
      platform,
      videoUrl,
      videoPath,
      caption,
      title,
      hashtags,
    } = body;

    const results: Record<string, string> = {};

    // Instagram 업로드
    if (platform === "instagram" || platform === "both") {
      try {
        const hashtagStr = hashtags?.map((h: string) => `#${h}`).join(" ") || "";
        const igPostId = await uploadInstagramReel({
          videoUrl,
          caption: `${caption}\n\n${hashtagStr}`,
        });
        results.instagramPostId = igPostId;

        if (generationId) {
          await updateGenerationStatus(generationId, "uploaded", {
            instagram_post_id: igPostId,
          });
        }
      } catch (igError) {
        console.error("[Instagram 업로드 실패]", igError);
        results.instagramError = String(igError);
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
