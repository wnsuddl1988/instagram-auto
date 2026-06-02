export interface PexelsPhoto {
  id: number;
  url: string;
  photographer: string;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    portrait: string;
  };
}

export interface StockPhotoResult {
  /** 다운로드 가능한 직접 이미지 URL */
  imageUrl: string;
  /** attribution 표시용 (선택) */
  photographer: string;
  /** 원본 페이지 URL */
  sourceUrl: string;
}

const PEXELS_API_KEY = process.env.PEXELS_API_KEY || "";

const CATEGORY_KEYWORDS: Record<string, string> = {
  "ai-content": "artificial intelligence technology futuristic",
  "meme": "funny reaction entertainment",
  "shocking-news": "news breaking alert dramatic",
  "tmi-knowledge": "knowledge education science discovery",
  "game-clip": "gaming controller esports",
  "finance-tip": "money finance investment wealth",
  "cute-animal": "cute animal pet adorable",
  "celeb-enter": "celebrity entertainment stage performance",
};

/**
 * scene.fallbackSearchQuery를 사용해 Pexels에서 stock photo를 검색한다.
 * PEXELS_API_KEY 없으면 API를 호출하지 않고 null을 반환한다.
 */
export async function searchStockPhoto(
  query: string,
  options: { orientation?: "portrait" | "landscape" | "square" } = {}
): Promise<StockPhotoResult | null> {
  if (!PEXELS_API_KEY) {
    console.warn("[pexels] PEXELS_API_KEY 없음 — stock 이미지 skip");
    return null;
  }

  const orientation = options.orientation ?? "portrait";

  try {
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=5&orientation=${orientation}`,
      {
        headers: { Authorization: PEXELS_API_KEY },
      }
    );

    if (!response.ok) {
      console.warn(`[pexels] search 실패 (${response.status}): query="${query}"`);
      return null;
    }

    const data = await response.json() as { photos: PexelsPhoto[] };
    const photos = data.photos ?? [];
    if (photos.length === 0) {
      console.warn(`[pexels] 검색 결과 없음: query="${query}"`);
      return null;
    }

    const photo = photos[Math.floor(Math.random() * photos.length)];
    return {
      imageUrl: photo.src.portrait || photo.src.large2x || photo.src.original,
      photographer: photo.photographer,
      sourceUrl: photo.url,
    };
  } catch (err) {
    console.error("[pexels] searchStockPhoto 오류:", err instanceof Error ? err.message : err);
    return null;
  }
}

export async function fetchCategoryImage(
  categoryId: string
): Promise<PexelsPhoto | null> {
  try {
    const keyword = CATEGORY_KEYWORDS[categoryId] || "technology";
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(keyword)}&per_page=10&orientation=portrait`,
      {
        headers: { Authorization: PEXELS_API_KEY },
        next: { revalidate: 3600 },
      }
    );

    if (!response.ok) throw new Error("Pexels API 오류");
    const data = await response.json();
    const photos: PexelsPhoto[] = data.photos;

    if (!photos || photos.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * photos.length);
    return photos[randomIndex];
  } catch (error) {
    console.error("Pexels 이미지 fetch 오류:", error);
    return null;
  }
}
