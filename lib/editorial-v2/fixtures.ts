import {
  EDITORIAL_V2_QUALITY_GATES,
  type ArtifactApproval,
  type ArtifactEnvelope,
  type ArtifactGateValidation,
  type EvidencePackPayload,
  type SceneCard,
  type SceneCardsPayload,
  type TrendBriefPayload,
} from "./contracts";
import {
  EDITORIAL_V2_NAMESPACE,
  EDITORIAL_V2_SCHEMA_VERSION,
} from "./schema-version";

export const EDITORIAL_V2_FIXTURE_TIMESTAMP = "2026-08-03T00:00:00.000Z" as const;
export const EDITORIAL_V2_FIXTURE_PROJECT_ID = "fixture-project-contract-v1" as const;

const TREND_CONTENT_HASH = "1111111111111111111111111111111111111111111111111111111111111111";
const EVIDENCE_CONTENT_HASH = "2222222222222222222222222222222222222222222222222222222222222222";
const SCENES_CONTENT_HASH = "3333333333333333333333333333333333333333333333333333333333333333";
const CLAIM_CONTENT_HASH = "4444444444444444444444444444444444444444444444444444444444444444";

function createValidationFixture(): ArtifactGateValidation[] {
  return EDITORIAL_V2_QUALITY_GATES.map((gate) => ({
    gate,
    status: "not_run",
    blocking: true,
    reason: "Deterministic contract fixture; no product validation was executed.",
    evidenceReferences: [],
    evaluatedAt: EDITORIAL_V2_FIXTURE_TIMESTAMP,
  }));
}

function createPendingApproval(): ArtifactApproval {
  return {
    status: "pending",
    reason: "Fixture only; no Owner approval is implied.",
    decidedAt: null,
    evidenceReferences: [],
  };
}

function createEnvelope<TKind extends "trend_brief" | "evidence_pack" | "scene_cards", TPayload>(
  input: {
    readonly artifactId: string;
    readonly kind: TKind;
    readonly contentHash: string;
    readonly upstreamArtifactIds: readonly string[];
    readonly payload: TPayload;
  },
): ArtifactEnvelope<TKind, TPayload> {
  return {
    namespace: EDITORIAL_V2_NAMESPACE,
    schemaVersion: EDITORIAL_V2_SCHEMA_VERSION,
    artifactId: input.artifactId,
    projectId: EDITORIAL_V2_FIXTURE_PROJECT_ID,
    kind: input.kind,
    revision: 1,
    contentHash: input.contentHash,
    createdAt: EDITORIAL_V2_FIXTURE_TIMESTAMP,
    updatedAt: EDITORIAL_V2_FIXTURE_TIMESTAMP,
    upstreamArtifactIds: [...input.upstreamArtifactIds],
    validation: createValidationFixture(),
    approval: createPendingApproval(),
    payload: input.payload,
  };
}

export interface EditorialV2ContractFixtures {
  readonly trendBrief: ArtifactEnvelope<"trend_brief", TrendBriefPayload>;
  readonly evidencePack: ArtifactEnvelope<"evidence_pack", EvidencePackPayload>;
  readonly sceneCards: ArtifactEnvelope<"scene_cards", SceneCardsPayload>;
}

/** Contract-test data only. The returned values are not persisted product data. */
export function createEditorialV2ContractFixtures(): EditorialV2ContractFixtures {
  const trendBrief = createEnvelope({
    artifactId: "artifact-trend-brief-fixture-v1",
    kind: "trend_brief",
    contentHash: TREND_CONTENT_HASH,
    upstreamArtifactIds: [],
    payload: {
      title: "Fixed contract trend",
      watchReason: "Demonstrates a deterministic V2 artifact envelope.",
      observedAt: EDITORIAL_V2_FIXTURE_TIMESTAMP,
      sourceRefs: ["source-fixture-001"],
    },
  });

  const evidencePack = createEnvelope({
    artifactId: "artifact-evidence-pack-fixture-v1",
    kind: "evidence_pack",
    contentHash: EVIDENCE_CONTENT_HASH,
    upstreamArtifactIds: [trendBrief.artifactId],
    payload: {
      claims: [
        {
          claimId: "claim-fixture-001",
          text: "This claim exists only to validate the contract shape.",
          sourceRefs: ["source-fixture-001"],
          contentHash: CLAIM_CONTENT_HASH,
        },
      ],
      sourceRefs: ["source-fixture-001"],
    },
  });

  const scene: SceneCard = {
    sceneId: "scene-fixture-001",
    order: 1,
    purpose: "Contract shape verification",
    narration: "A deterministic scene fixture verifies every required field.",
    keyCaption: "CONTRACT FIXTURE",
    evidenceRefs: ["claim-fixture-001"],
    numberOrComparison: "1 deterministic example",
    visualizationType: "comparison_card",
    characterMotion: "none",
    cameraOrScreenMotion: "static",
    transition: "cut",
    soundEffect: "none",
    retentionBeat: "Show the evidence reference before the conclusion.",
    sourceRefs: ["source-fixture-001"],
    enabled: true,
  };

  const sceneCards = createEnvelope({
    artifactId: "artifact-scene-cards-fixture-v1",
    kind: "scene_cards",
    contentHash: SCENES_CONTENT_HASH,
    upstreamArtifactIds: [evidencePack.artifactId],
    payload: { scenes: [scene] },
  });

  return { trendBrief, evidencePack, sceneCards };
}
