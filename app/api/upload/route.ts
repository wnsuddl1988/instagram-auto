import { NextRequest, NextResponse } from "next/server";
import { uploadInstagramReel } from "@/lib/instagram";
import { updateGenerationStatus } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
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
