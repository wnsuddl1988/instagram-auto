import type {
  ApprovedPublishIntegrationSessionSnapshot,
  RepresentativeSamplePackage,
  RepresentativeSampleScene,
  RepresentativeSampleStoryboard,
  RepresentativeSampleValidationIssue,
  SceneCharacterMotionAssignment,
  VisualStrategyType,
} from "./contracts";
import { hashPublishPackage } from "./publish-package";

function stableSerialize(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(",")}]`;
  const record = value as Readonly<Record<string, unknown>>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableSerialize(record[key])}`).join(",")}}`;
}

// Structural session identity only; this deterministic digest is not a cryptographic proof.
function deterministicHash(value: unknown): string {
  const text = stableSerialize(value);
  let first = 0x811c9dc5;
  let second = 0x9e3779b9;
  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);
    first ^= code;
    first = Math.imul(first, 0x01000193) >>> 0;
    second ^= code + index;
    second = Math.imul(second, 0x85ebca6b) >>> 0;
  }
  const left = first.toString(16).padStart(8, "0");
  const right = second.toString(16).padStart(8, "0");
  return `${left}${right}${right}${left}`;
}

function unique(values: readonly string[]): readonly string[] {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
}

function cloneAssignment(assignment: SceneCharacterMotionAssignment | null): SceneCharacterMotionAssignment | null {
  return assignment ? {
    ...assignment,
    evidenceRefs: [...assignment.evidenceRefs],
    sourceRefs: [...assignment.sourceRefs],
    numberRefs: [...assignment.numberRefs],
  } : null;
}

function secondaryStrategies(
  primary: VisualStrategyType,
  hasNumbers: boolean,
  hasSources: boolean,
  hasCharacter: boolean,
): readonly VisualStrategyType[] {
  const values: VisualStrategyType[] = [];
  if (hasNumbers && primary !== "number_text_motion") values.push("number_text_motion");
  if (hasSources && primary !== "official_source_card") values.push("official_source_card");
  if (hasCharacter && primary !== "character_motion") values.push("character_motion");
  return values;
}

function buildScenes(snapshot: ApprovedPublishIntegrationSessionSnapshot): readonly RepresentativeSampleScene[] {
  const renderSnapshot = snapshot.sourceRenderIntegrationSnapshot;
  const scriptSnapshot = renderSnapshot.sourceDetailedScriptSnapshot;
  const selectedAngle = scriptSnapshot.selectedAngle;
  const manifest = renderSnapshot.renderManifest;
  const coverSceneIds = new Set(snapshot.publishMetadata.map((metadata) => metadata.coverPlan.selectedSceneId));

  return [...manifest.scenes]
    .sort((left, right) => left.sceneOrder - right.sceneOrder)
    .map((scene) => {
      const beat = scriptSnapshot.approvedScript.beats[scene.sceneOrder - 1];
      const sourceRefs = unique(scene.sourceRefs.length > 0 ? scene.sourceRefs : selectedAngle.sourceRefs);
      const numberRefs = unique(scene.numberRefs.length > 0 ? scene.numberRefs : selectedAngle.numberRefs);
      const claimRefs = beat?.claimRefs.length ? beat.claimRefs : selectedAngle.claimRefs;
      const evidenceRefs = unique([...(beat?.claimRefs ?? claimRefs), ...numberRefs]);
      const primaryLayer = scene.layers.find((layer) => layer.layerType === "primary_visual") ?? null;
      const subtitleScene = renderSnapshot.subtitleTrack.scenePlans.find((entry) => entry.sceneId === scene.sceneId) ?? null;
      const unresolvedAssets = unique([
        ...scene.unresolvedRequirements,
        ...scene.layers.filter((layer) => layer.required && !layer.resolved).map((layer) => `${layer.layerType}:unresolved`),
        ...(beat ? [] : ["detailed_script_beat:missing"]),
        "actual_visual_asset:not_created",
      ]);
      const rightsState = primaryLayer?.rightsReviewState ?? "not_required";
      const costState = primaryLayer?.costClass ?? "unknown_estimate";
      const safeAreaState = scene.obstructionPolicySatisfied
        && !scene.characterOverlapsSubtitleSafeZone
        && !scene.characterIntrudesPrimarySafeZone
        ? "structural_precheck_pass" as const
        : "structural_precheck_blocked" as const;

      return {
        sceneId: scene.sceneId,
        sceneOrder: scene.sceneOrder,
        narration: beat?.narration ?? scene.narration,
        keyCaption: beat?.keyCaption ?? scene.keyCaption,
        beatType: beat?.beatType ?? "evidence_and_number",
        evidenceRefs,
        sourceRefs,
        numberRefs,
        primaryVisualStrategy: scene.primaryVisualStrategy,
        secondaryVisualStrategies: secondaryStrategies(
          scene.primaryVisualStrategy,
          numberRefs.length > 0,
          sourceRefs.length > 0,
          scene.characterAssignment !== null,
        ),
        characterMotion: cloneAssignment(scene.characterAssignment),
        subtitleCueSummary: subtitleScene
          ? `${subtitleScene.cues.length} cues · ${subtitleScene.alignmentStatus}`
          : "missing subtitle plan",
        publishCoverCandidate: coverSceneIds.has(scene.sceneId),
        unresolvedAssets,
        rightsState,
        costState,
        safeAreaState,
        actualAssetAvailable: false,
        productionReady: false,
      };
    });
}

function createStoryboard(snapshot: ApprovedPublishIntegrationSessionSnapshot): RepresentativeSampleStoryboard {
  const scenes = buildScenes(snapshot);
  return {
    storyboardVersion: "representative-storyboard-v1",
    sceneCount: 8,
    scenes,
    sourceOrderPreserved: true,
    syntheticOnly: true,
    productionReady: false,
    publicLaunchReady: false,
  };
}

export function buildRepresentativeSamplePackage(
  approvedSnapshot: ApprovedPublishIntegrationSessionSnapshot,
): RepresentativeSamplePackage {
  const renderSnapshot = approvedSnapshot.sourceRenderIntegrationSnapshot;
  const scriptSnapshot = renderSnapshot.sourceDetailedScriptSnapshot;
  const evidence = scriptSnapshot.evidencePack;
  const storyboard = createStoryboard(approvedSnapshot);
  const referenceRegistry = {
    evidenceRefs: unique([...evidence.claims.map((claim) => claim.claimId), ...evidence.numbers.map((number) => number.numberId)]),
    sourceRefs: unique(evidence.sources.map((source) => source.sourceId)),
    numberRefs: unique(evidence.numbers.map((number) => number.numberId)),
  };
  const expectedSceneFingerprints = renderSnapshot.renderManifest.scenes.map((scene) => scene.fingerprint);
  const expectedPlatformIdentities = approvedSnapshot.publishPackage.platformPackages.map((entry) => `${entry.platformId}:${entry.dedupeKey.value}`);
  const observedPlatformIdentities = approvedSnapshot.platformPackages.map((entry) => `${entry.platformId}:${entry.dedupeKey.value}`);
  const provenanceChecks = {
    publishSnapshotApproved: approvedSnapshot.approvalState === "approved",
    renderSnapshotApproved: renderSnapshot.approvalState === "approved",
    renderManifestMatchesPublishPackage: renderSnapshot.renderManifest.manifestHash === approvedSnapshot.publishPackage.renderManifestHash,
    selectedCharacterDirectionMatches: approvedSnapshot.selectedCharacterDirectionId === renderSnapshot.sourceCharacterSnapshot.selectedDirectionId
      && approvedSnapshot.selectedCharacterDirectionId === renderSnapshot.renderManifest.selectedCharacterDirectionId,
    sceneFingerprintsMatch: stableSerialize(approvedSnapshot.sceneFingerprints) === stableSerialize(expectedSceneFingerprints),
    platformPackagesMatch: stableSerialize(observedPlatformIdentities) === stableSerialize(expectedPlatformIdentities),
    upstreamExecutionFlagsClear: approvedSnapshot.externalIdentityVerified === false
      && approvedSnapshot.uploadExecuted === false
      && approvedSnapshot.publicationExecuted === false
      && approvedSnapshot.schedulingExecuted === false
      && approvedSnapshot.durableLedgerAvailable === false
      && approvedSnapshot.executionReady === false
      && renderSnapshot.renderExecuted === false
      && renderSnapshot.audioCreated === false
      && renderSnapshot.productionReady === false
      && renderSnapshot.renderManifest.externalRequestsMade === false
      && renderSnapshot.renderManifest.renderExecuted === false
      && approvedSnapshot.publishPackage.executionRequested === false
      && approvedSnapshot.publishPackage.externalCallExecuted === false
      && approvedSnapshot.publishPackage.uploadExecuted === false
      && approvedSnapshot.publishPackage.publicationExecuted === false
      && approvedSnapshot.publishPackage.executionReady === false,
  };
  const provenance = {
    trendBriefIdentity: `${evidence.provenance.rawHash}:${evidence.provenance.normalizedHash}`,
    evidencePackIdentity: scriptSnapshot.evidenceIdentity,
    selectedAngleIdentity: scriptSnapshot.selectedAngle.selectedAngleId,
    detailedScriptIdentity: scriptSnapshot.scriptNormalizedHash,
    scenePlanningIdentity: renderSnapshot.renderManifest.sourcePlanningIdentity,
    characterMotionIdentity: `${renderSnapshot.sourceCharacterSnapshot.sourcePlanningIdentity}:${renderSnapshot.sourceCharacterSnapshot.selectedDirectionId}`,
    renderIntegrationIdentity: approvedSnapshot.sourceRenderIntegrationIdentity,
    publishIntegrationIdentity: approvedSnapshot.publishPackage.packageId,
    renderManifestHash: approvedSnapshot.publishPackage.renderManifestHash,
    publishPackageHash: hashPublishPackage(approvedSnapshot.publishPackage),
    selectedCharacterDirectionId: approvedSnapshot.selectedCharacterDirectionId,
    platformPackageIdentities: approvedSnapshot.platformPackages.map((entry) => `${entry.platformId}:${entry.dedupeKey.value}`),
  };
  const unresolvedRequirements = unique(storyboard.scenes.flatMap((scene) => scene.unresolvedAssets));
  const base = {
    packageVersion: "representative-sample-package-v1" as const,
    status: "synthetic_local_proof_ready" as const,
    productionStatus: "user_content_production_blocked" as const,
    launchStatus: "public_launch_blocked" as const,
    validationLevel: "REPRESENTATIVE_SAMPLE_PRECHECK_ONLY" as const,
    provenance,
    storyboard,
    renderProfile: {
      profileVersion: "representative-sample-profile-v1" as const,
      width: 1080 as const,
      height: 1920 as const,
      framesPerSecond: 30 as const,
      targetDurationSeconds: 24 as const,
      syntheticToneAudio: true as const,
      actualTts: false as const,
      actualVisualAssets: false as const,
      publicReady: false as const,
    },
    referenceRegistry,
    provenanceChecks,
    sourceDisclosurePresent: approvedSnapshot.sourceDisclosures.every((entry) => entry.statement.trim().length > 0 && entry.sources.length > 0),
    publishMetadataPresent: approvedSnapshot.publishMetadata.length === approvedSnapshot.platformPackages.length,
    unresolvedRequirements,
    executionRequested: false as const,
    externalRequestsMade: false as const,
    userContentIncluded: false as const,
    actualAssetsIncluded: false as const,
    actualRenderExecuted: false as const,
    syntheticOnly: true as const,
    productionReady: false as const,
    publicLaunchReady: false as const,
  };
  return cloneRepresentativeSamplePackage({
    ...base,
    packageId: `representative-sample-${deterministicHash(base)}`,
  });
}

export function buildRepresentativeStoryboard(
  samplePackage: RepresentativeSamplePackage,
): RepresentativeSampleStoryboard {
  return {
    ...samplePackage.storyboard,
    scenes: samplePackage.storyboard.scenes.map((scene) => ({
      ...scene,
      evidenceRefs: [...scene.evidenceRefs],
      sourceRefs: [...scene.sourceRefs],
      numberRefs: [...scene.numberRefs],
      secondaryVisualStrategies: [...scene.secondaryVisualStrategies],
      characterMotion: cloneAssignment(scene.characterMotion),
      unresolvedAssets: [...scene.unresolvedAssets],
    })),
  };
}

export function cloneRepresentativeSamplePackage(
  samplePackage: RepresentativeSamplePackage,
): RepresentativeSamplePackage {
  return {
    ...samplePackage,
    provenance: {
      ...samplePackage.provenance,
      platformPackageIdentities: [...samplePackage.provenance.platformPackageIdentities],
    },
    storyboard: buildRepresentativeStoryboard(samplePackage),
    renderProfile: { ...samplePackage.renderProfile },
    referenceRegistry: {
      evidenceRefs: [...samplePackage.referenceRegistry.evidenceRefs],
      sourceRefs: [...samplePackage.referenceRegistry.sourceRefs],
      numberRefs: [...samplePackage.referenceRegistry.numberRefs],
    },
    provenanceChecks: { ...samplePackage.provenanceChecks },
    unresolvedRequirements: [...samplePackage.unresolvedRequirements],
  };
}

export function hashRepresentativeSamplePackage(samplePackage: RepresentativeSamplePackage): string {
  return deterministicHash({ ...samplePackage, packageId: "" });
}

export function validateRepresentativeSamplePackage(
  samplePackage: RepresentativeSamplePackage,
): readonly RepresentativeSampleValidationIssue[] {
  const issues: RepresentativeSampleValidationIssue[] = [];
  const add = (code: string, sceneId: string | null, fieldPath: string, message: string): void => {
    issues.push({ code, sceneId, fieldPath, message, blocking: true });
  };
  if (!samplePackage.packageId.trim()) add("sample_package_id_missing", null, "packageId", "대표 sample package ID가 없습니다.");
  for (const [fieldPath, value] of Object.entries(samplePackage.provenanceChecks)) {
    if (value !== true) add("representative_provenance_mismatch", null, `provenanceChecks.${fieldPath}`, `Upstream provenance 또는 execution boundary mismatch: ${fieldPath}`);
  }
  if (samplePackage.storyboard.scenes.length !== 8) add("representative_scene_count_mismatch", null, "storyboard.scenes", "대표 storyboard는 정확히 8개 scene이어야 합니다.");
  const orders = samplePackage.storyboard.scenes.map((scene) => scene.sceneOrder);
  if (new Set(orders).size !== orders.length || orders.some((order, index) => order !== index + 1)) add("representative_scene_order_mismatch", null, "storyboard.scenes", "Scene order가 1~8 순서를 보존하지 않습니다.");
  for (const scene of samplePackage.storyboard.scenes) {
    const path = `storyboard.scenes.${scene.sceneOrder - 1}`;
    if (!scene.narration.trim() || !scene.keyCaption.trim()) add("representative_scene_text_missing", scene.sceneId, path, "Narration과 key caption이 필요합니다.");
    if (scene.evidenceRefs.length === 0) add("representative_evidence_refs_missing", scene.sceneId, `${path}.evidenceRefs`, "Evidence ref가 없습니다.");
    if (scene.sourceRefs.length === 0) add("representative_source_refs_missing", scene.sceneId, `${path}.sourceRefs`, "Source ref가 없습니다.");
    if (scene.numberRefs.length === 0) add("representative_number_refs_missing", scene.sceneId, `${path}.numberRefs`, "Number ref가 없습니다.");
    for (const reference of scene.evidenceRefs) if (!samplePackage.referenceRegistry.evidenceRefs.includes(reference)) add("representative_unsupported_evidence_ref", scene.sceneId, `${path}.evidenceRefs`, `지원되지 않는 evidence ref: ${reference}`);
    for (const reference of scene.sourceRefs) if (!samplePackage.referenceRegistry.sourceRefs.includes(reference)) add("representative_unsupported_source_ref", scene.sceneId, `${path}.sourceRefs`, `지원되지 않는 source ref: ${reference}`);
    for (const reference of scene.numberRefs) if (!samplePackage.referenceRegistry.numberRefs.includes(reference)) add("representative_unsupported_number_ref", scene.sceneId, `${path}.numberRefs`, `지원되지 않는 number ref: ${reference}`);
    if (scene.unresolvedAssets.includes("detailed_script_beat:missing")) add("representative_upstream_script_beat_missing", scene.sceneId, `${path}.unresolvedAssets`, "Detailed Script beat provenance가 없습니다.");
    if (scene.rightsState === "pending_manual_review") add("representative_rights_unresolved", scene.sceneId, `${path}.rightsState`, "Rights review가 미확정입니다.");
    if (scene.safeAreaState !== "structural_precheck_pass") add("representative_safe_area_blocked", scene.sceneId, `${path}.safeAreaState`, "Safe-area structural precheck가 차단됐습니다.");
  }
  for (const field of ["executionRequested", "externalRequestsMade", "userContentIncluded", "actualAssetsIncluded", "actualRenderExecuted", "productionReady", "publicLaunchReady"] as const) {
    if (samplePackage[field] !== false) add("representative_execution_or_readiness_false_claim", null, field, `${field}는 Slice 8에서 false여야 합니다.`);
  }
  if (samplePackage.syntheticOnly !== true) add("representative_synthetic_only_mismatch", null, "syntheticOnly", "대표 sample은 synthetic-only여야 합니다.");
  return issues;
}
