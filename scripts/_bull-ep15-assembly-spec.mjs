/**
 * 황소특보 15편 조립 스펙 — 17장면. 씬 구조 v3 + 성공 공식/엔딩 5박자 여덟 번째 적용본(품질 체계 v2 다섯 번째 황소편).
 *
 * 전달 메시지 한 줄: 미국 신기록은 진짜지만, 한 달 숫자 하나·지역 하나로 현대차 전체를 읽으면 틀린다 — 미국과 세계, 월과 분기를 나눠 봐야 다음 신호가 읽힌다.
 * 담당: 황소특보(투자자 입장, 규칙 22). 영역 모빌리티(첫 편) · 레인 ① 원인 해설 · 유형 event · 특보 근접도 상(10/1~2 발표).
 *
 * ★ 소재 선정 경위(2026-10-02)★: 규칙 25 오케스트레이터 11단계 전부(`C:/tmp/bull-topic-scan-ep15/SCAN_CHECKLIST.md`) + 후보 35개 → Owner가 3번(현대차·기아 미국 9월 판매) 선택, 4번(앤트로픽 상장)은
 * 16편 후보로 보관, 1번(삼성전자 자사주 매입 10/6 종료)·2번(삼성 잠정실적)은 10/3~10/5 휴장 기간 예비 소재(Owner 지시). 팩트 확인 중 각도 변경: "전기차 vs 하이브리드" → "미국 신기록 vs 세계 판매 -16%"
 * (아이오닉5 -65%는 작년 9월 세금 혜택 종료 직전 몰림 기저효과). 초안·팩트표·새 독자 읽기 점검(규칙 29): `_ai/bull-ep15-hyundai-script-draft.md`, `_ai/bull-ep15-cold-read.md`.
 *
 * ★ 핵심 팩트(2026-10-02, 상세 출처표는 초안 문서)★
 * - 미국 9월 현대차 77,439대(+9%, 9월 기준 역대 최대), 하이브리드 +39%(전체의 28%), 팰리세이드 +52%, 아이오닉5 2,928대(-65%) — 파이낸셜뉴스·아시아경제·이투데이.
 * - 작년 9월 아이오닉5 8,408대(+152%, 세액공제 일몰 직전 몰림) — 2025년 9월 보도(검색 요약, 원문 미열람).
 * - 현대차 세계 9월 307,998대(-16.0%, 국내 49,022 -25.7%·해외 258,976 -13.9%), 회사 설명 "추석 연휴 영업일 감소·신차 대기 수요 등", 1~9월 누적 2,886,763대(-7.0%) — 현대차그룹 공식 페이지·뉴스핌.
 * - 현대차그룹(현대·기아·제네시스) 미국 3분기 506,200대(+5%), 분기 첫 50만 대 — 한국일보·SBS Biz.
 * - 제외: 기아 숫자(허용리스트 밖), 포드 제친 미국 3위(포드 실제 발표 미확인), 10/2 주가(마감 미확인), 현대차 3분기 실적 발표일(법정 기한 11/16, 미확정), "신차 대기 수요"(대본에서 이해 불가라 뺌).
 * - 리스크 고지: 나레이션에 넣지 않고 오프닝(s2)·마지막(s17) 하단 자막바로만.
 *
 * TTS 실측: 17씬 118.36초, API 1/1, 순수 발화 최대 7.88초, 정렬 밀림 없음(최대 이동 -0.12초, 보정본 불필요) — `C:/tmp/money-shorts-os/bull-ep15-tts/output-v1/`.
 */

// 카드(두 손으로 감싼 납작한 가로형) / 보드(긴 다리 이젤) 구도 문구 — 황소 14편 스펙과 동일(규칙 15, A-4 ④).
const CARD_LAYOUT =
  "구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄, 카드에 그림·화살표 없이 글자만.";
const BOARD_LAYOUT =
  "구도(반드시, 11편 사고 재발 방지 — 황소+보드 묶음 폭 ≤76%): 황소는 이미지 왼쪽(가로 10~36%)에 서고, 보드는 황소 바로 오른쪽에 붙여 작고 아담하게 세운다 — 보드 전체가 이미지 가로 40%~72% 사이에만 들어오고 폭은 28% 이하(황소 몸통 폭보다 좁게, 몸통 폭의 90% 이하 — 보드가 황소 몸통보다 넓으면 실패), 높이는 세로의 24% 이하로 황소 키보다 훨씬 낮게. 보드 오른쪽 끝은 절대 가로 76%를 넘지 않고, 보드 오른쪽 끝과 화면 오른쪽 가장자리 사이에 바닥과 배경이 넉넉히(가로 24% 이상) 보여야 하며 보드가 잘리거나 가장자리에 닿으면 실패. 보드에는 지정한 굵은 큰 글자 줄만 넣고 그래프·표·작은 라벨은 넣지 않는다. 글자는 세로 28~58% 안. 보드는 이젤 위에 높게 올려 황소 어깨~머리 높이에 오게 한다(보드 윗변 세로 30% 근처, 아랫변 세로 55% 이내).";
const WIDE_BOARD_NOTE =
  "(와이드 샷이어도 보드는 크게 — 보드 프레임 전체가 이미지 가로 45%~83% 사이에 들어와야 하고 오른쪽 끝은 절대 83%를 넘지 않는다. 황소는 이미지 왼쪽 15~42%에 서서 보드 쪽을 가리킨다. 보드 오른쪽에 배경 여백을 남길 것) ";
const card2 = (l1, l2, expression) => `황소가 ${expression} '${l1}'와 '${l2}'가 두 줄로 크게 적힌 카드를 두 손으로 감싸 쥐고 보여주는 자세. ${CARD_LAYOUT}`;
const board = (lines, pose, wide = false) =>
  `황소 옆 긴 다리 이젤(바닥에 고정) 위에 올려 세운 보드에 ${lines.map((l) => `'${l}'`).join(", ")}가 ${lines.length === 2 ? "두" : "세"} 줄로 크게 적혀 있고, 황소가 ${pose}. ${wide ? WIDE_BOARD_NOTE : ""}${BOARD_LAYOUT}`;

export const BULL_EP15_ASSEMBLY_SPEC = Object.freeze({
  specVersion: "bull_assembly_spec_v1",
  scriptStructureVersion: "bull_script_structure_v3",
  endingStructureVersion: "bull_ending_5beat_2026_09_29",
  episode: 15,
  sourceCandidate: "candidate-bull-ep15-hyundai-us-record-vs-global-decline-2026-10-02",
  title: "현대차 미국은 신기록인데, 세계 판매는 왜 줄었을까",
  channelName: "경제번역소",
  characterDisplayName: "황소특보",
  // 3줄, 줄별 실제 글자 108px(QA 게이트: 줄별 100px 이상·최대 3줄, 한 줄 약 8자 이내).
  headerTitle: ["현대차 미국", "신기록인데", "세계는 -16%"],

  // ── 이미지·영상 연출 필드(품질 체계 v2, 규칙 15) ──
  hookType: "T1",
  imageCharacter: "bull3dv1",
  imagePrefix: "bull_ep15",
  // 소재(자동차 판매, 하이브리드·충전, 연휴 공장)에 맞는 공간 3곳. 직전 편들(14편 데이터센터·클린룸·식물 라운지, 13편 출국 라운지·저울 홀·마켓 홀,
  // 12편 야경 라운지·자금 흐름 상황실·주차장 로비, 11편 조선소·상황실·항만)과 겹치지 않는다. 배경에 글자·숫자·로고·번호판·화면·달력 없음.
  sceneBackgrounds: Object.freeze({
    A: {
      label: "유리 외벽 자동차 쇼룸(도입·미국 상황·정리·마무리)",
      image:
        "깔끔하고 밝은 유리 외벽 자동차 쇼룸. 황소특보 뒤로 곡선으로 배열된 단색 SUV 전시 차량 서너 대(차체는 매끈한 단색, 엠블럼·로고·번호판·글자 없음)와 큼직한 유리 외벽 너머 맑은 하늘, 천장에는 길게 이어진 흰색 조명 띠, 바닥은 매끈한 광택 바닥. 큰 빈 벽면 없이 차량과 유리 외벽으로 채운다. 밝은 하늘색·화이트 조명에 골드 포인트, 저폴리곤 단순화. 글자·숫자·간판·번호판·화면 없음.",
      videoStyle: "clean bright glass-walled car showroom with plain unbranded SUVs",
      videoStatics: "the curved row of plain single-color unbranded SUVs, the large glass wall with a clear sky, the long white ceiling light strips, and the glossy floor",
    },
    B: {
      label: "친환경차 충전·정비 허브(미국 근거: 하이브리드·전기차)",
      image:
        "밝은 친환경차 충전·정비 허브. 황소특보 뒤로 리프트에 올라가 있는 단색 차량 한 대(엠블럼·로고·번호판·글자 없음)와 나란히 선 충전 기둥들(기둥에는 작은 초록 점 조명만 켜져 있고 글자·숫자·화면 없음), 양옆에 큼직한 공구 선반(공구는 실루엣만), 바닥은 하얗고 매끈한 광택 바닥. 큰 빈 벽면 없이 리프트·충전 기둥·선반으로 채운다. 화이트·연두 조명에 골드 포인트, 저폴리곤 단순화. 글자·숫자·로고·간판·화면 없음.",
      videoStyle: "bright eco-car charging and service hub with a plain unbranded car on a lift and charging posts",
      videoStatics: "the plain unbranded car on the lift, the row of charging posts with small green dot lights, the large tool shelves with silhouette tools, and the white glossy floor",
    },
    C: {
      label: "연휴 한낮 공장 아트리움(세계 판매·연휴·누적 구간)",
      image:
        "한낮 햇살이 쏟아지는 조용한 공장 중앙 아트리움. 황소특보 뒤로 멈춘 채 길게 이어진 조립 라인(작업대 위에 단색 차체 프레임들, 로고·글자 없음)이 넓게 펼쳐지고, 높은 유리 지붕에서 따뜻한 햇살, 양옆에 큼직한 화분과 둥근 벤치, 바닥은 매끈한 광택 바닥. 큰 빈 벽면 없이 라인과 화분으로 채우고 사람은 없음. 따뜻한 골드·연두 조명, 저폴리곤 단순화. 글자·숫자·간판·시계·달력·화면 없음.",
      videoStyle: "quiet sunlit factory atrium with a paused assembly line of plain unbranded car frames",
      videoStatics: "the long paused assembly line with plain single-color car body frames, the high glass roof with warm sunlight, the large potted plants and round benches, and the glossy floor",
    },
  }),

  scenesTimeline:
    "s1 훅 / s2 오프닝(압축형) / s3 상황(미국 +9%) / s4 상황(세계 30만 8천 대) / s5 세계 숫자엔 미국 포함 / s6 핵심질문 / s7 근거1 미국(하이브리드·팰리세이드) / s8 전기차 -65% / s9 작년 9월 몰림(기저효과) / s10 근거2 달력(추석 연휴) / s11 균형(누적 -7%) / s12 지역은 발표에 없음 / s13 분기 50만 대 / s14 통찰 / s15 체크 / s16 프레임·이득 각인 / s17 당부+예고+댓글",

  instagramCaptionHook: "현대차 미국 판매는 역대 최대인데, 9월 세계 판매는 16% 줄었어",
  instagramCaptionPoints: [
    "현대차 미국 9월 판매는 77,439대로 1년 전보다 9% 늘어 9월 기준 역대 최대였어",
    "같은 달 세계 판매는 307,998대로 16.0% 줄었어, 국내는 25.7%, 해외는 13.9% 감소야",
    "미국에선 하이브리드가 39% 늘어 전체 판매의 28%였고 팰리세이드도 52% 늘었어, 전기차 아이오닉5는 65% 줄었지만 작년 9월은 미국 전기차 세금 혜택 종료 직전에 판매가 몰린 달이었어",
    "현대차는 9월 감소 이유로 추석 연휴 영업일 감소와 신차 대기 수요 등을 꼽았는데, 1~9월 누적 판매도 7.0% 줄었고 어느 지역에서 얼마나 빠졌는지는 이번 발표에 나오지 않았어",
    "현대차그룹 전체 미국 3분기 판매는 약 50만 6천 대(+5%)로 분기 기준 처음 50만 대를 넘었어",
    "👉 미국 하이브리드 비중이 이어지는지, 세계 판매 감소폭이 줄어드는지 확인해봐",
    "※ 공개된 판매 자료를 정리한 거고 종목 추천이나 투자 권유가 아니야, 수치는 정정될 수 있어",
  ],
  instagramPriorityTags: [
    "현대차",
    "현대차그룹",
    "미국판매",
    "하이브리드",
    "전기차",
    "판매실적",
    "자동차",
    "주식공부",
    "주식투자",
    "경제뉴스",
    "황소특보",
  ],

  emphasisTerms: ["현대차", "미국", "세계", "하이브리드", "황소특보"],

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
      scene: 1,
      key: "s1_hook",
      role: "hook",
      video: "bull_ep15_s1_motion.mp4",
      narration: "다들, 현대차 미국 판매가 역대 최대라니 잘나가는 줄 알았지? 근데 세계 판매는 16% 줄었어.",
      imageBrief: card2("미국은 신기록", "세계는 감소", "놀라고 궁금하다는 표정으로"),
      overlays: [],
      shot: "medium",
      bg: "A",
      motion: { type: "card2", action: "the character's expression is wide-eyed and puzzled, eyebrows raised, as if asking the viewer why overall sales fell despite the record; body and face move gently while the hands holding the card stay still.", mood: "posing an intriguing question to the viewer" },
    },
    {
      scene: 2,
      key: "s2_opening",
      role: "opening",
      video: "bull_ep15_s2_motion.mp4",
      narration: "안녕, 투자 소식 정리해주는 황소특보야. 핵심만 짚어줄게.",
      imageBrief: "황소가 정면을 보며 한 손으로 위를 가리키고 다른 손은 허리에 얹은 채 밝고 명랑하게 웃는 포즈, 소품 없음.",
      overlays: [],
      shot: "wide",
      bg: "A",
      motion: { type: "open", action: "the character keeps one hand raised with the index finger pointing upward in a confident, friendly gesture while the other hand rests on its hip, smiling brightly and warmly at the viewer.", mood: "warmly greeting the viewer" },
      riskDisclosure: true,
    },
    {
      scene: 3,
      key: "s3_situation_us",
      role: "background",
      video: "bull_ep15_s3_motion.mp4",
      narration: "숫자부터 보자. 미국에서 현대차는 1년 전보다 9% 늘었고, 9월 기준으로 역대 최대야.",
      imageBrief: card2("미국 +9%", "9월 역대 최대", "또렷하고 밝게 설명하는 표정으로"),
      overlays: [],
      shot: "medium",
      bg: "A",
      motion: { type: "card2", action: "the character's expression is bright and informative with slight nods; only the face and body move while the hands holding the card stay still.", mood: "calmly presenting the US record" },
    },
    {
      scene: 4,
      key: "s4_situation_global",
      role: "background",
      video: "bull_ep15_s4_motion.mp4",
      narration: "세계 판매는 국내와 해외를 더한 30만 8천 대야. 국내는 25.7%, 해외는 13.9% 줄었어.",
      imageBrief: card2("세계 판매", "30만 8천 대", "차분하고 또렷하게 설명하는 표정으로"),
      overlays: [],
      shot: "medium",
      bg: "C",
      motion: { type: "card2", action: "the character's expression is calm and clear with slight nods; only the face and body move while the hands holding the card stay still.", mood: "calmly presenting the global total" },
    },
    {
      scene: 5,
      key: "s5_global_includes_us",
      role: "background",
      video: "bull_ep15_s5_motion.mp4",
      narration: "세계 숫자엔 미국도 들어 있어. 미국이 늘었는데도 해외가 줄었으니, 나머지 지역은 더 크게 빠졌다는 뜻이지.",
      imageBrief: card2("미국을 빼면", "더 크게 빠짐", "갸웃하다 알겠다는 표정으로"),
      overlays: [],
      shot: "medium",
      bg: "C",
      motion: { type: "card2", action: "the character's expression starts curious with a slight head tilt and turns knowing; only the face and body move while the hands holding the card stay still.", mood: "revealing the hidden detail in the global number" },
    },
    {
      scene: 6,
      key: "s6_core_q",
      role: "twist",
      video: "bull_ep15_s6_motion.mp4",
      narration: "그럼 왜 미국만 신기록일까? 한마디로 미국은 하이브리드와 SUV가 끌었고, 전체는 달력에 눌렸기 때문이야.",
      imageBrief: card2("미국은 하이브리드", "전체는 달력", "확신에 찬 표정으로"),
      overlays: [],
      shot: "medium",
      bg: "B",
      motion: { type: "card2", action: "the character's expression is confident and knowing with a slight nod; only the face and body move while the hands holding the card stay still.", mood: "confidently delivering the key answer" },
    },
    {
      scene: 7,
      key: "s7_evidence_us",
      role: "evidence",
      video: "bull_ep15_s7_motion.mp4",
      narration: "첫째는 미국이야. 하이브리드는 39% 늘어 전체의 28%, 팰리세이드는 52% 늘었어.",
      imageBrief: board(["하이브리드 +39%", "팰리세이드 +52%"], "빈 손으로 보드를 가리키며 설명하는 자세", true),
      overlays: [],
      shot: "wide",
      bg: "B",
      motion: { type: "board", action: "the character's free hand points to the board lines one after another from top to bottom without touching it, explaining with a bright, clear expression, while the other hand rests near its hip.", mood: "clearly explaining the US drivers" },
    },
    {
      scene: 8,
      key: "s8_evidence_ev",
      role: "evidence",
      video: "bull_ep15_s8_motion.mp4",
      narration: "반대로 전기차 아이오닉5는 65%나 감소했어.",
      imageBrief: card2("아이오닉5", "전기차 -65%", "아쉽고 진지한 표정으로"),
      overlays: [],
      shot: "medium",
      bg: "B",
      motion: { type: "card2", action: "the character's expression is serious and a little disappointed with a slight head shake; only the face and body move while the hands holding the card stay still.", mood: "seriously noting the EV drop" },
    },
    {
      scene: 9,
      key: "s9_evidence_ev_base",
      role: "evidence",
      video: "bull_ep15_s9_motion.mp4",
      narration: "근데 작년 9월은 미국 전기차 세금 혜택이 끝나기 직전이라, 몰려 샀던 만큼 올해 감소가 커 보여.",
      imageBrief: card2("작년 9월은", "혜택 종료 직전", "알겠다는 듯 또렷하게 설명하는 표정으로"),
      overlays: [],
      shot: "medium",
      bg: "B",
      motion: { type: "card2", action: "the character's expression is clear and explanatory with slight nods as if pointing out the base effect; only the face and body move while the hands holding the card stay still.", mood: "clearly explaining the base effect" },
    },
    {
      scene: 10,
      key: "s10_evidence_calendar",
      role: "evidence",
      video: "bull_ep15_s10_motion.mp4",
      narration: "둘째는 달력이야. 9월은 추석 연휴로 영업일이 줄었다고 현대차는 말했어.",
      imageBrief: card2("추석 연휴", "영업일 감소", "또렷하고 설명하는 표정으로"),
      overlays: [],
      shot: "medium",
      bg: "C",
      motion: { type: "card2", action: "the character's expression is clear and explanatory with slight nods; only the face and body move while the hands holding the card stay still.", mood: "clearly explaining the calendar effect" },
    },
    {
      scene: 11,
      key: "s11_balance",
      role: "counterpoint",
      video: "bull_ep15_s11_motion.mp4",
      narration: "물론 조심할 것도 있어. 1월부터 9월까지 누적 판매도 7% 줄었으니, 연휴 탓만은 아니야.",
      imageBrief: "황소가 신중하고 걱정스러운 표정으로 한 손을 턱 근처에 대고 다른 손은 허리에 얹은 포즈, 소품 없음.",
      overlays: [],
      shot: "close",
      bg: "C",
      motion: { type: "open", action: "the character rests one hand near its chin with a careful, thoughtful expression and slight head tilts while the other hand rests on its hip; no props are held.", mood: "carefully noting the caveat" },
    },
    {
      scene: 12,
      key: "s12_balance_unknown",
      role: "counterpoint",
      video: "bull_ep15_s12_motion.mp4",
      narration: "어느 지역이 왜 빠졌는지는 이번 발표에 안 나왔어.",
      imageBrief: card2("어느 지역?", "발표엔 없음", "고개를 갸웃하는 신중한 표정으로"),
      overlays: [],
      shot: "medium",
      bg: "C",
      motion: { type: "card2", action: "the character's expression is thoughtful with a slight head tilt as if admitting the missing detail; only the face and body move while the hands holding the card stay still.", mood: "honestly noting what is not yet known" },
    },
    {
      scene: 13,
      key: "s13_quarter",
      role: "insight",
      video: "bull_ep15_s13_motion.mp4",
      narration: "미국은 분기로 봐도 탄탄해. 현대차그룹 전체로 이번 분기에 처음 50만 대를 넘겼거든.",
      // 보드 구도 탈락(2026-10-02: 글자 끝 약 91% > 크롭선 90%) → 카드 구도로 전환.
      imageBrief: card2("미국 분기 판매", "처음 50만 대", "밝고 뿌듯한 표정으로"),
      overlays: [],
      shot: "medium",
      bg: "A",
      motion: { type: "card2", action: "the character's expression is bright and proud with slight nods; only the face and body move while the hands holding the card stay still.", mood: "brightly reporting the quarterly milestone" },
    },
    {
      scene: 14,
      key: "s14_insight",
      role: "insight",
      video: "bull_ep15_s14_motion.mp4",
      narration: "한 줄로 정리하면, 미국 신기록은 진짜지만 현대차 전체 흐름까지 말해주진 않아.",
      imageBrief: card2("미국 신기록은", "전체와 별개", "확신에 찬 표정으로"),
      overlays: [],
      shot: "medium",
      bg: "A",
      motion: { type: "card2", action: "the character's expression is confident and knowing with slight nods; only the face and body move while the hands holding the card stay still.", mood: "confidently delivering the one-line summary" },
    },
    {
      scene: 15,
      key: "s15_check",
      role: "action",
      video: "bull_ep15_s15_motion.mp4",
      narration: "확인할 건 두 가지, 미국 하이브리드 비중이 이어지는지랑 세계 판매 감소폭이 줄어드는지 보면 돼.",
      imageBrief: board(["① 미국 비중", "② 세계 감소폭"], "빈 손으로 손가락 두 개를 세워 보이며 설명하는 자세", true),
      overlays: [],
      shot: "wide",
      bg: "A",
      motion: { type: "board", action: "the character's free hand keeps two fingers raised and gives small emphasizing motions, with a clear, helpful expression, while the other hand rests near its hip.", mood: "clearly listing two things to check" },
    },
    {
      scene: 16,
      key: "s16_frame",
      role: "frame",
      video: "bull_ep15_s16_motion.mp4",
      narration: "한 달 숫자 하나만 쫓지 말고 미국과 세계, 월과 분기를 나눠 봐야 다음 신호가 읽혀. 이것만은 챙겨가.",
      imageBrief: card2("월과 분기", "나눠 읽어", "따뜻하고 차분한 미소로"),
      overlays: [],
      shot: "medium",
      bg: "B",
      motion: { type: "card2", action: "the character's expression is warm and calm with a gentle smile; only the face and body move while the hands holding the card stay still.", mood: "warmly reassuring the viewer" },
    },
    {
      scene: 17,
      key: "s17_cta",
      role: "save",
      video: "bull_ep15_s17_motion.mp4",
      narration: "현대차 3분기 실적이 나오면 황소특보가 제일 먼저 들고 올게. 짚어줬으면 하는 이슈는 댓글로 남겨줘.",
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
export function findBullEp15Scene(key) {
  return BULL_EP15_ASSEMBLY_SPEC.scenes.find((s) => s.key === key) ?? null;
}
