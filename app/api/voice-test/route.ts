/**
 * POST /api/voice-test
 *
 * 이미지 생성 없이 텍스트만으로 여러 목소리 샘플 MP3를 한 번에 생성한다.
 * 운영 전 목소리 비교용. 결과물은 /public/voice-test/ 에 저장된다.
 *
 * Request body:
 * {
 *   text?: string;          // 테스트할 한국어 문장 (기본값: 내장 샘플)
 *   categoryId?: string;    // reelCategories.ts의 id → 해당 카테고리 기본 voice 사용
 *   voices?: VoiceSpec[];   // 직접 지정 (아래 참고)
 * }
 *
 * VoiceSpec:
 * {
 *   label: string;          // 파일명/결과 key에 쓰일 식별자 (예: "shimmer-0.9")
 *   provider: "openai" | "elevenlabs";
 *   voice?: string;         // OpenAI voice
 *   speed?: number;         // OpenAI speed (0.25–4.0)
 *   model?: string;         // "gpt-4o-mini-tts" | "tts-1" | "tts-1-hd"
 *   instructions?: string;  // gpt-4o-mini-tts 전용 말투 지시
 *   elevenLabsVoiceId?: string;
 *   elevenLabsStability?: number;
 *   elevenLabsStyle?: number;
 * }
 *
 * Response:
 * {
 *   success: true,
 *   samples: [{ label, url, provider, durationSec }]
 * }
 */

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { getReelCategory } from "@/lib/reelCategories";
import { getVoiceCandidateById } from "@/lib/voiceConfig";
import { checkPaidApi } from "@/lib/paidApiGuard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const execAsync = promisify(exec);

// ── 기본 테스트 문장 ─────────────────────────────────────────────────────────
const DEFAULT_SAMPLE_TEXT =
  "냉장고에는 생각보다 중요한 비밀이 숨어 있어요. " +
  "과일과 채소를 함께 보관하면 금방 상할 수 있거든요. " +
  "오늘부터 딱 이것만 바꿔보세요.";

// ── 기본 비교 목소리 세트 ────────────────────────────────────────────────────
const DEFAULT_VOICES: VoiceSpec[] = [
  { label: "nova-life", provider: "openai", voice: "nova", speed: 0.88, model: "gpt-4o-mini-tts", instructions: "Warm Korean lifestyle reels narrator. Natural pauses, friendly curiosity." },
  { label: "alloy-ai", provider: "openai", voice: "alloy", speed: 0.93, model: "gpt-4o-mini-tts", instructions: "Clear Korean tech explainer. Practical, modern, and confident." },
  { label: "onyx-motivation", provider: "openai", voice: "onyx", speed: 0.96, model: "gpt-4o-mini-tts", instructions: "Confident Korean motivational coach. Strong and cinematic, not shouting." },
  { label: "shimmer-soft", provider: "openai", voice: "shimmer", speed: 0.9, model: "gpt-4o-mini-tts", instructions: "Soft empathetic Korean narrator. Gentle, clear, and natural." },
  { label: "coral-bright", provider: "openai", voice: "coral", speed: 0.92, model: "gpt-4o-mini-tts", instructions: "Bright Korean short-form narrator. Cheerful but not childish." },
  { label: "sage-calm", provider: "openai", voice: "sage", speed: 0.9, model: "gpt-4o-mini-tts", instructions: "Calm Korean explainer. Trustworthy and composed." },
  { label: "ash-neutral", provider: "openai", voice: "ash", speed: 0.92, model: "gpt-4o-mini-tts", instructions: "Neutral Korean narrator. Clear, steady, and informative." },
  { label: "ballad-warm", provider: "openai", voice: "ballad", speed: 0.9, model: "gpt-4o-mini-tts", instructions: "Warm Korean narration with gentle emotional range." },
  { label: "echo-clean", provider: "openai", voice: "echo", speed: 0.92, model: "gpt-4o-mini-tts", instructions: "Clean Korean narration. Simple and direct." },
  { label: "fable-story", provider: "openai", voice: "fable", speed: 0.9, model: "gpt-4o-mini-tts", instructions: "Korean storytelling narrator. Friendly and expressive." },
  { label: "verse-smooth", provider: "openai", voice: "verse", speed: 0.9, model: "gpt-4o-mini-tts", instructions: "Smooth Korean narrator. Polished and relaxed." },
  { label: "marin-premium", provider: "openai", voice: "marin", speed: 0.9, model: "gpt-4o-mini-tts", instructions: "Premium Korean narrator. Natural, elegant, and high quality." },
  { label: "cedar-premium", provider: "openai", voice: "cedar", speed: 0.9, model: "gpt-4o-mini-tts", instructions: "Premium Korean narrator. Warm, grounded, and professional." },
];

interface VoiceSpec {
  label: string;
  provider: "openai" | "elevenlabs";
  voice?: string;
  speed?: number;
  model?: string;
  instructions?: string;
  elevenLabsVoiceId?: string;
  elevenLabsStability?: number;
  /** 목소리 유사도 (0~1). VoiceCandidate.elevenLabsSimilarityBoost에서 매핑됨 */
  elevenLabsSimilarityBoost?: number;
  elevenLabsStyle?: number;
}

function prepareText(raw: string): string {
  return raw
    .replace(/([.!?])\s+(?=[가-힣])/g, "$1 ... ")
    .replace(/([,，])\s*/g, ", ")
    .replace(/\.\.\.\s*\.\.\./g, "...")
    .trim();
}

async function probeAudioDuration(filePath: string): Promise<number> {
  try {
    const { stdout } = await execAsync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`,
      { timeout: 15000 }
    );
    const d = Number(stdout.trim());
    return Number.isFinite(d) && d > 0 ? d : 0;
  } catch {
    return 0;
  }
}

async function generateSample(
  text: string,
  spec: VoiceSpec,
  outputPath: string
): Promise<void> {
  const prepared = prepareText(text);

  if (spec.provider === "elevenlabs") {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) throw new Error("ELEVENLABS_API_KEY 없음");
    const voiceId = spec.elevenLabsVoiceId || process.env.ELEVENLABS_VOICE_ID || "EXAVITQu4vr4xnSDxMaL";
    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({
          text: prepared,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: spec.elevenLabsStability ?? 0.55,
            similarity_boost: spec.elevenLabsSimilarityBoost ?? 0.75,
            style: spec.elevenLabsStyle ?? 0.28,
            use_speaker_boost: true,
          },
        }),
      }
    );
    if (!res.ok) throw new Error(`ElevenLabs ${res.status}`);
    fs.writeFileSync(outputPath, Buffer.from(await res.arrayBuffer()));
    return;
  }

  // OpenAI
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY 없음");
  const model = spec.model || "gpt-4o-mini-tts";
  const openaiBody: Record<string, string | number> = {
    model,
    input: prepared,
    voice: spec.voice || "nova",
    speed: spec.speed ?? 0.9,
  };
  if (spec.instructions && model === "gpt-4o-mini-tts") {
    openaiBody.instructions = spec.instructions;
  }
  const res = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(openaiBody),
  });
  if (!res.ok) throw new Error(`OpenAI TTS ${res.status}`);
  fs.writeFileSync(outputPath, Buffer.from(await res.arrayBuffer()));
}

export async function POST(request: Request) {
  try {
    // ── 유료 TTS 가드 ─────────────────────────────────────────────────────────
    // voice-test는 항상 TTS를 생성하므로 body 파싱 전 차단
    // OpenAI TTS / ElevenLabs 둘 다 유료이므로 두 가드 모두 확인
    const openaiGuard = checkPaidApi("openai-tts", "voice-test");
    const elevenLabsGuard = checkPaidApi("elevenlabs", "voice-test");
    if (!openaiGuard.allowed && !elevenLabsGuard.allowed) {
      // 둘 다 차단 → OpenAI 기준으로 에러 반환
      return NextResponse.json(
        {
          ...openaiGuard.blockedResponse,
          operation: "voice-test",
          hint: "voice-test는 OpenAI TTS 또는 ElevenLabs TTS를 사용합니다. 하나 이상 허용하세요.",
          requiredEnvVars: [
            ...openaiGuard.blockedResponse!.requiredEnvVars,
            ...(elevenLabsGuard.blockedResponse?.requiredEnvVars ?? []),
          ],
        },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));

    // ── candidateId 분기 ────────────────────────────────────────────────────
    // candidateId가 있으면 voiceConfig.ts 후보를 단일 VoiceSpec으로 변환해 실행.
    // text가 없으면 후보의 previewText를 fallback으로 사용.
    if (body.candidateId) {
      const candidate = getVoiceCandidateById(body.candidateId as string);
      if (!candidate) {
        return NextResponse.json(
          { error: `candidateId '${body.candidateId}'에 해당하는 후보를 찾을 수 없습니다.` },
          { status: 400 }
        );
      }

      // ElevenLabs 후보인데 voiceId가 없으면 즉시 400
      if (candidate.provider === "elevenlabs" && !candidate.elevenLabsVoiceId) {
        return NextResponse.json(
          {
            error: "ElevenLabs voiceId가 설정되지 않았습니다.",
            voiceIdMissing: true,
            candidateId: candidate.id,
            hint: "lib/voiceConfig.ts의 elevenLabsVoiceId 필드에 ElevenLabs Voice ID를 입력하세요.",
          },
          { status: 400 }
        );
      }

      // ElevenLabs 가드 — voiceId가 있어도 ALLOW_ELEVENLABS=false면 차단
      if (candidate.provider === "elevenlabs") {
        const elGuard = checkPaidApi("elevenlabs", "voice-test/candidateId");
        if (!elGuard.allowed) {
          return NextResponse.json(
            { ...elGuard.blockedResponse, candidateId: candidate.id },
            { status: 403 }
          );
        }
      }

      // OpenAI 가드
      if (candidate.provider === "openai") {
        const oaiGuard = checkPaidApi("openai-tts", "voice-test/candidateId");
        if (!oaiGuard.allowed) {
          return NextResponse.json(
            { ...oaiGuard.blockedResponse, candidateId: candidate.id },
            { status: 403 }
          );
        }
      }

      // 후보 → VoiceSpec 변환
      const candidateSpec: VoiceSpec =
        candidate.provider === "openai"
          ? {
              label: candidate.id,
              provider: "openai",
              voice: candidate.openaiVoice,
              speed: candidate.openaiSpeed,
              model: candidate.openaiModel ?? "gpt-4o-mini-tts",
              instructions: candidate.openaiInstructions,
            }
          : {
              label: candidate.id,
              provider: "elevenlabs",
              elevenLabsVoiceId: candidate.elevenLabsVoiceId ?? undefined,
              elevenLabsStability: candidate.elevenLabsStability,
              elevenLabsSimilarityBoost: candidate.elevenLabsSimilarityBoost,
              elevenLabsStyle: candidate.elevenLabsStyle,
            };

      // text 우선순위: body.text > candidate.previewText > DEFAULT_SAMPLE_TEXT
      const sampleText: string =
        body.text || candidate.previewText || DEFAULT_SAMPLE_TEXT;

      // 단일 후보만 실행하고 바로 반환
      const projectRoot = process.cwd();
      const outDir = path.join(projectRoot, "public", "voice-test");
      fs.mkdirSync(outDir, { recursive: true });
      const sessionId = `vt_${Date.now()}`;
      const sessionDir = path.join(outDir, sessionId);
      fs.mkdirSync(sessionDir, { recursive: true });

      const safeLabel = candidateSpec.label.replace(/[^a-zA-Z0-9_\-]/g, "_");
      const filePath = path.join(sessionDir, `${safeLabel}.mp3`);
      try {
        await generateSample(sampleText, candidateSpec, filePath);
        const duration = await probeAudioDuration(filePath);
        fs.writeFileSync(
          path.join(sessionDir, "meta.json"),
          JSON.stringify(
            { sessionId, text: sampleText, candidateId: candidate.id, candidateSpec, createdAt: new Date().toISOString() },
            null, 2
          ),
          "utf-8"
        );
        return NextResponse.json({
          success: true,
          sessionId,
          text: sampleText,
          candidateId: candidate.id,
          samples: [{
            label: candidateSpec.label,
            url: `/voice-test/${sessionId}/${safeLabel}.mp3`,
            provider: candidate.provider,
            durationSec: Number(duration.toFixed(2)),
          }],
        });
      } catch (err) {
        return NextResponse.json(
          { error: `candidateId '${candidate.id}' 생성 실패: ${err instanceof Error ? err.message : String(err)}` },
          { status: 500 }
        );
      }
    }
    // ── candidateId 분기 끝 ────────────────────────────────────────────────

    // 카테고리 ID가 있으면 해당 카테고리 기본 voice를 첫 번째로 추가
    let voices: VoiceSpec[] = body.voices ?? [...DEFAULT_VOICES];
    if (body.categoryId) {
      const cat = getReelCategory(body.categoryId);
      if (cat) {
        const catSpec: VoiceSpec = {
          label: `${cat.id}-default`,
          provider: cat.ttsProvider,
          voice: cat.openaiVoice,
          speed: cat.openaiSpeed,
          model: cat.openaiModel || "gpt-4o-mini-tts",
          instructions: cat.openaiInstructions,
          elevenLabsVoiceId: cat.elevenLabsVoiceId,
        };
        // 중복 label이 없으면 맨 앞에 삽입
        if (!voices.find((v) => v.label === catSpec.label)) {
          voices = [catSpec, ...voices];
        }
      }
    }

    if (!voices.length) {
      return NextResponse.json({ error: "voices가 비어 있습니다." }, { status: 400 });
    }

    const text: string = body.text || DEFAULT_SAMPLE_TEXT;

    // 출력 디렉터리
    const projectRoot = process.cwd();
    const outDir = path.join(projectRoot, "public", "voice-test");
    fs.mkdirSync(outDir, { recursive: true });

    // 세션 ID (타임스탬프 기반)
    const sessionId = `vt_${Date.now()}`;
    const sessionDir = path.join(outDir, sessionId);
    fs.mkdirSync(sessionDir, { recursive: true });

    const results: Array<{
      label: string;
      url: string;
      provider: string;
      voice?: string;
      speed?: number;
      model?: string;
      instructions?: string;
      durationSec: number;
      error?: string;
    }> = [];

    // 순차 생성 (API rate limit 고려)
    for (const spec of voices) {
      const safeLabel = spec.label.replace(/[^a-zA-Z0-9_\-]/g, "_");
      const filePath = path.join(sessionDir, `${safeLabel}.mp3`);
      try {
        await generateSample(text, spec, filePath);
        const duration = await probeAudioDuration(filePath);
        results.push({
          label: spec.label,
          url: `/voice-test/${sessionId}/${safeLabel}.mp3`,
          provider: spec.provider,
          voice: spec.voice,
          speed: spec.speed,
          model: spec.model,
          instructions: spec.instructions,
          durationSec: Number(duration.toFixed(2)),
        });
      } catch (err) {
        results.push({
          label: spec.label,
          url: "",
          provider: spec.provider,
          voice: spec.voice,
          speed: spec.speed,
          model: spec.model,
          durationSec: 0,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    // 메타 파일 저장 (재현용)
    fs.writeFileSync(
      path.join(sessionDir, "meta.json"),
      JSON.stringify({ sessionId, text, voices, results, createdAt: new Date().toISOString() }, null, 2),
      "utf-8"
    );

    return NextResponse.json({
      success: true,
      sessionId,
      text,
      samples: results,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[/api/voice-test 오류]:", message);
    return NextResponse.json({ error: `voice-test 오류: ${message}` }, { status: 500 });
  }
}

// GET: 최근 세션 목록 조회
export async function GET() {
  try {
    const outDir = path.join(process.cwd(), "public", "voice-test");
    if (!fs.existsSync(outDir)) {
      return NextResponse.json({ sessions: [] });
    }
    const sessions = fs
      .readdirSync(outDir)
      .filter((name) => name.startsWith("vt_") && fs.statSync(path.join(outDir, name)).isDirectory())
      .sort()
      .reverse()
      .slice(0, 10)
      .map((name) => {
        const metaPath = path.join(outDir, name, "meta.json");
        if (fs.existsSync(metaPath)) {
          try {
            return JSON.parse(fs.readFileSync(metaPath, "utf-8"));
          } catch {
            return { sessionId: name };
          }
        }
        return { sessionId: name };
      });
    return NextResponse.json({ sessions });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
