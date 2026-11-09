/**
 * Static guard: visual-only renderer script + JSON fixture integrity.
 * No network, no ffmpeg execution, no clipboard, no fs writes to repo.
 * Exit 0 = all PASS. Exit 1 = at least one FAIL.
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const RENDERER_PATH = resolve(__dirname, "render-visual-only-from-render-manifest.mjs");
const FIXTURE_PATH = resolve(__dirname, "fixtures/provider-candidate-render-manifest.visual-only.json");

const rendererSrc = readFileSync(RENDERER_PATH, "utf-8");
const fixtureSrc = readFileSync(FIXTURE_PATH, "utf-8");
const fixture = JSON.parse(fixtureSrc);

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

console.log("\nStatic guard check: visual-only renderer + JSON fixture\n");

// ── Renderer: security constraints ────────────────────────────────────────────
console.log("[ render-visual-only-from-render-manifest.mjs — security ]");
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
  ".money-shorts-local guard present (not accessed)",
  rendererSrc.includes(".money-shorts-local") &&
    rendererSrc.includes("forbidden"),
);
check(
  "out-dir repo safety guard present",
  rendererSrc.includes("outDirAbs.startsWith(REPO_ROOT"),
);
check(
  "no live API call (openai, ecos, kosis)",
  !rendererSrc.includes("openai.com") &&
    !rendererSrc.includes("ecos.bok.or.kr") &&
    !rendererSrc.includes("kosis.kr"),
);
check(
  "-an flag used (silent / no audio output)",
  rendererSrc.includes('"-an"'),
);
check(
  "ASS subtitle format used (libass Korean support)",
  rendererSrc.includes(".ass") && rendererSrc.includes("assLines"),
);
check(
  "ffprobe verify step present",
  rendererSrc.includes("ffprobe"),
);
check(
  "output summary JSON written",
  rendererSrc.includes("render-summary.json"),
);

// ── Renderer: codec / spec correctness ───────────────────────────────────────
console.log("\n[ render-visual-only-from-render-manifest.mjs — codec spec ]");
check(
  "libx264 video codec",
  rendererSrc.includes('"libx264"') || rendererSrc.includes("'libx264'"),
);
check(
  "yuv420p pixel format",
  rendererSrc.includes("yuv420p"),
);
check(
  "1080x1920 in validation checks",
  rendererSrc.includes("1080") && rendererSrc.includes("1920"),
);
check(
  "targetDurationSec computed from ffmpegPlan.estimatedDurationSec or imageInputs",
  rendererSrc.includes("estimatedDurationSec") && rendererSrc.includes("imageInputsTotal"),
);
check(
  "-t duration trim present in ffmpeg args",
  rendererSrc.includes('"-t"') && rendererSrc.includes("String(targetDurationSec)"),
);
check(
  "duration validation uses targetDurationSec ± 0.5s",
  rendererSrc.includes("durationLo") && rendererSrc.includes("durationHi") &&
    rendererSrc.includes("targetDurationSec - 0.5") && rendererSrc.includes("targetDurationSec + 0.5"),
);
check(
  "ffprobe failure causes exit 1 (not just warning)",
  rendererSrc.includes("ffprobe FAILED") && rendererSrc.includes("process.exit(1)"),
);

// ── JSON fixture: schema fields ───────────────────────────────────────────────
console.log("\n[ provider-candidate-render-manifest.visual-only.json — schema ]");
check(
  "schemaVersion is exactly money_shorts_render_plan_v1",
  fixture.schemaVersion === "money_shorts_render_plan_v1",
);
check(
  "manifestId is rp-provider-candidate-ecos-base-rate",
  fixture.manifestId === "rp-provider-candidate-ecos-base-rate",
);
check(
  "sourceType is script_package",
  fixture.sourceType === "script_package",
);
check(
  "factCardIds contains ecos-base-rate candidate",
  Array.isArray(fixture.factCardIds) &&
    fixture.factCardIds.some((id) => id.includes("ecos-base-rate-candidate")),
);
check(
  "sourceCitationIds contains ecos-base-rate candidate",
  Array.isArray(fixture.sourceCitationIds) &&
    fixture.sourceCitationIds.some((id) => id.includes("ecos-base-rate-candidate")),
);
check(
  "outputSpec dimensions 1080x1920",
  fixture.outputSpec?.dimensions?.widthPx === 1080 &&
    fixture.outputSpec?.dimensions?.heightPx === 1920,
);
check(
  "outputSpec fps 30",
  fixture.outputSpec?.fps === 30,
);
check(
  "outputSpec codec h264",
  fixture.outputSpec?.codec === "h264",
);
check(
  "outputSpec container mp4",
  fixture.outputSpec?.container === "mp4",
);
check(
  "imageInputs has exactly 6 scenes",
  Array.isArray(fixture.imageInputs) && fixture.imageInputs.length === 6,
);
check(
  "imageInputs total duration is 30s (4+5+6+6+4+5)",
  fixture.imageInputs.reduce((s, i) => s + i.durationSec, 0) === 30,
);
check(
  "captionOverlays has exactly 6 entries",
  Array.isArray(fixture.captionOverlays) && fixture.captionOverlays.length === 6,
);

// ── JSON fixture: caption content ─────────────────────────────────────────────
console.log("\n[ provider-candidate-render-manifest.visual-only.json — captions ]");
const caps = fixture.captionOverlays;
check(
  "scene 1 caption: 금리 동결 hook",
  caps[0]?.captionText === "금리 동결, 진짜 좋은 소식일까?",
);
check(
  "scene 1 timing: 0→4s",
  caps[0]?.showAtSec === 0 && caps[0]?.hideAtSec === 4,
);
check(
  "scene 2 caption: 기준금리 하락 신호",
  caps[1]?.captionText === "기준금리 하락 신호입니다",
);
check(
  "scene 2 timing: 4→9s",
  caps[1]?.showAtSec === 4 && caps[1]?.hideAtSec === 9,
);
check(
  "scene 3 caption: 물가와 경기",
  caps[2]?.captionText === "방향보다 물가와 경기를 봐야 합니다",
);
check(
  "scene 3 timing: 9→15s",
  caps[2]?.showAtSec === 9 && caps[2]?.hideAtSec === 15,
);
check(
  "scene 4 caption: 대출자와 예금자",
  caps[3]?.captionText === "대출자와 예금자는 다르게 봐야 합니다",
);
check(
  "scene 4 timing: 15→21s",
  caps[3]?.showAtSec === 15 && caps[3]?.hideAtSec === 21,
);
check(
  "scene 5 caption: 물가와 대출금리",
  caps[4]?.captionText === "다음은 물가와 대출금리를 보세요",
);
check(
  "scene 5 timing: 21→25s",
  caps[4]?.showAtSec === 21 && caps[4]?.hideAtSec === 25,
);
check(
  "scene 6 caption: 현금흐름 점검",
  caps[5]?.captionText === "이번 달은 현금흐름부터 점검하세요",
);
check(
  "scene 6 timing: 25→30s",
  caps[5]?.showAtSec === 25 && caps[5]?.hideAtSec === 30,
);
check(
  "all captions have captionStyle bold_short_center_lower",
  caps.every((c) => c.captionStyle === "bold_short_center_lower"),
);

// ── JSON fixture: imageInputs ─────────────────────────────────────────────────
console.log("\n[ provider-candidate-render-manifest.visual-only.json — imageInputs ]");
const imgs = fixture.imageInputs;
check(
  "all imageInputs have assetSourceType placeholder",
  imgs.every((i) => i.assetSourceType === "placeholder"),
);
check(
  "scene durations are [4,5,6,6,4,5]",
  imgs[0]?.durationSec === 4 &&
    imgs[1]?.durationSec === 5 &&
    imgs[2]?.durationSec === 6 &&
    imgs[3]?.durationSec === 6 &&
    imgs[4]?.durationSec === 4 &&
    imgs[5]?.durationSec === 5,
);
check(
  "all imageInputs have sceneId starting with scene-money-shorts-scene-package",
  imgs.every((i) => typeof i.sceneId === "string" && i.sceneId.startsWith("scene-money-shorts-scene-package")),
);
check(
  "imageInputs sceneIndex runs 1→6",
  imgs.every((img, idx) => img.sceneIndex === idx + 1),
);

// ── JSON fixture: sourceId alignment ────────────────────────────────────────
console.log("\n[ provider-candidate-render-manifest.visual-only.json — sourceId alignment ]");
const sid = fixture.sourceId;
check(
  "sourceId contains money-shorts-scene-package",
  sid.startsWith("money-shorts-scene-package-"),
);
check(
  "sourceId contains ecos-base-rate-candidate",
  sid.includes("ecos-base-rate-candidate"),
);
check(
  "timelineId derived from sourceId",
  fixture.timelineId === `timeline-${sid}`,
);
check(
  "ttsPackageId derived from sourceId",
  fixture.ttsPackageId === `tts-${sid}`,
);
check(
  "audioInput.ttsPackageId matches ttsPackageId",
  fixture.audioInput?.ttsPackageId === fixture.ttsPackageId,
);
check(
  "audioInput provider is openai_tts",
  fixture.audioInput?.provider === "openai_tts",
);
check(
  "sourceOverlays has 1 entry",
  Array.isArray(fixture.sourceOverlays) && fixture.sourceOverlays.length === 1,
);
check(
  "riskLevel is unchecked",
  fixture.riskLevel === "unchecked",
);

// ── Renderer: summary JSON fields ────────────────────────────────────────────
console.log("\n[ render-visual-only-from-render-manifest.mjs — summary JSON fields ]");
check(
  "summary includes fileSizeBytes",
  rendererSrc.includes("fileSizeBytes"),
);
check(
  "summary includes ffmpegExitCode",
  rendererSrc.includes("ffmpegExitCode"),
);
check(
  "summary includes durationSec (actual)",
  rendererSrc.includes("durationSec: actualDurationSec"),
);
check(
  "summary includes targetDurationSec",
  rendererSrc.includes("targetDurationSec,"),
);
check(
  "summary includes widthPx and heightPx",
  rendererSrc.includes("widthPx,") && rendererSrc.includes("heightPx,"),
);
check(
  "summary includes audioStreamCount",
  rendererSrc.includes("audioStreamCount"),
);
check(
  "summary includes subtitleMode: ass",
  rendererSrc.includes('"ass"') && rendererSrc.includes("subtitleMode"),
);
check(
  "summary includes subtitleRiskNotes",
  rendererSrc.includes("subtitleRiskNotes"),
);
check(
  "subtitleRiskNotes includes Korean font/glyph risk note",
  rendererSrc.includes("Korean") && rendererSrc.includes("Visual glyph inspection"),
);
check(
  "captionOverlayCount in summary",
  rendererSrc.includes("captionOverlayCount"),
);

console.log(`\n${passed + failed} checks — ${passed} PASS, ${failed} FAIL\n`);

if (failed > 0) {
  process.exit(1);
}
