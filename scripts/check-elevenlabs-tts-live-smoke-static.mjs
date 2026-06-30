/**
 * Static guard: ElevenLabs TTS live smoke builder integrity.
 * No network, no API calls, no clipboard, no fs writes to repo.
 * Exit 0 = all PASS. Exit 1 = at least one FAIL.
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const BUILDER_PATH = resolve(__dirname, "build-elevenlabs-tts-audio-from-script.mjs");

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

console.log("\nStatic guard check: ElevenLabs TTS live smoke builder\n");

// ── Builder file existence ──────────────────────────────────────────────────────
console.log("[ build-elevenlabs-tts-audio-from-script.mjs — file existence ]");

check(
  "builder file exists",
  existsSync(BUILDER_PATH),
);

if (!existsSync(BUILDER_PATH)) {
  console.error("\nFATAL: Builder file not found. Aborting guard.\n");
  process.exit(1);
}

const builderSrc = readFileSync(BUILDER_PATH, "utf-8");

// ── Forbidden patterns ──────────────────────────────────────────────────────────
console.log("\n[ build-elevenlabs-tts-audio-from-script.mjs — forbidden patterns ]");

check(
  "no axios outside comments",
  !codeLines(builderSrc).includes("axios"),
);
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
  "no .money-shorts-local direct access (guard only)",
  builderSrc.includes(".money-shorts-local") && builderSrc.includes("forbidden"),
);
check("no clipboard access", !codeLines(builderSrc).includes("navigator.clipboard"));
check("no DB/persistence calls", !codeLines(builderSrc).includes("supabase") && !codeLines(builderSrc).includes("prisma"));

// ── API key secret safety ──────────────────────────────────────────────────────
console.log("\n[ build-elevenlabs-tts-audio-from-script.mjs — secret safety ]");

check(
  "API key not logged directly (no console.log/error with bare apiKey variable)",
  !codeLines(builderSrc).includes("console.log(apiKey)") &&
    !codeLines(builderSrc).includes("console.error(apiKey)") &&
    !codeLines(builderSrc).match(/console\.(log|error)\(\s*`[^`]*\$\{apiKey\}/),
);
check(
  "API key not stored in summary JSON",
  !builderSrc.includes("apiKey:") || builderSrc.includes("apiKeyConfigured:"),
);
check(
  "voice ID masked in summary (voiceIdMasked used)",
  builderSrc.includes("voiceIdMasked"),
);
check(
  "mask function present (maskVoiceId)",
  builderSrc.includes("maskVoiceId"),
);

// ── ElevenLabs API contract ─────────────────────────────────────────────────────
console.log("\n[ build-elevenlabs-tts-audio-from-script.mjs — ElevenLabs API contract ]");

check(
  "ELEVENLABS_API_KEY env read",
  builderSrc.includes("ELEVENLABS_API_KEY"),
);
check(
  "ELEVENLABS_VOICE_ID env read",
  builderSrc.includes("ELEVENLABS_VOICE_ID"),
);
check(
  "api.elevenlabs.io endpoint present",
  builderSrc.includes("api.elevenlabs.io"),
);
check(
  "text-to-speech endpoint present",
  builderSrc.includes("text-to-speech"),
);
check(
  "eleven_multilingual_v2 default model present",
  builderSrc.includes("eleven_multilingual_v2"),
);
check(
  "voice_settings object present",
  builderSrc.includes("voice_settings"),
);
check(
  "stability parameter present",
  builderSrc.includes("stability"),
);
check(
  "similarity_boost parameter present",
  builderSrc.includes("similarity_boost"),
);
check(
  "style parameter present",
  builderSrc.includes("style"),
);
check(
  "use_speaker_boost parameter present",
  builderSrc.includes("use_speaker_boost"),
);
check(
  "xi-api-key header used",
  builderSrc.includes("xi-api-key"),
);
check(
  "output_format query parameter present",
  builderSrc.includes("output_format"),
);

// ── Summary schema ──────────────────────────────────────────────────────────────
console.log("\n[ build-elevenlabs-tts-audio-from-script.mjs — summary schema ]");

check(
  "schemaVersion money_shorts_elevenlabs_tts_live_smoke_summary_v1",
  builderSrc.includes("money_shorts_elevenlabs_tts_live_smoke_summary_v1"),
);
check(
  "liveApiCallPerformed field present",
  builderSrc.includes("liveApiCallPerformed"),
);
check(
  "qualityAccepted: false present",
  builderSrc.includes("qualityAccepted: false"),
);
check(
  "ownerListeningRequired: true present",
  builderSrc.includes("ownerListeningRequired: true"),
);
check(
  "notRealSpeech: false for success case",
  builderSrc.includes("notRealSpeech: false"),
);
check(
  "apiKeyConfigured field present",
  builderSrc.includes("apiKeyConfigured"),
);
check(
  "voiceIdConfigured field present",
  builderSrc.includes("voiceIdConfigured"),
);
check(
  "httpStatus field present",
  builderSrc.includes("httpStatus"),
);
check(
  "rawAudioDurationSec field present",
  builderSrc.includes("rawAudioDurationSec"),
);
check(
  "durationDeltaSec field present",
  builderSrc.includes("durationDeltaSec"),
);
check(
  "riskNotes present",
  builderSrc.includes("riskNotes"),
);
check(
  "elevenlabs-tts-live-smoke-summary.json filename present",
  builderSrc.includes("elevenlabs-tts-live-smoke-summary.json"),
);

// ── ffprobe verification ────────────────────────────────────────────────────────
console.log("\n[ build-elevenlabs-tts-audio-from-script.mjs — ffprobe verification ]");

check(
  "ffprobe called on audio",
  builderSrc.includes("ffprobe"),
);
check(
  "ffprobe failure is fatal",
  builderSrc.includes("ffprobeExitCode !== 0") &&
    builderSrc.includes("process.exit(1)"),
);
check(
  "audio stream existence check",
  builderSrc.includes("no audio stream") &&
    builderSrc.includes("process.exit(1)"),
);
check(
  "duration finite positive check",
  builderSrc.includes("Number.isFinite(rawAudioDurationSec)"),
);

// ── Safety guards ───────────────────────────────────────────────────────────────
console.log("\n[ build-elevenlabs-tts-audio-from-script.mjs — safety guards ]");

check(
  "out-dir repo guard present",
  builderSrc.includes("outDirAbs.startsWith(REPO_ROOT"),
);
check(
  "readiness check before API call",
  builderSrc.includes("apiKeyConfigured") &&
    builderSrc.includes("voiceIdConfigured") &&
    builderSrc.includes("READINESS FAILURE"),
);
check(
  "readiness failure: no API call (liveApiCallPerformed: false in failure summary)",
  builderSrc.includes("liveApiCallPerformed: false"),
);
check(
  "env values not printed (no console.log of secrets)",
  !builderSrc.includes("console.log(apiKey)") &&
    !builderSrc.includes("console.log(voiceId)"),
);
check(
  "output artifact saved to outDirAbs (not hardcoded repo path)",
  builderSrc.includes("outDirAbs") && !builderSrc.match(/join\s*\(\s*REPO_ROOT.*elevenlabs/),
);

// ── .env.local read-only loader ─────────────────────────────────────────────────
console.log("\n[ build-elevenlabs-tts-audio-from-script.mjs — .env.local read-only loader ]");

check(
  ".env.local is read via readFileSync (read-only access)",
  builderSrc.includes("readFileSync(envLocalPath") || builderSrc.includes("readFileSync(join(REPO_ROOT"),
);
check(
  "no writeFileSync to .env.local (read-only, never modified)",
  !codeLines(builderSrc).match(/writeFileSync\s*\(\s*[^)]*\.env\.local/),
);
check(
  "env loader uses no external dependencies (no dotenv import)",
  !codeLines(builderSrc).includes("dotenv") && !codeLines(builderSrc).includes("require(\"dotenv")  && !codeLines(builderSrc).includes("from \"dotenv"),
);
check(
  "resolveEnv helper: process.env first, then .env.local fallback",
  builderSrc.includes("resolveEnv") &&
    builderSrc.includes("process.env[key]") &&
    builderSrc.includes("envLocal[key]"),
);
check(
  "envSource field in summary (process.env / .env.local / mixed / missing)",
  builderSrc.includes("envSource") &&
    builderSrc.includes(".env.local") &&
    builderSrc.includes("process.env"),
);
check(
  "voiceLabel value not directly printed (configured boolean only)",
  !codeLines(builderSrc).match(/console\.log\s*\(`[^`]*\$\{voiceLabel\}/),
);

// ── Duration mode / compact_30s ────────────────────────────────────────────────
console.log("\n[ build-elevenlabs-tts-audio-from-script.mjs — duration mode / compact_30s ]");

check(
  "--duration-mode CLI option present",
  builderSrc.includes('"--duration-mode"'),
);
check(
  "compact_30s mode supported",
  builderSrc.includes("compact_30s"),
);
check(
  "full_narration mode supported",
  builderSrc.includes("full_narration"),
);
check(
  "textMode summary field present",
  builderSrc.includes("textMode"),
);
check(
  "sourceTextCharCount summary field present",
  builderSrc.includes("sourceTextCharCount"),
);
check(
  "sentTextCharCount summary field present",
  builderSrc.includes("sentTextCharCount"),
);
check(
  "durationControlTargetSec summary field present",
  builderSrc.includes("durationControlTargetSec"),
);
check(
  "durationControlReason summary field present",
  builderSrc.includes("durationControlReason"),
);
check(
  "compact mode uses captionText/spokenCaption first (deterministic, no LLM)",
  builderSrc.includes("captionText") && builderSrc.includes("spokenCaption"),
);
check(
  "compact mode fallback: first sentence of narration",
  builderSrc.includes("firstSentenceMatch"),
);
check(
  "API call count unchanged: 1 call regardless of textMode",
  builderSrc.includes("step 2/4") && !builderSrc.match(/fetch\([^)]+\)[\s\S]*?fetch\(/),
);

console.log(`\n${passed + failed} checks — ${passed} PASS, ${failed} FAIL\n`);

if (failed > 0) {
  process.exit(1);
}
