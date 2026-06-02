import { NextResponse } from "next/server";
import { exec } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { promisify } from "util";
import { ensureAssets } from "@/lib/assetDownloader";
import { GeneratedReelV2, ReelV2Meta } from "@/lib/openai";
import { downloadImagenImageToFile } from "@/lib/imagen";
import { checkPaidApi } from "@/lib/paidApiGuard";
import { saveOrUpdateGeneration } from "@/lib/supabase";
import { searchStockPhoto } from "@/lib/pexels";
import { searchPixabayPhoto } from "@/lib/pixabay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const execAsync = promisify(exec);

type TtsProvider = "openai" | "elevenlabs";
interface TtsOptions {
  openaiVoice?: string;
  openaiModel?: string;
  openaiSpeed?: number;
  openaiInstructions?: string;
  elevenLabsVoiceId?: string;
}

async function downloadUrlToFile(url: string, filePath: string): Promise<boolean> {
  const controller = new AbortController();
  const timeoutMs = Number(process.env.POLLINATIONS_TIMEOUT_MS || 40000);
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "*/*",
      },
    });
    clearTimeout(timeoutId);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const buffer = Buffer.from(await response.arrayBuffer());
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, buffer);
    return true;
  } catch (error) {
    clearTimeout(timeoutId);
    console.warn("[render-v2] 다운로드 실패:", url, error);
    return false;
  }
}

function prepareNarrationText(raw: string): string {
  // 마침표/느낌표 뒤에 쉼표가 없으면 자연스러운 쉼 추가 (SSML 없는 ElevenLabs 대응)
  return raw
    .replace(/([.!?])\s+(?=[가-힣])/g, "$1 ... ")   // 문장 경계에 짧은 쉼
    .replace(/([,，])\s*/g, ", ")                       // 쉼표 정규화
    .replace(/\.\.\.\s*\.\.\./g, "...")                // 중복 쉼 제거
    .trim();
}

async function createNarration(
  script: string,
  outputPath: string,
  provider: TtsProvider,
  options: TtsOptions = {}
) {
  const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  // ── 유료 TTS 가드 ────────────────────────────────────────────────────────────
  if (provider === "elevenlabs") {
    const g = checkPaidApi("elevenlabs", "tts-render");
    if (!g.allowed) throw new Error(`[paidApiGuard] ElevenLabs TTS 차단: ${g.blockedResponse?.hint}`);
  } else {
    const g = checkPaidApi("openai-tts", "tts-render");
    if (!g.allowed) throw new Error(`[paidApiGuard] OpenAI TTS 차단: ${g.blockedResponse?.hint}`);
  }

  const narrationText = prepareNarrationText(script);

  if (provider === "elevenlabs" && ELEVENLABS_API_KEY) {
    const voiceId =
      options.elevenLabsVoiceId ||
      process.env.ELEVENLABS_VOICE_ID ||
      "EXAVITQu4vr4xnSDxMaL";
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: narrationText,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: Number(process.env.ELEVENLABS_STABILITY || 0.45),
            similarity_boost: Number(process.env.ELEVENLABS_SIMILARITY || 0.68),
            style: Number(process.env.ELEVENLABS_STYLE || 0.18),
            use_speaker_boost: true,
          },
        }),
      }
    );
    if (response.ok) {
      fs.writeFileSync(outputPath, Buffer.from(await response.arrayBuffer()));
      return;
    }
    console.warn("[render-v2] ElevenLabs 실패:", response.status);
  }

  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY 또는 ELEVENLABS_API_KEY가 필요합니다.");
  }

  const openaiModel =
    options.openaiModel || process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts";
  const openaiBody: Record<string, string | number> = {
    model: openaiModel,
    input: narrationText,
    voice: options.openaiVoice || process.env.OPENAI_TTS_VOICE || "nova",
    speed: options.openaiSpeed || Number(process.env.OPENAI_TTS_SPEED || 0.9),
  };
  if (options.openaiInstructions && openaiModel === "gpt-4o-mini-tts") {
    openaiBody.instructions = options.openaiInstructions;
  }

  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(openaiBody),
  });

  if (!response.ok) {
    throw new Error(`OpenAI TTS 실패: ${response.status}`);
  }

  fs.writeFileSync(outputPath, Buffer.from(await response.arrayBuffer()));
}

async function probeMediaDuration(filePath: string): Promise<number> {
  const { stdout } = await execAsync(
    `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`,
    { timeout: 30000 }
  );
  const duration = Number(stdout.trim());
  return Number.isFinite(duration) && duration > 0 ? duration : 0;
}

async function concatAudioFiles(audioPaths: string[], outputPath: string) {
  const listPath = path.join(path.dirname(outputPath), "narration_segments.txt");
  const listContent = audioPaths
    .map((audioPath) => `file '${audioPath.replace(/\\/g, "/").replace(/'/g, "'\\''")}'`)
    .join("\n");
  fs.writeFileSync(listPath, listContent, "utf-8");

  await execAsync(
    `ffmpeg -y -f concat -safe 0 -i "${listPath}" -c:a libmp3lame -q:a 3 "${outputPath}"`,
    {
      timeout: 120000,
      maxBuffer: 20 * 1024 * 1024,
    }
  );
}

async function createSceneNarrationTrack(
  scenes: Array<GeneratedReelV2["scenes"][number] & { localImagePath: string | null }>,
  outputPath: string,
  provider: TtsProvider,
  options: TtsOptions = {}
): Promise<{ audioPath: string; sceneDurations: number[] }> {
  const audioPaths: string[] = [];
  const sceneDurations: number[] = [];
  const narrationDir = path.join(path.dirname(outputPath), "scene_narration");
  fs.mkdirSync(narrationDir, { recursive: true });

  for (let i = 0; i < scenes.length; i += 1) {
    const sceneAudioPath = path.join(narrationDir, `scene_${i + 1}.mp3`);
    const narration = scenes[i].narration?.trim() || scenes[i].caption || "";
    await createNarration(narration, sceneAudioPath, provider, options);
    const duration = await probeMediaDuration(sceneAudioPath);
    audioPaths.push(sceneAudioPath);
    sceneDurations.push(Math.max(1.15, Number(duration.toFixed(3))));
  }

  await concatAudioFiles(audioPaths, outputPath);

  return {
    audioPath: outputPath,
    sceneDurations,
  };
}

function narrationWeight(text: string): number {
  const normalized = text.replace(/\s/g, "");
  const pauseWeight = (text.match(/[,.!?…]/g) || []).length * 2;
  return Math.max(1, normalized.length + pauseWeight);
}

function syncScenesToNarrationDuration(
  scenes: GeneratedReelV2["scenes"],
  narrationDuration: number,
  sceneDurations?: number[]
): GeneratedReelV2["scenes"] {
  if (narrationDuration <= 0) return scenes;
  if (sceneDurations?.length === scenes.length) {
    return scenes.map((scene, index) => ({
      ...scene,
      durationSec: Number(sceneDurations[index].toFixed(2)),
    }));
  }

  const minSceneDuration = 1.2;
  const weights = scenes.map((scene) => narrationWeight(scene.narration || scene.caption));
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  let remaining = narrationDuration;

  return scenes.map((scene, index) => {
    const isLast = index === scenes.length - 1;
    const proportional = (narrationDuration * weights[index]) / totalWeight;
    const durationSec = isLast
      ? Math.max(minSceneDuration, remaining)
      : Math.max(minSceneDuration, Number(proportional.toFixed(2)));
    remaining -= durationSec;

    return {
      ...scene,
      durationSec: Number(durationSec.toFixed(2)),
    };
  });
}

async function resolvePythonCommand(): Promise<string> {
  const candidates = [
    process.env.PYTHON_PATH,
    "python",
    "py",
    "python3",
    path.join(
      /* turbopackIgnore: true */ os.homedir(),
      ".cache",
      "codex-runtimes",
      "codex-primary-runtime",
      "dependencies",
      "python",
      "python.exe"
    ),
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    try {
      await execAsync(`"${candidate}" --version`);
      return candidate;
    } catch {
      // Try the next runtime candidate.
    }
  }

  throw new Error("Python 실행 파일을 찾지 못했습니다. PYTHON_PATH를 설정해주세요.");
}

function sanitizeImagePrompt(prompt: string): string {
  return prompt
    .replace(/\b9\s*:\s*16\b/gi, "")
    .replace(/\bno text\b/gi, "")
    .replace(/\bwith text\b/gi, "")
    .replace(/\bshowing\s+\d+[^,]*/gi, "with a clear visual cue")
    .replace(/\bexpiration dates?\b/gi, "freshness reminder")
    .replace(/\btemperature settings?\b/gi, "cool temperature mood")
    .replace(/\bdegrees?\b/gi, "cool temperature")
    .replace(/\bcalendar\b/gi, "reminder character")
    .replace(/\bclock\b/gi, "reminder character")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Imagen 전용 prompt 변환 (emotional_story)
 * - "child", "elderly father silhouette+action" 등 Imagen safety에 민감한 표현을 안전하게 치환
 * - hand-drawn / storybook 스타일 전환 후: 뒷모습·손·실루엣·작은 인물은 허용, 클로즈업 얼굴만 제거
 * - "no faces" → "no close-up faces"로 완화 — 뒷모습/실루엣/작은 인물 표현 보존
 */
function sanitizePromptForImagen(prompt: string): string {
  return sanitizeImagePrompt(prompt)
    // ── QA-17 silhouette+taking photo 조합 → object-only ───────────────────
    .replace(
      /(?:elderly\s+)?(?:father\s+|man(?:'s)?\s+)?silhouette\s+taking\s+(?:a\s+)?photo[^,]*/gi,
      "old photo half pulled from a worn leather wallet on a wooden table at dawn, warm coat sleeve beside it, warm morning light"
    )
    .replace(/\bshoulder\s+silhouette\b/gi, "back view silhouette, face not visible")
    // ── QA-16/QA-20 placing photo → object-only ─────────────────────────────
    .replace(
      /(?:(?:child|adult\s+hands?|adult\s+person|elderly\s+man(?:'s)?)\s+)?(?:gently\s+)?placing\s+(?:the\s+|an?\s+)?(?:old\s+)?photo\s+into\s+(?:their\s+own\s+|a\s+|the\s+)?wallet[^,]*/gi,
      "old photo tucked inside a wallet on a wooden table, warm light"
    )
    .replace(
      /(?:elderly\s+man(?:'s)?\s+)?(?:weathered\s+)?hands?\s+(?:gently\s+)?(?:placing|putting|setting|laying|resting)\s+(?:the\s+|an?\s+)?(?:old\s+)?photo\s+(?:next\s+to|beside|near|by|alongside)\s+(?:the\s+|an?\s+)?wallet[^,]*/gi,
      "old worn wallet and small faded photo resting side by side on a wooden table, warm light"
    )
    .replace(
      /elderly\s+man(?:'s)?\s+hands?\s+(?:gently\s+)?(?:placing|putting|setting|holding)\s+(?:the\s+)?photo\s+(?:next\s+to|beside|near|by)\s+(?:the\s+)?wallet[^,]*/gi,
      "old worn wallet and small faded photo side by side on wooden table, warm light"
    )
    .replace(/,?\s*hands\s+only\b/gi, "")
    .replace(/,?\s*their\s+own\s+wallet\b/gi, "a wallet")
    // ── silhouette 잔류 치환 (back view silhouette은 보존) ──────────────────
    .replace(/\b(?:elderly\s+)?(?:father\s+)?(?:man(?:'s)?\s+)?silhouette\b(?!\s*,\s*(?:back\s+view|face))/gi,
      "worn coat sleeve")
    .replace(/(?:,\s*back\s+view){2,}/gi, ", back view")
    // ── 복합 인물 구문 치환 ──────────────────────────────────────────────────
    .replace(/\bchild\s+opening\b/gi, "adult hands opening")
    .replace(/\bchild\s+placing\b/gi, "adult hands placing")
    .replace(/\bchild\s+holding\b/gi, "adult hands holding")
    .replace(/\bchild\s+looking\s+at\b/gi, "over-the-shoulder view of")
    .replace(/\bchild\s+taking\b/gi, "adult hands taking")
    .replace(/\bchild['']s\s+hands?\b/gi, "adult hands")
    .replace(/\bchild['']s\s+(?:shoulder|back|silhouette)\b/gi, "back view silhouette")
    .replace(/\bchild['']s\b/gi, "adult person's")
    .replace(/\bchild\b/gi, "adult person")
    // ── father 치환 ──────────────────────────────────────────────────────────
    .replace(/\belderly\s+father\s+silhouette\b/gi, "elderly man's silhouette, back view")
    .replace(/\bfather['']s\s+(?:old\s+)?wallet\b/gi, "an old worn wallet")
    .replace(/\bfather['']s\s+weathered\s+hands\b/gi, "elderly man's weathered hands")
    .replace(/\bfather['']s\s+hands\b/gi, "elderly man's hands")
    .replace(/\bfather['']s\s+worn\s+coat\b/gi, "elderly man's worn coat")
    .replace(/\bfather['']s\b/gi, "elderly man's")
    .replace(/\bfather\b/gi, "elderly man")
    // ── 기타 인물 표현 ───────────────────────────────────────────────────────
    .replace(/\belderly\s+man\s+taking\s+photo\b/gi,
      "elderly man's hands taking a photo from a wallet, face not visible")
    .replace(/\bclose.?up\s+(?:of\s+)?face\b/gi, "close-up of hands")  // 클로즈업 얼굴만 제거
    .replace(/\bfull.?body\b/gi, "back view")
    .replace(/\bshoulder\s+silhouette\b/gi, "back view silhouette, face not visible")
    // ── 정리 ────────────────────────────────────────────────────────────────
    .replace(/,\s*,/g, ",")
    .replace(/\s{2,}/g, " ")
    .trim()
    .replace(/,?\s*$/, "")
    // hand-drawn 스타일 suffix — "no faces" 대신 "no close-up faces"로 완화
    + ", no close-up faces, no text, no numbers, no readable text";
}

/**
 * Pollinations fallback 전용 prompt 변환
 * - 사람 관련 키워드를 object/silhouette/hands-only 표현으로 치환
 * - Imagen에 비해 face/person 필터가 약하므로 강제 치환 필요
 */
function sanitizePromptForPollinations(prompt: string): string {
  return sanitizeImagePrompt(prompt)
    // ── 얼굴 직접 노출 제거 (back/hands/silhouette은 허용)
    .replace(/\bclose.?up face\b/gi, "close-up hands")
    .replace(/\bsmile\b/gi, "soft glow")
    .replace(/\bexpression\b/gi, "texture")
    .replace(/\bportrait\b/gi, "back view scene")
    .replace(/\bhuman face\b/gi, "silhouette")
    .replace(/\bpeople\b/gi, "silhouettes")
    // ── family/인물 → 손/뒷모습/실루엣 표현으로 유지 (완전 제거 금지)
    .replace(/\bmother\b/gi, "mother's hands")
    .replace(/\bgrandmother\b/gi, "grandmother's hands")
    .replace(/\bgrandfather\b/gi, "grandfather's silhouette")
    // father/child/elderly 는 imagePrompt에 이미 포함된 경우 그대로 유지
    // (back view / hands / silhouette이 붙어있으면 문제없음)
    // 마지막에 no-face 지시어 추가 (no people 제거 — 손/실루엣 허용)
    .replace(/\s{2,}/g, " ")
    .trim()
    .replace(/,?\s*$/, "")
    + ", no faces, back view or hands only if person present, no readable text";
}

export async function POST(request: Request) {
  try {
    await ensureAssets();

    const body = await request.json();
    const plan = body.plan as GeneratedReelV2 | undefined;
    if (!plan?.scenes?.length) {
      return NextResponse.json(
        { error: "plan.scenes가 필요합니다." },
        { status: 400 }
      );
    }

    // rerenderMotionOnly: 기존 렌더 결과 디렉터리의 이미지와 나레이션을 그대로 쓰고
    // motion 값만 바꿔서 영상을 다시 만든다. 이미지/TTS 비용 0원으로 빠른 반복 테스트 가능.
    // 사용법: body = { plan: <기존plan>, rerenderMotionOnly: true, id: "기존id" }
    const rerenderMotionOnly = body.rerenderMotionOnly === true;

    // rerenderTtsOnly: 기존 이미지는 재사용하고 TTS만 새로 생성해 영상을 다시 만든다.
    // - 이미지 재생성 없음 (Imagen/Pollinations 호출 없음)
    // - 기존 narration.mp3 무시하고 새 TTS 설정으로 강제 재생성
    // - body.id로 기존 렌더 디렉터리 재사용, plan.scenes[].localImagePath 필수
    // 사용법: body = { plan: <기존plan(localImagePath 포함)>, rerenderTtsOnly: true, id: "기존id",
    //                  ttsVoice: "sage", ttsSpeed: 0.94, ttsInstructions: "..." }
    const rerenderTtsOnly = body.rerenderTtsOnly === true;
    const id = body.id || `v2_${Date.now()}`;
    const tempDir = path.join(
      /* turbopackIgnore: true */ process.cwd(),
      "output",
      "v2",
      id
    );
    fs.mkdirSync(tempDir, { recursive: true });

    // imageMode 전략 (docs/image-provider-strategy.md 참조):
    // - living_tips: "free-first" 또는 "pollinations-only" 권장 — Imagen 유료 플랜 불필요
    // - emotional_story: "paid-first" 또는 "imagen-only" 권장 — 품질 우선 (플랜 활성 필수)
    // - 기본값: "free-first" (Pollinations 우선 → 실패 시 Imagen fallback)
    const planReferenceStyle = (plan as GeneratedReelV2 & { _referenceStyle?: string })._referenceStyle || body.referenceStyle || "";
    const isLivingTipsPlan = planReferenceStyle === "living_tips";
    // living_tips는 체명시적 imageMode 없으면 pollinations-only 권장 (Imagen 유료 불필요)
    const defaultImageMode = isLivingTipsPlan ? "free-first" : "free-first";
    const imageMode = body.imageMode || process.env.IMAGE_PROVIDER_MODE || defaultImageMode;
    // allowProviderFallbackOnQuota: Imagen daily quota 소진 시 Pollinations로 fallback 허용
    const allowProviderFallbackOnQuota = body.allowProviderFallbackOnQuota !== false; // 기본 true
    // Imagen daily quota 소진 감지 플래그 — 소진 이후 씬은 즉시 Pollinations로 넘김
    let imagenDailyQuotaExhausted = false;
    // emotional_story: Pollinations fallback 시 face-safe prompt 사용
    const isEmotionalStoryPlan = planReferenceStyle === "emotional_story";
    // reuseAnchorImages: visualAnchorId가 같은 씬은 첫 번째 생성 이미지를 재사용 (이미지 비용 절감 + 시각 연속성)
    // emotional_story: hand-drawn 스타일 전환으로 씬별 독립 이미지가 품질에 유리 → 기본 false
    // 명시적으로 body.reuseAnchorImages: true 전달 시에만 활성화
    const reuseAnchorImages = isEmotionalStoryPlan && body.reuseAnchorImages === true;
    // anchorImageCache: anchorId → 첫 번째 성공 이미지 경로 매핑
    const anchorImageCache = new Map<string, { path: string; provider: "pollinations" | "imagen" | "stock" | "stock-pixabay" | "fallback" }>();
    const scenes: Array<GeneratedReelV2["scenes"][number] & {
      localImagePath: string | null;
      imageProvider: "pollinations" | "imagen" | "stock" | "stock-pixabay" | "fallback";
    }> = [];
    let lastPollinationsError: string | undefined;

    // 실패 씬 상세 기록 — 422 응답 + partial_plan.json에 포함
    type FailedSceneDetail = {
      sceneNumber: number;
      imagePrompt: string;
      simplifiedPromptUsed: boolean;
      // QA-27: "plan_required" = Imagen 유료 플랜 미활성 (재시도해도 무의미)
      errorType: "quota_rate_limit" | "safety_rejected" | "timeout_network" | "plan_required" | "unknown";
      message: string;
      retryAfterSeconds?: number;
    };
    const failedSceneDetails: FailedSceneDetail[] = [];
    // QA-27: Imagen 유료 플랜 미활성 감지 플래그
    let imagenPlanRequired = false;

    // ── partial_plan.json 저장 헬퍼 (씬 단위 체크포인트 — anchor/reuse/일반 경로 공통) ──
    function savePartialPlan() {
      const partialPlanPath = path.join(tempDir, "partial_plan.json");
      const sceneByNumber = new Map(
        scenes.map((s, _idx) => [s.sceneNumber ?? _idx + 1, s])
      );
      const partialScenes: Array<GeneratedReelV2["scenes"][number] & {
        localImagePath?: string | null;
        imageProvider?: "pollinations" | "imagen" | "stock" | "stock-pixabay" | "fallback";
      }> = plan!.scenes.map((originalScene, idx) => {
        const generatedScene = sceneByNumber.get(originalScene.sceneNumber ?? idx + 1);
        return generatedScene
          ? {
              ...originalScene,
              ...generatedScene,
              localImagePath: generatedScene.localImagePath,
              imageProvider: generatedScene.imageProvider,
            }
          : originalScene;
      });
      const partialData = {
        ...plan!,
        scenes: partialScenes,
        _partial: true,
        _generatedSceneCount: scenes.filter((s) => s.localImagePath).length,
        _failedScenes: partialScenes.filter((s) => !(s as { localImagePath?: string | null }).localImagePath).map((s) => s.sceneNumber),
        _failedSceneDetails: failedSceneDetails,
        _totalSceneCount: plan!.scenes.length,
        _savedAt: new Date().toISOString(),
        // QA-27: provider 상태 — partial_plan.json 진단용
        _imagenPlanRequired: imagenPlanRequired,
        _imagenDailyQuotaExhausted: imagenDailyQuotaExhausted,
        _imageMode: imageMode,
        _blockReason: imagenPlanRequired ? "plan_required" : imagenDailyQuotaExhausted ? "quota_exhausted" : null,
      };
      fs.writeFileSync(partialPlanPath, JSON.stringify(partialData, null, 2));
    }

    for (let i = 0; i < plan.scenes.length; i += 1) {
      const scene = plan.scenes[i];
      const existingImagePath = (scene as { localImagePath?: string }).localImagePath;
      const existingProvider = (scene as {
        imageProvider?: "pollinations" | "imagen" | "stock" | "stock-pixabay" | "fallback";
      }).imageProvider;
      // [1] rerenderMotionOnly 모드: 이미지 생성 없이 기존 경로 강제 사용
      if (rerenderMotionOnly) {
        if (!existingImagePath || !fs.existsSync(existingImagePath)) {
          return NextResponse.json(
            {
              error: `rerenderMotionOnly 모드인데 씬 ${i + 1}의 localImagePath가 없습니다.`,
              hint: "기존 plan.json(localImagePath 포함)을 그대로 body.plan에 넣어야 합니다.",
            },
            { status: 400 }
          );
        }
        console.log(`[render-v2] [motion-only] 씬 ${i + 1} 재사용: ${existingImagePath}`);
        scenes.push({
          ...scene,
          localImagePath: existingImagePath,
          imageProvider: existingProvider || "imagen",
        });
        continue;
      }

      // [1-b] rerenderTtsOnly 모드: 이미지 생성 없이 기존 경로 강제 사용 (TTS만 재생성)
      if (rerenderTtsOnly) {
        if (!existingImagePath || !fs.existsSync(existingImagePath)) {
          return NextResponse.json(
            {
              error: `rerenderTtsOnly 모드인데 씬 ${i + 1}의 localImagePath가 없습니다.`,
              hint: "기존 plan.json(localImagePath 포함)을 그대로 body.plan에 넣어야 합니다.",
            },
            { status: 400 }
          );
        }
        console.log(`[render-v2] [tts-only] 씬 ${i + 1} 이미지 재사용: ${existingImagePath}`);
        scenes.push({
          ...scene,
          localImagePath: existingImagePath,
          imageProvider: existingProvider || "imagen",
        });
        continue;
      }

      // [2] 일반 모드: localImagePath가 유효하면 재사용 (reuseLocalImages 기본값 true)
      // 반복 테스트 시 body에 { reuseLocalImages: true } (기본값) 또는
      // plan.scenes[i].localImagePath가 담긴 plan 객체를 그대로 전달하면 된다.
      if (
        body.reuseLocalImages !== false &&
        existingImagePath &&
        fs.existsSync(existingImagePath)
      ) {
        console.log(`[render-v2] 씬 ${i + 1} 기존 이미지 재사용: ${existingImagePath}`);
        scenes.push({
          ...scene,
          localImagePath: existingImagePath,
          imageProvider: existingProvider || "imagen",
        });
        continue;
      }

      // [3] visualAnchorId 재사용: 같은 anchorId의 이미지가 이미 생성됐으면 복사하여 재사용
      const anchorId = (scene as { visualAnchorId?: string }).visualAnchorId;
      if (reuseAnchorImages && anchorId) {
        const cached = anchorImageCache.get(anchorId);
        if (cached && fs.existsSync(cached.path)) {
          // 첫 씬 이미지를 현재 씬 경로로 복사 (motion이 다를 수 있으므로 별도 파일)
          const imagePath = path.join(/* turbopackIgnore: true */ tempDir, `scene_${i + 1}.png`);
          if (cached.path !== imagePath) {
            fs.copyFileSync(cached.path, imagePath);
          }
          console.log(`[render-v2] 씬 ${i + 1} anchor 재사용 (${anchorId}): ${cached.path}`);
          scenes.push({
            ...scene,
            localImagePath: imagePath,
            imageProvider: cached.provider,
          });
          savePartialPlan(); // anchor reuse 경로도 체크포인트 저장
          continue;
        }
      }

      const isEmotionalStory = planReferenceStyle === "emotional_story";
      const basePrompt = isEmotionalStory
        ? sanitizePromptForPollinations(scene.imagePrompt)
        : sanitizeImagePrompt(scene.imagePrompt);
      // emotional_story: hand-drawn 스타일 suffix 사용 (3D cinematic → watercolor storybook)
      const prompt = isEmotionalStory
        ? `${basePrompt}, warm hand-drawn animation, soft watercolor background, gentle pastel colors, emotional storybook illustration, 9:16 portrait, no text, no numbers, no close-up faces`
        : `${basePrompt}, polished 3D editorial illustration, expressive face, charming product character, clean cinematic lighting, high detail, centered main subject, no typography, no letters, no numbers, no labels, no logo, no watermark`;
      // Pollinations quota-fallback / 재시도 전용 단순 prompt — 핵심 오브젝트만 추출
      const promptShort = isEmotionalStory
        ? (() => {
            const core = (scene.imagePrompt ?? "").split(",")[0].trim().slice(0, 80);
            return `${core || "everyday object"}, warm hand-drawn animation, soft watercolor, storybook style, 9:16, no close-up faces, back view or hands only, no readable text`;
          })()
        : prompt;
      const imagePath = path.join(/* turbopackIgnore: true */ tempDir, `scene_${i + 1}.png`);

      let imageProvider: "pollinations" | "imagen" | "stock" | "stock-pixabay" | "fallback" = "fallback";
      let ok = false;

      // ── Stock photo 시도 (stock-first / stock-only) ──────────────────────────
      if (imageMode === "stock-first" || imageMode === "stock-only") {
        const stockQuery = (scene as { fallbackSearchQuery?: string }).fallbackSearchQuery
          || (scene.imagePrompt ?? "").split(",")[0].trim().slice(0, 80)
          || "household object";

        // 1차: Pexels
        console.log(`[render-v2] Pexels stock 시도 query="${stockQuery}" (씬 ${i + 1})`);
        const stockResult = await searchStockPhoto(stockQuery, { orientation: "portrait" });
        if (stockResult) {
          ok = await downloadUrlToFile(stockResult.imageUrl, imagePath);
          if (ok) {
            imageProvider = "stock";
            console.log(`[render-v2] Pexels stock 성공 (씬 ${i + 1}): ${stockResult.sourceUrl}`);
          } else {
            console.warn(`[render-v2] Pexels stock 다운로드 실패 (씬 ${i + 1})`);
          }
        }

        // 2차: Pixabay fallback (Pexels 실패 시)
        if (!ok) {
          console.log(`[render-v2] Pixabay fallback 시도 query="${stockQuery}" (씬 ${i + 1})`);
          const pixabayResult = await searchPixabayPhoto(stockQuery, { orientation: "portrait" });
          if (pixabayResult) {
            ok = await downloadUrlToFile(pixabayResult.imageUrl, imagePath);
            if (ok) {
              imageProvider = "stock-pixabay";
              console.log(`[render-v2] Pixabay fallback 성공 (씬 ${i + 1}): ${pixabayResult.sourceUrl}`);
            } else {
              console.warn(`[render-v2] Pixabay 다운로드 실패 (씬 ${i + 1})`);
            }
          }
        }

        // stock-only: 둘 다 실패해도 Pollinations/Imagen fallback 진행하지 않음
        if (!ok && imageMode === "stock-only") {
          failedSceneDetails.push({
            sceneNumber: scene.sceneNumber,
            imagePrompt: scene.imagePrompt ?? "",
            simplifiedPromptUsed: false,
            errorType: "unknown",
            message: `stock-only 모드: Pexels + Pixabay 모두 실패 (query="${stockQuery}")`,
          });
        }
      }

      // ── Pollinations 시도 (turbo → flux → flux-realism 순차 시도) ───────────
      if (!ok && imageMode !== "imagen-only" && imageMode !== "stock-only") {
        const pollinationsModels = (process.env.POLLINATIONS_MODELS || "turbo,flux,flux-realism").split(",").map((m) => m.trim()).filter(Boolean);
        const seed = Date.now() + i;
        for (const model of pollinationsModels) {
          const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1080&height=1920&model=${model}&nologo=true&seed=${seed}`;
          console.log(`[render-v2] Pollinations 시도 model=${model} (씬 ${i + 1})${isEmotionalStory ? " [face-safe]" : ""}`);
          ok = await downloadUrlToFile(imageUrl, imagePath);
          if (ok) {
            imageProvider = "pollinations";
            break;
          }
          console.warn(`[render-v2] Pollinations model=${model} 실패 (씬 ${i + 1}), 다음 모델 시도`);
        }
        if (!ok) {
          lastPollinationsError = `씬 ${i + 1} Pollinations 다운로드 실패 (turbo/flux/flux-realism 모두 실패)`;
          console.warn(`[render-v2] ${lastPollinationsError}`);
        }
      }

      // ── Imagen 시도 (Retry-After 대기 + simplified prompt 2차, 최대 3회) ────
      // 유료 Imagen 가드: 차단 시 fallback으로 넘어감 (imagenDailyQuotaExhausted와 동일 동선)
      const imagenGuard = checkPaidApi("imagen", `render-imagen-scene-${i + 1}`);
      if (!imagenGuard.allowed) {
        if (!imagenDailyQuotaExhausted) {
          console.warn(`[render-v2] Imagen 유료 API 차단 (씬 ${i + 1}): ${imagenGuard.blockedResponse?.hint}`);
          imagenDailyQuotaExhausted = true; // Pollinations fallback 경로로 자연스럽게 이동
        }
      }
      if (!ok && imageMode !== "pollinations-only" && imageMode !== "stock-only" && process.env.GEMINI_API_KEY && !imagenDailyQuotaExhausted) {
        // emotional_story: Imagen safety 대응 — child/father 직접 표현을 adult hands/elderly hands로 치환
        const imagenBasePrompt = isEmotionalStory
          ? sanitizePromptForImagen(scene.imagePrompt ?? "")
          : prompt;
        // 1차 prompt: Imagen-safe 상세 프롬프트
        const imagenPromptFull = isEmotionalStory
          ? `${imagenBasePrompt}, warm hand-drawn animation style, soft watercolor background, gentle pastel colors, emotional storybook illustration, no captions, no typography, no symbols`
          : `${imagenBasePrompt}, premium Korean short-form reel illustration style, warm cinematic lighting, no captions, no typography, no symbols`;
        // 2차 prompt: 안전/거절 대응용 단순화 버전 — 첫 절에서 핵심 오브젝트만, 인물 표현 재차 제거
        const imagenPromptSimple = (() => {
          const rawCore = (scene.imagePrompt ?? "").split(",")[0].trim();
          // 인물 표현 제거 후 80자 제한
          const safeCore = isEmotionalStory
            ? rawCore
                .replace(/\b(child|father|elderly father|person|people)\b/gi, "")
                .replace(/\s{2,}/g, " ").trim()
            : rawCore;
          const core = safeCore.slice(0, 80) || "old wallet and photo on wooden table";
          return `${core}, warm cinematic 3D illustration, soft lighting, 9:16 portrait, no text, no faces, no numbers`;
        })();

        const maxAttempts = Number(process.env.IMAGEN_RETRY_COUNT || 3);
        let lastErrMsg = "";
        let lastErrType: FailedSceneDetail["errorType"] = "unknown";
        let lastRetryAfter: number | undefined;
        let usedSimplified = false;
        let isPerDayLimit = false;

        for (let attempt = 0; attempt < maxAttempts && !ok; attempt++) {
          // 2차 시도부터 simplified prompt 사용
          const useSimple = attempt >= 1;
          const imagenPrompt = useSimple ? imagenPromptSimple : imagenPromptFull;
          if (useSimple) usedSimplified = true;

          try {
            ok = await downloadImagenImageToFile(imagenPrompt, imagePath);
            if (ok) imageProvider = "imagen";
          } catch (imgErr) {
            const errMsg = imgErr instanceof Error ? imgErr.message : String(imgErr);
            const isQuota =
              imgErr instanceof Error &&
              (imgErr as Error & { isQuotaError?: boolean }).isQuotaError;
            const isSafety = /safety|policy|blocked|rejected/i.test(errMsg);
            // per_day limit 감지: 일일 quota 소진이면 재시도 무의미
            isPerDayLimit = /per.?day|per_day|daily/i.test(errMsg);
            // QA-27: Imagen 유료 플랜 미활성 감지 — 재시도해도 무의미
            const isPlanRequired = /only available on paid plans|upgrade your account|paid plans/i.test(errMsg);

            // 에러 유형 분류
            if (isPlanRequired) {
              lastErrType = "plan_required";
              if (!imagenPlanRequired) {
                console.warn(`[render-v2] Imagen 유료 플랜 미활성 감지 (씬 ${i + 1}): ${errMsg}`);
                imagenPlanRequired = true;
                imagenDailyQuotaExhausted = true; // Pollinations fallback 경로로 전환
              }
            } else if (isQuota) {
              lastErrType = "quota_rate_limit";
            } else if (isSafety) {
              lastErrType = "safety_rejected";
            } else if (/timeout|network|fetch|ECONNRESET/i.test(errMsg)) {
              lastErrType = "timeout_network";
            } else {
              lastErrType = "unknown";
            }
            lastErrMsg = errMsg;

            if (isPlanRequired) {
              // QA-27: 유료 플랜 미활성 — 재시도 무의미, 즉시 탈출 (imagenDailyQuotaExhausted 이미 true)
              break;
            } else if (isQuota) {
              const retryAfter =
                (imgErr as Error & { retryAfterSeconds?: number }).retryAfterSeconds ?? 60;
              lastRetryAfter = retryAfter;
              if (isPerDayLimit) {
                // 일일 quota 소진 — 재시도 반복 무의미, 즉시 탈출
                console.warn(`[render-v2] Imagen 일일 quota 소진 감지 (씬 ${i + 1}). 이후 씬은 Pollinations fallback으로 전환.`);
                imagenDailyQuotaExhausted = true;
                break;
              }
              const isLastAttempt = attempt === maxAttempts - 1;
              if (isLastAttempt) {
                console.warn(`[render-v2] Imagen rate limit 재시도 소진 (씬 ${i + 1})`);
                break;
              }
              const waitSec = Math.min(retryAfter, 90);
              console.warn(`[render-v2] Imagen 429 (씬 ${i + 1}), ${waitSec}초 대기 후 재시도 (${attempt + 1}/${maxAttempts})`);
              await new Promise((r) => setTimeout(r, waitSec * 1000));
            } else {
              // safety/network 에러: 대기 없이 다음 시도(simplified prompt)로 즉시 진행
              console.warn(`[render-v2] Imagen ${lastErrType} (씬 ${i + 1}, attempt ${attempt + 1}): ${errMsg}`);
            }
          }
        }

        // 모든 Imagen 시도 실패 + allowProviderFallbackOnQuota 활성 → Pollinations fallback 재시도 (단순 prompt 사용)
        if (!ok && (imagenDailyQuotaExhausted || lastErrType === "quota_rate_limit") && allowProviderFallbackOnQuota) {
          console.log(`[render-v2] Imagen quota → Pollinations fallback 시도 (씬 ${i + 1}) [단순 prompt]`);
          const pollinationsModels = (process.env.POLLINATIONS_MODELS || "turbo,flux,flux-realism").split(",").map((m) => m.trim()).filter(Boolean);
          const seed = Date.now() + i + 9999;
          for (const model of pollinationsModels) {
            const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(promptShort)}?width=1080&height=1920&model=${model}&nologo=true&seed=${seed}`;
            console.log(`[render-v2] quota-fallback Pollinations model=${model} (씬 ${i + 1}) prompt="${promptShort.slice(0, 80)}..."`);
            ok = await downloadUrlToFile(imageUrl, imagePath);
            if (ok) {
              imageProvider = "pollinations";
              console.log(`[render-v2] quota-fallback 성공 model=${model} (씬 ${i + 1})`);
              break;
            }
          }
        }

        // 모든 시도 실패 → failedSceneDetails에 기록
        if (!ok) {
          failedSceneDetails.push({
            sceneNumber: scene.sceneNumber,
            imagePrompt: scene.imagePrompt ?? "",
            simplifiedPromptUsed: usedSimplified,
            errorType: lastErrType,
            message: lastErrMsg,
            retryAfterSeconds: lastRetryAfter,
          });
        }
      } else if (!ok && imagenDailyQuotaExhausted && allowProviderFallbackOnQuota && imageMode !== "pollinations-only") {
        // Imagen 일일 quota 이미 소진된 상태 — Pollinations로 바로 시도 (단순 prompt 우선)
        console.log(`[render-v2] 이미 Imagen quota 소진 상태 → Pollinations fallback (씬 ${i + 1}) [단순 prompt]`);
        const pollinationsModels = (process.env.POLLINATIONS_MODELS || "turbo,flux,flux-realism").split(",").map((m) => m.trim()).filter(Boolean);
        const seed = Date.now() + i + 9999;
        // 1차: 단순 prompt (promptShort)
        for (const model of pollinationsModels) {
          const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(promptShort)}?width=1080&height=1920&model=${model}&nologo=true&seed=${seed}`;
          console.log(`[render-v2] quota-exhausted fallback model=${model} (씬 ${i + 1}) prompt="${promptShort.slice(0, 80)}..."`);
          ok = await downloadUrlToFile(imageUrl, imagePath);
          if (ok) { imageProvider = "pollinations"; break; }
        }
        // 2차: 일반 prompt 재시도 (단순 prompt 실패 시)
        if (!ok) {
          for (const model of pollinationsModels) {
            const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1080&height=1920&model=${model}&nologo=true&seed=${seed + 777}`;
            console.log(`[render-v2] quota-exhausted fallback 2차 model=${model} (씬 ${i + 1})`);
            ok = await downloadUrlToFile(imageUrl, imagePath);
            if (ok) { imageProvider = "pollinations"; break; }
          }
        }
        if (!ok) {
          failedSceneDetails.push({
            sceneNumber: scene.sceneNumber,
            imagePrompt: scene.imagePrompt ?? "",
            simplifiedPromptUsed: false,
            errorType: "quota_rate_limit",
            message: "Imagen 일일 quota 소진, Pollinations fallback도 실패 (단순/일반 prompt 모두 시도)",
          });
        }
      }

      const finalImagePath = ok ? imagePath : null;
      // anchor 캐시 등록 — 성공한 첫 번째 이미지를 anchorId 키로 저장
      if (reuseAnchorImages && anchorId && finalImagePath && !anchorImageCache.has(anchorId)) {
        anchorImageCache.set(anchorId, { path: finalImagePath, provider: imageProvider });
        console.log(`[render-v2] anchor 캐시 등록 (${anchorId}): 씬 ${i + 1}`);
      }
      scenes.push({
        ...scene,
        localImagePath: finalImagePath,
        imageProvider,
      });

      // ── partial_plan.json 저장 (씬 단위 체크포인트) ────────────────────────
      savePartialPlan();
    }

    const expectedSceneCount = Number((plan as GeneratedReelV2 & { _totalSceneCount?: number })._totalSceneCount || plan.scenes.length);
    if (scenes.length < expectedSceneCount) {
      return NextResponse.json(
        {
          error: `partial plan이 불완전합니다. 현재 ${scenes.length}씬만 포함되어 있고, 전체 ${expectedSceneCount}씬이 필요합니다. 새 콘티로 다시 렌더하거나 전체 scenes가 포함된 partial_plan.json을 사용하세요.`,
          failedScenes: Array.from(
            { length: expectedSceneCount - scenes.length },
            (_, idx) => scenes.length + idx + 1
          ),
          generatedSceneCount: scenes.filter((s) => s.localImagePath).length,
          totalSceneCount: expectedSceneCount,
          partialOutputDir: tempDir,
          partialPlanPath: path.join(tempDir, "partial_plan.json"),
        },
        { status: 422 }
      );
    }

    const missingImages = scenes.filter((scene) => !scene.localImagePath);
    if (missingImages.length > 0) {
      const generatedCount = scenes.filter((s) => s.localImagePath).length;
      // QA-27: plan_required vs quota 분기 — 재시도 권고 내용이 다름
      const blockReason = imagenPlanRequired
        ? "plan_required"
        : imagenDailyQuotaExhausted
        ? "quota_exhausted"
        : "unknown";
      const errorMsg422 = imagenPlanRequired
        ? "Imagen 3은 유료 플랜에서만 사용 가능합니다. Google AI Studio(ai.dev)에서 Imagen 유료 플랜을 활성화하거나, imageMode='pollinations-only'로 재시도하세요."
        : imagenDailyQuotaExhausted
        ? "오늘 Imagen quota 소진: Pollinations fallback도 실패한 씬이 있습니다. 내일 재시도하거나 allowProviderFallbackOnQuota:true로 다시 요청하세요."
        : "이미지 생성 실패 씬이 있어 렌더링을 중단했습니다.";
      const recommendedNextActions = imagenPlanRequired
        ? [
            "imageMode='pollinations-only'로 무료 Pollinations 렌더 시도 (품질 차이 있을 수 있음)",
            "Google AI Studio(https://ai.dev/projects)에서 Imagen 유료 플랜 활성화 후 재시도",
            "⛔ 같은 imageMode='imagen-only'로 재시도하면 동일 오류 반복 — 재시도 금지",
          ]
        : imagenDailyQuotaExhausted
        ? [
            "body.allowProviderFallbackOnQuota:true (기본값)로 재전송하면 실패 씬을 Pollinations로 재시도합니다",
            "내일 Imagen quota 리셋 후 재시도",
          ]
        : [
            "partial_plan.json을 body.plan으로, body.id를 현재 id로 재전송하면 생성된 씬 이미지를 재사용합니다.",
            "body.reuseLocalImages: true (기본값)로 보내면 성공한 씬은 건너뜁니다.",
          ];
      return NextResponse.json(
        {
          error: errorMsg422,
          // QA-27: 구조화된 provider 차단 정보 — UI에서 분기 처리용
          imageProviderBlocked: imagenPlanRequired || imagenDailyQuotaExhausted,
          blockedProvider: (imagenPlanRequired || imagenDailyQuotaExhausted) ? "imagen" : undefined,
          blockReason,
          recommendedNextActions,
          imagenDailyQuotaExhausted,
          imagenPlanRequired,
          failedScenes: missingImages.map((s) => s.sceneNumber),
          failedSceneDetails,
          generatedSceneCount: generatedCount,
          totalSceneCount: plan.scenes.length,
          partialOutputDir: tempDir,
          partialPlanPath: path.join(tempDir, "partial_plan.json"),
          hint: [
            ...recommendedNextActions,
            lastPollinationsError ? `Pollinations: ${lastPollinationsError}` : null,
          ].filter(Boolean),
        },
        { status: 422 }
      );
    }

    const ttsProvider = (body.ttsProvider ||
      process.env.TTS_PROVIDER ||
      "openai") as TtsProvider;
    // emotional_story: 설명 톤 방지 — 기본값을 warm/intimate 나레이션으로 고정
    const isEmotionalStoryTts = planReferenceStyle === "emotional_story";
    // emotional_story TTS 기본값:
    //   voice: sage (QA-22 재렌더 사용자 확인 — 감동사연 OpenAI 기본 TTS 확정값. 이전: shimmer/1.08)
    //   speed: 0.94 (느리고 여운 있게, 설명조 방지) — OPENAI_TTS_SPEED_EMOTIONAL로 오버라이드
    const defaultEmotionalVoice = process.env.OPENAI_TTS_VOICE_EMOTIONAL || "sage";
    // QA-26 피드백: 0.94 → 0.92 (더 차분하고 느린 톤)
    const defaultEmotionalSpeed = Number(process.env.OPENAI_TTS_SPEED_EMOTIONAL || 0.92);
    const defaultEmotionalInstructions =
      // QA-26 피드백 반영: 피치 낮게, 끝음절 들뜨지 않게, "있었어요~~" 하이톤 방지
      "Quiet emotional Korean storytelling. Soft, intimate, and slow. " +
      "Keep pitch consistently low throughout the entire narration. " +
      "Do NOT lift the final syllable of any sentence — especially words ending in '어요', '었어요', '셨어요', '았어요'. " +
      "No upward inflection, no rising cheerful tone, no excited ending. " +
      "Maintain a steady, restrained, deeply personal tone from start to finish. " +
      "Pause gently between clauses. Breathe with sadness, not brightness. " +
      "Do not sound like a news anchor, classroom leader, explainer, tutorial, or announcer.";
    const ttsOptions: TtsOptions = {
      openaiVoice: body.ttsVoice || body.openaiVoice || (isEmotionalStoryTts ? defaultEmotionalVoice : undefined),
      openaiModel: body.ttsModel || body.openaiModel,
      openaiInstructions: body.ttsInstructions || body.openaiInstructions || (isEmotionalStoryTts ? defaultEmotionalInstructions : undefined),
      openaiSpeed:
        typeof body.ttsSpeed === "number"
          ? body.ttsSpeed
          : typeof body.openaiSpeed === "number"
            ? body.openaiSpeed
            : isEmotionalStoryTts ? defaultEmotionalSpeed : undefined,
      elevenLabsVoiceId: body.elevenLabsVoiceId,
    };
    // QA-26: emotional_story는 문장 간 "..." 쉼으로 구분 — TTS가 각 문장을 완결 후 끊어 읽게 함
    const scriptSeparator = isEmotionalStoryTts ? "... " : ", ";
    const effectiveScript = scenes
      .map((scene) => scene.narration?.trim())
      .filter(Boolean)
      .join(scriptSeparator);

    let narrationPath = path.join(/* turbopackIgnore: true */ tempDir, "narration.mp3");
    const existingNarrationPath = (plan as { narrationPath?: string }).narrationPath;
    let sceneDurations: number[] | undefined;
    if (rerenderMotionOnly) {
      if (fs.existsSync(narrationPath)) {
        console.log("[render-v2] [motion-only] 기존 narration 재사용:", narrationPath);
      } else if (existingNarrationPath && fs.existsSync(existingNarrationPath)) {
        narrationPath = existingNarrationPath;
        console.log("[render-v2] [motion-only] plan narration 재사용:", narrationPath);
      } else {
        return NextResponse.json(
          {
            error: "rerenderMotionOnly 모드인데 기존 narration.mp3가 없습니다.",
            hint: "기존 plan.json의 narrationPath를 포함하거나 같은 id의 output/v2/<id>/narration.mp3를 유지해야 합니다.",
          },
          { status: 400 }
        );
      }
    } else {
      // ── TTS 새 생성 전 유료 API 가드 (rerenderMotionOnly/기존파일 재사용 경로는 이미 위에서 처리됨)
      // 기존 narration.mp3가 이미 존재하면 재사용하고 TTS 가드 건너뜀
      // 단, rerenderTtsOnly 모드에서는 기존 파일 무시하고 강제 재생성
      if (fs.existsSync(narrationPath) && !rerenderTtsOnly) {
        console.log("[render-v2] 기존 narration.mp3 재사용 (TTS 호출 없음):", narrationPath);
      } else {
        // 새 TTS 생성 필요 → 유료 가드 확인
        const ttsGuardProvider = ttsProvider === "elevenlabs" ? "elevenlabs" : "openai-tts";
        const ttsGuard = checkPaidApi(ttsGuardProvider, "tts-render-new");
        if (!ttsGuard.allowed) {
          return NextResponse.json(
            {
              ...ttsGuard.blockedResponse,
              hint2: "기존 narration.mp3가 없어 새 TTS 생성이 필요합니다. 승인 후 재시도하거나 rerenderMotionOnly:true로 기존 파일을 재사용하세요.",
            },
            { status: 403 }
          );
        }

        const useSceneTts = body.sceneTts !== false;
        if (useSceneTts) {
          const sceneNarration = await createSceneNarrationTrack(
            scenes,
            narrationPath,
            ttsProvider,
            ttsOptions
          );
          narrationPath = sceneNarration.audioPath;
          sceneDurations = sceneNarration.sceneDurations;
        } else {
          await createNarration(
            effectiveScript || plan.script,
            narrationPath,
            ttsProvider,
            ttsOptions
          );
        }
      }
    }

    const narrationDuration = await probeMediaDuration(narrationPath);
    const syncedScenes = syncScenesToNarrationDuration(
      scenes,
      narrationDuration,
      sceneDurations
    );

    // ── 영상 길이 상한 체크 ────────────────────────────────────────────────────
    const maxReelDurationSec = Number(process.env.MAX_REEL_DURATION_SEC || 65);
    const totalSceneDuration = syncedScenes.reduce((sum, s) => sum + (s.durationSec ?? 0), 0);
    const durationExceeded = totalSceneDuration > maxReelDurationSec;
    if (durationExceeded) {
      console.warn(`[render-v2] 영상 길이 초과: ${totalSceneDuration.toFixed(1)}초 (한도 ${maxReelDurationSec}초). 렌더는 계속 진행하고 경고 포함 응답.`);
    }

    const inputPath = path.join(/* turbopackIgnore: true */ tempDir, "plan.json");
    const outputPath = path.join(/* turbopackIgnore: true */ tempDir, `${id}.mp4`);
    const renderedPlan = {
      ...plan,
      script: effectiveScript || plan.script,
      id,
      scenes: syncedScenes,
      narrationPath,
      narrationDuration,
      ttsProvider,
      ttsOptions,
    };
    fs.writeFileSync(inputPath, JSON.stringify(renderedPlan, null, 2), "utf-8");

    const pythonCmd = await resolvePythonCommand();

    const scriptPath = path.join(
      /* turbopackIgnore: true */ process.cwd(),
      "python",
      "render_v2.py"
    );
    const runCommand = `"${pythonCmd}" "${scriptPath}" "${inputPath}" "${outputPath}"`;
    const { stdout, stderr } = await execAsync(runCommand, {
      timeout: 300000,
      maxBuffer: 50 * 1024 * 1024,
    });
    if (stderr) console.warn("[render-v2 python stderr]", stderr);
    if (stdout) console.log("[render-v2 python stdout]", stdout);

    if (!fs.existsSync(outputPath)) {
      throw new Error("v2 렌더 결과물이 생성되지 않았습니다.");
    }

    const publicVideosDir = path.join(
      /* turbopackIgnore: true */ process.cwd(),
      "public",
      "videos"
    );
    fs.mkdirSync(publicVideosDir, { recursive: true });
    const publicVideoPath = path.join(/* turbopackIgnore: true */ publicVideosDir, `${id}.mp4`);
    fs.copyFileSync(outputPath, publicVideoPath);

    // 씬별 sync/debug 요약 (UI에서 확인용)
    const sceneSyncInfo = syncedScenes.map((scene) => {
      const s = scene as typeof scene & {
        imageProvider?: string;
        localImagePath?: string | null;
      };
      return {
        sceneNumber: scene.sceneNumber,
        caption: scene.caption,
        narration: scene.narration,
        durationSec: scene.durationSec,
        motion: scene.motion,
        imageProvider: s.imageProvider ?? "unknown",
        hasImage: Boolean(s.localImagePath),
      };
    });

    // ── Supabase generations insert ───────────────────────────────────────────
    // insert 실패가 렌더 응답을 깨뜨리지 않도록 try/catch로 감싼다.
    // rerenderMotionOnly / rerenderTtsOnly는 기존 이력 기반 재렌더이므로 중복 insert 방지.
    let saveWarning: string | undefined;
    let saveSkippedReason: string | undefined;
    if (rerenderMotionOnly || rerenderTtsOnly) {
      saveSkippedReason = rerenderMotionOnly ? "rerenderMotionOnly" : "rerenderTtsOnly";
      console.log(`[render-v2] Supabase insert 건너뜀 — ${saveSkippedReason}`);
    } else try {
      const meta = (plan as GeneratedReelV2 & { _meta?: ReelV2Meta })._meta;
      const metaSnapshot = meta
        ? {
            ...(meta.categoryId ? { categoryId: meta.categoryId } : {}),
            ...(meta.categoryName ? { categoryName: meta.categoryName } : {}),
            ...(meta.subTopicId ? { subTopicId: meta.subTopicId } : {}),
            ...(meta.subTopicName ? { subTopicName: meta.subTopicName } : {}),
            ...(meta.topicMode ? { topicMode: meta.topicMode } : {}),
            ...(meta.concreteTopic ? { concreteTopic: meta.concreteTopic } : {}),
            ...(meta.customTopic ? { customTopic: meta.customTopic } : {}),
            ...(meta.accountPreset?.id ? { accountPresetId: meta.accountPreset.id } : {}),
            ...(meta.accountPreset?.name ? { accountPresetName: meta.accountPreset.name } : {}),
          }
        : null;

      // category_emoji는 GeneratedReelV2에 없으므로 _meta 또는 body에서 추출
      const categoryEmoji = (body.categoryEmoji as string | undefined) ?? undefined;

      await saveOrUpdateGeneration({
        category_id: meta?.categoryId ?? (plan._categoryId as string | undefined) ?? "unknown",
        category_name: meta?.categoryName ?? "알 수 없음",
        category_emoji: categoryEmoji,
        title: plan.title || plan.topTitle || "제목 없음",
        script: plan.script ?? "",
        hook: plan.hook ?? undefined,
        call_to_action: plan.callToAction ?? undefined,
        hashtags: plan.hashtags?.length ? plan.hashtags : undefined,
        video_path: `/videos/${id}.mp4`,
        duration: Math.round(totalSceneDuration) || plan.estimatedDuration || 30,
        tone: plan.targetAudience ?? undefined,
        status: "rendered",
        meta_snapshot: metaSnapshot,
      });
      console.log("[render-v2] Supabase generations 저장/갱신 완료 (render id:", id, ")");
    } catch (saveErr) {
      saveWarning = saveErr instanceof Error ? saveErr.message : String(saveErr);
      console.warn("[render-v2] Supabase 저장 실패 (렌더 결과는 정상):", saveWarning);
    }

    return NextResponse.json({
      success: true,
      id,
      videoUrl: `/videos/${id}.mp4`,
      plan: renderedPlan,
      sceneSyncInfo,
      totalDurationSec: Number(totalSceneDuration.toFixed(1)),
      durationExceeded,
      durationWarning: durationExceeded
        ? `영상 길이 ${totalSceneDuration.toFixed(1)}초 — ${maxReelDurationSec}초 기준 초과. narration을 줄이거나 씬 수를 줄여 재생성 권장.`
        : null,
      fallbackScenesUsed: scenes.filter((s) => s.imageProvider === "pollinations").map((s) => s.sceneNumber ?? "?"),
      stockScenesUsed: scenes.filter((s) => s.imageProvider === "stock").map((s) => s.sceneNumber ?? "?"),
      ...(saveWarning ? { saveWarning } : {}),
      ...(saveSkippedReason ? { saveSkippedReason } : {}),
      message: "v2 샘플 렌더링 완료",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[/api/render-v2 오류]:", message, error);
    return NextResponse.json(
      { error: `v2 렌더링 오류: ${message}` },
      { status: 500 }
    );
  }
}
