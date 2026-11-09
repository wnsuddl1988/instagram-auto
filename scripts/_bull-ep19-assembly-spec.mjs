/**
 * 황소특보 19편 조립 스펙 — 16장면(S&P500 종목 80% 하락인데 지수는 사상 최고, AI에 쏠린 돈). 씬 구조 v3 + 성공 공식/엔딩 5박자.
 *
 * 번호: 16편 자사주, 17편 외국인 비반도체, 18편 상폐 규정 법원 제동에 이어 19편(파일 ep19). 게시 예정 2026-10-04(일) 저녁(Owner 지시).
 * 전달 메시지 한 줄: 지수 최고는 모두 올랐다는 뜻이 아니라 AI에 돈이 몰렸다는 신호일 수 있다 — 내 종목이 어느 쪽에 서 있는지 본다.
 * 담당: 황소특보(투자자 입장, 규칙 22). 레인 ⑦ 디커플링·수급 구조 · 영역 기타(미국 주식) · 유형 structure · 특보 근접도 중(월간 통계, 연휴 직후).
 *
 * ★ 소재 선정 경위(2026-10-03~04)★: `C:/tmp/bull-topic-scan-ep19/SCAN_CHECKLIST.md` 11단계 + 후보 36개 → Owner가 12개로 압축·슬롯 지정("19편 10/4 저녁, 20편 10/5 오전, 21편 10/5 저녁")
 * → Claude가 3건 제안 → Owner "3건 확정, 1번 진행해" → 대본 확정("3편 대본 확정, 19편부터 TTS 진행해", 2026-10-04).
 * 초안·팩트표·새 독자 읽기 점검(규칙 29): `_ai/bull-ep19-21-scripts-draft.md`(19편).
 *
 * ★ 핵심 팩트(2026-10-03 뉴시스, WSJ·애틀랜타 연은 인용 / 국민일보 10/3)★
 * - 9월 나스닥100 +3%, S&P500 구성 종목 약 80% 하락(평균 -5%), 11개 업종 중 기술주·커뮤니케이션서비스 2곳만 상승.
 * - 시가총액 상위 100개 중 41개 상승, 하위 100개 중 10개 상승. 미국 10년물 4.7%→5.3%(한 달), 저신용(CCC) 가산금리 9월 +1%p 이상.
 * - 10/2 美 9월 고용 +2.9만(예상 8.4만), 실업률 4.2%, 10월 동결 확률 77.9% → 금리 인상 우려 완화.
 * - 리스크 고지: 나레이션에 넣지 않고 오프닝(s2)·마지막(s16) 하단 자막바로만.
 *
 * TTS 실측: 16씬 121.08초, API 1/1, 순수 발화 최대 8.01초(s15), 정렬 밀림 최대 -0.26초(보정 불필요) — `C:/tmp/money-shorts-os/bull-ep19-tts/output-v1/`.
 */

const CARD_LAYOUT =
  "구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄, 카드에 그림·화살표 없이 글자만.";
const card2 = (l1, l2, expression) => `황소가 ${expression} '${l1}'와 '${l2}'가 두 줄로 크게 적힌 카드를 두 손으로 감싸 쥐고 보여주는 자세. ${CARD_LAYOUT}`;
const cardMotion = (action, mood) => ({ type: "card2", action: `the character's expression is ${action}; only the face and body move while the hands holding the card stay still.`, mood });

export const BULL_EP19_ASSEMBLY_SPEC = Object.freeze({
  specVersion: "bull_assembly_spec_v1",
  scriptStructureVersion: "bull_script_structure_v3",
  endingStructureVersion: "bull_ending_5beat_2026_09_29",
  episode: 19,
  sourceCandidate: "candidate-bull-ep19-sp500-80pct-down-ai-only-up-2026-10-04",
  title: "S&P500 종목 80%가 내렸는데 AI만 올랐다",
  channelName: "경제번역소",
  characterDisplayName: "황소특보",
  headerTitle: ["종목 80% 하락", "그래도 지수는", "사상 최고"],

  hookType: "T1",
  imageCharacter: "bull3dv1",
  imagePrefix: "bull_ep19",
  // 소재(미국 증시 쏠림·AI 투자·금리)에 맞는 공간 3곳. 직전 편들(18편 심판 홀·심사 사무실·열람 홀, 17편 백화점·물류 홀·공항, 16편 금고 로비·저울 광장·발표장 등)과 겹치지 않는다. 배경에 글자·숫자·로고·화면 없음.
  sceneBackgrounds: Object.freeze({
    A: {
      label: "야경 전망 라운지(도입·정리·마무리)",
      image:
        "밝은 야경 전망 라운지. 황소특보 뒤로 큰 통유리창 너머 보랏빛·남색 저녁 하늘과 불 켜진 고층 빌딩 실루엣(간판·글자 없음), 둥근 소파와 큼직한 화분, 바닥은 매끈한 짙은 보라빛 광택 바닥에 골드 라인. 큰 빈 벽면 없이 창·소파·식물로 채우고 사람은 없음. 따뜻한 앰버와 보랏빛 조명에 골드 포인트, 저폴리곤 단순화. 글자·숫자·간판·로고·화면 없음.",
      videoStyle: "bright night-view lounge with large windows showing a purple-blue evening sky and plain glowing skyscraper silhouettes",
      videoStatics: "the large windows with the plain skyline silhouettes, the round sofas, the large potted plants, and the glossy dark purple floor with gold lines",
    },
    B: {
      label: "데이터센터 서버 복도(AI 쏠림·금리 설명)",
      image:
        "밝은 데이터센터 서버 복도. 황소특보 뒤로 흰색 서버랙이 양옆으로 길게 늘어서고 파랑·청록 LED 불빛 줄만 은은히 빛남(라벨·글자·숫자 없음), 바닥은 매끈한 흰색 광택 바닥, 양옆에 큼직한 화분. 큰 빈 벽면 없이 서버랙·식물로 채우고 사람은 없음. 화이트와 연한 파랑 조명에 골드 포인트, 저폴리곤 단순화. 글자·숫자·로고·화면 없음.",
      videoStyle: "bright data center corridor with plain white server racks and soft blue-teal LED light strips",
      videoStatics: "the plain white server racks on both sides, the soft blue-teal LED light strips, the large potted plants, and the glossy white floor",
    },
    C: {
      label: "계단식 홀(금리·균형·확인할 것)",
      image:
        "탁 트인 계단식 홀. 황소특보 뒤로 완만한 원형 계단 조형물이 단계적으로 높아지며 이어지고(글자·숫자 없음), 양옆에 큼직한 화분, 바닥은 따뜻한 베이지 대리석에 골드 라인. 큰 빈 벽면 없이 계단·식물로 채우고 사람은 없음. 따뜻한 크림과 연한 금색 조명, 저폴리곤 단순화. 글자·숫자·간판·로고·화면 없음.",
      videoStyle: "open hall with a gentle stepped circular staircase sculpture rising in stages",
      videoStatics: "the stepped circular staircase sculpture, the large potted plants, and the beige marble floor with gold lines",
    },
  }),

  scenesTimeline:
    "s1 훅 / s2 오프닝(압축형) / s3 숫자(나스닥 +3% vs S&P500 종목 80% 하락) / s4 평균 -5%·업종 2곳 / s5 시총 상위 vs 하위 / s6 핵심질문 / s7 근거1 쏠림 / s8 근거2 금리 / s9 가산금리 / s10 한국 연결 / s11 균형(9월 통계·고용) / s12 균형(확산 미확인) / s13 통찰 / s14 체크 / s15 프레임 / s16 예고+댓글",

  instagramCaptionHook: "나스닥이 사상 최고면 대부분 종목이 올랐을까? 9월엔 S&P500 종목 열 중 여덟이 내렸어",
  instagramCaptionPoints: [
    "월스트리트저널 집계 기준 9월에 나스닥100은 3% 올랐지만 S&P500 구성 종목의 약 80%는 내렸고 평균 하락률은 5%였어",
    "11개 업종 중 오른 곳은 기술주와 통신 업종(커뮤니케이션서비스) 두 곳뿐이었고, 시가총액 상위 100개 중 41개가 올랐지만 하위 100개는 10개만 올랐어",
    "AI와 데이터센터 투자 수혜 종목에 돈이 쏠리는 사이, 미국 10년 국채금리는 한 달 새 4.7%에서 5.3%로 뛰었고 신용 낮은 기업의 가산금리도 9월에만 1%포인트 넘게 올랐어",
    "다만 이건 9월 한 달 통계고 10월 2일 고용이 부진하면서 금리 인상 우려는 줄었어, 쏠림이 이어질지 넓어질지는 아직 확인된 게 없어",
    "👉 오르는 종목이 AI 밖으로 넓어지는지, 미국 장기 국채금리가 내려오는지 확인해봐",
    "※ 공개된 통계를 정리한 거고 특정 종목 추천이나 투자 권유가 아니야, 수치는 정정될 수 있어",
  ],
  instagramPriorityTags: ["S&P500", "나스닥", "AI", "미국주식", "서학개미", "국채금리", "가산금리", "시장쏠림", "주식공부", "주식투자", "경제뉴스", "황소특보"],

  emphasisTerms: ["80%", "AI", "금리", "쏠림", "나스닥", "황소특보"],

  captionBoundaryExceptions: Object.freeze([]),

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
      scene: 1, key: "s1_hook", role: "hook", video: "bull_ep19_s1_motion.mp4",
      narration: "다들, 나스닥이 사상 최고면 미국 대표 종목 대부분이 올랐다고 생각했지? 근데 9월엔 열 중 여덟이 내렸어.",
      imageBrief: card2("나스닥 사상 최고", "열 중 여덟은 하락", "놀라고 궁금한 표정으로"),
      overlays: [], shot: "medium", bg: "A",
      motion: cardMotion("wide-eyed and curious, eyebrows raised, as if revealing a surprising turn", "posing a surprising question to the viewer"),
    },
    {
      scene: 2, key: "s2_opening", role: "opening", video: "bull_ep19_s2_motion.mp4",
      narration: "안녕, 투자 소식 정리해주는 황소특보야. 핵심만 짚어줄게.",
      imageBrief: "황소가 정면을 보며 한 손으로 위를 가리키고 다른 손은 허리에 얹은 채 밝고 명랑하게 웃는 포즈, 소품 없음.",
      overlays: [], shot: "wide", bg: "A",
      motion: { type: "open", action: "the character keeps one hand raised with the index finger pointing upward in a confident, friendly gesture while the other hand rests on its hip, smiling brightly and warmly at the viewer.", mood: "warmly greeting the viewer" },
      riskDisclosure: true,
    },
    {
      scene: 3, key: "s3_situation_index", role: "background", video: "bull_ep19_s3_motion.mp4",
      narration: "숫자부터 보자. 9월에 나스닥 대형주 지수는 3% 올랐는데, S&P500 종목은 약 80%가 내렸어.",
      imageBrief: card2("9월 나스닥 +3%", "종목 80% 하락", "진지하고 또렷하게 알리는 표정으로"),
      overlays: [], shot: "medium", bg: "A",
      motion: cardMotion("serious and clear with slight nods as if reporting two contrasting numbers", "seriously contrasting two numbers"),
    },
    {
      scene: 4, key: "s4_situation_sector", role: "background", video: "bull_ep19_s4_motion.mp4",
      narration: "평균 하락률은 5%였고, 11개 업종 중 오른 곳은 기술주와 통신 업종 두 곳뿐이었어.",
      imageBrief: card2("11개 업종 중", "오른 곳은 2곳뿐", "차분하고 또렷하게 설명하는 표정으로"),
      overlays: [], shot: "medium", bg: "B",
      motion: cardMotion("calm and clear with slight nods", "calmly explaining the sector numbers"),
    },
    {
      scene: 5, key: "s5_situation_breadth", role: "background", video: "bull_ep19_s5_motion.mp4",
      narration: "지수는 큰 종목이 끌어올렸어. 시가총액 상위 100개 중 41개가 올랐지만, 하위 100개는 10개만 올랐지.",
      imageBrief: card2("상위 41개 상승", "하위 10개 상승", "또렷하고 친절하게 설명하는 표정으로"),
      overlays: [], shot: "medium", bg: "B",
      motion: cardMotion("clear and friendly with slight nods as if explaining a gap", "clearly explaining the gap between big and small stocks"),
    },
    {
      scene: 6, key: "s6_core_q", role: "twist", video: "bull_ep19_s6_motion.mp4",
      narration: "그럼 왜 기술주 쪽만 올랐을까? 한마디로 AI에 돈이 쏠리고, 나머지는 금리와 유가에 눌렸어.",
      imageBrief: card2("돈은 AI로 쏠림", "나머지는 금리·유가", "확신에 찬 표정으로"),
      overlays: [], shot: "medium", bg: "C",
      motion: cardMotion("confident and knowing with a slight nod", "confidently delivering the key answer"),
    },
    {
      scene: 7, key: "s7_evidence_concentration", role: "evidence", video: "bull_ep19_s7_motion.mp4",
      narration: "첫째는 쏠림이야. 오른 종목 상당수가 데이터센터 투자가 늘수록 일감이 느는 AI 관련 기업이었지.",
      imageBrief: card2("첫째 쏠림", "AI·데이터센터 기업", "또렷하고 친절하게 설명하는 표정으로"),
      overlays: [], shot: "medium", bg: "C",
      motion: cardMotion("clear and friendly with slight nods", "clearly explaining the concentration"),
    },
    {
      scene: 8, key: "s8_evidence_rates", role: "evidence", video: "bull_ep19_s8_motion.mp4",
      narration: "둘째는 금리야. 미국 10년 국채금리가 한 달 사이 4.7%에서 5.3%로 뛰었어.",
      imageBrief: card2("10년 국채금리", "4.7%에서 5.3%", "진지하고 또렷하게 알리는 표정으로"),
      overlays: [], shot: "medium", bg: "A",
      motion: cardMotion("serious and clear with slight nods as if reporting a sharp rise", "seriously reporting the rate jump"),
    },
    {
      scene: 9, key: "s9_evidence_spread", role: "evidence", video: "bull_ep19_s9_motion.mp4",
      narration: "신용 낮은 회사가 더 내는 이자, 가산금리는 9월에만 1%포인트 넘게 올랐어. 빚 많은 회사엔 직격이지.",
      imageBrief: card2("신용 낮은 회사", "가산금리 1%p 상승", "신중하고 또렷하게 설명하는 표정으로"),
      overlays: [], shot: "medium", bg: "A",
      motion: cardMotion("careful and clear with slight nods", "carefully explaining who gets hit by higher rates"),
    },
    {
      scene: 10, key: "s10_link_korea", role: "evidence", video: "bull_ep19_s10_motion.mp4",
      narration: "우리 쪽에서 AI 투자 수혜를 받는 대표는 삼성전자와 SK하이닉스 같은 반도체주야.",
      imageBrief: "황소가 한 손을 가슴에 얹고 다른 손으로 옆을 가리키며 또렷하고 차분하게 설명하는 포즈, 소품 없음.",
      overlays: [], shot: "wide", bg: "A",
      motion: { type: "open", action: "the character gestures with one open hand to the side while the other hand rests on its chest, with a clear, calm explanatory expression", mood: "calmly connecting the story to the Korean market" },
    },
    {
      scene: 11, key: "s11_balance_data", role: "counterpoint", video: "bull_ep19_s11_motion.mp4",
      narration: "물론 조심할 것도 있어. 이건 9월 통계고, 10월 2일 고용이 부진해 금리 인상 우려는 줄었어.",
      imageBrief: card2("9월 한 달 통계", "10/2 고용 부진", "신중하고 단호한 표정으로"),
      overlays: [], shot: "medium", bg: "B",
      motion: cardMotion("careful and firm, eyebrows slightly furrowed, as if noting a caveat", "firmly noting the caveat"),
    },
    {
      scene: 12, key: "s12_balance_open", role: "counterpoint", video: "bull_ep19_s12_motion.mp4",
      narration: "금리 부담이 덜어지면 나머지 종목에도 숨통이 트일 수 있지만, 아직 확인된 건 없어.",
      imageBrief: "황소가 신중하고 걱정스러운 표정으로 한 손을 턱 근처에 대고 다른 손은 허리에 얹은 포즈, 소품 없음.",
      overlays: [], shot: "close", bg: "B",
      motion: { type: "open", action: "the character rests one hand near its chin with a careful, thoughtful expression and slight head tilts while the other hand rests on its hip", mood: "carefully noting what is still unconfirmed" },
    },
    {
      scene: 13, key: "s13_insight", role: "insight", video: "bull_ep19_s13_motion.mp4",
      narration: "한 줄로 정리하면, 지수 최고는 모두 올랐다는 뜻이 아니라 AI에 돈이 몰렸다는 신호일 수 있어.",
      imageBrief: card2("지수가 최고여도", "모두 오른 건 아님", "확신에 찬 표정으로"),
      overlays: [], shot: "medium", bg: "C",
      motion: cardMotion("confident and knowing with slight nods", "confidently delivering the one-line summary"),
    },
    {
      scene: 14, key: "s14_check", role: "action", video: "bull_ep19_s14_motion.mp4",
      narration: "확인할 건 두 가지, 오르는 종목이 AI 밖으로 넓어지는지랑 미국 장기 국채금리가 내려오는지야.",
      imageBrief: card2("① 종목 확산 여부", "② 장기 국채금리", "친절하고 또렷하게 알려주는 표정으로"),
      overlays: [], shot: "medium", bg: "C",
      motion: cardMotion("clear and helpful with slight nods as if listing two things to check", "clearly listing two things to check"),
    },
    {
      scene: 15, key: "s15_frame", role: "frame", video: "bull_ep19_s15_motion.mp4",
      narration: "지수만 보지 말고 내 종목이 어느 쪽에 서 있는지 봐야 해. 이유를 알아야 다음 신호가 읽혀. 이것만은 챙겨가.",
      imageBrief: card2("지수보다 중요한 것", "내 종목의 위치", "따뜻하고 차분한 미소로"),
      overlays: [], shot: "medium", bg: "A",
      motion: cardMotion("warm and calm with a gentle smile", "warmly reassuring the viewer"),
    },
    {
      scene: 16, key: "s16_cta", role: "save", video: "bull_ep19_s16_motion.mp4",
      narration: "다음 금리 소식이 나오면 황소특보가 제일 먼저 들고 올게. 짚어줬으면 하는 이슈는 댓글로 남겨줘.",
      imageBrief: "황소가 밝은 미소로 한 손을 가볍게 흔들고 다른 손은 자연스럽게 내린 마무리 포즈, 소품 없이 빈 손.",
      overlays: [], shot: "wide", bg: "A",
      motion: { type: "open", action: "the character smiles brightly and waves one hand lightly in a friendly goodbye while the other hand hangs naturally relaxed", mood: "warmly saying goodbye and inviting comments" },
      riskDisclosure: true,
    },
  ]),
});

/** 장면 키로 스펙을 찾는다. */
export function findBullEp19Scene(key) {
  return BULL_EP19_ASSEMBLY_SPEC.scenes.find((s) => s.key === key) ?? null;
}
