#!/usr/bin/env node
// ──────────────────────────────────────────────────────────────────────────
// check-premium-editorial-platform-render-profiles-static.mjs
//
// PLATFORM RENDER PROFILES — STRUCTURE/SAFETY GUARD (data-only, no execution)
//
// 검증 대상: scripts/fixtures/premium-editorial-platform-render-profiles.v1.json
//   - schema/profile version
//   - instagram_reels / youtube_shorts profile 분리
//   - shared base spec 1080x1920/30fps
//   - youtube_shorts safe-frame(top/bottom padding, caption/visual zone) 수치·정합
//   - instagram은 강제 matte/safe padding 없음
//   - renderer/acceptance/automation contract
//   - fixture에 credential/upload/API 지시 없음
//   - checker/fixture가 금지 파일 참조 안 함
//
// 이 guard는 렌더/업로드/외부 호출을 절대 하지 않는다. 순수 정적 검사.
// ──────────────────────────────────────────────────────────────────────────

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE_PATH = join(__dirname, "fixtures", "premium-editorial-platform-render-profiles.v1.json");
const SELF_PATH = join(__dirname, "check-premium-editorial-platform-render-profiles-static.mjs");

const results = [];
function check(name, condition, detail = "") {
  results.push({ name, pass: !!condition, detail });
}
function isNum(v) { return typeof v === "number" && Number.isFinite(v); }
function inRange(v, lo, hi) { return isNum(v) && v >= lo && v <= hi; }

let fixtureRaw, fixture, selfText;
try {
  fixtureRaw = readFileSync(FIXTURE_PATH, "utf8");
  fixture = JSON.parse(fixtureRaw);
  selfText = readFileSync(SELF_PATH, "utf8");
} catch (e) {
  console.error(`FATAL: cannot read/parse inputs: ${e.message}`);
  process.exit(2);
}

const base = fixture.sharedBaseSpec ?? {};
const profiles = fixture.platformProfiles ?? {};
const ig = profiles.instagram_reels ?? {};
const yt = profiles.youtube_shorts ?? {};

// ── § A. schema / version / platforms ────────────────────────────────────────
check("A-01: schemaVersion === money_shorts_platform_render_profiles_v1", fixture.schemaVersion === "money_shorts_platform_render_profiles_v1");
check("A-02: profileVersion is non-empty string", typeof fixture.profileVersion === "string" && fixture.profileVersion.length > 0);
check("A-03: profileVersion is semver-like", /^\d+\.\d+\.\d+$/.test(fixture.profileVersion ?? ""));
check("A-04: status is data_only contract", typeof fixture.status === "string" && fixture.status.includes("data_only"));
check("A-05: title is non-empty string", typeof fixture.title === "string" && fixture.title.length > 0);
check("A-06: purpose is non-empty string", typeof fixture.purpose === "string" && fixture.purpose.length > 0);
check("A-07: platforms array present", Array.isArray(fixture.platforms));
check("A-08: platforms includes instagram_reels", (fixture.platforms ?? []).includes("instagram_reels"));
check("A-09: platforms includes youtube_shorts", (fixture.platforms ?? []).includes("youtube_shorts"));
check("A-10: platforms has exactly 2 entries", (fixture.platforms ?? []).length === 2);

// ── § B. shared base spec ────────────────────────────────────────────────────
check("B-01: sharedBaseSpec present", typeof base === "object" && base !== null);
check("B-02: base widthPx === 1080", base.widthPx === 1080);
check("B-03: base heightPx === 1920", base.heightPx === 1920);
check("B-04: base aspectRatio 9:16", base.aspectRatio === "9:16");
check("B-05: base fps === 30", base.fps === 30);
check("B-06: base codec h264", base.codec === "h264");
check("B-07: base container mp4", base.container === "mp4");
check("B-08: base audioCodec aac", base.audioCodec === "aac");
check("B-09: durationSec object present", typeof base.durationSec === "object" && base.durationSec !== null);
check("B-10: durationSec.expected === 30", base.durationSec?.expected === 30);
check("B-11: durationSec.minSec <= 30 <= maxSec", isNum(base.durationSec?.minSec) && isNum(base.durationSec?.maxSec) && base.durationSec.minSec <= 30 && base.durationSec.maxSec >= 30);
check("B-12: canvasPolicy keeps 1080x1920 (no resize)", typeof base.canvasPolicy === "string" && /1080x1920/.test(base.canvasPolicy) && /NOT.*resize|not.*resize/i.test(base.canvasPolicy));
check("B-13: sharedBaseSpec has rationale", typeof base.rationale === "string" && base.rationale.length > 0);

// ── § C. instagram_reels profile (full, no forced matte) ─────────────────────
check("C-01: instagram_reels profile present", typeof ig === "object" && ig !== null && Object.keys(ig).length > 0);
check("C-02: ig profileId present", typeof ig.profileId === "string" && ig.profileId.length > 0);
check("C-03: ig fillPolicy full_frame", ig.fillPolicy === "full_frame");
check("C-04: ig forcedTopMatte === false", ig.forcedTopMatte === false);
check("C-05: ig forcedBottomMatte === false", ig.forcedBottomMatte === false);
check("C-06: ig topSafePaddingPx === 0 (no forced padding)", ig.topSafePaddingPx === 0);
check("C-07: ig bottomSafePaddingPx === 0 (no forced padding)", ig.bottomSafePaddingPx === 0);
check("C-08: ig captionBehavior present", typeof ig.captionBehavior === "object" && ig.captionBehavior !== null);
check("C-09: ig caption alignment bottom_center", ig.captionBehavior?.alignment === "bottom_center");
check("C-10: ig captionMarginV is a number", isNum(ig.captionBehavior?.captionMarginV));
check("C-11: ig keepCurrentCaptionSafeBehavior === true", ig.keepCurrentCaptionSafeBehavior === true);
check("C-12: ig has rationale", typeof ig.rationale === "string" && ig.rationale.length > 0);
check("C-13: ig platformUiRiskNotes is non-empty array", Array.isArray(ig.platformUiRiskNotes) && ig.platformUiRiskNotes.length > 0);
check("C-14: ig does NOT force a safe padding band (both padding 0)", ig.topSafePaddingPx === 0 && ig.bottomSafePaddingPx === 0);

// ── § D. youtube_shorts profile (safe-frame) ─────────────────────────────────
check("D-01: youtube_shorts profile present", typeof yt === "object" && yt !== null && Object.keys(yt).length > 0);
check("D-02: yt profileId present", typeof yt.profileId === "string" && yt.profileId.length > 0);
check("D-03: yt topSafePaddingPx is a number", isNum(yt.topSafePaddingPx));
check("D-04: yt bottomSafePaddingPx is a number", isNum(yt.bottomSafePaddingPx));
check("D-05: yt topSafePaddingPx in [120,180]", inRange(yt.topSafePaddingPx, 120, 180));
check("D-06: yt bottomSafePaddingPx in [240,360]", inRange(yt.bottomSafePaddingPx, 240, 360));
check("D-07: yt bottomSafePaddingPx >= topSafePaddingPx", isNum(yt.bottomSafePaddingPx) && isNum(yt.topSafePaddingPx) && yt.bottomSafePaddingPx >= yt.topSafePaddingPx);
check("D-08: yt unsafeBands present", typeof yt.unsafeBands === "object" && yt.unsafeBands !== null);
check("D-09: yt topUnsafeBand starts at 0", yt.unsafeBands?.topUnsafeBand?.fromYPx === 0);
check("D-10: yt topUnsafeBand.toYPx === topSafePaddingPx", yt.unsafeBands?.topUnsafeBand?.toYPx === yt.topSafePaddingPx);
check("D-11: yt bottomUnsafeBand.toYPx === 1920", yt.unsafeBands?.bottomUnsafeBand?.toYPx === 1920);
check("D-12: yt bottomUnsafeBand.fromYPx === 1920 - bottomSafePaddingPx", yt.unsafeBands?.bottomUnsafeBand?.fromYPx === (1920 - yt.bottomSafePaddingPx));
check("D-13: yt captionSafeZone present", typeof yt.captionSafeZone === "object" && yt.captionSafeZone !== null);
check("D-14: yt captionSafeZone.minYPx === topSafePaddingPx", yt.captionSafeZone?.minYPx === yt.topSafePaddingPx);
check("D-15: yt captionSafeZone.maxYPx <= bottom unsafe band start (caption above bottom unsafe)", isNum(yt.captionSafeZone?.maxYPx) && yt.captionSafeZone.maxYPx <= yt.unsafeBands?.bottomUnsafeBand?.fromYPx);
check("D-16: yt recommendedCaptionBaselineMaxYPx <= maxYPx", isNum(yt.captionSafeZone?.recommendedCaptionBaselineMaxYPx) && yt.captionSafeZone.recommendedCaptionBaselineMaxYPx <= yt.captionSafeZone?.maxYPx);
check("D-17: yt recommendedCaptionMarginV is a number", isNum(yt.recommendedCaptionMarginV));
check("D-18: yt recommendedCaptionMarginV >= bottomSafePaddingPx (caption above bottom UI)", isNum(yt.recommendedCaptionMarginV) && yt.recommendedCaptionMarginV >= yt.bottomSafePaddingPx);
check("D-19: yt recommendedCaptionMarginV > instagram captionMarginV (platforms differ)", isNum(yt.recommendedCaptionMarginV) && isNum(ig.captionBehavior?.captionMarginV) && yt.recommendedCaptionMarginV > ig.captionBehavior.captionMarginV);
check("D-20: yt marginVPolicy present", typeof yt.marginVPolicy === "string" && yt.marginVPolicy.length > 0);

// visualCriticalZone
check("D-21: yt visualCriticalZone present", typeof yt.visualCriticalZone === "object" && yt.visualCriticalZone !== null);
check("D-22: yt visualCriticalZone.minYPx >= topSafePaddingPx (not in top unsafe)", isNum(yt.visualCriticalZone?.minYPx) && yt.visualCriticalZone.minYPx >= yt.topSafePaddingPx);
check("D-23: yt visualCriticalZone.maxYPx <= bottom unsafe start (not in bottom unsafe)", isNum(yt.visualCriticalZone?.maxYPx) && yt.visualCriticalZone.maxYPx <= yt.unsafeBands?.bottomUnsafeBand?.fromYPx);
check("D-24: yt visualCriticalZone does not overlap top unsafe band", isNum(yt.visualCriticalZone?.minYPx) && yt.visualCriticalZone.minYPx >= yt.unsafeBands?.topUnsafeBand?.toYPx);
check("D-25: yt visualCriticalZone does not overlap bottom unsafe band", isNum(yt.visualCriticalZone?.maxYPx) && yt.visualCriticalZone.maxYPx <= yt.unsafeBands?.bottomUnsafeBand?.fromYPx);
check("D-26: yt visualCriticalZone x-range within canvas", yt.visualCriticalZone?.minXPx === 0 && yt.visualCriticalZone?.maxXPx === 1080);

// textPlacementPolicy
check("D-27: yt textPlacementPolicy present", typeof yt.textPlacementPolicy === "object" && yt.textPlacementPolicy !== null);
check("D-28: yt no important text in top unsafe band", yt.textPlacementPolicy?.noImportantTextInTopUnsafeBand === true);
check("D-29: yt no important text in bottom unsafe band", yt.textPlacementPolicy?.noImportantTextInBottomUnsafeBand === true);

// source/date/value overlay policy
check("D-30: yt sourceDateValueOverlayPolicy present", typeof yt.sourceDateValueOverlayPolicy === "object" && yt.sourceDateValueOverlayPolicy !== null);
check("D-31: yt no exact source/date/value baked into image body", yt.sourceDateValueOverlayPolicy?.noExactSourceDateValueBakedIntoImageBody === true);
check("D-32: yt deterministic overlay only", yt.sourceDateValueOverlayPolicy?.deterministicOverlayOnly === true);
check("D-33: yt sourceDateValueOverlayPolicy has rationale", typeof yt.sourceDateValueOverlayPolicy?.rationale === "string" && yt.sourceDateValueOverlayPolicy.rationale.length > 0);

// platform UI risk notes + rationale
check("D-34: yt platformUiRiskNotes is non-empty array", Array.isArray(yt.platformUiRiskNotes) && yt.platformUiRiskNotes.length > 0);
check("D-35: yt platformUiRiskNotes mentions bottom UI (title/action)", (yt.platformUiRiskNotes ?? []).some((n) => /제목|title|액션|action|버튼|button/i.test(n)));
check("D-36: yt has rationale", typeof yt.rationale === "string" && yt.rationale.length > 0);
check("D-37: yt fillPolicy allows full-frame background", typeof yt.fillPolicy === "string" && /full_frame/.test(yt.fillPolicy));

// ── § E. rendererContract ────────────────────────────────────────────────────
const rc = fixture.rendererContract ?? {};
check("E-01: rendererContract present", typeof rc === "object" && rc !== null && Object.keys(rc).length > 0);
check("E-02: renderer must consume platform profile", rc.rendererMustConsumePlatformProfile === true);
check("E-03: renderer must NOT hardcode one profile for both", rc.rendererMustNotHardcodeOneProfileForBothPlatforms === true);
check("E-04: YouTube export must use youtube_shorts profile", rc.youtubeExportMustUseYoutubeShortsProfile === true);
check("E-05: Instagram export may use instagram_reels profile", rc.instagramExportMayUseInstagramReelsProfile === true);
check("E-06: rendererContract references captionMarginV source", typeof rc.captionMarginVSource === "string" && rc.captionMarginVSource.length > 0);

// ── § F. acceptanceGuardContract ─────────────────────────────────────────────
const ac = fixture.acceptanceGuardContract ?? {};
check("F-01: acceptanceGuardContract present", typeof ac === "object" && ac !== null && Object.keys(ac).length > 0);
check("F-02: final acceptance must know target platform", ac.finalAcceptanceMustKnowTargetPlatform === true);
check("F-03: YouTube acceptance must verify safe-frame metadata", ac.youtubeAcceptanceMustVerifySafeFrameMetadata === true);
check("F-04: YouTube acceptance must verify caption zone metadata", ac.youtubeAcceptanceMustVerifyCaptionZoneMetadata === true);

// ── § G. automationContract ──────────────────────────────────────────────────
const au = fixture.automationContract ?? {};
check("G-01: automationContract present", typeof au === "object" && au !== null && Object.keys(au).length > 0);
check("G-02: future orchestrator must select platform profile before render/upload", au.futureOrchestratorMustSelectPlatformRenderProfileBeforeRenderAndUpload === true);
check("G-03: automationContract has profile selection key", typeof au.profileSelectionKey === "string" && au.profileSelectionKey.length > 0);

// ── § H. boundary (data-only, no upload/render) ──────────────────────────────
const bd = fixture.boundary ?? {};
check("H-01: boundary present", typeof bd === "object" && bd !== null && Object.keys(bd).length > 0);
check("H-02: noUploadExecuted === true", bd.noUploadExecuted === true);
check("H-03: noYoutubeInstagramApiCall === true", bd.noYoutubeInstagramApiCall === true);
check("H-04: noRenderMuxFfmpegExecuted === true", bd.noRenderMuxFfmpegExecuted === true);
check("H-05: noExistingPostModified === true", bd.noExistingPostModified === true);
check("H-06: dataOnly === true", bd.dataOnly === true);

// ── § I. no credential / upload trigger in fixture ───────────────────────────
check("I-01: fixture has no access_token/accessToken", !/access_?token/i.test(fixtureRaw));
check("I-02: fixture has no refresh_token", !/refresh_?token/i.test(fixtureRaw));
check("I-03: fixture has no client_secret/api_key", !/client_?secret|api_?key/i.test(fixtureRaw));
check("I-04: fixture has no EAA/IGA token-looking string", !/\b(EAA|IGA)[A-Za-z0-9]{20,}/.test(fixtureRaw));
check("I-05: fixture has no graph.facebook.com upload endpoint", !/graph\.facebook\.com/i.test(fixtureRaw));
check("I-06: fixture has no youtube upload API call directive", !/videos\.insert|youtube\.upload/i.test(fixtureRaw));
check("I-07: fixture does NOT instruct actual upload execution", !/"uploadExecuted"\s*:\s*true/.test(fixtureRaw));
check("I-08: fixture has no http(s) upload/public video URL", !/https?:\/\//i.test(fixtureRaw));

// ── § J. forbidden-file references (fixture + checker) ────────────────────────
// 금지 토큰을 리터럴로 담으면 checker가 self-read(selfText) 시 스스로에 매치되어 오탐이 난다.
// 따라서 모든 금지 토큰은 문자열 결합으로 구성해 checker 소스에 연속 리터럴이 없게 한다.
const CTX_TRANSFER_TOKEN = "CONTEXT" + "_TRANSFER_" + "CODEX";
const PIQ_TOKEN = "piq" + "_diag_" + "out";
const SPAWN_RE = new RegExp("spawn" + "Sync?\\(|" + "exec" + "(Sync)?\\(");
check("J-01: fixture does not reference the codex transfer doc", !fixtureRaw.includes(CTX_TRANSFER_TOKEN));
check("J-02: fixture does not reference the diag output file", !fixtureRaw.includes(PIQ_TOKEN));
check("J-03: checker does not reference the codex transfer doc", !selfText.includes(CTX_TRANSFER_TOKEN));
check("J-04: checker does not reference the diag output file", !selfText.includes(PIQ_TOKEN));
check("J-05: checker does NOT import googleapis/openai/playwright/elevenlabs", !/(import|require)[^\n]*['"`](googleapis|openai|playwright|elevenlabs)['"`]/i.test(selfText));
check("J-06: checker does not spawn/exec child processes (pure static)", !SPAWN_RE.test(selfText));

// ── result ────────────────────────────────────────────────────────────────────
const pass = results.filter((r) => r.pass);
const fail = results.filter((r) => !r.pass);
console.log(`\n══════════════════════════════════════════════════════════`);
console.log(`  PLATFORM RENDER PROFILES — STRUCTURE/SAFETY GUARD`);
console.log(`══════════════════════════════════════════════════════════`);
for (const r of results) {
  console.log(`  ${r.pass ? "PASS" : "FAIL"}  ${r.name}${r.detail ? `  [${r.detail}]` : ""}`);
}
console.log(`\n──────────────────────────────────────────────────────────`);
console.log(`  TOTAL : ${results.length}  |  PASS : ${pass.length}  |  FAIL : ${fail.length}`);
console.log(`──────────────────────────────────────────────────────────\n`);
if (fail.length > 0) {
  console.error(`GUARD FAILED (${fail.length} failures):`);
  for (const r of fail) console.error(`  FAIL  ${r.name}${r.detail ? `  [${r.detail}]` : ""}`);
  process.exit(1);
} else {
  console.log(`GUARD OK: platform render profiles structure/safety intact (${pass.length}/${results.length}).`);
  process.exit(0);
}
