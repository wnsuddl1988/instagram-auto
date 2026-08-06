import type {
  RepresentativeSamplePackage,
  RepresentativeSampleValidationIssue,
  RepresentativeSampleValidationSummary,
} from "./contracts";
import { validateRepresentativeSamplePackage } from "./representative-sample";

export function validateRepresentativeSampleReadiness(
  samplePackage: RepresentativeSamplePackage,
): readonly RepresentativeSampleValidationIssue[] {
  const issues: RepresentativeSampleValidationIssue[] = [...validateRepresentativeSamplePackage(samplePackage)];
  const add = (
    code: string,
    sceneId: string | null,
    fieldPath: string,
    message: string,
    blocking = true,
  ): void => {
    issues.push({ code, sceneId, fieldPath, message, blocking });
  };

  for (const [fieldPath, value] of Object.entries(samplePackage.provenance)) {
    if (Array.isArray(value)) {
      if (value.length === 0) add("representative_upstream_provenance_missing", null, `provenance.${fieldPath}`, "Upstream platform provenance가 없습니다.");
    } else if (typeof value === "string" && !value.trim()) {
      add("representative_upstream_provenance_missing", null, `provenance.${fieldPath}`, "Upstream approval provenance가 없습니다.");
    }
  }
  const renderIdentityParts = samplePackage.provenance.renderIntegrationIdentity.split(":");
  const renderIdentityTail = renderIdentityParts[renderIdentityParts.length - 1] ?? "";
  if (samplePackage.provenance.renderManifestHash !== renderIdentityTail
    && !samplePackage.provenance.renderIntegrationIdentity.includes(samplePackage.provenance.renderManifestHash)) {
    add("representative_provenance_identity_unlinked", null, "provenance.renderIntegrationIdentity", "Render identity가 manifest hash와 연결되지 않았습니다.", false);
  }
  if (!samplePackage.sourceDisclosurePresent) add("representative_source_disclosure_missing", null, "sourceDisclosurePresent", "Publish source disclosure가 없습니다.");
  if (!samplePackage.publishMetadataPresent) add("representative_publish_metadata_missing", null, "publishMetadataPresent", "Publish metadata가 없습니다.");

  for (const scene of samplePackage.storyboard.scenes) {
    const path = `storyboard.scenes.${scene.sceneOrder - 1}`;
    if (scene.primaryVisualStrategy === "character_motion") {
      add("representative_character_primary_only", scene.sceneId, `${path}.primaryVisualStrategy`, "Character는 evidence-first primary visual을 대체할 수 없습니다.");
    }
    if (scene.subtitleCueSummary === "missing subtitle plan") {
      add("representative_subtitle_plan_missing", scene.sceneId, `${path}.subtitleCueSummary`, "Subtitle plan이 없습니다.");
    }
    if (scene.actualAssetAvailable !== false || scene.productionReady !== false) {
      add("representative_actual_asset_or_production_false_claim", scene.sceneId, path, "Synthetic scene을 actual asset 또는 production-ready로 표시할 수 없습니다.");
    }
  }

  if (samplePackage.status !== "synthetic_local_proof_ready") add("representative_synthetic_status_mismatch", null, "status", "Synthetic local proof readiness 상태가 올바르지 않습니다.");
  if (samplePackage.productionStatus !== "user_content_production_blocked") add("representative_user_content_false_claim", null, "productionStatus", "User-content production은 차단 상태여야 합니다.");
  if (samplePackage.launchStatus !== "public_launch_blocked" || samplePackage.publicLaunchReady !== false) add("representative_public_ready_false_claim", null, "launchStatus", "Public launch는 차단 상태여야 합니다.");

  add("representative_actual_tts_missing", null, "renderProfile.actualTts", "실제 TTS가 없습니다.", false);
  add("representative_actual_assets_missing", null, "renderProfile.actualVisualAssets", "실제 visual asset이 없습니다.", false);
  add("representative_subtitle_timing_estimated", null, "storyboard", "Subtitle timing은 실제 audio alignment가 아닌 추정입니다.", false);
  add("representative_account_observation_manual", null, "provenance.publishIntegrationIdentity", "계정 identity는 manual observation 기반입니다.", false);
  add("representative_durable_persistence_missing", null, "package", "Durable persistence가 없습니다.", false);
  add("representative_platform_limits_unverified", null, "package", "실제 최신 플랫폼 제한을 검증하지 않았습니다.", false);
  add("representative_final_render_missing", null, "renderProfile", "실제 user-content final render가 없습니다.", false);
  add("representative_runtime_ui_unverified", null, "runtime", "Runtime browser UI는 검증되지 않았습니다.", false);
  return issues;
}

export function summarizeRepresentativeSampleReadiness(
  issues: readonly RepresentativeSampleValidationIssue[],
): RepresentativeSampleValidationSummary {
  const cloned = issues.map((issue) => ({ ...issue }));
  const blockingIssueCount = cloned.filter((issue) => issue.blocking).length;
  return {
    valid: blockingIssueCount === 0,
    blockingIssueCount,
    warningCount: cloned.length - blockingIssueCount,
    verificationLevel: "REPRESENTATIVE_SAMPLE_PRECHECK_ONLY",
    approvable: blockingIssueCount === 0,
    publicLaunchReady: false,
    issues: cloned,
  };
}

export function canApproveRepresentativeSample(
  summary: RepresentativeSampleValidationSummary,
): boolean {
  return summary.blockingIssueCount === 0
    && summary.valid
    && summary.approvable
    && summary.publicLaunchReady === false
    && summary.verificationLevel === "REPRESENTATIVE_SAMPLE_PRECHECK_ONLY";
}
