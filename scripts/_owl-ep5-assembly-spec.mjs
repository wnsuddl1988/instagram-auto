/**
 * 부엉이 쇼츠 조립 스펙 — 10장면의 영상·나레이션·오버레이를 한곳에서 정의한다.
 *
 * 이 파일은 원래 _ai/OWL_EP5_ASSEMBLY_SPEC_BACKUP.mjs 에만 있던 5편 스펙을
 * scripts/ 아래로 정식 이전한 것이다(2026-09-20) — 5편이 scripts/ 안에 활성
 * 파일 없이 _ai/ 백업으로만 존재해, 자막 강조 구조 개선(emphasisTerms)을
 * 적용하려면 먼저 정식 위치로 옮겨야 했다. 원본 백업의 설계 원칙·개정 이력은
 * 그대로 보존한다.
 *
 * 5편 출처: C:/tmp/owl-ep5-llm-response.json candidate-03
 *           (한국은행 기준금리 3.00%, 11월 추가 인상 유력 — 거시경제·금리 도메인 macro_rate).
 * 4편: scripts/_owl-ep4-assembly-spec.mjs (서울 12평 이하 아파트값 15% 상승, 배포 대기).
 * 3편: scripts/_owl-ep3-assembly-spec.mjs (서울 집값 84주 연속 상승·전세난 역설, 게시 완료).
 * 2편: scripts/_owl-ep2-assembly-spec.mjs (가계부채 목표 근접·규제 유지, 게시 완료).
 * 1편: scripts/_owl-assembly-spec.mjs (기준금리→카드론 전가, 게시 완료).
 *
 * closing_disclaimer는 스펙에 넣지 않는다(3편부터 확정) — 마지막 action 장면에서
 * 바로 끝내고 고정 CTA 클립(밝은 톤, follow+teaser)을 조립 단계에서 이어붙인다.
 *
 * impact/action 보강(2026-09-18 Owner 지적): 원안이 "변동금리 대출자 확인"에만
 * 집중돼 1편(리볼빙)·2편(변동→고정 전환)과 메시지가 반복됐다. impact를 대출자
 * (impact_a)와 자산시장(impact_b, 국고채 금리 상승↔코스피 부담) 두 갈래로 넓히고,
 * action도 변동금리 대출자·신규 대출 예정자·투자자 세 유형으로 나눠 서로 다른
 * 행동을 제시한다 — action 2~3분할 원칙(2026-09-18 확정)을 그대로 적용.
 *
 * 씬 구성 원칙(2026-09-18 Owner 확정, 4편부터 표준):
 *   - 정보량이 많은 앞부분(hook~background)은 Gemini로 10초까지 여유 있게,
 *     뒷부분(twist~action)은 Flow 8초 규칙에 맞춰 진행한다.
 *
 * 5편 2차 개정(2026-09-18 Owner 지적, 재작업):
 *   - 1차본이 본편 83초로 늘어져("루즈하다") 나레이션을 전면 압축, 10씬 구조는
 *     유지하되 각 문장을 8초 발화 분량(25~41자)에 맞췄다. S-04(손실회피
 *     키워드) 판정을 유지하려면 "모르고 지나치면" 패턴을 반드시 남겨야 한다
 *     (live-topic-score.ts STRONG_LOSS_AVERSION 정규식) — 압축 시 이 구절
 *     자체를 없애면 하드컷은 통과해도 점수가 떨어진다(실측: 14→13점).
 *   - 1차본 이미지가 "빈 소품(백지/전광판/격자판)이 아무 방향성도 없이 텅
 *     비어" 화면이 허전하다는 지적(Owner, 스크린샷으로 직접 확인) — 씬5만
 *     예외(게이지 바늘이 있어 방향성 표현됨). 나머지 9씬(1~4, 6~10)은 소품에
 *     화살표/체크 같은 최소한의 방향성 아이콘을 반영해 재생성한다.
 *   - 씬 1~10 전체를 Flow(8초)로 통일한다 — 이전 편처럼 Gemini/Flow를 씬별로
 *     나누지 않는다.
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
  sourceCandidate: "candidate-03-bok-november-hike-final",
  title: "한국은행 기준금리 3.00%, 11월 추가 인상 유력",
  channelName: "경제번역소",
  headerTitle: ["한국은행 기준금리 3.00%", "11월 추가 인상 유력"],

  instagramCaptionHook: "한국은행이 11월에 기준금리를 또 올릴 수 있다는 거 알아?",
  instagramCaptionPoints: [
    "한국은행 기준금리 현재 3.00% — 8월에 2.75%에서 0.25%p 인상",
    "집값·유가·환율까지 겹치며 3연속 인상 가능성 열려있어",
    "유가 85달러 밑으로 안 꺾이면 3.5%까지 갈 수 있다는 전망",
    "대출자는 이자 부담, 투자자는 자산시장 부담까지 함께 커져",
    "변동금리 대출자·신규 대출 예정자·투자자별로 오늘 할 일이 달라",
  ],
  instagramPriorityTags: ["기준금리", "한국은행", "금리인상", "대출금리", "변동금리"],

  // 자막 강조색이 적용될 이 편의 핵심 용어·출처 기관명(2026-09-20 구조 개선 —
  // 편마다 조립기 파일의 전역 목록을 직접 수정하지 않고 스펙에서 선언한다).
  // 배열의 첫 항목(기준금리)은 이 편의 대표 주제어로, 조립기가 한 자막 줄의
  // 강조 슬롯이 숫자로 다 찼어도 항상 우선 강조한다.
  emphasisTerms: [
    "기준금리", "한국은행", "국고채", "자산시장", "중앙일보", "파이낸셜뉴스", "ECOS",
  ],

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
      video: "owl_ep5_s1_hook_motion.mp4",
      narration: "한국은행이 11월에 기준금리를 또 올릴 수 있다는 거 알아?",
      overlays: [],
    },
    {
      scene: 2,
      key: "s2_loss_aversion",
      role: "loss_aversion",
      video: "owl_ep5_s2_loss_aversion_motion.mp4",
      narration: "대출도 투자도 이 흐름을 모르고 지나치면 부담이 커질 수 있어.",
      overlays: [
        { text: "대출", x: 175, y: 870, size: 40, kind: "accent" },
        { text: "투자", x: 745, y: 870, size: 40, kind: "accent" },
        { text: "대출 · 투자 동시 점검 필요", x: 130, y: 1250, size: 38, kind: "label" },
      ],
    },
    {
      scene: 3,
      key: "s3_evidence_card",
      role: "evidence_card",
      video: "owl_ep5_s3_evidence_card_motion.mp4",
      narration: "오늘 기준 한국은행 기준금리는 3.00%, 8월에 0.25%p 올린 수준이야.",
      overlays: [
        { text: "한국은행 기준금리", x: 130, y: 1020, size: 36, kind: "label" },
        { text: "3.00%", x: 130, y: 1100, size: 56, kind: "accent" },
        { text: "직전 2.75% → +0.25%p", x: 130, y: 1195, size: 36, kind: "value" },
        { text: "한국은행", x: 130, y: 1290, size: 28, kind: "source" },
      ],
    },
    {
      scene: 4,
      key: "s4_background",
      role: "background",
      video: "owl_ep5_s4_background_motion.mp4",
      narration: "원달러 환율도 1380.3원 넘었고, 집값·유가까지 겹치며 인상 가능성이 열렸어.",
      overlays: [
        { text: "원달러 환율", x: 130, y: 1020, size: 36, kind: "label" },
        { text: "1,380원 돌파", x: 130, y: 1100, size: 48, kind: "accent" },
        { text: "집값 · 유가 동반 상승", x: 130, y: 1195, size: 36, kind: "label" },
        { text: "중앙일보", x: 130, y: 1290, size: 28, kind: "source" },
      ],
    },
    {
      scene: 5,
      key: "s5_twist",
      role: "twist",
      video: "owl_ep5_s5_twist_motion.mp4",
      narration: "핵심은 인상 여부가 아니야. 유가가 85달러 밑으로 안 꺾이면 3.5%까지 갈 수 있어.",
      overlays: [
        { text: "유가 85달러 안 꺾이면", x: 130, y: 1190, size: 40, kind: "label" },
        { text: "기준금리 3.5%까지", x: 130, y: 1270, size: 46, kind: "alert" },
        { text: "파이낸셜뉴스", x: 130, y: 1365, size: 28, kind: "source" },
      ],
    },
    {
      scene: 6,
      key: "s6_impact_a",
      role: "impact",
      video: "owl_ep5_s6_impact_a_motion.mp4",
      narration: "신규 대출뿐 아니라 기존 변동금리 대출자의 이자 부담도 함께 커질 수 있어.",
      overlays: [
        { text: "이자 부담 ↑", x: 410, y: 960, size: 44, kind: "alert" },
        { text: "변동금리 대출자 이자 부담↑", x: 130, y: 1250, size: 38, kind: "alert" },
      ],
    },
    {
      scene: 7,
      key: "s7_impact_b",
      role: "impact",
      video: "owl_ep5_s7_impact_b_motion.mp4",
      narration: "동시에 국고채 3년물 금리도 4.063%까지 오르며 자산시장에도 부담을 주고 있어.",
      overlays: [
        { text: "국고채 3년물", x: 130, y: 1190, size: 36, kind: "label" },
        { text: "4.06%", x: 130, y: 1270, size: 46, kind: "alert" },
        { text: "한국은행 ECOS", x: 130, y: 1365, size: 28, kind: "source" },
      ],
    },
    {
      scene: 8,
      key: "s8_action_a",
      role: "action",
      video: "owl_ep5_s8_action_a_motion.mp4",
      narration: "변동금리 대출이 있다면 오늘 고정금리 전환과 중도상환 수수료부터 확인해보자.",
      overlays: [
        { text: "고정금리 전환", x: 695, y: 860, size: 38, kind: "accent" },
        { text: "고정금리 전환 · 중도상환 수수료 확인", x: 130, y: 1250, size: 34, kind: "label" },
      ],
    },
    {
      scene: 9,
      key: "s9_action_b",
      role: "action",
      video: "owl_ep5_s9_action_b_motion.mp4",
      narration: "반대로 대출 전이라면, 금리가 더 오르기 전에 조건부터 미리 알아보는 게 나아.",
      overlays: [
        { text: "대출 조건 확인", x: 470, y: 1010, size: 38, kind: "accent" },
        { text: "신규 대출 조건 미리 확인", x: 130, y: 1250, size: 38, kind: "label" },
      ],
    },
    {
      scene: 10,
      key: "s10_action_c",
      role: "action",
      video: "owl_ep5_s10_action_c_motion.mp4",
      narration: "투자 쪽도 마찬가지야. 금리에 취약한 종목 비중부터 오늘 꼭 점검해보자.",
      overlays: [
        { text: "종목 비중 점검", x: 695, y: 860, size: 36, kind: "accent" },
        { text: "금리 취약 종목 비중 점검", x: 130, y: 1250, size: 38, kind: "label" },
      ],
    },
  ]),
});

/** 장면 키로 스펙을 찾는다. */
export function findScene(key) {
  return OWL_ASSEMBLY_SPEC.scenes.find((s) => s.key === key) ?? null;
}
