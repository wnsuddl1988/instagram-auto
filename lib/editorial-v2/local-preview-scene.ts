import { getCharacterMotionDefinition } from "./character-motion";
import { buildCharacterRig } from "./character-rig";
import type {
  LocalPreviewCharacterPose,
  LocalPreviewSceneInput,
} from "./local-preview-contracts";

export interface BuildLocalPreviewSceneMarkupOptions {
  readonly phase: 0 | 0.5 | 1;
  readonly frameLabel?: string;
}

export function escapePreviewText(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function numeric(value: number): string {
  if (!Number.isFinite(value)) throw new Error("PREVIEW_NON_FINITE_NUMBER");
  return String(Math.round(value * 1000) / 1000);
}

export function buildCharacterPreviewPose(scene: LocalPreviewSceneInput, phase: 0 | 0.5 | 1): LocalPreviewCharacterPose {
  const definition = getCharacterMotionDefinition(scene.characterMotionTag);
  const keyframe = definition.keyframes.find((entry) => entry.offset === phase);
  if (!keyframe) throw new Error(`PREVIEW_CHARACTER_PHASE_UNSUPPORTED:${phase}`);
  return {
    phase,
    motionTag: scene.characterMotionTag,
    translateX: keyframe.translateX,
    translateY: keyframe.translateY,
    scale: keyframe.scale,
    rotationDegrees: keyframe.rotationDegrees,
    opacity: keyframe.opacity,
    label: "CHARACTER_MOTION_PREVIEW_PROXY",
    productionAnimation: false,
  };
}

function characterMarkup(scene: LocalPreviewSceneInput, pose: LocalPreviewCharacterPose): string {
  const rig = buildCharacterRig(scene.characterDirection);
  const layers = rig.layers.slice().sort((left, right) => left.zOrder - right.zOrder).map((layer, index) => {
    const x = 36 + (index % 3) * 46;
    const y = 42 + Math.floor(index / 3) * 48;
    const common = `fill="${index % 2 === 0 ? "#52d6c5" : "#ffcc66"}" stroke="#07141f" stroke-width="4" opacity="${numeric(layer.opacity)}"`;
    if (layer.primitive === "circle") return `<circle cx="${x}" cy="${y}" r="18" ${common}/>`;
    if (layer.primitive === "ellipse") return `<ellipse cx="${x}" cy="${y}" rx="22" ry="14" ${common}/>`;
    if (layer.primitive === "rect") return `<rect x="${x - 20}" y="${y - 15}" width="40" height="30" rx="8" ${common}/>`;
    if (layer.primitive === "line") return `<line x1="${x - 18}" y1="${y}" x2="${x + 18}" y2="${y}" ${common}/>`;
    if (layer.primitive === "polyline") return `<polyline points="${x - 18},${y + 10} ${x},${y - 12} ${x + 18},${y + 10}" fill="none" stroke="#52d6c5" stroke-width="5"/>`;
    return `<path d="M ${x - 18} ${y + 14} Q ${x} ${y - 20} ${x + 18} ${y + 14} Z" ${common}/>`;
  }).join("");
  return `<aside class="character" aria-label="Character motion preview proxy"><svg viewBox="0 0 240 240" role="img" aria-label="${escapePreviewText(scene.characterDirection)} character proxy" style="transform:translate(${numeric(pose.translateX)}px,${numeric(pose.translateY)}px) scale(${numeric(pose.scale)}) rotate(${numeric(pose.rotationDegrees)}deg);opacity:${numeric(pose.opacity)}"><rect x="8" y="8" width="224" height="224" rx="44" fill="#effbf8" stroke="#52d6c5" stroke-width="5"/>${layers}</svg><strong>CHARACTER_MOTION_PREVIEW_PROXY</strong><span>${escapePreviewText(scene.characterMotionTag)} · phase ${numeric(pose.phase)}</span><small>NOT_PRODUCTION_ANIMATION · secondary evidence navigation only</small></aside>`;
}

function numberMarkup(scene: LocalPreviewSceneInput): string {
  const numbers = scene.numbers.slice(0, 3);
  if (numbers.length === 0) return `<div class="empty">승인된 number ref 없음</div>`;
  return `<div class="number-grid">${numbers.map((entry) => `<article><strong>${escapePreviewText(String(entry.value))}</strong><span>${escapePreviewText([entry.currency, entry.unit].filter(Boolean).join(" "))}</span><small>${escapePreviewText(entry.context)} · ${escapePreviewText(entry.asOf)}</small></article>`).join("")}</div>`;
}

function chartMarkup(scene: LocalPreviewSceneInput): string {
  const values = scene.numbers.slice(0, Math.max(2, scene.chartLabels.length || 2));
  const max = Math.max(1, ...values.map((entry) => Math.abs(entry.value)));
  return `<div class="chart" aria-label="Approved number comparison">${values.map((entry, index) => { const height = Math.max(8, Math.round(Math.abs(entry.value) / max * 180)); const label = scene.chartLabels[index] ?? entry.numberId; return `<div class="bar-wrap"><span>${escapePreviewText(String(entry.value))}</span><div class="bar" style="height:${height}px"></div><small>${escapePreviewText(label)}</small></div>`; }).join("")}<em>${escapePreviewText(scene.chartUnit ?? values[0]?.unit ?? "approved unit")}</em></div>`;
}

function sourceCardMarkup(scene: LocalPreviewSceneInput): string {
  return `<div class="source-cards">${scene.sources.slice(0, 3).map((source) => `<article><strong>${escapePreviewText(source.publisher)}</strong><span>${escapePreviewText(source.title)}</span><small>${escapePreviewText(source.publishedAt)}${source.eventDate ? ` · event ${escapePreviewText(source.eventDate)}` : ""}</small><code>${escapePreviewText(source.urlText)}</code></article>`).join("") || `<div class="empty">승인된 source metadata 없음</div>`}</div>`;
}

function timelineMarkup(scene: LocalPreviewSceneInput): string {
  const entries = scene.timelineEntries.length > 0 ? scene.timelineEntries : scene.sources.map((source) => ({ evidenceRef: source.sourceId, date: source.eventDate ?? source.publishedAt, label: source.title }));
  return `<ol class="timeline">${entries.slice(0, 5).map((entry) => `<li><time>${escapePreviewText(entry.date)}</time><strong>${escapePreviewText(entry.label)}</strong><small>${escapePreviewText(entry.evidenceRef)}</small></li>`).join("") || `<li>승인된 timeline metadata 없음</li>`}</ol>`;
}

function relationshipMarkup(scene: LocalPreviewSceneInput): string {
  const labels = scene.relationshipLabels.length > 0 ? scene.relationshipLabels : [...scene.claimRefs, ...scene.sourceRefs];
  return `<div class="relationship">${labels.slice(0, 5).map((label, index) => `<span>${escapePreviewText(label)}</span>${index < Math.min(labels.length, 5) - 1 ? `<b aria-hidden="true">→</b>` : ""}`).join("") || `<div class="empty">승인된 relationship label 없음</div>`}<small>기존 approved labels만 표시 · 새 인과관계 생성 없음</small></div>`;
}

function placeholderMarkup(scene: LocalPreviewSceneInput, label: string): string {
  return `<div class="placeholder"><strong>${escapePreviewText(label)}</strong><span>NOT GENERATED</span><span>NOT PRODUCTION READY</span><small>${escapePreviewText(scene.sourceRefs.join(" · ") || "source refs unavailable")}</small></div>`;
}

function primaryMarkup(scene: LocalPreviewSceneInput): string {
  switch (scene.primaryVisualStrategy) {
    case "number_text_motion": return numberMarkup(scene);
    case "chart_comparison": return chartMarkup(scene);
    case "official_source_card": return sourceCardMarkup(scene);
    case "timeline": return timelineMarkup(scene);
    case "relationship_diagram": return relationshipMarkup(scene);
    case "map": return placeholderMarkup(scene, "MAP ASSET UNAVAILABLE IN LOCAL PREVIEW");
    case "generated_image": return placeholderMarkup(scene, "GENERATED IMAGE PLACEHOLDER");
    case "generated_video": return placeholderMarkup(scene, "GENERATED VIDEO PLACEHOLDER");
    case "stock_video": return placeholderMarkup(scene, "STOCK VIDEO PLACEHOLDER");
    case "direct_upload": return placeholderMarkup(scene, "DIRECT UPLOAD PLACEHOLDER");
    default: return placeholderMarkup(scene, "UNSUPPORTED PRIMARY VISUAL");
  }
}

export function buildLocalPreviewSceneMarkup(scene: LocalPreviewSceneInput, options: BuildLocalPreviewSceneMarkupOptions): string {
  const pose = buildCharacterPreviewPose(scene, options.phase);
  const cueIndex = options.phase === 0 ? 0 : options.phase === 0.5 ? Math.floor((scene.estimatedSubtitleCues.length - 1) / 2) : scene.estimatedSubtitleCues.length - 1;
  const cue = scene.estimatedSubtitleCues[Math.max(0, cueIndex)]?.text ?? scene.narration;
  const unresolved = scene.unresolvedAssets.length > 0 ? `<div class="warning"><strong>PREVIEW_PLACEHOLDER_ONLY</strong>${scene.unresolvedAssets.map((entry) => `<span>${escapePreviewText(entry)}</span>`).join("")}</div>` : "";
  const markup = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=540,height=960,initial-scale=1"><style>*{box-sizing:border-box}html,body{margin:0;width:540px;height:960px;overflow:hidden;font-family:Arial,"Malgun Gothic",sans-serif;background:#07141f;color:#f7fbff}.frame{position:relative;width:540px;height:960px;padding:42px 34px 168px;background:linear-gradient(165deg,#07141f 0%,#102d3a 55%,#0c1d29 100%)}.meta{display:flex;justify-content:space-between;color:#8fb6c4;font-size:16px}.caption{font-size:38px;line-height:1.16;margin:22px 0;color:#fff}.visual{height:420px;border:2px solid #2a5b68;border-radius:28px;background:#0d2430;padding:24px;overflow:hidden}.number-grid{display:grid;gap:14px}.number-grid article,.source-cards article{display:grid;gap:6px;padding:16px;border-radius:18px;background:#173844}.number-grid strong{font-size:46px;color:#ffcc66}.number-grid span{font-size:22px}.chart{height:300px;display:flex;align-items:flex-end;gap:24px;padding:28px;position:relative}.bar-wrap{width:100px;text-align:center;display:flex;flex-direction:column;justify-content:flex-end;align-items:center}.bar{width:70px;border-radius:16px 16px 4px 4px;background:#52d6c5}.source-cards{display:grid;gap:12px}.source-cards article{font-size:16px}.source-cards code{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#9fcbd7}.timeline{display:grid;gap:14px;padding:0;list-style:none}.timeline li{display:grid;grid-template-columns:120px 1fr;gap:8px;border-left:5px solid #52d6c5;padding:10px 14px}.relationship{display:flex;flex-wrap:wrap;align-items:center;gap:14px;padding:50px 16px}.relationship span{padding:14px;border-radius:16px;background:#173844}.relationship small{width:100%;color:#9fcbd7}.placeholder{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;border:3px dashed #ffcc66;border-radius:20px;text-align:center}.placeholder strong{font-size:26px}.placeholder span{color:#ffcc66}.character{position:absolute;right:34px;bottom:182px;width:150px;display:grid;gap:4px;color:#07141f;background:#effbf8;border:4px solid #52d6c5;border-radius:24px;padding:8px;z-index:4}.character svg{width:126px;height:126px;transform-origin:center}.character strong{font-size:11px}.character span,.character small{font-size:10px}.subtitle{position:absolute;left:40px;right:40px;bottom:72px;padding:16px 20px;border-radius:16px;background:rgba(0,0,0,.82);font-size:25px;text-align:center}.subtitle small{display:block;color:#ffcc66;font-size:12px}.warning{position:absolute;left:34px;bottom:176px;width:305px;padding:12px;border-radius:14px;background:#472a16;color:#ffe3b0;display:grid;font-size:11px}.warning strong{font-size:13px}.foot{position:absolute;left:34px;bottom:24px;color:#8fb6c4;font-size:12px}.empty{color:#8fb6c4;padding:30px}</style></head><body><main class="frame" data-scene-id="${escapePreviewText(scene.sceneId)}" data-phase="${numeric(options.phase)}"><div class="meta"><span>Scene ${scene.order} · ${escapePreviewText(scene.beatType)}</span><span>${escapePreviewText(scene.primaryVisualStrategy)}</span></div><h1 class="caption">${escapePreviewText(scene.keyCaption)}</h1><section class="visual" aria-label="Evidence-first local preview visual">${primaryMarkup(scene)}</section>${characterMarkup(scene, pose)}${unresolved}<div class="subtitle">${escapePreviewText(cue)}<small>ESTIMATED_NOT_AUDIO_ALIGNED</small></div><div class="foot">540×960 LOCAL PREVIEW · SILENT PLACEHOLDER AUDIO · NOT PUBLIC READY${options.frameLabel ? ` · ${escapePreviewText(options.frameLabel)}` : ""}</div></main></body></html>`;
  const validation = validatePreviewMarkup(markup);
  if (!validation.valid) throw new Error(`LOCAL_PREVIEW_MARKUP_UNSAFE:${validation.issues.join(",")}`);
  return markup;
}

export function validatePreviewMarkup(markup: string): { readonly valid: boolean; readonly issues: readonly string[] } {
  const issues: string[] = [];
  const forbiddenElements: readonly [RegExp, string][] = [
    [/<script\b/iu, "script_tag"],
    [/<(?:img|link|iframe|object|embed)\b/iu, "external_or_embedded_element"],
  ];
  forbiddenElements.forEach(([pattern, code]) => { if (pattern.test(markup)) issues.push(code); });
  const tags = markup.match(/<[a-z][^>]*>/giu) ?? [];
  for (const tag of tags) {
    const attributePattern = /\s+([a-z_:][a-z0-9_:.-]*)(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?/giu;
    for (const match of tag.matchAll(attributePattern)) {
      const name = match[1].toLowerCase();
      if (name === "href" || name === "src") issues.push("external_resource_attribute");
      if (name.startsWith("on")) issues.push("event_handler_attribute");
    }
  }
  const styleBlocks = [...markup.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/giu)].map((entry) => entry[1]);
  if (styleBlocks.some((style) => /@import\b/iu.test(style))) issues.push("css_import");
  if (!markup.startsWith("<!doctype html>")) issues.push("document_boundary_missing");
  return { valid: issues.length === 0, issues: [...new Set(issues)] };
}
