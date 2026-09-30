/**
 * 부엉박사 조립 스펙 16편(v2 재제작) — 퇴직연금 실물이전, 팔지 않고 그대로
 * 계좌만 옮긴다.
 *
 * 기준: _ai/CURRENT_STANDARDS.md §1 "씬 구조 v2", §7. 유형: D형(나는 어떻게
 * 해야 하나). 배포 예정 짝: 같은 날 금박사 10편(파일 ep9, DB형·DC형 설명).
 * 부엉박사 본문에서는 DB형/DC형 이름만 언급하고 각각이 무엇인지는 설명하지
 * 않는다 — 금박사가 이어받는다(§7 표).
 *
 * ★ v1(2026-09-22 작성, `_owl-ep13-assembly-spec.mjs`, 옛 10씬 구조)의
 * 핵심 팩트를 재확인(2026-09-27, WebSearch)한 결과 그대로 유효하다:
 * - "DC형→타사 IRP 실물이전"은 오늘도 여전히 시행 전. 2026-08-24 금감원
 *   TF 킥오프 → 9월까지 개선 방향 확정 → 10월부터 전산 개발 착수 →
 *   2027년까지 TF 운영. v1이 "지금 추진 중"이라고 쓴 표현이 정확히 맞다.
 *   출처: 비즈워치·아주경제·한국경제TV(전부 2026-08-24), 재확인 검색
 *   결과 상태 변화 없음.
 * - 실물이전 자체(동일 제도 내: DB-DB, DC-DC, IRP-IRP)는 2024-10-31부터
 *   시행 중인 현재형 제도, 계속 확대 추세.
 * - 누적 규모 6.9조원(2026년 상반기)은 v1 작성 시점 그대로 재사용(9월
 *   기준 갱신 수치는 아직 공식 발표 전— 6월 말 15.9조원이 최신 공식
 *   집계, 상반기 6.9조원은 전년 동기 대비 수치이므로 표현 그대로 안전).
 *
 * ★★★ 2026-09-27 씬 구조 2차 확정(14씬) — 경위 기록 ★★★
 * 1차(16씬)에서 9.5초 규칙 위반을 문장 경계에서 기계적으로 분리해 3~5초
 * 짜리 짧은 씬이 과도하게 늘었다는 Owner 지적으로 재검토. TTS 재실측 후
 * CURRENT_STANDARDS 원문 재사용 기준("v1 8초 영상 재사용 시 발화 7초
 * 이내")을 다시 정확히 적용한 결과:
 * - s8+s9(舊, 규모+흐름)를 한 문장으로 합쳐도 9.11초로 9.5초 규칙 안전 →
 *   통합 유지(신규 s8, 신규 제작 — 원래도 재사용 대상 아니었음).
 * - s10+s11(舊, 조건+상세)을 합치면 10.58초로 9.5초 규칙은 통과하지만
 *   재사용 확정했던 클립(v1 s6, 8초)의 "발화 7초 이내" 기준을 크게
 *   초과(9.38초, 舊s9 통합 시도 기준) → 재사용 포기, 신규 제작(신규 s9).
 * - 재검증 결과 기존 재사용 확정 목록 중 舊s12(point3_upcoming, 발화
 *   7.2초)는 7초 기준 내 유지, 舊s13(caution, 발화 8.16초)는 8초 클립
 *   자체보다 길어 재사용 불가 판정 → 신규 제작으로 전환(신규 s11).
 * 최종 14씬, 재사용 3개(s3·s5·s6)만 유지, 나머지 11개는 전부 신규 제작.
 *
 * 재사용(v1 = _owl-ep13-assembly-spec.mjs, 영상 C:/tmp/owl-ep13-videos,
 * 이미지 C:/tmp/owl-ep13-images), 전부 "발화 7초 이내" 기준 통과분만:
 *   s3 ← v1 s1(오프닝, 10초 클립, 발화 3.24초)
 *   s5 ← v1 s2(전량 매도 후 현금 이전, 8초 클립, 발화 5.387초)
 *   s6 ← v1 s3(매도·재매수 손실 → 그냥 묶임, 8초 클립, 발화 6.667초)
 * 새로 만드는 씬(배경은 v1과 같은 퇴직연금 고객센터 상담 데스크): s1, s2,
 * s4, s7, s8(규모+흐름 통합 카드 "상반기 6.9조 원 / 은행→증권사"), s9
 * (조건 통합 카드 "같은 종류 계좌만 + DB→DB·DC→DC·IRP→IRP"), s10, s11
 * (리츠·ELS 예외 상품, 舊s13 재사용 포기분), s12, s13, s14.
 *
 * 금박사 handoff 용어: "DB형·DC형"(정확한 차이 설명 — 금박사 10편(파일
 * ep9) 소재, 부엉박사 본문에서는 이름만 언급하고 각 방식의 정의는 설명하지
 * 않음).
 */

export const OWL_ASSEMBLY_SPEC = Object.freeze({
  specVersion: "owl_assembly_spec_v1",
  scriptStructureVersion: "owl_script_structure_v2",
  episode: 16,
  v1SourceSpec: "_owl-ep13-assembly-spec.mjs",
  scriptType: "D_what_to_do",
  // 2026-09-30 금박사 운영 중단 — 짝 금박사 10편도 배포하지 않는다.
  geumbaksaHandoffTerm: null,
  sourceCandidate: "candidate-final-sep-retirement-pension-in-kind-transfer-v2",
  title: "퇴직연금 계좌, 팔지 않고 그대로 옮길 수 있다",
  // 번호 없는 예비 재고(2026-09-30). 규칙 26(대본 기준 검사기) 이전에 TTS·영상·final-v3까지 끝난 재고 — 대사를 다시 만들지 않는다.
  scriptStandardsException: "규칙 26 이전 제작 재고(번호 없는 예비, final-v3 완성)",
  channelName: "경제번역소",
  characterDisplayName: "부엉박사",
  headerTitle: ["퇴직연금 계좌", "손해없이 갈아타기"],

  scenesTimeline:
    "s1 hook_q / s2 hook_stakes / s3 opening / s4 definition / s5 situation1 / s6 situation2 / s7 core_q_answer / s8 point1_scale(통합) / s9 point2_condition(통합) / s10 point3_upcoming / s11 caution / s12 summary / s13 checklist / s14 bridge",

  instagramCaptionHook: "퇴직연금 계좌, 회사 옮길 때마다 펀드 팔고 새로 사야 했던 거 아직도 그렇게 하고 있어?",
  instagramCaptionPoints: [
    "예전엔 퇴직연금 계좌를 다른 금융회사로 옮기려면 갖고 있던 상품을 전부 팔아서 현금으로만 옮겨야 했어",
    "근데 파는 순간 손해를 보거나 다시 살 때 더 비싸질 수 있어서 옮기고 싶어도 묶여있는 사람이 많았어",
    "2년 전부터는 펀드나 ETF를 팔지 않고 상품 그대로 다른 회사로 옮기는 실물이전 제도가 생겼어",
    "올해 상반기에만 6조 9천억 원이 옮겨갔는데, 특히 은행에서 증권사로 넘어가는 돈이 많아",
    "단 같은 종류 계좌 안에서만 가능해, DB는 DB끼리 DC는 DC끼리 IRP는 IRP끼리만 옮길 수 있어",
    "지금 추진 중인 정책 중에는 DC형을 다른 회사 IRP로 바로 옮길 수 있게 확대하는 방안도 있어",
    "리츠나 ELS처럼 아예 실물이전이 안 되는 상품도 있으니 미리 확인은 필요해",
    "퇴직연금 수익률이 마음에 안 든다면, 지금 다니는 회사에 실물이전으로 옮길 수 있는지부터 확인해봐",
  ],
  instagramPriorityTags: [
    "퇴직연금",
    "IRP",
    "실물이전",
    "DB형",
    "DC형",
    "연금저축",
    "노후준비",
    "재테크",
    "경제공부",
    "경제뉴스",
    "경제상식",
    "금융상식",
    "부엉박사",
  ],

  emphasisTerms: ["실물이전", "퇴직연금", "IRP", "고용노동부", "부엉박사"],

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
      key: "s1_hook_q",
      role: "hook",
      video: "owl_v2_ep16_s1_hook_q_motion.mp4",
      narration: "퇴직연금 있는 사람, 회사 옮길 때마다 펀드 팔고 새로 사야 했던 거 아직도 그렇게 하고 있어?",
      imageBrief:
        "퇴직연금 고객센터 상담 데스크(v1과 동일 배경, 특정 금융회사 로고 " +
        "없음) 새 배경. 부엉이가 궁금하고 날카로운 표정으로 '퇴직연금' / " +
        "'팔고 또 사?' 큰 글자 2줄 카드를 한쪽 날개로 감싸 쥐고 보여주는 자세.",
      overlays: [],
    },
    {
      scene: 2,
      key: "s2_hook_stakes",
      role: "hook",
      video: "owl_v2_ep16_s2_hook_stakes_motion.mp4",
      narration: "대부분 그렇게 하는데, 사실 2년 전부터는 안 팔고 그대로 옮기는 방법이 생겼어.",
      imageBrief:
        "동일 배경. 부엉이가 '안 팔고 그대로?' 큰 글자와 물음표 아이콘이 " +
        "적힌 카드를 한쪽 날개로 감싸 쥐고 눈이 커진 놀란 표정.",
      overlays: [],
    },
    {
      scene: 3,
      key: "s3_opening",
      role: "opening",
      video: "owl_v2_ep16_s3_opening_motion.mp4",
      reuseFrom: "owl_ep13_s1_opening_motion.mp4",
      narration: "안녕, 매일 경제 뉴스를 콕 집어 전해주는 부엉박사야.",
      imageBrief: "재사용(v1 s1 오프닝, 10초 클립, 발화 3.24초로 여유 충분).",
      overlays: [],
    },
    {
      scene: 4,
      key: "s4_definition",
      role: "one_line_definition",
      video: "owl_v2_ep16_s4_definition_motion.mp4",
      narration: "실물이전은 펀드나 ETF를 팔지 않고 상품 그대로 다른 회사로 옮기는 제도야.",
      imageBrief:
        "동일 배경. 부엉이가 '실물이전 = 상품 그대로 이전' 큰 글자 카드를 " +
        "한쪽 날개로 감싸 쥐고 담담하게 설명하는 표정.",
      overlays: [],
    },
    {
      scene: 5,
      key: "s5_situation1",
      role: "fact",
      video: "owl_v2_ep16_s5_situation1_motion.mp4",
      reuseFrom: "owl_ep13_s2_background_motion.mp4",
      narration: "예전엔 계좌를 옮기려면 갖고 있던 상품을 전부 팔아서 현금으로만 옮겨야 했어.",
      imageBrief: "재사용(v1 s2 — '전량 매도 후 현금 이전' 카드, 8초 클립, 발화 5.387초).",
      overlays: [],
    },
    {
      scene: 6,
      key: "s6_situation2",
      role: "fact",
      video: "owl_v2_ep16_s6_situation2_motion.mp4",
      reuseFrom: "owl_ep13_s3_problem_motion.mp4",
      narration: "근데 파는 순간 손해를 보거나 다시 살 때 더 비싸질 수 있어서, 옮기고 싶어도 묶여있는 사람이 많았어.",
      imageBrief: "재사용(v1 s3 — 하락 화살표+사슬 아이콘 '매도·재매수 손실 → 그냥 묶임' 카드, 8초 클립, 발화 6.667초로 7초 기준 내).",
      overlays: [],
    },
    {
      scene: 7,
      key: "s7_core_q_answer",
      role: "core_question",
      video: "owl_v2_ep16_s7_core_q_answer_motion.mp4",
      narration: "그럼 나는 어떻게 해야 할까? 답부터 말하면, 지금 다니는 회사에 실물이전이 되는지부터 확인하면 돼.",
      imageBrief:
        "동일 배경. 부엉이가 '나는' / '어떻게 해야 할까?' 큰 글자 2줄 카드를 " +
        "한쪽 날개로 감싸 쥐고, 다른 날개는 턱 근처 생각하는 포즈.",
      overlays: [],
    },
    {
      scene: 8,
      key: "s8_point1_scale",
      role: "evidence",
      video: "owl_v2_ep16_s8_point1_scale_motion.mp4",
      narration: "첫째, 규모부터 보자. 올해 상반기에만 6조 9천억 원이 옮겨갔는데, 특히 은행에서 증권사로 넘어가는 돈이 많아.",
      imageBrief:
        "동일 배경(신규 제작, 舊 s8+s9 통합). 부엉이가 '상반기 6.9조 원' " +
        "위쪽 줄, '은행 → 증권사' 화살표 아래쪽 줄로 이어진 큰 글자 카드를 " +
        "한쪽 날개로 감싸 쥐고 밝고 설명적인 표정으로 보여주는 자세.",
      overlays: [],
    },
    {
      scene: 9,
      key: "s9_point2_condition",
      role: "evidence",
      video: "owl_v2_ep16_s9_point2_condition_motion.mp4",
      narration: "둘째, 조건이 있어. 같은 종류 계좌 안에서만 가능해. DB는 DB끼리, DC는 DC끼리, IRP는 IRP끼리만 옮길 수 있어.",
      imageBrief:
        "동일 배경(신규 제작, 舊 s10+s11 통합 — v1 s6 재사용은 발화 " +
        "9.38초가 8초 클립의 '7초 이내' 기준을 초과해 포기하고 신규 제작으로 " +
        "전환). 부엉이가 '같은 종류 계좌만' 위쪽 줄, 그 아래 'DB→DB', " +
        "'DC→DC', 'IRP→IRP' 세 줄을 화살표와 함께 표 형태로 작게 배치한 " +
        "큰 카드를 한쪽 날개로 감싸 쥐고 진지한 표정으로 보여주는 자세.",
      overlays: [],
    },
    {
      scene: 10,
      key: "s10_point3_upcoming",
      role: "evidence",
      video: "owl_v2_ep16_s10_point3_upcoming_motion.mp4",
      reuseFrom: "owl_ep13_s9_upcoming_motion.mp4",
      narration: "셋째, 지금 추진 중인 정책도 있어. DC형을 다른 회사 IRP로 바로 옮길 수 있게 확대하는 방안이야.",
      imageBrief: "재사용(v1 s9 — 'DC형 → 타사 IRP, 확대 추진 중' 카드, 8초 클립, 발화 7.2초로 7초 기준 경계이나 내).",
      overlays: [],
    },
    {
      scene: 11,
      key: "s11_caution",
      role: "condition",
      video: "owl_v2_ep16_s11_caution_motion.mp4",
      narration: "그렇다고 아무 상품이나 다 옮길 수 있는 건 아니야. 리츠나 ELS처럼 아예 안 되는 상품도 있어서, 미리 확인은 필요해.",
      imageBrief:
        "동일 배경(신규 제작 — v1 s8 재사용은 발화 8.16초가 8초 클립 " +
        "자체보다 길어 포기하고 신규 제작으로 전환). 부엉이가 물음표가 " +
        "그려진 카드를 한쪽 날개로 감싸 쥐고, 고개를 살짝 갸웃하며 신중한 " +
        "표정을 짓는 포즈.",
      overlays: [],
    },
    {
      scene: 12,
      key: "s12_summary",
      role: "action",
      video: "owl_v2_ep16_s12_summary_motion.mp4",
      narration: "콕 집어 정리하면, 팔지 않고 그대로 옮기는 실물이전이 이미 가능해.",
      imageBrief:
        "동일 배경. 부엉이가 '실물이전, 이미 가능해' 큰 글자 카드를 한쪽 " +
        "날개로 감싸 쥐고 확신에 찬 표정으로 보여주는 자세.",
      overlays: [],
    },
    {
      scene: 13,
      key: "s13_checklist",
      role: "action",
      video: "owl_v2_ep16_s13_checklist_motion.mp4",
      narration: "먼저 확인할 건 두 가지, 내 계좌 종류랑 옮기려는 상품이 대상인지야.",
      imageBrief:
        "동일 배경. 부엉이 옆 바닥에 세운 보드에 '체크 ① 내 계좌 종류 ② 대상 " +
        "상품 여부'가 두 줄로 크게 적혀 있고, 빈 날개로 손가락 두 개를 세워 " +
        "보이는 자세.",
      overlays: [],
    },
    {
      scene: 14,
      key: "s14_bridge",
      role: "save",
      // 2026-09-30 금박사 운영 중단(Owner B안): 예고 제거, 대사·이미지·영상 새로 제작.
      // 옛 클립 owl_v2_ep16_s14_bridge_motion.mp4("금박사가 이어서 풀어줄게")는 쓰지 않는다.
      video: "owl_v2_ep16_s14_bridge_v2_motion.mp4",
      narration: "이 두 가지는 저장해 두고, 회사 옮기기 전에 내 계좌 종류부터 다시 확인해. 궁금한 제도는 댓글로 남겨줘.",
      imageBrief:
        "동일 배경. 부엉이가 밝은 표정으로 '저장해두고' / '계좌 종류 확인' 큰 글자 " +
        "2줄 카드를 한쪽 날개로 감싸 쥐고, 다른 날개는 가볍게 흔드는 마무리 자세.",
      overlays: [],
    },
  ]),
});

/** 장면 키로 스펙을 찾는다. */
export function findScene(key) {
  return OWL_ASSEMBLY_SPEC.scenes.find((s) => s.key === key) ?? null;
}
