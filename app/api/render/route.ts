import { NextResponse } from "next/server";
import { exec } from "child_process";
import path from "path";
import fs from "fs";
import { promisify } from "util";
import { supabase } from "@/lib/supabase";
import { ensureAssets } from "@/lib/assetDownloader";
import { CATEGORIES } from "@/lib/categories";

const execAsync = promisify(exec);

const FALLBACK_URLS = [
  "https://videos.pexels.com/video-files/3052388/3052388-sd_640_360_25fps.mp4",
  "https://videos.pexels.com/video-files/3041471/3041471-sd_640_360_30fps.mp4",
  "https://videos.pexels.com/video-files/9614835/9614835-sd_640_360_24fps.mp4",
  "https://videos.pexels.com/video-files/7578389/7578389-sd_640_360_25fps.mp4",
  "https://videos.pexels.com/video-files/5568703/5568703-sd_640_360_30fps.mp4",
];

async function downloadUrlToFile(url: string, filePath: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "*/*"
      }
    });
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(filePath, buffer);
    return true;
  } catch (err) {
    console.error(`[Node Download 실패] URL: ${url}`, err);
    return false;
  }
}

export async function POST(request: Request) {
  try {
    // 에셋(폰트/BGM) 자동 다운로드 및 준비
    await ensureAssets();

    const body = await request.json();
    let { id, title, script, imageUrl, scenes, categoryId } = body;

    // 카테고리 정보 가져오기 및 음성/BGM 설정
    const selectedCategory = CATEGORIES.find(cat => cat.id === categoryId);
    const voiceType = selectedCategory?.voice || "female_soft";
    const bgmType = selectedCategory?.bgmType || "emotional";

    // Voice ID 매칭
    const voiceIdMap: Record<string, string> = {
      "male_deep": "pNInz6obbfdqIeCQzWea",
      "female_soft": "EXAVITQu4vr4xnSDxMaL",
      "male_energetic": "ErXwobaYiN019PkySvjV",
      "female_energetic": "MF3mGyEYCl7XYWbV9V6O",
    };
    const elevenLabsVoiceId = voiceIdMap[voiceType] || "EXAVITQu4vr4xnSDxMaL";

    // 만약 id가 비어있다면 자동 임시 ID 부여하여 빌드 방해 방지
    if (!id) {
      id = `gen_${Date.now()}`;
    }

    if (!title || !script) {
      return NextResponse.json(
        { error: "제목(title) 및 대본(script) 필수 파라미터가 누락되었습니다." },
        { status: 400 }
      );
    }

    // 1. 임시 파일 디렉토리 정의
    const projectRoot = process.cwd();
    const tempDir = path.join(projectRoot, "output");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // 1.5 E2E 비디오/이미지 다운로드 (파이썬 실행 전)
    const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
    const updatedScenes = [];

    for (let i = 0; i < (scenes || []).length; i++) {
      const scene = scenes[i];
      let localMediaUrl: string | undefined;

      // 1순위: Pexels 비디오 검색
      if (scene.videoSearchQuery && PEXELS_API_KEY) {
        try {
          const pexelsRes = await fetch(
            `https://api.pexels.com/videos/search?query=${encodeURIComponent(scene.videoSearchQuery)}&orientation=portrait&per_page=3&size=medium`,
            { headers: { Authorization: PEXELS_API_KEY } }
          );
          if (pexelsRes.ok) {
            const data = await pexelsRes.json();
            if (data.videos?.[0]?.video_files) {
              const videoFile = data.videos[0].video_files.find((vf: any) => vf.type === "video/mp4");
              if (videoFile?.link) {
                const videoPath = path.join(tempDir, `scene_${id}_${i}.mp4`);
                if (await downloadUrlToFile(videoFile.link, videoPath)) {
                  localMediaUrl = videoPath;
                  console.log(`✓ Pexels 영상 다운로드: 씬 ${i}`);
                }
              }
            }
          }
        } catch (err) {
          console.warn(`⚠️ Pexels 검색 실패 (씬 ${i}):`, err);
        }
      }

      // 2순위: Pollinations AI 이미지 (402 오류 방지 지연)
      if (!localMediaUrl && scene.imageGenPrompt) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(scene.imageGenPrompt)}?width=1080&height=1920&model=turbo&nologo=true`;
        const imagePath = path.join(tempDir, `scene_${id}_${i}.png`);
        if (await downloadUrlToFile(imageUrl, imagePath)) {
          localMediaUrl = imagePath;
          console.log(`✓ AI 이미지 생성: 씬 ${i}`);
        }
      }

      // 3순위: Fallback URL
      if (!localMediaUrl) {
        const fallbackUrl = FALLBACK_URLS[i % FALLBACK_URLS.length];
        const fallbackPath = path.join(tempDir, `scene_${id}_${i}.mp4`);
        if (await downloadUrlToFile(fallbackUrl, fallbackPath)) {
          localMediaUrl = fallbackPath;
          console.log(`✓ Fallback 영상 사용: 씬 ${i}`);
        }
      }

      updatedScenes.push({ ...scene, localMediaUrl });
    }

    // 2. TTS 음성 생성 (ElevenLabs 또는 OpenAI Fallback)
    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    const narrationPath = path.join(tempDir, "temp_narration.mp3");
    let wordTimestamps: any[] = [];

    // 2.1 ElevenLabs TTS 시도
    if (ELEVENLABS_API_KEY) {
      try {
        console.log(`🎙️ ElevenLabs TTS 음성 생성 중...`);
        const elevenLabsRes = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${elevenLabsVoiceId}`,
          {
            method: "POST",
            headers: {
              "xi-api-key": ELEVENLABS_API_KEY,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              text: script,
              model_id: "eleven_multilingual_v2",
            }),
          }
        );

        if (elevenLabsRes.ok) {
          const audioBuffer = Buffer.from(await elevenLabsRes.arrayBuffer());
          fs.writeFileSync(narrationPath, audioBuffer);
          console.log(`✓ ElevenLabs TTS 음성 생성 완료`);
        } else {
          throw new Error(`ElevenLabs API error: ${elevenLabsRes.status}`);
        }
      } catch (err) {
        console.warn(`⚠️ ElevenLabs TTS 실패:`, err instanceof Error ? err.message : err);
      }
    }

    // 2.2 OpenAI TTS Fallback
    if (!fs.existsSync(narrationPath) && OPENAI_API_KEY) {
      try {
        console.log(`🎙️ OpenAI TTS 음성 생성 중 (Fallback)...`);
        const openaiRes = await fetch("https://api.openai.com/v1/audio/speech", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "tts-1",
            input: script,
            voice: "alloy",
          }),
        });

        if (openaiRes.ok) {
          const audioBuffer = Buffer.from(await openaiRes.arrayBuffer());
          fs.writeFileSync(narrationPath, audioBuffer);
          console.log(`✓ OpenAI TTS 음성 생성 완료 (Fallback)`);
        } else {
          throw new Error(`OpenAI TTS API error: ${openaiRes.status}`);
        }
      } catch (err) {
        console.warn(`⚠️ OpenAI TTS Fallback 실패:`, err instanceof Error ? err.message : err);
      }
    }

    // 2.3 Whisper API로 단어별 타임스탐프 추출
    if (fs.existsSync(narrationPath) && OPENAI_API_KEY) {
      try {
        console.log(`📝 Whisper API로 단어별 타임스탐프 추출 중...`);
        const audioBuffer = fs.readFileSync(narrationPath);
        const formData = new FormData();
        formData.append("file", new Blob([audioBuffer], { type: "audio/mpeg" }), "narration.mp3");
        formData.append("model", "whisper-1");
        formData.append("response_format", "verbose_json");
        formData.append("timestamp_granularities[]", "word");

        const whisperRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
          },
          body: formData,
        });

        if (whisperRes.ok) {
          const whisperData = await whisperRes.json();
          wordTimestamps = whisperData.words || [];
          console.log(`✓ Whisper 타임스탐프 추출 완료: ${wordTimestamps.length}개 단어`);
        } else {
          console.warn(`⚠️ Whisper API error: ${whisperRes.status}`);
        }
      } catch (err) {
        console.warn(`⚠️ Whisper API 실패:`, err instanceof Error ? err.message : err);
      }
    }

    // 3. 파이썬 입력을 위한 JSON 임시 파일 작성
    const scriptJsonPath = path.join(tempDir, `script_${id}.json`);
    const outputVideoPath = path.join(tempDir, `video_${id}.mp4`);

    const scriptData = { id, title, script, imageUrl, scenes: updatedScenes, wordTimestamps, bgmType };
    fs.writeFileSync(scriptJsonPath, JSON.stringify(scriptData, null, 2), "utf-8");

    // 4. 파이썬 스크립트 실행
    const pythonScriptPath = path.join(projectRoot, "python", "render.py");
    console.log(`🎬 파이썬 영상 합성 구동 시작: ${id}`);

    // Windows의 python 또는 python3 호출 대응
    let pythonCmd = "python";
    try {
      await execAsync("python --version");
    } catch {
      pythonCmd = "python3";
    }

    const runCommand = `"${pythonCmd}" "${pythonScriptPath}" "${scriptJsonPath}" "${outputVideoPath}"`;

    let renderError = "";
    try {
      const { stderr, stdout } = await execAsync(runCommand, { timeout: 300000, maxBuffer: 50 * 1024 * 1024 });
      console.log("파이썬 stdout:", stdout);
      if (stderr) {
        console.warn("파이썬 실행 stderr:", stderr);
        renderError = stderr;
      }
    } catch (cmdErr: any) {
      console.error("파이썬 프로세스 비정상 종료:", cmdErr);
      throw new Error(cmdErr.stderr || cmdErr.message);
    }

    if (!fs.existsSync(outputVideoPath)) {
      throw new Error(`영상 합성 엔진 실행 실패 상세: ${renderError || "알 수 없는 파이썬 처리 지연"}`);
    }

    // 5. 로컬 public 폴더 복사 및 서비스 준비 (스토리지 실패 대비 선제 조치)
    const publicVideosDir = path.join(projectRoot, "public", "videos");
    if (!fs.existsSync(publicVideosDir)) {
      fs.mkdirSync(publicVideosDir, { recursive: true });
    }
    const publicVideoPath = path.join(publicVideosDir, `${id}.mp4`);
    fs.copyFileSync(outputVideoPath, publicVideoPath);

    // 로컬 기본 주소 매핑
    let videoPublicUrl = `/videos/${id}.mp4`;

    // 6. Supabase Storage 비디오 버킷에 합성 완료된 쇼츠 동영상 업로드 시도
    console.log(`☁️ Supabase Storage 업로드 중: video_${id}.mp4`);
    const fileBuffer = fs.readFileSync(outputVideoPath);

    try {
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("videos")
        .upload(`${id}.mp4`, fileBuffer, {
          contentType: "video/mp4",
          upsert: true,
        });

      if (uploadError) {
        console.warn("⚠️ Supabase Storage 업로드 건너뜀 (로컬 Fallback 가동):", uploadError.message);
      } else {
        // 업로드 성공 시에만 클라우드 URL로 대체
        videoPublicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/videos/${id}.mp4`;
      }
    } catch (storageErr: any) {
      console.warn("⚠️ Supabase 스토리지 API 연동 경고:", storageErr.message || storageErr);
    }

    // 7. 생성 이력(generations) 테이블 데이터베이스 상태 업데이트
    try {
      const { error: dbError } = await supabase
        .from("generations")
        .update({
          status: "rendered",
          video_path: videoPublicUrl,
        })
        .eq("id", id);

      if (dbError) {
        console.error("데이터베이스 상태 업데이트 오류:", dbError.message);
      }
    } catch (dbErr) {
      console.warn("DB 업데이트 건너뜀:", dbErr);
    }

    // 8. 로컬 임시 연산 파일 소거
    try {
      fs.unlinkSync(scriptJsonPath);
      fs.unlinkSync(outputVideoPath);
      if (fs.existsSync(narrationPath)) fs.unlinkSync(narrationPath);
      // 씬 미디어 파일 삭제
      for (let i = 0; i < (scenes || []).length; i++) {
        const fileMp4 = path.join(tempDir, `scene_${id}_${i}.mp4`);
        const filePng = path.join(tempDir, `scene_${id}_${i}.png`);
        if (fs.existsSync(fileMp4)) fs.unlinkSync(fileMp4);
        if (fs.existsSync(filePng)) fs.unlinkSync(filePng);
      }
    } catch (cleanupErr) {
      console.warn("임시 파일 청소 오류:", cleanupErr);
    }

    return NextResponse.json({
      success: true,
      videoUrl: videoPublicUrl,
      message: "성공적으로 쇼츠 영상 합성이 완료되었습니다.",
    });
  } catch (error: any) {
    console.error("영상 합성 API 최상위 실패:", error);
    return NextResponse.json(
      { error: error.message || "영상 합성에 실패했습니다." },
      { status: 500 }
    );
  }
}
