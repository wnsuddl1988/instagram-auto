import { NextRequest, NextResponse } from "next/server";
import { generateScript } from "@/lib/openai";
import { fetchCategoryImage } from "@/lib/pexels";
import { saveGeneration } from "@/lib/supabase";
import { CATEGORIES, Category } from "@/lib/categories";

function validateApiKey(req: NextRequest): boolean {
  const apiKey = req.headers.get("x-api-key");
  return apiKey === process.env.AUTO_API_KEY;
}

export async function POST(req: NextRequest) {
  if (!validateApiKey(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      categoryId,
      duration = 30,
      tone = "정보전달",
    } = body;

    let category: Category;
    if (categoryId) {
      category = CATEGORIES.find((c) => c.id === categoryId) || CATEGORIES[0];
    } else {
      category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
    }

    const [script, image] = await Promise.all([
      generateScript({
        categoryId: category.id,
        categoryName: category.name,
        systemPrompt: category.systemPrompt,
        duration,
        tone,
      }),
      fetchCategoryImage(category.id).catch(() => null),
    ]);

    let savedRecord;
    try {
      savedRecord = await saveGeneration({
        category_id: category.id,
        category_name: category.name,
        category_emoji: category.emoji,
        title: script.title,
        script: script.script,
        hook: script.hook,
        call_to_action: script.callToAction,
        hashtags: script.hashtags,
        image_url: image?.src?.large || undefined,
        duration,
        tone,
        status: "generated",
      });
    } catch (dbErr) {
      console.warn("[Supabase 저장 실패, 무시]", dbErr);
    }

    return NextResponse.json({
      success: true,
      generationId: savedRecord?.id,
      category: {
        id: category.id,
        name: category.name,
        emoji: category.emoji,
      },
      script: {
        title: script.title,
        hook: script.hook,
        script: script.script,
        callToAction: script.callToAction,
        hashtags: script.hashtags,
      },
      imageUrl: image?.src?.large || null,
    });

  } catch (error) {
    console.error("[/api/auto 오류]:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
