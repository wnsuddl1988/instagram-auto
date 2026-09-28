/**
 * 황소특보 7편 조립 스펙 — 15장면(s12 삭제, 2026-09-28 Owner 지시).
 *
 * 기준: _ai/CURRENT_STANDARDS.md §3 "씬 구조 v3"(2026-09-26 Owner 확정).
 * 목표 125~135초.
 *
 * ★ 소재 선정 경위(2026-09-28)★:
 * 당일 시황 스캔 결과 두 후보(①국내 바이오사 FDA 승인 상한가 ②미 금리
 * 부담발 코스피 6900선 붕괴, 삼성전자·SK하이닉스 급락)를 비교. 6편이
 * 이미 삼성전자 배당 소재였고 CURRENT_STANDARDS §3 편중 방지 원칙에
 * 따라, 새 섹터(바이오)이면서 촉발 이벤트가 뚜렷한 ① 채택(Owner 확정).
 *
 * ★ 핵심 팩트(2026-09-28 원문 기사 직접 확인, OBSERVED_FULL)★:
 * - 출처: 서울경제 "항암제 美 FDA 첫 승인 쾌거 HLB…개장 직후 상한가"
 *   (2026-09-28 09:51), 서울신문 "HLB 29.95% 급등, 관련주 줄상한가…
 *   코스닥 1%대 강세"(2026-09-28 09:22).
 * - 국내 바이오사의 미국 자회사가 담관암 치료제(리픽투)로 미국 FDA
 *   승인을 받음. 국내 기업이 글로벌 항암 신약의 허가를 FDA에 직접
 *   신청해 승인받은 첫 사례.
 * - 오늘(9/28) 오전 9시 29분 기준 전 거래일 대비 29.95% 급등, 3만
 *   9,700원(사실상 상한가). 정규장 전 프리마켓에서도 상승 제한폭 도달.
 * - 리픽투는 FGFR2 유전자 융합·재배열이 확인된 국소 진행성·전이성
 *   담관암 2차 치료제로, 4분기 미국 출시 예정.
 * - 미국 연간 담관암 신규 진단 약 8,000명, 올해 미국 담관암 치료제
 *   전체 시장 규모 약 5.4억 달러(약 7,380억 원) — 단 리픽투는 유전자
 *   변이 확인 + 이전 치료 경험자에게만 쓰여 실제 대상군은 더 좁음.
 * - 관련주(같은 그룹 계열 바이오사들)도 나란히 가격제한폭 수준까지
 *   확산, 코스닥지수도 1%대 상승.
 * - ★변동성 리스크(핵심 경고 포인트)★: 같은 회사가 올해 7월 별도
 *   신약(간암 치료제)의 FDA 허가 신청에서 보완 요구(CRL)를 받았을 때는
 *   주가가 곧장 하한가로 떨어진 이력이 있음. 즉 이 종목은 신약 심사
 *   결과 하나에 주가가 상한가와 하한가를 오가는 극단적 변동성을 보여옴.
 *
 * ★ Owner 명시 지시(2026-09-28): 바이오주 등락폭이 특히 심하다는 점을
 * 설명하고, 투자 추천이 아님을 정확히 전달할 것.★ 이에 따라:
 *   - 근거를 두 축으로 분리: 근거1=오늘 급등의 원인(FDA 승인 규모),
 *     근거2=이 종목 고유의 변동성 이력(7월 하한가 사례) — 근거2 자체를
 *     "조심해야 할 이유"로 구성해 경고.
 *   - 체크리스트도 "매수 여부 확인"이 아니라 "상업화 진행 상황을
 *     지켜보라"는 관망형 확인 항목으로 구성(행동 유도가 매수 암시로
 *     읽히지 않도록).
 *   - 리스크 고지 자막바(오프닝·마지막 씬)로 매수 추천이 아님을 전달.
 *
 * ★ 2026-09-28 편집 지시(Owner, 완성본 검수 중)★: s12(균형 씬, "매수
 * 추천 아님" 나레이션)를 삭제. 종목명을 한 번도 언급하지 않은 채
 * "매수를 추천하는 게 아니다"라고 말하는 게 어색하다는 지적. s11→s13을
 * 바로 이어붙여도 흐름(변동성 설명 → 한 줄 요약)이 자연스럽게 이어져
 * 문제없음을 Owner가 영상으로 직접 확인. 리스크 고지는 기존 원칙대로
 * 오프닝(s3)·마지막(s16) 하단 자막바로만 유지 — 나레이션 내 명시적
 * 매수불가 언급은 이 편에서 제거됨.
 *
 * 종목명: HLB는 허용리스트(005930/000660/005380/AAPL/TSLA/GOOGL) 밖이라
 * 실명 쓰지 않음(Owner 확정) — "국내 바이오사"로 통칭. 관련주도 "계열
 * 바이오주"로만 섹터 단위 언급.
 *
 * 리스크 고지: 나레이션에 두지 않는 일반 원칙으로 복귀(s12 삭제로
 * 예외 종료). 하단 자막바는 기존 원칙대로 오프닝 씬(s3)과 마지막
 * 씬(s16)에 유지.
 */

export const BULL_EP7_ASSEMBLY_SPEC = Object.freeze({
  specVersion: "bull_assembly_spec_v1",
  scriptStructureVersion: "bull_script_structure_v3",
  episode: 7,
  sourceCandidate: "candidate-bull-ep7-korean-biotech-fda-approval-cholangiocarcinoma",
  title: "국내 바이오사 신약, 미국 FDA 첫 승인에 상한가",
  channelName: "경제번역소",
  characterDisplayName: "황소특보",
  headerTitle: ["국내 바이오 신약", "FDA 승인에 상한가"],

  // 목표 타임라인(TTS 속도 1.05, s12 삭제로 씬 순서만 유지하고 번호는
  // 원본 그대로 둔다 — 파일명(video)은 바꾸지 않는다):
  // s1~s2 훅 0~12 / s3 오프닝 12~17 / s4~s6 상황 17~37 /
  // s7 핵심질문+즉답(약 25% 지점) 37~46 / s8~s9 근거1(승인 내용/규모) 46~62 /
  // s10~s11 근거2(변동성 이력) 62~78 / s13~s14 요약+체크 78~90 /
  // s15~s16 당부+CTA 90~101.
  scenesTimeline:
    "s1(0-6,hook) s2(6-12,hook_stakes) s3(12-17,opening) s4(17-24,situation1) s5(24-31,situation2) s6(31-37,situation3) s7(37-46,core_q_answer) s8(46-54,reason1_approval) s9(54-62,reason1_scale) s10(62-70,reason2_history) s11(70-78,reason2_meaning) s13(78-84,summary) s14(84-90,checklist) s15(90-96,remind) s16(96-101,comment_cta)",

  instagramCaptionHook: "국내 바이오사 신약이 오늘 미국에서 처음 허가받았는데, 주가가 왜 이렇게 뛰었는지 알아?",
  instagramCaptionPoints: [
    "국내 바이오사의 미국 자회사가 담관암 치료제로 미국 FDA 승인을 받았어, 국내 기업이 글로벌 항암 신약을 FDA에 직접 신청해 승인받은 첫 사례야",
    "오늘 이 회사 주가는 개장 직후 29.95% 급등하며 사실상 상한가로 직행했어, 계열 바이오주들도 나란히 가격제한폭까지 올랐어",
    "신약은 특정 유전자 변이가 확인된 담관암 환자를 위한 2차 치료제로 올해 4분기 미국 출시를 앞두고 있어",
    "다만 이 회사는 지난 7월 다른 신약 허가에서 보완 요구를 받았을 때 하한가로 떨어진 이력이 있어, 신약 심사 결과 하나에 주가가 크게 출렁이는 구조야",
    "바이오주는 등락폭이 특히 크니까 신중하게 접근해야 해",
    "오늘 확인할 건 두 가지야, 이 신약의 실제 상업화 진행 상황이랑 계열 바이오주 등락률이 계속 이어지는지야",
  ],
  instagramPriorityTags: [
    "바이오주",
    "FDA승인",
    "신약",
    "제약바이오",
    "코스닥",
    "주식투자",
    "투자유의",
    "경제뉴스",
    "재테크",
    "황소특보",
  ],

  emphasisTerms: ["FDA", "29.95%", "상한가", "국내 바이오사", "황소특보"],

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
      video: "bull_ep7_s1_motion.mp4",
      narration: "다들, 국내 바이오사 신약이 오늘 미국에서 처음 허가받았는데 무슨 일이 벌어졌는지 알아?",
      imageBrief:
        "황소가 궁금하다는 표정으로 큰 물음표가 그려진 카드를 한 손으로 " +
        "감싸 쥐고 보여주는 자세. 다른 손은 허리에. 배경(캐릭터와 동일한 " +
        "3D 애니메이션 스타일로만, 실사 렌더링 절대 금지): 증권사 트레이딩 " +
        "라운지 — 장난감처럼 둥글고 뭉툭하게 단순화된 모니터 여러 대에 " +
        "캔들차트 실루엣(숫자·종목명 없음), 은은한 블루·화이트 조명. " +
        "글자가 적힌 배너·표지판 없음. 캐릭터는 화면 세로 길이의 약 " +
        "45~50%만 차지. 황소특보 canonical reference(bull3dv1) 외형 " +
        "그대로 유지.",
      overlays: [],
    },
    {
      scene: 2,
      key: "s2_hook_stakes",
      role: "hook",
      video: "bull_ep7_s2_motion.mp4",
      narration: "오늘 개장 직후 이 회사 주가가 29.95% 급등하면서 사실상 상한가로 직행했어.",
      imageBrief:
        "황소가 '오늘 +29.95%'라고 크게 적힌 카드를 두 손으로 감싸 쥐고 " +
        "눈이 커진 놀란 표정으로 보여주는 자세. 배경: 앞 장면과 동일한 공간.",
      overlays: [],
    },
    {
      scene: 3,
      key: "s3_opening",
      role: "opening",
      video: "bull_ep7_s3_motion.mp4",
      narration: "안녕, 투자 소식을 쉽고 빠르게 정리해주는 황소특보야. 핵심만 짚어줄게, 끝까지 들어봐.",
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
      video: "bull_ep7_s4_motion.mp4",
      narration: "먼저 무슨 일이 있었는지 보자. 국내 바이오사의 미국 자회사가 담관암 치료제로 미국 FDA 승인을 받았어.",
      imageBrief:
        "황소 옆 바닥에 세운 보드(바닥 거치)에 'FDA 승인'이라고 크게 " +
        "적혀 있고 승인 도장 아이콘이 그려져 있으며, 황소가 빈 손으로 " +
        "보드를 가리키며 설명하는 자세. 배경: 앞 장면과 동일한 공간.",
      overlays: [],
    },
    {
      scene: 5,
      key: "s5_situation2",
      role: "background",
      video: "bull_ep7_s5_motion.mp4",
      narration: "국내 기업이 글로벌 항암 신약을 FDA에 직접 신청해서 승인받은 건 이번이 처음이야.",
      imageBrief:
        "황소가 '국내 최초 사례'라고 크게 적힌 카드를 두 손으로 감싸 쥐고 " +
        "확신에 찬 표정으로 보여주는 자세. 배경: 앞 장면과 동일한 공간.",
      overlays: [],
    },
    {
      scene: 6,
      key: "s6_situation3",
      role: "background",
      video: "bull_ep7_s6_motion.mp4",
      narration: "이 소식에 계열 바이오주들도 나란히 가격제한폭까지 오르면서 코스닥지수까지 1%대로 끌어올렸어.",
      imageBrief:
        "황소가 '계열 바이오주 동반 상한가'라고 크게 적힌 카드를 한 손으로 " +
        "감싸 쥐고, 다른 빈 손으로 상승 화살표를 그리듯 가리키는 자세. " +
        "배경: 앞 장면과 동일한 공간.",
      overlays: [],
    },
    {
      scene: 7,
      key: "s7_core_q_answer",
      role: "twist",
      video: "bull_ep7_s7_motion.mp4",
      narration: "그럼 왜 이 승인 하나에 주가가 이렇게까지 뛴 걸까? 한마디로, 신약 하나의 성패가 회사 전체를 좌우하는 구조라서야.",
      imageBrief:
        "황소가 '신약 하나 = 회사 운명'이라고 크게 적힌 카드를 한 손으로 " +
        "감싸 쥐고, 다른 빈 손 검지를 세워 확신에 찬 표정을 짓는 자세. " +
        "배경: 앞 장면과 동일한 공간.",
      overlays: [],
    },
    {
      scene: 8,
      key: "s8_reason1_approval",
      role: "evidence_card",
      video: "bull_ep7_s8_motion.mp4",
      narration: "첫째, 승인 내용이야. 특정 유전자 변이가 확인된 담관암 환자용 치료제고, 올해 4분기 미국에 출시돼.",
      imageBrief:
        "황소가 '4분기 미국 출시 예정'이라고 크게 적힌 카드를 두 손으로 " +
        "감싸 쥐고 설명하는 자세. 배경: 앞 장면과 동일한 공간.",
      overlays: [],
    },
    {
      scene: 9,
      key: "s9_reason1_scale",
      role: "evidence_card",
      video: "bull_ep7_s9_motion.mp4",
      narration: "다만 유전자 변이가 확인되고 이전 치료를 받은 환자한테만 쓰이는 약이라, 실제로 쓸 수 있는 환자 수는 생각보다 좁아.",
      imageBrief:
        "황소 옆 바닥에 세운 보드(바닥 거치)에 '대상 환자 제한적'이라고 " +
        "크게 적혀 있고, 황소가 빈 손으로 보드를 가리키며 신중한 표정을 " +
        "짓는 자세. 배경: 앞 장면과 동일한 공간.",
      overlays: [],
    },
    {
      scene: 10,
      key: "s10_reason2_history",
      role: "evidence_card",
      video: "bull_ep7_s10_motion.mp4",
      narration: "둘째, 이 회사 주가 이력이야. 지난 7월엔 다른 신약이 허가 보완 요구를 받으면서 정반대로 하한가까지 떨어진 적이 있어.",
      imageBrief:
        "황소가 '7월 → 하한가'라고 크게 적힌 카드를 한 손으로 감싸 쥐고, " +
        "다른 빈 손으로 하락 화살표를 그리듯 가리키며 진지한 표정을 짓는 " +
        "자세. 배경: 앞 장면과 동일한 공간.",
      overlays: [],
    },
    {
      scene: 11,
      key: "s11_reason2_meaning",
      role: "background",
      video: "bull_ep7_s11_motion.mp4",
      narration: "그러니까 신약 심사 결과 하나에 상한가와 하한가를 오갈 수 있는 종목이라는 뜻이야.",
      imageBrief:
        "황소가 앞 장면과 같은 하락 화살표 카드를 그대로 감싸 쥔 채, 다른 " +
        "빈 손으로 카드를 톡톡 짚으며 신중하게 고개를 끄덕이는 자세. " +
        "배경: 앞 장면과 동일한 공간.",
      overlays: [],
    },
    {
      scene: 13,
      key: "s13_summary",
      role: "action",
      video: "bull_ep7_s13_motion.mp4",
      narration: "한 줄로 정리하면, FDA 승인 하나가 상한가를 만들었지만 그만큼 변동성도 크다는 거야.",
      imageBrief:
        "황소가 'FDA 승인 = 상한가, 그만큼 변동성도'라고 크게 적힌 카드를 " +
        "두 손으로 감싸 쥐고 확신에 찬 표정으로 보여주는 자세. 배경: 앞 " +
        "장면과 동일한 공간.",
      overlays: [],
    },
    {
      scene: 14,
      key: "s14_checklist",
      role: "action",
      video: "bull_ep7_s14_motion.mp4",
      narration: "확인할 건 두 가지야, 신약 상업화가 실제로 진행되는지, 그리고 계열 바이오주 등락률이 계속 이어지는지야.",
      imageBrief:
        "황소가 '체크 ① 상업화 진행상황 ② 계열주 등락률'이라고 두 줄로 " +
        "크게 적힌 카드를 한 손으로 감싸 쥐고, 다른 빈 손으로 손가락 두 " +
        "개를 세워 보이는 자세. 배경: 앞 장면과 동일한 공간.",
      overlays: [],
    },
    {
      scene: 15,
      key: "s15_remind",
      role: "action",
      video: "bull_ep7_s15_motion.mp4",
      narration: "이것만은 챙겨가. 상업화 진행 상황에 새 소식이 나오면 황소특보가 제일 먼저 들고 올게.",
      imageBrief:
        "황소가 확신에 찬 표정으로 살짝 웃으며 한 손을 가볍게 흔들고 다른 " +
        "손은 자연스럽게 내린 마무리 포즈, 소품 없이 빈 손. 배경: 앞 장면과 " +
        "동일한 공간.",
      overlays: [],
    },
    {
      scene: 16,
      key: "s16_comment_cta",
      role: "save",
      video: "bull_ep7_s16_motion.mp4",
      narration: "짚어줬으면 하는 이슈는 댓글로 남겨줘, 다음에 먼저 챙겨볼게.",
      imageBrief:
        "황소가 밝은 미소로 한 손을 가볍게 흔들고 다른 손은 자연스럽게 " +
        "내린 마무리 포즈, 소품 없이 빈 손. 배경: 앞 장면과 동일한 공간.",
      overlays: [],
      riskDisclosure: true,
    },
  ]),
});

/** 장면 키로 스펙을 찾는다. */
export function findBullEp7Scene(key) {
  return BULL_EP7_ASSEMBLY_SPEC.scenes.find((s) => s.key === key) ?? null;
}
