/**
 * 황소특보 17편 조립 스펙 — 16장면(외국인이 반도체를 팔면서도 끝까지 산 비반도체 종목들). 씬 구조 v3 + 성공 공식/엔딩 5박자 열 번째 적용본.
 *
 * 번호 주의: 소재 후보 2번(B)이 자사주 편(16편) 다음 순서라 17편(파일 ep17)이다. 배포 순서가 바뀌면 번호를 다시 받는다.
 * 전달 메시지 한 줄: 외국인 순매도 뉴스엔 판 것만 있는 게 아니라 끝까지 산 것도 같이 들어 있다 — 판 종목과 산 종목을 같이 봐야 다음 신호가 읽힌다.
 * 담당: 황소특보(투자자 입장, 규칙 22). 영역 수급 구조·소비재 · 레인 ⑦ 한미 디커플링·수급 구조 · 유형 structure · 특보 근접도 중(10/1~10/2 보도).
 *
 * ★ 소재 선정 경위(2026-10-03)★: `C:/tmp/bull-topic-scan-ep16/SCAN_CHECKLIST.md` 11단계 + 후보 25개 → Owner "1~3번 소재로 3개 편" → "2번 외국인편(B) 이어서"(2026-10-03).
 * Owner "종목 실명은 허용하고"(2026-10-03) → 한국경제 집계 사실 전달용으로 신세계·달바글로벌·KCC·셀트리온·에이피알·대한항공 실명(추천·목표가·매수 표현 없음, 법적 위험 확인은 Owner 몫).
 * 초안·팩트표·새 독자 읽기 점검(규칙 29, 2회): `_ai/bull-ep16-18-scripts-draft.md`(B).
 *
 * ★ 핵심 팩트(2026-10-02, 한국경제 10/1·10/2 원문 요약 ◐ + 복수 매체)★
 * - 올해 1~9월 외국인 9개월 연속 순매수 3곳(신세계·달바글로벌·KCC), 8개월 연속 12곳(셀트리온·에이피알·대한항공 등, 누적 1,000억 원 이상 기준), 8개월 이상 15개 종목 중 반도체 밸류체인 0.
 * - 달바글로벌 5,608억 원(시총의 25% 육박, 발행주식 23.8%), 신세계 6,291억 원(시총 3조 원대의 20%, 7월 폭락장 1,874억), 셀트리온 1조 7,093억 원(1~2월 1조 이상 집중·최근 약화), 에이피알 1조 1,676억 원, 대한항공 1조 836억 원(환율 1,300원대 하락 후 매수 강화).
 * - 화장품 수출 1~9월 111억 달러(+31.1%), 미국이 최대 시장(23.5억 달러, +40.6%) — 이투데이·전자신문·서울경제 10/2.
 * - 코스피200(삼성전자·SK하이닉스 제외) 2027년 영업이익 전망 3개월 +15.1%(311조→358조), 반도체 대형주 +5.5% — 서울경제 10/2.
 * - 리스크 고지: 나레이션에 넣지 않고 오프닝(s2)·마지막(s16) 하단 자막바로만.
 *
 * TTS 실측: 16씬 123.80초, API 1/1, 순수 발화 최대 8.66초, 정렬 밀림 없음(최대 -0.22초) — `C:/tmp/money-shorts-os/bull-ep17-tts/output-v1/`.
 */

const CARD_LAYOUT =
  "구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄, 카드에 그림·화살표 없이 글자만.";
const card2 = (l1, l2, expression) => `황소가 ${expression} '${l1}'와 '${l2}'가 두 줄로 크게 적힌 카드를 두 손으로 감싸 쥐고 보여주는 자세. ${CARD_LAYOUT}`;

export const BULL_EP17_ASSEMBLY_SPEC = Object.freeze({
  specVersion: "bull_assembly_spec_v1",
  scriptStructureVersion: "bull_script_structure_v3",
  endingStructureVersion: "bull_ending_5beat_2026_09_29",
  episode: 17,
  sourceCandidate: "candidate-bull-ep17-foreign-buyers-non-semiconductor-2026-10-03",
  title: "외국인은 팔기만 한 게 아니다, 끝까지 산 종목들",
  channelName: "경제번역소",
  characterDisplayName: "황소특보",
  headerTitle: ["외국인이 산", "반도체 아닌", "종목들"],

  // ── 이미지·영상 연출 필드(품질 체계 v2, 규칙 15) ──
  hookType: "T1",
  imageCharacter: "bull3dv1",
  imagePrefix: "bull_ep17",
  // 소재(소비재·화장품·항공)에 맞는 공간 3곳. 직전 편들(16편 금고 로비·저울 광장·발표장, 15편 자동차 쇼룸·충전 허브·공장 아트리움, 14편 데이터센터·클린룸 등)과 겹치지 않는다.
  // 배경에 글자·숫자·로고·라벨·화면·달력 없음.
  sceneBackgrounds: Object.freeze({
    A: {
      label: "소비재 백화점 아트리움(도입·상황·정리·마무리)",
      image:
        "밝고 화사한 백화점 중앙 아트리움. 황소특보 뒤로 둥근 에스컬레이터 난간과 파스텔 색 쇼핑백 진열 기둥 서너 개(쇼핑백은 단색, 로고·글자·숫자 없음), 양옆에 큼직한 화분과 둥근 벤치, 바닥은 매끈한 크림색 대리석과 둥근 러그. 큰 빈 벽면 없이 난간·진열 기둥·식물로 채운다. 따뜻한 크림·연분홍 조명에 골드 포인트, 저폴리곤 단순화. 글자·숫자·간판·로고·화면 없음.",
      videoStyle: "bright department-store atrium with plain pastel shopping bag display pillars",
      videoStatics: "the round escalator railings, the display pillars with plain single-color pastel shopping bags, the large potted plants, the round benches, and the glossy cream marble floor with a round rug",
    },
    B: {
      label: "화장품 수출 물류 홀(화장품 실적·종목 수급 설명)",
      image:
        "깔끔한 화장품 수출 물류 홀. 황소특보 뒤로 라벨 없는 흰색·파스텔 둥근 용기(병·단지)가 가득 진열된 높은 선반과 단색 골판지 상자 더미, 둥근 컨베이어 벨트 한 줄, 양옆에 큼직한 화분, 바닥은 매끈한 연한 민트 광택 바닥. 큰 빈 벽면 없이 선반·상자·컨베이어로 채우고 사람은 없음. 밝은 화이트·민트 조명에 골드 포인트, 저폴리곤 단순화. 용기에 라벨·글자·숫자·로고 없음, 상자에 글자·바코드 없음.",
      videoStyle: "clean cosmetics export logistics hall with plain unlabeled containers and plain boxes",
      videoStatics: "the tall shelves of plain unlabeled white and pastel round containers, the stacks of plain single-color cardboard boxes, the round conveyor belt, the large potted plants, and the glossy light mint floor",
    },
    C: {
      label: "공항 전망 라운지(항공·환율·균형 구간)",
      image:
        "탁 트인 공항 전망 라운지. 황소특보 뒤로 커다란 유리창 너머 활주로와 무늬 없는 흰색 여객기 한 대(동체에 로고·글자·숫자 없음), 둥근 소파와 낮은 화분 몇 개가 넓게 펼쳐지고, 바닥은 하얗고 매끈한 광택 바닥. 큰 빈 벽면 없이 유리창과 소파로 채우고 사람은 없음. 맑은 하늘색·화이트 조명에 골드 포인트, 저폴리곤 단순화. 글자·숫자·간판·로고·화면 없음.",
      videoStyle: "open airport view lounge with a plain unmarked white airplane outside the glass wall",
      videoStatics: "the large glass wall with the runway and a plain unmarked white airplane, the round sofas, the low potted plants, and the white glossy floor",
    },
  }),

  scenesTimeline:
    "s1 훅 / s2 오프닝(압축형) / s3 상황(9개월 연속 3곳) / s4 상황(8개월 12곳) / s5 상황(달바글로벌 5,600억) / s6 핵심질문 / s7 근거1 화장품 수출 / s8 근거2 항공·환율 / s9 코스피200 이익 전망 15% / s10 반도체 5.5%와 비교 / s11 균형(셀트리온 몰아 사고 약화) / s12 보장 없음·추정치 / s13 통찰 / s14 체크 / s15 프레임·이득 각인 / s16 당부+예고+댓글",

  instagramCaptionHook: "외국인은 팔기만 한 게 아니야, 9개월 내내 산 종목들이 있어",
  instagramCaptionPoints: [
    "한국경제 집계로 올해 1~9월 외국인이 9개월 연속 순매수한 종목은 신세계·달바글로벌·KCC 세 곳이고, 8개월 연속은 셀트리온·에이피알·대한항공 등 12곳이야, 8개월 이상 산 15개 종목 중 반도체 밸류체인은 없어",
    "달바글로벌은 약 5,600억 원을 사 모아 시가총액의 25%에 가깝고, 신세계는 약 6,291억 원을 샀는데 7월 폭락장에서도 1,874억 원을 샀어",
    "화장품은 1~9월 수출이 111억 달러로 31% 늘었고 미국이 가장 큰 시장이야, 대한항공은 환율이 1,300원대로 내려 비용 부담이 줄자 매수가 강해졌어",
    "삼성전자·SK하이닉스를 뺀 코스피200의 2027년 영업이익 전망은 석 달 새 15.1% 올랐고, 반도체 대형주의 상향 폭은 5.5%였어",
    "다만 꾸준히 샀어도 강도는 달라서 셀트리온은 1~2월에 1조 원 넘게 몰아 사고 최근엔 약해졌어, 이 전망도 내년 추정치라 실적으로 확인이 필요해",
    "👉 3분기 실적이 올라간 전망을 받쳐주는지, 환율이 움직여도 이익 전망이 버티는지 확인해봐",
    "※ 공개된 순매수 집계를 정리한 거고 특정 종목 추천이나 매수 권유가 아니야, 순매수는 과거 기록이라 앞으로를 보장하지 않아",
  ],
  instagramPriorityTags: [
    "외국인순매수",
    "신세계",
    "달바글로벌",
    "셀트리온",
    "대한항공",
    "화장품수출",
    "비반도체",
    "수급",
    "주식공부",
    "주식투자",
    "경제뉴스",
    "황소특보",
  ],

  emphasisTerms: ["외국인", "순매수", "비반도체", "실적", "환율", "황소특보"],

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
      scene: 1, key: "s1_hook", role: "hook", video: "bull_ep17_s1_motion.mp4",
      narration: "다들, 외국인은 한국 주식을 팔기만 했다고 생각했지? 근데 9개월 내내 산 종목들이 있어.",
      imageBrief: card2("9개월 내내 산", "종목들이 있다", "궁금하고 의미심장한 표정으로"),
      overlays: [], shot: "medium", bg: "A",
      motion: { type: "card2", action: "the character's expression is intrigued and knowing, eyebrows slightly raised, as if hinting at a twist; body and face move gently while the hands holding the card stay still.", mood: "posing an intriguing question to the viewer" },
    },
    {
      scene: 2, key: "s2_opening", role: "opening", video: "bull_ep17_s2_motion.mp4",
      narration: "안녕, 투자 소식 정리해주는 황소특보야. 핵심만 짚어줄게.",
      imageBrief: "황소가 정면을 보며 한 손으로 위를 가리키고 다른 손은 허리에 얹은 채 밝고 명랑하게 웃는 포즈, 소품 없음.",
      overlays: [], shot: "wide", bg: "A",
      motion: { type: "open", action: "the character keeps one hand raised with the index finger pointing upward in a confident, friendly gesture while the other hand rests on its hip, smiling brightly and warmly at the viewer.", mood: "warmly greeting the viewer" },
      riskDisclosure: true,
    },
    {
      scene: 3, key: "s3_situation_nine", role: "background", video: "bull_ep17_s3_motion.mp4",
      narration: "숫자부터 보자. 1월부터 9월까지 한 달도 안 빠지고 순매수한 곳은 신세계, 달바글로벌, KCC 세 곳이야.",
      imageBrief: card2("신세계·달바글로벌", "KCC, 9개월 연속", "또렷하고 밝게 설명하는 표정으로"),
      overlays: [], shot: "medium", bg: "A",
      motion: { type: "card2", action: "the character's expression is bright and informative with slight nods; only the face and body move while the hands holding the card stay still.", mood: "calmly presenting the three names" },
    },
    {
      scene: 4, key: "s4_situation_eight", role: "background", video: "bull_ep17_s4_motion.mp4",
      narration: "8개월 이어서 산 종목도 12곳인데, 셀트리온, 에이피알, 대한항공이 들어 있어.",
      imageBrief: card2("8개월 연속 12곳", "셀트리온·에이피알 등", "차분하고 또렷하게 설명하는 표정으로"),
      overlays: [], shot: "medium", bg: "A",
      motion: { type: "card2", action: "the character's expression is calm and clear with slight nods; only the face and body move while the hands holding the card stay still.", mood: "calmly presenting the second group" },
    },
    {
      scene: 5, key: "s5_situation_dalba", role: "background", video: "bull_ep17_s5_motion.mp4",
      narration: "달바글로벌은 그동안 5,600억 원을 사 모았어. 시가총액의 25%에 가까운 아주 큰 규모야.",
      imageBrief: card2("달바글로벌", "5,600억 순매수", "놀랍고 또렷하게 설명하는 표정으로"),
      overlays: [], shot: "medium", bg: "B",
      motion: { type: "card2", action: "the character's expression is surprised yet clear with slight nods; only the face and body move while the hands holding the card stay still.", mood: "clearly presenting the large amount" },
    },
    {
      scene: 6, key: "s6_core_q", role: "twist", video: "bull_ep17_s6_motion.mp4",
      narration: "그럼 외국인은 왜 이 종목들을 샀을까? 한마디로 반도체·AI와 무관하면서 실적이나 환율 같은 이유가 따로 있었어.",
      imageBrief: "황소가 갸웃하다 확신에 찬 표정으로 한 손을 들어 손짓하며 설명하는 포즈, 다른 손은 허리에 얹음, 소품 없음.",
      overlays: [], shot: "wide", bg: "B",
      motion: { type: "open", action: "the character's expression starts curious with a slight head tilt and turns confident while one hand lifts in an explaining gesture and the other rests on its hip", mood: "confidently giving the key answer" },
    },
    {
      scene: 7, key: "s7_evidence_cosmetics", role: "evidence", video: "bull_ep17_s7_motion.mp4",
      narration: "첫째는 화장품이야. 9월까지 화장품 수출은 111억 달러로 31% 늘었고, 미국이 가장 큰 시장이야.",
      imageBrief: card2("화장품 수출", "111억 달러 +31%", "밝고 뿌듯한 표정으로"),
      overlays: [], shot: "medium", bg: "B",
      motion: { type: "card2", action: "the character's expression is bright and proud with slight nods; only the face and body move while the hands holding the card stay still.", mood: "brightly presenting the export growth" },
    },
    {
      scene: 8, key: "s8_evidence_airline", role: "evidence", video: "bull_ep17_s8_motion.mp4",
      narration: "둘째는 항공이야. 환율이 1,300원대로 내려와 비용 부담이 줄자 대한항공 매수가 강해졌어.",
      imageBrief: card2("환율 1,300원대", "항공주 매수 강화", "또렷하고 설명하는 표정으로"),
      overlays: [], shot: "medium", bg: "C",
      motion: { type: "card2", action: "the character's expression is clear and explanatory with slight nods; only the face and body move while the hands holding the card stay still.", mood: "clearly explaining the exchange-rate effect" },
    },
    {
      scene: 9, key: "s9_evidence_kospi200", role: "evidence", video: "bull_ep17_s9_motion.mp4",
      narration: "이 종목들만의 얘기가 아니야. 반도체 대형주를 뺀 코스피200의 내년 이익 전망도 석 달 새 15% 올랐어.",
      imageBrief: card2("코스피200 내년 이익", "전망 15% 상향", "또렷하고 밝게 설명하는 표정으로"),
      overlays: [], shot: "medium", bg: "C",
      motion: { type: "card2", action: "the character's expression is bright and informative with slight nods; only the face and body move while the hands holding the card stay still.", mood: "brightly presenting the broader outlook" },
    },
    {
      scene: 10, key: "s10_evidence_ratio", role: "evidence", video: "bull_ep17_s10_motion.mp4",
      narration: "반도체 대형주의 상향 폭은 5.5%라서, 비반도체가 약 3배 더 많이 올라갔어.",
      imageBrief: "황소가 양손을 좌우로 펼쳐 두 쪽을 견주듯 보여주며 또렷하고 차분하게 설명하는 포즈, 소품 없음.",
      overlays: [], shot: "wide", bg: "C",
      motion: { type: "open", action: "the character spreads both hands outward to either side as if weighing two sides, with a calm and clear explanatory expression", mood: "calmly comparing the two groups" },
    },
    {
      scene: 11, key: "s11_balance", role: "counterpoint", video: "bull_ep17_s11_motion.mp4",
      narration: "물론 조심할 것도 있어. 꾸준히 샀어도 강도는 달라서, 셀트리온은 1~2월에 몰아 사고 최근엔 약해졌어.",
      imageBrief: "황소가 신중하고 걱정스러운 표정으로 한 손을 턱 근처에 대고 다른 손은 허리에 얹은 포즈, 소품 없음.",
      overlays: [], shot: "close", bg: "C",
      motion: { type: "open", action: "the character rests one hand near its chin with a careful, thoughtful expression and slight head tilts while the other hand rests on its hip", mood: "carefully noting the caveat" },
    },
    {
      scene: 12, key: "s12_balance_caveat", role: "counterpoint", video: "bull_ep17_s12_motion.mp4",
      narration: "그래서 오래 샀다고 앞으로도 산다는 보장은 없고, 이 전망도 내년 추정치라 실적으로 확인이 필요해.",
      imageBrief: card2("보장은 없다", "실적으로 확인", "신중하고 또렷하게 설명하는 표정으로"),
      overlays: [], shot: "medium", bg: "C",
      motion: { type: "card2", action: "the character's expression is careful and clear with slight nods; only the face and body move while the hands holding the card stay still.", mood: "carefully noting there is no guarantee" },
    },
    {
      scene: 13, key: "s13_insight", role: "insight", video: "bull_ep17_s13_motion.mp4",
      narration: "한 줄로 정리하면, 외국인 순매도 뉴스엔 판 것만 있는 게 아니라 끝까지 산 것도 같이 들어 있어.",
      imageBrief: card2("판 것만이 아니라", "끝까지 산 것도", "확신에 찬 표정으로"),
      overlays: [], shot: "medium", bg: "A",
      motion: { type: "card2", action: "the character's expression is confident and knowing with slight nods; only the face and body move while the hands holding the card stay still.", mood: "confidently delivering the one-line summary" },
    },
    {
      scene: 14, key: "s14_check", role: "action", video: "bull_ep17_s14_motion.mp4",
      narration: "확인할 건 두 가지, 3분기 실적이 올라간 전망을 받쳐주는지랑 환율이 움직여도 이익 전망이 버티는지 보면 돼.",
      imageBrief: card2("① 3분기 실적", "② 환율에도 버팀", "친절하고 또렷하게 알려주는 표정으로"),
      overlays: [], shot: "medium", bg: "A",
      motion: { type: "card2", action: "the character's expression is clear and helpful with slight nods as if listing two things to check; only the face and body move while the hands holding the card stay still.", mood: "clearly listing two things to check" },
    },
    {
      scene: 15, key: "s15_frame", role: "frame", video: "bull_ep17_s15_motion.mp4",
      narration: "외국인 매매는 판 종목과 산 종목을 같이 봐야 해. 이유를 알아야 다음 신호가 읽혀. 이것만은 챙겨가.",
      imageBrief: card2("판 종목, 산 종목", "같이 봐야 해", "따뜻하고 차분한 미소로"),
      overlays: [], shot: "medium", bg: "B",
      motion: { type: "card2", action: "the character's expression is warm and calm with a gentle smile; only the face and body move while the hands holding the card stay still.", mood: "warmly reassuring the viewer" },
    },
    {
      scene: 16, key: "s16_cta", role: "save", video: "bull_ep17_s16_motion.mp4",
      narration: "실적이 나오면 황소특보가 제일 먼저 들고 올게. 짚어줬으면 하는 이슈는 댓글로 남겨줘.",
      imageBrief: "황소가 밝은 미소로 한 손을 가볍게 흔들고 다른 손은 자연스럽게 내린 마무리 포즈, 소품 없이 빈 손.",
      overlays: [], shot: "wide", bg: "A",
      motion: { type: "open", action: "the character smiles brightly and waves one hand lightly in a friendly goodbye while the other hand hangs naturally relaxed", mood: "warmly saying goodbye and inviting comments" },
      riskDisclosure: true,
    },
  ]),
});

/** 장면 키로 스펙을 찾는다. */
export function findBullEp17Scene(key) {
  return BULL_EP17_ASSEMBLY_SPEC.scenes.find((s) => s.key === key) ?? null;
}
