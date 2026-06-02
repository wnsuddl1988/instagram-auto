"use client";

/**
 * VoiceConfigPanel
 * emotional_story 카테고리 TTS 음성 후보 슬롯 목록 표시.
 *
 * - isReady=false (voiceId 미설정) 항목은 "voiceId 필요" 상태로 비활성화
 * - ALLOW_ELEVENLABS=false면 ElevenLabs 슬롯 전체에 경고 배너 표시
 * - 실제 API 호출 없음 — 설정 확인용 읽기 전용 패널
 */

import { getVoiceCandidates, type VoiceCandidate } from "@/lib/voiceConfig";

// ── Props ─────────────────────────────────────────────────────────────────────

interface VoiceConfigPanelProps {
  /** 카테고리 (기본: emotional_story) */
  referenceStyle?: string;
  /** 선택된 후보 ID */
  selectedId?: string;
  /** 후보 선택 콜백 — isReady=true인 항목만 호출됨 */
  onSelect?: (candidateId: string) => void;
  /** ALLOW_ELEVENLABS 환경변수 값 */
  allowElevenLabs?: boolean;
  /** ALLOW_OPENAI_TTS 환경변수 값 — true면 OpenAI 후보 테스트 버튼 활성화 */
  allowOpenAITts?: boolean;
  /** 샘플 생성 콜백 — 활성 후보에서 "샘플 생성" 클릭 시 호출 */
  onTest?: (candidateId: string) => void | Promise<void>;
  /** 현재 테스트 중인 candidateId (로딩 스피너 표시용) */
  testingId?: string | null;
}

// ── 컴포넌트 ──────────────────────────────────────────────────────────────────

export default function VoiceConfigPanel({
  referenceStyle = "emotional_story",
  selectedId,
  onSelect,
  allowElevenLabs = false,
  allowOpenAITts = false,
  onTest,
  testingId,
}: VoiceConfigPanelProps) {
  const candidates = getVoiceCandidates(referenceStyle);

  const hasElevenLabsSlots = candidates.some((c) => c.provider === "elevenlabs");

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-700 p-4 space-y-3">
      {/* ── 헤더 ── */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-300">🎙 TTS 음성 후보</span>
        <span className="text-xs text-gray-600">{referenceStyle}</span>
      </div>

      {/* ── ElevenLabs 비활성 경고 ── */}
      {hasElevenLabsSlots && !allowElevenLabs && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-yellow-950/40 border border-yellow-800/60 text-xs text-yellow-400">
          <span className="flex-shrink-0 mt-0.5">⚠️</span>
          <span>
            <strong>ALLOW_ELEVENLABS=false</strong> — ElevenLabs 슬롯은 환경변수가 활성화된 후에만 사용할 수 있습니다.
          </span>
        </div>
      )}

      {/* ── 후보 목록 ── */}
      <div className="space-y-2">
        {candidates.map((c) => (
          <VoiceCandidateCard
            key={c.id}
            candidate={c}
            isSelected={selectedId === c.id}
            allowElevenLabs={allowElevenLabs}
            allowOpenAITts={allowOpenAITts}
            onSelect={onSelect}
            onTest={onTest}
            isTesting={testingId === c.id}
          />
        ))}
      </div>

      {candidates.length === 0 && (
        <p className="text-xs text-gray-600 text-center py-4">
          이 카테고리에 등록된 음성 후보가 없습니다.
        </p>
      )}
    </div>
  );
}

// ── 카드 서브컴포넌트 ──────────────────────────────────────────────────────────

interface CardProps {
  candidate: VoiceCandidate;
  isSelected: boolean;
  allowElevenLabs: boolean;
  allowOpenAITts: boolean;
  onSelect?: (id: string) => void;
  onTest?: (candidateId: string) => void | Promise<void>;
  isTesting: boolean;
}

function VoiceCandidateCard({
  candidate: c,
  isSelected,
  allowElevenLabs,
  allowOpenAITts,
  onSelect,
  onTest,
  isTesting,
}: CardProps) {
  const isElevenLabs = c.provider === "elevenlabs";

  // 실제로 선택 가능한지 판단
  const isDisabled =
    !c.isReady ||                          // voiceId 미설정
    (isElevenLabs && !allowElevenLabs);    // ALLOW_ELEVENLABS=false

  const missingVoiceId = isElevenLabs && !c.elevenLabsVoiceId;

  // ── 테스트 버튼 활성 조건 ──────────────────────────────────────────────────
  // OpenAI: isReady=true + allowOpenAITts=true
  // ElevenLabs: isReady=true + allowElevenLabs=true + voiceId 있음
  const canTest =
    !isElevenLabs
      ? (c.isReady && allowOpenAITts)
      : (c.isReady && allowElevenLabs && !!c.elevenLabsVoiceId);

  function handleClick() {
    if (isDisabled || !onSelect) return;
    onSelect(c.id);
  }

  function handleTest(e: React.MouseEvent) {
    e.stopPropagation(); // 카드 선택 이벤트와 분리
    if (!canTest || isTesting || !onTest) return;
    const providerLabel = isElevenLabs ? "ElevenLabs" : "OpenAI";
    const confirmed = window.confirm(
      `⚠️ 유료 API 호출\n\n[${providerLabel}] "${c.label}" 샘플을 생성합니다.\n실제 비용이 청구됩니다. 계속하시겠습니까?`
    );
    if (!confirmed) return;
    onTest(c.id);
  }

  const isDeprecated = !!c.deprecated;

  // 프로바이더별 좌측 강조 색상 — recommended면 amber로 강조
  const accentBorder =
    c.recommended
      ? "border-l-amber-500"
      : isElevenLabs
      ? "border-l-purple-700"
      : "border-l-sky-700";

  return (
    <div
      onClick={handleClick}
      className={[
        "relative rounded-lg border border-l-4 px-3 py-2.5 transition-colors",
        accentBorder,
        isDeprecated
          ? "opacity-40 cursor-not-allowed border-gray-800 bg-gray-900"
          : isDisabled
          ? "border-gray-800 bg-gray-900 opacity-60 cursor-not-allowed"
          : isSelected
          ? "border-blue-500 bg-blue-950/30 cursor-pointer"
          : c.recommended
          ? "border-amber-700/60 bg-amber-950/10 cursor-pointer hover:bg-amber-950/20"
          : "border-gray-700 bg-gray-800/50 cursor-pointer hover:border-gray-500 hover:bg-gray-800",
      ].join(" ")}
    >
      {/* ── 상단 행 ── */}
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-2 min-w-0">
          {/* 선택 인디케이터 */}
          <span
            className={[
              "flex-shrink-0 w-2 h-2 rounded-full",
              isDisabled
                ? "bg-gray-700"
                : isSelected
                ? "bg-blue-400"
                : "bg-gray-600",
            ].join(" ")}
          />
          <span
            className={[
              "text-sm font-medium truncate",
              isDisabled ? "text-gray-500" : "text-gray-200",
            ].join(" ")}
          >
            {c.label}
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* 제공자 뱃지 */}
          <span
            className={[
              "text-xs px-1.5 py-0.5 rounded font-mono",
              isElevenLabs
                ? "bg-purple-950/60 text-purple-400 border border-purple-800/60"
                : "bg-sky-950/60 text-sky-400 border border-sky-800/60",
            ].join(" ")}
          >
            {isElevenLabs ? "ElevenLabs" : "OpenAI"}
          </span>

          {/* 추천 배지 */}
          {c.recommended && !isDeprecated && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-700/60 text-amber-400 whitespace-nowrap font-semibold">
              ★ OpenAI 임시 1순위
            </span>
          )}

          {/* 비추천 배지 */}
          {isDeprecated && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-gray-800/60 border border-gray-700/40 text-gray-500 whitespace-nowrap">
              감동사연 비추천
            </span>
          )}

          {/* 상태 뱃지 — deprecated면 숨김 */}
          {!isDeprecated && missingVoiceId ? (
            <span className="text-xs px-1.5 py-0.5 rounded bg-red-950/60 border border-red-800/60 text-red-400 whitespace-nowrap">
              voiceId 필요
            </span>
          ) : isElevenLabs && !allowElevenLabs ? (
            <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-950/60 border border-yellow-800/60 text-yellow-500 whitespace-nowrap">
              차단됨
            </span>
          ) : c.isReady ? (
            <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 whitespace-nowrap">
              사용 가능
            </span>
          ) : null}
        </div>
      </div>

      {/* ── 설명 ── */}
      <p className={["text-xs leading-relaxed", isDisabled || isDeprecated ? "text-gray-600" : "text-gray-400"].join(" ")}>
        {c.description}
      </p>

      {/* ── 비추천 이유 (deprecated=true일 때만) ── */}
      {isDeprecated && c.deprecatedReason && (
        <p className="text-xs mt-0.5 text-gray-600 italic">
          ⚠️ {c.deprecatedReason}
        </p>
      )}

      {/* ── 추천 사용처 ── */}
      {!isDeprecated && (
        <p className={["text-xs mt-1", isDisabled ? "text-gray-700" : "text-gray-500"].join(" ")}>
          📌 {c.recommendedUse}
        </p>
      )}

      {/* ── 파라미터 요약 ── */}
      <div className="flex flex-wrap gap-2 mt-2">
        {c.provider === "openai" && (
          <>
            {c.openaiVoice && (
              <Param label="voice" value={c.openaiVoice} disabled={isDisabled} />
            )}
            {c.openaiSpeed != null && (
              <Param label="speed" value={String(c.openaiSpeed)} disabled={isDisabled} />
            )}
            {c.openaiModel && (
              <Param label="model" value={c.openaiModel} disabled={isDisabled} />
            )}
          </>
        )}
        {c.provider === "elevenlabs" && (
          <>
            <Param
              label="voiceId"
              value={c.elevenLabsVoiceId ?? "—"}
              disabled={isDisabled}
              highlight={!c.elevenLabsVoiceId}
            />
            {c.elevenLabsStability != null && (
              <Param label="stability" value={String(c.elevenLabsStability)} disabled={isDisabled} />
            )}
            {c.elevenLabsSimilarityBoost != null && (
              <Param label="similarity" value={String(c.elevenLabsSimilarityBoost)} disabled={isDisabled} />
            )}
            {c.elevenLabsStyle != null && (
              <Param label="style" value={String(c.elevenLabsStyle)} disabled={isDisabled} />
            )}
          </>
        )}
      </div>

      {/* ── 샘플 문장 (previewText) — deprecated면 숨김 ── */}
      {c.previewText && !isDeprecated && (
        <div className={[
          "mt-2 px-2 py-1.5 rounded border-l-2 text-xs leading-relaxed",
          isDisabled
            ? "border-gray-700 text-gray-600 bg-gray-800/30"
            : "border-blue-700/60 text-gray-400 bg-blue-950/10",
        ].join(" ")}>
          <span className={isDisabled ? "text-gray-700" : "text-gray-600"}>🗣 샘플: </span>
          <span className="italic">&ldquo;{c.previewText}&rdquo;</span>
        </div>
      )}

      {/* ── 테스트 버튼 — deprecated면 숨김 ── */}
      {!isDeprecated && <div className="mt-2 flex items-center gap-2">
        {isTesting ? (
          <button
            disabled
            className="text-xs px-2.5 py-1 rounded border border-blue-800/60 text-blue-400 bg-blue-950/30 cursor-not-allowed animate-pulse"
          >
            ⏳ 생성 중...
          </button>
        ) : canTest ? (
          <button
            onClick={handleTest}
            className="text-xs px-2.5 py-1 rounded border border-emerald-700/60 text-emerald-300 bg-emerald-950/30 hover:bg-emerald-900/40 transition-colors"
            title="샘플 음성을 생성합니다. 실제 비용이 청구됩니다."
          >
            🎧 샘플 생성
          </button>
        ) : (
          <button
            disabled
            title="유료 TTS 테스트는 별도 승인 후 실행 가능합니다. 현재 비활성."
            className="text-xs px-2.5 py-1 rounded border border-gray-700 text-gray-600 bg-gray-800/30 cursor-not-allowed opacity-60 select-none"
          >
            🔒 유료 승인 필요
          </button>
        )}
        {/* 비용 안내 문구 — 활성 상태일 때만 표시 */}
        {canTest && !isTesting && (
          <span className="text-xs text-yellow-600/80">유료 API 호출</span>
        )}
      </div>}

      {/* ── voiceId 설정 안내 (ElevenLabs 미설정 시) ── */}
      {!isDeprecated && missingVoiceId && (
        <p className="mt-1.5 text-xs text-gray-600 italic">
          lib/voiceConfig.ts의 <code className="text-gray-500">elevenLabsVoiceId</code> 필드에 ElevenLabs Voice ID를 입력하세요.
        </p>
      )}
    </div>
  );
}

// ── 파라미터 칩 ───────────────────────────────────────────────────────────────

function Param({
  label,
  value,
  disabled,
  highlight,
}: {
  label: string;
  value: string;
  disabled: boolean;
  highlight?: boolean;
}) {
  return (
    <span
      className={[
        "text-xs font-mono px-1.5 py-0.5 rounded",
        disabled
          ? "bg-gray-800 text-gray-600"
          : highlight
          ? "bg-red-950/40 border border-red-800/40 text-red-500"
          : "bg-gray-700/80 text-gray-400",
      ].join(" ")}
    >
      {label}:{value}
    </span>
  );
}
