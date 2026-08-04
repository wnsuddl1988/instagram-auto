import type {
  CharacterDirectionId,
  CharacterRigDefinition,
  CharacterRigLayerDefinition,
  CharacterRigLayerId,
  CharacterVisualRole,
} from "./contracts";
import { getCharacterDirection } from "./character-directions";

export interface CharacterRigValidationIssue {
  readonly code: string;
  readonly layerId: CharacterRigLayerId | null;
  readonly message: string;
  readonly blocking: boolean;
}

export interface CharacterRigValidationResult {
  readonly valid: boolean;
  readonly blockingIssueCount: number;
  readonly warningCount: number;
  readonly issues: readonly CharacterRigValidationIssue[];
}

function layer(
  layerId: CharacterRigLayerId,
  semanticRole: CharacterVisualRole,
  primitive: CharacterRigLayerDefinition["primitive"],
  zOrder: number,
  reducedMotionVisible = true,
): CharacterRigLayerDefinition {
  return {
    layerId,
    semanticRole,
    primitive,
    transformOrigin: [120, 120],
    zOrder,
    opacity: 1,
    scale: 1,
    rotationDegrees: 0,
    translation: [0, 0],
    fillToken: `${layerId}_fill`,
    strokeToken: `${layerId}_stroke`,
    reducedMotionVisible,
  };
}

const DIRECTION_LAYERS: Readonly<Record<CharacterDirectionId, readonly CharacterRigLayerDefinition[]>> = {
  loop_signal_navigator: [
    layer("root", "signal_navigation", "circle", 0),
    layer("body", "signal_navigation", "path", 1),
    layer("signalCore", "signal_navigation", "circle", 2),
    layer("indicator", "number_navigation", "rect", 3),
    layer("pointer", "source_navigation", "path", 4),
    layer("accent", "signal_navigation", "circle", 5, false),
    layer("focusMarker", "number_navigation", "circle", 6),
  ],
  pin_field_finch: [
    layer("root", "source_navigation", "circle", 0),
    layer("body", "source_navigation", "path", 1),
    layer("leftGuide", "comparison_navigation", "path", 2),
    layer("rightGuide", "comparison_navigation", "path", 3),
    layer("evidencePanel", "source_navigation", "rect", 4),
    layer("pointer", "warning_navigation", "path", 5),
    layer("focusMarker", "source_navigation", "circle", 6),
  ],
  moa_archive_sprite: [
    layer("root", "source_navigation", "rect", 0),
    layer("body", "source_navigation", "rect", 1),
    layer("evidencePanel", "source_navigation", "rect", 2),
    layer("leftGuide", "timeline_navigation", "line", 3),
    layer("rightGuide", "relationship_navigation", "line", 4),
    layer("indicator", "timeline_navigation", "rect", 5),
    layer("focusMarker", "relationship_navigation", "circle", 6),
  ],
};

const EVIDENCE_LAYERS: Readonly<Record<CharacterDirectionId, readonly CharacterRigLayerId[]>> = {
  loop_signal_navigator: ["indicator", "pointer", "focusMarker"],
  pin_field_finch: ["evidencePanel", "pointer", "focusMarker"],
  moa_archive_sprite: ["evidencePanel", "indicator", "focusMarker"],
};

export function cloneCharacterRig(rig: CharacterRigDefinition): CharacterRigDefinition {
  return {
    ...rig,
    viewBox: [...rig.viewBox] as [number, number, number, number],
    layers: rig.layers.map((entry) => ({
      ...entry,
      transformOrigin: [...entry.transformOrigin] as [number, number],
      translation: [...entry.translation] as [number, number],
    })),
    evidenceNavigationLayerIds: [...rig.evidenceNavigationLayerIds],
    prohibitedMotifMarkers: [...rig.prohibitedMotifMarkers],
  };
}

export function buildCharacterRig(directionId: CharacterDirectionId): CharacterRigDefinition {
  const direction = getCharacterDirection(directionId);
  return cloneCharacterRig({
    rigVersion: "character-rig-v1",
    directionId,
    viewBox: [0, 0, 240, 240],
    layers: DIRECTION_LAYERS[directionId],
    evidenceNavigationLayerIds: EVIDENCE_LAYERS[directionId],
    occupancyTargetPercent: direction.screenOccupancyTargetPercent,
    reducedMotionDescription: direction.reducedMotionBehavior,
    prohibitedMotifMarkers: [...direction.prohibitedMotifs],
    productionExportReady: false,
  });
}

function finite(values: readonly number[]): boolean {
  return values.every(Number.isFinite);
}

export function validateCharacterRig(rig: CharacterRigDefinition): CharacterRigValidationResult {
  const issues: CharacterRigValidationIssue[] = [];
  const layerIds = new Set<CharacterRigLayerId>();
  const zOrders = new Set<number>();

  for (const item of rig.layers) {
    if (layerIds.has(item.layerId)) issues.push({ code: "DUPLICATE_LAYER_ID", layerId: item.layerId, message: "Rig layer ID must be unique.", blocking: true });
    layerIds.add(item.layerId);
    if (!Number.isInteger(item.zOrder) || item.zOrder < 0 || zOrders.has(item.zOrder)) issues.push({ code: "INVALID_Z_ORDER", layerId: item.layerId, message: "z-order must be a unique non-negative integer.", blocking: true });
    zOrders.add(item.zOrder);
    if (!finite([...item.transformOrigin, ...item.translation, item.opacity, item.scale, item.rotationDegrees])) issues.push({ code: "NON_FINITE_TRANSFORM", layerId: item.layerId, message: "All rig transforms must be finite.", blocking: true });
    if (item.opacity < 0 || item.opacity > 1 || item.scale <= 0) issues.push({ code: "INVALID_TRANSFORM_RANGE", layerId: item.layerId, message: "Opacity and scale are outside the supported range.", blocking: true });
  }

  for (const layerId of rig.evidenceNavigationLayerIds) {
    if (!layerIds.has(layerId)) issues.push({ code: "UNSUPPORTED_EVIDENCE_LAYER_REF", layerId, message: "Evidence navigation references an unknown layer.", blocking: true });
  }
  if (rig.evidenceNavigationLayerIds.length === 0) issues.push({ code: "MISSING_EVIDENCE_NAVIGATION_LAYER", layerId: null, message: "A secondary evidence-navigation layer is required.", blocking: true });
  if (!rig.layers.some((entry) => entry.reducedMotionVisible)) issues.push({ code: "MISSING_REDUCED_MOTION_REPRESENTATION", layerId: null, message: "At least one layer must remain visible in reduced motion.", blocking: true });
  if (rig.prohibitedMotifMarkers.length === 0 || !rig.prohibitedMotifMarkers.includes("money_coin_banknote_face")) issues.push({ code: "MISSING_MONEY_MOTIF_GUARD", layerId: null, message: "The money-face motif guard must remain explicit.", blocking: true });
  if (!finite(rig.viewBox) || rig.viewBox[2] <= 0 || rig.viewBox[3] <= 0) issues.push({ code: "INVALID_VIEWBOX", layerId: null, message: "Rig viewBox must be finite and positive.", blocking: true });
  if (rig.occupancyTargetPercent > 16) issues.push({ code: "OCCUPANCY_TARGET_WARNING", layerId: null, message: "Character occupancy target exceeds the compact comparison guide.", blocking: false });

  const blockingIssueCount = issues.filter((entry) => entry.blocking).length;
  return {
    valid: blockingIssueCount === 0,
    blockingIssueCount,
    warningCount: issues.length - blockingIssueCount,
    issues,
  };
}
