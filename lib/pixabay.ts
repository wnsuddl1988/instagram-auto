/**
 * lib/pixabay.ts
 * Pixabay 무료 이미지 검색 helper — Pexels StockPhotoResult 호환 인터페이스
 *
 * guard:
 *   - PIXABAY_API_KEY 없으면 null 반환
 *   - ALLOW_PIXABAY !== "true" 면 null 반환
 */

import type { StockPhotoResult } from "@/lib/pexels";

const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY || "";
const ALLOW_PIXABAY = process.env.ALLOW_PIXABAY || "false";

interface PixabayHit {
  id: number;
  pageURL: string;
  webformatURL: string;
  largeImageURL: string;
  user: string;
  imageWidth: number;
  imageHeight: number;
}

interface PixabayResponse {
  totalHits: number;
  hits: PixabayHit[];
}

/**
 * Pixabay에서 stock photo를 검색한다.
 * PIXABAY_API_KEY 또는 ALLOW_PIXABAY=false 시 null 반환.
 *
 * @param query       fallbackSearchQuery (영어 오브젝트 중심)
 * @param options     orientation: portrait | landscape | square (default: portrait)
 * @returns           StockPhotoResult | null
 */
export async function searchPixabayPhoto(
  query: string,
  options: { orientation?: "portrait" | "landscape" | "square" } = {}
): Promise<StockPhotoResult | null> {
  if (!PIXABAY_API_KEY) {
    console.warn("[pixabay] PIXABAY_API_KEY 없음 — skip");
    return null;
  }
  if (ALLOW_PIXABAY !== "true") {
    console.warn("[pixabay] ALLOW_PIXABAY=false — skip");
    return null;
  }

  const orientation = options.orientation ?? "portrait";
  // Pixabay orientation 파라미터: "vertical" = portrait, "horizontal" = landscape
  const pixabayOrientation =
    orientation === "portrait" ? "vertical" : orientation === "landscape" ? "horizontal" : "all";

  const url = new URL("https://pixabay.com/api/");
  url.searchParams.set("key", PIXABAY_API_KEY);
  url.searchParams.set("q", query);
  url.searchParams.set("image_type", "photo");
  url.searchParams.set("orientation", pixabayOrientation);
  url.searchParams.set("per_page", "10");
  url.searchParams.set("safesearch", "true");
  url.searchParams.set("lang", "en");

  try {
    const response = await fetch(url.toString());
    if (!response.ok) {
      console.warn(`[pixabay] 검색 실패 (${response.status}): query="${query}"`);
      return null;
    }

    const data = (await response.json()) as PixabayResponse;
    const hits = data.hits ?? [];
    if (hits.length === 0) {
      console.warn(`[pixabay] 검색 결과 없음: query="${query}"`);
      return null;
    }

    // portrait 모드에서는 세로 비율 이미지 우선 선택
    const sorted =
      orientation === "portrait"
        ? [...hits].sort((a, b) => {
            const ratioA = a.imageHeight / (a.imageWidth || 1);
            const ratioB = b.imageHeight / (b.imageWidth || 1);
            return ratioB - ratioA; // 세로 비율 높은 순
          })
        : hits;

    const hit = sorted[0];
    return {
      imageUrl: hit.largeImageURL || hit.webformatURL,
      photographer: hit.user,
      sourceUrl: hit.pageURL,
    };
  } catch (err) {
    console.error("[pixabay] searchPixabayPhoto 오류:", err instanceof Error ? err.message : err);
    return null;
  }
}
