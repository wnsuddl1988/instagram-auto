import { google } from "googleapis";

const YOUTUBE_OAUTH_REDIRECT_URI = "http://localhost:3000/api/auth/youtube/callback";
const YOUTUBE_UPLOAD_SCOPE = "https://www.googleapis.com/auth/youtube.upload";

export interface YouTubeOAuthCredentials {
  clientId: string;
  clientSecret: string;
  /** 장기 저장되는 refresh token. short-lived access token은 이걸로 메모리에서 발급한다. */
  refreshToken: string;
  /** optional short-lived access token. 없으면 refresh token으로 발급된다. */
  accessToken?: string;
}

export interface YouTubeUploadParams {
  videoPath: string;
  title: string;
  description: string;
  tags: string[];
}

/**
 * OAuth client 생성 팩토리. client id/secret을 "인자로만" 받는다.
 * 이 모듈을 import하는 것만으로는 process.env가 읽히지 않으며 client도 생성되지 않는다(import-safe).
 * refreshToken을 설정해 두면 googleapis가 만료 시 메모리에서 access token을 자동 갱신한다.
 */
export function createYouTubeOAuthClient(
  credentials: Pick<YouTubeOAuthCredentials, "clientId" | "clientSecret"> &
    Partial<Pick<YouTubeOAuthCredentials, "refreshToken" | "accessToken">>
) {
  const client = new google.auth.OAuth2(
    credentials.clientId,
    credentials.clientSecret,
    YOUTUBE_OAUTH_REDIRECT_URI
  );
  if (credentials.refreshToken || credentials.accessToken) {
    client.setCredentials({
      refresh_token: credentials.refreshToken,
      access_token: credentials.accessToken,
    });
  }
  return client;
}

/**
 * client id/secret을 "호출 시점"에만 env에서 읽는다(import-safe).
 * YOUTUBE_ACCESS_TOKEN은 장기 required env로 요구하지 않는다 —
 * short-lived access token은 refresh token으로 메모리에서 발급/갱신한다.
 */
export function resolveYouTubeOAuthCredentialsFromEnv(): Pick<
  YouTubeOAuthCredentials,
  "clientId" | "clientSecret"
> {
  const clientId = process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    const missing = [
      !clientId ? "YOUTUBE_CLIENT_ID" : null,
      !clientSecret ? "YOUTUBE_CLIENT_SECRET" : null,
    ].filter(Boolean);
    throw new Error(`YouTube credential 누락: ${missing.join(", ")}`);
  }
  return { clientId, clientSecret };
}

/**
 * auth URL 생성. 기존 호환 export. env resolution은 호출 시점에만 수행한다.
 */
export function getYouTubeAuthUrl(): string {
  const { clientId, clientSecret } = resolveYouTubeOAuthCredentialsFromEnv();
  const client = createYouTubeOAuthClient({ clientId, clientSecret });
  return client.generateAuthUrl({
    access_type: "offline",
    scope: [YOUTUBE_UPLOAD_SCOPE],
  });
}

/**
 * explicit credential injection 버전. import-safe하며, credential을 인자로만 받는다.
 * secret 값은 throw/log에 포함하지 않는다.
 */
export async function uploadYouTubeShortsWithCredentials(
  params: YouTubeUploadParams & { credentials: YouTubeOAuthCredentials }
): Promise<string> {
  const { videoPath, title, description, tags, credentials } = params;

  const oauth2Client = createYouTubeOAuthClient({
    clientId: credentials.clientId,
    clientSecret: credentials.clientSecret,
    refreshToken: credentials.refreshToken,
    accessToken: credentials.accessToken,
  });

  const youtube = google.youtube({ version: "v3", auth: oauth2Client });
  const fs = await import("fs");

  const response = await youtube.videos.insert({
    part: ["snippet", "status"],
    requestBody: {
      snippet: {
        title: `${title} #Shorts`,
        description: `${description}\n\n${tags.map((t) => `#${t}`).join(" ")}`,
        tags: [...tags, "Shorts", "쇼츠"],
        categoryId: "22",
        defaultLanguage: "ko",
      },
      status: {
        privacyStatus: "public",
        selfDeclaredMadeForKids: false,
      },
    },
    media: {
      mimeType: "video/mp4",
      body: fs.createReadStream(videoPath),
    },
  });

  if (!response.data.id) throw new Error("YouTube 업로드 실패");
  return response.data.id;
}

/**
 * 기존 호환 wrapper. client id/secret을 "호출 시점"에만 env에서 읽고,
 * access/refresh token은 인자로 받은 값을 사용한다(import 시점 process.env read 없음).
 */
export async function uploadYouTubeShorts(params: {
  videoPath: string;
  title: string;
  description: string;
  tags: string[];
  accessToken: string;
  refreshToken: string;
}): Promise<string> {
  const { videoPath, title, description, tags, accessToken, refreshToken } = params;
  const { clientId, clientSecret } = resolveYouTubeOAuthCredentialsFromEnv();
  return uploadYouTubeShortsWithCredentials({
    videoPath,
    title,
    description,
    tags,
    credentials: { clientId, clientSecret, refreshToken, accessToken },
  });
}
