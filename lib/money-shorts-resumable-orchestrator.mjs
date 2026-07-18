export const MONEY_SHORTS_RESUMABLE_ORCHESTRATOR_VERSION = "money_shorts_resumable_orchestrator_v1";

export const MONEY_SHORTS_RESUMABLE_STAGE_ORDER = Object.freeze([
  "script",
  "character",
  "tts",
  "images",
  "visual_review",
  "flow_prepare",
  "flow_generation",
  "flow_qa",
  "render",
  "quality_gate",
  "preflight",
  "publication",
]);

const STAGE_LABELS = Object.freeze({
  script: "확정 대본",
  character: "주인공 기준 이미지",
  tts: "실제 음성",
  images: "장면 이미지",
  visual_review: "이미지 Owner 검수",
  flow_prepare: "Veo 모션 패킷",
  flow_generation: "Veo 모션 생성",
  flow_qa: "Veo 모션 Owner 검수",
  render: "최종 영상 렌더",
  quality_gate: "최종 미디어 품질",
  preflight: "게시 전 점검",
  publication: "인스타그램·유튜브 게시",
});

export const MONEY_SHORTS_SAFE_AUTO_ADVANCE_ACTIONS = Object.freeze([
  "realTtsPreflight",
  "flowMotionPrepare",
  "finalVideoCreate",
  "wizardPreflight",
]);

const SAFE_AUTO_ADVANCE_ACTIONS = new Set(MONEY_SHORTS_SAFE_AUTO_ADVANCE_ACTIONS);

export function isMoneyShortsSafeAutoAdvanceAction(action) {
  return typeof action === "string" && SAFE_AUTO_ADVANCE_ACTIONS.has(action);
}

function nextForStage(stageId, input) {
  if (stageId === "script") {
    return {
      action: "scriptPreview",
      gate: "owner_topic_selection",
      reason: "Owner가 고른 주제의 대본을 확정해야 합니다.",
    };
  }
  if (stageId === "character") {
    return {
      action: "characterCastStatus",
      gate: "owner_character_selection",
      reason: "담당 주인공의 기준 이미지를 Owner가 확정해야 합니다.",
    };
  }
  if (stageId === "tts") {
    if (
      input.realTtsGenerated === true &&
      input.realTtsQualityAccepted !== true
    ) {
      return {
        action: "realTtsQualityAccept",
        gate: "owner_tts_listening_approval",
        reason:
          "생성된 모든 편의 실제 음성을 Owner가 직접 듣고 현재 오디오 해시를 승인해야 합니다.",
      };
    }
    return {
      action: "realTtsPreflight",
      gate: "owner_paid_tts",
      reason: "현재 대본 해시로 무료 승인 패킷을 만든 뒤 유료 TTS 승인에서 멈춥니다.",
    };
  }
  if (stageId === "images") {
    return {
      action: "realSceneImagesCreate",
      gate: "owner_image_generation",
      reason: "장면 이미지 외부 생성을 시작하기 전에 Owner 승인이 필요합니다.",
    };
  }
  if (stageId === "visual_review") {
    return {
      action: "realSceneImagesReviewAccept",
      gate: "owner_visual_qa",
      reason: "생성된 전체 이미지 세트를 Owner가 보고 승인해야 합니다.",
    };
  }
  if (stageId === "flow_prepare") {
    return {
      action: "flowMotionPrepare",
      gate: "none",
      reason: "선정 장면의 해시 고정 패킷을 로컬에서 준비할 수 있습니다.",
    };
  }
  if (stageId === "flow_generation") {
    if (input.flowState === "generating") {
      return {
        action: null,
        gate: "manual_recovery",
        reason: "이미 외부 생성이 시작된 상태입니다. 결과 식별 전에는 재전송하지 않습니다.",
      };
    }
    return {
      action: "flowMotionGenerate",
      gate: "owner_paid_flow",
      reason: "장면별 reference/prompt 해시 승인 후에만 Flow 생성을 1회 전송할 수 있습니다.",
    };
  }
  if (stageId === "flow_qa") {
    if (input.flowState === "qa_failed") {
      return {
        action: null,
        gate: "owner_flow_rework_decision",
        reason: "검수 실패 장면은 자동 재생성하지 않고 Owner 결정에서 멈춥니다.",
      };
    }
    if (input.flowState === "qa_pending") {
      return {
        action: "flowMotionQaPass",
        gate: "owner_flow_qa",
        reason: "Owner가 모션 영상의 7개 품질 항목을 직접 확인해야 합니다.",
      };
    }
    return {
      action: null,
      gate: "manual_recovery",
      reason: "Veo 검수 상태가 렌더 준비로 확정되지 않아 자동 진행을 중단합니다.",
    };
  }
  if (stageId === "render") {
    return {
      action: "finalVideoCreate",
      gate: "none",
      reason: "검증된 음성·이미지·Veo 결과만 사용해 로컬 최종 렌더를 실행할 수 있습니다.",
    };
  }
  if (stageId === "quality_gate") {
    if (input.finalVideoOwnerApproved !== true) {
      return {
        action: "finalVideoReviewAccept",
        gate: "owner_final_media_qa",
        reason:
          "Owner가 모든 최종 MP4와 게시 문구를 직접 확인하고 현재 full hash 묶음을 승인해야 합니다.",
      };
    }
    return {
      action: null,
      gate: "owner_final_media_qa",
      reason:
        "최종 MP4가 기술 미디어 품질 게이트를 통과하지 못해 수동 확인이 필요합니다.",
    };
  }
  if (stageId === "preflight") {
    return {
      action: "wizardPreflight",
      gate: "none",
      reason: "현재 최종 파일로 게시 전 점검을 다시 실행할 수 있습니다. 업로드는 하지 않습니다.",
    };
  }
  return {
    action: "actualUpload",
    gate: "owner_publication_confirmation",
    reason: "세 가지 확인과 문자 ‘업로드’ 입력 전에는 실제 게시를 실행하지 않습니다.",
  };
}

/**
 * Durable artifact facts -> deterministic next step. This function performs no I/O and
 * never executes a paid generation, browser action, render, upload, or publication.
 */
export function buildMoneyShortsResumablePlan(input) {
  if (!input || typeof input.topicId !== "string" || input.topicId.trim().length === 0) {
    throw new Error("resumable_orchestrator_topic_id_required");
  }

  const imagesTechnicallyReviewable =
    input.realImagesReviewable === true ||
    (input.realImagesReviewable === undefined && input.realImagesReady === true);
  const flowNotRequired = input.flowState === "not_required";
  const flowPrepared = flowNotRequired || input.flowState !== "not_prepared";
  const flowGenerationComplete = flowNotRequired || ["qa_pending", "qa_pass", "qa_failed", "render_ready"].includes(input.flowState);
  const flowQaComplete = flowNotRequired || input.flowReadyForRender === true;

  const ready = {
    script: input.scriptReady === true,
    character: input.characterReady === true,
    tts:
      input.realTtsQualityAccepted === true ||
      (input.realTtsQualityAccepted === undefined &&
        input.realTtsReady === true),
    images: imagesTechnicallyReviewable,
    visual_review: input.realImagesReady === true,
    flow_prepare: flowPrepared,
    flow_generation: flowGenerationComplete,
    flow_qa: flowQaComplete,
    render: input.finalVideoReady === true,
    quality_gate: input.mediaQualityGateOk === true,
    preflight: input.publishPreflightReady === true,
    publication: input.publishedAllParts === true,
  };

  const currentStageId = MONEY_SHORTS_RESUMABLE_STAGE_ORDER.find((stageId) => ready[stageId] !== true) ?? null;
  const currentIndex = currentStageId == null ? MONEY_SHORTS_RESUMABLE_STAGE_ORDER.length : MONEY_SHORTS_RESUMABLE_STAGE_ORDER.indexOf(currentStageId);
  const stages = MONEY_SHORTS_RESUMABLE_STAGE_ORDER.map((stageId, index) => ({
    id: stageId,
    label: STAGE_LABELS[stageId],
    state: ready[stageId] === true ? "ready" : index === currentIndex ? "current" : "waiting",
  }));
  const baseNext = currentStageId ? nextForStage(currentStageId, input) : null;
  const next = baseNext ? {
    stageId: currentStageId,
    stageLabel: STAGE_LABELS[currentStageId],
    ...baseNext,
    canAutoAdvance:
      baseNext.action === "realTtsPreflight" ||
      (baseNext.action != null && SAFE_AUTO_ADVANCE_ACTIONS.has(baseNext.action) && baseNext.gate === "none"),
  } : null;

  const status = currentStageId == null
    ? "complete"
    : next?.canAutoAdvance === true
      ? "ready_to_advance"
      : next?.gate === "owner_publication_confirmation"
        ? "publication_confirmation_required"
        : next?.gate === "manual_recovery"
          ? "manual_recovery_required"
          : "owner_action_required";

  return {
    schemaVersion: MONEY_SHORTS_RESUMABLE_ORCHESTRATOR_VERSION,
    topicId: input.topicId,
    status,
    completedStageCount: stages.filter((stage) => stage.state === "ready").length,
    totalStageCount: stages.length,
    stages,
    next,
    safeAutoAdvanceActions: next?.canAutoAdvance && next.action ? [next.action] : [],
    safety: {
      externalGenerationExecuted: false,
      paidActionExecuted: false,
      renderExecuted: false,
      uploadExecuted: false,
      publicationExecuted: false,
      automaticRetryAllowed: false,
    },
  };
}
