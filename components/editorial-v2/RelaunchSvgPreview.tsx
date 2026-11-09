import type { ProvisionalChannelIdentityDraft, RelaunchAssetPlan } from "../../lib/editorial-v2/contracts";

interface RelaunchSvgPreviewProps {
  readonly identityDraft: ProvisionalChannelIdentityDraft;
  readonly assetPlan: RelaunchAssetPlan;
}

function SignalMark({ x, y, scale = 1 }: { readonly x: number; readonly y: number; readonly scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} aria-hidden="true">
      <path d="M0 28 C20 -6 44 56 68 14 S112 2 128 30" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
      <circle cx="68" cy="14" r="10" fill="#56d6c9" stroke="#071a2d" strokeWidth="4" />
      <path d="M102 46 l14 -13 8 18" fill="none" stroke="#ffd166" strokeWidth="7" strokeLinecap="round" />
    </g>
  );
}

function SafeGuide({ x, y, width, height }: { readonly x: number; readonly y: number; readonly width: number; readonly height: number }) {
  return <rect x={x} y={y} width={width} height={height} rx="14" fill="none" stroke="#9fb3c8" strokeWidth="2" strokeDasharray="10 8" aria-hidden="true" />;
}

export default function RelaunchSvgPreview({ identityDraft, assetPlan }: RelaunchSvgPreviewProps) {
  const name = identityDraft.channelDisplayNameCandidate || "PROVISIONAL NAME";
  const promise = identityDraft.oneLinePromise || "SOURCE-FIRST ECONOMY BRIEF";
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 16 }}>
      <figure>
        <svg viewBox="0 0 320 320" role="img" aria-label="Square profile concept preview only" style={{ width: "100%", borderRadius: 24, background: "#071a2d", color: "#8ae8df" }}>
          <SafeGuide x={28} y={28} width={264} height={264} />
          <circle cx="160" cy="150" r="92" fill="#102f4f" stroke="#56d6c9" strokeWidth="6" />
          <SignalMark x={92} y={102} scale={1.05} />
          <text x="160" y="250" textAnchor="middle" fill="#f5f8fb" fontFamily="system-ui, sans-serif" fontSize="18" fontWeight="700">{assetPlan.profile.badgeText}</text>
        </svg>
        <figcaption>Square profile concept · SVG preview only</figcaption>
      </figure>

      <figure>
        <svg viewBox="0 0 320 568" role="img" aria-label="Vertical cover title card preview only" style={{ width: "100%", borderRadius: 24, background: "#f1f5f7", color: "#0b365a" }}>
          <SafeGuide x={28} y={48} width={264} height={472} />
          <rect x="44" y="74" width="170" height="34" rx="17" fill="#0b365a" />
          <text x="129" y="97" textAnchor="middle" fill="#fff" fontFamily="system-ui, sans-serif" fontSize="14" fontWeight="700">SOURCE FIRST</text>
          <text x="44" y="168" fill="#071a2d" fontFamily="system-ui, sans-serif" fontSize="30" fontWeight="800">{name.slice(0, 16)}</text>
          <foreignObject x="44" y="190" width="232" height="120">
            <div style={{ font: "700 23px/1.35 system-ui, sans-serif", color: "#0b365a" }}>{assetPlan.verticalCover.coverTitle}</div>
          </foreignObject>
          <g transform="translate(54 358)"><SignalMark x={0} y={0} scale={1.35} /></g>
          <text x="44" y="492" fill="#526779" fontFamily="system-ui, sans-serif" fontSize="13">PROVISIONAL · NOT A PRODUCTION ASSET</text>
        </svg>
        <figcaption>Vertical cover/title card · safe-area guide</figcaption>
      </figure>

      <figure style={{ gridColumn: "span 2" }}>
        <svg viewBox="0 0 960 270" role="img" aria-label="YouTube banner safe concept preview only" style={{ width: "100%", borderRadius: 24, background: "#071a2d", color: "#8ae8df" }}>
          <SafeGuide x={180} y={38} width={600} height={194} />
          <SignalMark x={218} y={84} scale={1.1} />
          <text x="410" y="108" fill="#fff" fontFamily="system-ui, sans-serif" fontSize="34" fontWeight="800">{name.slice(0, 24)}</text>
          <text x="410" y="150" fill="#8ae8df" fontFamily="system-ui, sans-serif" fontSize="18">{promise.slice(0, 52)}</text>
          <text x="410" y="190" fill="#9fb3c8" fontFamily="system-ui, sans-serif" fontSize="13">BANNER-SAFE CONCEPT · FINAL BRAND NOT APPROVED</text>
        </svg>
        <figcaption>YouTube banner-safe concept · internal SVG primitives</figcaption>
      </figure>

      <figure>
        <svg viewBox="0 0 420 420" role="img" aria-label="Pinned relaunch post cover preview only" style={{ width: "100%", borderRadius: 24, background: "#fff8e6", color: "#0b365a" }}>
          <SafeGuide x={34} y={34} width={352} height={352} />
          <rect x="56" y="58" width="148" height="30" rx="15" fill="#ffd166" />
          <text x="130" y="79" textAnchor="middle" fill="#071a2d" fontFamily="system-ui, sans-serif" fontSize="13" fontWeight="800">RELAUNCH DRAFT</text>
          <text x="56" y="146" fill="#071a2d" fontFamily="system-ui, sans-serif" fontSize="30" fontWeight="800">새 편집 원칙</text>
          <foreignObject x="56" y="174" width="308" height="100">
            <div style={{ font: "600 20px/1.4 system-ui, sans-serif", color: "#0b365a" }}>{promise}</div>
          </foreignObject>
          <SignalMark x={58} y={302} scale={0.9} />
        </svg>
        <figcaption>Pinned post cover · actual public post 아님</figcaption>
      </figure>
    </div>
  );
}
