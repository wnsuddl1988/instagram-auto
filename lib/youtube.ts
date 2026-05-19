import { google } from "googleapis";

const oauth2Client = new google.auth.OAuth2(
  process.env.YOUTUBE_CLIENT_ID,
  process.env.YOUTUBE_CLIENT_SECRET,
  "http://localhost:3000/api/auth/youtube/callback"
);

export function getYouTubeAuthUrl(): string {
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/youtube.upload"],
  });
}

export async function uploadYouTubeShorts(params: {
  videoPath: string;
  title: string;
  description: string;
  tags: string[];
  accessToken: string;
  refreshToken: string;
}): Promise<string> {
  const { videoPath, title, description, tags, accessToken, refreshToken } = params;

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
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
