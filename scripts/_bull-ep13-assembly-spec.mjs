/**
 * 황소특보 13편 조립 스펙 — 16장면. 씬 구조 v3 + 성공 공식/엔딩 5박자 여섯 번째 적용본(품질 체계 v2 세 번째 황소편).
 *
 * 전달 메시지 한 줄: 삼성전자·SK하이닉스를 판 건 외국인만이 아니었다 — 외국인이 돌아오는 조건(호실적 확인 + 내년 이익 전망 상향)을 알아야 수급 뉴스를 쫓지 않고 다음 신호를 읽는다.
 * 담당: 황소특보(투자자 입장, 규칙 22). 영역 반도체(수급) · 레인 ⑦ 디커플링·수급 + ③ 이벤트 D-N · 유형 structure+schedule · 특보 근접도 상.
 *
 * ★ 소재 선정 경위(2026-10-01)★: 규칙 25 오케스트레이터 10단계 전부 + 후보 38개(SCAN_CHECKLIST `C:/tmp/bull-topic-scan-ep13/`). 3번(업종 희비)은 원문 검증에서 주가/이익 기준 혼재·기저효과로 접음, 7·8번은 SNS 성과상 약한 부류.
 * SNS 분석(대형주 보유자 직접 + 가설 뒤집기 + 확정 날짜/방금 사건)으로 4번(외국인 순매도)+1번(삼성전자 잠정실적) 결합, Owner "1번 진행해". 같은 수급 계열(2·3편) 중복은 새 전개(5개월 누적·시총 50.85% 집중·양손투자·복귀 조건)로 Owner 승인 해석.
 * Owner 2026-10-01 밤 결정으로 반도체 편중·쏠림은 후보 선별 기준이 아님(규칙 11 ★★).
 *
 * ★ 핵심 팩트(2026-10-01 기사 원문 열람, 검증 기록 `C:/tmp/bull-topic-scan-ep13/VERIFY_candidate4_1.md`)★
 * - 외국인 코스피 5개월 누적 순매도 134조 9,195억 원, 9월 21조 5,108억 원. SK하이닉스 11조 5,805억·삼성전자 4조 8,920억 = 9월 순매도의 76.6%(서울경제 10/1).
 * - 두 종목 코스피 시총 비중 50.85% 돌파 → 외국인이 익스포저를 줄일 때 매물 집중. 美 10년물 5.29%(2007년 이후 최고)가 핵심 배경(서울경제).
 * - 복귀 조건: "호실적 확인에 더해 내년 이익 전망까지 2% 이상 상향돼야 외국인의 매수 전환이 가능하다는 것이 증권가의 진단"(서울경제, 기관명 없음).
 * - 개인: 9월 한 달 삼성전자·SK하이닉스 현물 순매도 18조 3,100억(SK 9조 6,880억·삼성 8조 6,220억). '반도체 탈출 아님' = 현물은 팔고 ETF로 다시 투자('양손투자'). 같은 기간 금융투자 두 종목 4조 8,310억 순매수,
 *   반도체 ETF 3개 순자산 "최근 한 달간" 증가 합 1조 5,118억(머니투데이 10/1 15:09).
 * - 삼성전자 3분기 영업이익 컨센서스 110조 2,803억(9/29)~111조 3,772억(9/21)(에프앤가이드). 잠정실적 공시일 미확정: 2분기 7/7(삼성 뉴스룸) 5영업일 관행 + 10/5 대체공휴일 → 10/8 유력, 기사 10/7 전후 → **10/6~7까지 게시**.
 * - 제외: 개인 vs 외국인 직접 비교(출처 상이), ETF 상품명, 연간 영업이익 전망(출처별 상이), 외국인 일부 순매수(기간 불명), 공시일 날짜 단정.
 *
 * 개념 표기: 양손투자 = 개인이 삼성전자·SK하이닉스 현물은 팔고 이 종목을 담은 반도체 ETF로 다시 투자하는 것(기사 용어). 리스크 고지: 나레이션에 넣지 않고 오프닝(s2)·마지막(s16) 하단 자막바로만.
 *
 * TTS 실측(2026-10-01, output-v1, API 1회, alignment 보정 불필요): 16씬 타임라인 121.72초. 씬별 raw: s1 7.21, s2 5.21, s3 7.12, s4 7.53, s5 8.09, s6 7.45, s7 4.82, s8 5.22, s9 7.69, s10 6.52, s11 6.68, s12 7.6, s13 8.02, s14 7.24, s15 5.45, s16 6.87
 */

// 카드(두 손으로 감싼 납작한 가로형) / 보드(긴 다리 이젤) 구도 문구 — 황소 12편 스펙과 동일(규칙 15, A-4 ④).
const CARD_LAYOUT =
  "구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄, 카드에 그림·화살표 없이 글자만.";
const BOARD_LAYOUT =
  "구도(반드시, 11편 사고 재발 방지 — 황소+보드 묶음 폭 ≤76%): 황소는 이미지 왼쪽(가로 10~36%)에 서고, 보드는 황소 바로 오른쪽에 붙여 작고 아담하게 세운다 — 보드 전체가 이미지 가로 40%~72% 사이에만 들어오고 폭은 28% 이하(황소 몸통 폭보다 좁게, 몸통 폭의 90% 이하 — 보드가 황소 몸통보다 넓으면 실패), 높이는 세로의 24% 이하로 황소 키보다 훨씬 낮게. 보드 오른쪽 끝은 절대 가로 76%를 넘지 않고, 보드 오른쪽 끝과 화면 오른쪽 가장자리 사이에 바닥과 배경이 넉넉히(가로 24% 이상) 보여야 하며 보드가 잘리거나 가장자리에 닿으면 실패. 보드에는 지정한 굵은 큰 글자 줄만 넣고 그래프·표·작은 라벨은 넣지 않는다. 글자는 세로 28~58% 안. 보드는 이젤 위에 높게 올려 황소 어깨~머리 높이에 오게 한다(보드 윗변 세로 30% 근처, 아랫변 세로 55% 이내).";
const WIDE_BOARD_NOTE =
  "(와이드 샷이어도 보드는 크게 — 보드 프레임 전체가 이미지 가로 45%~83% 사이에 들어와야 하고 오른쪽 끝은 절대 83%를 넘지 않는다. 황소는 이미지 왼쪽 15~42%에 서서 보드 쪽을 가리킨다. 보드 오른쪽에 배경 여백을 남길 것) ";
const card2 = (l1, l2, expression) => `황소가 ${expression} '${l1}'와 '${l2}'가 두 줄로 크게 적힌 카드를 두 손으로 감싸 쥐고 보여주는 자세. ${CARD_LAYOUT}`;
const board = (lines, pose, wide = false) =>
  `황소 옆 긴 다리 이젤(바닥에 고정) 위에 올려 세운 보드에 ${lines.map((l) => `'${l}'`).join(", ")}가 ${lines.length === 2 ? "두" : "세"} 줄로 크게 적혀 있고, 황소가 ${pose}. ${wide ? WIDE_BOARD_NOTE : ""}${BOARD_LAYOUT}`;

export const BULL_EP13_ASSEMBLY_SPEC = Object.freeze({
  specVersion: "bull_assembly_spec_v1",
  scriptStructureVersion: "bull_script_structure_v3",
  endingStructureVersion: "bull_ending_5beat_2026_09_29",
  episode: 13,
  sourceCandidate: "candidate-bull-ep13-foreign-selling-return-condition-2026-10-01",
  title: "외국인 5개월 135조 순매도, 삼성전자·SK하이닉스 돌아올 조건은",
  channelName: "경제번역소",
  characterDisplayName: "황소특보",
  // 3줄, 줄별 실제 글자 108px(QA 게이트: 줄별 100px 이상·최대 3줄). 문구는 줄을 나눠 크기를 확보한다(2026-10-02 Owner).
  headerTitle: ["외국인 5개월째", "135조 순매도", "돌아올 조건은?"],

  // ── 이미지·영상 연출 필드(품질 체계 v2, 규칙 15) ──
  hookType: "T1",
  imageCharacter: "bull3dv1",
  imagePrefix: "bull_ep13",
  // 소재(외국인 자금의 출국·귀환, 두 종목 시총 집중, 현물→ETF 바구니)에 맞는 공간 3곳. 직전 편(12편 야경 라운지·자금 흐름 상황실·주차장 로비, 11편 조선소 데크·상황실·항만)과 겹치지 않는다.
  // 배경에 글자·숫자·로고·랜드마크·세계지도·지구본 없음.
  sceneBackgrounds: Object.freeze({
    A: {
      label: "출국·귀환 라운지(도입·복귀 조건·마무리)",
      image:
        "공항 출발 라운지처럼 넓고 밝은 라운지. 황소특보 뒤로 큼직한 곡면 통유리창(창밖에 넓은 활주로와 매끈한 저폴리곤 비행기 두세 대가 멈춰 서 있고, 항공사 로고·글자·특정 건물·세계지도·지구본 없음)이 넓게 펼쳐지고, 앞쪽에 낮은 원목 벤치 하나와 둥근 안락의자 몇 개, 양옆에 큼직한 화분, 바닥은 따뜻한 광택 바닥. 큰 빈 벽면 없이 유리창과 화분으로 채운다. 따뜻한 스카이블루·크림 조명. 글자가 적힌 전광판·표지판·포스터·화면·여행 가방 없음.",
      videoStyle: "bright departure-style lounge overlooking a runway",
      videoStatics: "the large curved glass window with the runway and a few parked low-poly airplanes, the low wooden bench, the round armchairs, the large potted plants, and the warm glossy floor",
    },
    B: {
      label: "저울 홀(두 종목 시총 집중·상황·금리)",
      image:
        "거대한 저울 조형물이 있는 중앙 홀. 황소특보 뒤로 천장 높이의 큼직한 둥근 저울 조형물(한쪽 접시에는 크고 굵은 매끈한 블록 두 개, 다른 쪽 접시에는 작은 블록 수십 개가 쌓여 두 쪽이 비슷하게 균형을 이룬 저폴리곤 조형물, 글자·숫자·눈금 표시 없음)이 넓게 서 있고, 양옆에 둥근 기둥과 큼직한 화분, 바닥은 매끈한 광택 바닥. 큰 빈 벽면 없이 저울과 기둥으로 채운다. 은은한 네이비·골드 조명. 글자가 적힌 표지판·화면·서류 없음.",
      videoStyle: "central hall with a giant balance-scale sculpture",
      videoStatics: "the giant balance-scale sculpture with two big blocks on one pan and many small blocks on the other, the round pillars, the large potted plants, and the glossy floor",
    },
    C: {
      label: "바구니 마켓 홀(개인 양손투자·ETF)",
      image:
        "밝고 넓은 마켓 홀. 황소특보 뒤로 둥근 나무 매대들이 넓게 펼쳐지고(한 매대에는 굵은 과일·채소 모양의 저폴리곤 장난감 같은 오브젝트가 큰 바구니 하나에 가득 담겨 있고, 옆 매대에는 같은 오브젝트가 낱개로 흩어져 있으며, 가격표·글자·숫자·로고 없음), 양옆에 둥근 화분, 바닥은 밝은 광택 바닥. 큰 빈 벽면 없이 매대와 화분으로 채운다. 따뜻한 민트·피치 조명. 글자가 적힌 간판·가격표·포스터 없음.",
      videoStyle: "bright market hall with a full basket on one stall and loose items on another",
      videoStatics: "the round wooden stalls, the large basket full of low-poly fruit-and-vegetable toy objects, the loose objects on the next stall, the round potted plants, and the bright glossy floor",
    },
  }),

  scenesTimeline:
    "s1 훅 / s2 오프닝 / s3 상황(외국인 5개월·9월) / s4 상황(두 종목 76.6%) / s5 핵심질문(시총 절반) / s6 근거1 금리 / s7 근거2 개인 / s8 개념(양손투자) / s9 증거(금융투자·ETF) / s10 복귀 조건 / s11 첫 시험 / s12 균형 / s13 통찰 / s14 체크 / s15 이득 각인 / s16 당부+예고+댓글",

  instagramCaptionHook: "삼성전자와 SK하이닉스를 판 건 외국인만이 아니었어, 개인도 9월에 18조 넘게 팔았어",
  instagramCaptionPoints: [
    "외국인이 코스피에서 5개월간 약 135조 원을 순매도했고, 9월에만 21조 원이 넘어",
    "9월 순매도의 76.6%가 SK하이닉스(약 11조 6천억 원)와 삼성전자(약 4조 9천억 원)야",
    "두 종목이 코스피 시가총액의 절반을 넘게 차지해서, 팔 때 매물이 한쪽으로 몰리기 쉬운 구조야",
    "미국 10년물 금리가 2007년 이후 최고인 5.29%까지 올라 외국인이 한국 주식 비중을 줄였다는 분석이야",
    "개인도 9월에 두 종목 현물을 18조 3천억 원 넘게 순매도했지만, 반도체 ETF로 다시 투자하는 '양손투자'라고 기사는 봐",
    "증권가는 외국인이 돌아오려면 호실적 확인과 내년 이익 전망 2% 이상 상향이 필요하다고 진단해",
    "삼성전자 3분기 잠정실적 시장 전망치는 영업이익 110조 원이 넘어, 좋은 실적이 나와도 복귀를 단정할 순 없어",
    "👉 삼성전자 실적이 전망치를 넘는지, 내년 이익 전망이 얼마나 오르는지 확인해봐",
    "※ 공개된 수급·전망 자료를 정리한 거고 종목 추천이나 투자 권유가 아니야",
  ],
  instagramPriorityTags: [
    "외국인순매도",
    "삼성전자",
    "SK하이닉스",
    "반도체",
    "수급",
    "양손투자",
    "개인투자자",
    "국채금리",
    "주식공부",
    "주식투자",
    "경제뉴스",
    "황소특보",
  ],

  emphasisTerms: ["외국인", "삼성전자", "SK하이닉스", "양손투자", "황소특보"],

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
      video: "bull_ep13_s1_motion.mp4",
      narration: "다들, 외국인만 판 줄 알았지? 삼성전자와 SK하이닉스를 9월에 개인도 18조 넘게 팔았어.",
      imageBrief: card2("외국인만?", "개인도 18조", "놀라고 궁금하다는 표정으로"),
      overlays: [],
      shot: "medium",
      bg: "A",
      motion: { type: "card2", action: "the character's expression is wide-eyed and puzzled, eyebrows raised, as if asking the viewer whether only foreigners were selling; body and face move gently while the hands holding the card stay still.", mood: "posing an intriguing question to the viewer" },
    },
    {
      scene: 2,
      key: "s2_opening",
      role: "opening",
      video: "bull_ep13_s2_motion.mp4",
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
      key: "s3_situation_foreign",
      role: "background",
      video: "bull_ep13_s3_motion.mp4",
      narration: "숫자부터 보자. 외국인이 코스피에서 5개월간 135조 원을 팔았고, 9월에만 21조 원이 넘어.",
      imageBrief: board(["5개월", "135조", "9월 21조"], "빈 손으로 보드를 가리키며 설명하는 자세"),
      overlays: [],
      shot: "medium",
      bg: "B",
      motion: { type: "board", action: "the character's free hand points toward the board without touching it, with a bright, informative expression, while the other hand rests near its hip.", mood: "calmly presenting the big figures" },
    },
    {
      scene: 4,
      key: "s4_situation_two",
      role: "background",
      video: "bull_ep13_s4_motion.mp4",
      narration: "이 중 SK하이닉스가 11조 6천억 원, 삼성전자가 4조 9천억 원, 두 종목이 76.6%였어.",
      imageBrief: board(["두 종목이", "76.6%"], "빈 손으로 보드를 가리키며 설명하는 자세", true),
      overlays: [],
      shot: "wide",
      bg: "B",
      motion: { type: "board", action: "the character's free hand points to the board lines one after another from top to bottom without touching it, explaining with a bright, clear expression, while the other hand rests near its hip.", mood: "clearly explaining how concentrated the selling was" },
    },
    {
      scene: 5,
      key: "s5_core_q",
      role: "twist",
      video: "bull_ep13_s5_motion.mp4",
      narration: "그럼 왜 하필 이 두 종목일까? 한마디로 코스피 시가총액의 절반을 넘게 차지해서, 팔 때 매물이 한쪽으로 몰리는 구조야.",
      imageBrief: card2("시총 절반이", "두 종목", "갸웃하다 확신에 찬 표정으로"),
      overlays: [],
      shot: "medium",
      bg: "B",
      motion: { type: "card2", action: "the character's expression starts curious with a slight head tilt and turns confident and knowing; only the face and body move while the hands holding the card stay still.", mood: "confidently delivering the key answer" },
    },
    {
      scene: 6,
      key: "s6_evidence_rate",
      role: "evidence",
      video: "bull_ep13_s6_motion.mp4",
      narration: "첫째는 금리야. 미국 10년물이 2007년 이후 최고인 5.29%까지 올라, 외국인이 비중을 줄였대.",
      imageBrief: board(["미국 10년물", "5.29%"], "빈 손으로 보드를 가리키며 설명하는 자세"),
      overlays: [],
      shot: "medium",
      bg: "B",
      motion: { type: "board", action: "the character's free hand points toward the board lines without touching it, with a clear, serious, informative expression, while the other hand rests near its hip.", mood: "clearly explaining the interest-rate backdrop" },
    },
    {
      scene: 7,
      key: "s7_evidence_retail",
      role: "evidence",
      video: "bull_ep13_s7_motion.mp4",
      narration: "둘째는 개인이야. 이쪽도 팔았는데, 반도체를 떠난 건 아니라고 기사는 봐.",
      imageBrief: "황소가 갸웃하며 궁금해하는 표정으로 한 손을 턱 근처에 대고 다른 손은 허리에 얹은 포즈, 소품 없음.",
      overlays: [],
      shot: "close",
      bg: "C",
      motion: { type: "open", action: "the character rests one hand near its chin with a curious, puzzled expression and slight head tilts while the other hand rests on its hip; no props are held.", mood: "curiously introducing the second reason" },
    },
    {
      scene: 8,
      key: "s8_concept_two_hands",
      role: "background",
      video: "bull_ep13_s8_motion.mp4",
      narration: "현물 주식은 팔고 반도체 ETF로 다시 사는 걸, 기사는 양손투자라고 불러.",
      // 보드 폭 문제(1·2차 탈락: 글자 끝 91.6%·94%)로 3차는 이 씬만 좌우를 뒤집는다 — 황소 오른쪽, 보드 왼쪽.
      imageBrief:
        "황소 옆 긴 다리 이젤(바닥에 고정) 위에 올려 세운 보드에 '양손투자', '현물 팔고', 'ETF 다시'가 세 줄로 크게 적혀 있고, 황소가 빈 손으로 보드를 가리키며 밝고 친근하게 설명하는 자세. 구도(반드시, 이번 장면만 좌우를 뒤집는다): 황소는 이미지 오른쪽(가로 58~88%)에 서고, 보드는 황소 왼쪽에 세워 보드 전체가 이미지 가로 14%~54% 사이에만 들어온다. 보드 왼쪽 끝은 절대 가로 12% 밖으로 나가지 않고 보드 폭은 36% 이하, 황소 오른쪽 끝도 가로 90%를 넘지 않으며 황소와 보드 모두 화면 가장자리에 닿거나 잘리면 실패. 보드에는 지정한 굵은 큰 글자 줄만 넣고 그래프·표·작은 라벨은 넣지 않는다. 글자는 세로 28~58% 안. 보드는 이젤 위에 높게 올려 황소 어깨~머리 높이에 오게 한다(보드 윗변 세로 30% 근처, 아랫변 세로 55% 이내).",
      overlays: [],
      shot: "medium",
      bg: "C",
      motion: { type: "board", action: "the character's free hand points toward the board lines without touching it, with a bright, friendly explanatory expression, while the other hand rests near its hip.", mood: "friendly explaining the two-handed investing term" },
    },
    {
      scene: 9,
      key: "s9_evidence_etf",
      role: "evidence",
      video: "bull_ep13_s9_motion.mp4",
      narration: "금융투자는 이 두 종목을 5조 원 가까이 샀고, ETF 세 개는 한 달 새 순자산이 1조 5천억 원 넘게 늘었어.",
      imageBrief: card2("금융투자 5조", "ETF 1.5조", "또렷하고 확신에 찬 표정으로"),
      overlays: [],
      shot: "medium",
      bg: "C",
      motion: { type: "card2", action: "the character's expression is bright and confident with slight nods; only the face and body move while the hands holding the card stay still.", mood: "confidently showing the evidence" },
    },
    {
      scene: 10,
      key: "s10_return_condition",
      role: "insight",
      video: "bull_ep13_s10_motion.mp4",
      narration: "외국인은 언제 돌아올까? 증권가는 호실적 확인과 내년 이익 전망 2% 이상 상향을 꼽아.",
      imageBrief: board(["복귀 조건", "호실적 확인", "내년 이익 +2%"], "빈 손으로 보드를 가리키며 진지하게 설명하는 자세", true),
      overlays: [],
      shot: "wide",
      bg: "A",
      motion: { type: "board", action: "the character's free hand points to the board lines one after another from top to bottom without touching it, with a serious, engaged expression, while the other hand rests near its hip.", mood: "seriously laying out the return conditions" },
    },
    {
      scene: 11,
      key: "s11_first_test",
      role: "insight",
      video: "bull_ep13_s11_motion.mp4",
      narration: "첫 시험은 곧 나올 삼성전자 3분기 잠정실적이야. 시장 전망치는 영업이익 110조 원이 넘어.",
      imageBrief: card2("첫 시험", "삼성전자 실적", "또렷하고 기대에 찬 표정으로"),
      overlays: [],
      shot: "medium",
      bg: "A",
      motion: { type: "card2", action: "the character's expression is clear and expectant with slight nods; only the face and body move while the hands holding the card stay still.", mood: "expectantly pointing to the first test" },
    },
    {
      scene: 12,
      key: "s12_balance",
      role: "counterpoint",
      video: "bull_ep13_s12_motion.mp4",
      narration: "물론 조심할 것도 있어. 진단대로면 실적만으론 부족해서, 좋은 실적이 나와도 외국인 복귀를 단정할 순 없어.",
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
      video: "bull_ep13_s13_motion.mp4",
      narration: "한 줄로 정리하면, 삼성전자와 SK하이닉스 수급은 누가 팔았는지보다 무엇이 확인돼야 돌아오는지가 핵심이야.",
      imageBrief: card2("수급은 조건으로", "읽는다", "확신에 찬 표정으로"),
      overlays: [],
      shot: "medium",
      bg: "A",
      motion: { type: "card2", action: "the character's expression is confident and knowing with slight nods; only the face and body move while the hands holding the card stay still.", mood: "confidently delivering the one-line summary" },
    },
    {
      scene: 14,
      key: "s14_check",
      role: "action",
      video: "bull_ep13_s14_motion.mp4",
      narration: "확인할 건 두 가지, 삼성전자 실적이 전망치를 넘는지랑 내년 이익 전망이 얼마나 오르는지 보면 돼.",
      imageBrief: board(["① 전망치?", "② 내년 이익?"], "빈 손으로 손가락 두 개를 세워 보이며 설명하는 자세", true),
      overlays: [],
      shot: "wide",
      bg: "A",
      motion: { type: "board", action: "the character's free hand keeps two fingers raised and gives small emphasizing motions, with a clear, helpful expression, while the other hand rests near its hip.", mood: "clearly listing two things to check" },
    },
    {
      scene: 15,
      key: "s15_frame",
      role: "frame",
      video: "bull_ep13_s15_motion.mp4",
      narration: "수급 뉴스를 쫓지 말고 돌아올 조건을 알아야, 다음 신호가 읽혀. 이것만은 챙겨가.",
      imageBrief: card2("쫓지 말고", "조건을 알아", "따뜻하고 차분한 미소로"),
      overlays: [],
      shot: "medium",
      bg: "B",
      motion: { type: "card2", action: "the character's expression is warm and calm with a gentle smile; only the face and body move while the hands holding the card stay still.", mood: "warmly reassuring the viewer" },
    },
    {
      scene: 16,
      key: "s16_cta",
      role: "save",
      video: "bull_ep13_s16_motion.mp4",
      narration: "삼성전자 잠정실적이 나오면 황소특보가 제일 먼저 들고 올게. 짚어줬으면 하는 이슈는 댓글로 남겨줘.",
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
export function findBullEp13Scene(key) {
  return BULL_EP13_ASSEMBLY_SPEC.scenes.find((s) => s.key === key) ?? null;
}
