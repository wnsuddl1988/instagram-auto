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
