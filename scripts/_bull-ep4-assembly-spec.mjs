/**
 * 황소특보 4편 조립 스펙 — 14장면. ★6차: 씬 구조 v3 최초 적용본★
 *
 * 기준: _ai/CURRENT_STANDARDS.md §3 "씬 구조 v3"(2026-09-26 Owner 확정),
 * 근거 자료: _ai/benchmark-moneyhunter-shorts-analysis-2026-09-26.md
 * (경제사냥꾼 쇼츠 486개 자막 원문 분석).
 *
 * v3 적용 사항:
 * - 목표 120~130초, 대본 약 750자(공백·문장부호 제외, 숫자는 숫자로 셈).
 * - 훅 0~12초: "다들," + 제목 질문 + 수치 판돈 + 손실회피 → 오프닝 한 문장.
 * - 전체의 약 25% 지점에서 핵심 질문을 던지고 바로 답한다. 근거는
 *   첫째(부품 수급)와 둘째(증설→소부장 실적 차례)로 쌓고, 용어 풀이
 *   (MLCC)와 비유를 넣는다.
 * - 약 75% 지점에 균형 한 줄(급등 부담, 같은 주 원자력·방산 차익실현).
 * - 끝나기 약 30초 전 "한 줄로 정리하면" → 체크 두 가지 → "이것만은
 *   챙겨가" → 다음 단계 예고 → 댓글 요청. 고정 CTA 클립은 그대로 붙인다.
 * - 고유 문구 세트를 사용한다(경제사냥꾼 문구는 쓰지 않음).
 *
 * 5차 대비 사실관계 보정: 5차는 "부품주가 더 뛴 이유 = MLCC 품절"로
 * 원인을 하나로 단정했다. 원문은 ①AI 서버용 부품 수급 압박(MLCC 품절
 * 확산이 그 신호)과 ②국내외 반도체 증설로 하반기부터 소부장 실적이 클
 * 거라는 기대, 두 가지를 이유로 든다. 6차는 이 두 축으로 나눠 설명한다.
 *
 * 출처(단일 기사, 브라우저로 원문 전체 확인 OBSERVED_FULL): 머니투데이
 * "'이게 추석 선물이지' 24% '껑충'...삼전닉스보다 더 뛴 이 종목[김근희의
 * 증시 랩업]"(2026-09-26 06:00). 사용한 수치(9월 넷째 주, 9/21~25):
 * - 코스피 7080.92, 전주(6894.23) 대비 +2.71%
 * - 삼성전자 +9.39%, SK하이닉스 +0.27%, 기판 대장주 +8.57%
 * - 기판주 +24%(시총 1조·주간 거래대금 1천억 이상 중 1위), 또 다른 기판주
 *   +15.7%, 반도체 소부장주 +14.66%
 * - MLCC: 지난달 고용량 중심 품절이 이달 범용으로 확산, 일부 품목 유통가
 *   한 달 만에 최대 280% 급등. 서버용 제품으로의 생산능력 배분이 수급을
 *   압박한다는 해석(증권사 연구원 코멘트, 대본에는 이름 없이 사실로만 씀).
 * - 국내외 반도체 기업 증설 시작, 상반기까지는 대장주 실적 → 하반기부터
 *   소부장 실적 성장 기대.
 * - 같은 주 원자력·건설·방산주는 차익실현 등으로 하락(많게는 -7%대).
 * 종목명: 삼성전자·SK하이닉스만 실명(허용리스트). 삼성전기·코리아써키트·
 * 대덕전자·이수페타시스 등은 허용리스트 밖이라 "기판 대장주/기판주/
 * 소부장주"로만 쓴다.
 *
 * 리스크 고지: 나레이션에 넣지 않는다. 오프닝 씬(s3)과 마지막 씬(s14)
 * 하단 자막바로만.
 *
 * 클립 재사용 후보(Owner 허용: 같은 포즈만): s9·s11은 둘 다 "바닥에 세운
 * 보드를 가리키는" 포즈라, 보드 문구만 다르게 한 이미지로 각각 만든다.
 * 영상 재사용은 이미지가 같을 때만 가능하므로 여기서는 재사용하지 않는다.
 */

export const BULL_EP4_ASSEMBLY_SPEC = Object.freeze({
  specVersion: "bull_assembly_spec_v1",
  scriptStructureVersion: "bull_script_structure_v3",
  episode: 4,
  sourceCandidate: "candidate-bull-ep4-mlcc-board-stocks-outrun-semiconductor-flagships",
  title: "이번 주 삼성전자보다 더 오른 반도체주, 이유 알고 있어?",
  channelName: "경제번역소",
  characterDisplayName: "황소특보",
  headerTitle: ["삼성전자보다 더 오른 곳", "반도체 돈이 번지고 있다"],

  // 목표 타임라인(TTS 속도 1.1, 초당 약 6자 가정 — 실측 후 재조정):
  // s1~s2 훅 0~12 / s3 오프닝 12~18 / s4~s5 상황 18~37 /
  // s6 핵심질문+즉답(약 25% 지점) 37~45 / s7~s9 근거1 45~73 /
  // s10~s11 근거2 73~92 / s12 균형(약 75%) 92~103 /
  // s13 요약+체크(끝나기 약 30초 전) 103~115 / s14 당부+CTA 115~127.
  scenesTimeline:
    "s1(0-6,hook_q) s2(6-12,hook_stakes) s3(12-18,opening) s4(18-27,situation1) s5(27-37,situation2) s6(37-45,core_q_answer) s7(45-55,reason1_term) s8(55-64,reason1_numbers) s9(64-73,reason1_cause) s10(73-83,reason2) s11(83-92,reason2_meaning) s12(92-103,balance) s13(103-115,summary_checklist) s14(115-127,remind_next_comment)",

  instagramCaptionHook: "이번 주 반도체 랠리, 삼성전자가 제일 많이 올랐다고 생각했다면 진짜 크게 움직인 곳은 놓친 거야",
  instagramCaptionPoints: [
    "이번 주 코스피는 2.71% 올라 7080선, 삼성전자는 9.39%, SK하이닉스는 0.27% 올랐어",
    "근데 상승률 순위 맨 위는 대장주가 아니었어, 기판주가 24%, 또 다른 기판주가 15.7%, 반도체 소부장주가 14.66% 뛰었어",
    "첫째 이유는 부품 부족이야, MLCC 품절이 고용량 제품에서 범용 제품까지 번졌고 일부 품목 유통가는 한 달 새 최대 280% 올랐어",
    "둘째 이유는 증설이야, 국내외 반도체 회사들이 공장을 늘리기 시작하면서 하반기부터는 부품·장비주 실적이 클 차례라는 기대가 붙었어",
    "다만 한 주 만에 크게 뛴 만큼 쏠림 뒤 되돌림도 조심해야 해, 같은 주 원자력·방산주는 차익실현에 많게는 7% 넘게 빠졌어",
    "오늘 확인할 건 두 가지야, 대장주 말고 부품주 등락률도 같이 보고, MLCC 가격 뉴스를 챙겨봐",
  ],
  instagramPriorityTags: [
    "반도체",
    "MLCC",
    "삼성전자",
    "SK하이닉스",
    "기판주",
    "소부장",
    "주식투자",
    "경제뉴스",
    "재테크",
    "황소특보",
  ],

  emphasisTerms: ["MLCC", "기판주", "280%", "24%", "증설", "황소특보"],

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
      video: "bull_ep4_s1_motion.mp4",
      narration: "다들, 이번 주 반도체에서 제일 많이 오른 게 삼성전자라고 생각했어? 순위표 보면 얘기가 달라.",
      imageBrief:
        "황소가 궁금하다는 표정으로 큰 물음표가 그려진 카드를 한 손으로 감싸 쥐고 " +
        "보여주는 자세. 다른 손은 허리에. 배경(캐릭터와 동일한 3D 애니메이션 " +
        "스타일로만, 실사 렌더링 절대 금지): 증권사 트레이딩 라운지 — 장난감처럼 " +
        "둥글고 뭉툭하게 단순화된 모니터 여러 대에 캔들차트 실루엣(숫자·종목명 " +
        "없음), 은은한 블루·화이트 조명. 글자가 적힌 배너·표지판 없음. 캐릭터는 " +
        "화면 세로 길이의 약 45~50%만 차지. 황소특보 canonical reference(bull3dv1) " +
        "외형 그대로 유지.",
      overlays: [],
    },
    {
      scene: 2,
      key: "s2_hook_stakes",
      role: "hook",
      video: "bull_ep4_s2_motion.mp4",
      narration: "삼성전자가 9.39% 오를 때 기판 부품주는 24%나 뛰었어. 대장주만 봤다면 진짜 움직인 곳은 놓친 거야.",
      imageBrief:
        "황소가 '삼성전자 +9.39%'와 '기판주 +24%' 두 카드를 양손에 하나씩 감싸 쥐고 " +
        "대조해 보여주는 자세, 눈이 커진 놀란 표정. 배경: 앞 장면과 동일한 공간.",
      overlays: [],
    },
    {
      scene: 3,
      key: "s3_opening",
      role: "opening",
      video: "bull_ep4_s3_motion.mp4",
      narration: "안녕, 투자 소식을 쉽고 빠르게 정리해주는 황소특보야. 핵심만 짚어줄게, 끝까지 들어봐.",
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
      video: "bull_ep4_s4_motion.mp4",
      narration: "먼저 숫자부터 보자. 코스피는 이번 주 2.71% 올랐고, 삼성전자는 9.39%, SK하이닉스는 0.27%야.",
      imageBrief:
        "황소가 '코스피 +2.71%'라고 크게 적힌 카드를 두 손으로 감싸 쥐고 밝은 표정으로 " +
        "보여주는 자세. 배경: 앞 장면과 동일한 공간.",
      overlays: [],
    },
    {
      scene: 5,
      key: "s5_situation2",
      role: "background",
      video: "bull_ep4_s5_motion.mp4",
      narration: "근데 순위표 맨 위는 따로 있어. 기판주가 24%, 15.7%, 소부장주가 14.66%.",
      imageBrief:
        "황소 옆 바닥에 세운 시상대 모양 보드(바닥 거치)에 1·2·3위 자리마다 '24%' " +
        "'15.7%' '14.66%'가 크게 적혀 있고, 황소가 빈 손으로 1위 자리를 가리키며 " +
        "감탄하는 자세. 배경: 앞 장면과 동일한 공간.",
      overlays: [],
    },
    {
      scene: 6,
      key: "s6_core_q_answer",
      role: "twist",
      video: "bull_ep4_s6_motion.mp4",
      narration: "그럼 왜 대장주보다 부품주가 더 뛰었을까? 한마디로, 반도체에 몰린 돈이 칩 다음 단계인 부품으로 번지고 있어서야.",
      imageBrief:
        "황소가 '칩 → 부품' 화살표가 크게 그려진 카드를 한 손으로 감싸 쥐고, 다른 " +
        "빈 손으로 화살표 방향을 가리키는 자세(소품 없는 손에만 동작), 무언가 알아낸 " +
        "확신에 찬 표정. 배경: 앞 장면과 동일한 공간.",
      overlays: [],
    },
    {
      scene: 7,
      key: "s7_reason1_term",
      role: "evidence_card",
      video: "bull_ep4_s7_motion.mp4",
      narration: "첫째, 부품이 모자라. MLCC라고, 전자기기마다 수백 개씩 들어가는 쌀알만 한 부품이 있는데 이게 지금 품절이야.",
      imageBrief:
        "황소가 'MLCC 품절'이라고 크게 적힌 카드를 두 손으로 감싸 쥐고 진지한 표정으로 " +
        "보여주는 자세. 배경: 앞 장면과 동일한 공간.",
      overlays: [],
    },
    {
      scene: 8,
      key: "s8_reason1_numbers",
      role: "evidence_card",
      video: "bull_ep4_s8_motion.mp4",
      narration: "지난달엔 고용량 제품만 품절이었는데 이달엔 범용 제품까지 번졌어. 일부 유통가는 한 달 새 280%나 뛰었고.",
      imageBrief:
        "황소가 '유통가 최대 +280%'라고 크게 적힌 카드를 두 손으로 감싸 쥐고 확신에 찬 " +
        "눈빛으로 앞으로 내밀어 보여주는 자세. 배경: 앞 장면과 동일한 공간.",
      overlays: [],
    },
    {
      scene: 9,
      key: "s9_reason1_cause",
      role: "evidence_card",
      video: "bull_ep4_s9_motion.mp4",
      narration: "이유는 AI 서버야. 만드는 회사들이 서버용에 생산 능력을 먼저 돌리면서, 나머지 공급이 빡빡해진 거지.",
      imageBrief:
        "황소 옆 바닥에 세운 보드(바닥 거치)에 'AI 서버 → 공급 부족'이 크게 적혀 있고, " +
        "황소가 빈 손으로 보드를 가리키며 설명하는 자세. 배경: 앞 장면과 동일한 공간.",
      overlays: [],
    },
    {
      scene: 10,
      key: "s10_reason2",
      role: "evidence_card",
      video: "bull_ep4_s10_motion.mp4",
      narration: "둘째, 공장이 새로 지어지고 있어. 국내외 반도체 회사들이 증설을 시작했거든. 공장이 늘면 장비랑 부품 주문이 먼저 들어가.",
      imageBrief:
        "황소가 '반도체 증설 시작'이라고 크게 적힌 카드를 한 손으로 감싸 쥐고, 다른 " +
        "빈 손 검지를 세워 '둘째'를 강조하는 자세. 배경: 앞 장면과 동일한 공간.",
      overlays: [],
    },
    {
      scene: 11,
      key: "s11_reason2_meaning",
      role: "background",
      video: "bull_ep4_s11_motion.mp4",
      narration: "그래서 상반기에 대장주 실적이 뛰었다면, 하반기엔 부품·장비주 차례라는 기대가 붙었어. 주가가 그걸 먼저 반영한 거지.",
      imageBrief:
        "황소 옆 바닥에 세운 보드(바닥 거치)에 '상반기 대장주 → 하반기 부품주'가 크게 " +
        "적혀 있고, 황소가 빈 손으로 오른쪽 화살표 끝을 가리키는 자세. 배경: 앞 장면과 " +
        "동일한 공간.",
      overlays: [],
    },
    {
      scene: 12,
      key: "s12_balance",
      role: "background",
      video: "bull_ep4_s12_motion.mp4",
      narration: "물론 조심할 것도 있어. 한 주 만에 크게 뛴 만큼 되돌림도 와. 같은 주 원자력·방산주는 차익실현에 7% 넘게 빠진 곳도 나왔어.",
      imageBrief:
        "황소가 '급등 뒤 되돌림 주의'라고 크게 적힌 카드를 두 손으로 감싸 쥐고 신중하고 " +
        "진지한 표정으로 보여주는 자세. 배경: 앞 장면과 동일한 공간.",
      overlays: [],
    },
    {
      scene: 13,
      key: "s13_summary_checklist",
      role: "action",
      video: "bull_ep4_s13_motion.mp4",
      narration: "한 줄로 정리하면, 반도체 돈이 칩에서 부품으로 번지는 중이야. 확인할 건 두 가지, 부품주 등락률이랑 MLCC 가격 뉴스.",
      imageBrief:
        "황소가 '체크 ① 부품주 등락률 ② MLCC 가격'이라고 두 줄로 크게 적힌 카드를 한 " +
        "손으로 감싸 쥐고, 다른 빈 손으로 손가락 두 개를 세워 보이는 자세. 배경: 앞 " +
        "장면과 동일한 공간.",
      overlays: [],
    },
    {
      scene: 14,
      key: "s14_remind_next_comment",
      role: "save",
      video: "bull_ep4_s14_motion.mp4",
      narration: "이것만은 챙겨가. 연휴 끝나고 이 흐름이 이어지는지 황소특보가 제일 먼저 들고 올게. 짚어줬으면 하는 이슈는 댓글로 남겨줘.",
      imageBrief:
        "황소가 확신에 찬 표정으로 살짝 웃으며 한 손을 가볍게 흔들고 다른 손은 자연스럽게 " +
        "내린 마무리 포즈, 소품 없이 빈 손. 배경: 앞 장면과 동일한 공간.",
      overlays: [],
      riskDisclosure: true,
    },
  ]),
});

/** 장면 키로 스펙을 찾는다. */
export function findBullEp4Scene(key) {
  return BULL_EP4_ASSEMBLY_SPEC.scenes.find((s) => s.key === key) ?? null;
}
