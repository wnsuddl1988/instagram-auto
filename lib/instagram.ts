const IG_ACCOUNT_ID = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID!;
const IG_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN!;
const GRAPH_API = "https://graph.facebook.com/v19.0";

export interface InstagramUploadParams {
  videoUrl: string;
  caption: string;
  coverUrl?: string;
}

export async function uploadInstagramReel(
  params: InstagramUploadParams
): Promise<string> {
  const { videoUrl, caption } = params;

  // Step 1: 미디어 컨테이너 생성
  const containerRes = await fetch(
    `${GRAPH_API}/${IG_ACCOUNT_ID}/media`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        media_type: "REELS",
        video_url: videoUrl,
        caption,
        share_to_feed: true,
        access_token: IG_ACCESS_TOKEN,
      }),
    }
  );

  const container = await containerRes.json();
  if (!container.id) throw new Error(`Instagram 컨테이너 생성 실패: ${JSON.stringify(container)}`);

  // Step 2: 업로드 완료 대기 (폴링, 최대 2분)
  const containerId = container.id;
  for (let i = 0; i < 24; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    const statusRes = await fetch(
      `${GRAPH_API}/${containerId}?fields=status_code&access_token=${IG_ACCESS_TOKEN}`
    );
    const status = await statusRes.json();
    if (status.status_code === "FINISHED") break;
    if (status.status_code === "ERROR") throw new Error("Instagram 업로드 처리 실패");
  }

  // Step 3: 게시물 발행
  const publishRes = await fetch(
    `${GRAPH_API}/${IG_ACCOUNT_ID}/media_publish`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creation_id: containerId,
        access_token: IG_ACCESS_TOKEN,
      }),
    }
  );

  const published = await publishRes.json();
  if (!published.id) throw new Error(`Instagram 발행 실패: ${JSON.stringify(published)}`);
  return published.id;
}
