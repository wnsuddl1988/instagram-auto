/**
 * 부엉이 쇼츠 조립 스펙 — 9장면의 영상·나레이션·오버레이를 한곳에서 정의한다.
 *
 * 4편 출처: C:/tmp/owl-ep4-llm-response.json candidate-01
 *           (서울 12평 이하 초소형 아파트값 1년 새 15% 상승 — 부동산 도메인 real_estate).
 * 3편: scripts/_owl-ep3-assembly-spec.mjs (서울 집값 84주 연속 상승·전세난 역설, 게시 완료).
 * 2편: scripts/_owl-ep2-assembly-spec.mjs (가계부채 목표 근접·규제 유지, 게시 완료).
 * 1편: scripts/_owl-assembly-spec.mjs (기준금리→카드론 전가, 게시 완료).
 *
 * closing_disclaimer는 스펙에 넣지 않는다(3편부터 확정) — 마지막 action 장면에서
 * 바로 끝내고 고정 CTA 클립(밝은 톤, follow+teaser)을 조립 단계에서 이어붙인다.
 *
 * 씬 구성 원칙(2026-09-18 Owner 확정, 4편부터 표준):
 *   - action은 하나로 뭉뚱그리지 않고 2~3개 씬으로 나눠, 시청자가 실제로 취할 수
 *     있는 서로 다른 실행 채널(이번 편: 실거래가 조회 → 청약 자격 확인 → 대출
 *     한도 계산)을 각각 구체적으로 제시한다. "확인해봐" 한 줄로 뭉개지 않는다.
 *   - 정보량이 많은 앞부분(hook~background)은 Gemini로 10초까지 여유 있게,
 *     뒷부분(twist~action)은 Flow 8초 규칙에 맞춰 진행한다.
 *
 * 설계 원칙:
 *   - narration은 대본 원문 그대로 둔다. TTS 엔진이 숫자를 어떻게 읽는지는
 *     TTS 단계의 문제이고, 여기서 임의로 고쳐 쓰면 대본과 음성이 어긋난다.
 *   - overlay는 HC-10(이미지에 숫자를 굽지 않는다) 때문에 존재한다. 영상에는
 *     빈 카드/게이지만 있고, 실제 수치는 이 단계에서 렌더러가 얹는다.
 *   - 좌표는 1080x1920 기준이다(프로젝트 표준 해상도). 소스가 720x1280이므로
 *     조립 시 업스케일한 뒤 오버레이를 얹는 순서를 지켜야 한다.
 *   - 안전영역은 _ai/MONEY_SHORTS_OS_VIDEO_PIPELINE_SPEC_V1.md §3.1을 따른다:
 *     금지구역 y 0~150, y 1600~1920, x 900~1080.
 */

export const OWL_ASSEMBLY_SPEC = Object.freeze({
  specVersion: "owl_assembly_spec_v1",
  sourceCandidate: "candidate-01-small-apartment-price-surge",
  title: "서울 12평 이하 아파트값, 1년 새 15% 올랐다",
  channelName: "경제번역소",
  headerTitle: ["서울 12평 이하 아파트값", "1년 새 15% 상승"],

  instagramCaptionHook: "서울에서 제일 작은 아파트가 제일 많이 올랐다는 거 알아?",
  instagramCaptionPoints: [
    "서울 12평 이하 아파트값 1년 새 15% 상승 — 서울 전체 평균 14.6%보다 더 올랐다",
    "기준금리 3%까지 오른 상황에서도 거래는 오히려 중저가 소형 평형으로 몰렸다",
    "넓은 집보다 좁은 집에서 상승 압력이 더 크게 나타나는 반전",
    "자금 부족한 실수요자일수록 소형 평형 진입 장벽이 더 높아지는 아이러니",
  ],
  instagramPriorityTags: ["부동산", "아파트값", "내집마련", "청약", "실거래가"],

  render: Object.freeze({
    width: 1080,
    height: 1920,
    fps: 24,
    videoCodec: "libx264",
    crf: 18,
    pixFmt: "yuv420p",
    audioCodec: "aac",
    audioBitrate: "192k",
    audioSampleRate: 48000,
    audioChannels: 1,
  }),

  scenes: Object.freeze([
    {
      scene: 1,
      key: "s1_hook",
      role: "hook",
      video: "owl_ep4_s1_hook_motion.mp4",
      narration: "서울에서 제일 작은 아파트가 제일 많이 올랐다는 거 알아?",
      overlays: [],
    },
    {
      scene: 2,
      key: "s2_loss_aversion",
      role: "loss_aversion",
      video: "owl_ep4_s2_loss_aversion_motion.mp4",
      narration: "돈 모아서 나중에 작은 집부터 사면 된다고 미뤘다면, 이 흐름을 모르고 지나치면 그사이 가격이 더 올라 오히려 손해를 볼 수 있어.",
      overlays: [],
    },
    {
      scene: 3,
      key: "s3_evidence_card",
      role: "evidence_card",
      video: "owl_ep4_s3_evidence_card_motion.mp4",
      narration: "한국부동산원 집계로 7월 기준 서울 12평 이하 아파트값이 1년 새 15% 상승, 서울 아파트 전체 평균인 14.6%보다도 더 올랐어.",
      overlays: [
        { text: "서울 12평 이하", x: 130, y: 1020, size: 36, kind: "label" },
        { text: "+15%", x: 130, y: 1100, size: 56, kind: "accent" },
        { text: "서울 아파트 전체", x: 130, y: 1195, size: 36, kind: "label" },
        { text: "+14.6%", x: 130, y: 1270, size: 44, kind: "value" },
        { text: "한국부동산원 · 7월 기준", x: 130, y: 1360, size: 28, kind: "source" },
      ],
    },
    {
      scene: 4,
      key: "s4_background",
      role: "background",
      video: "owl_ep4_s4_background_motion.mp4",
      narration: "한국은행이 기준금리를 3%까지 올린 상황에서도 최근 거래가 중저가 아파트로 몰리면서 초소형 평형에 수요가 집중된 거야.",
      overlays: [
        { text: "한국은행 기준금리", x: 130, y: 1190, size: 40, kind: "label" },
        { text: "3.00%", x: 130, y: 1270, size: 44, kind: "value" },
        { text: "한국은행", x: 130, y: 1365, size: 28, kind: "source" },
      ],
    },
    {
      scene: 5,
      key: "s5_twist",
      role: "twist",
      video: "owl_ep4_s5_twist_motion.mp4",
      narration: "핵심은 집값이 올랐다는 사실만이 아니야. 실제로는 넓은 집보다 좁은 집에서 상승 압력이 더 크게 나타나고 있다는 거지.",
      overlays: [
        { text: "넓은 집", x: 745, y: 760, size: 40, kind: "label" },
        { text: "상승 압력 약함", x: 745, y: 830, size: 32, kind: "label" },
        { text: "좁은 집", x: 130, y: 1230, size: 44, kind: "accent" },
        { text: "상승 압력 더 큼", x: 130, y: 1300, size: 36, kind: "alert" },
      ],
    },
    {
      scene: 6,
      key: "s6_impact",
      role: "impact",
      video: "owl_ep4_s6_impact_motion.mp4",
      narration: "그래서 자금이 넉넉하지 않은 실수요자일수록 소형 평형 진입 장벽이 오히려 더 높아지고 있어.",
      overlays: [],
    },
    {
      scene: 7,
      key: "s7_action_a",
      role: "action",
      video: "owl_ep4_s7_action_a_motion.mp4",
      narration: "국토부 실거래가 공개시스템에서 관심 있는 평형의 최근 3개월 거래가부터 오늘 바로 확인해보자.",
      overlays: [
        { text: "국토부 실거래가 공개시스템", x: 130, y: 1290, size: 38, kind: "label" },
      ],
    },
    {
      scene: 8,
      key: "s8_action_b",
      role: "action",
      video: "owl_ep4_s8_action_b_motion.mp4",
      narration: "소형 평형을 노린다면 청약홈에서 생애최초·신혼부부 특별공급 자격과 일정도 같이 확인해봐.",
      overlays: [
        { text: "청약홈 특별공급 자격", x: 130, y: 1290, size: 38, kind: "label" },
      ],
    },
    {
      scene: 9,
      key: "s9_action_c",
      role: "action",
      video: "owl_ep4_s9_action_c_motion.mp4",
      narration: "자금이 부족하다면 주택도시기금 디딤돌대출 한도부터 미리 계산해두면 실제 매수 시점에 덜 급해져.",
      overlays: [
        { text: "주택도시기금 디딤돌대출", x: 130, y: 1290, size: 38, kind: "label" },
      ],
    },
  ]),
});

/** 장면 키로 스펙을 찾는다. */
export function findScene(key) {
  return OWL_ASSEMBLY_SPEC.scenes.find((s) => s.key === key) ?? null;
}
