import type { MoneyShortsScenePackage } from "@/lib/source-facts/signal-translation-generator";
import type {
  CaptionSafeZone,
  SceneCard,
  SceneCardGenerationValidationResult,
  SignalTranslationBrief,
} from "@/lib/source-facts/signal-translation";

// ── QA helpers (structural/coverage inspection only — no semantic AI judgment) ──

interface SceneQaRow {
  sceneNumber: number;
  sceneRole: string;
  hasNarration: boolean;
  hasSpokenCaption: boolean;
  captionBlockCount: number;
  hasImagePrompt: boolean;
  hasVoiceTiming: boolean;
  hasLayoutSafeZone: boolean;
  sourceCitationCount: number;
  hasSourceNote: boolean;
  riskNoteCount: number;
}

function buildSceneQaRows(scenes: SceneCard[]): SceneQaRow[] {
  return scenes.map((s) => ({
    sceneNumber: s.sceneNumber,
    sceneRole: s.sceneRole,
    hasNarration: s.narration.trim().length > 0,
    hasSpokenCaption: s.spokenCaption.trim().length > 0,
    captionBlockCount: s.captionBlocks.length,
    hasImagePrompt: s.imagePrompt.trim().length > 0,
    hasVoiceTiming: true, // always present by type (required field)
    hasLayoutSafeZone: true, // always present by type (required field)
    sourceCitationCount: s.sourceCitationIds.length,
    hasSourceNote: typeof s.sourceNote === "string" && s.sourceNote.trim().length > 0,
    riskNoteCount: s.riskNotes.length,
  }));
}

interface PackageQaSummary {
  sceneCount: number;
  sceneValidationOk: boolean;
  citationValidationOk: boolean;
  captionBlocksCoverage: number; // scenes with ≥1 captionBlock
  imagePromptCoverage: number;  // scenes with non-empty imagePrompt
  voiceTimingCoverage: number;  // always = sceneCount (required field)
  layoutSafeZoneCoverage: number; // always = sceneCount (required field)
  sourceCitationCoverage: number; // scenes with ≥1 sourceCitationId
  sourceNoteCoverage: number;   // scenes with non-empty sourceNote
  riskNotesCoverage: number;    // scenes with ≥1 riskNote
}

function buildPackageQaSummary(pkg: MoneyShortsScenePackage): PackageQaSummary {
  const scenes = pkg.sceneCards;
  const n = scenes.length;
  return {
    sceneCount: n,
    sceneValidationOk: pkg.sceneCardValidation.isValid,
    citationValidationOk: pkg.citationValidation.isValid,
    captionBlocksCoverage: scenes.filter((s) => s.captionBlocks.length > 0).length,
    imagePromptCoverage: scenes.filter((s) => s.imagePrompt.trim().length > 0).length,
    voiceTimingCoverage: n,
    layoutSafeZoneCoverage: n,
    sourceCitationCoverage: scenes.filter((s) => s.sourceCitationIds.length > 0).length,
    sourceNoteCoverage: scenes.filter((s) => typeof s.sourceNote === "string" && s.sourceNote.trim().length > 0).length,
    riskNotesCoverage: scenes.filter((s) => s.riskNotes.length > 0).length,
  };
}

interface SignalTranslationPreviewPanelProps {
  packages: MoneyShortsScenePackage[];
}

function StatusBadge({
  ok,
  passLabel = "VALID",
  failLabel = "CHECK",
}: {
  ok: boolean;
  passLabel?: string;
  failLabel?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded border px-2 py-0.5 text-[11px] font-bold ${
        ok
          ? "border-emerald-700/50 bg-emerald-900/20 text-emerald-300"
          : "border-amber-700/50 bg-amber-900/20 text-amber-300"
      }`}
    >
      {ok ? passLabel : failLabel}
    </span>
  );
}

function MiniLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-1 text-[11px] font-bold uppercase tracking-widest text-slate-500">
      {children}
    </div>
  );
}

function ValueRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="grid gap-1 border-b border-slate-800/60 py-1.5 last:border-0 sm:grid-cols-[160px_1fr]">
      <span className="text-xs text-slate-500">{label}</span>
      <span
        className={`min-w-0 break-words text-xs leading-relaxed ${
          mono ? "font-mono text-slate-300" : "text-slate-200"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function ChipList({ items, tone = "slate" }: { items: readonly string[]; tone?: "slate" | "amber" }) {
  if (items.length === 0) {
    return <span className="text-slate-600">none</span>;
  }

  const toneClass =
    tone === "amber"
      ? "border-amber-700/40 bg-amber-900/15 text-amber-200"
      : "border-slate-700/50 bg-slate-800/40 text-slate-300";

  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item, i) => (
        <span key={`${i}-${item}`} className={`rounded border px-2 py-0.5 text-[11px] ${toneClass}`}>
          {item}
        </span>
      ))}
    </div>
  );
}

function BulletList({ items }: { items: readonly string[] }) {
  if (items.length === 0) {
    return <span className="text-slate-600">none</span>;
  }

  return (
    <ul className="space-y-1">
      {items.map((item, i) => (
        <li key={`${i}-${item}`} className="flex gap-2">
          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-500" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function CoverageBar({
  label,
  count,
  total,
}: {
  label: string;
  count: number;
  total: number;
}) {
  const full = count === total;
  return (
    <div className="flex items-center justify-between gap-2 rounded border border-slate-800/60 bg-slate-900/40 px-2 py-1.5">
      <span className="min-w-0 truncate text-[11px] text-slate-400">{label}</span>
      <span
        className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[11px] font-bold ${
          full
            ? "bg-emerald-900/30 text-emerald-300"
            : count === 0
              ? "bg-red-900/30 text-red-300"
              : "bg-amber-900/30 text-amber-300"
        }`}
      >
        {count}/{total}
      </span>
    </div>
  );
}

function PackageQaSummaryPanel({ pkg }: { pkg: MoneyShortsScenePackage }) {
  const qa = buildPackageQaSummary(pkg);
  const rows = buildSceneQaRows(pkg.sceneCards);

  return (
    <details className="rounded-lg border border-slate-700/50 bg-slate-950/30">
      <summary className="cursor-pointer px-4 py-3">
        <span className="inline-flex items-center gap-2">
          <span className="text-xs font-bold text-slate-200">
            Caption / Scene QA Coverage
          </span>
          <span className="rounded border border-slate-700/40 bg-slate-800/30 px-2 py-0.5 text-[11px] text-slate-400">
            display-only · structural inspection
          </span>
          <StatusBadge
            ok={
              qa.sceneValidationOk &&
              qa.citationValidationOk &&
              qa.captionBlocksCoverage === qa.sceneCount &&
              qa.imagePromptCoverage === qa.sceneCount &&
              qa.sourceCitationCoverage === qa.sceneCount
            }
            passLabel="FULL"
            failLabel="CHECK"
          />
        </span>
      </summary>

      <div className="border-t border-slate-800/60 px-4 pb-4 pt-3 space-y-4">
        {/* Package-level coverage */}
        <div>
          <MiniLabel>Package Coverage</MiniLabel>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            <CoverageBar label="scenes" count={qa.sceneCount} total={6} />
            <CoverageBar label="captionBlocks" count={qa.captionBlocksCoverage} total={qa.sceneCount} />
            <CoverageBar label="imagePrompt spec" count={qa.imagePromptCoverage} total={qa.sceneCount} />
            <CoverageBar label="voiceTiming spec" count={qa.voiceTimingCoverage} total={qa.sceneCount} />
            <CoverageBar label="layoutSafeZone" count={qa.layoutSafeZoneCoverage} total={qa.sceneCount} />
            <CoverageBar label="sourceCitationIds" count={qa.sourceCitationCoverage} total={qa.sceneCount} />
            <CoverageBar label="sourceNote" count={qa.sourceNoteCoverage} total={qa.sceneCount} />
            <CoverageBar label="riskNotes" count={qa.riskNotesCoverage} total={qa.sceneCount} />
          </div>
        </div>

        {/* Scene-level table */}
        <div>
          <MiniLabel>Per-Scene Checklist</MiniLabel>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-[11px]">
              <thead>
                <tr className="border-b border-slate-800/70">
                  <th className="py-1.5 pr-2 text-left font-bold text-slate-500">Scene</th>
                  <th className="py-1.5 pr-2 text-left font-bold text-slate-500">Role</th>
                  <th className="py-1.5 pr-2 text-center font-bold text-slate-500">Narr</th>
                  <th className="py-1.5 pr-2 text-center font-bold text-slate-500">Caption</th>
                  <th className="py-1.5 pr-2 text-center font-bold text-slate-500">CaptBlocks</th>
                  <th className="py-1.5 pr-2 text-center font-bold text-slate-500">ImgSpec</th>
                  <th className="py-1.5 pr-2 text-center font-bold text-slate-500">Voice</th>
                  <th className="py-1.5 pr-2 text-center font-bold text-slate-500">Layout</th>
                  <th className="py-1.5 pr-2 text-center font-bold text-slate-500">CitIds</th>
                  <th className="py-1.5 pr-2 text-center font-bold text-slate-500">SrcNote</th>
                  <th className="py-1.5 text-center font-bold text-slate-500">Risk</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.sceneNumber} className="border-b border-slate-800/40 last:border-0">
                    <td className="py-1.5 pr-2 font-mono text-slate-300">{row.sceneNumber}</td>
                    <td className="py-1.5 pr-2 text-slate-500">{row.sceneRole}</td>
                    <td className="py-1.5 pr-2 text-center">{row.hasNarration ? "✓" : <span className="text-red-400">✗</span>}</td>
                    <td className="py-1.5 pr-2 text-center">{row.hasSpokenCaption ? "✓" : <span className="text-red-400">✗</span>}</td>
                    <td className="py-1.5 pr-2 text-center font-mono text-slate-300">{row.captionBlockCount}</td>
                    <td className="py-1.5 pr-2 text-center">{row.hasImagePrompt ? "✓" : <span className="text-red-400">✗</span>}</td>
                    <td className="py-1.5 pr-2 text-center">{row.hasVoiceTiming ? "✓" : <span className="text-red-400">✗</span>}</td>
                    <td className="py-1.5 pr-2 text-center">{row.hasLayoutSafeZone ? "✓" : <span className="text-red-400">✗</span>}</td>
                    <td className="py-1.5 pr-2 text-center font-mono text-slate-300">{row.sourceCitationCount}</td>
                    <td className="py-1.5 pr-2 text-center">{row.hasSourceNote ? "✓" : <span className="text-slate-600">—</span>}</td>
                    <td className="py-1.5 text-center font-mono text-slate-300">{row.riskNoteCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[10px] text-slate-600">
            voiceTiming / layoutSafeZone은 타입상 required 필드. coverage 100%는 타입 보장에 의한 것이다.
          </p>
        </div>
      </div>
    </details>
  );
}

function ValidationSummary({
  label,
  result,
}: {
  label: string;
  result: SceneCardGenerationValidationResult;
}) {
  return (
    <div className="rounded-lg border border-slate-800/70 bg-slate-950/40 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-slate-300">{label}</span>
        <StatusBadge ok={result.isValid} />
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded border border-slate-800/60 bg-slate-900/40 px-2 py-1.5">
          <span className="text-slate-500">errors</span>
          <span className="ml-2 font-mono text-slate-200">{result.errors.length}</span>
        </div>
        <div className="rounded border border-slate-800/60 bg-slate-900/40 px-2 py-1.5">
          <span className="text-slate-500">warnings</span>
          <span className="ml-2 font-mono text-slate-200">{result.warnings.length}</span>
        </div>
      </div>
    </div>
  );
}

function SafeZoneLine({ label, zone }: { label: string; zone?: CaptionSafeZone }) {
  if (!zone) {
    return (
      <div className="text-[11px] text-slate-600">
        {label}: not used
      </div>
    );
  }

  const fontRange =
    zone.fontPxMin && zone.fontPxMax ? `, font ${zone.fontPxMin}-${zone.fontPxMax}px` : "";
  const maxLines = zone.maxLines ? `, max ${zone.maxLines} lines` : "";

  return (
    <div className="font-mono text-[11px] text-slate-400">
      {label}: x {zone.xMin}-{zone.xMax}, y {zone.yMin}-{zone.yMax}
      {fontRange}
      {maxLines}
    </div>
  );
}

function CaptionBlocksSummary({ scene }: { scene: SceneCard }) {
  return (
    <div className="space-y-1">
      {scene.captionBlocks.map((block) => (
        <div key={`${scene.sceneNumber}-${block.startSec}-${block.endSec}`} className="rounded border border-slate-800/60 bg-slate-950/40 px-2 py-1.5">
          <div className="font-mono text-[11px] text-amber-300">
            {block.startSec}s-{block.endSec}s
          </div>
          <div className="text-xs text-slate-200">{block.text}</div>
          {block.emphasisWords.length > 0 && (
            <div className="mt-1 text-[11px] text-slate-500">
              emphasis: {block.emphasisWords.join(", ")}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function VoiceTimingSummary({ scene }: { scene: SceneCard }) {
  return (
    <div className="space-y-1 text-xs">
      <div>
        <span className="text-slate-500">pace: </span>
        <span className="font-mono text-slate-200">{scene.voiceTiming.pace}</span>
      </div>
      <div>
        <span className="text-slate-500">emphasis: </span>
        <span className="text-slate-300">
          {scene.voiceTiming.emphasisWords.length > 0
            ? scene.voiceTiming.emphasisWords.join(", ")
            : "none"}
        </span>
      </div>
      <div>
        <span className="text-slate-500">pauses: </span>
        <span className="text-slate-300">
          {scene.voiceTiming.pauses.length > 0 ? scene.voiceTiming.pauses.join(", ") : "none"}
        </span>
      </div>
    </div>
  );
}

function BriefSummary({ brief }: { brief: SignalTranslationBrief }) {
  return (
    <details className="rounded-lg border border-slate-800/70 bg-slate-950/35">
      <summary className="cursor-pointer px-4 py-3">
        <span className="text-xs font-bold text-slate-300">Signal Translation Brief Summary</span>
      </summary>
      <div className="border-t border-slate-800/60 px-4 pb-4 pt-2">
        <ValueRow label="signalSummary" value={brief.signalSummary} />
        <ValueRow label="keyReasons" value={<BulletList items={brief.keyReasons} />} />
        <ValueRow label="expertInterpretation" value={brief.expertInterpretation} />
        <ValueRow label="affectedMoneyAreas" value={<ChipList items={brief.affectedMoneyAreas} />} />
        <ValueRow label="lifeImpact" value={brief.lifeImpact} />
        <ValueRow label="volatilityWatch" value={<BulletList items={brief.volatilityWatch} />} />
        <ValueRow
          label="scenarioBasedOutlook"
          value={
            <div className="space-y-1">
              {brief.scenarioBasedOutlook.map((scenario) => (
                <div key={`${scenario.direction}-${scenario.condition}`} className="rounded border border-slate-800/60 bg-slate-900/30 px-2 py-1.5">
                  <span className="font-mono text-amber-300">{scenario.direction}</span>
                  <span className="text-slate-500"> · {scenario.condition}</span>
                  <div className="text-slate-300">{scenario.viewerMeaning}</div>
                </div>
              ))}
            </div>
          }
        />
        <ValueRow label="recommendedActions" value={<BulletList items={brief.recommendedActions} />} />
        <ValueRow label="actionUrgency" value={brief.actionUrgency} mono />
        <ValueRow label="audienceSituation" value={brief.audienceSituation} />
        <ValueRow label="actionBoundaries" value={<BulletList items={brief.actionBoundaries} />} />
        <ValueRow label="viewerTakeaway" value={brief.viewerTakeaway} />
        <ValueRow label="sourceCitationIds" value={<ChipList items={brief.sourceCitationIds} />} mono />
        <ValueRow label="riskNotes" value={<BulletList items={brief.riskNotes} />} />
      </div>
    </details>
  );
}

function OwnerFocus({ brief }: { brief: SignalTranslationBrief }) {
  return (
    <div className="grid gap-3 lg:grid-cols-3">
      <div className="rounded-lg border border-amber-700/40 bg-amber-900/15 p-3">
        <MiniLabel>Viewer Takeaway</MiniLabel>
        <p className="text-sm font-semibold leading-relaxed text-amber-100">{brief.viewerTakeaway}</p>
      </div>
      <div className="rounded-lg border border-emerald-700/40 bg-emerald-900/15 p-3">
        <MiniLabel>Recommended Actions</MiniLabel>
        <div className="text-xs text-emerald-100/85">
          <BulletList items={brief.recommendedActions} />
        </div>
      </div>
      <div className="rounded-lg border border-red-700/40 bg-red-900/15 p-3">
        <MiniLabel>Action Boundaries / Do Not Overclaim</MiniLabel>
        <div className="space-y-2 text-xs text-red-100/80">
          <BulletList items={brief.actionBoundaries} />
          <div className="border-t border-red-800/40 pt-2">
            <BulletList items={brief.doNotOverclaimActions} />
          </div>
        </div>
      </div>
    </div>
  );
}

function SceneCardPreviewItem({ scene }: { scene: SceneCard }) {
  return (
    <details className="rounded-lg border border-slate-800/70 bg-slate-950/35" open={scene.sceneNumber === 1}>
      <summary className="cursor-pointer px-4 py-3">
        <div className="inline-flex flex-wrap items-center gap-2">
          <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-[11px] text-slate-300">
            Scene {scene.sceneNumber}
          </span>
          <span className="text-sm font-bold text-slate-100">{scene.sceneLabel}</span>
          <span className="font-mono text-[11px] text-slate-500">{scene.sceneRole}</span>
          <span className="rounded border border-slate-700/60 px-2 py-0.5 font-mono text-[11px] text-slate-400">
            {scene.durationSec}s
          </span>
        </div>
      </summary>
      <div className="border-t border-slate-800/60 px-4 pb-4 pt-2">
        <ValueRow label="sceneGoal" value={scene.sceneGoal} />
        <ValueRow label="narration" value={scene.narration} />
        <ValueRow label="spokenCaption" value={scene.spokenCaption} />
        {scene.hookTitle && <ValueRow label="hookTitle" value={scene.hookTitle} />}
        <ValueRow label="screenText" value={<ChipList items={scene.screenText} tone="amber" />} />
        <ValueRow label="visualTemplateId" value={scene.visualTemplateId} mono />
        <ValueRow label="visualObjects" value={<ChipList items={scene.visualObjects} />} />
        <ValueRow
          label="imagePrompt spec"
          value={
            <div>
              <p>{scene.imagePrompt}</p>
              <p className="mt-1 text-[11px] text-slate-500">
                Asset generation spec only. 실제 이미지가 생성됐다는 의미가 아닙니다.
              </p>
            </div>
          }
        />
        <ValueRow label="captionBlocks" value={<CaptionBlocksSummary scene={scene} />} />
        <ValueRow label="voiceTiming spec" value={<VoiceTimingSummary scene={scene} />} />
        <ValueRow
          label="layoutSafeZone"
          value={
            <div className="space-y-0.5">
              <SafeZoneLine label="hookTitle" zone={scene.layoutSafeZone.hookTitle} />
              <SafeZoneLine label="spokenCaption" zone={scene.layoutSafeZone.spokenCaption} />
              <SafeZoneLine label="sourceNote" zone={scene.layoutSafeZone.sourceNote} />
            </div>
          }
        />
        <ValueRow
          label="imageTextPolicy"
          value={
            <div className="space-y-1">
              <div>
                <span className="text-slate-500">allowed: </span>
                <span>{scene.imageTextPolicy.allowedText.length > 0 ? scene.imageTextPolicy.allowedText.join(", ") : "none"}</span>
              </div>
              <div>
                <span className="text-slate-500">forbidden: </span>
                <span>{scene.imageTextPolicy.forbiddenText.join(", ")}</span>
              </div>
            </div>
          }
        />
        <ValueRow label="sourceNote" value={scene.sourceNote ?? "none"} />
        <ValueRow label="sourceCitationIds" value={<ChipList items={scene.sourceCitationIds} />} mono />
        <ValueRow label="riskNotes" value={<BulletList items={scene.riskNotes} />} />
      </div>
    </details>
  );
}

function SceneCardsPreviewList({ scenes }: { scenes: SceneCard[] }) {
  return (
    <div className="space-y-2">
      <MiniLabel>Fixed 6 Scene Cards Preview</MiniLabel>
      {scenes.map((scene) => (
        <SceneCardPreviewItem key={`${scene.sceneNumber}-${scene.sceneRole}`} scene={scene} />
      ))}
    </div>
  );
}

export function SignalTranslationPreviewPanel({ packages }: SignalTranslationPreviewPanelProps) {
  return (
    <section className="rounded-lg border border-slate-700/60 bg-slate-900/35">
      <div className="border-b border-slate-800/70 bg-slate-900/60 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-100">
              Signal Translation / 6 Scene Cards Preview
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Display-only fixture inspection layer. 편집, 저장, asset 생성, render, upload는 수행하지 않습니다.
            </p>
          </div>
          <span className="rounded border border-amber-700/40 bg-amber-900/15 px-2 py-1 text-[11px] font-bold text-amber-200">
            MOCK / NOT PUBLISHABLE
          </span>
        </div>
      </div>

      <div className="space-y-5 p-4">
        <div className="rounded-lg border border-slate-800/70 bg-slate-950/30 px-3 py-2 text-xs leading-relaxed text-slate-400">
          이 패널은 Fact Card 이후의 생활경제 번역 layer를 눈으로 검토하기 위한 preview입니다.
          <span className="font-semibold text-slate-200"> imagePrompt</span>와
          <span className="font-semibold text-slate-200"> voiceTiming</span>은 생성 명세일 뿐이며, 실제 이미지나 음성이 생성된 상태를 뜻하지 않습니다.
        </div>

        {packages.map((scenePackage, packageIndex) => (
          <article key={scenePackage.id} className="rounded-lg border border-slate-800/70 bg-slate-950/20">
            <div className="border-b border-slate-800/70 px-4 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-[11px] text-slate-300">
                  Sample {packageIndex + 1}
                </span>
                <h3 className="text-sm font-bold text-slate-100">{scenePackage.templateId}</h3>
                <StatusBadge ok={scenePackage.sceneCardValidation.isValid && scenePackage.citationValidation.isValid} />
              </div>
              <p className="mt-1 font-mono text-[11px] text-slate-500">
                packageId: {scenePackage.id} · factCardId: {scenePackage.factCardId}
              </p>
            </div>

            <div className="space-y-4 p-4">
              <div className="grid gap-3 lg:grid-cols-4">
                <ValidationSummary label="Scene Card validation" result={scenePackage.sceneCardValidation} />
                <ValidationSummary label="Citation validation" result={scenePackage.citationValidation} />
                <div className="rounded-lg border border-slate-800/70 bg-slate-950/40 p-3 lg:col-span-2">
                  <MiniLabel>Package Warnings</MiniLabel>
                  <BulletList items={scenePackage.warnings} />
                </div>
              </div>

              <PackageQaSummaryPanel pkg={scenePackage} />
              <OwnerFocus brief={scenePackage.brief} />
              <BriefSummary brief={scenePackage.brief} />
              <SceneCardsPreviewList scenes={scenePackage.sceneCards} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
