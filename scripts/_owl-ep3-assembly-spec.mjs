/**
 * 부엉이 쇼츠 조립 스펙 — 11장면의 영상·나레이션·오버레이를 한곳에서 정의한다.
 *
 * 3편 출처: C:/tmp/owl-ep3-llm-response.json candidate-01
 *           (서울 아파트값 84주 연속 상승 → 전세난 역설 → HUG 안심신탁).
 * 2편: scripts/_owl-ep2-assembly-spec.mjs (가계부채 목표 근접·규제 유지, 게시 완료).
 * 1편: scripts/_owl-assembly-spec.mjs (기준금리→카드론 전가, 게시 완료).
 *
 * 8장면 고정 규칙 폐기(2026-09-17 Owner 승인) 이후 첫 편이라 장면 수가 11개다.
 * closing_disclaimer는 이 편부터 스펙에 넣지 않는다(투자 콘텐츠가 아닌데 투자용
 * 면책 문구가 어색하다는 지적, Owner) — 11번(action) 장면에서 바로 끝내고
 * 고정 CTA 클립(owl_cta_final_with_captions.mp4)을 조립 단계에서 이어붙인다.
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
  sourceCandidate: "candidate-01-seoul-housing-84weeks-jeonse-paradox",
  title: "서울 집값 84주 연속 상승, 전세난은 왜 이렇게 심해졌을까?",
  channelName: "경제번역소",
  // 상단 고정 제목 바. 벤치마킹 채널(moneyhunter_kr)처럼 주제를 한 문장으로 붙박아
  // 스크롤하다 멈춘 사람이 0.5초 안에 무슨 영상인지 알게 한다.
  headerTitle: ["서울 집값 84주 연속 상승", "전세난은 왜 심해졌나"],

  // Instagram 캡션 전용 후킹 문구(2026-09-18 Owner 지적: "그냥 대본을 쭉 써놨다,
  // 후킹내용으로 써달라" — _owl-publish-metadata.mjs가 evidence_card/twist/
  // impact/action 나레이션을 그대로 나열하던 걸 대체한다). 대본 원문이 아니라
  // 캡션에서만 쓰는 짧고 궁금증을 자극하는 문장으로 편마다 직접 쓴다.
  instagramCaptionHook: "84주 연속 오른 서울 집값, 근데 강남 3구는 6주째 떨어지고 있다는 거 알아?",
  instagramCaptionPoints: [
    "서울 아파트값 84주 연속 상승 — 역대 최장 기록에 근접",
    "근데 강남 3구는 오히려 6주째 하락 중 — 반전 포인트",
    "실거주 유도 규제가 오히려 전세난을 키웠다는 아이러니",
    "전세 계약 앞뒀다면 갱신청구권·HUG 안심신탁부터 확인",
  ],
  // 자동 추출 태그(topicTagsFrom)가 나레이션의 "실거주 유도 규제" 같은 문구에
  // 걸려 "대출"류 태그를 이 편의 실제 주제(전세난)보다 앞에 두는 문제가 있어,
  // 우선순위 태그를 직접 지정한다.
  instagramPriorityTags: ["전세난", "전세사기", "부동산", "전세", "월세"],

  // 최종 산출 규격. 소스가 720x1280이라 업스케일이 필요하다.
  render: Object.freeze({
    width: 1080,
    height: 1920,
    fps: 24, // 소스 11개가 전부 24fps — 재타이밍 없이 그대로 간다
    videoCodec: "libx264",
    crf: 18,
    pixFmt: "yuv420p",
    audioCodec: "aac",
    audioBitrate: "192k",
    audioSampleRate: 48000, // 소스 오디오가 48kHz
    audioChannels: 1,
  }),

  scenes: Object.freeze([
    {
      scene: 1,
      key: "s1_hook",
      role: "hook",
      video: "owl_ep3_s1_hook_motion.mp4",
      narration: "서울 집값이 84주째 연속 상승 중인 거 알고 있었어?",
      overlays: [],
    },
    {
      scene: 2,
      key: "s2_loss_aversion",
      role: "loss_aversion",
      video: "owl_ep3_s2_loss_aversion_motion.mp4",
      narration: "전세 구하던 사람이라면 이거 놓치면 손해야. 집주인이 실거주한다고 나가라는 일이 늘고 있거든.",
      overlays: [],
    },
    {
      scene: 3,
      key: "s3_evidence_card",
      role: "evidence_card",
      video: "owl_ep3_s3_evidence_card_motion.mp4",
      narration: "한국부동산원 집계로 이번 주 서울 아파트값은 0.16% 상승, 84주 연속 오른 거야.",
      overlays: [
        { text: "서울 아파트값 주간 변동률", x: 130, y: 1020, size: 36, kind: "label" },
        { text: "+0.16%", x: 130, y: 1100, size: 52, kind: "value" },
        { text: "84주 연속 상승", x: 130, y: 1195, size: 46, kind: "accent" },
        { text: "한국부동산원", x: 130, y: 1290, size: 28, kind: "source" },
      ],
    },
    {
      scene: 4,
      key: "s4_background",
      role: "background",
      video: "owl_ep3_s4_background_motion.mp4",
      narration: "역대 최장 기록은 문재인 정부 때인 2020년 6월~2022년 1월인데, 지금 다가서고 있어.",
      overlays: [
        { text: "역대 최장 상승 기록", x: 130, y: 1190, size: 40, kind: "label" },
        { text: "2020.06 ~ 2022.01", x: 130, y: 1270, size: 44, kind: "value" },
        { text: "한국부동산원", x: 130, y: 1365, size: 28, kind: "source" },
      ],
    },
    {
      scene: 5,
      key: "s5_twist",
      role: "twist",
      video: "owl_ep3_s5_twist_motion.mp4",
      narration: "핵심은 집값 상승만이 아니야. 강남 3구는 오히려 6주째 하락 중이거든.",
      // "강남 3구는 6주째 하락"이 x=560에서 시작해 alert 스케일(44*1.35≈59px
      // 글자폭)로 화면 우측 밖까지 넘쳐 잘렸다(Owner 2026-09-18, 33초 부근 지적).
      // 다른 씬과 동일하게 x=130(좌측 안전영역)으로 옮겨 폭 안에 들어오게 한다.
      overlays: [
        { text: "서울 전체", x: 745, y: 760, size: 40, kind: "label" },
        { text: "상승", x: 890, y: 620, size: 40, kind: "accent" },
        { text: "강남 3구는 6주째 하락", x: 130, y: 1230, size: 44, kind: "alert" },
        { text: "동아일보", x: 130, y: 1330, size: 28, kind: "source" },
      ],
    },
    {
      scene: 6,
      key: "s6_impact_a",
      role: "impact",
      video: "owl_ep3_s6_impact_a_motion.mp4",
      // 자막 폭 계약 위반 수정(2026-09-18): "종부세·양도세·대출규제가"가 가운뎃점으로
      // 이어진 한 어절 취급이라 줄바꿈이 안 되고 화면 폭(920px)을 넘었다. 음성-자막
      // 어절 수 대응 규칙(build-owl-tts-script-v1.mjs) 때문에 narration 자체를 공백
      // 분리 형태로 바꿔 해결한다.
      narration: "진짜 아이러니는 이거야. 종부세 양도세 대출규제가 실거주를 유도했는데,",
      overlays: [],
    },
    {
      scene: 7,
      key: "s7_impact_b",
      role: "impact",
      video: "owl_ep3_s7_impact_b_motion.mp4",
      narration: "오히려 전세 매물 품귀로 이어졌어. 규제가 전세난을 키운 셈이지.",
      overlays: [
        { text: "실거주 유도 규제", x: 130, y: 1190, size: 44, kind: "label" },
        { text: "→ 전세 매물 품귀", x: 130, y: 1290, size: 44, kind: "alert" },
        { text: "이투데이", x: 130, y: 1385, size: 28, kind: "source" },
      ],
    },
    {
      scene: 8,
      key: "s8_action_a",
      role: "action",
      video: "owl_ep3_s8_action_a_motion.mp4",
      narration: "만료가 다가온다면 등기부등본으로 갱신청구권 썼는지부터 확인해.",
      overlays: [],
    },
    {
      scene: 9,
      key: "s9_action_b",
      role: "action",
      video: "owl_ep3_s9_action_b_motion.mp4",
      narration: "안 썼으면 집주인한테 연장 요구할 수 있어. 몰라서 그냥 나가는 사람이 많거든.",
      overlays: [],
    },
    {
      scene: 10,
      key: "s10_action_c",
      role: "action",
      video: "owl_ep3_s10_action_c_motion.mp4",
      narration: "HUG 안심신탁 쓰면 집주인이 보증금을 못 건드려서 전세사기 걱정이 줄어.",
      overlays: [
        { text: "HUG 전월세 안심신탁", x: 130, y: 1290, size: 42, kind: "label" },
      ],
    },
    {
      scene: 11,
      key: "s11_action_d",
      role: "action",
      video: "owl_ep3_s11_action_d_motion.mp4",
      // "이것도 같이 알아봐."의 "봐"가 ElevenLabs에서 2회 연속 재현되게 끊겨
      // 들렸다(Owner 2026-09-18). 어미를 "봐"(개방형 명령)에서 "보자"(청유형,
      // 종결 음절이 하나 더 있어 TTS가 흐지부지 마무리할 여지가 줄어듦)로 바꿔
      // 재생성 — 대본 의미는 동일, 끝맺음만 더 안정적인 형태로 교체.
      narration: "운용수익률도 4.35% 확정이니, 계약 앞뒀다면 이것도 같이 알아보자.",
      // "알아봐"→"알아보자" 수정으로 끝맺음이 자연스러워지면서, 여백을 두려고
      // 넣었던 tailPadSec(1.5s)이 불필요해졌다 — Owner 2026-09-18: "대본 끝나고
      // 자연스럽게 바로 다음 화면으로 넘어갈 수 있도록, 여유분 영상 안 틀어도
      // 됨". 다시 다른 씬과 동일하게 오디오 끝나면 바로 컷하는 기본 동작으로.
      overlays: [
        { text: "운용수익률 4.35% 확정", x: 130, y: 1290, size: 42, kind: "value" },
        { text: "연합인포맥스", x: 130, y: 1385, size: 28, kind: "source" },
      ],
    },
  ]),
});

/** 장면 키로 스펙을 찾는다. */
export function findScene(key) {
  return OWL_ASSEMBLY_SPEC.scenes.find((s) => s.key === key) ?? null;
}
