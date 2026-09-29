/**
 * 황소특보 6편 조립 스펙 — 18장면. 씬 구조 v3 세 번째 적용본.
 *
 * 기준: _ai/CURRENT_STANDARDS.md §3 "씬 구조 v3"(2026-09-26 Owner 확정).
 * 목표 125~135초, 대본 614자(숫자·영어 원표기 그대로 셈).
 *
 * ★ 소재 선정 경위(2026-09-28)★:
 * 1차로 "UAE 방산 계약(9/17 사건)" 안을 검토했으나, Owner 지적으로
 * 재확인한 결과 오늘(9/28) 기준 11일 지난 소재라 "다들, 이번 주~"
 * 훅 자체가 성립하지 않고, 9/22~27 사이 후속 진전(실제 계약 체결,
 * 추가 급등 등)도 확인되지 않아 폐기.
 *
 * 대체 소재로 "삼성전자 3분기 배당 마지막 매수일"을 채택. 결정적 이유:
 * 9/23(수)이 추석 연휴 전 마지막 개장일, 9/24~27 연휴+주말 휴장,
 * **오늘 9/28(월)이 연휴 후 첫 개장일이자 정확히 배당 마지막 매수일**
 * 이라는 캘린더가 정확히 겹친다. 방산주 안보다 시의성이 훨씬
 * 강하고, CURRENT_STANDARDS §3 "성과 좋은 소재 순서 1순위"(시청자
 * 매매에 직접 영향 주는 제도·일정 변경)에 정확히 해당 — 시청자가
 * "오늘 당장" 행동해야 하는 액션형 소재.
 *
 * ★ 핵심 팩트(2026-09-28 WebSearch 재확인, 전부 실제 보도 기준)★:
 * - 배당 기준일: 2026-09-30. 국내 주식은 매수 후 결제까지 2영업일이
 *   걸려 **9/28(오늘)까지 매수해야** 배당을 받을 수 있음. 9/29는
 *   배당락일 — 9/28에 사서 9/29에 팔아도 배당권은 유지됨.
 * - 배당 규모: 정규 분기배당 약 2조 4,500억 원 + 특별배당 약 27조
 *   5,500억 원 = 총 약 30조 원. 삼성전자가 2026-08-21 이사회에서
 *   의결한 2026년 90조~110조 원 규모 주주환원 계획의 첫 실행분.
 * - 주당배당금(DPS): 증권가 예상 4,500원 안팎 — **아직 확정 아님**,
 *   정확한 금액과 지급 일정은 10월 말 이사회에서 최종 확정 예정.
 *   대본에는 반드시 "예상"으로 표현하고 확정처럼 쓰지 않는다.
 * - 재원 배경: AI발 메모리 호황으로 현금창출력 급증. 삼성전자
 *   메모리사업부가 2026-2분기 실적발표 컨퍼런스콜에서 "3분기 HBM4
 *   매출이 전 분기 대비 3배 이상 확대될 것"이라고 예고.
 * - 리스크: 배당락일(9/29)에는 이론적으로 배당금만큼 주가가 조정될
 *   수 있으나, 실제로는 업황·수급 등 다른 변수 영향이 커서 반드시
 *   그만큼 하락하는 것은 아님(균형 씬에 "이론적으로"라고 명시).
 *
 * 종목명: 삼성전자는 허용리스트
 * (005930/000660/005380/AAPL/TSLA/GOOGL) 안이라 실명 사용 가능.
 * 편중 우려 검토: 1~5편은 삼성전자를 매번 "비교 대상"으로만 언급했고
 * 삼성전자 자체가 주인공인 편은 없었음 — 이번이 처음으로 삼성전자를
 * 정면으로 다루는 편이라 오히려 소재 다양성 측면에서 자연스러움.
 *
 * 훅 개선: 1~5편이 전부 "삼성전자보다 더/제일 많이 오른 게 ~라고
 * 생각했어?" 비교형 틀을 반복해 Owner가 "훅에 삼성전자 비교 기준이
 * 계속 반복된다"고 지적 — 이번 편은 비교형이 아니라 "오늘 놓치면
 * 안 되는 날"이라는 긴급성/액션 프레임으로 새로 작성.
 *
 * 마지막 부분 보강: Owner가 "항상 마지막에 아쉬움이 남는다"고 지적한
 * 데 따라, 체크리스트를 수동적 관망("등락률 지켜보기")이 아니라
 * "오늘 장 마감 전 매수 여부"라는 즉시 실행 가능한 항목으로 구성하고,
 * CTA에 "10월 말 확정되면 정확한 금액을 들고 온다"는 후속 확인
 * 약속을 넣어 재방문 동기를 명확히 함.
 *
 * 리스크 고지: 나레이션에 넣지 않는다. 오프닝 씬(s3)과 마지막 씬(s18)
 * 하단 자막바로만. 투자 유인이 아니라 정보 전달임을 명확히 하고,
 * 매수를 직접 권유하는 표현("사라", "담아")은 쓰지 않는다 — "오늘까지
 * 사야 배당을 받을 수 있다"는 사실 설명이지 매수 추천이 아님을
 * 대본 전반에서 유지.
 */

export const BULL_EP6_ASSEMBLY_SPEC = Object.freeze({
  specVersion: "bull_assembly_spec_v1",
  scriptStructureVersion: "bull_script_structure_v3",
  episode: 6,
  sourceCandidate: "candidate-bull-ep6-samsung-q3-special-dividend-last-buy-day",
  title: "삼성전자 배당, 오늘까지 사야 30조 원 잔치에 낀다",
  channelName: "경제번역소",
  characterDisplayName: "황소특보",
  headerTitle: ["삼성전자 30조 배당", "오늘이 마지막 매수일"],

  // 목표 타임라인(TTS 속도 1.05):
  // s1~s2 훅 0~12 / s3 오프닝 12~18 / s4~s6 상황 18~40 /
  // s7 핵심질문+즉답(약 25% 지점) 40~50 / s8~s9 근거1(규모) 50~65 /
  // s10~s12 근거2(재원 배경) 65~85 / s13 근거3(체감) 85~95 /
  // s14~s15 균형(약 75%) 95~106 / s16~s17 요약+체크(끝나기 약 30초 전)
  // 106~118 / s18 당부+CTA 118~130.
  scenesTimeline:
    "s1(0-6,hook) s2(6-12,hook_stakes) s3(12-18,opening) s4(18-24,situation1) s5(24-33,situation2) s6(33-40,situation3) s7(40-50,core_q_answer) s8(50-58,reason1_scale) s9(58-65,reason1_background) s10(65-73,reason2_source) s11(73-80,reason2_numbers) s12(80-85,reason2_meaning) s13(85-95,reason3_feel) s14(95-101,balance1) s15(101-106,balance2) s16(106-110,summary) s17(110-118,checklist) s18(118-130,remind_next_comment)",

  instagramCaptionHook: "삼성전자 주주라면 오늘 놓치면 안 되는 날이야",
  instagramCaptionPoints: [
    "오늘 28일까지 삼성전자를 사야 이번 분기 배당을 받을 수 있어, 규모가 무려 30조 원이야",
    "배당 기준일은 9월 30일인데 결제까지 2영업일이 걸려서 오늘까지 매수해야 해, 내일 29일이 배당락일이야",
    "정규 분기배당 2조 4500억 원에 특별배당 27조 5500억 원이 더해져 30조 원이 나가는 거야",
    "삼성전자가 8월에 밝힌 90조에서 110조 원 규모 주주환원 계획의 첫 실행분이야",
    "AI 메모리 호황으로 현금이 쌓였어, HBM4 매출이 전 분기보다 3배 넘게 늘 거라는 전망까지 나왔어",
    "증권가 예상으로는 주당 배당금이 4500원 안팎, 1000주면 세전 450만 원 정도야",
    "다만 배당락일엔 이론적으로 배당금만큼 주가가 빠질 수 있고, 정확한 금액은 10월 말 이사회에서 확정돼",
    "확인할 건 두 가지, 오늘 장 마감 전 매수 여부랑 10월 말 확정 배당금이야",
  ],
  instagramPriorityTags: [
    "삼성전자",
    "배당주",
    "배당락일",
    "주주환원",
    "HBM",
    "주식투자",
    "경제뉴스",
    "재테크",
    "황소특보",
    "증시",
  ],

  emphasisTerms: ["30조 원", "9월 28일", "배당락일", "HBM4", "황소특보"],

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
      video: "bull_ep6_s1_motion.mp4",
      narration: "다들, 삼성전자 주주라면 오늘 놓치면 안 되는 날이야.",
      imageBrief:
        "황소가 다급하지만 확신에 찬 표정으로 '오늘이 마지막?'이라고 적힌 " +
        "카드를 한 손으로 감싸 쥐고 보여주는 자세. 다른 손은 허리에. " +
        "배경(캐릭터와 동일한 3D 애니메이션 스타일로만, 실사 렌더링 절대 " +
        "금지): 증권사 트레이딩 라운지 — 장난감처럼 둥글고 뭉툭하게 " +
        "단순화된 모니터 여러 대에 캔들차트 실루엣(숫자·종목명 없음), " +
        "은은한 블루·화이트 조명. 글자가 적힌 배너·표지판 없음. 캐릭터는 " +
        "화면 세로 길이의 약 45~50%만 차지. 황소특보 canonical " +
        "reference(bull3dv1) 외형 그대로 유지.",
      overlays: [],
    },
    {
      scene: 2,
      key: "s2_hook_stakes",
      role: "hook",
      video: "bull_ep6_s2_motion.mp4",
      narration:
        "오늘까지 삼성전자를 사야 이번 분기 배당을 받을 수 있어. 규모가 무려 30조 원이야.",
      imageBrief:
        "황소가 '배당 30조 원'이라고 크게 적힌 카드를 두 손으로 감싸 쥐고 " +
        "눈이 커진 놀란 표정으로 보여주는 자세. 배경: 앞 장면과 동일한 공간.",
      overlays: [],
    },
    {
      scene: 3,
      key: "s3_opening",
      role: "opening",
      video: "bull_ep6_s3_motion.mp4",
      narration:
        "안녕, 투자 소식을 쉽고 빠르게 정리해주는 황소특보야. 핵심만 짚어줄게, 끝까지 들어봐.",
      imageBrief:
        "황소가 정면을 보며 한 손으로 위를 가리키고 다른 손은 허리에 얹은 " +
        "채 밝고 명랑하게 웃는 포즈, 소품 없음. 배경: 앞 장면과 동일한 공간.",
      overlays: [],
      riskDisclosure: true,
    },
    {
      scene: 4,
      key: "s4_situation1",
      role: "background",
      video: "bull_ep6_s4_motion.mp4",
      narration: "먼저 날짜부터 보자. 배당 기준일이 9월 30일이야.",
      imageBrief:
        "황소 옆 바닥에 세운 보드(바닥 거치)에 '배당 기준일 9/30'이 크게 " +
        "적혀 있고, 황소가 빈 손으로 보드를 가리키며 설명하는 자세. 배경: " +
        "앞 장면과 동일한 공간.",
      overlays: [],
    },
    {
      scene: 5,
      key: "s5_situation2",
      role: "background",
      video: "bull_ep6_s5_motion.mp4",
      narration:
        "국내 주식은 매수 후 결제까지 2영업일이 걸려서, 오늘 28일까지 사야 배당을 받을 수 있어.",
      imageBrief:
        "황소가 '9/28까지 매수'라고 크게 적힌 카드를 두 손으로 감싸 쥐고 " +
        "진지하고 다급한 표정으로 보여주는 자세. 배경: 앞 장면과 동일한 " +
        "공간.",
      overlays: [],
    },
    {
      scene: 6,
      key: "s6_situation3",
      role: "background",
      video: "bull_ep6_s6_motion.mp4",
      narration:
        "내일 29일은 배당락일이야. 오늘 사서 내일 팔아도 배당은 그대로 받을 수 있어.",
      imageBrief:
        "황소가 '9/29 배당락일'이라고 크게 적힌 카드를 한 손으로 감싸 쥐고, " +
        "다른 빈 손 검지를 세워 설명하는 자세. 배경: 앞 장면과 동일한 공간.",
      overlays: [],
    },
    {
      scene: 7,
      key: "s7_core_q_answer",
      role: "twist",
      video: "bull_ep6_s7_motion.mp4",
      narration:
        "그럼 왜 이번 배당이 특별한 걸까? 한마디로, 원래 정규 배당보다 27조 원 넘게 더 얹어주는 특별배당이 껴 있어서야.",
      imageBrief:
        "황소가 '정규배당 + 특별배당'이라고 크게 적힌 카드를 한 손으로 " +
        "감싸 쥐고, 다른 빈 손 검지를 세워 확신에 찬 표정을 짓는 자세. " +
        "배경: 앞 장면과 동일한 공간.",
      overlays: [],
    },
    {
      scene: 8,
      key: "s8_reason1_scale",
      role: "evidence_card",
      video: "bull_ep6_s8_motion.mp4",
      narration:
        "첫째, 규모야. 정규 분기배당은 2조 4천 5백억 원 수준인데, 이번엔 특별배당까지 더해서 30조 원이 나가.",
      imageBrief:
        "황소가 '2.45조 원 → 30조 원'이라고 화살표와 함께 크게 적힌 카드를 " +
        "두 손으로 감싸 쥐고 놀란 표정으로 보여주는 자세. 배경: 앞 장면과 " +
        "동일한 공간.",
      overlays: [],
    },
    {
      scene: 9,
      key: "s9_reason1_background",
      role: "evidence_card",
      video: "bull_ep6_s9_motion.mp4",
      narration:
        "삼성전자가 8월에 밝힌 90조에서 110조 원 규모 주주환원 계획, 그 첫 실행분이 이번 3분기 배당인 거야.",
      imageBrief:
        "황소 옆 바닥에 세운 보드(바닥 거치)에 '주주환원 90~110조 원'이 " +
        "크게 적혀 있고, 황소가 빈 손으로 보드를 가리키며 설명하는 자세. " +
        "배경: 앞 장면과 동일한 공간.",
      overlays: [],
    },
    {
      scene: 10,
      key: "s10_reason2_source",
      role: "evidence_card",
      video: "bull_ep6_s10_motion.mp4",
      narration:
        "둘째, 이 돈이 어디서 나왔을까야. AI 메모리 호황 덕분에 회사에 현금이 쌓였기 때문이야.",
      imageBrief:
        "황소가 'AI 메모리 호황 → 현금 증가'라고 화살표와 함께 크게 적힌 " +
        "카드를 두 손으로 감싸 쥐고 설명하는 자세. 배경: 앞 장면과 동일한 " +
        "공간.",
      overlays: [],
    },
    {
      scene: 11,
      key: "s11_reason2_numbers",
      role: "evidence_card",
      video: "bull_ep6_s11_motion.mp4",
      narration: "고대역폭 메모리, HBM 매출이 전 분기보다 3배 넘게 늘 거라는 전망까지 나왔어.",
      imageBrief:
        "황소가 'HBM4 매출 3배↑'라고 크게 적힌 카드를 한 손으로 감싸 쥐고, " +
        "다른 빈 손 검지를 세워 강조하는 자세. 배경: 앞 장면과 동일한 공간.",
      overlays: [],
    },
    {
      scene: 12,
      key: "s12_reason2_meaning",
      role: "background",
      video: "bull_ep6_s12_motion.mp4",
      narration: "벌어들인 돈이 커지니까, 주주한테 돌려주는 돈도 같이 커진 거지.",
      imageBrief:
        "황소가 앞 장면과 같은 'HBM4 매출 3배↑' 카드를 그대로 감싸 쥔 채, " +
        "다른 빈 손으로 카드를 톡톡 짚으며 확신에 찬 표정으로 고개를 " +
        "끄덕이는 자세. 배경: 앞 장면과 동일한 공간.",
      overlays: [],
    },
    {
      scene: 13,
      key: "s13_reason3_feel",
      role: "evidence_card",
      video: "bull_ep6_s13_motion.mp4",
      narration:
        "셋째, 체감 금액이야. 예상 배당금은 주당 4천 5백원, 1000주면 세전 450만 원 정도야.",
      imageBrief:
        "황소가 '주당 약 4,500원 / 1000주 = 약 450만 원'이라고 두 줄로 " +
        "크게 적힌 카드를 두 손으로 감싸 쥐고 밝은 표정으로 보여주는 자세. " +
        "배경: 앞 장면과 동일한 공간.",
      overlays: [],
    },
    {
      scene: 14,
      key: "s14_balance1",
      role: "background",
      video: "bull_ep6_s14_motion.mp4",
      narration: "물론 조심할 것도 있어. 배당락일엔 이론적으로 배당금만큼 주가가 빠질 수 있어.",
      imageBrief:
        "황소가 '배당락 → 이론상 주가 조정'이라고 크게 적힌 카드를 두 손으로 " +
        "감싸 쥐고 신중하고 진지한 표정으로 보여주는 자세. 배경: 앞 장면과 " +
        "동일한 공간.",
      overlays: [],
    },
    {
      scene: 15,
      key: "s15_balance2",
      role: "background",
      video: "bull_ep6_s15_motion.mp4",
      narration: "정확한 배당금액도 아직 확정이 아니야, 10월 말 이사회에서 최종 확정돼.",
      imageBrief:
        "황소가 '최종 확정은 10월 말'이라고 크게 적힌 카드를 한 손으로 " +
        "감싸 쥐고 차분하고 신중한 표정으로 보여주는 자세. 배경: 앞 장면과 " +
        "동일한 공간.",
      overlays: [],
    },
    {
      scene: 16,
      key: "s16_summary",
      role: "action",
      video: "bull_ep6_s16_motion.mp4",
      narration: "한 줄로 정리하면, 오늘이 30조 배당의 마지막 매수 기회야.",
      imageBrief:
        "황소가 '오늘 = 마지막 매수 기회'라고 크게 적힌 카드를 두 손으로 " +
        "감싸 쥐고 확신에 찬 표정으로 보여주는 자세. 배경: 앞 장면과 동일한 " +
        "공간.",
      overlays: [],
    },
    {
      scene: 17,
      key: "s17_checklist",
      role: "action",
      video: "bull_ep6_s17_motion.mp4",
      narration: "확인할 건 두 가지, 오늘 장 마감 전 매수 여부랑 10월 말 확정 배당금이야.",
      imageBrief:
        "황소가 '체크 ① 오늘 장 마감 전 매수 ② 10월 말 확정 배당금'이라고 " +
        "두 줄로 크게 적힌 카드를 한 손으로 감싸 쥐고, 다른 빈 손으로 " +
        "손가락 두 개를 세워 보이는 자세. 배경: 앞 장면과 동일한 공간.",
      overlays: [],
    },
    {
      scene: 18,
      key: "s18_remind_next_comment",
      role: "save",
      video: "bull_ep6_s18_motion.mp4",
      narration:
        "이것만은 챙겨가. 배당 확정되면 정확한 금액을 황소특보가 제일 먼저 들고 올게. 궁금한 종목은 댓글로 남겨줘.",
      imageBrief:
        "황소가 확신에 찬 표정으로 살짝 웃으며 한 손을 가볍게 흔들고 다른 " +
        "손은 자연스럽게 내린 마무리 포즈, 소품 없이 빈 손. 배경: 앞 장면과 " +
        "동일한 공간.",
      overlays: [],
      riskDisclosure: true,
    },
  ]),
});

/** 장면 키로 스펙을 찾는다. */
export function findBullEp6Scene(key) {
  return BULL_EP6_ASSEMBLY_SPEC.scenes.find((s) => s.key === key) ?? null;
}
