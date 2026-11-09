"use client";

/**
 * ReelV2Studio — 운영용 릴스 생성 통합 UI
 *
 * 탭 3개:
 *   1. 생성  — 카테고리 선택 → 콘티 생성 → 렌더
 *   2. 목소리 — voice-test API로 MP3 샘플 비교 청취
 *   3. 결과  — 생성된 영상 플레이어
 */

import { useState, useEffect, useRef, useCallback } from "react";
import type { GeneratedReelV2 } from "@/lib/openai";
import ManualImageBridge, {
  type SceneForBridge,
  type ManualSceneStatus,
} from "@/components/ManualImageBridge";
import {
  readTopicHistory,
  appendTopicHistory,
  updateLastTopicEntry,
  isDuplicateTopic,
  getRecentTopics,
  clearTopicHistoryBySubTopic,
  clearAllTopicHistory,
  exportHistoryAsBlob,
  importAndMergeHistory,
  type TopicHistoryEntry,
} from "@/lib/topicHistory";
import {
  initPresetsIfEmpty,
  savePreset,
  updatePreset,
  deletePreset,
  type AccountPreset,
} from "@/lib/accountPresets";

// ── 타입 ─────────────────────────────────────────────────────────────────────

interface SubTopicMeta {
  id: string;
  name: string;
  description: string;
  seedExamples: string[];
  contentAngles: string[];
  targetSituations: string[];
  hookTemplates: string[];
}

interface CategoryMeta {
  id: string;
  name: string;
  emoji: string;
  description: string;
  duration: number;
  ttsProvider: string;
  openaiVoice: string;
  openaiModel?: string;
  openaiSpeed: number;
  openaiInstructions?: string;
  subTopics: SubTopicMeta[];
}

interface VoiceSample {
  label: string;
  url: string;
  provider: string;
  voice?: string;
  speed?: number;
  model?: string;
  instructions?: string;
  durationSec: number;
  error?: string;
}

interface AppliedVoice {
  label: string;
  voice: string;
  speed: number;
  model: string;
  instructions?: string;
  provider: string;
}

interface SceneSyncInfo {
  sceneNumber: number;
  caption: string;
  narration: string;
  durationSec: number;
  motion: string;
  imageProvider: string;
  hasImage?: boolean;
}

interface PlanWarning {
  severity: "info" | "warning" | "fixed";
  sceneNumber: number;
  message: string;
}

interface PaidApiBlockedInfo {
  error: string;
  paidApiBlocked: true;
  provider: string;
  operation: string;
  hint: string;
  requiredEnvVars: string[];
}

interface QualityScore {
  score: number;
  grade: "pass" | "review" | "fail";
  breakdown: { label: string; earned: number; max: number; pass: boolean }[];
}

type StudioTab = "generate" | "voice" | "result";
type GenStep = "idle" | "generating" | "generated" | "rendering" | "done" | "error";

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────

export default function ReelV2Studio() {
  // 탭
  const [tab, setTab] = useState<StudioTab>("generate");

  // 카테고리
  const [categories, setCategories] = useState<CategoryMeta[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<string>("");

  // 소주제 / 주제 모드
  const [selectedSubTopicId, setSelectedSubTopicId] = useState<string>("");
  const [topicMode, setTopicMode] = useState<"preset" | "custom" | "random">("preset");
  const [customTopic, setCustomTopic] = useState<string>("");
  const [seedExamplesExpanded, setSeedExamplesExpanded] = useState<boolean>(false);

  // 히스토리
  const [recentTopics, setRecentTopics] = useState<TopicHistoryEntry[]>([]);
  const [isDuplicate, setIsDuplicate] = useState<boolean>(false);
  const [importMsg, setImportMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // 계정 운영 프리셋
  const [presets, setPresets] = useState<AccountPreset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string>("");
  const [showPresetSaveForm, setShowPresetSaveForm] = useState<boolean>(false);
  const [newPresetName, setNewPresetName] = useState<string>("");
  const [newPresetDesc, setNewPresetDesc] = useState<string>("");
  // 편집 모드
  const [editingPresetId, setEditingPresetId] = useState<string>("");
  const [editForm, setEditForm] = useState<{
    name: string;
    description: string;
    targetAudience: string;
    toneMemo: string;
    bannedTopicsRaw: string;   // comma-separated 입력값
    preferredSubTopicIds: string[];
  }>({ name: "", description: "", targetAudience: "", toneMemo: "", bannedTopicsRaw: "", preferredSubTopicIds: [] });

  // 생성 흐름
  const [step, setStep] = useState<GenStep>("idle");
  const [plan, setPlan] = useState<GeneratedReelV2 | null>(null);
  const [renderId, setRenderId] = useState<string>("");
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [paidApiBlocked, setPaidApiBlocked] = useState<PaidApiBlockedInfo | null>(null);
  const [sceneSyncInfo, setSceneSyncInfo] = useState<SceneSyncInfo[]>([]);
  const [showSyncDebug, setShowSyncDebug] = useState(false);
  const [planWarnings, setPlanWarnings] = useState<PlanWarning[]>([]);
  const [qualityScore, setQualityScore] = useState<QualityScore | null>(null);
  const [forceRender, setForceRender] = useState(false); // fail 점수에도 강제 렌더

  // 수동 AI 이미지 생성 브리지
  const [bridgeScene, setBridgeScene] = useState<SceneForBridge | null>(null);
  // 브리지 패널 영역 ref — MVP 불러오기 후 자동 스크롤 대상
  const bridgePanelRef = useRef<HTMLDivElement>(null);
  // bridgeScene autoStart 플래그 — MVP 불러오기 직후 한 번만 true
  const [bridgeAutoStart, setBridgeAutoStart] = useState(false);
  // polling 전용 자동 시작 — 씬 전환 후 Chrome 재실행 없이 polling만 재시작
  const [bridgeAutoStartPollingOnly, setBridgeAutoStartPollingOnly] = useState(false);
  // 씬별 수동 이미지 상태 맵 { sceneNumber → status }
  const [manualSceneStatuses, setManualSceneStatuses] = useState<Record<number, ManualSceneStatus>>({});
  // 씬별 로컬 이미지 경로 맵 { sceneNumber → absolutePath }
  const [manualLocalImages, setManualLocalImages] = useState<Record<number, string>>({});

  // 심리 MVP 불러오기 상태
  const PSYCH_JOB_ID = "psychology_mvp_01";
  const [psychLoadMsg, setPsychLoadMsg] = useState<string>("");
  // MVP 불러오기 완료 여부 (Scene 1 이미지 만들기 버튼 표시 조건)
  const [psychLoaded, setPsychLoaded] = useState(false);

  // 무음 렌더 버튼 ref — 마지막 씬 승인 후 자동 스크롤 대상
  const silentRenderRef = useRef<HTMLDivElement>(null);

  // 무음 렌더 상태
  type ManualRenderStep = "idle" | "saving" | "rendering" | "done" | "error";
  const [manualRenderStep, setManualRenderStep] = useState<ManualRenderStep>("idle");
  const [manualRenderError, setManualRenderError] = useState<string>("");
  const [manualRenderVideoUrl, setManualRenderVideoUrl] = useState<string>("");

  // partial 렌더 실패 상태 (Imagen quota 소진 / 플랜 미활성 등)
  const [partialRenderError, setPartialRenderError] = useState<{
    imagenDailyQuotaExhausted?: boolean;
    // QA-27: Imagen 유료 플랜 미활성 — 같은 설정으로 재시도 금지
    imagenPlanRequired?: boolean;
    imageProviderBlocked?: boolean;
    blockedProvider?: string;
    blockReason?: "plan_required" | "quota_exhausted" | "unknown";
    recommendedNextActions?: string[];
    failedScenes: number[];
    partialPlanPath: string;
    partialOutputDir: string;
    generatedSceneCount: number;
    totalSceneCount: number;
    partialPlan?: GeneratedReelV2;
  } | null>(null);
  // 렌더 완료 후 경고 (길이 초과, fallback 씬 등)
  const [renderWarnings, setRenderWarnings] = useState<string[]>([]);

  // voice-test
  const [voiceText, setVoiceText] = useState<string>("");
  const [voiceSamples, setVoiceSamples] = useState<VoiceSample[]>([]);
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [playingLabel, setPlayingLabel] = useState<string>("");
  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({});

  // 보이스 오버라이드 (voice-test에서 "이 카테고리에 적용" 선택 시)
  const [appliedVoice, setAppliedVoice] = useState<AppliedVoice | null>(null);

  // 유료 API 전체 비활성 상태 초기 안내 (GET 메타 기반)
  const [paidApiDisabledWarning, setPaidApiDisabledWarning] = useState<string | null>(null);

  // 카테고리 목록 로드
  useEffect(() => {
    fetch("/api/generate-v2")
      .then((r) => r.json())
      .then((d) => {
        if (d.categories) {
          setCategories(d.categories);
          const firstCat = d.categories[0];
          setSelectedCatId(firstCat?.id ?? "");
          // 첫 번째 카테고리의 첫 소주제 자동 선택
          setSelectedSubTopicId(firstCat?.subTopics?.[0]?.id ?? "");
        }
        // 유료 API 비활성 상태 안내
        if (d.paidApiStatus && !d.paidApiStatus.masterEnabled) {
          setPaidApiDisabledWarning("현재 유료 API가 비활성화되어 있습니다. 콘티 생성/렌더링을 사용하려면 .env.local에 PAID_API_ENABLED=true를 설정하세요.");
        }
      })
      .catch(console.error);
  }, []);

  // 프리셋 초기화 (localStorage → 없으면 기본 3개 시드)
  useEffect(() => {
    setPresets(initPresetsIfEmpty());
  }, []);

  // 소주제/customTopic 변경 시 히스토리 + 중복 감지 갱신
  useEffect(() => {
    if (!selectedCatId || !selectedSubTopicId) {
      setRecentTopics([]);
      setIsDuplicate(false);
      return;
    }
    setRecentTopics(getRecentTopics(selectedCatId, selectedSubTopicId, 5));
    const checkTopic = customTopic.trim();
    setIsDuplicate(
      checkTopic
        ? isDuplicateTopic(checkTopic, selectedCatId, selectedSubTopicId)
        : false
    );
  }, [selectedCatId, selectedSubTopicId, customTopic]);

  const selectedCat = categories.find((c) => c.id === selectedCatId);
  const selectedSubTopic = selectedCat?.subTopics?.find((st) => st.id === selectedSubTopicId);
  const selectedPreset = presets.find((p) => p.id === selectedPresetId) ?? null;
  // 현재 카테고리 범위 내 선호 소주제 ID Set (다른 카테고리 프리셋 배지 잔류 방지)
  const preferredSubTopicSet = new Set(
    selectedPreset?.categoryId === selectedCatId
      ? selectedPreset.preferredSubTopicIds
      : []
  );

  // 카테고리 변경 시 소주제 초기화
  const handleCatChange = (catId: string) => {
    setSelectedCatId(catId);
    const cat = categories.find((c) => c.id === catId);
    setSelectedSubTopicId(cat?.subTopics?.[0]?.id ?? "");
    setSeedExamplesExpanded(false);
  };

  // ── 프리셋 선택 ─────────────────────────────────────────────────────────────
  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) return;
    // 카테고리 자동 선택
    setSelectedCatId(preset.categoryId);
    // 선호 소주제 첫 번째 자동 선택 (없으면 해당 카테고리 첫 번째)
    const cat = categories.find((c) => c.id === preset.categoryId);
    const firstPreferred = preset.preferredSubTopicIds[0];
    const validFirst = cat?.subTopics?.find((st) => st.id === firstPreferred)?.id
      ?? cat?.subTopics?.[0]?.id
      ?? "";
    setSelectedSubTopicId(validFirst);
    setSeedExamplesExpanded(false);
    setTopicMode("preset");
    setCustomTopic("");
  };

  // ── 프리셋 저장 ─────────────────────────────────────────────────────────────
  const handleSavePreset = () => {
    if (!newPresetName.trim() || !selectedCatId) return;
    const saved = savePreset({
      name: newPresetName.trim(),
      description: newPresetDesc.trim(),
      categoryId: selectedCatId,
      preferredSubTopicIds: selectedSubTopicId ? [selectedSubTopicId] : [],
      targetAudience: "",
      toneMemo: "",
      bannedTopics: [],
    });
    setPresets((prev) => [...prev, saved]);
    setSelectedPresetId(saved.id);
    setNewPresetName("");
    setNewPresetDesc("");
    setShowPresetSaveForm(false);
  };

  // ── 프리셋 삭제 ─────────────────────────────────────────────────────────────
  const handleDeletePreset = (id: string) => {
    if (!window.confirm("이 프리셋을 삭제할까요?")) return;
    deletePreset(id);
    setPresets((prev) => prev.filter((p) => p.id !== id));
    if (selectedPresetId === id) setSelectedPresetId("");
  };

  // ── 프리셋 편집 ─────────────────────────────────────────────────────────────
  const openEditForm = (preset: AccountPreset) => {
    setEditingPresetId(preset.id);
    setEditForm({
      name: preset.name,
      description: preset.description,
      targetAudience: preset.targetAudience,
      toneMemo: preset.toneMemo,
      bannedTopicsRaw: preset.bannedTopics.join(", "),
      preferredSubTopicIds: [...preset.preferredSubTopicIds],
    });
    setShowPresetSaveForm(false);
  };

  const closeEditForm = () => {
    setEditingPresetId("");
  };

  const handleSaveEdit = () => {
    if (!editingPresetId || !editForm.name.trim()) return;
    const bannedTopics = editForm.bannedTopicsRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    updatePreset(editingPresetId, {
      name: editForm.name.trim(),
      description: editForm.description.trim(),
      targetAudience: editForm.targetAudience.trim(),
      toneMemo: editForm.toneMemo.trim(),
      bannedTopics,
      preferredSubTopicIds: editForm.preferredSubTopicIds,
    });
    // 상태 즉시 반영
    setPresets((prev) =>
      prev.map((p) =>
        p.id === editingPresetId
          ? { ...p, name: editForm.name.trim(), description: editForm.description.trim(),
              targetAudience: editForm.targetAudience.trim(), toneMemo: editForm.toneMemo.trim(),
              bannedTopics, preferredSubTopicIds: editForm.preferredSubTopicIds,
              updatedAt: new Date().toISOString() }
          : p
      )
    );
    setEditingPresetId("");
  };

  const toggleEditSubTopic = (id: string) => {
    setEditForm((prev) => ({
      ...prev,
      preferredSubTopicIds: prev.preferredSubTopicIds.includes(id)
        ? prev.preferredSubTopicIds.filter((s) => s !== id)
        : [...prev.preferredSubTopicIds, id],
    }));
  };

  // ── 콘티 생성 ──────────────────────────────────────────────────────────────
  const handleGenerate = async (overrideTopicMode?: "preset" | "custom" | "random") => {
    if (!selectedCatId) return;
    const effectiveTopicMode = overrideTopicMode ?? topicMode;
    // custom 모드인데 customTopic이 비어있으면 preset으로 fallback
    const finalTopicMode =
      effectiveTopicMode === "custom" && !customTopic.trim() ? "preset" : effectiveTopicMode;

    setStep("generating");
    setErrorMsg("");
    setPaidApiBlocked(null);
    setPlan(null);
    setManualSceneStatuses({});
    setManualLocalImages({});
    try {
      const postBody: Record<string, unknown> = {
        categoryId: selectedCatId,
        topicMode: finalTopicMode,
      };
      if (finalTopicMode === "custom" && customTopic.trim()) {
        postBody.customTopic = customTopic.trim();
      } else if (finalTopicMode === "preset" && selectedSubTopicId) {
        postBody.subTopicId = selectedSubTopicId;
      }
      // 운영 프리셋이 선택된 경우 accountPreset 직렬화
      if (selectedPreset) {
        postBody.accountPreset = {
          id: selectedPreset.id,
          name: selectedPreset.name,
          description: selectedPreset.description,
          targetAudience: selectedPreset.targetAudience,
          toneMemo: selectedPreset.toneMemo,
          bannedTopics: selectedPreset.bannedTopics,
          preferredSubTopicIds: selectedPreset.preferredSubTopicIds,
        };
      }
      const res = await fetch("/api/generate-v2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postBody),
      });
      const data = await res.json();
      // 유료 API 차단 응답 처리
      if (res.status === 403 && data.paidApiBlocked) {
        setPaidApiBlocked(data as PaidApiBlockedInfo);
        setStep("idle");
        return;
      }
      if (!res.ok) throw new Error(data.error || "콘티 생성 실패");
      setPlan(data.plan);
      setPlanWarnings(data.warnings ?? []);
      setQualityScore(data.qualityScore ?? null);
      setForceRender(false);
      // ── 히스토리 저장 (유료 API 호출과 무관, 로컬 저장만) ────────────────
      {
        // custom이면 입력값 우선, preset/random이면 plan.topTitle 우선
        const planTitle: string = data.plan?.topTitle || data.plan?.title || "";
        const topicLabel =
          finalTopicMode === "custom" && customTopic.trim()
            ? customTopic.trim()
            : planTitle || (finalTopicMode === "preset"
                ? (selectedSubTopic?.name ?? selectedSubTopicId)
                : "random");
        // plan._meta에서 경량 스냅샷 추출
        const meta = data.plan?._meta;
        const metaSnapshot = meta ? {
          ...(meta.categoryName ? { categoryName: meta.categoryName } : {}),
          ...(meta.subTopicName ? { subTopicName: meta.subTopicName } : {}),
          ...(meta.concreteTopic ? { concreteTopic: meta.concreteTopic } : {}),
          ...(meta.customTopic ? { customTopic: meta.customTopic } : {}),
          ...(meta.accountPreset?.id ? { accountPresetId: meta.accountPreset.id } : {}),
          ...(meta.accountPreset?.name ? { accountPresetName: meta.accountPreset.name } : {}),
        } : undefined;
        appendTopicHistory({
          categoryId: selectedCatId,
          subTopicId: selectedSubTopicId,
          topicMode: finalTopicMode,
          topic: topicLabel,
          ...(metaSnapshot && Object.keys(metaSnapshot).length > 0 ? { metaSnapshot } : {}),
        });
        // preset/random에서 소주제명으로 먼저 저장했다가 plan.topTitle로 업데이트
        if (finalTopicMode !== "custom" && planTitle) {
          updateLastTopicEntry(selectedCatId, selectedSubTopicId, planTitle);
        }
        // 히스토리/중복 상태 즉시 갱신
        setRecentTopics(getRecentTopics(selectedCatId, selectedSubTopicId, 5));
        setIsDuplicate(false); // 방금 저장했으므로 경고 해제
      }
      setStep("generated");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : String(e));
      setStep("error");
    }
  };

  // ── 심리 MVP 01 불러오기 ────────────────────────────────────────────────────
  /**
   * psychology_mvp_01_script_final.json + ai_image_prompt_pack_v2.json 을
   * plan + imagePrompt 맵으로 조합하여 앱에 직접 세팅한다.
   * 외부 API 호출 없음 — 로컬 JSON 읽기 + load-state 복구만 수행.
   *
   * Scene 1: referenceImagePrompt.fullPrompt (기준 이미지 생성용)
   * Scene 2~5: editPromptUsingReferenceImage (reference edit 프롬프트)
   */

  // 상태 즉시 저장 — 씬 승인/거부 시 호출
  const savePsychState = async (
    currentScene: number,
    statuses: Record<number, ManualSceneStatus>,
    images: Record<number, string>
  ) => {
    try {
      const scenes = Array.from({ length: 5 }, (_, i) => ({
        sceneNumber: i + 1,
        status: statuses[i + 1] ?? "awaiting_user_generation",
        registeredLocalImagePath: images[i + 1] ?? null,
      }));
      await fetch("/api/manual-render?action=save-state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: PSYCH_JOB_ID,
          currentSceneNumber: currentScene,
          selectedProfileAlias: "GPT 1",
          scenes,
        }),
      });
    } catch {
      // 저장 실패는 조용히 무시 (사용자 작업 방해 금지)
    }
  };

  const handleLoadPsychMvp = async () => {
    setPsychLoadMsg("불러오는 중...");
    setErrorMsg("");

    try {
      const [scriptRes, packRes] = await Promise.all([
        fetch("/api/psych-mvp-data?file=script"),
        fetch("/api/psych-mvp-data?file=pack"),
      ]);
      if (!scriptRes.ok || !packRes.ok) {
        throw new Error("JSON 파일 로드 실패. /api/psych-mvp-data 확인 필요.");
      }
      const script = await scriptRes.json();
      const pack = await packRes.json();

      // ── GeneratedReelV2 형태로 변환 ─────────────────────────────────────
      // referenceImagePrompt.fullPrompt → Scene 1
      // scenes[n].editPromptUsingReferenceImage → Scene 2~5
      const scenePromptMap: Record<number, string> = {};
      scenePromptMap[1] = pack.referenceImagePrompt?.fullPrompt ?? "";
      for (const s of (pack.scenes ?? [])) {
        if (s.sceneNumber !== 1 && s.editPromptUsingReferenceImage) {
          scenePromptMap[s.sceneNumber] = s.editPromptUsingReferenceImage;
        }
      }

      const reelScenes = script.scenes.map((sc: {
        sceneNumber: number;
        narration: string;
        caption: string;
        motion?: string;
        duration?: number;
      }) => ({
        sceneNumber: sc.sceneNumber,
        durationSec: sc.duration ?? 6,
        narration: sc.narration,
        caption: sc.caption,
        emphasis: sc.caption,
        imagePrompt: scenePromptMap[sc.sceneNumber] ?? "",
        fallbackSearchQuery: sc.caption,
        motion: (sc.motion as "slow_zoom_in" | "slow_zoom_out" | "pan_left" | "pan_right" | "hold") ?? "hold",
      }));

      const loadedPlan = {
        title: script.title,
        topTitle: script.title,
        subtitle: "",
        script: script.scenes.map((s: { narration: string }) => s.narration).join(" "),
        hook: script.scenes[0]?.narration ?? "",
        callToAction: script.scenes[script.scenes.length - 1]?.narration ?? "",
        hashtags: ["심리", "자존감", "관계"],
        targetAudience: "20~30대 한국인",
        visualStyle: "photorealistic cinematic 9:16",
        estimatedDuration: Math.round(script.totalEstimatedDuration ?? 32),
        scenes: reelScenes,
        _meta: {
          categoryId: "psychology_analysis",
          categoryName: "심리 분석",
          subTopicId: "psych_mvp_01",
          subTopicName: script.title,
          topicMode: "custom" as const,
          concreteTopic: script.title,
          generatedAt: new Date().toISOString(),
        },
        _categoryId: "psychology_analysis",
        _referenceStyle: "psychology_analysis",
      };

      // ── 상태 세팅 ────────────────────────────────────────────────────────
      setPlan(loadedPlan as import("@/lib/openai").GeneratedReelV2);
      setRenderId(PSYCH_JOB_ID);
      setManualSceneStatuses({});
      setManualLocalImages({});
      setManualRenderStep("idle");
      setManualRenderError("");
      setManualRenderVideoUrl("");
      setQualityScore(null);
      setForceRender(false);
      setStep("generated");

      // ── load-state 복구 ──────────────────────────────────────────────────
      let restoredCurrentScene = 1;
      let hasRestoredState = false;
      try {
        const stateRes = await fetch("/api/manual-render?action=load-state", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobId: PSYCH_JOB_ID }),
        });
        const stateData = await stateRes.json();
        if (stateData.found && stateData.state?.scenes) {
          const restoredStatuses: Record<number, ManualSceneStatus> = {};
          const restoredImages: Record<number, string> = {};
          for (const sc of stateData.state.scenes) {
            if (sc.status && sc.status !== "awaiting_user_generation") {
              restoredStatuses[sc.sceneNumber] = sc.status as ManualSceneStatus;
            }
            if (sc.registeredLocalImagePath) {
              restoredImages[sc.sceneNumber] = sc.registeredLocalImagePath;
            }
          }
          setManualSceneStatuses(restoredStatuses);
          setManualLocalImages(restoredImages);
          // 복구된 currentSceneNumber 사용 (없으면 첫 미승인 씬)
          if (stateData.state.currentSceneNumber) {
            restoredCurrentScene = stateData.state.currentSceneNumber;
          } else {
            // 첫 미승인 씬 계산
            const firstPending = loadedPlan.scenes.find(
              (sc: {sceneNumber?: number}) => !restoredStatuses[(sc.sceneNumber ?? 1)]
                || restoredStatuses[(sc.sceneNumber ?? 1)] === "awaiting_user_generation"
                || restoredStatuses[(sc.sceneNumber ?? 1)] === "rejected"
            );
            restoredCurrentScene = firstPending?.sceneNumber ?? loadedPlan.scenes.length;
          }
          hasRestoredState = Object.keys(restoredStatuses).length > 0;
          const acceptedCount = Object.values(restoredStatuses).filter(s => s === "accepted").length;
          setPsychLoadMsg(
            hasRestoredState
              ? `✅ 불러오기 완료 — ${acceptedCount}씬 승인 복구, Scene ${restoredCurrentScene}부터 이어서 작업`
              : "✅ 불러오기 완료 (새 작업)"
          );
        } else {
          setPsychLoadMsg("✅ 불러오기 완료 (새 작업 시작)");
        }
      } catch {
        setPsychLoadMsg("✅ 불러오기 완료 (상태 복구 건너뜀)");
      }

      // ── 불러오기 완료 후 브리지 씬 설정 ──────────────────────────────────
      setPsychLoaded(true);
      const targetScene = loadedPlan.scenes.find(
        (sc: {sceneNumber?: number}) => (sc.sceneNumber ?? 1) === restoredCurrentScene
      ) ?? loadedPlan.scenes[0];

      if (targetScene) {
        setBridgeScene({
          sceneNumber: targetScene.sceneNumber ?? restoredCurrentScene,
          caption: targetScene.caption,
          imagePrompt: targetScene.imagePrompt,
          localImagePath: null,
          manualStatus: undefined,
        });
        // 복구된 상태가 있으면 Chrome 자동 실행 금지 (autoStart=false)
        setBridgeAutoStart(!hasRestoredState);
        setTimeout(() => {
          bridgePanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 300);
      }
    } catch (e) {
      setPsychLoadMsg(`❌ 오류: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  // ── 수동 무음 렌더 ─────────────────────────────────────────────────────────
  const handleManualSilentRender = async () => {
    if (!plan) return;
    const jobId = renderId || "default-job";

    setManualRenderStep("saving");
    setManualRenderError("");
    setManualRenderVideoUrl("");

    // 1) render_plan.json + state.json 저장
    try {
      const saveRes = await fetch("/api/manual-render?action=save-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId,
          plan,
          manualLocalImages: Object.fromEntries(
            Object.entries(manualLocalImages).map(([k, v]) => [String(k), v])
          ),
          manualSceneStatuses: Object.fromEntries(
            Object.entries(manualSceneStatuses).map(([k, v]) => [String(k), v])
          ),
        }),
      });
      const saveData = await saveRes.json();
      if (!saveRes.ok) {
        const details = saveData.details ? `\n${(saveData.details as string[]).join("\n")}` : "";
        setManualRenderStep("error");
        setManualRenderError(`plan 저장 실패: ${saveData.error ?? "알 수 없는 오류"}${details}`);
        return;
      }
    } catch (e) {
      setManualRenderStep("error");
      setManualRenderError(`plan 저장 중 오류: ${String(e)}`);
      return;
    }

    // 2) 무음 렌더 실행
    setManualRenderStep("rendering");
    try {
      const renderRes = await fetch("/api/manual-render?action=render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });
      const renderData = await renderRes.json();
      if (!renderRes.ok) {
        setManualRenderStep("error");
        setManualRenderError(`렌더 실패: ${renderData.error ?? "알 수 없는 오류"}`);
        return;
      }
      setManualRenderVideoUrl(renderData.videoUrl ?? "");
      setManualRenderStep("done");
    } catch (e) {
      setManualRenderStep("error");
      setManualRenderError(`렌더 중 오류: ${String(e)}`);
    }
  };

  // ── 렌더 ───────────────────────────────────────────────────────────────────
  const handleRender = async (overridePlan?: GeneratedReelV2, overrideId?: string, overrideOpts?: Record<string, unknown>) => {
    if (!plan || !selectedCat) return;
    setStep("rendering");
    setErrorMsg("");
    setPaidApiBlocked(null);
    setPartialRenderError(null);
    const id = overrideId || `v2_${Date.now()}`;
    setRenderId(id);
    const renderPlan = overridePlan || plan;
    try {
      const res = await fetch("/api/render-v2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: renderPlan,
          id,
          categoryEmoji: selectedCat.emoji,
          ttsProvider: appliedVoice?.provider ?? selectedCat.ttsProvider,
          ttsVoice: appliedVoice?.voice ?? selectedCat.openaiVoice,
          ttsModel: appliedVoice?.model ?? selectedCat.openaiModel,
          ttsSpeed: appliedVoice?.speed ?? selectedCat.openaiSpeed,
          ttsInstructions: appliedVoice?.instructions ?? selectedCat.openaiInstructions,
          sceneTts: true,
          reuseLocalImages: true,
          allowProviderFallbackOnQuota: true,
          ...overrideOpts,
        }),
      });
      const data = await res.json();
      // 403: 유료 API 차단
      if (res.status === 403 && data.paidApiBlocked) {
        setPaidApiBlocked(data as PaidApiBlockedInfo);
        setStep("generated"); // 콘티는 유지
        return;
      }
      // 422: partial 실패 (이미지 생성 일부 실패 / Imagen 플랜 미활성)
      if (res.status === 422) {
        setPartialRenderError({
          imagenDailyQuotaExhausted: data.imagenDailyQuotaExhausted ?? false,
          // QA-27: 새 필드 반영
          imagenPlanRequired: data.imagenPlanRequired ?? false,
          imageProviderBlocked: data.imageProviderBlocked ?? false,
          blockedProvider: data.blockedProvider,
          blockReason: data.blockReason,
          recommendedNextActions: data.recommendedNextActions,
          failedScenes: data.failedScenes ?? [],
          partialPlanPath: data.partialPlanPath ?? "",
          partialOutputDir: data.partialOutputDir ?? "",
          generatedSceneCount: data.generatedSceneCount ?? 0,
          totalSceneCount: data.totalSceneCount ?? renderPlan.scenes.length,
        });
        setErrorMsg(data.error || "이미지 생성 실패 씬이 있습니다.");
        setStep("error");
        return;
      }
      if (!res.ok) throw new Error(data.error || "렌더 실패");
      setVideoUrl(data.videoUrl);
      if (data.plan) setPlan(data.plan);
      if (data.sceneSyncInfo) setSceneSyncInfo(data.sceneSyncInfo);
      // 렌더 완료 후 경고 수집
      const warns: string[] = [];
      if (data.durationWarning) warns.push(`⏱️ ${data.durationWarning}`);
      if (data.fallbackScenesUsed?.length > 0) warns.push(`🖼️ Pollinations fallback 사용 씬: ${data.fallbackScenesUsed.join(", ")} — 얼굴/텍스트 검수 권장`);
      setRenderWarnings(warns);
      setStep("done");
      setTab("result");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : String(e));
      setStep("error");
    }
  };

  // ── motion-only 재렌더 ─────────────────────────────────────────────────────
  const handleRerenderMotion = async () => {
    if (!plan || !renderId) return;
    setStep("rendering");
    setErrorMsg("");
    try {
      const res = await fetch("/api/render-v2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          id: renderId,
          rerenderMotionOnly: true,
          ...(selectedCat?.emoji ? { categoryEmoji: selectedCat.emoji } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "재렌더 실패");
      setVideoUrl(data.videoUrl + `?t=${Date.now()}`);
      if (data.sceneSyncInfo) setSceneSyncInfo(data.sceneSyncInfo);
      setStep("done");
      setTab("result");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : String(e));
      setStep("error");
    }
  };

  // ── voice-test ─────────────────────────────────────────────────────────────
  const handleVoiceTest = async () => {
    setVoiceLoading(true);
    setVoiceSamples([]);
    try {
      const res = await fetch("/api/voice-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: selectedCatId || undefined,
          text: voiceText.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "voice-test 실패");
      setVoiceSamples(data.samples || []);
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    } finally {
      setVoiceLoading(false);
    }
  };

  const handlePlay = (label: string) => {
    // 다른 오디오 정지
    Object.entries(audioRefs.current).forEach(([l, el]) => {
      if (l !== label && el) { el.pause(); el.currentTime = 0; }
    });
    const el = audioRefs.current[label];
    if (!el) return;
    if (playingLabel === label) {
      el.pause();
      setPlayingLabel("");
    } else {
      el.play();
      setPlayingLabel(label);
    }
  };

  // ── 렌더 ───────────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-5xl mx-auto">

      {/* 탭 바 */}
      <div className="flex gap-1 mb-6 bg-slate-900/60 rounded-2xl p-1.5 border border-slate-800/50">
        {(["generate", "voice", "result"] as StudioTab[]).map((t) => {
          const labels: Record<StudioTab, string> = {
            generate: "🎬 콘티 생성",
            voice: "🎙️ 목소리 비교",
            result: "📺 결과 영상",
          };
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                tab === t
                  ? "bg-indigo-600 text-white shadow-lg"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              {labels[t]}
            </button>
          );
        })}
      </div>

      {/* ── 탭 1: 콘티 생성 ── */}
      {tab === "generate" && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* 유료 API 비활성 전역 경고 배너 */}
          {paidApiDisabledWarning && (
            <div className="lg:col-span-5 rounded-xl bg-amber-900/20 border border-amber-700/40 px-4 py-3 flex items-start gap-3">
              <span className="text-amber-400 mt-0.5">🔒</span>
              <div className="flex-1 text-xs text-amber-200/80 leading-relaxed">{paidApiDisabledWarning}</div>
              <button onClick={() => setPaidApiDisabledWarning(null)} className="text-slate-600 hover:text-slate-400 text-xs shrink-0">✕</button>
            </div>
          )}

          {/* 카테고리 선택 (3/5) */}
          <div className="lg:col-span-3 flex flex-col gap-4">

            {/* 운영 프리셋 패널 */}
            <div className="glass-card rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold text-white">
                  <span className="text-purple-400 mr-2">⚡</span>운영 프리셋
                </h3>
                <button
                  type="button"
                  onClick={() => { setShowPresetSaveForm((v) => !v); setNewPresetName(""); setNewPresetDesc(""); }}
                  className="text-xs px-2.5 py-1 rounded-lg bg-slate-700/60 text-slate-300 hover:bg-slate-600/60 transition-colors"
                >
                  {showPresetSaveForm ? "취소" : "+ 현재 설정 저장"}
                </button>
              </div>

              {/* 프리셋 저장 폼 */}
              {showPresetSaveForm && (
                <div className="mb-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/40 space-y-2">
                  <p className="text-xs text-slate-400 font-medium">현재 선택: <span className="text-white">{categories.find(c => c.id === selectedCatId)?.name ?? "카테고리 미선택"}</span></p>
                  <input
                    type="text"
                    placeholder="프리셋 이름 (예: 50대 생활꿀팁 계정)"
                    value={newPresetName}
                    onChange={(e) => setNewPresetName(e.target.value)}
                    className="w-full bg-slate-900/60 border border-slate-700/50 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                  <input
                    type="text"
                    placeholder="설명 (선택 사항)"
                    value={newPresetDesc}
                    onChange={(e) => setNewPresetDesc(e.target.value)}
                    className="w-full bg-slate-900/60 border border-slate-700/50 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={handleSavePreset}
                    disabled={!newPresetName.trim() || !selectedCatId}
                    className="w-full py-1.5 rounded-lg text-xs font-semibold transition-all bg-purple-600 text-white hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    저장
                  </button>
                </div>
              )}

              {/* 프리셋 목록 */}
              {presets.length === 0 ? (
                <p className="text-xs text-slate-600">저장된 프리셋이 없습니다. 위 버튼으로 현재 설정을 저장하세요.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {presets.map((preset) => {
                    const isSelected = selectedPresetId === preset.id;
                    return (
                      <div key={preset.id} className="group relative">
                        <button
                          type="button"
                          onClick={() => handleSelectPreset(preset.id)}
                          aria-pressed={isSelected}
                          title={preset.description || preset.name}
                          className={`text-left text-xs px-3 py-1.5 rounded-xl border transition-all ${
                            isSelected
                              ? "border-purple-500 bg-purple-600/20 text-white font-semibold"
                              : "border-slate-700/50 bg-slate-800/40 text-slate-300 hover:border-purple-500/50 hover:text-white"
                          }`}
                        >
                          {preset.name}
                        </button>
                        {/* 편집 버튼 — hover 시 표시 */}
                        <button
                          type="button"
                          onClick={() => openEditForm(preset)}
                          aria-label={`${preset.name} 프리셋 편집`}
                          className="absolute -top-1.5 -left-1.5 w-4 h-4 rounded-full bg-slate-700 text-slate-400 hover:bg-purple-600 hover:text-white text-xs items-center justify-center hidden group-hover:flex transition-all"
                        >
                          ✎
                        </button>
                        {/* 삭제 버튼 — hover 시 표시 */}
                        <button
                          type="button"
                          onClick={() => handleDeletePreset(preset.id)}
                          aria-label={`${preset.name} 프리셋 삭제`}
                          className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-slate-700 text-slate-400 hover:bg-red-600 hover:text-white text-xs items-center justify-center hidden group-hover:flex transition-all"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 인라인 편집 폼 */}
              {editingPresetId && (() => {
                const editingPreset = presets.find(p => p.id === editingPresetId);
                if (!editingPreset) return null;
                const catForEdit = categories.find(c => c.id === editingPreset.categoryId);
                return (
                  <div className="mt-3 p-3 rounded-xl bg-slate-800/60 border border-purple-700/40 space-y-3">
                    <p className="text-xs font-semibold text-purple-300">✎ 프리셋 편집: {editingPreset.name}</p>

                    {/* 이름 */}
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">이름</label>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))}
                        className="w-full bg-slate-900/60 border border-slate-700/50 rounded-lg px-3 py-1.5 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                      />
                    </div>

                    {/* 설명 */}
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">설명</label>
                      <input
                        type="text"
                        value={editForm.description}
                        onChange={(e) => setEditForm(f => ({ ...f, description: e.target.value }))}
                        placeholder="계정 한 줄 설명"
                        className="w-full bg-slate-900/60 border border-slate-700/50 rounded-lg px-3 py-1.5 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                      />
                    </div>

                    {/* 타겟 */}
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">👥 타겟 독자</label>
                      <input
                        type="text"
                        value={editForm.targetAudience}
                        onChange={(e) => setEditForm(f => ({ ...f, targetAudience: e.target.value }))}
                        placeholder="예: 30~50대 직장인 여성"
                        className="w-full bg-slate-900/60 border border-slate-700/50 rounded-lg px-3 py-1.5 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                      />
                    </div>

                    {/* 톤 메모 */}
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">🎙 톤/말투 메모</label>
                      <input
                        type="text"
                        value={editForm.toneMemo}
                        onChange={(e) => setEditForm(f => ({ ...f, toneMemo: e.target.value }))}
                        placeholder="예: 친근하고 실용적으로, 과장 금지"
                        className="w-full bg-slate-900/60 border border-slate-700/50 rounded-lg px-3 py-1.5 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                      />
                    </div>

                    {/* 금지 소재 */}
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">🚫 금지 소재 <span className="text-slate-600">(쉼표로 구분)</span></label>
                      <input
                        type="text"
                        value={editForm.bannedTopicsRaw}
                        onChange={(e) => setEditForm(f => ({ ...f, bannedTopicsRaw: e.target.value }))}
                        placeholder="예: 공포 마케팅, 검증 안 된 건강 정보"
                        className="w-full bg-slate-900/60 border border-slate-700/50 rounded-lg px-3 py-1.5 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                      />
                    </div>

                    {/* 선호 소주제 체크박스 */}
                    {catForEdit?.subTopics && catForEdit.subTopics.length > 0 && (
                      <div>
                        <label className="text-xs text-slate-400 block mb-1.5">⭐ 선호 소주제 <span className="text-slate-600">(복수 선택 가능)</span></label>
                        <div className="grid grid-cols-2 gap-1.5">
                          {catForEdit.subTopics.map((st) => {
                            const checked = editForm.preferredSubTopicIds.includes(st.id);
                            return (
                              <label
                                key={st.id}
                                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border cursor-pointer transition-all text-xs ${
                                  checked
                                    ? "border-purple-500/60 bg-purple-600/15 text-purple-200"
                                    : "border-slate-700/40 bg-slate-800/30 text-slate-400 hover:border-slate-600"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleEditSubTopic(st.id)}
                                  className="w-3 h-3 accent-purple-500"
                                />
                                <span className="truncate">{st.name}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 저장 / 취소 */}
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleSaveEdit}
                        disabled={!editForm.name.trim()}
                        className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 text-white hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        저장
                      </button>
                      <button
                        type="button"
                        onClick={closeEditForm}
                        className="flex-1 py-1.5 rounded-lg text-xs font-medium bg-slate-700/60 text-slate-300 hover:bg-slate-600/60 transition-colors"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* 선택된 프리셋 정보 (편집 중이 아닐 때) */}
              {selectedPresetId && !editingPresetId && (() => {
                const preset = presets.find(p => p.id === selectedPresetId);
                if (!preset) return null;
                return (
                  <div className="mt-3 p-2.5 rounded-xl bg-purple-900/20 border border-purple-700/30 text-xs space-y-1">
                    {preset.targetAudience && (
                      <p className="text-slate-400">👥 타겟: <span className="text-slate-200">{preset.targetAudience}</span></p>
                    )}
                    {preset.toneMemo && (
                      <p className="text-slate-400">🎙 톤: <span className="text-slate-200">{preset.toneMemo}</span></p>
                    )}
                    {preset.bannedTopics.length > 0 && (
                      <p className="text-slate-400">🚫 금지: <span className="text-slate-200">{preset.bannedTopics.join(", ")}</span></p>
                    )}
                    <button
                      type="button"
                      onClick={() => openEditForm(preset)}
                      className="mt-1 text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      ✎ 편집
                    </button>
                  </div>
                );
              })()}
            </div>

            {/* 1단계: 카테고리 */}
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-base font-bold text-white mb-4">
                <span className="text-indigo-400 mr-2">①</span>카테고리 선택
              </h3>
              {categories.length === 0 ? (
                <p className="text-slate-500 text-sm animate-pulse">불러오는 중...</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => handleCatChange(cat.id)}
                      aria-pressed={selectedCatId === cat.id}
                      className={`text-left p-4 rounded-xl border transition-all ${
                        selectedCatId === cat.id
                          ? "border-indigo-500 bg-indigo-600/20 text-white"
                          : "border-slate-700/50 bg-slate-800/30 text-slate-300 hover:border-slate-500 hover:bg-slate-700/30"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">{cat.emoji}</span>
                        <span className="font-semibold text-sm">{cat.name}</span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                        {cat.description}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700/60 text-slate-400">
                          {cat.duration}s
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700/60 text-slate-400">
                          {cat.openaiVoice}
                        </span>
                        {cat.subTopics?.length > 0 && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-900/40 text-indigo-400">
                            소주제 {cat.subTopics.length}개
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 2단계: 소주제 선택 */}
            {selectedCat && selectedCat.subTopics?.length > 0 && (
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-base font-bold text-white mb-4">
                  <span className="text-indigo-400 mr-2">②</span>세부 주제 선택
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {selectedCat.subTopics.map((st) => (
                    <button
                      key={st.id}
                      onClick={() => {
                        setSelectedSubTopicId(st.id);
                        setSeedExamplesExpanded(false);
                        if (topicMode === "random") setTopicMode("preset");
                      }}
                      aria-pressed={selectedSubTopicId === st.id && topicMode !== "custom"}
                      className={`text-left p-3 rounded-xl border transition-all ${
                        selectedSubTopicId === st.id && topicMode !== "custom"
                          ? "border-emerald-500 bg-emerald-600/20 text-white"
                          : "border-slate-700/50 bg-slate-800/30 text-slate-300 hover:border-slate-500"
                      }`}
                      aria-label={`${st.name}${preferredSubTopicSet.has(st.id) ? " (프리셋 선호 소주제)" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <p className="font-medium text-sm leading-tight">{st.name}</p>
                        {preferredSubTopicSet.has(st.id) && (
                          <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 leading-none mt-0.5">
                            선호
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{st.description}</p>
                    </button>
                  ))}
                </div>
                {/* 선택된 소주제 예시 — 클릭 시 customTopic 자동 입력 */}
                {selectedSubTopic && (
                  <div className="mt-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/40">
                    <p className="text-xs text-slate-400 mb-1.5 font-medium">
                      📌 주제 예시 <span className="text-indigo-400">(클릭하면 ③에 입력됩니다)</span>
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {(seedExamplesExpanded
                        ? selectedSubTopic.seedExamples
                        : selectedSubTopic.seedExamples.slice(0, 4)
                      ).map((ex) => (
                        <button
                          key={ex}
                          type="button"
                          aria-pressed={customTopic === ex}
                          onClick={() => {
                            setCustomTopic(ex);
                            setTopicMode("custom");
                            document.getElementById("custom-topic-textarea")?.scrollIntoView({ behavior: "smooth", block: "center" });
                          }}
                          className={`text-xs px-2 py-1 rounded-full border transition-all duration-150 text-left
                            ${customTopic === ex
                              ? "bg-indigo-500/30 border-indigo-400/60 text-indigo-200 font-semibold"
                              : "bg-slate-700/60 border-slate-600/40 text-slate-300 hover:bg-indigo-500/20 hover:border-indigo-400/50 hover:text-indigo-100"
                            }`}
                        >
                          {ex}
                        </button>
                      ))}
                    </div>
                    {/* 전체 보기 / 접기 토글 (5개 이상일 때만) */}
                    {selectedSubTopic.seedExamples.length > 4 && (
                      <button
                        type="button"
                        onClick={() => setSeedExamplesExpanded((prev) => !prev)}
                        className="mt-2 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
                        {seedExamplesExpanded
                          ? `▲ 접기`
                          : `▼ 전체 보기 (${selectedSubTopic.seedExamples.length - 4}개 더)`}
                      </button>
                    )}
                  </div>
                )}

                {/* 최근 사용 주제 히스토리 — 소주제가 선택된 상태면 항상 표시 */}
                {selectedSubTopicId && (() => {
                  const allHistory = readTopicHistory();
                  const hasAny = allHistory.length > 0;
                  const hasSubTopic = recentTopics.length > 0;
                  return (
                    <div className="mt-3 p-3 rounded-xl bg-slate-900/60 border border-slate-700/40">
                      {/* 헤더 */}
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-slate-400 font-medium">🕒 최근 사용 주제</p>
                        {/* 이 소주제 기록 지우기 — 이 소주제 기록이 있을 때만 */}
                        {hasSubTopic && (
                          <button
                            type="button"
                            onClick={() => {
                              clearTopicHistoryBySubTopic(selectedCatId, selectedSubTopicId);
                              setRecentTopics([]);
                              setIsDuplicate(false);
                            }}
                            className="text-xs text-slate-500 hover:text-amber-400 transition-colors underline-offset-2 hover:underline"
                          >
                            이 소주제 기록 지우기
                          </button>
                        )}
                      </div>

                      {/* 목록 or 빈 상태 안내 */}
                      {hasSubTopic ? (
                        <div className="flex flex-col gap-1">
                          {recentTopics.map((entry, i) => (
                            <div key={i} className="flex flex-col gap-0.5 group">
                              <div className="flex items-center gap-1.5">
                                <span className="text-slate-600 text-xs shrink-0">
                                  {entry.topicMode === "custom" ? "✍️" : entry.topicMode === "random" ? "🎲" : "📌"}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCustomTopic(entry.topic);
                                    setTopicMode("custom");
                                    document.getElementById("custom-topic-textarea")?.scrollIntoView({ behavior: "smooth", block: "center" });
                                  }}
                                  className="text-xs text-slate-400 hover:text-indigo-300 transition-colors text-left truncate flex-1"
                                  title={`재사용: ${entry.topic}`}
                                >
                                  {entry.topic}
                                </button>
                                <span className="text-slate-600 text-xs shrink-0">
                                  {new Date(entry.createdAt).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" })}
                                </span>
                              </div>
                              {/* metaSnapshot 배지 — 있을 때만 */}
                              {entry.metaSnapshot && (entry.metaSnapshot.accountPresetName || entry.metaSnapshot.subTopicName) && (
                                <div className="flex gap-1 pl-5 flex-wrap">
                                  {entry.metaSnapshot.accountPresetName && (
                                    <span className="text-[9px] px-1.5 py-px rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/25 leading-none">
                                      {entry.metaSnapshot.accountPresetName}
                                    </span>
                                  )}
                                  {entry.metaSnapshot.subTopicName && (
                                    <span className="text-[9px] px-1.5 py-px rounded-full bg-slate-700/50 text-slate-400 border border-slate-600/30 leading-none">
                                      {entry.metaSnapshot.subTopicName}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-600 leading-relaxed">
                          아직 저장된 주제가 없습니다. 이전 백업을 가져오거나, 주제를 생성하면 여기에 기록됩니다.
                        </p>
                      )}

                      {/* 하단 관리 영역 */}
                      <div className="mt-2.5 pt-2 border-t border-slate-800/60">
                        {/* 가져오기 결과 메시지 */}
                        {importMsg && (
                          <p className={`text-xs mb-1.5 ${importMsg.ok ? "text-emerald-400" : "text-red-400"}`}>
                            {importMsg.ok ? "✅" : "❌"} {importMsg.text}
                          </p>
                        )}
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* 내보내기 — 전체 히스토리 있을 때만 활성 */}
                          <button
                            type="button"
                            disabled={!hasAny}
                            onClick={() => {
                              const result = exportHistoryAsBlob();
                              if (!result) return;
                              const url = URL.createObjectURL(result.blob);
                              const a = document.createElement("a");
                              a.href = url;
                              a.download = result.filename;
                              a.click();
                              URL.revokeObjectURL(url);
                            }}
                            className={`text-xs px-2 py-1 rounded-lg transition-colors ${
                              hasAny
                                ? "bg-slate-700/60 text-slate-300 hover:bg-slate-600/60"
                                : "bg-slate-800/40 text-slate-600 cursor-not-allowed"
                            }`}
                            title={hasAny ? "JSON 파일로 내보내기" : "내보낼 기록이 없습니다"}
                          >
                            ⬇ 내보내기
                          </button>

                          {/* 가져오기 — 항상 표시 */}
                          <label className="text-xs px-2 py-1 rounded-lg bg-slate-700/60 text-slate-300 hover:bg-slate-600/60 transition-colors cursor-pointer">
                            ⬆ 가져오기
                            <input
                              type="file"
                              accept=".json,application/json"
                              className="sr-only"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const reader = new FileReader();
                                reader.onload = (ev) => {
                                  const text = ev.target?.result as string;
                                  const result = importAndMergeHistory(text);
                                  if (result.ok) {
                                    setImportMsg({ ok: true, text: `${result.added}개 항목을 가져왔습니다 (중복 ${result.skipped}개 건너뜀).` });
                                    setRecentTopics(getRecentTopics(selectedCatId, selectedSubTopicId, 5));
                                  } else {
                                    setImportMsg({ ok: false, text: result.error ?? "가져오기 실패" });
                                  }
                                  setTimeout(() => setImportMsg(null), 5000);
                                };
                                reader.readAsText(file, "utf-8");
                                e.target.value = "";
                              }}
                            />
                          </label>

                          {/* 전체 삭제 — 전체 히스토리 있을 때만 표시 */}
                          {hasAny && (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm("모든 주제 사용 기록을 지울까요?\n이 작업은 되돌릴 수 없습니다.")) {
                                  clearAllTopicHistory();
                                  setRecentTopics([]);
                                  setIsDuplicate(false);
                                  setImportMsg(null);
                                }
                              }}
                              className="ml-auto text-xs text-slate-600 hover:text-red-500 transition-colors"
                            >
                              🗑 전체 삭제
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* 3단계: 직접 주제 입력 */}
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-base font-bold text-white mb-4">
                <span className="text-indigo-400 mr-2">③</span>주제 직접 입력 <span className="text-slate-500 text-sm font-normal">(선택 사항)</span>
              </h3>
              <div className="relative">
                <textarea
                  id="custom-topic-textarea"
                  rows={3}
                  placeholder="예: 아버지 지갑 속 오래된 사진 / 바나나를 오래 보관하는 방법"
                  value={customTopic}
                  onChange={(e) => {
                    setCustomTopic(e.target.value);
                    setTopicMode(e.target.value.trim() ? "custom" : "preset");
                  }}
                  className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-3 pr-10 text-white placeholder-slate-500 text-sm resize-none focus:outline-none focus:border-indigo-500 transition-colors"
                />
                {/* 지우기 버튼 — customTopic이 있을 때만 표시 */}
                {customTopic.trim() && (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomTopic("");
                      setTopicMode("preset");
                    }}
                    title="입력 지우기"
                    aria-label="입력 지우기"
                    className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full bg-slate-600/80 hover:bg-slate-500 text-slate-300 hover:text-white text-xs transition-all"
                  >
                    ✕
                  </button>
                )}
              </div>
              {customTopic.trim() && (
                isDuplicate ? (
                  <p className="text-xs text-amber-400 mt-1.5">
                    ⚠️ 최근 사용한 주제입니다. 다른 각도나 예시를 선택하는 것을 권장합니다.
                  </p>
                ) : (
                  <p className="text-xs text-emerald-400 mt-1.5">✅ 직접 입력 주제가 우선 적용됩니다</p>
                )
              )}
            </div>
          </div>

          {/* 생성 패널 (2/5) */}
          <div className="lg:col-span-2 flex flex-col gap-4">

            {/* 선택 요약 */}
            <div className="glass-card rounded-2xl p-5">
              <h3 className="text-sm font-bold text-slate-300 mb-3">선택 요약</h3>
              {selectedCat ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">카테고리</span>
                    <span className="text-white font-medium">{selectedCat.emoji} {selectedCat.name}</span>
                  </div>
                  {topicMode === "custom" && customTopic.trim() ? (
                    <div className="flex flex-col gap-0.5">
                      <span className="text-slate-500">주제 (직접 입력)</span>
                      <span className="text-emerald-400 text-xs font-medium line-clamp-2">{customTopic.trim()}</span>
                    </div>
                  ) : selectedSubTopic && topicMode !== "random" ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-500">소주제</span>
                        <span className="text-indigo-400 font-medium">{selectedSubTopic.name}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between">
                      <span className="text-slate-500">주제</span>
                      <span className="text-amber-400 text-xs">랜덤 (테스트용)</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-500">길이</span>
                    <span className="text-white">{selectedCat.duration}초</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">목소리</span>
                    <span className={appliedVoice ? "text-emerald-400" : "text-indigo-400"}>
                      {appliedVoice
                        ? `${appliedVoice.voice} · ${appliedVoice.speed} ✅`
                        : `${selectedCat.openaiVoice} · ${selectedCat.openaiSpeed}`}
                    </span>
                  </div>
                  {appliedVoice && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 text-xs">적용됨</span>
                      <span className="text-xs text-emerald-400 truncate max-w-[140px]">{appliedVoice.label}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-500">TTS</span>
                    <span className="text-slate-300">
                      {appliedVoice ? appliedVoice.provider : selectedCat.ttsProvider}
                    </span>
                  </div>
                  {appliedVoice && (
                    <button
                      onClick={() => setAppliedVoice(null)}
                      className="text-xs text-slate-500 hover:text-red-400 transition-colors text-right w-full"
                    >
                      ✕ 오버라이드 해제 (카테고리 기본 복원)
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-slate-500 text-xs">카테고리를 선택하세요</p>
              )}
            </div>

            {/* ── 심리 MVP 01 불러오기 ── */}
            <div className="glass-card rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">
                  <span className="text-purple-400 mr-1.5">🧠</span>심리 MVP 01
                </h3>
                <span className="text-[10px] text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded-full border border-slate-700/40">
                  psychology_mvp_01
                </span>
              </div>
              <div className="text-xs text-slate-400 leading-relaxed">
                자존감을 무너뜨리는 말 — 처음엔 칭찬처럼 들립니다
              </div>
              <div className="text-[11px] text-slate-500 space-y-0.5">
                <div>· 총 5씬 · 약 32초 · 이미지 수동 생성</div>
                <div>· Scene 1: reference 이미지 프롬프트</div>
                <div>· Scene 2~5: reference edit 프롬프트</div>
              </div>
              <button
                onClick={handleLoadPsychMvp}
                disabled={step === "generating"}
                className="w-full py-2 rounded-xl text-xs font-bold bg-purple-700/40 hover:bg-purple-700/60 text-purple-200 border border-purple-500/40 transition-colors disabled:opacity-40"
              >
                심리 MVP 01 불러오기
              </button>
              {psychLoadMsg && (
                <div className={`text-[11px] px-2 py-1.5 rounded-lg ${
                  psychLoadMsg.startsWith("✅")
                    ? "text-emerald-400 bg-emerald-900/20 border border-emerald-600/20"
                    : psychLoadMsg.startsWith("❌")
                    ? "text-red-400 bg-red-900/20 border border-red-600/20"
                    : "text-slate-400 bg-slate-800/40"
                }`}>
                  {psychLoadMsg}
                </div>
              )}
              {/* 불러온 후 — plan 정보 요약 */}
              {plan && renderId === PSYCH_JOB_ID && (
                <div className="rounded-xl bg-slate-800/40 border border-slate-700/30 px-3 py-2 space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">주제</span>
                    <span className="text-white font-medium truncate max-w-[160px]">{plan.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">총 씬</span>
                    <span className="text-indigo-300">{plan.scenes.length}씬</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">예상 길이</span>
                    <span className="text-slate-300">{plan.estimatedDuration}초</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">이미지 승인</span>
                    <span className={
                      Object.values(manualSceneStatuses).filter(s => s === "accepted").length === plan.scenes.length
                        ? "text-emerald-400 font-bold"
                        : "text-slate-300"
                    }>
                      {Object.values(manualSceneStatuses).filter(s => s === "accepted").length} / {plan.scenes.length}
                    </span>
                  </div>
                </div>
              )}

              {/* ── Scene 1 이미지 만들기 버튼 (불러오기 완료 후 표시) ── */}
              {psychLoaded && plan && renderId === PSYCH_JOB_ID && (
                <button
                  onClick={() => {
                    const sc = plan.scenes[0];
                    if (!sc) return;
                    setBridgeScene({
                      sceneNumber: sc.sceneNumber ?? 1,
                      caption: sc.caption,
                      imagePrompt: sc.imagePrompt,
                      localImagePath: manualLocalImages[sc.sceneNumber ?? 1] ?? null,
                      manualStatus: manualSceneStatuses[sc.sceneNumber ?? 1],
                    });
                    setBridgeAutoStart(true);
                    setTimeout(() => {
                      bridgePanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }, 150);
                  }}
                  className="w-full py-3 rounded-xl text-sm font-bold bg-violet-600/50 hover:bg-violet-600/70 text-white border border-violet-400/50 transition-colors shadow-lg"
                >
                  🖼️ Scene 1 이미지 만들기
                </button>
              )}
            </div>

            {/* 스크린리더용 CTA 상태 알림 (시각적으로 숨김) */}
            <div
              role="status"
              aria-live="polite"
              aria-atomic="true"
              className="sr-only"
            >
              {topicMode === "custom" && customTopic.trim()
                ? `직접 입력 주제 "${customTopic.trim()}" 로 생성 준비됨`
                : topicMode === "random"
                ? "랜덤 주제로 생성 준비됨"
                : "선택한 소주제로 콘티 생성 준비됨"}
            </div>

            {/* 기본 CTA: 선택한 주제로 생성 */}
            <button
              onClick={() => handleGenerate()}
              disabled={!selectedCatId || step === "generating"}
              className={`w-full py-4 rounded-2xl font-bold text-base transition-all ${
                !selectedCatId || step === "generating"
                  ? "bg-slate-700/50 text-slate-400 cursor-not-allowed"
                  : topicMode === "custom"
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:opacity-90 active:scale-95"
                  : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:opacity-90 active:scale-95"
              }`}
            >
              {step === "generating" ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  콘티 생성 중...
                </span>
              ) : topicMode === "custom" && customTopic.trim() ? (
                <span
                  className="flex items-center justify-center gap-1.5 w-full overflow-hidden"
                  title={customTopic.trim()}
                >
                  <span className="shrink-0">✍️</span>
                  <span className="truncate">{customTopic.trim()}</span>
                  <span className="shrink-0 text-white/70 text-sm">로 생성</span>
                </span>
              ) : topicMode === "random"
                ? "🎲 랜덤 생성"
                : "✨ 선택한 주제로 콘티 생성"}
            </button>

            {/* 보조: 랜덤 테스트 버튼 (topicMode가 random이 아닐 때만 표시) */}
            {topicMode !== "random" && selectedCatId && step !== "generating" && (
              <button
                onClick={() => handleGenerate("random")}
                className="w-full py-2.5 rounded-2xl font-medium text-sm transition-all border border-slate-700/50 text-slate-400 hover:text-slate-200 hover:border-slate-500 bg-slate-800/30"
              >
                🎲 랜덤 테스트 (소재 아이디어 발굴용)
              </button>
            )}

            {/* 유료 API 차단 배너 */}
            {paidApiBlocked && (
              <div className="rounded-xl bg-amber-900/30 border border-amber-600/60 p-4 text-xs space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-amber-400 text-sm">🔒</span>
                  <span className="text-amber-300 font-bold">유료 API 승인 필요</span>
                  <button
                    onClick={() => setPaidApiBlocked(null)}
                    className="ml-auto text-slate-500 hover:text-slate-300 text-xs"
                  >✕</button>
                </div>
                <div className="text-amber-200/80">{paidApiBlocked.error}</div>
                <div className="text-slate-400">
                  작업: <span className="text-slate-300">{paidApiBlocked.operation}</span>
                  {" · "}제공자: <span className="text-slate-300">{paidApiBlocked.provider}</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-700/40">
                  <p className="text-slate-400 mb-1.5 font-medium">📋 .env.local에 추가 후 서버 재시작:</p>
                  {paidApiBlocked.requiredEnvVars.map((v) => (
                    <div key={v} className="font-mono text-emerald-400 text-[11px]">{v}</div>
                  ))}
                </div>
                <div className="text-slate-500 text-[11px] leading-relaxed">{paidApiBlocked.hint}</div>
              </div>
            )}

            {/* 에러 */}
            {step === "error" && (
              <div className="rounded-xl bg-red-900/30 border border-red-700/50 p-3 text-xs text-red-300 break-words space-y-2">
                <div>⚠️ {errorMsg}</div>
                {/* Imagen quota 소진 partial 실패 → Pollinations fallback 재시도 UI */}
                {partialRenderError && (
                  <div className="mt-2 rounded-lg border p-3 space-y-2"
                    style={{
                      background: partialRenderError.blockReason === "plan_required"
                        ? "rgba(127,29,29,0.3)" : "rgba(120,80,0,0.3)",
                      borderColor: partialRenderError.blockReason === "plan_required"
                        ? "rgba(239,68,68,0.5)" : "rgba(217,119,6,0.4)",
                    }}
                  >
                    {/* 헤더: plan_required vs quota */}
                    <div className="font-semibold text-[11px]"
                      style={{ color: partialRenderError.blockReason === "plan_required" ? "#fca5a5" : "#fcd34d" }}
                    >
                      {partialRenderError.blockReason === "plan_required"
                        ? "🚫 Imagen 유료 플랜 미활성 — 재시도 금지"
                        : partialRenderError.imagenDailyQuotaExhausted
                        ? "🔋 오늘 Imagen quota 소진"
                        : "🖼️ 이미지 생성 부분 실패"}
                    </div>

                    {/* 씬 현황 */}
                    <div className="text-amber-200/80 text-[11px]">
                      성공 {partialRenderError.generatedSceneCount} / {partialRenderError.totalSceneCount} 씬
                      {partialRenderError.failedScenes.length > 0 && (
                        <span className="ml-1 text-red-300">· 실패: 씬 {partialRenderError.failedScenes.join(", ")}</span>
                      )}
                    </div>

                    {/* plan_required 전용 안내 */}
                    {partialRenderError.blockReason === "plan_required" && (
                      <div className="rounded bg-red-950/40 border border-red-700/30 p-2 space-y-1">
                        <div className="text-red-300 text-[11px] font-semibold">⛔ 같은 설정으로 재시도하면 동일 오류 반복</div>
                        <div className="text-red-200/70 text-[10px]">
                          Imagen 3은 Google AI Studio 유료 플랜에서만 사용 가능합니다.<br />
                          아래 옵션 중 하나를 선택하세요.
                        </div>
                      </div>
                    )}

                    {/* quota 소진 안내 */}
                    {partialRenderError.blockReason !== "plan_required" && partialRenderError.imagenDailyQuotaExhausted && (
                      <div className="text-[10px] text-slate-400">
                        실패한 씬을 Pollinations(무료)로 대체해 렌더링을 완료할 수 있습니다. 품질이 다를 수 있습니다.
                      </div>
                    )}

                    {/* 권장 다음 액션 목록 */}
                    {partialRenderError.recommendedNextActions && partialRenderError.recommendedNextActions.length > 0 && (
                      <ul className="text-[10px] text-slate-300 space-y-0.5 list-disc list-inside">
                        {partialRenderError.recommendedNextActions.map((action, idx) => (
                          <li key={idx} className={action.startsWith("⛔") ? "text-red-400" : ""}>{action}</li>
                        ))}
                      </ul>
                    )}

                    {/* 액션 버튼 */}
                    <div className="flex gap-2 flex-wrap pt-1">
                      {/* Pollinations 재시도: plan_required도 가능 */}
                      <button
                        className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-semibold transition-colors"
                        onClick={() => {
                          handleRender(plan!, renderId || undefined, {
                            reuseLocalImages: true,
                            allowProviderFallbackOnQuota: true,
                            imageMode: "pollinations-only",
                          });
                        }}
                      >
                        🖼️ Pollinations으로 재시도 (무료)
                      </button>

                      {/* plan_required가 아닐 때만 Imagen 재시도 버튼 표시 */}
                      {partialRenderError.blockReason !== "plan_required" && (
                        <button
                          className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-[11px] font-semibold transition-colors"
                          onClick={() => {
                            handleRender(plan!, renderId || undefined, {
                              reuseLocalImages: true,
                              allowProviderFallbackOnQuota: true,
                            });
                          }}
                        >
                          🔄 Imagen + Pollinations 혼합 재시도
                        </button>
                      )}

                      {/* plan_required: Google AI Studio 링크 */}
                      {partialRenderError.blockReason === "plan_required" && (
                        <a
                          href="https://ai.dev/projects"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-600 text-white text-[11px] font-semibold transition-colors"
                        >
                          🔗 Google AI Studio에서 플랜 활성화
                        </a>
                      )}

                      {partialRenderError.blockReason === "quota_exhausted" && (
                        <div className="text-[10px] text-slate-500 self-center">또는 내일 Imagen quota 리셋 후 재시도</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 콘티 생성 완료 → 렌더 버튼 */}
            {plan && (step === "generated" || step === "rendering" || step === "done" || step === "error") && (
              <div className="glass-card rounded-2xl p-4 space-y-3">
                <p className="text-xs font-semibold text-emerald-400">✅ 콘티 완료</p>
                <p className="text-sm text-white font-medium line-clamp-1">{plan.topTitle}</p>
                <p className="text-xs text-slate-400">{plan.scenes.length}씬 · {plan.estimatedDuration}초</p>
                {/* _meta 생성 컨텍스트 요약 */}
                {plan._meta && (
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {plan._meta.accountPreset?.name && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        프리셋: {plan._meta.accountPreset.name}
                      </span>
                    )}
                    {plan._meta.subTopicName && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700/60 text-slate-300 border border-slate-600/40">
                        소주제: {plan._meta.subTopicName}
                      </span>
                    )}
                    {plan._meta.topicMode === "custom" && plan._meta.customTopic && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 max-w-[180px] truncate">
                        직접입력: {plan._meta.customTopic}
                      </span>
                    )}
                  </div>
                )}

                {/* 콘티 품질 warnings */}
                {planWarnings.length > 0 && (
                  <div className="rounded-xl bg-slate-900/60 border border-slate-700/40 p-3 space-y-1.5 max-h-40 overflow-y-auto">
                    {planWarnings.map((w, i) => {
                      const badge =
                        w.severity === "fixed"
                          ? { bg: "bg-amber-500/20", text: "text-amber-400", icon: "🔧" }
                          : w.severity === "warning"
                          ? { bg: "bg-orange-500/15", text: "text-orange-400", icon: "⚠️" }
                          : { bg: "bg-blue-500/10", text: "text-blue-400", icon: "ℹ️" };
                      return (
                        <div key={i} className={`flex gap-2 text-xs rounded-lg px-2 py-1 ${badge.bg}`}>
                          <span className="shrink-0">{badge.icon}</span>
                          <span className={badge.text}>
                            {w.sceneNumber > 0 && <span className="font-semibold mr-1">씬{w.sceneNumber}</span>}
                            {w.message}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 콘티 품질 점수 */}
                {qualityScore && (
                  <div className={`rounded-xl border p-3 space-y-2 ${
                    qualityScore.grade === "pass"
                      ? "bg-emerald-500/10 border-emerald-500/30"
                      : qualityScore.grade === "review"
                      ? "bg-yellow-500/10 border-yellow-500/30"
                      : "bg-red-500/10 border-red-500/30"
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-300">콘티 품질 점수</span>
                      <span className={`text-lg font-bold ${
                        qualityScore.grade === "pass"
                          ? "text-emerald-400"
                          : qualityScore.grade === "review"
                          ? "text-yellow-400"
                          : "text-red-400"
                      }`}>
                        {qualityScore.score}점
                        <span className="text-xs font-normal ml-1.5">
                          {qualityScore.grade === "pass" ? "✅ 사용 가능" : qualityScore.grade === "review" ? "🔍 검토 필요" : "🔴 재생성 권장"}
                        </span>
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      {qualityScore.breakdown.filter(b => b.max > 0).map((b, i) => (
                        <div key={i} className="flex items-center gap-1 text-xs">
                          <span>{b.pass ? "✓" : "✗"}</span>
                          <span className={b.pass ? "text-slate-400" : "text-slate-500 line-through"}>
                            {b.label}
                          </span>
                          <span className={`ml-auto font-mono ${b.pass ? "text-emerald-500" : "text-red-500"}`}>
                            {b.earned}/{b.max}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 재생성 권장 경고 (fail) */}
                {qualityScore?.grade === "fail" && !forceRender && (
                  <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-3 py-2.5 space-y-2">
                    <p className="text-xs text-red-400 font-medium text-center">
                      🔴 점수 미달 — 콘티 재생성 후 렌더를 권장합니다
                    </p>
                    <button
                      onClick={() => setForceRender(true)}
                      className="w-full py-1.5 rounded-lg text-[11px] text-red-300/70 hover:text-red-300 border border-red-500/20 hover:border-red-500/40 transition-all"
                    >
                      그래도 렌더하기
                    </button>
                  </div>
                )}

                {/* 렌더 전 사전점검 요약 (pass/review) */}
                {qualityScore && qualityScore.grade !== "fail" && plan && (
                  <div className="rounded-xl bg-slate-800/40 border border-slate-700/30 px-3 py-2 text-[11px] text-slate-400 space-y-0.5">
                    <div className="flex justify-between">
                      <span>씬 수</span>
                      <span className="text-white">{plan.scenes.length}씬 · {plan.estimatedDuration}초</span>
                    </div>
                    <div className="flex justify-between">
                      <span>이미지 생성</span>
                      <span className="text-emerald-400">Imagen → Pollinations 폴백</span>
                    </div>
                    <div className="flex justify-between">
                      <span>TTS</span>
                      <span className="text-indigo-400">씬별 생성 (OpenAI gpt-4o-mini-tts)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>예상 소요</span>
                      <span className="text-slate-300">2~4분</span>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => handleRender()}
                  disabled={
                    step === "rendering" ||
                    (qualityScore?.grade === "fail" && !forceRender)
                  }
                  className={`w-full py-3 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
                    qualityScore?.grade === "fail" && forceRender
                      ? "bg-gradient-to-r from-red-700 to-rose-700 text-white hover:opacity-90"
                      : "bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:opacity-90"
                  }`}
                >
                  {step === "rendering" ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      렌더링 중... (이미지·TTS 포함)
                    </span>
                  ) : qualityScore?.grade === "fail" && forceRender
                    ? "⚠️ 강제 렌더 (점수 미달)"
                    : "🎞️ 영상 렌더"}
                </button>

                {/* motion-only 재렌더 (이미 렌더된 적 있을 때만) */}
                {renderId && step === "done" && (
                  <button
                    onClick={handleRerenderMotion}
                    className="w-full py-2.5 rounded-xl text-xs font-medium bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 transition-all"
                  >
                    🔄 모션만 재렌더 (이미지·TTS 재사용)
                  </button>
                )}

                {/* ── 수동 AI 이미지 생성 브리지 진입 ── */}
                {plan && (() => {
                  const totalScenes = plan.scenes.length;
                  const acceptedCount = plan.scenes.filter(
                    (sc, idx) => manualSceneStatuses[sc.sceneNumber ?? idx + 1] === "accepted"
                  ).length;
                  const renderReady = totalScenes > 0 && acceptedCount === totalScenes;
                  return (
                    <div className="pt-1 border-t border-slate-700/40 space-y-2">
                      {/* 렌더 준비 완료 표시 */}
                      <div className={`flex items-center justify-between px-2 py-1.5 rounded-lg border ${
                        renderReady
                          ? "bg-emerald-900/20 border-emerald-600/40"
                          : "bg-slate-800/30 border-slate-700/30"
                      }`}>
                        <span className="text-[11px] text-slate-400">
                          수동 이미지 승인: <span className={renderReady ? "text-emerald-300 font-bold" : "text-slate-300"}>
                            {acceptedCount} / {totalScenes}
                          </span>
                        </span>
                        {renderReady && (
                          <span className="text-[11px] text-emerald-300 font-semibold">✓ 렌더 준비 완료</span>
                        )}
                      </div>

                      {/* 전체 승인 완료 배너 */}
                      {renderReady && (
                        <div className="px-3 py-2 rounded-xl bg-emerald-900/25 border border-emerald-500/40 text-[11px] text-emerald-200 font-semibold text-center">
                          🎉 {totalScenes}개 이미지 승인 완료 — 무음 미리보기 렌더를 시작하세요
                        </div>
                      )}

                      {/* 무음 미리보기 렌더 버튼 */}
                      <div ref={silentRenderRef} className="space-y-1.5">
                        <button
                          disabled={!renderReady || manualRenderStep === "saving" || manualRenderStep === "rendering"}
                          onClick={handleManualSilentRender}
                          className={`w-full py-2 rounded-xl text-xs font-bold border transition-colors ${
                            !renderReady
                              ? "bg-slate-800/30 text-slate-600 border-slate-700/30 cursor-not-allowed"
                              : manualRenderStep === "saving" || manualRenderStep === "rendering"
                              ? "bg-indigo-700/30 text-indigo-400 border-indigo-600/30 cursor-wait"
                              : manualRenderStep === "done"
                              ? "bg-emerald-700/30 text-emerald-300 border-emerald-600/40 hover:bg-emerald-700/50"
                              : "bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border-indigo-500/40"
                          }`}
                        >
                          {manualRenderStep === "saving"
                            ? "plan 저장 중..."
                            : manualRenderStep === "rendering"
                            ? "렌더 중... (수십 초 소요)"
                            : manualRenderStep === "done"
                            ? "✓ 렌더 완료 — 다시 렌더"
                            : "무음 미리보기 렌더"}
                        </button>

                        {/* 렌더 오류 */}
                        {manualRenderStep === "error" && manualRenderError && (
                          <div className="px-3 py-2 rounded-xl bg-red-900/20 border border-red-600/30">
                            <div className="text-[11px] text-red-400 whitespace-pre-wrap">{manualRenderError}</div>
                          </div>
                        )}

                        {/* 렌더 성공 — 미리보기 */}
                        {manualRenderStep === "done" && manualRenderVideoUrl && (
                          <div className="space-y-1">
                            <div className="text-[11px] text-emerald-300 font-semibold px-1">무음 미리보기 완료</div>
                            <video
                              src={manualRenderVideoUrl}
                              controls
                              playsInline
                              className="w-full rounded-xl border border-emerald-600/30 bg-black"
                              style={{ maxHeight: "300px" }}
                            />
                            <div className="text-[10px] text-slate-600 break-all px-1">{manualRenderVideoUrl}</div>
                          </div>
                        )}
                      </div>

                      {/* 씬 선택 목록 — 항상 표시 (접힌 details 제거) */}
                      <div className="space-y-1">
                        <div className="text-[11px] text-slate-500 font-semibold px-0.5">씬별 이미지 생성</div>
                        {plan.scenes.map((sc, idx) => {
                          const sceneNum = sc.sceneNumber ?? idx + 1;
                          const status = manualSceneStatuses[sceneNum];
                          return (
                            <button
                              key={idx}
                              onClick={() => {
                                setBridgeScene({
                                  sceneNumber: sceneNum,
                                  caption: sc.caption,
                                  imagePrompt: sc.imagePrompt,
                                  localImagePath: manualLocalImages[sceneNum] ?? null,
                                  manualStatus: status,
                                });
                                setBridgeAutoStart(false);
                                setTimeout(() => {
                                  bridgePanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                                }, 150);
                              }}
                              className="w-full text-left px-3 py-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/30 transition-colors"
                            >
                              <span className="text-[10px] text-slate-500 mr-1.5">씬{sceneNum}</span>
                              <span className="text-[11px] text-slate-300">{sc.caption}</span>
                              {status && (
                                <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${
                                  status === "accepted"
                                    ? "bg-emerald-900/40 text-emerald-400"
                                    : status === "reviewing_image"
                                    ? "bg-amber-900/30 text-amber-400"
                                    : status === "rejected"
                                    ? "bg-red-900/30 text-red-400"
                                    : "bg-slate-700/40 text-slate-500"
                                }`}>
                                  {status === "accepted" ? "✓" : status === "reviewing_image" ? "검토" : status === "rejected" ? "✗" : ""}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* ManualImageBridge 패널 */}
            {/* ManualImageBridge 패널 — ref로 scroll 대상 */}
            <div ref={bridgePanelRef}>
              {bridgeScene && plan && (
                <ManualImageBridge
                  key={`bridge-${bridgeScene.sceneNumber}-${bridgeAutoStart ? "auto" : bridgeAutoStartPollingOnly ? "polling" : "manual"}`}
                  scene={bridgeScene}
                  jobId={renderId || "default-job"}
                  totalScenes={plan.scenes.length}
                  referenceImagePath={
                    bridgeScene.sceneNumber > 1
                      ? (manualLocalImages[1] ?? null)
                      : null
                  }
                  autoStart={bridgeAutoStart}
                  autoStartPollingOnly={bridgeAutoStartPollingOnly}
                  autoProfileAlias="GPT 1"
                  onRegisterImage={(sceneNumber, projectImagePath) => {
                    setManualLocalImages((prev) => ({
                      ...prev,
                      [sceneNumber]: projectImagePath,
                    }));
                    setBridgeScene((prev) =>
                      prev ? { ...prev, localImagePath: projectImagePath } : null
                    );
                  }}
                  onStatusChange={(sceneNumber, status) => {
                    setManualSceneStatuses((prev) => ({ ...prev, [sceneNumber]: status }));
                    setBridgeScene((prev) =>
                      prev ? { ...prev, manualStatus: status } : null
                    );
                  }}
                  onAcceptAndNext={(acceptedSceneNumber, acceptedLocalPath) => {
                    // 승인된 씬 상태 즉시 저장
                    const updatedStatuses = {
                      ...manualSceneStatuses,
                      [acceptedSceneNumber]: "accepted" as ManualSceneStatus,
                    };
                    const updatedImages = acceptedLocalPath
                      ? { ...manualLocalImages, [acceptedSceneNumber]: acceptedLocalPath }
                      : manualLocalImages;
                    setManualSceneStatuses(updatedStatuses);
                    if (acceptedLocalPath) setManualLocalImages(updatedImages);

                    // 다음 미승인 씬 자동 선택
                    const nextSceneIdx = plan.scenes.findIndex(
                      (sc, idx) => {
                        const sn = sc.sceneNumber ?? idx + 1;
                        return sn > acceptedSceneNumber;
                      }
                    );

                    const nextSceneNum = nextSceneIdx !== -1
                      ? (plan.scenes[nextSceneIdx].sceneNumber ?? nextSceneIdx + 1)
                      : acceptedSceneNumber + 1;

                    // state.json 즉시 저장
                    savePsychState(nextSceneNum, updatedStatuses, updatedImages);

                    if (nextSceneIdx === -1) return;
                    const nextSc = plan.scenes[nextSceneIdx];
                    setBridgeScene({
                      sceneNumber: nextSceneNum,
                      caption: nextSc.caption,
                      imagePrompt: nextSc.imagePrompt,
                      localImagePath: updatedImages[nextSceneNum] ?? null,
                      manualStatus: updatedStatuses[nextSceneNum],
                    });
                    // 같은 GPT 1 프로필 유지 — Chrome 재실행 없이 polling만 재시작
                    setBridgeAutoStart(false);
                    setBridgeAutoStartPollingOnly(true);
                    setTimeout(() => {
                      bridgePanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }, 150);
                  }}
                  onAllScenesAccepted={() => {
                    // 마지막 씬 승인 — state 저장 + 무음 렌더 영역으로 스크롤
                    savePsychState(plan.scenes.length, manualSceneStatuses, manualLocalImages);
                    setBridgeScene(null);
                    setBridgeAutoStart(false);
                    setBridgeAutoStartPollingOnly(false);
                    setTimeout(() => {
                      silentRenderRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }, 200);
                  }}
                  onClose={() => {
                    setBridgeScene(null);
                    setBridgeAutoStart(false);
                    setBridgeAutoStartPollingOnly(false);
                  }}
                />
              )}
            </div>

            {/* 렌더 진행 중 메시지 */}
            {step === "rendering" && (
              <p className="text-xs text-slate-500 text-center animate-pulse">
                이미지 생성 + TTS + 영상 합성 중입니다. 약 2~4분 소요됩니다.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── 탭 2: 목소리 비교 ── */}
      {tab === "voice" && (
        <div className="glass-card rounded-2xl p-6 space-y-6">
          <div>
            <h3 className="text-base font-bold text-white mb-1">목소리 비교 테스트</h3>
            <p className="text-xs text-slate-500">
              이미지 생성 없이 텍스트만으로 여러 목소리 MP3를 생성해서 비교합니다.
            </p>
          </div>

          {/* 카테고리 선택 (기본 voice 자동 포함) */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">
              카테고리 기본 목소리 포함
            </label>
            <select
              value={selectedCatId}
              onChange={(e) => handleCatChange(e.target.value)}
              className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">전체 기본 4종만</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.emoji} {c.name} ({c.openaiVoice})
                </option>
              ))}
            </select>
          </div>

          {/* 테스트 텍스트 */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">
              테스트 문장 <span className="text-slate-600">(빈칸이면 내장 샘플 사용)</span>
            </label>
            <textarea
              value={voiceText}
              onChange={(e) => setVoiceText(e.target.value)}
              rows={3}
              placeholder="냉장고에는 생각보다 중요한 비밀이 숨어 있어요. 오늘부터 딱 이것만 바꿔보세요."
              className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          {/* 생성 버튼 */}
          <button
            onClick={handleVoiceTest}
            disabled={voiceLoading}
            className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
              voiceLoading
                ? "bg-slate-700/50 text-slate-400 cursor-not-allowed"
                : "bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:opacity-90 active:scale-95"
            }`}
          >
            {voiceLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                MP3 생성 중...
              </span>
            ) : "🎙️ 목소리 샘플 생성"}
          </button>

          {/* 샘플 결과 — 그룹 구분 */}
          {voiceSamples.length > 0 && (() => {
            const catDefaultLabel = selectedCatId ? `${selectedCatId}-default` : null;
            const PREMIUM_LABELS = ["marin-premium", "cedar-premium", "ballad-warm", "verse-smooth"];

            const catGroup = catDefaultLabel
              ? voiceSamples.filter((s) => s.label === catDefaultLabel)
              : [];
            const premiumGroup = voiceSamples.filter(
              (s) => s.label !== catDefaultLabel && PREMIUM_LABELS.includes(s.label)
            );
            const allGroup = voiceSamples.filter(
              (s) => s.label !== catDefaultLabel && !PREMIUM_LABELS.includes(s.label)
            );

            const renderSampleCard = (s: VoiceSample, groupLabel?: string) => (
              <div
                key={s.label}
                className={`rounded-xl border p-4 transition-all ${
                  s.error
                    ? "border-red-700/40 bg-red-900/10"
                    : appliedVoice?.label === s.label
                    ? "border-emerald-500/70 bg-emerald-600/10"
                    : playingLabel === s.label
                    ? "border-indigo-500/60 bg-indigo-600/10"
                    : "border-slate-700/40 bg-slate-800/30"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white truncate">{s.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5 flex flex-wrap gap-2">
                      <span>{s.provider}</span>
                      {s.voice && <span className="text-indigo-400">{s.voice}</span>}
                      {s.speed !== undefined && <span>×{s.speed}</span>}
                      {s.model && <span className="text-slate-600">{s.model}</span>}
                      {s.durationSec > 0 && <span>{s.durationSec}s</span>}
                    </p>
                  </div>

                  {s.error ? (
                    <span className="text-xs text-red-400 shrink-0">⚠️ {s.error}</span>
                  ) : (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handlePlay(s.label)}
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                          playingLabel === s.label
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                        }`}
                      >
                        {playingLabel === s.label ? "⏸" : "▶"}
                      </button>
                      <a
                        href={s.url}
                        download={`${s.label}.mp3`}
                        className="w-9 h-9 rounded-full bg-slate-700 text-slate-300 hover:bg-slate-600 flex items-center justify-center text-sm transition-all"
                        title="다운로드"
                      >
                        ↓
                      </a>
                      {/* 이 카테고리에 적용 */}
                      {s.voice && s.speed !== undefined && s.model && (
                        <button
                          onClick={() => {
                            setAppliedVoice({
                              label: s.label,
                              voice: s.voice!,
                              speed: s.speed!,
                              model: s.model!,
                              instructions: s.instructions,
                              provider: s.provider,
                            });
                            setTab("generate");
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                            appliedVoice?.label === s.label
                              ? "bg-emerald-600 text-white"
                              : "bg-slate-700/60 text-slate-300 hover:bg-emerald-600/70 hover:text-white"
                          }`}
                          title="이 목소리를 렌더에 사용"
                        >
                          {appliedVoice?.label === s.label ? "✅ 적용됨" : "적용"}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* 히든 오디오 */}
                {!s.error && (
                  <audio
                    ref={(el) => { audioRefs.current[s.label] = el; }}
                    src={s.url}
                    onEnded={() => setPlayingLabel("")}
                    className="hidden"
                  />
                )}
              </div>
            );

            return (
              <div className="space-y-6">
                <p className="text-xs font-semibold text-slate-400">{voiceSamples.length}개 샘플 생성 완료</p>

                {catGroup.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-amber-400 uppercase tracking-wider">⭐ 카테고리 추천</p>
                    {catGroup.map((s) => renderSampleCard(s))}
                  </div>
                )}

                {premiumGroup.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-violet-400 uppercase tracking-wider">💎 Premium 후보</p>
                    {premiumGroup.map((s) => renderSampleCard(s))}
                  </div>
                )}

                {allGroup.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">🎙️ 전체 후보</p>
                    {allGroup.map((s) => renderSampleCard(s))}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* ── 탭 3: 결과 영상 ── */}
      {tab === "result" && (
        <div className="glass-card rounded-2xl p-6">
          {videoUrl ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white">생성된 영상</h3>
                <a
                  href={videoUrl}
                  download
                  className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600/30 text-indigo-300 hover:bg-indigo-600/50 transition-all"
                >
                  ↓ 다운로드
                </a>
              </div>

              {/* 9:16 비율 컨테이너 */}
              <div className="mx-auto" style={{ maxWidth: 360 }}>
                <div className="relative w-full" style={{ paddingBottom: "177.78%" }}>
                  <video
                    key={videoUrl}
                    src={videoUrl}
                    controls
                    autoPlay
                    loop
                    playsInline
                    className="absolute inset-0 w-full h-full rounded-2xl object-cover bg-black"
                  />
                </div>
              </div>

              {/* 렌더 완료 경고 (길이 초과, fallback 씬 등) */}
              {renderWarnings.length > 0 && (
                <div className="rounded-xl bg-amber-900/30 border border-amber-700/40 p-3 space-y-1.5">
                  {renderWarnings.map((w, i) => (
                    <div key={i} className="text-[11px] text-amber-300">{w}</div>
                  ))}
                </div>
              )}

              {/* 메타 정보 */}
              {plan && (
                <div className="rounded-xl bg-slate-800/40 border border-slate-700/40 p-4 space-y-2 text-sm">
                  <p className="text-white font-semibold">{plan.topTitle}</p>
                  <p className="text-xs text-slate-400">{plan.scenes.length}씬 · {plan.estimatedDuration}초</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {plan.hashtags?.map((tag, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-indigo-600/20 text-indigo-300">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 pt-1">{plan.callToAction}</p>
                </div>
              )}

              {/* 씬 싱크 디버그 */}
              {sceneSyncInfo.length > 0 && (
                <div className="rounded-xl border border-slate-700/40 overflow-hidden">
                  <button
                    onClick={() => setShowSyncDebug((v) => !v)}
                    className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/40 transition-all"
                  >
                    <span>🔍 씬별 싱크 확인 ({sceneSyncInfo.length}씬)</span>
                    <span>{showSyncDebug ? "▲" : "▼"}</span>
                  </button>
                  {showSyncDebug && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-800/60 text-slate-400">
                            <th className="px-2 py-1.5 text-left w-6">#</th>
                            <th className="px-2 py-1.5 text-left">자막</th>
                            <th className="px-2 py-1.5 text-left">나레이션</th>
                            <th className="px-2 py-1.5 text-center w-12">초</th>
                            <th className="px-2 py-1.5 text-center w-20">모션</th>
                            <th className="px-2 py-1.5 text-center w-20">이미지소스</th>
                            <th className="px-2 py-1.5 text-center w-10">파일</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sceneSyncInfo.map((s) => (
                            <tr key={s.sceneNumber} className="border-t border-slate-700/30 hover:bg-slate-800/20">
                              <td className="px-2 py-1.5 text-slate-500">{s.sceneNumber}</td>
                              <td className="px-2 py-1.5 text-white font-medium">{s.caption}</td>
                              <td className="px-2 py-1.5 text-slate-400 max-w-[160px] truncate" title={s.narration}>{s.narration}</td>
                              <td className="px-2 py-1.5 text-center text-indigo-400">{s.durationSec.toFixed(1)}</td>
                              <td className="px-2 py-1.5 text-center">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                                  s.motion === "character_pulse"
                                    ? "bg-amber-500/20 text-amber-400"
                                    : s.motion === "alive"
                                    ? "bg-emerald-500/20 text-emerald-400"
                                    : s.motion === "character_talk"
                                    ? "bg-red-500/20 text-red-400"
                                    : "bg-slate-700/40 text-slate-400"
                                }`}>
                                  {s.motion.replace("character_", "").replace("slow_zoom_", "zoom")}
                                </span>
                              </td>
                              <td className="px-2 py-1.5 text-center">
                                <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                                  s.imageProvider === "imagen"
                                    ? "bg-emerald-500/20 text-emerald-400"
                                    : s.imageProvider === "pollinations"
                                    ? "bg-blue-500/20 text-blue-400"
                                    : "bg-red-500/20 text-red-400"
                                }`}>
                                  {s.imageProvider}
                                </span>
                              </td>
                              <td className="px-2 py-1.5 text-center">
                                {s.hasImage === false
                                  ? <span className="text-red-400 text-[10px]">✗</span>
                                  : <span className="text-emerald-400 text-[10px]">✓</span>
                                }
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* 재생성 링크 */}
              <button
                onClick={() => { setTab("generate"); setStep("generated"); }}
                className="w-full py-2.5 rounded-xl text-xs font-medium bg-slate-700/40 text-slate-400 hover:bg-slate-700/60 transition-all"
              >
                ← 콘티 수정 또는 재렌더
              </button>
            </div>
          ) : (
            <div className="text-center py-16 text-slate-500">
              <p className="text-4xl mb-3">📺</p>
              <p className="text-sm">아직 생성된 영상이 없습니다.</p>
              <button
                onClick={() => setTab("generate")}
                className="mt-4 px-4 py-2 rounded-xl bg-indigo-600/30 text-indigo-300 text-xs hover:bg-indigo-600/50 transition-all"
              >
                콘티 생성으로 이동 →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
