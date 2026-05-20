import { NextRequest, NextResponse } from "next/server";
import { generateScript, GenerateScriptParams } from "@/lib/openai";
import { fetchCategoryImage } from "@/lib/pexels";
import { saveGeneration } from "@/lib/supabase";
import { CATEGORIES } from "@/lib/categories";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { categoryIds, duration, tone } = body;

    if (!categoryIds || categoryIds.length === 0) {
      return NextResponse.json(
        { error: "카테고리를 1개 이상 선택해주세요." },
        { status: 400 }
      );
    }

    const selectedCategories = CATEGORIES.filter((c) =>
      categoryIds.includes(c.id)
    );

    const results = await Promise.all(
      selectedCategories.map(async (category) => {
        const [script, image] = await Promise.all([
          generateScript({
            categoryId: category.id,
            categoryName: category.name,
            systemPrompt: category.systemPrompt,
            duration: duration || 30,
            tone: tone || "정보전달",
            useAiImage: category.useAiImage ?? false,
          } as GenerateScriptParams),
          fetchCategoryImage(category.id).catch(() => null),
        ]);
        return { script, image };
      })
    );

    const savedScripts = await Promise.all(
      selectedCategories.map(async (cat, i) => {
        const script = results[i].script;
        const image = results[i].image;

        let savedId: string | undefined;
        try {
          const saved = await saveGeneration({
            category_id: cat.id,
            category_name: cat.name,
            category_emoji: cat.emoji,
            title: script.title,
            script: script.script,
            hook: script.hook,
            call_to_action: script.callToAction,
            hashtags: script.hashtags,
            image_url: image?.src?.large || undefined,
            duration: duration || 30,
            tone: tone || "정보전달",
            status: "generated",
          });
          savedId = saved?.id;
        } catch (dbError) {
          console.warn(`[Supabase 저장 실패] ${cat.name}:`, dbError);
        }

        return {
          id: savedId,
          categoryId: cat.id,
          categoryName: cat.name,
          categoryEmoji: cat.emoji,
          ...script,
          image,
        };
      })
    );

    return NextResponse.json({
      success: true,
      scripts: savedScripts,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[/api/generate 오류]:", message, error);
    return NextResponse.json(
      { error: `스크립트 생성 오류: ${message}` },
      { status: 500 }
    );
  }
}
