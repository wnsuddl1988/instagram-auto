/**
 * 황소특보 5편 조립 스펙 — 14장면. 씬 구조 v3 두 번째 적용본.
 *
 * 기준: _ai/CURRENT_STANDARDS.md §3 "씬 구조 v3"(2026-09-26 Owner 확정),
 * 근거 자료: _ai/benchmark-moneyhunter-shorts-analysis-2026-09-26.md
 * (경제사냥꾼 쇼츠 486개 자막 원문 분석).
 *
 * v3 적용 사항: 4편(_bull-ep4-assembly-spec.mjs)과 동일 구조.
 * 목표 125~135초, 대본 약 614자(공백·문장부호 제외, 숫자·영어는 원표기
 * 그대로 셈 — 예: "24%"는 3자, "CPU"는 3자).
 * 훅 0~12초: "다들," + "AI 앱 하나가 반도체 순위를 흔들었다"는 의외성
 * 질문 → 수치 판돈 → 오프닝 한 문장 → 상황(미국 수치 4~5개) → 약 25%
 * 지점 핵심질문(공통점=CPU 회사)+근거(두 축 분리: 첫째=메타 '뮤즈' 앱
 * 흥행→온디바이스 AI→CPU 랠리, 둘째=한국 기판주 전이+비유) → 약 75%
 * 지점 균형 한 줄(급등 되돌림 부담) → 끝나기 약 30초 전 요약+체크 두 가지
 * → 당부+CTA(다음 단계 예고+댓글 요청).
 *
 * ★2차 수정 경위(2026-09-27, Owner 피드백 2회)★: 1차본은 s1 훅이 4편
 * s1과 문구가 거의 동일해 재작성(4편: "제일 많이 오른 게 삼성전자라고
 * 생각했어?" → 5편: "반도체 순위를 흔든 게 삼성전자도 SK하이닉스도
 * 아니고 스마트폰 AI 앱 하나였다면 믿어져?"). 또한 1차본 전체가 "종목이
 * 몇 % 올랐다"는 나열식이라 와닿지 않는다는 지적에 따라, 4편처럼 하나의
 * 인과관계(앱 흥행→온디바이스 AI→CPU 랠리→기판 전이)와 비유("기판은
 * CPU를 얹는 판")를 넣어 재작성. 최초 초안(수치 5개 나열형)과 재작성본
 * (훅+공통점 질문형)을 믹스해 분량을 채움(최종 614자).
 *
 * 소재 경위: Owner가 "1순위(국민연금 쏠림장)"와 "2순위(반도체 기판주
 * 재급등)" 중 2순위를 확정(2026-09-27). 사유: 4편처럼 특정 분야 분석형이
 * 반응이 더 좋았다는 Owner 실측 피드백. 4편(MLCC 품절 → 소부장 실적 기대)
 * 과 종목군(기판주·소부장주)은 겹치나, 이번 편의 원인 프레임은 다르다:
 * 메타가 출시한 신규 온디바이스 AI 에이전트 앱 '뮤즈'가 미국 애플
 * 앱스토어 무료 앱 1위에 오르며 GPU보다 CPU 성능이 중요해졌다는 서사가
 * 미국 CPU 반도체(AMD·인텔·Arm) 랠리를 일으켰고, 그 온기가 한국 기판주로
 * 전이됐다는 흐름.
 *
 * 수치 출처(두 곳, 측정 구간이 달라 통일 기준 적용):
 * - 미국 수치: 한국경제 "칩투어 대성공, 5거래일 기준"
 *   기사(hankyung.com/article/202609232525i, 2026-09-23, WebFetch OBSERVED_FULL)
 *   — 최근 5거래일 누적: Arm +24%, AMD +14%, 인텔 +13%, 미국 반도체지수(SOX)
 *   +11.8%, DRAM 관련 ETF +9.7%. (같은 기사의 SK하이닉스+3%, 엔비디아+4.5%는
 *   이번 편에서 다루지 않음 — 핵심 서사인 CPU 랠리와 직접 관련 없어 생략.)
 * - 한국 기판주 수치: 이투데이 "베스트&워스트"(2026-09-26, WebFetch
 *   OBSERVED_FULL) 주간 기준 — 기판 대장주(허용리스트 밖, "기판 대장주"로만
 *   표기) +8.57%로 재확인, 다른 기판주(회사명 비공개) +15.7%, 반도체
 *   소부장주(회사명 비공개) +14.66%.
 * - 메타 '뮤즈' 앱 1위 사실: 다운로드 수 등 구체 수치는 원문 재대조
 *   미완료(OWL 세션 자료에 없음) — 대본에는 "미국 앱스토어 무료 앱 1위"
 *   사실만 반영하고, 다운로드 건수·순위 유지 기간 등은 넣지 않는다.
 *
 * 종목명: 미국 종목(AMD, 인텔, Arm)은 해외 종목이라 실명 사용(국내
 * 허용리스트와 별개, 해외 대형주 실명은 기존 편들에서도 사용해 온 관행).
 * 한국 기판주·소부장주는 허용리스트(005930/000660/005380/AAPL/TSLA/GOOGL)
 * 밖이라 "기판 대장주/기판주/소부장주"로만 쓴다.
 *
 * 리스크 고지: 나레이션에 넣지 않는다. 오프닝 씬(s3)과 마지막 씬(s14)
 * 하단 자막바로만.
 *
 * ★숫자·영어 표기 규칙(2026-09-27 정정)★: 4편 실제 자막(owl_captions.ass,
 * WebFetch/직접 확인 아님 — grep으로 확인)을 보면 narration에 "9.39%",
 * "24%"처럼 숫자를 그대로 쓴 경우도 ElevenLabs TTS가 정상적으로 읽고
 * 자막도 "24%"로 정상 표시됐다. 한글 한 자 한 자 풀어쓰기("이십사퍼센트")
 * 는 불필요하며 오히려 자막 가독성이 떨어진다 — 5편부터는 4편과 동일하게
 * 숫자(%, 소수점 포함)와 해외 종목 영문명(AMD, Arm, CPU, DRAM, ETF)을
 * 원표기 그대로 쓴다. 단, 국내 회사명(기판 대장주 등)은 여전히 허용리스트
 * 규칙에 따라 실명 대신 통칭으로 쓴다.
 */

export const BULL_EP5_ASSEMBLY_SPEC = Object.freeze({
  specVersion: "bull_assembly_spec_v1",
  scriptStructureVersion: "bull_script_structure_v3",
  episode: 5,
  sourceCandidate: "candidate-bull-ep5-meta-muse-cpu-rally-board-stocks",
  title: "삼성전자 아니야, 이번 주 진짜 크게 움직인 반도체는 따로 있었어",
  channelName: "경제번역소",
  characterDisplayName: "황소특보",
  headerTitle: ["미국 CPU 반도체 랠리", "한국 기판주로 번지다"],

  // 목표 타임라인(TTS 속도 1.05):
  // s1~s2 훅 0~12 / s3 오프닝 12~18 / s4~s5 상황 18~37 /
  // s6 핵심질문+즉답(약 25% 지점) 37~46 / s7~s9 근거1(미국) 46~74 /
  // s10~s11 근거2(한국 전이) 74~93 / s12 균형(약 75%) 93~104 /
  // s13 요약+체크(끝나기 약 30초 전) 104~114 / s14 당부+CTA 114~126.
  scenesTimeline:
    "s1(0-6,hook_q) s2(6-12,hook_stakes) s3(12-18,opening) s4(18-27,situation1) s5(27-37,situation2) s6(37-46,core_q_answer) s7(46-55,reason1_term) s8(55-65,reason1_numbers) s9(65-74,reason1_cause) s10(74-83,reason2) s11(83-93,reason2_meaning) s12(93-104,balance) s13(104-114,summary_checklist) s14(114-126,remind_next_comment)",

  instagramCaptionHook: "이번 주 반도체 순위를 흔든 게 삼성전자도 SK하이닉스도 아니고 스마트폰 AI 앱 하나였다면 믿어져?",
  instagramCaptionPoints: [
    "최근 5거래일 동안 Arm이 24%, AMD가 14%, 인텔이 13% 올랐어, 미국 반도체지수도 11.8%, DRAM ETF는 9.7% 뛰었어",
    "이 종목들 공통점은 그래픽칩이 아니라 전부 CPU를 만드는 회사라는 거야",
    "불을 지핀 건 메타야, 이번 주 낸 AI 에이전트 앱 뮤즈가 미국 애플 앱스토어 무료 앱 1위에 올랐어",
    "이 앱은 스마트폰 안에서 바로 돌아가는 온디바이스 AI라 그래픽칩보다 CPU 성능이 더 중요해, 그래서 CPU 회사들로 돈이 몰렸어",
    "이 불이 한국까지 옮겨붙었어, 기판 대장주가 8.57%, 다른 기판주가 15.7%, 반도체 소부장주가 14.66% 더 뛰었어",
    "기판은 CPU를 얹는 판이야, CPU 수요가 늘면 그 판을 만드는 회사 주문도 같이 늘 거란 계산이 붙었어",
    "다만 하루이틀 새 급등한 거라 되돌림 부담도 있어, 앱 순위가 꺾이면 이 온기도 같이 식을 수 있어",
    "오늘 확인할 건 두 가지야, 뮤즈 앱스토어 순위가 유지되는지, 기판주 등락률이 다음 주에도 이어지는지",
  ],
  instagramPriorityTags: [
    "반도체",
    "AMD",
    "인텔",
    "메타",
    "기판주",
    "소부장",
    "주식투자",
    "경제뉴스",
    "재테크",
    "황소특보",
  ],

  emphasisTerms: ["뮤즈", "24%", "CPU", "기판주", "15.7%", "황소특보"],

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
      video: "bull_ep5_s1_motion.mp4",
      narration:
        "다들, 이번 주 반도체 순위를 흔든 게 삼성전자도 SK하이닉스도 아니고 스마트폰 AI 앱 하나였다면 믿어져?",
      imageBrief:
        "황소가 놀랍고 궁금하다는 표정으로 'AI 앱 1개' 라고 적힌 스마트폰 모양 카드를" +
        "한 손으로 감싸 쥐고 보여주는 자세. 다른 손은 허리에. 배경(캐릭터와 동일한 " +
        "3D 애니메이션 스타일로만, 실사 렌더링 절대 금지): 증권사 트레이딩 라운지 — " +
        "장난감처럼 둥글고 뭉툭하게 단순화된 모니터 여러 대에 캔들차트 실루엣(숫자·" +
        "종목명 없음), 은은한 블루·화이트 조명. 글자가 적힌 배너·표지판 없음. 캐릭터는 " +
        "화면 세로 길이의 약 45~50%만 차지. 황소특보 canonical reference(bull3dv1) " +
        "외형 그대로 유지.",
      overlays: [],
    },
    {
      scene: 2,
      key: "s2_hook_stakes",
      role: "hook",
      video: "bull_ep5_s2_motion.mp4",
      narration:
        "그 앱 하나로 미국 반도체가 최대 24%, 한국 기판주는 하루 만에 15%씩 뛰었어. 뉴스 안 봤으면 진짜 모를 흐름이야.",
      imageBrief:
        "황소가 '미국 CPU 반도체 +14~24%'라고 크게 적힌 카드를 두 손으로 감싸 쥐고 " +
        "눈이 커진 놀란 표정으로 보여주는 자세. 배경: 앞 장면과 동일한 공간.",
      overlays: [],
    },
    {
      scene: 3,
      key: "s3_opening",
      role: "opening",
      video: "bull_ep5_s3_motion.mp4",
      narration:
        "안녕, 투자 소식을 쉽고 빠르게 정리해주는 황소특보야. 핵심만 짚어줄게, 끝까지 들어봐.",
      imageBrief:
        "황소가 정면을 보며 한 손으로 위를 가리키고 다른 손은 허리에 얹은 채 밝고 " +
        "명랑하게 웃는 포즈, 소품 없음. 배경: 앞 장면과 동일한 공간.",
      overlays: [],
      riskDisclosure: true,
    },
    {
      scene: 4,
      key: "s4_situation1",
      role: "background",
      video: "bull_ep5_s4_motion.mp4",
      narration:
        "먼저 숫자부터 보자. 최근 5거래일 동안 Arm 24%, AMD 14%, 인텔 13% 올랐어.",
      imageBrief:
        "황소 옆 바닥에 세운 시상대 모양 보드(바닥 거치)에 1·2·3위 자리마다 'Arm +24%' " +
        "'AMD +14%' '인텔 +13%'가 크게 적혀 있고, 황소가 빈 손으로 1위 자리를 " +
        "가리키며 설명하는 자세. 배경: 앞 장면과 동일한 공간.",
      overlays: [],
    },
    {
      scene: 5,
      key: "s5_situation2",
      role: "background",
      video: "bull_ep5_s5_motion.mp4",
      narration:
        "미국 반도체지수도 같은 기간 11.8%, 반도체 관련 DRAM ETF는 9.7% 뛰었어.",
      imageBrief:
        "황소가 '반도체지수 +11.8% / DRAM ETF +9.7%' 카드를 두 손으로 감싸 쥐고 " +
        "고개를 끄덕이며 보여주는 자세. 배경: 앞 장면과 동일한 공간.",
      overlays: [],
    },
    {
      scene: 6,
      key: "s6_core_q_answer",
      role: "twist",
      video: "bull_ep5_s6_motion.mp4",
      narration:
        "이 종목들 공통점이 뭘까? 그래픽칩이 아니라 전부 중앙처리장치, CPU를 만드는 회사라는 거야.",
      imageBrief:
        "황소가 'Arm·AMD·인텔 = CPU 회사' 라고 크게 적힌 카드를 한 손으로 감싸 쥐고, " +
        "다른 빈 손 검지를 세워 '공통점'을 짚어내는 자세, 무언가 알아낸 확신에 찬 " +
        "표정. 배경: 앞 장면과 동일한 공간.",
      overlays: [],
    },
    {
      scene: 7,
      key: "s7_reason1_term",
      role: "evidence_card",
      video: "bull_ep5_s7_motion.mp4",
      narration:
        "불을 지핀 건 메타야. 이번 주 낸 AI 에이전트 앱 뮤즈가 미국 애플 앱스토어 무료 앱 순위 1위에 올랐어.",
      imageBrief:
        "황소가 '메타 뮤즈 앱스토어 1위'라고 크게 적힌 카드를 두 손으로 감싸 쥐고 " +
        "진지한 표정으로 보여주는 자세. 배경: 앞 장면과 동일한 공간.",
      overlays: [],
    },
    {
      scene: 8,
      key: "s8_reason1_numbers",
      role: "evidence_card",
      video: "bull_ep5_s8_motion.mp4",
      narration:
        "이 앱은 스마트폰 안에서 바로 돌아가는 온디바이스 AI야. 클라우드 서버 대신 내 폰 CPU가 직접 계산을 떠맡는 방식이지.",
      imageBrief:
        "황소 옆 바닥에 세운 보드(바닥 거치)에 '온디바이스 AI → CPU 성능 중요'가 " +
        "크게 적혀 있고, 황소가 빈 손으로 보드를 가리키며 설명하는 자세. 배경: 앞 " +
        "장면과 동일한 공간.",
      overlays: [],
    },
    {
      scene: 9,
      key: "s9_reason1_cause",
      role: "evidence_card",
      video: "bull_ep5_s9_motion.mp4",
      narration:
        "그래서 그래픽칩보다 CPU를 만드는 AMD, 인텔, Arm 쪽으로 돈이 먼저 몰린 거야.",
      imageBrief:
        "황소가 'AMD·인텔·Arm ↑'이라고 크게 적힌 카드를 한 손으로 감싸 쥐고, 다른 " +
        "빈 손 검지를 세워 강조하는 자세. 배경: 앞 장면과 동일한 공간.",
      overlays: [],
    },
    {
      scene: 10,
      key: "s10_reason1_impact",
      role: "evidence_card",
      video: "bull_ep5_s10_motion.mp4",
      narration:
        "앱 하나가 반도체 순위를 바꿔놓은 거지.",
      imageBrief:
        "황소가 앞 장면과 같은 'AMD·인텔·Arm ↑' 카드를 그대로 감싸 쥔 채, 다른 " +
        "빈 손으로 카드를 톡톡 짚으며 확신에 찬 표정으로 고개를 끄덕이는 자세. " +
        "배경: 앞 장면과 동일한 공간.",
      overlays: [],
    },
    {
      scene: 11,
      key: "s11_reason2_transfer",
      role: "evidence_card",
      video: "bull_ep5_s11_motion.mp4",
      narration:
        "기판 대장주 8.57%, 다른 기판주 15.7%, 소부장주 14.66%.",
      imageBrief:
        "황소가 '기판 대장주 +8.57% / 기판주 +15.7%' 카드를 두 손으로 감싸 쥐고 " +
        "놀란 표정으로 앞으로 내밀어 보여주는 자세. 배경: 앞 장면과 동일한 공간.",
      overlays: [],
    },
    {
      scene: 12,
      key: "s12_reason2_impact",
      role: "evidence_card",
      video: "bull_ep5_s12_motion.mp4",
      narration:
        "이 불이 한국까지 옮겨붙었어.",
      imageBrief:
        "황소가 앞 장면과 같은 카드를 그대로 감싸 쥔 채, 다른 빈 손으로 '미국 → 한국' " +
        "방향을 가리키며 놀란 표정을 짓는 자세. 배경: 앞 장면과 동일한 공간.",
      overlays: [],
    },
    {
      scene: 13,
      key: "s13_reason2_meaning",
      role: "background",
      video: "bull_ep5_s13_motion.mp4",
      narration:
        "기판은 CPU를 실제로 얹는 판이야. CPU 수요가 늘면 그 판을 만드는 회사 주문도 같이 늘 거란 계산이 붙은 거지.",
      imageBrief:
        "황소 옆 바닥에 세운 보드(바닥 거치)에 '소부장주 +14.66%'가 크게 적혀 있고, " +
        "황소가 빈 손으로 보드 오른쪽을 가리키는 자세. 배경: 앞 장면과 동일한 공간.",
      overlays: [],
    },
    {
      scene: 14,
      key: "s14_balance",
      role: "background",
      video: "bull_ep5_s14_motion.mp4",
      narration:
        "다만 하루이틀 새 급등한 거라 되돌림 부담도 있어. 앱 순위가 꺾이면 이 온기도 같이 식을 수 있어.",
      imageBrief:
        "황소가 '급등 뒤 되돌림 주의'라고 크게 적힌 카드를 두 손으로 감싸 쥐고 신중하고 " +
        "진지한 표정으로 보여주는 자세. 배경: 앞 장면과 동일한 공간.",
      overlays: [],
    },
    {
      scene: 15,
      key: "s15_summary",
      role: "action",
      video: "bull_ep5_s15_motion.mp4",
      narration:
        "한 줄로 정리하면, 스마트폰 AI 앱 하나가 미국 CPU를 흔들었고 그 온기가 한국 기판주까지 왔어.",
      imageBrief:
        "황소가 '앱 1위 → CPU → 기판주' 화살표가 크게 그려진 카드를 두 손으로 감싸 " +
        "쥐고 확신에 찬 표정으로 보여주는 자세. 배경: 앞 장면과 동일한 공간.",
      overlays: [],
    },
    {
      scene: 16,
      key: "s16_checklist",
      role: "action",
      video: "bull_ep5_s16_motion.mp4",
      narration:
        "확인할 건 두 가지, 뮤즈 앱스토어 순위랑 기판주 등락률이야.",
      imageBrief:
        "황소가 '체크 ① 뮤즈 앱스토어 순위 ② 기판주 등락률'이라고 두 줄로 크게 적힌 " +
        "카드를 한 손으로 감싸 쥐고, 다른 빈 손으로 손가락 두 개를 세워 보이는 자세. " +
        "배경: 앞 장면과 동일한 공간.",
      overlays: [],
    },
    {
      scene: 17,
      key: "s17_remind_next_comment",
      role: "save",
      video: "bull_ep5_s17_motion.mp4",
      narration:
        "이 흐름이 다음 주에도 이어지면 황소특보가 제일 먼저 들고 올게. 어떤 종목이 더 궁금한지 댓글로 남겨줘.",
      imageBrief:
        "황소가 확신에 찬 표정으로 살짝 웃으며 한 손을 가볍게 흔들고 다른 손은 자연스럽게 " +
        "내린 마무리 포즈, 소품 없이 빈 손. 배경: 앞 장면과 동일한 공간.",
      overlays: [],
      riskDisclosure: true,
    },
  ]),
});

/** 장면 키로 스펙을 찾는다. */
export function findBullEp5Scene(key) {
  return BULL_EP5_ASSEMBLY_SPEC.scenes.find((s) => s.key === key) ?? null;
}
