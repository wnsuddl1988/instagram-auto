/**
 * 황소특보 22편 조립 스펙 — 17장면(삼성전자 8일 리밸런싱: 반도체 ETF 비중 상한 때문에 팔리는 물량). 씬 구조 v3 + 성공 공식/엔딩 5박자.
 *
 * 번호: 21편(메모리 가격 둔화)에 이은 22편(파일 ep22). 게시 예정 2026-10-07(수) 저녁 6~7시(Owner 지시, 8일 옵션만기·리밸런싱 D-1).
 * 전달 메시지 한 줄: 8일의 삼성전자 매물은 실적 신호가 아니라 규칙이 만든 수급이다 — 움직인 날엔 실적인지 수급인지부터 가른다.
 * 담당: 황소특보(투자자 입장, 규칙 22). 레인 ③ 이벤트 D-N · 영역 반도체 · 유형 schedule · 특보 근접도 상(10/8 D-1, 삼성 직접).
 *
 * ★ 소재 선정 경위(2026-10-06)★: `C:/tmp/bull-topic-scan-ep22/SCAN_CHECKLIST.md` 11단계 + 후보 40개 → 성과 분석(삼성 직접성·통념 반전·날짜 이벤트 기준) → Owner "1번으로 진행해".
 * 처음 선택했던 레버리지 ETF 대본(`_ai/bull-ep22-leverage-script-draft.md`)은 보관(11월 세부안 때 사용).
 * 초안·팩트표·새 독자 읽기 점검(규칙 29): `_ai/bull-ep22-etf-rebalance-script-draft.md`.
 *
 * ★ 핵심 팩트(서울경제 2026-10-06 두 건, 삼성증권 추산 — 단일 매체, 게시 직전 재확인 필수)★
 * - 반도체 ETF 7개 순자산 합 18조 9,436억 원(10/2), 리밸런싱 집중일 = 옵션만기일 10/8.
 * - 가장 큰 ETF(TIGER 반도체TOP10)의 삼성전자 비중 26.98% → 종목당 상한 25% 초과 1.98%p, 약 2,098억 원 축소 필요(ETF 상품명은 대본·카드에 쓰지 않음).
 * - 삼성증권 추산: SK하이닉스 약 900억 원 매수(SK스퀘어 약 800억은 허용리스트 밖이라 미사용), 장비·기판 중소형주 네 곳 각 200억 안팎(종목명 미사용), 일평균 거래대금 대비 최대 27.5%.
 * - 장비주 최근 한 달 상승 최대 37.0%(되돌림 위험 언급), 옵션만기 집중 리밸런싱은 수급 불일치 변동성 위험(삼성증권).
 * - 삼성전자 3분기 잠정실적 10/8 예상(공시 전·미확정, 삼성은 당일 공시).
 * - 리스크 고지: 나레이션에 넣지 않고 오프닝(s2)·마지막(s17) 하단 자막바로만.
 *
 * TTS 실측: 17씬 120.44초, API 1/1, 순수 발화 최대 7.87초(s16), 정렬 밀림 점검 -0.28초(s10)·-0.24초(s11) 포함 전부 "정상(유지)" 판정 — `C:/tmp/money-shorts-os/bull-ep22-tts/output-v1/`.
 */

const CARD_LAYOUT =
  "구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄, 카드에 그림·화살표 없이 글자만.";
const card2 = (l1, l2, expression) => `황소가 ${expression} '${l1}'와 '${l2}'가 두 줄로 크게 적힌 카드를 두 손으로 감싸 쥐고 보여주는 자세. ${CARD_LAYOUT}`;
const cardMotion = (action, mood) => ({ type: "card2", action: `the character's expression is ${action}; only the face and body move while the hands holding the card stay still.`, mood });

export const BULL_EP22_ASSEMBLY_SPEC = Object.freeze({
  specVersion: "bull_assembly_spec_v1",
  scriptStructureVersion: "bull_script_structure_v3",
  endingStructureVersion: "bull_ending_5beat_2026_09_29",
  episode: 22,
  sourceCandidate: "candidate-bull-ep22-semiconductor-etf-rebalance-oct8-2026-10-06",
  title: "삼성전자 8일, 규칙 때문에 팔린다",
  channelName: "경제번역소",
  characterDisplayName: "황소특보",
  headerTitle: ["삼성전자 8일", "규칙 때문에", "팔린다"],

  hookType: "T1",
  imageCharacter: "bull3dv1",
  imagePrefix: "bull_ep22",
  // 소재(비중 상한·균형·상자·조각)에 맞는 공간 3곳. 직전 편들(21편 속도 전시관·고속도로 카페·경사로 갤러리, 20편 칩 창고·감정실·상담 로비, 19편 야경 라운지·서버 복도·계단식 홀)과 겹치지 않는다. 배경에 글자·숫자·로고·화면 없음.
  sceneBackgrounds: Object.freeze({
    A: {
      label: "균형 조형물 홀(도입·핵심질문·정리·마무리)",
      image:
        "밝은 전시 홀. 황소특보 뒤로 큼직한 균형 저울 조형물 두 개(눈금·숫자·글자 없이 단색 접시와 굵은 막대 모양만), 매끈한 흰색 광택 바닥, 양옆에 큼직한 화분. 큰 빈 벽면 없이 조형물·식물로 채우고 사람은 없음. 화이트와 연한 민트 조명에 골드 포인트, 저폴리곤 단순화. 글자·숫자·눈금·로고·화면 없음.",
      videoStyle: "bright exhibition hall with two large plain balance-scale sculptures without any marks, numbers or text",
      videoStatics: "the two large plain balance-scale sculptures, the large potted plants, and the glossy white floor",
    },
    B: {
      label: "상자 물류 홀(삼성 매도·매수·장비주 설명)",
      image:
        "밝고 깨끗한 물류 홀. 황소특보 뒤로 아무 표시 없는 단색 상자들이 선반과 팔레트에 가지런히 쌓여 있고, 양옆에 큼직한 화분, 바닥은 연한 회색 광택 바닥. 상자에는 글자·라벨·바코드 없음. 큰 빈 벽면 없이 상자·선반·식물로 채우고 사람은 없음. 따뜻한 햇살 조명에 골드 포인트, 저폴리곤 단순화. 글자·숫자·간판·로고·화면 없음.",
      videoStyle: "bright clean logistics hall with neatly stacked plain unmarked single-color boxes on shelves and pallets",
      videoStatics: "the neatly stacked plain unmarked boxes on shelves and pallets, the large potted plants, and the light gray glossy floor",
    },
    C: {
      label: "조각 바닥 원형 홀(상한 개념·거래대금·확인할 것)",
      image:
        "밝은 원형 홀. 황소특보 뒤로 네 조각으로 나뉜 큼직한 단색 파이 모양 바닥 조형물(색만 다른 네 조각, 글자·숫자 없음)과 낮은 난간, 양옆에 큼직한 화분, 바닥은 연한 베이지 광택 바닥. 큰 빈 벽면 없이 조형물·난간·식물로 채우고 사람은 없음. 따뜻한 크림과 연한 금색 조명, 저폴리곤 단순화. 글자·숫자·간판·로고·화면 없음.",
      videoStyle: "bright round hall with a large plain four-piece pie-shaped floor sculpture in four different solid colors without any numbers or text",
      videoStatics: "the large plain four-piece pie-shaped floor sculpture, the low railings, the large potted plants, and the light beige glossy floor",
    },
  }),

  scenesTimeline:
    "s1 훅 / s2 오프닝(압축형) / s3 반도체 ETF 7개 순자산 / s4 삼성전자 비중 상한 초과 / s5 상한 개념(4분의 1) / s6 핵심질문(왜 8일, 옵션만기일) / s7 근거1 삼성전자 매도 / s8 하이닉스 매수 / s9 근거2 장비·기판 / s10 거래대금 대비 / s11 삼성전자 연결 / s12 잠정실적 겹침 / s13 균형(추산·되돌림) / s14 통찰 / s15 체크 / s16 프레임 / s17 예고+댓글",

  instagramCaptionHook: "삼성전자는 주가가 빠져야 팔릴까? 8일엔 비중이 너무 커서 억지로 팔리는 물량이 나와",
  instagramCaptionPoints: [
    "서울경제 보도(삼성증권 추산)로 반도체 ETF 7개의 순자산 합은 약 18조 9천억 원이고, 리밸런싱은 옵션만기일인 10월 8일에 몰려",
    "가장 큰 반도체 ETF는 삼성전자 비중이 26.98%라 종목당 상한 25%를 넘어, 약 2,098억 원어치를 줄여야 해",
    "반대로 SK하이닉스는 약 900억 원, 반도체 장비·기판 중소형주 네 곳은 각각 200억 원 안팎의 매수 수요가 생길 수 있고, 하루 평균 거래대금 대비 최대 27.5%야",
    "삼성전자 매물은 실적이 아니라 비중 규칙 때문에 나오는 거고, 3분기 잠정실적도 10월 8일로 예상되지만 공시 전이라 확정은 아니야",
    "장비주 중엔 최근 한 달 최대 37% 오른 곳도 있어서 리밸런싱이 끝난 뒤 되돌림도 가능해",
    "👉 8일 장 막판 삼성전자 거래가 얼마나 몰리는지, 며칠 뒤 주가가 원래 흐름을 찾는지 확인해봐",
    "※ 공개된 보도를 정리한 거고 특정 종목 추천이나 투자 권유가 아니야, 숫자는 증권사 추산이라 달라질 수 있어",
  ],
  instagramPriorityTags: ["삼성전자", "SK하이닉스", "반도체ETF", "리밸런싱", "옵션만기", "수급", "반도체", "삼성증권", "주식공부", "주식투자", "경제뉴스", "황소특보"],

  emphasisTerms: ["삼성전자", "8일", "규칙", "수급", "옵션만기일", "황소특보"],

  captionBoundaryExceptions: Object.freeze([]),
  // TTS가 문장 중간에서 0.2~0.3초 쉴 때 자막이 깜빡 꺼지지 않게 같은 씬 안 짧은 공백을 앞 자막으로 이어 붙인다(조립기 옵션, 황소 20편에서 도입).
  captionGapBridgeSec: 0.3,
  // 클로즈 샷 카드(s5 "4분의 1까지만"·s9 "각 200억 안팎")가 세로 65% 아래로 내려와 자막 윗줄이 둘째 줄을 덮었다(2026-10-06 QA 육안) → 두 씬 자막만 28px 내림(아래 끝 ≈1499px, QA 한계 1500px = 유튜브 제목 줄 1510 - 10).
  captionYShiftByScene: Object.freeze({ 5: 28, 9: 28 }),
  // 첫 3초 시각 변화 실험(CURRENT_STANDARDS A-7 2-2): 황소 22편 = impact(시작 순간 1.16배에서 당겨 맞춘 뒤 1.00→1.06 확대). 부엉 22편(파일 ep23)은 pushin.
  openingMotion: "impact",

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
      scene: 1, key: "s1_hook", role: "hook", video: "bull_ep22_s1_motion.mp4",
      narration: "다들, 삼성전자는 주가가 빠져야 팔린다고 생각했지? 근데 8일엔 비중이 너무 커서 억지로 팔리는 물량이 나와.",
      imageBrief: card2("삼성전자도", "억지로 팔린다", "놀라고 궁금한 표정으로"),
      overlays: [], shot: "medium", bg: "A",
      motion: cardMotion("wide-eyed and curious, eyebrows raised, as if revealing a surprising turn", "posing a surprising question to the viewer"),
    },
    {
      scene: 2, key: "s2_opening", role: "opening", video: "bull_ep22_s2_motion.mp4",
      narration: "안녕, 투자 소식 정리해주는 황소특보야. 핵심만 짚어줄게.",
      imageBrief: "황소가 정면을 보며 한 손으로 위를 가리키고 다른 손은 허리에 얹은 채 밝고 명랑하게 웃는 포즈, 소품 없음.",
      overlays: [], shot: "wide", bg: "A",
      motion: { type: "open", action: "the character keeps one hand raised with the index finger pointing upward in a confident, friendly gesture while the other hand rests on its hip, smiling brightly and warmly at the viewer.", mood: "warmly greeting the viewer" },
      riskDisclosure: true,
    },
    {
      scene: 3, key: "s3_situation_total", role: "background", video: "bull_ep22_s3_motion.mp4",
      narration: "숫자부터 보자. 반도체 ETF 일곱 개의 순자산은 합쳐서 18조 9천억 원쯤이야.",
      imageBrief: card2("반도체 ETF 7개", "순자산 약 18.9조", "진지하고 또렷하게 알리는 표정으로"),
      overlays: [], shot: "medium", bg: "A",
      motion: cardMotion("serious and clear with slight nods as if reporting a large total", "seriously reporting the total size"),
    },
    {
      scene: 4, key: "s4_situation_weight", role: "background", video: "bull_ep22_s4_motion.mp4",
      narration: "이 중 가장 큰 ETF는 삼성전자 비중이 26.98%라, 상한 25%를 넘어섰어.",
      imageBrief: card2("삼성전자 비중", "26.98% (상한 25%)", "차분하고 또렷하게 설명하는 표정으로"),
      overlays: [], shot: "medium", bg: "C",
      motion: cardMotion("calm and clear with slight nods", "calmly explaining the weight above the cap"),
    },
    {
      scene: 5, key: "s5_concept_cap", role: "background", video: "bull_ep22_s5_motion.mp4",
      narration: "한 종목이 포트폴리오의 4분의 1을 못 넘게 하는 규칙이야. 넘으면 정해진 날에 줄여서 다시 맞추지.",
      imageBrief: card2("한 종목은", "4분의 1까지만", "또렷하고 친절하게 설명하는 표정으로"),
      overlays: [], shot: "close", bg: "C",
      motion: cardMotion("clear and friendly with slight nods", "clearly explaining the cap rule"),
    },
    {
      scene: 6, key: "s6_core_q", role: "twist", video: "bull_ep22_s6_motion.mp4",
      narration: "그럼 왜 8일이 중요할까? 한마디로 8일은 옵션만기일이라 거래가 몰리는데, 비중 조정까지 그날 겹치거든.",
      imageBrief: card2("왜 8일일까?", "옵션만기일 겹침", "확신에 찬 표정으로"),
      overlays: [], shot: "medium", bg: "A",
      motion: cardMotion("confident and knowing with a slight nod", "confidently delivering the key answer"),
    },
    {
      scene: 7, key: "s7_evidence_samsung_sell", role: "evidence", video: "bull_ep22_s7_motion.mp4",
      narration: "첫째는 삼성전자야. 상한에 맞추려면 약 2,098억 원어치를 줄여야 해.",
      imageBrief: card2("삼성전자 매도", "약 2,098억 원", "또렷하고 친절하게 설명하는 표정으로"),
      overlays: [], shot: "medium", bg: "B",
      motion: cardMotion("clear and friendly with slight nods", "clearly giving the first reason"),
    },
    {
      scene: 8, key: "s8_evidence_hynix_buy", role: "evidence", video: "bull_ep22_s8_motion.mp4",
      narration: "반대로 SK하이닉스는 약 900억 원어치를 사야 한다고 삼성증권이 추산했어.",
      imageBrief: card2("SK하이닉스 매수", "약 900억 원 추산", "또렷하고 친절하게 설명하는 표정으로"),
      overlays: [], shot: "medium", bg: "A",
      motion: cardMotion("clear and friendly with slight nods", "clearly giving the opposite flow"),
    },
    {
      scene: 9, key: "s9_evidence_equipment", role: "evidence", video: "bull_ep22_s9_motion.mp4",
      narration: "둘째는 반도체 장비와 기판 쪽이야. 중소형주 네 곳에 각각 200억 원 안팎의 매수 수요가 생길 수 있대.",
      imageBrief: card2("장비·기판 4곳", "각 200억 안팎", "또렷하고 친절하게 설명하는 표정으로"),
      overlays: [], shot: "close", bg: "B",
      motion: cardMotion("clear and friendly with slight nods", "clearly giving the second reason"),
    },
    {
      scene: 10, key: "s10_evidence_volume", role: "evidence", video: "bull_ep22_s10_motion.mp4",
      narration: "하루 평균 거래대금 대비 최대 27.5%에 해당하는 규모라, 이 네 곳은 평소보다 크게 출렁일 수 있어.",
      imageBrief: card2("거래대금 대비", "최대 27.5%", "진지하고 또렷하게 알리는 표정으로"),
      overlays: [], shot: "medium", bg: "C",
      motion: cardMotion("serious and clear with slight nods", "seriously noting the size relative to volume"),
    },
    {
      scene: 11, key: "s11_link_samsung", role: "evidence", video: "bull_ep22_s11_motion.mp4",
      narration: "삼성전자는 주가가 나빠서가 아니라 비중이 커서 나오는 매물이야.",
      imageBrief: card2("주가 탓이 아닌", "비중 탓 매물", "확신에 찬 표정으로"),
      overlays: [], shot: "close", bg: "C",
      motion: cardMotion("confident and knowing with a slight nod", "confidently paying off the opening twist"),
    },
    {
      scene: 12, key: "s12_date_mixed", role: "counterpoint", video: "bull_ep22_s12_motion.mp4",
      narration: "잠정실적도 8일로 예상돼서 그날 움직임엔 실적과 수급이 섞일 수 있어. 다만 공시 전이라 확정은 아니지.",
      imageBrief: card2("잠정실적 8일 예상", "공시 전 미확정", "신중하고 단호한 표정으로"),
      overlays: [], shot: "medium", bg: "A",
      motion: cardMotion("careful and firm, eyebrows slightly furrowed, as if noting an unconfirmed date", "firmly noting the date is unconfirmed"),
    },
    {
      scene: 13, key: "s13_balance", role: "counterpoint", video: "bull_ep22_s13_motion.mp4",
      narration: "물론 조심할 것도 있어. 증권사 추산이고, 장비주 중엔 한 달 새 37% 오른 곳도 있어서 되돌림도 가능해.",
      imageBrief: "황소가 신중하고 걱정스러운 표정으로 한 손을 턱 근처에 대고 다른 손은 허리에 얹은 포즈, 소품 없음.",
      overlays: [], shot: "close", bg: "B",
      motion: { type: "open", action: "the character rests one hand near its chin with a careful, thoughtful expression and slight head tilts while the other hand rests on its hip", mood: "carefully noting a counter-signal" },
    },
    {
      scene: 14, key: "s14_insight", role: "insight", video: "bull_ep22_s14_motion.mp4",
      narration: "한 줄로 정리하면, 8일의 삼성전자 매물은 실적 신호가 아니라 규칙이 만든 수급이야.",
      imageBrief: card2("삼성전자 매물은", "규칙이 만든 수급", "확신에 찬 표정으로"),
      overlays: [], shot: "medium", bg: "C",
      motion: cardMotion("confident and knowing with slight nods", "confidently delivering the one-line summary"),
    },
    {
      scene: 15, key: "s15_check", role: "action", video: "bull_ep22_s15_motion.mp4",
      narration: "확인할 건 두 가지, 8일 장 막판 삼성전자 거래가 얼마나 몰리는지랑 며칠 뒤 주가가 원래 흐름을 찾는지를 봐야 해.",
      imageBrief: card2("① 8일 장 막판 거래", "② 며칠 뒤 주가 흐름", "친절하고 또렷하게 알려주는 표정으로"),
      overlays: [], shot: "medium", bg: "C",
      motion: cardMotion("clear and helpful with slight nods as if listing two things to check", "clearly listing two things to check"),
    },
    {
      scene: 16, key: "s16_frame", role: "frame", video: "bull_ep22_s16_motion.mp4",
      narration: "8일엔 주가가 움직여도 실적인지 수급인지부터 가려봐. 이유를 알아야 다음 신호가 읽혀. 이것만은 챙겨가.",
      imageBrief: card2("실적인지", "수급인지 먼저", "따뜻하고 차분한 미소로"),
      overlays: [], shot: "medium", bg: "A",
      motion: cardMotion("warm and calm with a gentle smile", "warmly reassuring the viewer"),
    },
    {
      scene: 17, key: "s17_cta", role: "save", video: "bull_ep22_s17_motion.mp4",
      narration: "삼성전자 잠정실적이 나오면 황소특보가 제일 먼저 들고 올게. 짚어줬으면 하는 이슈는 댓글로 남겨줘.",
      imageBrief: "황소가 밝은 미소로 한 손을 가볍게 흔들고 다른 손은 자연스럽게 내린 마무리 포즈, 소품 없이 빈 손.",
      overlays: [], shot: "wide", bg: "A",
      motion: { type: "open", action: "the character smiles brightly and waves one hand lightly in a friendly goodbye while the other hand hangs naturally relaxed", mood: "warmly saying goodbye and inviting comments" },
      riskDisclosure: true,
    },
  ]),
});

/** 장면 키로 스펙을 찾는다. */
export function findBullEp22Scene(key) {
  return BULL_EP22_ASSEMBLY_SPEC.scenes.find((s) => s.key === key) ?? null;
}
