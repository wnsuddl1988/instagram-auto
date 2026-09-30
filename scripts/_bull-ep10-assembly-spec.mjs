/**
 * 황소특보 10편 조립 스펙 — 17장면. 씬 구조 v3 + 성공 공식/엔딩 5박자 세 번째 적용본.
 *
 * 기준: _ai/CURRENT_STANDARDS.md §3 "씬 구조 v3"와 "성공 공식과 엔딩"(2026-09-29).
 * 전달 메시지 한 줄: 저PBR 태그는 결론이 아니라 질문이다 — 계획 공시 → 6년 하위권 → 사업 흐름 순서로 이유를 찾는다.
 * 유형: 시장 제도·정책 변경(레인 ④), 일정형(11/2 첫 공표, 10/22 공시 마감). 반도체 아님.
 *
 * ★ 소재 선정 경위(2026-09-30)★:
 * 10편 후보 12개를 추천순위로 제시 → 1번(코스피 63% 상승 vs 외국인 170조 순매도)은 "누가 받쳤나"의
 * 답이 삼성전자·SK하이닉스 자사주라 실질적으로 반도체 편이 되어(9편 마이크론에 이어 쏠림) Owner가
 * 지적, 접고 저PBR 공표(제도 변경)로 전환. 탈락: 엔비디아 자사주(반도체), 금값(반등 위험),
 * 테슬라 인도량(직전 편과 같은 일정형 레인), 양자·연준(사건형 쏠림).
 * 대본 과정에서 Owner 지적 4건: ① 저PBR을 "나쁜 것"처럼 쓴 프레임 삭제(PBR은 시각이 갈리는 지표),
 * ② PBR 정의는 "주가 ÷ 주당순자산(BPS)"으로 정확히(가게 지분·몸값 비유 폐기), ③ "PBR이 뭘까?"로
 * 정의 질문(저PBR은 그다음), ④ 13~14씬을 프레임/사업 흐름 보는 법으로 분리.
 *
 * ★ 핵심 팩트(2026-09-30 복수 보도 교차확인, 근거 수준 표시)★:
 * - 한국거래소 저PBR기업 공표제도: 첫 공표 2026-11-02, 이후 매년 5월·11월 첫 거래일. 거래소 홈페이지에
 *   공표 + 증권사 MTS·HTS에 태그 표시 예정 [뉴스핌 9/11, 이투데이 9/11, 한경 9/14, 서울신문 9/29].
 * - 선정 기준: GICS 11개 업종 안에서 시장별 3년(6반기) 누적 PBR 하위(코스피 25%, 코스닥 10%).
 *   [이투데이 7/28(금융위 발표), 뉴스핌, 한경]. 예상 규모는 5월 기준 코스피 80~130곳+코스닥 40~90곳
 *   = 최대 약 220곳(전체 상장사의 5~10%) [데일리안·이투데이 7/28]. 대본은 "최대 220곳"만 쓴다.
 * - 공시 면제: 공표일 7영업일 전(=10/22)까지 PBR 개선계획을 포함한 기업가치 제고 계획을 자율공시하면
 *   1년간 공표 제외. 시장·업종별 누적 6년(12반기) 하위권 기업은 공시해도 명단에 포함(특례 제외)
 *   [뉴스핌, 이투데이 9/11, 한경]. 10/22은 PBR 기준일이기도 하다(시총은 최근 20거래일 평균).
 * - 업계 전망: 제도 시행 초기 밸류업 공시 증가, 유상증자·전환사채 발행 축소 예상 [파이낸셜뉴스
 *   9/23, 9/27 — 전망이지 확정 아님, 대본에 "전망이 나와"로 표기].
 * - 베어허그(당정 9/29 연내 입법 추진)는 정치 연계라 대본에서 제외.
 *
 * 개념 표기: PBR = 주가 ÷ 주당순자산(BPS). 주당순자산 = 회사 순자산 ÷ 발행주식수. 저PBR/고PBR 해석은
 * 시각에 따라 갈린다(가치주·성장 둔화 / 기대·거품). 특정 종목·업종 언급, 매수·매도 암시 없음.
 *
 * 종목명: 없음. 리스크 고지: 나레이션에 넣지 않는다. 오프닝 씬(s3)과 마지막 씬(s17) 하단 자막바로만.
 *
 * TTS 실측(2026-09-30, output-v3, 3회차): 17씬 raw 합계 105.5초, 타임라인 119.8초.
 * (1차 136.4초 → 2차 135.2초 → 대사 압축 후 119.8초. 8초 티어 9개 / 10초 티어 8개)
 */

export const BULL_EP10_ASSEMBLY_SPEC = Object.freeze({
  specVersion: "bull_assembly_spec_v1",
  scriptStructureVersion: "bull_script_structure_v3",
  endingStructureVersion: "bull_ending_5beat_2026_09_29",
  episode: 10,
  sourceCandidate: "candidate-bull-ep10-low-pbr-disclosure-nov2",
  title: "11월 2일, 저PBR 명단이 내 증권앱에 뜬다",
  channelName: "경제번역소",
  characterDisplayName: "황소특보",
  headerTitle: ["11월 2일 저PBR 공표", "내 종목 읽는 순서"],

  scenesTimeline:
    "s1 훅 / s2 훅 판돈 / s3 오프닝 / s4 상황(11/2 첫 공표) / s5 핵심질문+정의(PBR) / s6 개념 예시 / s7 기준(저PBR) / s8 회사 쪽 절차(10/22) / s9 예외(6년) / s10 인과 고리 / s11 시각차 / s12 엔딩1 통찰 / s13 엔딩2 프레임 / s14 사업 흐름 / s15 엔딩3 조건 체크 / s16 엔딩4 이득 각인 / s17 엔딩5 약속+댓글",

  instagramCaptionHook: "11월 2일부터 증권앱에 저PBR 태그가 붙는 종목이 최대 220곳이라는데, 내 종목도 들어갈까?",
  instagramCaptionPoints: [
    "한국거래소가 11월 2일 저PBR 기업을 처음 공표해, 앞으로 5월과 11월에 나오고 규모는 최대 약 220곳으로 예상돼",
    "PBR은 주가를 주당순자산으로 나눈 값이야, 주가 1만 원에 주당순자산이 5천 원이면 2배고 주가가 5천 원이 되면 1배야",
    "저PBR은 업종 안 순위로 정해, 3년간 코스피 하위 25%, 코스닥 하위 10%에 머문 회사가 올라",
    "10월 22일까지 PBR 개선계획을 담은 기업가치 제고 계획을 공시하면 1년간 명단에서 빠져, 다만 6년 내내 하위권이면 공시해도 올라",
    "PBR이 낮으면 가치주로도 성장 둔화로도, 높으면 기대로도 거품으로도 봐서 시각이 갈려",
    "그래서 회사들이 자본 효율 계획을 서두르고 유상증자와 전환사채 발행은 줄 거라는 전망이 나와",
    "👉 태그는 결론이 아니라 질문이야, 계획 공시, 6년 하위권 여부, 사업 흐름 순서로 이유를 찾아봐",
  ],
  instagramPriorityTags: [
    "저PBR",
    "PBR",
    "저PBR공표",
    "밸류업",
    "한국거래소",
    "기업가치제고",
    "주식공부",
    "주식투자",
    "경제뉴스",
    "황소특보",
  ],

  emphasisTerms: ["저PBR", "PBR", "10월 22일", "11월 2일", "주당순자산", "황소특보"],

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
      video: "bull_ep10_s1_motion.mp4",
      narration: "다들, 11월 2일부터 증권앱에 저PBR 태그가 붙는 종목이 최대 220곳이라는데, 내 종목도 들어갈까?",
      imageBrief: "황소가 궁금하다는 표정으로 '저PBR 태그'와 '최대 220곳'이 두 줄로 크게 적힌 카드를 두 손으로 감싸 쥐고 보여주는 자세.",
      overlays: [],
    },
    {
      scene: 2,
      key: "s2_hook_stakes",
      role: "hook",
      video: "bull_ep10_s2_motion.mp4",
      narration: "핵심 날짜는 10월 22일이야. 이 날을 모르면 명단에 있든 없든 이유를 몰라.",
      imageBrief: "황소 옆 바닥에 세운 보드(바닥 거치)에 '핵심 날짜'와 '10월 22일'이 두 줄로 크게 적혀 있고, 황소가 빈 손으로 보드를 가리키며 진지하고 긴장한 표정을 짓는 자세.",
      overlays: [],
    },
    {
      scene: 3,
      key: "s3_opening",
      role: "opening",
      video: "bull_ep10_s3_motion.mp4",
      narration: "안녕, 투자 소식을 쉽고 빠르게 정리해주는 황소특보야. 핵심만 짚어줄게, 끝까지 들어봐.",
      imageBrief: "황소가 정면을 보며 한 손으로 위를 가리키고 다른 손은 허리에 얹은 채 밝고 명랑하게 웃는 포즈, 소품 없음.",
      overlays: [],
      riskDisclosure: true,
    },
    {
      scene: 4,
      key: "s4_situation",
      role: "background",
      video: "bull_ep10_s4_motion.mp4",
      narration: "먼저 사실부터 보자. 한국거래소가 11월 2일 저PBR 기업을 처음 공표해.",
      imageBrief: "황소 옆 바닥에 세운 보드(바닥 거치)에 '11월 2일'과 '저PBR 첫 공표'가 두 줄로 크게 적혀 있고, 황소가 빈 손으로 보드를 가리키며 설명하는 자세.",
      overlays: [],
    },
    {
      scene: 5,
      key: "s5_core_q_answer",
      role: "twist",
      video: "bull_ep10_s5_motion.mp4",
      narration: "그럼 PBR이 뭘까? 주가를 주당순자산으로 나눈 값이야. 한 주당 회사가 가진 순수 재산이지.",
      imageBrief: "황소 옆 바닥에 세운 보드(바닥 거치)에 'PBR'과 '주가 ÷ 주당순자산'이 두 줄로 크게 적혀 있고, 황소가 빈 손 검지를 세워 설명하는 자세.",
      overlays: [],
    },
    {
      scene: 6,
      key: "s6_concept_example",
      role: "background",
      video: "bull_ep10_s6_motion.mp4",
      narration: "주가 1만 원, 주당순자산 5천 원이면 PBR은 2배야. 회사 재산은 그대로인데 주가가 5천 원이 되면 1배야.",
      imageBrief: "황소 옆 바닥에 세운 보드(바닥 거치)에 '주가 1만 원', '주당순자산 5천 원', 'PBR 2배'가 세 줄로 크게 적혀 있고, 황소가 빈 손으로 보드를 톡톡 짚으며 차분히 설명하는 자세.",
      overlays: [],
    },
    {
      scene: 7,
      key: "s7_criteria",
      role: "background",
      video: "bull_ep10_s7_motion.mp4",
      narration: "저PBR은 업종 안의 순위로 정해. 3년간 코스피 하위 25%, 코스닥 하위 10%에 머문 회사가 올라.",
      imageBrief: "황소 옆 바닥에 세운 보드(바닥 거치)에 '업종 안 3년 하위', '코스피 25%', '코스닥 10%'가 세 줄로 크게 적혀 있고, 황소가 빈 손으로 손가락 하나를 펴 보이며 설명하는 자세.",
      overlays: [],
    },
    {
      scene: 8,
      key: "s8_company_procedure",
      role: "twist",
      video: "bull_ep10_s8_motion.mp4",
      narration: "회사 쪽 절차도 있어. 10월 22일까지 PBR 개선계획을 담은 기업가치 제고 계획을 공시하면 1년간 빠져.",
      imageBrief: "황소 옆 바닥에 세운 보드(바닥 거치)에 '10월 22일까지', '계획 공시하면', '1년 명단 제외'가 세 줄로 크게 적혀 있고, 황소가 빈 손으로 보드를 가리키며 설명하는 자세.",
      overlays: [],
    },
    {
      scene: 9,
      key: "s9_exception",
      role: "twist",
      video: "bull_ep10_s9_motion.mp4",
      narration: "다만 6년 내내 하위권이었던 회사는 공시를 했더라도 명단에 올라.",
      imageBrief: "황소 옆 바닥에 세운 보드(바닥 거치)에 '6년 내내 하위권'과 '공시해도 명단 포함'이 두 줄로 크게 적혀 있고, 황소가 빈 손으로 보드를 가리키며 신중한 표정을 짓는 자세.",
      overlays: [],
    },
    {
      scene: 10,
      key: "s10_link",
      role: "background",
      video: "bull_ep10_s10_motion.mp4",
      narration: "그래서 회사들이 자본 효율 계획을 서두르고, 유상증자와 전환사채 발행은 줄 거라는 전망이 나와.",
      imageBrief: "황소 옆 바닥에 세운 보드(바닥 거치)에 '자본 효율 계획', '유상증자·CB', '줄어들 전망'이 세 줄로 크게 적혀 있고, 황소가 빈 손으로 보드를 가리키며 설명하는 자세.",
      overlays: [],
    },
    {
      scene: 11,
      key: "s11_balance",
      role: "counterpoint",
      video: "bull_ep10_s11_motion.mp4",
      narration: "PBR은 시각이 갈려. 낮으면 가치주로도 성장 둔화로도, 높으면 기대로도 거품으로도 봐.",
      imageBrief: "황소 옆 바닥에 세운 보드(바닥 거치)에 '낮음 = 가치주? 둔화?'와 '높음 = 기대? 거품?'이 두 줄로 크게 적혀 있고, 황소가 빈 손을 위로 펴 보이며 고민하는 표정을 짓는 자세.",
      overlays: [],
    },
    {
      scene: 12,
      key: "s12_insight",
      role: "insight",
      video: "bull_ep10_s12_motion.mp4",
      narration: "결국 태그는 결론이 아니라 질문이야. 왜 그 평가를 받는지, 답을 찾아봐야 해.",
      imageBrief: "황소가 '태그는 질문'과 '결론이 아니야'가 두 줄로 크게 적힌 카드를 두 손으로 감싸 쥐고 확신에 찬 표정으로 보여주는 자세.",
      overlays: [],
    },
    {
      scene: 13,
      key: "s13_frame",
      role: "frame",
      video: "bull_ep10_s13_motion.mp4",
      narration: "답은 세 가지 순서로 찾아. 회사가 계획을 냈는지, 6년 내내 하위권인지, 그리고 사업 흐름이야.",
      imageBrief: "황소 옆 바닥에 세운 보드(바닥 거치)에 '① 계획 공시', '② 6년 하위권', '③ 사업 흐름'이 세 줄로 크게 적혀 있고, 황소가 빈 손으로 보드를 가리키며 설명하는 자세.",
      overlays: [],
    },
    {
      scene: 14,
      key: "s14_business_flow",
      role: "action",
      video: "bull_ep10_s14_motion.mp4",
      narration: "사업 흐름은 실적이 늘고 있는지, 성장할 여지가 있는지를 봐. 낮은 이유가 보이기도 해.",
      imageBrief: "황소 옆 바닥에 세운 보드(바닥 거치)에 '실적 늘고 있나'와 '성장 여지는?'이 두 줄로 크게 적혀 있고, 황소가 빈 손으로 손가락 두 개를 세워 보이며 설명하는 자세.",
      overlays: [],
    },
    {
      scene: 15,
      key: "s15_check",
      role: "action",
      video: "bull_ep10_s15_motion.mp4",
      narration: "10월 22일 전 공시가 있으면 1년은 빠지고, 없으면 오를 수 있어. 확인은 전자공시에서.",
      imageBrief: "황소 옆 바닥에 세운 보드(바닥 거치)에 '10월 22일 전', '계획 공시?', '전자공시 확인'이 세 줄로 크게 적혀 있고, 황소가 빈 손으로 보드를 가리키며 설명하는 자세.",
      overlays: [],
    },
    {
      scene: 16,
      key: "s16_benefit",
      role: "benefit",
      video: "bull_ep10_s16_motion.mp4",
      narration: "태그에 휘둘리지 말고 이유를 읽어. 이유를 알아야 다음 신호도 읽혀.",
      imageBrief: "황소가 '태그 말고'와 '이유를 읽어'가 두 줄로 크게 적힌 카드를 두 손으로 감싸 쥐고 따뜻하고 차분한 미소로 보여주는 자세.",
      overlays: [],
    },
    {
      scene: 17,
      key: "s17_cta",
      role: "save",
      video: "bull_ep10_s17_motion.mp4",
      narration: "이것만은 챙겨가. 11월 2일 명단은 황소특보가 제일 먼저 들고 올게. 궁금한 건 댓글로 남겨줘.",
      imageBrief: "황소가 밝은 미소로 한 손을 가볍게 흔들고 다른 손은 자연스럽게 내린 마무리 포즈, 소품 없이 빈 손.",
      overlays: [],
      riskDisclosure: true,
    },
  ]),
});

/** 장면 키로 스펙을 찾는다. */
export function findBullEp10Scene(key) {
  return BULL_EP10_ASSEMBLY_SPEC.scenes.find((s) => s.key === key) ?? null;
}
