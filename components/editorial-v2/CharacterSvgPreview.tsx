import type { CSSProperties, ReactNode } from "react";

import type {
  CharacterDirectionDefinition,
  CharacterMotionDefinition,
  CharacterRigDefinition,
  CharacterRigLayerDefinition,
} from "../../lib/editorial-v2/contracts";
import styles from "./CharacterMotionWorkbench.module.css";

interface CharacterSvgPreviewProps {
  readonly rig: CharacterRigDefinition;
  readonly motionDefinition: CharacterMotionDefinition;
  readonly direction: CharacterDirectionDefinition;
  readonly playbackState: "playing" | "paused";
  readonly reducedMotion: boolean;
  readonly previewScale: 0.75 | 1 | 1.25;
  readonly sameSceneContextLabels: readonly string[];
}

function layerPrimitive(
  layer: CharacterRigLayerDefinition,
  direction: CharacterDirectionDefinition,
): ReactNode {
  const common = {
    className: styles.rigPrimitive,
    "data-layer": layer.layerId,
    "data-role": layer.semanticRole,
    opacity: layer.opacity,
  };

  if (direction.directionId === "loop_signal_navigator") {
    switch (layer.layerId) {
      case "root": return <circle {...common} cx="120" cy="120" r="78" className={`${styles.rigPrimitive} ${styles.guideStroke}`} />;
      case "body": return <path {...common} d="M73 69 A70 70 0 1 1 68 165" className={`${styles.rigPrimitive} ${styles.primaryStroke}`} />;
      case "signalCore": return <circle {...common} cx="120" cy="120" r="25" className={`${styles.rigPrimitive} ${styles.softFill}`} />;
      case "indicator": return <rect {...common} x="106" y="42" width="28" height="11" rx="5" className={`${styles.rigPrimitive} ${styles.accentFill}`} />;
      case "pointer": return <path {...common} d="M170 83 L207 70 L190 105 Z" className={`${styles.rigPrimitive} ${styles.accentFill}`} />;
      case "accent": return <circle {...common} cx="61" cy="151" r="8" className={`${styles.rigPrimitive} ${styles.accentFill}`} />;
      case "focusMarker": return <circle {...common} cx="120" cy="120" r="7" className={`${styles.rigPrimitive} ${styles.focusFill}`} />;
      default: return null;
    }
  }

  if (direction.directionId === "pin_field_finch") {
    switch (layer.layerId) {
      case "root": return <circle {...common} cx="120" cy="116" r="73" className={`${styles.rigPrimitive} ${styles.guideStroke}`} />;
      case "body": return <path {...common} d="M120 48 L155 112 L120 191 L85 112 Z" className={`${styles.rigPrimitive} ${styles.softFill}`} />;
      case "leftGuide": return <path {...common} d="M89 84 L37 105 L83 130 Z" className={`${styles.rigPrimitive} ${styles.primaryFill}`} />;
      case "rightGuide": return <path {...common} d="M151 84 L203 105 L157 130 Z" className={`${styles.rigPrimitive} ${styles.primaryFill}`} />;
      case "evidencePanel": return <rect {...common} x="101" y="88" width="38" height="47" rx="8" className={`${styles.rigPrimitive} ${styles.panelFill}`} />;
      case "pointer": return <path {...common} d="M111 140 L129 140 L120 174 Z" className={`${styles.rigPrimitive} ${styles.accentFill}`} />;
      case "focusMarker": return <circle {...common} cx="120" cy="104" r="7" className={`${styles.rigPrimitive} ${styles.focusFill}`} />;
      default: return null;
    }
  }

  switch (layer.layerId) {
    case "root": return <rect {...common} x="48" y="52" width="144" height="139" rx="22" className={`${styles.rigPrimitive} ${styles.guideStroke}`} />;
    case "body": return <rect {...common} x="66" y="75" width="108" height="94" rx="12" className={`${styles.rigPrimitive} ${styles.softFill}`} />;
    case "evidencePanel": return <rect {...common} x="82" y="58" width="76" height="92" rx="8" className={`${styles.rigPrimitive} ${styles.panelFill}`} />;
    case "leftGuide": return <line {...common} x1="67" y1="111" x2="36" y2="111" className={`${styles.rigPrimitive} ${styles.primaryStroke}`} />;
    case "rightGuide": return <line {...common} x1="173" y1="130" x2="204" y2="130" className={`${styles.rigPrimitive} ${styles.primaryStroke}`} />;
    case "indicator": return <rect {...common} x="94" y="80" width="52" height="9" rx="4" className={`${styles.rigPrimitive} ${styles.accentFill}`} />;
    case "focusMarker": return <circle {...common} cx="120" cy="121" r="8" className={`${styles.rigPrimitive} ${styles.focusFill}`} />;
    default: return null;
  }
}

export default function CharacterSvgPreview({
  rig,
  motionDefinition,
  direction,
  playbackState,
  reducedMotion,
  previewScale,
  sameSceneContextLabels,
}: CharacterSvgPreviewProps) {
  const previewStyle = {
    "--preview-duration": `${motionDefinition.timing.durationMs / previewScale}ms`,
  } as CSSProperties;
  const sortedLayers = [...rig.layers].sort((left, right) => left.zOrder - right.zOrder);

  return (
    <figure
      className={styles.previewFigure}
      data-direction={direction.directionId}
      data-playing={playbackState === "playing"}
      data-reduced-motion={reducedMotion}
      data-loop-policy={motionDefinition.timing.loopPolicy}
      style={previewStyle}
    >
      <svg
        className={styles.previewSvg}
        viewBox={rig.viewBox.join(" ")}
        role="img"
        aria-label={`${direction.temporaryDisplayName}, ${motionDefinition.semanticPurpose}, ${reducedMotion ? "reduced motion" : "standard motion"}`}
      >
        <rect className={styles.evidenceSafeArea} x="18" y="18" width="204" height="144" rx="12" />
        <path className={styles.occupancyGuide} d="M24 184 H216" />
        <g className={styles.motionGroup} data-motion={motionDefinition.motionTag}>
          {sortedLayers.filter((layer) => !reducedMotion || layer.reducedMotionVisible).map((layer) => (
            <g
              key={layer.layerId}
              style={{
                transformOrigin: `${layer.transformOrigin[0]}px ${layer.transformOrigin[1]}px`,
                transform: `translate(${layer.translation[0]}px, ${layer.translation[1]}px) rotate(${layer.rotationDegrees}deg) scale(${layer.scale})`,
              }}
            >
              {layerPrimitive(layer, direction)}
            </g>
          ))}
        </g>
        <text className={styles.safeAreaLabel} x="24" y="34">EVIDENCE SAFE AREA</text>
        <text className={styles.occupancyLabel} x="24" y="206">CHARACTER OCCUPANCY GUIDE ≤ {rig.occupancyTargetPercent}%</text>
      </svg>
      <figcaption>
        <strong>{direction.temporaryDisplayName}</strong>
        <span>{motionDefinition.motionTag} · {playbackState} · {previewScale}x</span>
        <small>{sameSceneContextLabels.join(" · ")}</small>
      </figcaption>
    </figure>
  );
}
