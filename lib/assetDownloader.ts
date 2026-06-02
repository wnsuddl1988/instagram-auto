import { mkdir } from "fs/promises";
import path from "path";
import fs from "fs";

const ASSETS_FONTS = [
  {
    name: "BlackHanSans.ttf",
    url: "https://github.com/google/fonts/raw/main/ofl/blackhansans/BlackHanSans-Regular.ttf",
  },
  {
    name: "DoHyeon.ttf",
    url: "https://github.com/google/fonts/raw/main/ofl/dohyeon/DoHyeon-Regular.ttf",
  },
];

const ASSETS_BGM = [
  {
    name: "emotional.mp3",
    url: "https://github.com/tannerhelland/free-music/raw/master/mp3/springtime.mp3",
  },
  {
    name: "mystery.mp3",
    url: "https://github.com/tannerhelland/free-music/raw/master/mp3/the-valley-wind.mp3",
  },
  {
    name: "upbeat.mp3",
    url: "https://github.com/tannerhelland/free-music/raw/master/mp3/amber-grove.mp3",
  },
  {
    name: "funny.mp3",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  },
  {
    name: "dramatic.mp3",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
  },
];

async function downloadFile(
  url: string,
  filePath: string,
  maxRetries: number = 3
): Promise<boolean> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      fs.writeFileSync(filePath, buffer);
      return true;
    } catch (err) {
      console.warn(
        `⚠️ 다운로드 실패 (${attempt + 1}/${maxRetries}): ${url}`,
        err instanceof Error ? err.message : err
      );

      if (attempt < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }

  return false;
}

export async function ensureAssets(): Promise<void> {
  try {
    // 폰트 디렉토리 생성 및 다운로드
    const fontsDir = path.join(
      /* turbopackIgnore: true */ process.cwd(),
      "assets",
      "fonts"
    );
    await mkdir(fontsDir, { recursive: true });

    for (const font of ASSETS_FONTS) {
      const fontPath = path.join(fontsDir, font.name);
      if (!fs.existsSync(fontPath)) {
        console.log(`📥 폰트 다운로드 중: ${font.name}`);
        if (await downloadFile(font.url, fontPath)) {
          console.log(`✓ 폰트 다운로드 완료: ${font.name}`);
        } else {
          console.warn(`⚠️ 폰트 다운로드 실패 (건너뜀): ${font.name}`);
        }
      }
    }

    // BGM 디렉토리 생성 및 다운로드
    const bgmDir = path.join(
      /* turbopackIgnore: true */ process.cwd(),
      "assets",
      "bgm"
    );
    await mkdir(bgmDir, { recursive: true });

    for (const bgm of ASSETS_BGM) {
      const bgmPath = path.join(bgmDir, bgm.name);
      if (!fs.existsSync(bgmPath)) {
        console.log(`📥 BGM 다운로드 중: ${bgm.name}`);
        if (await downloadFile(bgm.url, bgmPath)) {
          console.log(`✓ BGM 다운로드 완료: ${bgm.name}`);
        } else {
          console.warn(`⚠️ BGM 다운로드 실패 (건너뜀): ${bgm.name}`);
        }
      }
    }

    console.log(`✓ 에셋 준비 완료`);
  } catch (error) {
    console.error("❌ 에셋 준비 오류:", error);
  }
}
