/**
 * 수동 AI 이미지 생성용 Chrome 프로필 allowlist.
 * 이 파일 외부에서 임의 경로·URL·명령을 주입할 수 없다.
 * 이메일·비밀번호·쿠키·세션 정보는 저장하지 않는다.
 */

export interface ChromeProfile {
  /** UI 표시 이름 */
  alias: string;
  /** 이미지 AI 제공자 */
  provider: "chatgpt" | "gemini";
  /** 허용된 Chrome User Data 경로 */
  userDataDir: string;
  /** 허용된 다운로드 감지 폴더 */
  downloadDir: string;
  /** 브라우저에서 열 URL — 고정 allowlist */
  url: string;
}

export const CHROME_EXE =
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

export const CHROME_PROFILES: ChromeProfile[] = [
  {
    alias: "GPT 1",
    provider: "chatgpt",
    userDataDir:
      "C:\\Users\\PC\\AppData\\Local\\Google\\Chrome\\User Data\\AI-GPT-1",
    downloadDir: "C:\\Users\\PC\\Downloads\\AI-Images\\GPT-1",
    url: "https://chatgpt.com/",
  },
  {
    alias: "GPT 2",
    provider: "chatgpt",
    userDataDir:
      "C:\\Users\\PC\\AppData\\Local\\Google\\Chrome\\User Data\\AI-GPT-2",
    downloadDir: "C:\\Users\\PC\\Downloads\\AI-Images\\GPT-2",
    url: "https://chatgpt.com/",
  },
  {
    alias: "Gemini 1",
    provider: "gemini",
    userDataDir:
      "C:\\Users\\PC\\AppData\\Local\\Google\\Chrome\\User Data\\AI-Gemini-1",
    downloadDir: "C:\\Users\\PC\\Downloads\\AI-Images\\Gemini-1",
    url: "https://gemini.google.com/",
  },
  {
    alias: "Gemini 2",
    provider: "gemini",
    userDataDir:
      "C:\\Users\\PC\\AppData\\Local\\Google\\Chrome\\User Data\\AI-Gemini-2",
    downloadDir: "C:\\Users\\PC\\Downloads\\AI-Images\\Gemini-2",
    url: "https://gemini.google.com/",
  },
  {
    alias: "Gemini 3",
    provider: "gemini",
    userDataDir:
      "C:\\Users\\PC\\AppData\\Local\\Google\\Chrome\\User Data\\AI-Gemini-3",
    downloadDir: "C:\\Users\\PC\\Downloads\\AI-Images\\Gemini-3",
    url: "https://gemini.google.com/",
  },
  {
    alias: "Gemini 4",
    provider: "gemini",
    userDataDir:
      "C:\\Users\\PC\\AppData\\Local\\Google\\Chrome\\User Data\\AI-Gemini-4",
    downloadDir: "C:\\Users\\PC\\Downloads\\AI-Images\\Gemini-4",
    url: "https://gemini.google.com/",
  },
];

/** alias로 프로필 조회 — 없으면 null */
export function getProfileByAlias(alias: string): ChromeProfile | null {
  return CHROME_PROFILES.find((p) => p.alias === alias) ?? null;
}

/** allowlisted downloadDir 목록 */
export const ALLOWED_DOWNLOAD_DIRS = new Set(
  CHROME_PROFILES.map((p) => p.downloadDir)
);
