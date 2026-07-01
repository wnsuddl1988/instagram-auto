#!/usr/bin/env node
// ──────────────────────────────────────────────────────────────────────────
// check-money-shorts-golden-sample-recovery-static.mjs
//
// MONEY SHORTS OS — GOLDEN SAMPLE RECOVERY STATIC GUARD v1 (no-live)
//
// creative-v2-rate-freeze-golden-sample-recovery-v1 slice의 모든 산출물 계약을
// 정적으로 검증한다. 실제 render/tts/network 없음. JSON 구조 + 금지 규칙 + 상호 참조 정합성만.
//
// Node built-in(fs/url/path)만 사용. 어떤 파일도 쓰지 않는다(read-only guard).
// exit 0 = GUARD OK, exit 1 = GUARD FAIL.
// ──────────────────────────────────────────────────────────────────────────

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FX = join(__dirname, "fixtures");

let pass = 0;
let fail = 0;
const failures = [];
function check(label, cond) {
  if (cond) { pass++; } else { fail++; failures.push(label); }
}
function readJson(p) {
  try { return JSON.parse(readFileSync(p, "utf8")); } catch { return null; }
}

// ── 1. Stop State Lock ────────────────────────────────────────────────────────
const stop = readJson(join(FX, "creative-v2-stop-state.v1.json"));
check("stop_state exists", !!stop);
check("stop_state schema", stop?.schemaVersion === "money_shorts_creative_v2_stop_state_v1");
check("stop_state v2 rejected", stop?.samples?.rejectedCreativeV2?.verdict === "rejected");
check("stop_state baseline reference", stop?.samples?.acceptedBaseline?.verdict === "reference");
check("stop_state uploadReady false", stop?.guards?.uploadReady === false);
check("stop_state uploadQueueReadiness false", stop?.guards?.uploadQueueReadinessGenerated === false);
check("stop_state auditOnly forbidden", stop?.guards?.auditOnlySliceForbidden === true);
check("stop_state padding forbidden", stop?.guards?.silencePaddingToFakeDurationForbidden === true);
check("stop_state six-scene tts forbidden", stop?.guards?.sixSceneShortTtsDefaultForbidden === true);
check("stop_state protects context transfer", (stop?.guards?.protectedFilesNoTouch || []).includes("_ai/CONTEXT_TRANSFER_CODEX.md"));
check("stop_state protects piq_diag", (stop?.guards?.protectedFilesNoTouch || []).includes("piq_diag_out.txt"));
check("stop_state image blocker active", stop?.imageQualityBlocker?.blockerActive === true);

// ── 2. Image Generation Contract ──────────────────────────────────────────────
const igc = readJson(join(FX, "image_generation_contract.json"));
check("igc exists", !!igc);
check("igc schema", igc?.schemaVersion === "money_shorts_image_generation_contract_v1");
check("igc requires llm path", igc?.image_generation_policy?.required_provider_path === "chatgpt_or_llm_image_generation");
check("igc forbids placeholder", igc?.image_generation_policy?.allow_placeholder === false);
check("igc forbids local mock final", igc?.image_generation_policy?.allow_local_mock_for_final === false);
check("igc forbids stock fallback", igc?.image_generation_policy?.allow_stock_like_fallback === false);
check("igc requires visual director prompt", igc?.image_generation_policy?.require_visual_director_prompt === true);
check("igc requires selected image set", igc?.image_generation_policy?.require_selected_image_set === true);
check("igc on failure regenerate/skip", igc?.image_generation_policy?.on_image_generation_failure === "regenerate_image_or_skip_topic");
check("igc gate min 1080", igc?.image_quality_gate?.min_width_px === 1080);
check("igc gate min 1920", igc?.image_quality_gate?.min_height_px === 1920);
check("igc gate text-in-image forbidden", igc?.image_quality_gate?.text_inside_image_forbidden === true);
check("igc current set gate BLOCKED", igc?.current_selected_image_set_status?.gateVerdict === "BLOCKED_resolution_below_min");
check("igc current set not meets gate", igc?.current_selected_image_set_status?.meetsResolutionGate === false);

// ── 3. Visual Director Prompts ────────────────────────────────────────────────
const vdp = readJson(join(FX, "visual_director_prompts.rate_freeze.v1.json"));
check("vdp exists", !!vdp);
check("vdp schema", vdp?.schemaVersion === "money_shorts_visual_director_prompts_v1");
check("vdp 6 prompts", (vdp?.prompts || []).length === 6);
check("vdp every prompt has style anchor", vdp?.audit?.everyPromptHasStyleAnchor === true);
check("vdp every prompt forbids on-image text", vdp?.audit?.everyPromptForbidsOnImageText === true);
check("vdp every prompt vertical 9:16", vdp?.audit?.everyPromptVertical916 === true);
check("vdp no image generation executed", vdp?.generationBoundaries?.imageGenerationExecuted === false);
check("vdp negative rules include no readable text", (vdp?.globalNegativePromptRules || []).some((r) => /no readable text/i.test(r)));
check("vdp negative rules include no watermark", (vdp?.globalNegativePromptRules || []).some((r) => /watermark/i.test(r)));
check("vdp negative rules include no fake charts", (vdp?.globalNegativePromptRules || []).some((r) => /fake or unreadable charts/i.test(r)));
check("vdp negative rules include no generic smiling office", (vdp?.globalNegativePromptRules || []).some((r) => /generic smiling office/i.test(r)));
check("vdp topic rate freeze", vdp?.topic?.topicId === "base-rate-hold-202605");

// ── 4. Golden Sample Blueprint ────────────────────────────────────────────────
const bp = readJson(join(FX, "golden_sample_blueprint.rate_freeze.v1.json"));
check("blueprint exists", !!bp);
check("blueprint schema", bp?.schemaVersion === "money_shorts_golden_sample_blueprint_v1");
check("blueprint 30s", bp?.fullDurationSec === 30);
check("blueprint 7 phases", (bp?.phases || []).length === 7);
check("blueprint tts one-shot preferred", bp?.ttsStrategyPreferred === "full_narration_one_shot");
check("blueprint first phase is hook 0-2s", bp?.phases?.[0]?.phaseId === "hook" && bp?.phases?.[0]?.timeStartSec === 0.0 && bp?.phases?.[0]?.timeEndSec === 2.0);
check("blueprint hook card first 2s", bp?.phases?.[0]?.cardTemplate === "big_hook_card");
check("blueprint has image prompt mapping", (bp?.imagePromptMapping || []).length === 7);
check("blueprint has tts phrase mapping", (bp?.ttsPhraseMapping || []).length === 7);
check("blueprint perceptual event plan present", !!bp?.perceptualEventPlan);
// pass threshold must never be loosened below 12 (Codex review-fix requirement)
check("blueprint min perceptual not loosened below 12", bp?.perceptualEventPlan?.minPerceptualEventCountForPass >= 12);
// dim_blur_background is a static per-phase treatment, not a transition — must never be counted
check("blueprint countedEventTypes excludes dim_blur_background", !(bp?.perceptualEventPlan?.countedEventTypes || []).includes("dim_blur_background"));
check("blueprint notCounted documents dim_blur_background exclusion", (bp?.perceptualEventPlan?.notCountedAsPerceptualEvent || []).some((s) => /dim_blur_background/.test(s)));
// single-source integrity: plannedPerceptualEventCount must equal the actual sum of phases[].perceptualEvents
const phasesEventSum = (bp?.phases || []).reduce((sum, p) => sum + (p.perceptualEvents || []).length, 0);
check("blueprint plannedPerceptualEventCount matches sum of phases[].perceptualEvents", bp?.perceptualEventPlan?.plannedPerceptualEventCount === phasesEventSum);
check("blueprint no phase counts dim_blur_background as an event", (bp?.phases || []).every((p) => !(p.perceptualEvents || []).includes("dim_blur_background")));
check("blueprint card-image hybrid design present", !!bp?.cardImageHybridDesign);
check("blueprint hook card required first 2s", bp?.cardImageHybridDesign?.firstTwoSecondHookCardRequired === true);
check("blueprint render gate blocked", bp?.renderReadinessGate?.finalRenderAllowed === false);
check("blueprint uploadReady false", bp?.boundary?.uploadReady === false);
// blueprint phase voice matches Golden Sample Structure hook voice
check("blueprint hook voice matches handoff", bp?.phases?.[0]?.voice === "금리 동결? 아직 안심하면 안 됩니다.");
check("blueprint action voice matches handoff", bp?.phases?.[6]?.voice === "오늘은 금리보다 고정비부터 확인하세요.");

// ── 5. TTS-first Timeline Contract ────────────────────────────────────────────
const tts = readJson(join(FX, "tts_first_timeline_contract.v1.json"));
check("tts contract exists", !!tts);
check("tts schema", tts?.schemaVersion === "money_shorts_tts_first_timeline_contract_v1");
check("tts one-shot rank 1", tts?.strategyPriority?.[0]?.strategy === "full_narration_one_shot");
check("tts three-block rank 2", tts?.strategyPriority?.[1]?.strategy === "three_block");
check("tts six-scene forbidden", tts?.forbiddenStrategy?.six_scene_level_tts_as_default === true);
check("tts no padding", tts?.paddingPolicy?.do_not_pad_short_tts_with_silence === true);
check("tts apad forbidden", tts?.paddingPolicy?.apad_whole_dur_forbidden === true);
check("tts short → script problem", tts?.paddingPolicy?.on_tts_too_short === "treat_as_script_or_timeline_problem_not_padding");
check("tts measures actual audio", tts?.measurementRequirements?.measure_actual_audio_duration_before_visual_timing === true);
check("tts reflow from real timing", tts?.measurementRequirements?.reflow_scene_timeline_from_real_tts_timing === true);
check("tts padding_used false", tts?.padding_used === false);
check("tts phrase alignment 7", (tts?.phrase_alignment || []).length === 7);
check("tts rejected v2 violates", tts?.rejectedV2Evidence?.verdict === "violates_tts_first_timeline_contract");
check("tts baseline satisfies", tts?.acceptedBaselineEvidence?.verdict === "satisfies_tts_first_timeline_contract");

// ── 6. Card-Image Hybrid Render Manifest ──────────────────────────────────────
const rm = readJson(join(FX, "card_image_hybrid_render_manifest.v1.json"));
check("render manifest exists", !!rm);
check("render manifest schema", rm?.schemaVersion === "money_shorts_card_image_hybrid_render_manifest_v1");
check("render manifest mode card_image_hybrid_v1", rm?.rendererMode === "card_image_hybrid_v1");
check("render manifest gate abort below", rm?.imageQualityGate?.abortIfBelowGate === true);
check("render manifest no upscale final", rm?.imageQualityGate?.allowUpscaleForFinal === false);
check("render manifest 7 cards", (rm?.cardTimeline || []).length === 7);
check("render manifest 6 image inputs", (rm?.actualImageInputs || []).length === 6);
check("render manifest existing renderer preserved", rm?.boundary?.existingRendererPreserved === true);
check("render manifest uploadReady false", rm?.boundary?.uploadReady === false);
// required templates present
const reqTemplates = ["big_hook_card", "curiosity_contrast_card", "checklist_card_1", "checklist_card_2", "checklist_card_3", "twist_single_sentence_card", "final_action_card", "dim_blur_background", "card_slide_in", "card_punch_zoom", "checklist_pop", "safe_frame_text_layout"];
check("render manifest has all required templates", reqTemplates.every((t) => (rm?.requiredTemplates || []).includes(t)));
// existing renderer file must still exist
check("existing renderer preserved on disk", existsSync(join(__dirname, "render-money-shorts-creative-final-visual-v1.mjs")));
// new renderer exists
check("new hybrid renderer exists", existsSync(join(__dirname, "render-money-shorts-card-image-hybrid-v1.mjs")));

// hybrid renderer source must forbid upscale/placeholder for final and gate first
const hybridSrc = existsSync(join(__dirname, "render-money-shorts-card-image-hybrid-v1.mjs")) ? readFileSync(join(__dirname, "render-money-shorts-card-image-hybrid-v1.mjs"), "utf8") : "";
check("hybrid renderer has gate exit 10", /process\.exit\(10\)/.test(hybridSrc));
check("hybrid renderer refuses upscale/placeholder", /no upscale.*no placeholder|Refusing to render final/i.test(hybridSrc));
check("hybrid renderer checks resolution gate", /minWidthPx|width >= GATE\.minWidthPx/.test(hybridSrc));
// renderer must consume manifest cardTimeline[].perceptualEvents verbatim, not re-invent its own count
check("hybrid renderer consumes manifest perceptualEvents (no hardcoded 2-per-card count)", /c\.perceptualEvents/.test(hybridSrc));
check("hybrid renderer does not hardcode cardTemplate+cardMotion as the only counted events", !/perceptualEvents\.push\(\{[^}]*c\.cardTemplate[^}]*\}\);\s*\n\s*perceptualEvents\.push\(\{[^}]*c\.cardMotion/.test(hybridSrc));

// single-source integrity: manifest cardTimeline[].perceptualEvents must equal blueprint phases[].perceptualEvents 1:1 (by phaseId)
const manifestPerceptualByPhase = Object.fromEntries((rm?.cardTimeline || []).map((c) => [c.phaseId, c.perceptualEvents || []]));
const blueprintPerceptualByPhase = Object.fromEntries((bp?.phases || []).map((p) => [p.phaseId, p.perceptualEvents || []]));
const perceptualPhaseIdsMatch = Object.keys(blueprintPerceptualByPhase).every(
  (phaseId) => JSON.stringify(manifestPerceptualByPhase[phaseId]) === JSON.stringify(blueprintPerceptualByPhase[phaseId])
);
check("render manifest cardTimeline perceptualEvents match blueprint phases 1:1", perceptualPhaseIdsMatch);
check("render manifest perceptualEventPlanRef present", !!rm?.perceptualEventPlanRef);
check("render manifest perceptualEventPlanRef count matches blueprint", rm?.perceptualEventPlanRef?.plannedPerceptualEventCount === bp?.perceptualEventPlan?.plannedPerceptualEventCount);
check("render manifest perceptualEventPlanRef minForPass matches blueprint (not loosened)", rm?.perceptualEventPlanRef?.minPerceptualEventCountForPass === bp?.perceptualEventPlan?.minPerceptualEventCountForPass);
const manifestCardTimelineEventSum = (rm?.cardTimeline || []).reduce((sum, c) => sum + (c.perceptualEvents || []).length, 0);
check("render manifest cardTimeline perceptualEvents sum matches plannedPerceptualEventCount", manifestCardTimelineEventSum === rm?.perceptualEventPlanRef?.plannedPerceptualEventCount);

// ── 7. Post-Render Artifact Audit samples + output ───────────────────────────
const samples = readJson(join(FX, "post_render_artifact_audit.samples.v1.json"));
check("audit samples exists", !!samples);
check("audit samples schema", samples?.schemaVersion === "money_shorts_post_render_artifact_audit_samples_v1");
check("audit samples 3 samples", (samples?.samples || []).length === 3);
check("audit samples baseline expects reference", samples?.samples?.find((s) => s.sampleId === "accepted_baseline")?.expectedVerdict === "reference");
check("audit samples v2 expects reject", samples?.samples?.find((s) => s.sampleId === "rejected_creative_v2")?.expectedVerdict === "reject");
check("audit samples golden expects pass_candidate", samples?.samples?.find((s) => s.sampleId === "golden_sample_rate_freeze")?.expectedVerdict === "pass_candidate");
check("audit samples threshold first5s 0.8", samples?.thresholds?.maxFirstFiveSecondSilenceSec === 0.8);

const auditOut = readJson(join(FX, "post_render_artifact_audit.output.v1.json"));
check("audit output exists", !!auditOut);
check("audit output schema", auditOut?.schemaVersion === "money_shorts_post_render_artifact_audit_output_v1");
check("audit output audits real mp4", auditOut?.auditsRealMp4NotJsonPlan === true);
check("audit output ffprobe not quality pass", auditOut?.ffprobePassIsNotQualityPass === true);
check("audit output rejected v2 fails", auditOut?.evidence?.rejectedV2FailsAudit === true);
check("audit output rejected v2 verdict REJECT", auditOut?.evidence?.rejectedV2Verdict === "REJECT_confirmed");
check("audit output baseline is reference", auditOut?.evidence?.baselineIsReference === true);
check("audit output golden blocker reported", auditOut?.evidence?.goldenSampleBlockerReported === true);
// rejected v2 must have concrete fail reasons
const v2res = (auditOut?.results || []).find((r) => r.sampleId === "rejected_creative_v2");
check("audit v2 has fail reasons", (v2res?.failReasons || []).length >= 1);
check("audit v2 first-5s silence flagged", (v2res?.failReasons || []).some((r) => /first_5s_silence/.test(r)));
check("audit v2 total silence ratio flagged", (v2res?.failReasons || []).some((r) => /total_silence_ratio/.test(r)));

// audit script must not perform render/tts/upload
const auditSrc = existsSync(join(__dirname, "audit-money-shorts-post-render-artifact-v1.mjs")) ? readFileSync(join(__dirname, "audit-money-shorts-post-render-artifact-v1.mjs"), "utf8") : "";
check("audit script uses -f null read-only", /-f", "null"/.test(auditSrc) || /"-f", "null"/.test(auditSrc));
check("audit script boundary no upload", /noUpload:\s*true/.test(auditSrc));

// ── 8. cross-reference integrity ──────────────────────────────────────────────
check("blueprint refs image gen contract", bp?.sourceRefs?.imageGenerationContract === "scripts/fixtures/image_generation_contract.json");
check("blueprint refs visual director prompts", bp?.sourceRefs?.visualDirectorPrompts === "scripts/fixtures/visual_director_prompts.rate_freeze.v1.json");
check("blueprint refs tts contract", bp?.sourceRefs?.ttsFirstTimelineContract === "scripts/fixtures/tts_first_timeline_contract.v1.json");
check("render manifest refs blueprint", rm?.sourceRefs?.blueprint === "scripts/fixtures/golden_sample_blueprint.rate_freeze.v1.json");
// image gate blocker is consistent across contracts
check("consistent blocker: igc + blueprint + manifest agree resolution blocked",
  igc?.current_selected_image_set_status?.meetsResolutionGate === false &&
  bp?.renderReadinessGate?.meetsResolutionGate === false);

// ── 9. Golden Sample Recovery Report — perceptual event count single-source ──
const report = readJson(join(FX, "golden_sample_recovery_report.v1.json"));
check("recovery report exists", !!report);
check("recovery report schema", report?.schemaVersion === "money_shorts_golden_sample_recovery_report_v1");
const reportPlanned = report?.threeSampleComparison?.newGoldenSample?.plannedPerceptualEventCount;
const reportFindingPlanned = report?.findingsRequestedByHandoff?.perceptualEventCount?.goldenSamplePlanned;
check("recovery report plannedPerceptualEventCount matches blueprint (threeSampleComparison)", reportPlanned === bp?.perceptualEventPlan?.plannedPerceptualEventCount);
check("recovery report plannedPerceptualEventCount matches blueprint (findings)", reportFindingPlanned === bp?.perceptualEventPlan?.plannedPerceptualEventCount);
check("recovery report minForPass matches blueprint (not loosened)", report?.findingsRequestedByHandoff?.perceptualEventCount?.minForPass === bp?.perceptualEventPlan?.minPerceptualEventCountForPass);
// all four sources must agree on the exact same planned count (blueprint is the single source of truth)
check("perceptual event count is a true single-source across blueprint/manifest/report",
  bp?.perceptualEventPlan?.plannedPerceptualEventCount === rm?.perceptualEventPlanRef?.plannedPerceptualEventCount &&
  bp?.perceptualEventPlan?.plannedPerceptualEventCount === reportPlanned &&
  bp?.perceptualEventPlan?.plannedPerceptualEventCount === reportFindingPlanned);

// ── report ────────────────────────────────────────────────────────────────────
console.log("── GOLDEN SAMPLE RECOVERY STATIC GUARD v1 ──");
console.log(`  checks: ${pass + fail}  pass: ${pass}  fail: ${fail}`);
if (fail > 0) {
  console.error("  FAILURES:");
  for (const f of failures) console.error(`    - ${f}`);
  console.error("GUARD FAIL");
  process.exit(1);
}
console.log("GUARD OK");
process.exit(0);
