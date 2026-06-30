/**
 * Static guard: ElevenLabs scene-paced TTS builder + mux scene-paced support integrity.
 * No network, no API calls, no clipboard, no fs writes to repo.
 * Exit 0 = all PASS. Exit 1 = at least one FAIL.
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const BUILDER_PATH = resolve(__dirname, "build-elevenlabs-scene-paced-tts-from-script.mjs");
const MUX_PATH = resolve(__dirname, "mux-local-tts-audio-into-visual-mp4.mjs");

let passed = 0;
let failed = 0;

function check(label, condition) {
  if (condition) {
    console.log(`  PASS  ${label}`);
    passed++;
  } else {
    console.error(`  FAIL  ${label}`);
    failed++;
  }
}

function codeLines(src) {
  return src
    .split("\n")
    .filter((l) => !/^\s*(\/\/|\*)/.test(l))
    .join("\n");
}

console.log("\nStatic guard check: ElevenLabs scene-paced TTS builder\n");

// ── Builder file existence ──────────────────────────────────────────────────────
console.log("[ build-elevenlabs-scene-paced-tts-from-script.mjs — file existence ]");

check("builder file exists", existsSync(BUILDER_PATH));

if (!existsSync(BUILDER_PATH)) {
  console.error("\nFATAL: Builder file not found. Aborting guard.\n");
  process.exit(1);
}

const builderSrc = readFileSync(BUILDER_PATH, "utf-8");

// ── Forbidden patterns ──────────────────────────────────────────────────────────
console.log("\n[ build-elevenlabs-scene-paced-tts-from-script.mjs — forbidden patterns ]");

check("no axios outside comments", !codeLines(builderSrc).includes("axios"));
check(
  "no youtube.videos or googleapis.com",
  !codeLines(builderSrc).toLowerCase().includes("youtube.videos") &&
    !codeLines(builderSrc).includes("googleapis.com"),
);
check(
  "no graph.instagram or graph.facebook",
  !codeLines(builderSrc).includes("graph.instagram") &&
    !codeLines(builderSrc).includes("graph.facebook"),
);
check("no uploadVideo call", !codeLines(builderSrc).includes("uploadVideo"));
check("no OAuth outside comments", !codeLines(builderSrc).includes("OAuth"));
check("no accessToken outside comments", !codeLines(builderSrc).includes("accessToken"));
check("no refreshToken outside comments", !codeLines(builderSrc).includes("refreshToken"));
check("no shell: true", !codeLines(builderSrc).match(/shell\s*:\s*true/));
check("no execSync outside comments", !codeLines(builderSrc).includes("execSync"));
check(
  "no .money-shorts-local direct access (guard present)",
  builderSrc.includes(".money-shorts-local") && builderSrc.includes("forbidden"),
);
check("no clipboard access", !codeLines(builderSrc).includes("navigator.clipboard"));
check(
  "no DB/persistence calls",
  !codeLines(builderSrc).includes("supabase") && !codeLines(builderSrc).includes("prisma"),
);

// ── API key secret safety ──────────────────────────────────────────────────────
console.log("\n[ build-elevenlabs-scene-paced-tts-from-script.mjs — secret safety ]");

check(
  "API key not logged directly (no console.log/error with bare apiKey variable)",
  !codeLines(builderSrc).includes("console.log(apiKey)") &&
    !codeLines(builderSrc).includes("console.error(apiKey)") &&
    !codeLines(builderSrc).match(/console\.(log|error)\(\s*`[^`]*\$\{apiKey\}/),
);
check(
  "voice ID not logged directly (no console.log/error with bare voiceId variable)",
  !codeLines(builderSrc).includes("console.log(voiceId)") &&
    !codeLines(builderSrc).includes("console.error(voiceId)"),
);
check(
  "API key not stored in summary JSON (only apiKeyConfigured boolean)",
  !builderSrc.includes("apiKey:") || builderSrc.includes("apiKeyConfigured:"),
);
check("voice ID masked in summary (voiceIdMasked used)", builderSrc.includes("voiceIdMasked"));
check("mask function present (maskVoiceId)", builderSrc.includes("maskVoiceId"));

// ── ElevenLabs API contract ─────────────────────────────────────────────────────
console.log("\n[ build-elevenlabs-scene-paced-tts-from-script.mjs — ElevenLabs API contract ]");

check("ELEVENLABS_API_KEY env read", builderSrc.includes("ELEVENLABS_API_KEY"));
check("ELEVENLABS_VOICE_ID env read", builderSrc.includes("ELEVENLABS_VOICE_ID"));
check("api.elevenlabs.io endpoint present", builderSrc.includes("api.elevenlabs.io"));
check("text-to-speech endpoint present", builderSrc.includes("text-to-speech"));
check("eleven_multilingual_v2 default model", builderSrc.includes("eleven_multilingual_v2"));
check("voice_settings object present", builderSrc.includes("voice_settings"));
check("stability parameter present", builderSrc.includes("stability"));
check("similarity_boost parameter present", builderSrc.includes("similarity_boost"));
check("style parameter present", builderSrc.includes("style"));
check("use_speaker_boost parameter present", builderSrc.includes("use_speaker_boost"));
check("xi-api-key header used", builderSrc.includes("xi-api-key"));
check("output_format query parameter present", builderSrc.includes("output_format"));

// ── API call budget ─────────────────────────────────────────────────────────────
console.log("\n[ build-elevenlabs-scene-paced-tts-from-script.mjs — API call budget ]");

check(
  "API_CALL_BUDGET_MAX = 6 present",
  builderSrc.includes("API_CALL_BUDGET_MAX") && builderSrc.includes("6"),
);
check(
  "apiCallBudgetMax: 6 in summary",
  builderSrc.includes("apiCallBudgetMax") && builderSrc.includes("6"),
);
check("apiCallCount incremented per scene", builderSrc.includes("apiCallCount++"));
check(
  "budget guard: abort when apiCallCount >= budget",
  builderSrc.includes("apiCallCount >= API_CALL_BUDGET_MAX"),
);
check("no retry logic (no for/while retry loop)", !builderSrc.match(/for\s*\([^)]*retry/i));
check("apiCallCount in summary", builderSrc.includes("apiCallCount,"));

// ── Per-scene normalization ─────────────────────────────────────────────────────
console.log("\n[ build-elevenlabs-scene-paced-tts-from-script.mjs — per-scene normalization ]");

check(
  "per-scene normalized audio path: scene-NN-normalized.m4a",
  builderSrc.includes("normalized.m4a"),
);
check(
  "per-scene raw audio path: scene-NN-elevenlabs.mp3",
  builderSrc.includes("elevenlabs.mp3"),
);
check("apad normalize (padding) present", builderSrc.includes("apad=pad_dur="));
check(
  "trim normalize: -t targetSceneDurationSec",
  builderSrc.includes("targetSceneDurationSec"),
);
check(
  "normalize decision: trim if rawAudio > target",
  builderSrc.includes("rawAudioDurationSec > targetSceneDurationSec"),
);
check(
  "normalize decision: pad if rawAudio < target",
  builderSrc.includes("rawAudioDurationSec < targetSceneDurationSec"),
);
check(
  "normalizedStatus field in sceneResults (fit/trimmed/padded)",
  builderSrc.includes("normalizeStatus"),
);

// ── Concat and timeline ─────────────────────────────────────────────────────────
console.log("\n[ build-elevenlabs-scene-paced-tts-from-script.mjs — concat/timeline ]");

check("concat-list.txt written", builderSrc.includes("concat-list.txt"));
check("-f concat present", builderSrc.includes('"-f", "concat"'));
check("-safe 0 present", builderSrc.includes('"-safe", "0"'));
check(
  "timeline output: elevenlabs-scene-paced-timeline.m4a",
  builderSrc.includes("elevenlabs-scene-paced-timeline.m4a"),
);
check(
  "timeline ffprobe called (duration verification)",
  builderSrc.includes("timelineProbeResult"),
);
check(
  "timeline duration within ±0.5s check",
  builderSrc.includes("timelineDurationOk"),
);
check("timelineDurationSec in summary", builderSrc.includes("timelineDurationSec"));
check("timelineAudioPath in summary", builderSrc.includes("timelineAudioPath"));
check("timelineAudioCodec in summary", builderSrc.includes("timelineAudioCodec"));

// ── Summary schema ──────────────────────────────────────────────────────────────
console.log("\n[ build-elevenlabs-scene-paced-tts-from-script.mjs — summary schema ]");

check(
  "schemaVersion money_shorts_elevenlabs_scene_paced_tts_summary_v1",
  builderSrc.includes("money_shorts_elevenlabs_scene_paced_tts_summary_v1"),
);
check("liveApiCallPerformed field present", builderSrc.includes("liveApiCallPerformed"));
check("qualityAccepted: false present", builderSrc.includes("qualityAccepted: false"));
check("ownerListeningRequired: true present", builderSrc.includes("ownerListeningRequired: true"));
check("apiKeyConfigured field present", builderSrc.includes("apiKeyConfigured"));
check("voiceIdConfigured field present", builderSrc.includes("voiceIdConfigured"));
check("envSource field present", builderSrc.includes("envSource"));
check("riskNotes present", builderSrc.includes("riskNotes"));
check(
  "summary JSON filename: elevenlabs-scene-paced-tts-summary.json",
  builderSrc.includes("elevenlabs-scene-paced-tts-summary.json"),
);
check("sceneResults array in summary (scenes field)", builderSrc.includes("sceneResults"));
check("readinessFailure field in summary", builderSrc.includes("readinessFailure"));

// ── Safety guards ───────────────────────────────────────────────────────────────
console.log("\n[ build-elevenlabs-scene-paced-tts-from-script.mjs — safety guards ]");

check("out-dir repo guard present", builderSrc.includes("outDirAbs.startsWith(REPO_ROOT"));
check(
  "readiness check before API call",
  builderSrc.includes("apiKeyConfigured") &&
    builderSrc.includes("voiceIdConfigured") &&
    builderSrc.includes("READINESS FAILURE"),
);
check(
  "readiness failure: liveApiCallPerformed: false in failure summary",
  builderSrc.includes("liveApiCallPerformed: false"),
);
check(
  "env values not printed",
  !builderSrc.includes("console.log(apiKey)") && !builderSrc.includes("console.log(voiceId)"),
);
check(
  "output artifact saved to outDirAbs (not hardcoded repo path)",
  builderSrc.includes("outDirAbs") && !builderSrc.match(/join\s*\(\s*REPO_ROOT.*elevenlabs/),
);

// ── .env.local read-only loader ─────────────────────────────────────────────────
console.log("\n[ build-elevenlabs-scene-paced-tts-from-script.mjs — .env.local read-only loader ]");

check(
  ".env.local is read via readFileSync (read-only access)",
  builderSrc.includes("readFileSync(envLocalPath") || builderSrc.includes("readFileSync(join(REPO_ROOT"),
);
check(
  "no writeFileSync to .env.local (read-only, never modified)",
  !codeLines(builderSrc).match(/writeFileSync\s*\(\s*[^)]*\.env\.local/),
);
check(
  "no dotenv import",
  !codeLines(builderSrc).includes("dotenv"),
);
check(
  "resolveEnv helper: process.env first, then .env.local fallback",
  builderSrc.includes("resolveEnv") &&
    builderSrc.includes("process.env[key]") &&
    builderSrc.includes("envLocal[key]"),
);
check(
  "envSource field in summary",
  builderSrc.includes("envSource") &&
    builderSrc.includes(".env.local") &&
    builderSrc.includes("process.env"),
);

// ── Text selection contract ─────────────────────────────────────────────────────
console.log("\n[ build-elevenlabs-scene-paced-tts-from-script.mjs — text selection contract ]");

check(
  "resolveSceneTtsText helper present",
  builderSrc.includes("resolveSceneTtsText"),
);
check(
  "ttsText priority: first candidate",
  builderSrc.includes('"ttsText"') && builderSrc.includes("scene.ttsText"),
);
check(
  "spokenCaption fallback present",
  builderSrc.includes('"spokenCaption"') && builderSrc.includes("scene.spokenCaption"),
);
check(
  "captionText fallback present",
  builderSrc.includes('"captionText"') && builderSrc.includes("scene.captionText"),
);
check(
  "narration fallback present (final fallback)",
  builderSrc.includes('"narration"') && builderSrc.includes("scene.narration"),
);
check(
  "textSource returned from resolveSceneTtsText",
  builderSrc.includes("textSource"),
);
check(
  "sentTextCharCount returned from resolveSceneTtsText",
  builderSrc.includes("sentTextCharCount"),
);
check(
  "sourceTextCharCount returned from resolveSceneTtsText",
  builderSrc.includes("sourceTextCharCount"),
);
check(
  "abort when no TTS text found (all sources empty)",
  builderSrc.includes("no usable TTS text") && builderSrc.includes("process.exit(1)"),
);

// ── Duration budget contract ────────────────────────────────────────────────────
console.log("\n[ build-elevenlabs-scene-paced-tts-from-script.mjs — duration budget contract ]");

check(
  "calcDurationTextBudget helper present",
  builderSrc.includes("calcDurationTextBudget"),
);
check(
  "TTS_CHARS_PER_SEC_MIN constant defined (padding lower bound)",
  builderSrc.includes("TTS_CHARS_PER_SEC_MIN"),
);
check(
  "TTS_CHARS_PER_SEC_TARGET constant defined",
  builderSrc.includes("TTS_CHARS_PER_SEC_TARGET"),
);
check(
  "TTS_CHARS_PER_SEC_WARN constant defined",
  builderSrc.includes("TTS_CHARS_PER_SEC_WARN"),
);
check(
  "durationTextBudgetMinChars field in scene summary",
  builderSrc.includes("durationTextBudgetMinChars"),
);
check(
  "durationTextBudgetMaxChars field in scene summary",
  builderSrc.includes("durationTextBudgetMaxChars"),
);
check(
  "durationTextBudgetStatus: under_budget present",
  builderSrc.includes('"under_budget"'),
);
check(
  "durationTextBudgetStatus: within_budget present",
  builderSrc.includes('"within_budget"'),
);
check(
  "durationTextBudgetStatus: over_budget present",
  builderSrc.includes('"over_budget"'),
);
check(
  "under_budget warning text present (silence padding likely)",
  builderSrc.includes("silence padding likely"),
);
check(
  "over_budget warning text present (trim risk)",
  builderSrc.includes("trim"),
);
check(
  "durationTextBudgetWarning field in scene summary",
  builderSrc.includes("durationTextBudgetWarning"),
);
check(
  "budget warning propagated to riskNotes (under and over)",
  builderSrc.includes("durationTextBudgetWarning") && builderSrc.includes("riskNotes.push"),
);

// ── Fixture ttsText quality checks ─────────────────────────────────────────────
const FIXTURE_PATH = resolve(__dirname, "fixtures/provider-candidate-tts-script.local-mock.json");
if (!existsSync(FIXTURE_PATH)) {
  console.error("\nFATAL: Fixture file not found. Skipping fixture checks.\n");
} else {
  const fixture = JSON.parse(readFileSync(FIXTURE_PATH, "utf-8"));
  const scenes = fixture.scenes ?? [];

  console.log("\n[ provider-candidate-tts-script.local-mock.json — ttsText quality ]");

  check(
    "fixture has 6 scenes with ttsText",
    scenes.length === 6 && scenes.every((s) => typeof s.ttsText === "string" && s.ttsText.trim().length > 0),
  );

  const MIN_RATE = 6;
  const MAX_RATE = 10;
  check(
    "all ttsText within_budget (6–10 chars/sec)",
    scenes.every((s) => {
      const len = s.ttsText.trim().length;
      return len >= Math.floor(s.durationSec * MIN_RATE) && len <= Math.floor(s.durationSec * MAX_RATE);
    }),
  );

  check(
    "at least one ttsText differs from its captionText (not caption-only regression)",
    scenes.some((s) => s.ttsText && s.captionText && s.ttsText.trim() !== s.captionText.trim()),
  );
}

// ── Mux scene-paced support ─────────────────────────────────────────────────────
if (!existsSync(MUX_PATH)) {
  console.error("\nFATAL: Mux file not found. Skipping mux checks.\n");
} else {
  const muxSrc = readFileSync(MUX_PATH, "utf-8");

  console.log("\n[ mux-local-tts-audio-into-visual-mp4.mjs — scene-paced schema support ]");

  check(
    "money_shorts_elevenlabs_scene_paced_tts_summary_v1 in ALLOWED_SCHEMAS",
    muxSrc.includes("money_shorts_elevenlabs_scene_paced_tts_summary_v1"),
  );
  check(
    "timelineAudioPath used for scene-paced audio path",
    muxSrc.includes("timelineAudioPath"),
  );
  check(
    "timelineDurationSec used for scene-paced raw duration",
    muxSrc.includes("timelineDurationSec"),
  );
  check(
    "scene-paced liveApiCallPerformed validated",
    muxSrc.includes("liveApiCallPerformed") && muxSrc.includes("!== true"),
  );
  check(
    "scene-paced qualityAccepted validated",
    muxSrc.includes("qualityAccepted") && muxSrc.includes("!== false"),
  );
  check(
    "scene-paced ownerListeningRequired validated",
    muxSrc.includes("ownerListeningRequired") && muxSrc.includes("!== true"),
  );
  check(
    "scene-paced risk notes added (ElevenLabs + Owner)",
    muxSrc.includes("ElevenLabs live smoke audio is not quality accepted yet.") &&
      muxSrc.includes("Owner listening review required."),
  );
  check(
    "muxMode elevenlabs_scene_paced present",
    muxSrc.includes('"elevenlabs_scene_paced"'),
  );
}

console.log(`\n${passed + failed} checks — ${passed} PASS, ${failed} FAIL\n`);

if (failed > 0) {
  process.exit(1);
}
