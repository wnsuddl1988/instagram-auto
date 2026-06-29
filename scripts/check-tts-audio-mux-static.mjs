/**
 * Static guard: local mock TTS audio mux renderer + script fixture integrity.
 * No network, no ffmpeg execution, no clipboard, no fs writes to repo.
 * Exit 0 = all PASS. Exit 1 = at least one FAIL.
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const RENDERER_PATH = resolve(__dirname, "mux-local-tts-audio-into-visual-mp4.mjs");
const SCRIPT_FIXTURE_PATH = resolve(__dirname, "fixtures/provider-candidate-tts-script.local-mock.json");

const rendererSrc = readFileSync(RENDERER_PATH, "utf-8");
const scriptFixtureSrc = readFileSync(SCRIPT_FIXTURE_PATH, "utf-8");
const scriptFixture = JSON.parse(scriptFixtureSrc);

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

console.log("\nStatic guard check: TTS audio mux renderer + script fixture\n");

// ── Renderer: security constraints ────────────────────────────────────────────
console.log("[ mux-local-tts-audio-into-visual-mp4.mjs — security ]");
check(
  "no shell: true",
  !rendererSrc
    .split("\n")
    .filter((l) => !/^\s*(\/\/|\*)/.test(l))
    .join("\n")
    .match(/shell\s*:\s*true/),
);
check(
  "no exec( outside comments",
  !rendererSrc
    .split("\n")
    .filter((l) => !/^\s*(\/\/|\*)/.test(l))
    .join("\n")
    .includes("exec("),
);
check(
  "no execSync outside comments",
  !rendererSrc
    .split("\n")
    .filter((l) => !/^\s*(\/\/|\*)/.test(l))
    .join("\n")
    .includes("execSync"),
);
check(
  "spawnSync used (args array pattern)",
  rendererSrc.includes("spawnSync("),
);
check(
  "no fetch( call",
  !rendererSrc.includes("fetch("),
);
check(
  "no navigator.clipboard",
  !rendererSrc.includes("navigator.clipboard"),
);
check(
  ".money-shorts-local guard present",
  rendererSrc.includes(".money-shorts-local") && rendererSrc.includes("forbidden"),
);
check(
  "out-dir repo safety guard present",
  rendererSrc.includes("outDirAbs.startsWith(REPO_ROOT"),
);
check(
  "no ElevenLabs API call",
  !rendererSrc.includes("elevenlabs") && !rendererSrc.includes("api.elevenlabs"),
);
check(
  "no OpenAI API call",
  !rendererSrc.includes("openai.com") && !rendererSrc.includes("api.openai"),
);
check(
  "no Google/Azure TTS API",
  !rendererSrc.includes("googleapis.com") && !rendererSrc.includes("azure.com"),
);
check(
  "ffprobe verification present",
  rendererSrc.includes("ffprobe"),
);
check(
  "ffprobe failure causes exit 1",
  rendererSrc.includes("ffprobe verification FAILED") || (
    rendererSrc.includes("ffprobeExitCode !== 0") && rendererSrc.includes("process.exit(1)")
  ),
);

// ── Renderer: output artifact location safety ─────────────────────────────────
console.log("\n[ mux-local-tts-audio-into-visual-mp4.mjs — repo artifact safety ]");
check(
  "no hardcoded repo-internal output path (output/ public/ app/ lib/)",
  !rendererSrc.match(/["'`](?:output|public|app|lib)\/[^"'`]*\.(?:mp4|wav|json)["'`]/),
);
check(
  "output path uses outDirAbs (not hardcoded)",
  rendererSrc.includes("join(outDirAbs,"),
);
check(
  "temp wav/audio written to outDirAbs",
  rendererSrc.includes("outDirAbs") && rendererSrc.includes(".wav"),
);

// ── Renderer: codec and mux spec ──────────────────────────────────────────────
console.log("\n[ mux-local-tts-audio-into-visual-mp4.mjs — codec/mux spec ]");
check(
  "video stream copy (-c:v copy)",
  rendererSrc.includes('"-c:v", "copy"') || rendererSrc.includes("c:v copy"),
);
check(
  "audio encoded to aac (-c:a aac)",
  rendererSrc.includes('"aac"') && rendererSrc.includes("c:a"),
);
check(
  "-t duration trim present",
  rendererSrc.includes('"-t"'),
);
check(
  "-shortest present",
  rendererSrc.includes('"-shortest"'),
);
check(
  "duration validation ± 0.5s from targetDurationSec",
  rendererSrc.includes("durationLo") && rendererSrc.includes("durationHi"),
);
check(
  "audio stream count >= 1 validated",
  rendererSrc.includes("audio stream count >= 1"),
);
check(
  "audio codec aac validated",
  rendererSrc.includes("audio codec aac"),
);

// ── Renderer: local_mock TTS mode enforcement ──────────────────────────────────
console.log("\n[ mux-local-tts-audio-into-visual-mp4.mjs — local_mock mode ]");
check(
  "local_mock mode check enforced",
  rendererSrc.includes("ttsMode !== \"local_mock\""),
);
check(
  "lavfi anoisesrc used for mock audio",
  rendererSrc.includes("anoisesrc"),
);
check(
  "real speech disclaimer in source",
  rendererSrc.includes("NOT real speech") || rendererSrc.includes("not real speech"),
);

// ── Renderer: summary JSON fields ────────────────────────────────────────────
console.log("\n[ mux-local-tts-audio-into-visual-mp4.mjs — summary JSON fields ]");
check(
  "schemaVersion: money_shorts_tts_mux_summary_v1",
  rendererSrc.includes("money_shorts_tts_mux_summary_v1"),
);
check(
  "rawAudioDurationSec in summary",
  rendererSrc.includes("rawAudioDurationSec"),
);
check(
  "videoDurationSec in summary",
  rendererSrc.includes("videoDurationSec"),
);
check(
  "muxedDurationSec in summary",
  rendererSrc.includes("muxedDurationSec"),
);
check(
  "durationDeltaSec in summary",
  rendererSrc.includes("durationDeltaSec"),
);
check(
  "audioCodec in summary",
  rendererSrc.includes("audioCodec"),
);
check(
  "audioStreamCount in summary",
  rendererSrc.includes("audioStreamCount"),
);
check(
  "riskNotes in summary",
  rendererSrc.includes("riskNotes"),
);
check(
  "ffmpegExitCode in summary",
  rendererSrc.includes("ffmpegExitCode"),
);
check(
  "ffprobeExitCode in summary",
  rendererSrc.includes("ffprobeExitCode"),
);
check(
  "fileSizeBytes in summary",
  rendererSrc.includes("fileSizeBytes"),
);

// ── Renderer: audio padded/trimmed risk notes ──────────────────────────────────
console.log("\n[ mux-local-tts-audio-into-visual-mp4.mjs — audio padding/trim risk ]");
check(
  "audio padded risk note present",
  rendererSrc.includes("audio padded"),
);
check(
  "audio trimmed risk note present",
  rendererSrc.includes("audio trimmed"),
);
check(
  "1s threshold for padded/trimmed check",
  rendererSrc.includes("< -1.0") && rendererSrc.includes("> 1.0"),
);

// ── Script fixture: schema and local_mock declaration ────────────────────────
console.log("\n[ provider-candidate-tts-script.local-mock.json — schema ]");
check(
  "schemaVersion is money_shorts_tts_script_v1",
  scriptFixture.schemaVersion === "money_shorts_tts_script_v1",
);
check(
  "ttsMode is local_mock",
  scriptFixture.ttsMode === "local_mock",
);
check(
  "ttsProvider is local_mock",
  scriptFixture.ttsProvider === "local_mock",
);
check(
  "manifestId matches provider-candidate manifest",
  scriptFixture.manifestId === "rp-provider-candidate-ecos-base-rate",
);
check(
  "factCardId references ecos-base-rate-candidate",
  typeof scriptFixture.factCardId === "string" &&
    scriptFixture.factCardId.includes("ecos-base-rate-candidate"),
);
check(
  "targetDurationSec is 30",
  scriptFixture.targetDurationSec === 30,
);
check(
  "scenes array has 6 entries",
  Array.isArray(scriptFixture.scenes) && scriptFixture.scenes.length === 6,
);
check(
  "riskNotes contains ElevenLabs final-pass note",
  Array.isArray(scriptFixture.riskNotes) &&
    scriptFixture.riskNotes.some((n) => n.toLowerCase().includes("elevenlabs")),
);
check(
  "riskNotes contains not real speech disclaimer",
  Array.isArray(scriptFixture.riskNotes) &&
    scriptFixture.riskNotes.some((n) => n.toLowerCase().includes("not real speech")),
);

// ── Script fixture: scene structure ──────────────────────────────────────────
console.log("\n[ provider-candidate-tts-script.local-mock.json — scenes ]");
const sc = scriptFixture.scenes;
check(
  "scene durations sum to 30s (4+5+6+6+4+5)",
  sc.reduce((s, scene) => s + scene.durationSec, 0) === 30,
);
check(
  "each scene has narration text",
  sc.every((scene) => typeof scene.narration === "string" && scene.narration.length > 0),
);
check(
  "scene timing is contiguous (startSec/endSec)",
  sc.every((scene, i) =>
    i === 0
      ? scene.startSec === 0
      : scene.startSec === sc[i - 1].endSec,
  ),
);
check(
  "scene 1 is hook",
  sc[0]?.sceneRole === "hook",
);
check(
  "scene 6 is action_closing",
  sc[5]?.sceneRole === "action_closing",
);
check(
  "scene 6 ends at 30s",
  sc[5]?.endSec === 30,
);

console.log(`\n${passed + failed} checks — ${passed} PASS, ${failed} FAIL\n`);

if (failed > 0) {
  process.exit(1);
}
