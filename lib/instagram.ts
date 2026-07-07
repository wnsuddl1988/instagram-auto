const GRAPH_API = "https://graph.facebook.com/v19.0";

export interface InstagramUploadParams {
  videoUrl: string;
  caption: string;
  coverUrl?: string;
}

export interface InstagramCredentials {
  businessAccountId: string;
  accessToken: string;
}

/**
 * env에서 Instagram credential을 "호출 시점"에만 읽는다.
 * 이 모듈을 import하는 것만으로는 process.env가 읽히지 않는다(import-safe).
 * secret 값은 반환값 외 어디에도 로그/throw되지 않는다.
 */
export function resolveInstagramCredentialsFromEnv(): InstagramCredentials {
  const businessAccountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!businessAccountId || !accessToken) {
    // 어떤 key가 비었는지 이름만 알린다 — 값은 절대 노출하지 않는다.
    const missing = [
      !businessAccountId ? "INSTAGRAM_BUSINESS_ACCOUNT_ID" : null,
      !accessToken ? "INSTAGRAM_ACCESS_TOKEN" : null,
    ].filter(Boolean);
    throw new Error(`Instagram credential 누락: ${missing.join(", ")}`);
  }
  return { businessAccountId, accessToken };
}

/**
 * Graph API 응답에서 access token 등 민감 정보가 에러 메시지로 새지 않도록,
 * 안전한 필드(에러 코드/타입/사용자 메시지)만 추려서 문자열로 만든다.
 */
function safeGraphError(payload: unknown): string {
  if (payload && typeof payload === "object" && "error" in payload) {
    const err = (payload as { error?: Record<string, unknown> }).error ?? {};
    const parts = [
      err.code != null ? `code=${err.code}` : null,
      err.type != null ? `type=${err.type}` : null,
      err.error_subcode != null ? `subcode=${err.error_subcode}` : null,
      typeof err.message === "string" ? `message=${err.message}` : null,
    ].filter(Boolean);
    return parts.length ? parts.join(" ") : "unknown_graph_error";
  }
  return "unknown_graph_error";
}

/**
 * explicit credential injection 버전. import-safe하며, credential을 인자로만 받는다.
 * access token은 request body/header로만 전달하고, 폴링 URL query에 넣지 않는다
 * (에러/로그를 통한 token 노출 방지).
 */
export async function uploadInstagramReelWithCredentials(
  params: InstagramUploadParams & { credentials: InstagramCredentials }
): Promise<string> {
  const { videoUrl, caption, credentials } = params;
  const { businessAccountId, accessToken } = credentials;

  // Step 1: 미디어 컨테이너 생성
  const containerRes = await fetch(`${GRAPH_API}/${businessAccountId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      media_type: "REELS",
      video_url: videoUrl,
      caption,
      share_to_feed: true,
      access_token: accessToken,
    }),
  });

  const container = await containerRes.json();
  if (!container.id) throw new Error(`Instagram 컨테이너 생성 실패: ${safeGraphError(container)}`);

  // Step 2: 업로드 완료 대기 (폴링, 최대 2분)
  // access token을 URL query가 아니라 Authorization 헤더로 전달해 로그/에러 노출을 막는다.
  const containerId = container.id;
  for (let i = 0; i < 24; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    const statusRes = await fetch(`${GRAPH_API}/${containerId}?fields=status_code`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const status = await statusRes.json();
    if (status.status_code === "FINISHED") break;
    if (status.status_code === "ERROR") throw new Error("Instagram 업로드 처리 실패");
  }

  // Step 3: 게시물 발행
  const publishRes = await fetch(`${GRAPH_API}/${businessAccountId}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      creation_id: containerId,
      access_token: accessToken,
    }),
  });

  const published = await publishRes.json();
  if (!published.id) throw new Error(`Instagram 발행 실패: ${safeGraphError(published)}`);
  return published.id;
}

/**
 * 기존 호환 wrapper. env credential resolution을 "호출 시점"에만 수행한다.
 * (import 시점 process.env read 없음.)
 */
export async function uploadInstagramReel(
  params: InstagramUploadParams
): Promise<string> {
  const credentials = resolveInstagramCredentialsFromEnv();
  return uploadInstagramReelWithCredentials({ ...params, credentials });
}
