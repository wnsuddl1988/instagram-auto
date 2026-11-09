/**
 * 금박사 조립 스펙 11편(신규 제작 — 오프닝 훅 뒤 재배치 첫 편) — 주휴수당,
 * 조건만 갖추면 신청 없이 급여에 자동으로 붙는 돈.
 *
 * 기준: _ai/CURRENT_STANDARDS.md §2. 짝 편: 부엉박사 17편(2027년 최저임금
 * 확정)에서 "주휴수당" 이름만 언급하고 계산법은 설명하지 않음 — 이 편이
 * 이어받아 조건·계산법·체감 금액을 풀어준다.
 *
 * ★ 11편부터 구조 변경(Owner 확정 2026-09-26): 오프닝(자기소개)을 훅
 * 뒤로 옮기고 한 문장으로 줄인다. s1 훅(체감 상황, 0초부터) → s2 오프닝
 * 한 문장 → 본문.
 *
 * ★★★ 2026-09-27 씬 구조 재확정(11씬 → 8씬) — 경위 기록 ★★★
 * 1차로 문장 하나하나를 전부 별도 씬으로 쪼개 11씬(그중 "그게 바로
 * 주휴수당이야" 1.45초처럼 극단적으로 짧은 씬 포함)까지 늘었던 것을
 * Owner가 지적("씬을 늘리려면 정보도 많아야지, 왜 필요없이 씬을
 * 계속 늘리냐"). 실제로 합칠 수 있는 문장 쌍을 전부 합쳐 6씬으로
 * 재구성했더니 TTS 실측 결과 통합 s3(target, 10.06초)·s5(feel+longterm
 * 통합, 10.413초) 두 곳만 9.5초 규칙을 초과 — 이 두 곳만 원래 문장
 * 경계에서 다시 나누고 나머지는 통합 유지해 최종 8씬으로 확정.
 * 최종본: s1 hook(질문+한줄정리 통합, 5.22초), s2 opening(3.056초),
 * s3 target(4.9초), s4 target_detail(4.85초), s5 method(계산식+예시
 * 통합, 7.77초), s6 feel_conversion(4.173초), s7 longterm_simulation
 * (5.376초), s8 closing(자동지급+확인당부 통합, 8.18초) — 전부 9.5초
 * 이내, 짧은 씬 없이 자연스러운 정보 단위 유지.
 *
 * ★ 핵심 팩트(2026-09-27 WebSearch 재확인):
 * - 주휴수당 지급 조건: 1주 소정근로시간 15시간 이상 + 소정근로일 개근.
 *   계약상 근로시간 기준(실제 초과 근무는 무관).
 * - 계산식: 시급 × (주 소정근로시간 ÷ 40) × 8. 주 40시간 근무 시 상한
 *   시급×8시간.
 * - 부엉박사 17편과 시의성 통일을 위해 2027년 확정 최저시급(시간당
 *   10,700원, 2026-08-05 고시)을 기준으로 계산: 하루(1회) 8만 5,600원
 *   (10,700×8), 월 환산(4.345주 기준) 약 37만 원, 연 환산(52주 기준)
 *   약 445만 원. 신청 불필요, 조건 충족 시 급여에 자동 반영되는 법정
 *   수당(근로기준법 제55조).
 *
 * 배경: 1~10편(홈오피스·서재풍·은행 창구·부동산 정보 상담 데스크·
 * 은퇴자금·연금 상담 데스크·고용보험 상담 창구 등)과 겹치지 않는 새
 * 배경 — 인사총무팀 근로계약 상담 창구(급여명세서·근로계약서 아이콘,
 * 특정 회사 로고 없음, 밝고 단정한 사무 공간 톤).
 */

export const GEUMBAKSA_ASSEMBLY_SPEC = Object.freeze({
  specVersion: "geumbaksa_assembly_spec_v1",
  scriptStructureVersion: "geumbaksa_script_structure_hook_first_v1",
  episode: 11,
  owlHandoffFrom: "owl-v2-ep17",
  sourceCandidate: "weekly-holiday-pay-2027-minimum-wage-link",
  title: "주 5일 알바하는데 하루는 안 나가도 돈이 들어온다면?",
  channelName: "경제번역소",
  characterDisplayName: "금박사",
  headerTitle: ["주휴수당", "조건만 맞으면 자동 지급"],

  scenesTimeline:
    "s1 hook(질문+한줄정리 통합) / s2 opening / s3 target / s4 target_detail / s5 method(계산식+예시 통합) / s6 feel_conversion / s7 longterm_simulation / s8 closing(자동지급+확인당부 통합)",

  instagramCaptionHook: "주 5일 알바하는데, 하루는 안 나가도 돈이 들어온다면 믿겠어?",
  instagramCaptionPoints: [
    "그게 바로 주휴수당이야",
    "일주일에 15시간 이상 일하고, 정해진 날에 다 나온 사람이면 누구나 받을 수 있어",
    "아르바이트든 정규직이든 상관없고, 계약서에 적힌 근무일만 다 채우면 돼",
    "계산은 시급에 하루 8시간을 곱하면 돼",
    "내년 최저시급 만 700원 기준으로 하루 8만 5천 6백 원이야",
    "한 달로 치면 대략 37만 원, 1년이면 445만 원 정도가 더 생기는 셈이야",
    "조건만 갖추면 신청 안 해도 급여에 자동으로 포함되니, 못 받고 있다면 사장님께 먼저 확인해봐",
  ],
  instagramPriorityTags: [
    "주휴수당",
    "최저임금",
    "아르바이트",
    "근로기준법",
    "급여계산",
    "직장인",
    "경제공부",
    "재테크",
    "경제뉴스",
    "경제상식",
    "금박사",
  ],

  emphasisTerms: ["주휴수당", "최저임금", "금박사"],

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
      video: "geumbaksa_ep11_s1_hook_motion.mp4",
      narration: "주 5일 알바하는데, 하루는 안 나가도 돈이 들어온다면 믿겠어? 그게 바로 주휴수당이야.",
      imageBrief:
        "인사총무팀 근로계약 상담 창구(급여명세서·근로계약서 아이콘, 특정 " +
        "회사 로고 없음) 새 배경(신규 제작, 舊 s1+s2 통합). 금박사가 " +
        "'안 나가도?' 윗줄, '주휴수당' 아랫줄로 이어진 큰 글자 2줄 카드를 " +
        "흰 장갑 손으로 들고 궁금한 표정에서 확신에 찬 미소로 보여주는 자세.",
      overlays: [],
    },
    {
      scene: 2,
      key: "s2_opening",
      role: "opening",
      video: "geumbaksa_ep11_s2_opening_motion.mp4",
      narration: "안녕, 어려운 경제·금융 용어를 쉽게 풀어주는 금박사야.",
      imageBrief:
        "동일 배경. 금박사가 한쪽 손을 살짝 들어 인사하는 자세, 밝고 " +
        "친근한 웃는 표정(항상 웃는 기본 표정 유지). 소품 없음.",
      overlays: [],
    },
    {
      scene: 3,
      key: "s3_target",
      role: "target",
      video: "geumbaksa_ep11_s3_target_motion.mp4",
      narration: "일주일에 15시간 이상 일하고, 정해진 날에 다 나온 사람이면 누구나 받을 수 있어.",
      imageBrief:
        "동일 배경. 금박사가 '주 15시간 이상 + 개근' 큰 글자 2줄 카드를 " +
        "흰 장갑 손으로 들고 설명하는 자세.",
      overlays: [],
    },
    {
      scene: 4,
      key: "s4_target_detail",
      role: "target",
      video: "geumbaksa_ep11_s4_target_detail_motion.mp4",
      narration: "아르바이트든 정규직이든 상관없고, 계약서에 적힌 근무일만 다 채우면 돼.",
      imageBrief:
        "동일 배경. 금박사가 '알바 = 정규직' 큰 글자와 등호 아이콘이 적힌 " +
        "카드를 흰 장갑 손으로 들고 밝게 설명하는 자세.",
      overlays: [],
    },
    {
      scene: 5,
      key: "s5_method",
      role: "method",
      video: "geumbaksa_ep11_s5_method_motion.mp4",
      narration: "계산은 간단해, 시급에 하루 8시간을 곱하면 돼. 내년 최저시급 만 700원 기준으로 하면, 하루 8만 5천 6백 원이야.",
      imageBrief:
        "동일 배경(신규 제작, 舊 s6+s7 통합). 금박사가 '시급 × 8시간' 윗줄, " +
        "'하루 85,600원' 아랫줄로 이어진 큰 글자 2줄 수식 카드를 흰 장갑 " +
        "손으로 들고 또박또박 설명하다 확신에 찬 표정으로 마무리하는 자세.",
      overlays: [],
    },
    {
      scene: 6,
      key: "s6_feel_conversion",
      role: "feel_conversion",
      video: "geumbaksa_ep11_s6_feel_conversion_motion.mp4",
      narration: "한 달로 치면 대략 37만 원 정도가 그냥 통장에 더 꽂히는 거야.",
      imageBrief:
        "동일 배경. 금박사가 '한 달 약 37만 원'이라는 큰 글자와 동전 아이콘이 " +
        "적힌 카드를 흰 장갑 손으로 들고 따뜻한 미소로 보여주는 자세.",
      overlays: [],
    },
    {
      scene: 7,
      key: "s7_longterm_simulation",
      role: "longterm_simulation",
      video: "geumbaksa_ep11_s7_longterm_simulation_motion.mp4",
      narration: "1년으로 계산하면 445만 원 정도, 웬만한 월급 반 달 치가 더 생기는 셈이야.",
      imageBrief:
        "동일 배경. 금박사가 '1년 약 445만 원'이라는 큰 글자와 상승 그래프 " +
        "아이콘이 적힌 카드를 흰 장갑 손으로 들고 확신에 찬 표정으로 보여주는 " +
        "자세.",
      overlays: [],
    },
    {
      scene: 8,
      key: "s8_closing",
      role: "closing",
      video: "geumbaksa_ep11_s8_closing_motion.mp4",
      narration: "이렇게 큰 돈인데, 조건만 갖추면 신청 안 해도 급여에 자동으로 포함돼. 혹시 이 돈을 못 받고 있는 것 같다면, 사장님께 먼저 확인해봐.",
      imageBrief:
        "동일 배경(신규 제작, 舊 s10+s11 통합). 금박사가 '신청 없이 자동 " +
        "지급'이라는 큰 글자 카드를 한 손으로 들고, 다른 손은 살짝 흔들며 " +
        "밝고 친근한 표정으로 마무리하는 자세.",
      overlays: [],
    },
  ]),
});

/** 장면 키로 스펙을 찾는다. */
export function findScene(key) {
  return GEUMBAKSA_ASSEMBLY_SPEC.scenes.find((s) => s.key === key) ?? null;
}
