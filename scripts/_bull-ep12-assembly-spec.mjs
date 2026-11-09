/**
 * 황소특보 12편 조립 스펙 — 16장면. 씬 구조 v3 + 성공 공식/엔딩 5박자 다섯 번째 적용본(품질 체계 v2 두 번째 황소편).
 *
 * 전달 메시지 한 줄: 금리가 뛰어도 개인 돈은 대기 자금(단기국채 ETF = 주차장)에서 나와 AI·빅테크 쪽으로 움직였다 — 돈이 몰린 곳을 쫓지 말고 왜 몰렸는지를 알아야 흐름이 꺾일 때 신호가 읽힌다.
 * 담당: 황소특보(투자자 입장, 규칙 22). 영역 other(미국 주식) · 레인 ⑦ 디커플링·수급 · 유형 구조 · 특보 근접도 상 · 같은 소재 중복 없음. 반도체 주제 아님(반전 포인트: 1위가 반도체가 아님).
 *
 * ★ 소재 선정 경위(2026-10-01)★: 규칙 25 오케스트레이터 10단계 전부(성과 2단계 추가 실행) + 후보 12개 중 Owner "1번". 처음 1순위였던 마이크론은 9편(9/29)과 같은 소재라 Owner 지적으로 제외, 금리 5.3% 해설은
 * 성과 데이터(매크로 해설 이탈)와 투자자 직결 약함으로 4위로 내림. 소재 선정 전 전 편 소재 선정 경위를 읽고 같은 소재 중복 없음 확인.
 *
 * ★ 핵심 팩트(2026-10-01 기사 원문 열람, 전자신문·시사저널)★
 * - 집계: 한국예탁결제원 세이브로, 결제일 기준 추석 연휴였던 9월 24~25일(이틀치), 조회일 9/28~29.
 * - 순매수 1~5위: 메타 3,819만 달러(약 517억 원) · 샌디스크 3,531만 달러(약 478억 원) · KORU(Direxion 한국 주식 3배 ETF) 2,379만 달러(약 322억 원) · 알파벳 1,988만 달러(약 269억 원) · 오라클 1,754만 달러(약 238억 원).
 * - 순매도 1위: SGOV(iShares 0-3개월 미국 단기국채 ETF, 파킹형) 668만 달러(약 91억 원).
 * - 기사 설명: 미국 국채금리 급등·국제유가 상승 속에서도 AI·반도체 관련 매수세 지속, 빅테크 자금 유입 강도 7월 이후 최강.
 * - KORU: 미국 상장(NYSE Arca), MSCI Korea 25/50 지수 하루 수익률 300% 추종, 삼성전자 비중 큼(WebSearch). 레버리지는 하루 기준이라 오래 들면 배수 어긋남(뉴스웨이).
 * - 제외: "빅테크 자금 유입 강도 10.13%"(정의 불명), 전체 순매수 총액(기사에 없음), 지난해 1.76조 원 비교(기간 불일치).
 * 종목 실명: Owner 2026-10-01 "종목 다 적어" — 공식 집계 사실만, 추천·전망 문구 없음. KORU는 영문 표기(읽기는 "코루").
 * 10번 연결 고리("대기하던 돈이 움직였을 수도 있어")는 기자 해석을 조건형으로 옮긴 것 — 같은 돈이라는 증거 없음.
 *
 * 개념 표기: 파킹형 ETF = 투자처를 정하기 전에 돈을 잠시 세워 두는 주차장 같은 상품. 리스크 고지: 나레이션에 넣지 않고 오프닝(s2)·마지막(s16) 하단 자막바로만.
 *
 * TTS 실측(2026-10-01, output-v1, API 1회): 16씬 타임라인 116.04초. 씬별 raw: s1 5.93, s2 5.05, s3 7.33, s4 7.57, s5 6.17, s6 6.66, s7 6.42, s8 6.11, s9 5.64, s10 6.34, s11 6.9, s12 7.86, s13 4.98, s14 6.61, s15 4.9, s16 6.85
 */

// 카드(두 손으로 감싼 납작한 가로형) / 보드(긴 다리 이젤) 구도 문구 — 황소 11편 스펙과 동일(규칙 15, A-4 ④).
const CARD_LAYOUT =
  "구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄, 카드에 그림·화살표 없이 글자만.";
const BOARD_LAYOUT =
  "구도(반드시, 11편 사고 재발 방지 — 황소+보드 묶음 폭 ≤76%): 황소는 이미지 왼쪽(가로 10~36%)에 서고, 보드는 황소 바로 오른쪽에 붙여 작고 아담하게 세운다 — 보드 전체가 이미지 가로 40%~72% 사이에만 들어오고 폭은 32% 이하, 높이는 세로의 24% 이하로 황소 키보다 훨씬 낮게. 보드 오른쪽 끝은 절대 가로 76%를 넘지 않고, 보드 오른쪽 끝과 화면 오른쪽 가장자리 사이에 바닥과 배경이 넉넉히(가로 24% 이상) 보여야 하며 보드가 잘리거나 가장자리에 닿으면 실패. 보드에는 지정한 굵은 큰 글자 줄만 넣고 그래프·표·작은 라벨은 넣지 않는다. 글자는 세로 28~58% 안. 보드는 이젤 위에 높게 올려 황소 어깨~머리 높이에 오게 한다(보드 윗변 세로 30% 근처, 아랫변 세로 55% 이내).";
const WIDE_BOARD_NOTE =
  "(와이드 샷이어도 보드는 크게 — 보드 프레임 전체가 이미지 가로 45%~83% 사이에 들어와야 하고 오른쪽 끝은 절대 83%를 넘지 않는다. 황소는 이미지 왼쪽 15~42%에 서서 보드 쪽을 가리킨다. 보드 오른쪽에 배경 여백을 남길 것) ";
const card2 = (l1, l2, expression) => `황소가 ${expression} '${l1}'와 '${l2}'가 두 줄로 크게 적힌 카드를 두 손으로 감싸 쥐고 보여주는 자세. ${CARD_LAYOUT}`;
const board = (lines, pose, wide = false) =>
  `황소 옆 긴 다리 이젤(바닥에 고정) 위에 올려 세운 보드에 ${lines.map((l) => `'${l}'`).join(", ")}가 ${lines.length === 2 ? "두" : "세"} 줄로 크게 적혀 있고, 황소가 ${pose}. ${wide ? WIDE_BOARD_NOTE : ""}${BOARD_LAYOUT}`;

export const BULL_EP12_ASSEMBLY_SPEC = Object.freeze({
  specVersion: "bull_assembly_spec_v1",
  scriptStructureVersion: "bull_script_structure_v3",
  endingStructureVersion: "bull_ending_5beat_2026_09_29",
  episode: 12,
  sourceCandidate: "candidate-bull-ep12-seohak-us-stock-flows-2026-09-24",
  title: "금리가 뛰는데도 서학개미가 제일 많이 산 건 반도체가 아니었다",
  channelName: "경제번역소",
  characterDisplayName: "황소특보",
  // 2026-10-02: Owner는 원래 제목("서학개미가 쓸어 담은 곳 / 1위는 반도체가 아니었다")을 선호 — 문구는 그대로 두고 3줄로 나눠 크기 확보.
  // (2줄이면 줄당 12자라 폭 864px에 맞춰 77~79px로 줄어든다. 3줄이면 102~108px.)
  headerTitle: ["서학개미가", "쓸어 담은 곳 1위는", "반도체가 아니었다"],

  // ── 이미지·영상 연출 필드(품질 체계 v2, 규칙 15) ──
  hookType: "T1",
  imageCharacter: "bull3dv1",
  imagePrefix: "bull_ep12",
  // 소재(미국 주식 자금 흐름·파킹형 ETF=주차장)에 맞는 공간 3곳. 직전 편(조선소 전망 데크·수주 상황실·항만 사무실)과 겹치지 않는다. 배경에 글자·숫자·로고·랜드마크 없음.
  sceneBackgrounds: Object.freeze({
    A: {
      label: "야경 전망 투자 라운지(도입·요약·마무리)",
      image:
        "밤의 도시 야경이 내려다보이는 넓은 투자 라운지. 황소특보 뒤로 큼직한 곡면 통유리창(창밖에 매끈한 저폴리곤 도시 야경, 특정 건물·랜드마크·글자 없음)이 넓게 펼쳐지고, 앞쪽에 낮은 원목 탁자 하나와 둥근 안락의자 몇 개, 양옆에 큼직한 화분, 바닥은 따뜻한 원목 마루. 큰 빈 벽면 없이 유리창과 화분으로 채운다. 따뜻한 골드·네이비 조명. 글자가 적힌 간판·포스터·화면 없음.",
      videoStyle: "warm night-view investment lounge",
      videoStatics: "the large curved glass window with the low-poly night city skyline, the low wooden table, the round armchairs, the large potted plants, and the warm wooden floor",
    },
    B: {
      label: "자금 흐름 상황실(순위·집계·근거)",
      image:
        "글로벌 자금 흐름 상황실. 황소특보 뒤로 천장까지 닿는 큼직한 곡면 스크린 벽(굵은 곡선 화살표 흐름과 작은 동그라미 점들만 은은하게 흐르는 단순화된 저폴리곤 그래픽, 글자·숫자·지도·세계지도 대륙 윤곽·지구본·건물 없음 — 화살표와 동그라미 점만, 배경은 단색 네이비 그라데이션)이 넓게 펼쳐지고, 앞쪽에 둥근 회의 테이블 하나와 의자 몇 개, 바닥은 매끈한 광택 바닥. 은은한 네이비·민트 조명. 글자가 적힌 표지판·서류·화면 없음.",
      videoStyle: "global money-flow situation room",
      videoStatics: "the large curved screen wall with bold curved flow arrows and small round dots, the round meeting table, the chairs, and the glossy floor",
    },
    C: {
      label: "주차장 전망 로비(파킹형 ETF 개념·연결 고리·순매도)",
      image:
        "통유리 너머로 깨끗한 실내 주차장이 내려다보이는 밝은 로비. 황소특보 뒤로 큼직한 통창(창밖에 빈 주차 칸이 많고 매끈한 저폴리곤 자동차 몇 대가 세워진 주차장, 번호판·글자·표지 없음)이 넓게 펼쳐지고, 양옆에 둥근 화분과 낮은 벤치, 한쪽에 둥근 러그, 바닥은 밝은 광택 바닥. 큰 빈 벽면 없이 통창과 화분으로 채운다. 따뜻한 크림·스카이블루 조명. 글자가 적힌 표지판·포스터·간판 없음.",
      videoStyle: "bright lobby overlooking a clean parking lot",
      videoStatics: "the large window with the low-poly parking lot and a few parked cars, the round potted plants, the low benches, the round rug, and the glossy floor",
    },
  }),

  scenesTimeline:
    "s1 훅 / s2 오프닝 / s3 상황(1위) / s4 상황(2·3위) / s5 상황(4·5위) / s6 핵심질문 / s7 반대편(순매도) / s8 개념(파킹형) / s9 연결 고리 / s10 근거1 쏠림 / s11 근거2 한국 증시 / s12 균형 / s13 통찰 / s14 체크 / s15 이득 각인 / s16 당부+예고+댓글",

  instagramCaptionHook: "금리가 뛰는데도 서학개미가 미국에서 제일 많이 산 건 반도체가 아니었어",
  instagramCaptionPoints: [
    "예탁결제원 집계로 추석 연휴였던 9월 24~25일(결제일 기준, 이틀치) 서학개미 미국주식 순매수 1위는 메타, 약 517억 원이야",
    "2위는 샌디스크 약 478억 원, 3위는 한국 주식 3배 ETF KORU 약 322억 원, 그다음은 알파벳 약 269억 원, 오라클 약 238억 원이야",
    "반대로 제일 많이 순매도된 건 미국 단기국채 ETF SGOV 약 91억 원이야, 투자처를 정하기 전에 돈을 잠시 세워 두는 '파킹형' 상품이야",
    "주차장에 세워 둔 돈이 줄고 기술주 매수가 늘었으니 대기하던 돈이 움직였을 수도 있어(집계로 같은 돈인지는 알 수 없어)",
    "기사는 미국 국채금리와 국제유가가 오르는 가운데서도 AI 기대가 이어졌다고 봐",
    "KORU는 한국 주식 하루 수익률을 세 배로 따라가는 미국 상장 ETF야, 레버리지는 오래 들면 배수가 어긋날 수 있어",
    "👉 다음 집계에서도 쏠림이 이어지는지, 내가 든 종목이 그 쏠림 안에 있는지 확인해봐",
    "※ 공식 집계 사실만 전달한 거고 종목 추천이나 투자 권유가 아니야",
  ],
  instagramPriorityTags: [
    "서학개미",
    "미국주식",
    "예탁결제원",
    "미국빅테크",
    "파킹형ETF",
    "레버리지ETF",
    "국채금리",
    "주식공부",
    "주식투자",
    "경제뉴스",
    "황소특보",
  ],

  emphasisTerms: ["서학개미", "반도체", "파킹형", "KORU", "황소특보"],

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
      video: "bull_ep12_s1_motion.mp4",
      narration: "다들, 금리가 뛰는데도 서학개미가 미국에서 제일 많이 산 건 반도체가 아니었어. 뭐였을까?",
      imageBrief: card2("서학개미 1위", "반도체 아님", "놀라고 궁금하다는 표정으로"),
      overlays: [],
      shot: "medium",
      bg: "A",
      motion: { type: "card2", action: "the character's expression is wide-eyed and puzzled, eyebrows raised, as if asking the viewer what the top pick really was; body and face move gently while the hands holding the card stay still.", mood: "posing an intriguing question to the viewer" },
    },
    {
      scene: 2,
      key: "s2_opening",
      role: "opening",
      video: "bull_ep12_s2_motion.mp4",
      narration: "안녕, 투자 소식을 쉽고 빠르게 정리해주는 황소특보야. 핵심만 짚어줄게, 끝까지 들어봐.",
      imageBrief: "황소가 정면을 보며 한 손으로 위를 가리키고 다른 손은 허리에 얹은 채 밝고 명랑하게 웃는 포즈, 소품 없음.",
      overlays: [],
      shot: "wide",
      bg: "A",
      motion: { type: "open", action: "the character keeps one hand raised with the index finger pointing upward in a confident, friendly gesture while the other hand rests on its hip, smiling brightly and warmly at the viewer.", mood: "warmly greeting the viewer" },
      riskDisclosure: true,
    },
    {
      scene: 3,
      key: "s3_situation_top1",
      role: "background",
      video: "bull_ep12_s3_motion.mp4",
      narration: "먼저 숫자부터 보자. 예탁결제원 집계로 연휴 이틀간 순매수 1위는 SNS 빅테크 메타, 517억 원이야.",
      imageBrief: board(["순매수 1위", "메타", "517억 원"], "빈 손으로 보드를 가리키며 설명하는 자세"),
      overlays: [],
      shot: "medium",
      bg: "B",
      motion: { type: "board", action: "the character's free hand points toward the board without touching it, with a bright, informative expression, while the other hand rests near its hip.", mood: "calmly presenting the top figure" },
    },
    {
      scene: 4,
      key: "s4_situation_2_3",
      role: "background",
      video: "bull_ep12_s4_motion.mp4",
      narration: "2위는 낸드 업체 샌디스크 478억 원, 3위는 한국 3배 ETF KORU 322억 원이었어.",
      imageBrief: board(["2위 샌디스크", "3위 KORU"], "빈 손으로 보드를 가리키며 설명하는 자세", true),
      overlays: [],
      shot: "wide",
      bg: "B",
      motion: { type: "board", action: "the character's free hand points to the board lines one after another from top to bottom without touching it, explaining with a bright, clear expression, while the other hand rests near its hip.", mood: "clearly explaining the next two ranks" },
    },
    {
      scene: 5,
      key: "s5_situation_4_5",
      role: "background",
      video: "bull_ep12_s5_motion.mp4",
      narration: "그다음은 구글 모회사 알파벳 269억 원, 클라우드 기업 오라클 238억 원 순이지.",
      imageBrief: card2("4위 알파벳", "5위 오라클", "밝고 또렷한 표정으로"),
      overlays: [],
      shot: "medium",
      bg: "B",
      motion: { type: "card2", action: "the character's expression is bright and clear with slight nods; only the face and body move while the hands holding the card stay still.", mood: "briskly finishing the ranking" },
    },
    {
      scene: 6,
      key: "s6_core_q",
      role: "twist",
      video: "bull_ep12_s6_motion.mp4",
      narration: "그럼 금리 부담이 큰데 왜 이쪽으로 몰렸을까? 한마디로 기사는 AI 기대가 그 부담을 앞섰다고 봐.",
      imageBrief: card2("금리 부담보다", "AI 기대", "갸웃하다 확신에 찬 표정으로"),
      overlays: [],
      shot: "medium",
      bg: "B",
      motion: { type: "card2", action: "the character's expression starts curious with a slight head tilt and turns confident and knowing; only the face and body move while the hands holding the card stay still.", mood: "confidently delivering the key answer" },
    },
    {
      scene: 7,
      key: "s7_sell_top1",
      role: "background",
      video: "bull_ep12_s7_motion.mp4",
      narration: "반대로 제일 많이 팔린 건 미국 단기국채 ETF SGOV로, 91억 원어치가 순매도됐어.",
      imageBrief: board(["순매도 1위", "SGOV", "91억 원"], "빈 손으로 보드를 가리키며 진지하게 설명하는 자세"),
      overlays: [],
      shot: "medium",
      bg: "C",
      motion: { type: "board", action: "the character's free hand points toward the board lines without touching it, with a serious, engaged expression, while the other hand rests near its hip.", mood: "seriously presenting the most sold product" },
    },
    {
      scene: 8,
      key: "s8_concept_parking",
      role: "background",
      video: "bull_ep12_s8_motion.mp4",
      narration: "이건 투자처를 정하기 전에 돈을 잠시 세워 두는 주차장 같은 상품이라서 파킹형 ETF라고 불러.",
      imageBrief: "황소가 한 손으로 뒤쪽 통창 너머 주차장을 가리키며 밝고 친근하게 설명하고 다른 손은 허리에 얹은 포즈, 소품 없음.",
      overlays: [],
      shot: "wide",
      bg: "C",
      motion: { type: "open", action: "the character gestures with one hand toward the large window and the parking lot behind it, as if comparing the product to a parking lot, with a bright, friendly explanatory expression while the other hand rests on its hip; no props are held.", mood: "friendly explaining a parking metaphor" },
    },
    {
      scene: 9,
      key: "s9_link",
      role: "insight",
      video: "bull_ep12_s9_motion.mp4",
      narration: "주차장에 세워 둔 돈이 줄고 기술주 매수가 늘었으니, 대기하던 돈이 움직였을 수도 있어.",
      imageBrief: card2("주차장 돈 줄고", "기술주 늘고", "확신에 찬 표정으로"),
      overlays: [],
      shot: "medium",
      bg: "C",
      motion: { type: "card2", action: "the character's expression is confident and thoughtful with slight nods; only the face and body move while the hands holding the card stay still.", mood: "thoughtfully connecting the two flows" },
    },
    {
      scene: 10,
      key: "s10_evidence1",
      role: "evidence",
      video: "bull_ep12_s10_motion.mp4",
      narration: "첫째는 쏠림이야. 상위 다섯 곳 중 네 곳이 빅테크와 AI 쪽이라서, 돈이 한쪽으로 몰린 셈이지.",
      imageBrief: board(["쏠림", "5곳 중", "4곳 기술주"], "빈 손으로 보드를 가리키며 설명하는 자세"),
      overlays: [],
      shot: "medium",
      bg: "B",
      motion: { type: "board", action: "the character's free hand points toward the board lines without touching it, with a clear, informative expression, while the other hand rests near its hip.", mood: "clearly explaining the concentration" },
    },
    {
      scene: 11,
      key: "s11_evidence2",
      role: "evidence",
      video: "bull_ep12_s11_motion.mp4",
      narration: "둘째는 한국 증시야. KORU는 한국 주식 하루 수익률을 세 배로 따라가니, 미국에서 한국에 베팅한 돈이야.",
      imageBrief: board(["KORU", "한국 3배", "미국 베팅"], "빈 손으로 손가락을 펴 보이며 진지하게 설명하는 자세"),
      overlays: [],
      shot: "medium",
      bg: "B",
      motion: { type: "board", action: "the character's free hand points toward the board lines without touching it, with a serious, engaged expression, while the other hand rests near its hip.", mood: "seriously explaining the Korea bet" },
    },
    {
      scene: 12,
      key: "s12_balance",
      role: "counterpoint",
      video: "bull_ep12_s12_motion.mp4",
      narration: "물론 조심할 것도 있어. 이건 결제일 기준 이틀치라 흐름이 이어질지는 더 봐야 하고, 레버리지는 오래 들면 배수가 어긋나.",
      imageBrief: "황소가 신중하고 걱정스러운 표정으로 한 손을 턱 근처에 대고 다른 손은 허리에 얹은 포즈, 소품 없음.",
      overlays: [],
      shot: "close",
      bg: "A",
      motion: { type: "open", action: "the character rests one hand near its chin with a careful, thoughtful expression and slight head tilts while the other hand rests on its hip; no props are held.", mood: "carefully noting the caveats" },
    },
    {
      scene: 13,
      key: "s13_insight",
      role: "insight",
      video: "bull_ep12_s13_motion.mp4",
      narration: "한 줄로 정리하면, 금리가 뛰어도 주차장에 있던 돈은 기술주 쪽으로 움직였어.",
      imageBrief: card2("주차장에서", "기술주로", "확신에 찬 표정으로"),
      overlays: [],
      shot: "medium",
      bg: "A",
      motion: { type: "card2", action: "the character's expression is confident and knowing with slight nods; only the face and body move while the hands holding the card stay still.", mood: "confidently delivering the one-line summary" },
    },
    {
      scene: 14,
      key: "s14_check",
      role: "action",
      video: "bull_ep12_s14_motion.mp4",
      narration: "확인할 건 두 가지야. 다음 집계에서도 쏠림이 이어지는지랑, 내가 든 종목이 그 쏠림 안에 있는지야.",
      imageBrief: board(["① 쏠림 계속?", "② 내 종목은?"], "빈 손으로 손가락 두 개를 세워 보이며 설명하는 자세", true),
      overlays: [],
      shot: "wide",
      bg: "A",
      motion: { type: "board", action: "the character's free hand keeps two fingers raised and gives small emphasizing motions, with a clear, helpful expression, while the other hand rests near its hip.", mood: "clearly listing two things to check" },
    },
    {
      scene: 15,
      key: "s15_frame",
      role: "frame",
      video: "bull_ep12_s15_motion.mp4",
      narration: "돈이 몰린 곳을 쫓지 말고 왜 몰렸는지를 알아야, 흐름이 꺾일 때 신호가 읽혀.",
      imageBrief: card2("쫓지 말고", "이유를 읽어", "따뜻하고 차분한 미소로"),
      overlays: [],
      shot: "medium",
      bg: "C",
      motion: { type: "card2", action: "the character's expression is warm and calm with a gentle smile; only the face and body move while the hands holding the card stay still.", mood: "warmly reassuring the viewer" },
    },
    {
      scene: 16,
      key: "s16_cta",
      role: "save",
      video: "bull_ep12_s16_motion.mp4",
      narration: "이것만은 챙겨가. 다음 집계는 황소특보가 제일 먼저 들고 올게. 짚어줬으면 하는 이슈는 댓글로 남겨줘.",
      imageBrief: "황소가 밝은 미소로 한 손을 가볍게 흔들고 다른 손은 자연스럽게 내린 마무리 포즈, 소품 없이 빈 손.",
      overlays: [],
      shot: "wide",
      bg: "A",
      motion: { type: "open", action: "the character smiles brightly and waves one hand lightly in a friendly goodbye while the other hand hangs naturally relaxed.", mood: "warmly saying goodbye and inviting comments" },
      riskDisclosure: true,
    },
  ]),
});

/** 장면 키로 스펙을 찾는다. */
export function findBullEp12Scene(key) {
  return BULL_EP12_ASSEMBLY_SPEC.scenes.find((s) => s.key === key) ?? null;
}
