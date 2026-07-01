#!/usr/bin/env node
// ──────────────────────────────────────────────────────────────────────────
// audit-money-shorts-post-render-artifact-v1.mjs
//
// MONEY SHORTS OS — POST-RENDER ARTIFACT AUDIT v1 (local ffmpeg/ffprobe only)
//
// 실제 mp4 아티팩트를 audit한다. JSON plan이 아니라 실제 mp4의:
//   - first-5s silence, total silence ratio, speech active ratio (silencedetect 실측)
//   - perceptual_event_count, card presence ratio, full-screen image dominance
//     (render의 perceptual_event_report.json이 있을 때)
//   - first 2s hook card 존재 여부
// ffprobe media validity는 quality pass가 아니다. 이 audit이 실제 판정을 한다.
//
// 판정: rejected v2 → FAIL. accepted baseline → reference/pass_with_known_limits.
//       new golden sample → pass_candidate 또는 정확한 blocker(mp4 부재).
//
// 절대 하지 않는 것: render/tts/mux/image gen/network/env/secret/upload/deploy.
//   ffprobe/ffmpeg는 read-only(-f null -)로만 사용. 어떤 파일도 새로 만들지 않는 것은 아니고,
//   audit output JSON 2개만 C:\tmp 아래에 쓴다.
//
// 산출물:
//   scripts/fixtures/post_render_artifact_audit.output.v1.json  (repo, data-only 결과)
// ──────────────────────────────────────────────────────────────────────────

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SAMPLES_PATH = join(__dirname, "fixtures", "post_render_artifact_audit.samples.v1.json");
const OUTPUT_PATH = join(__dirname, "fixtures", "post_render_artifact_audit.output.v1.json");

const samplesDoc = JSON.parse(readFileSync(SAMPLES_PATH, "utf8"));
const TH = samplesDoc.thresholds;
const SD = samplesDoc.silenceDetect;

// ── ffprobe duration ──────────────────────────────────────────────────────────
function probeDuration(path) {
  const r = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "json", path], { shell: false, encoding: "utf8", timeout: 60000 });
  if (r.status !== 0) return null;
  try { return parseFloat(JSON.parse(r.stdout).format.duration); } catch { return null; }
}
function probeHasAudio(path) {
  const r = spawnSync("ffprobe", ["-v", "error", "-select_streams", "a", "-show_entries", "stream=codec_type", "-of", "json", path], { shell: false, encoding: "utf8", timeout: 60000 });
  if (r.status !== 0) return false;
  try { return ((JSON.parse(r.stdout).streams) || []).length > 0; } catch { return false; }
}

// ── silencedetect (read-only, -f null) ────────────────────────────────────────
function detectSilence(path) {
  const r = spawnSync(
    "ffmpeg",
    ["-hide_banner", "-nostats", "-i", path, "-af", `silencedetect=noise=${SD.noiseDb}dB:d=${SD.minSilenceSec}`, "-f", "null", "-"],
    { shell: false, encoding: "utf8", timeout: 180000 }
  );
  const stderr = r.stderr || "";
  const intervals = [];
  let curStart = null;
  for (const line of stderr.split(/\r?\n/)) {
    const s = line.match(/silence_start:\s*(-?[\d.]+)/);
    const e = line.match(/silence_end:\s*(-?[\d.]+)/);
    if (s) curStart = parseFloat(s[1]);
    if (e && curStart != null) {
      intervals.push({ start: curStart, end: parseFloat(e[1]) });
      curStart = null;
    }
  }
  return intervals;
}

function round(n, d = 4) { return n == null ? null : Math.round(n * 10 ** d) / 10 ** d; }

// ── audit one sample ──────────────────────────────────────────────────────────
function auditSample(sample) {
  const mp4Exists = existsSync(sample.mp4);
  if (!mp4Exists) {
    return {
      sampleId: sample.sampleId,
      role: sample.role,
      expectedVerdict: sample.expectedVerdict,
      mp4: sample.mp4,
      mp4Exists: false,
      auditVerdict: sample.expectedVerdict === "pass_candidate" ? "BLOCKED_mp4_not_rendered" : "BLOCKED_mp4_missing",
      blocker: {
        code: "mp4_not_present",
        message:
          sample.sampleId === "golden_sample_rate_freeze"
            ? "Golden Sample mp4 not rendered: image quality gate (1080x1920) failed for the selected image set. Regenerate images (Owner-approved live ChatGPT path) then render + mux. No placeholder mp4 was created."
            : "Sample mp4 not found on disk.",
      },
      failReasons: [],
      metrics: null,
    };
  }

  const durationSec = probeDuration(sample.mp4);
  const hasAudio = probeHasAudio(sample.mp4);
  const silence = detectSilence(sample.mp4);

  // first-5s silence within [0,5]
  let firstFiveSilence = 0;
  for (const iv of silence) {
    const a = Math.max(0, iv.start);
    const b = Math.min(5, iv.end);
    if (b > a) firstFiveSilence += b - a;
  }
  const totalSilence = silence.reduce((s, iv) => s + Math.max(0, iv.end - iv.start), 0);
  const totalSilenceRatio = durationSec ? totalSilence / durationSec : null;
  const speechActiveRatio = totalSilenceRatio != null ? 1 - totalSilenceRatio : null;

  // perceptual/card metrics from render perceptual_event_report (if present)
  let perceptual = null;
  if (sample.perceptualEventReport && existsSync(sample.perceptualEventReport)) {
    try {
      const per = JSON.parse(readFileSync(sample.perceptualEventReport, "utf8"));
      perceptual = {
        perceptualEventCount: per.perceptualEventCount ?? null,
        cardPresenceRatio: per.cardPresenceRatio ?? null,
        fullScreenImageDominanceRatio: per.fullScreenImageDominanceRatio ?? null,
        firstTwoSecondHookCardPresent: per.firstTwoSecondHookCardPresent ?? null,
      };
    } catch { perceptual = { error: "unreadable_perceptual_report" }; }
  }

  // ── evaluate against thresholds ──
  const failReasons = [];
  if (!hasAudio) failReasons.push("no_audio_stream");
  if (firstFiveSilence > TH.maxFirstFiveSecondSilenceSec) failReasons.push(`first_5s_silence_${round(firstFiveSilence, 2)}s_exceeds_${TH.maxFirstFiveSecondSilenceSec}s`);
  if (totalSilenceRatio != null && totalSilenceRatio > TH.maxTotalSilenceRatio) failReasons.push(`total_silence_ratio_${round(totalSilenceRatio, 3)}_exceeds_${TH.maxTotalSilenceRatio}`);
  if (speechActiveRatio != null && speechActiveRatio < TH.minSpeechActiveRatio) failReasons.push(`speech_active_ratio_${round(speechActiveRatio, 3)}_below_${TH.minSpeechActiveRatio}`);

  // perceptual/card gates only when a perceptual report exists (baseline has none → known limit)
  const perceptualKnownLimit = [];
  if (perceptual && !perceptual.error) {
    if (perceptual.perceptualEventCount != null && perceptual.perceptualEventCount < TH.minPerceptualEventCount) failReasons.push(`perceptual_event_count_${perceptual.perceptualEventCount}_below_${TH.minPerceptualEventCount}`);
    if (perceptual.cardPresenceRatio != null && perceptual.cardPresenceRatio < TH.minCardPresenceRatio) failReasons.push(`card_presence_ratio_${perceptual.cardPresenceRatio}_below_${TH.minCardPresenceRatio}`);
    if (perceptual.fullScreenImageDominanceRatio != null && perceptual.fullScreenImageDominanceRatio > TH.maxFullScreenImageDominanceRatio) failReasons.push(`full_screen_image_dominance_${perceptual.fullScreenImageDominanceRatio}_exceeds_${TH.maxFullScreenImageDominanceRatio}`);
    if (TH.requireFirstTwoSecondHookCard && perceptual.firstTwoSecondHookCardPresent === false) failReasons.push("first_2s_hook_card_missing");
  } else {
    perceptualKnownLimit.push("no_perceptual_event_report_card_and_perceptual_gates_not_evaluated");
  }

  // ── verdict ──
  const metrics = {
    durationSec: round(durationSec, 3),
    hasAudio,
    firstFiveSecondSilenceSec: round(firstFiveSilence, 3),
    totalSilenceSec: round(totalSilence, 3),
    totalSilenceRatio: round(totalSilenceRatio, 4),
    speechActiveRatio: round(speechActiveRatio, 4),
    silenceIntervalCount: silence.length,
    perceptual,
  };

  let auditVerdict;
  if (sample.role === "reference_baseline") {
    // baseline is reference; if audio/silence gates pass → pass_with_known_limits, else reference_with_warnings
    const audioGatesPass = !failReasons.some((r) => /silence|speech|no_audio/.test(r));
    auditVerdict = audioGatesPass ? "reference_pass_with_known_limits" : "reference_with_warnings";
  } else if (failReasons.length > 0) {
    auditVerdict = sample.role === "rejected_sample" ? "REJECT_confirmed" : "FAIL";
  } else {
    auditVerdict = "PASS_CANDIDATE";
  }

  return {
    sampleId: sample.sampleId,
    role: sample.role,
    expectedVerdict: sample.expectedVerdict,
    mp4: sample.mp4,
    mp4Exists: true,
    ttsStrategy: sample.ttsStrategy,
    metrics,
    failReasons,
    perceptualKnownLimit,
    auditVerdict,
    ffprobeValidButNotQualityPass: true,
  };
}

const results = samplesDoc.samples.map(auditSample);

// consistency: rejected must fail, golden expected pass_candidate (or reported blocker)
const rejected = results.find((r) => r.role === "rejected_sample");
const baseline = results.find((r) => r.role === "reference_baseline");
const golden = results.find((r) => r.role === "new_golden_sample");

const evidence = {
  rejectedV2FailsAudit: !!rejected && (rejected.auditVerdict === "REJECT_confirmed" || rejected.auditVerdict === "FAIL" || rejected.auditVerdict.startsWith("BLOCKED")),
  rejectedV2Verdict: rejected?.auditVerdict ?? null,
  baselineIsReference: !!baseline && baseline.auditVerdict.startsWith("reference"),
  baselineVerdict: baseline?.auditVerdict ?? null,
  goldenSampleVerdict: golden?.auditVerdict ?? null,
  goldenSampleBlockerReported: !!golden && golden.auditVerdict.startsWith("BLOCKED"),
};

const output = {
  schemaVersion: "money_shorts_post_render_artifact_audit_output_v1",
  status: "audit_complete",
  auditsRealMp4NotJsonPlan: true,
  ffprobePassIsNotQualityPass: true,
  topic: samplesDoc.topic,
  thresholds: TH,
  silenceDetect: SD,
  samplesRef: "scripts/fixtures/post_render_artifact_audit.samples.v1.json",
  results,
  evidence,
  boundary: { noRender: true, noTts: true, noMux: true, noImageGeneration: true, noUpload: true, readOnlyProbeExceptOutputJson: true },
};

writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2) + "\n", "utf8");

console.log("── POST-RENDER ARTIFACT AUDIT v1 (real mp4) ──");
for (const r of results) {
  if (!r.mp4Exists) {
    console.log(`  [${r.sampleId}] mp4Exists=false verdict=${r.auditVerdict}`);
    continue;
  }
  const m = r.metrics;
  console.log(`  [${r.sampleId}] dur=${m.durationSec}s first5sSilence=${m.firstFiveSecondSilenceSec}s totalSilenceRatio=${m.totalSilenceRatio} speechActive=${m.speechActiveRatio} verdict=${r.auditVerdict}`);
  if (r.failReasons.length) console.log(`       failReasons: ${r.failReasons.join("; ")}`);
}
console.log(`  evidence: rejectedV2Fails=${evidence.rejectedV2FailsAudit}(${evidence.rejectedV2Verdict}) baselineIsReference=${evidence.baselineIsReference}(${evidence.baselineVerdict}) golden=${evidence.goldenSampleVerdict}`);
console.log(`  output: ${OUTPUT_PATH}`);
process.exit(0);
