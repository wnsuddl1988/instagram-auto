/**
 * 부엉박사 조립 스펙 표시 19편(파일 번호 20, v2 + 품질 체계 v2) — 광고 최고금리 vs 내가 받는 금리(예금).
 *
 * 파일 이름: 표시 19편 = 파일 번호 20(표시 18편 청년미래적금이 파일 ep19). 배포: Owner 지시 2026-10-04(일)로 확정 시 사용.
 * 기준: _ai/CURRENT_STANDARDS.md §1 부엉 v2, 규칙 14(배경 2~3구역)·15(품질 체계 v2)·17(훅)·26~28. 유형 D형(나는 어떻게 해야 하나).
 * 대본 v4: 15씬·533자(검사기 반드시 수정 0, 확인 권장 5). v3(17씬·597자, TTS 126.76초)에서 적금 12% 씬(s12·s13)을 Owner 지시(2026-10-01)로 삭제 → TTS 오디오 컷 후 111.4초(scripts/cut-scenes-from-tts-once.mjs, output-v2).
 * 대본 초안 문서: _ai/owl-ep20-deposit-rate-script-draft.md. 담당 부엉박사(시민 입장, 규칙 22) · 레인 money_calc · 영역 savings_deposit · 제목 모양 contrast.
 *
 * ★ 핵심 팩트(2026-10-01 원문 확인, 금리는 매일 변동 — 10/3 재확인)★
 * - 지방은행 1년 예금 4.04% = 기본 3.54% + 우대 0.5%p(첫 예금 고객 0.4 + 서비스 안내 동의 0.1), 은행권 4% 돌파는 2024년 6월 이후 약 2년 3개월 만 [머니투데이 2026-09-29].
 * - 5대 은행 1년 예금 3.5% 안팎(농협 3.55·국민/우리 3.50·신한/하나 3.40, 10/1 하나 3.6%) [머니투데이 9/29, 뉴시스 10/1].
 * - 저축은행 12개월 최고 4.03%(인터넷·비대면, 세전) [한국금융신문 2026-09-27].
 * - 5천만 원 한 해 이자(세전): 3.55% = 1,775,000원, 4.03% = 2,015,000원, 차이 240,000원(이자소득세 15.4% 공제 후 약 20만 원).
 * - 적금(본편에서 삭제, 캡션·후속 소재 후보용): 연 12% 상품(KB카드쓰담적금)은 기본 2%·6개월·월 30만 원 → 12% 전부 받아도 세전 이자 약 63,000원 [그린포스트코리아 2026-09-26 + 직접 계산].
 * - 예금자보호 금융기관별 1억(원금+이자 합산, 2025-09-01 시행).
 * - 뺀 것(캡션·설명란용): 법인세 납부로 기업 돈 14조 8천억 원 이탈·은행의 개인 예금 유치(머니투데이 9/30), 은행채 1년물 4.17~4.18% > 예금금리 분석, 신협 4.35%.
 * - 대사에는 은행·상품 이름을 쓰지 않는다(지방은행·저축은행으로 일반화). 캡션에서만 사례로 쓰고 "추천·권유 아님" 고지.
 */

export const OWL_EP20_ASSEMBLY_SPEC = Object.freeze({
  specVersion: "owl_assembly_spec_v1",
  scriptStructureVersion: "owl_script_structure_v2",
  episode: 20,
  displayEpisode: 19,
  scriptType: "D_action_guide",
  geumbaksaHandoffTerm: null,
  sourceCandidate: "candidate-owl-ep20-deposit-ad-rate-vs-base-rate-2026-10-04",
  title: "광고 4% 예금, 기본금리부터 확인하세요",
  channelName: "경제번역소",
  characterDisplayName: "부엉박사",
  headerTitle: ["광고 4% 예금,", "기본금리부터", "확인하세요"],

  // ── 이미지·영상 연출 필드(품질 체계 v2, 규칙 15) ──
  hookType: "T4",
  imageCharacter: "owl3dv5",
  imagePrefix: "owl_ep20",
  // 소재(예금 금리 비교)에 맞는 공간 3곳. 직전 편들(청년 금융 라운지·정책 브리핑 스튜디오·은행 앱 신청 구역, 법률·주거 상담 창구)과 겹치지 않는다.
  // 배경에 글자·숫자·눈금·로고 없음, 큰 빈 벽면 없음.
  sceneBackgrounds: Object.freeze({
    A: {
      label: "황금 저금통 정원(도입·정의·정리·마무리)",
      image:
        "햇살이 드는 실내 정원. 부엉박사 뒤로 둥근 유리 천장 아래 큼직한 황금빛 돼지 저금통 조형물 두세 개와 동전 모양 징검돌이 깔린 작은 연못, 양옆에 큼직한 화분과 둥근 덤불이 넓게 펼쳐지고, 바닥은 밝은 원목 마루와 이끼색 러그. 큰 빈 벽면 없이 유리 천장과 식물, 저금통 조형물로 채운다. 따뜻한 앰버·연두 조명, 저폴리곤 단순화. 글자·숫자·간판·화면 없음.",
      videoStyle: "sunlit indoor garden with golden piggy-bank sculptures",
      videoStatics: "the round glass ceiling, the golden piggy-bank sculptures, the small pond with coin-shaped stepping stones, the large potted plants and round shrubs, and the light wooden floor",
    },
    B: {
      label: "금리 관측소(상황·수치 설명)",
      image:
        "둥근 금리 관측소. 부엉박사 뒤로 둥근 큰 창 세 개(창밖에 부드러운 저폴리곤 구름과 노을 하늘)와 놋쇠 관측 장비(망원경·구형 천체 모형·눈금 없는 둥근 계기판 몇 개)가 넓게 펼쳐지고, 가운데 낮은 원형 연단과 양옆 푹신한 둥근 의자, 바닥은 매끈한 남색 광택 바닥. 큰 빈 벽면 없이 창과 장비로 채운다. 은은한 네이비·앰버 조명, 저폴리곤 단순화. 계기판 눈금·글자·숫자·지도·지구본 그림 없음, 건물·랜드마크 없음.",
      videoStyle: "round interest-rate observatory",
      videoStatics: "the three large round windows with the soft low-poly sky, the brass telescope and spherical models, the round blank gauges, the low round podium, the round chairs, and the glossy navy floor",
    },
    C: {
      label: "저울 계산 작업실(우대 조건·계산·주의)",
      image:
        "밝은 저울 작업실. 부엉박사 뒤로 큼직한 놋쇠 천칭 저울 두 대와 쌓아 올린 금화 더미(동전에 글자·숫자 없음), 둥근 작업 테이블과 구슬 계산틀(구슬만, 숫자 없음)이 넓게 펼쳐지고, 양옆에 둥근 화분, 바닥은 따뜻한 원목 마루와 둥근 러그. 큰 빈 벽면 없이 저울과 선반, 금화 더미로 채운다. 따뜻한 골드·민트 조명, 저폴리곤 단순화. 글자·숫자·눈금·간판·화면 없음.",
      videoStyle: "bright balance-scale workshop",
      videoStatics: "the two large brass balance scales, the stacks of plain gold coins, the round work table, the bead abacus, the round potted plants, and the round rug",
    },
  }),

  scenesTimeline:
    "s1 훅 / s2 오프닝 / s3 정의 / s4 상황(지방은행 4.04%) / s5 상황(기본 3.54%+우대 0.5%p) / s6 상황(5대 은행 vs 저축은행) / s7 핵심질문 / s8 첫째 우대 조건 / s9 둘째 계산 시작 / s10 계산 예시 / s11 계산 결과 / s12 주의(예금자보호) / s13 정리+확인 / s14 확인 두 가지 / s15 저장+댓글",

  instagramCaptionHook: "예금금리가 연 4%까지 뛰었는데, 광고하는 4%가 다 내 금리는 아니야",
  instagramCaptionPoints: [
    "한 지방은행의 1년 예금이 연 4.04%로 2년 3개월 만에 4%를 넘었는데, 기본금리는 3.54%고 나머지 0.5%p는 우대 조건(처음 예금하는 고객·정보 안내 동의)을 채워야 붙어",
    "5대 은행 1년 예금은 3.5% 안팎이고, 저축은행은 인터넷으로 가입하면 12개월 최고 4.03%까지 나와",
    "7~8월 법인세를 내면서 기업 돈이 14조 8천억 원 빠지자 은행들이 개인 예금을 끌어오려고 금리를 올렸어",
    "5천만 원을 한 해 맡기면 3.55%는 세전 177만 5천 원, 4.03%는 201만 5천 원이야, 차이는 세전 24만 원이고 이자소득세를 떼도 약 20만 원 차이가 나",
    "저축은행도 예금자보호는 금융기관별 1억까지야(원금과 이자 합산)",
    "👉 가입하기 전에 우대 조건을 뺀 기본금리와, 한 곳에 넣어 둔 돈이 보호 한도를 넘는지 확인해봐",
    "※ 보도된 금리 사실만 전달한 거고 특정 상품 추천이나 가입 권유가 아니야, 금리는 매일 바뀌니 가입 전에 각 금융기관에서 확인해",
  ],
  instagramPriorityTags: [
    "예금금리",
    "기본금리",
    "우대금리",
    "저축은행",
    "예금자보호",
    "재테크",
    "금리비교",
    "이자계산",
    "경제공부",
    "경제뉴스",
    "경제상식",
    "부엉박사",
  ],

  emphasisTerms: ["기본금리", "최고금리", "우대", "부엉박사"],

  // 자막 경계 예외(QA가 경고로 남김): ① s8 "처음 예금하는 고객 우대라서, 아니면 기본금리만 받아" — 대사에 쉼표가 있는 절 경계라 자연스럽지만
  // 자막 단계에서 쉼표가 떨어져 규칙("결론이 / 아니라")이 오탐. ② s13 "광고 최고금리가 아니라" — 1,018px로 폭 한도 760px 안에 한 블록·두 줄 어느 쪽으로도
  // 규칙을 지켜 넣을 수 없어(대안인 "최고금리가 / 아니라" 줄바꿈도 금지 경계) 현 분할을 유지. 대사를 바꾸려면 TTS 재생성이 필요해 이 두 곳만 승인.
  captionBoundaryExceptions: Object.freeze([
    { left: "우대라서", right: "아니면", reason: "대사에 쉼표가 있는 절 경계(우대라서, 아니면) — 규칙은 쉼표 없는 '결론이 / 아니라'용(s8)" },
    { left: "최고금리가", right: "아니라", reason: "'광고 최고금리가 아니라'(1,018px)가 폭 한도 760px 안에서 규칙을 지키는 분할이 없음, TTS 재생성 회피(s13)" },
  ]),

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
      video: "owl_v2_ep20_s1_hook_motion.mp4",
      narration: "예금금리가 연 4%까지 뛰었어. 그런데 광고하는 4%가 다 내 금리는 아니거든.",
      imageBrief:
        "부엉이가 놀라고 궁금하다는 표정으로 '예금 연 4%'와 '다 내 금리?'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄, 카드에 그림·화살표 없이 글자만.",
      overlays: [],
      shot: "medium",
      bg: "A",
      motion: { type: "card2", action: "the character's expression is wide-eyed and curious, eyebrows raised, as if asking whether the advertised rate is really the rate you get; body and face move gently while the wings holding the card stay still.", mood: "posing an intriguing question to the viewer" },
    },
    {
      scene: 2,
      key: "s2_opening",
      role: "opening",
      video: "owl_v2_ep20_s2_opening_motion.mp4",
      narration: "안녕, 매일 경제 뉴스를 콕 집어 전해주는 부엉박사야.",
      imageBrief: "부엉이가 정면을 보며 한쪽 날개를 살짝 들어 인사하고 다른 날개는 자연스럽게 내린 채 담담하게 미소 짓는 포즈, 소품 없음.",
      overlays: [],
      shot: "wide",
      bg: "A",
      motion: { type: "open", action: "the character raises one wing slightly in a friendly greeting while the other wing hangs naturally, smiling calmly and warmly at the viewer.", mood: "warmly greeting the viewer" },
    },
    {
      scene: 3,
      key: "s3_concept",
      role: "one_line_definition",
      video: "owl_v2_ep20_s3_concept_motion.mp4",
      narration: "최고금리는 우대 조건을 다 채워야 받는 금리고, 조건 없이 받는 건 기본금리야.",
      imageBrief:
        "부엉이가 담담하게 설명하는 표정으로 '최고금리'와 '기본금리'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄, 카드에 그림·화살표 없이 글자만.",
      overlays: [],
      shot: "medium",
      bg: "A",
      motion: { type: "card2", action: "the character's expression is calm and explanatory with slight nods; only the face and body move while the wings holding the card stay still.", mood: "calmly explaining two terms" },
    },
    {
      scene: 4,
      key: "s4_situation_local_bank",
      role: "fact",
      video: "owl_v2_ep20_s4_situation_local_bank_motion.mp4",
      narration: "한 지방은행의 1년 예금이 4.04%로, 이렇게 높은 건 2년 3개월 만이야.",
      imageBrief:
        "부엉이가 확신에 찬 표정으로 '4.04%'와 '2년 3개월 만'이 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄, 카드에 그림·화살표 없이 글자만.",
      overlays: [],
      shot: "medium",
      bg: "B",
      motion: { type: "card2", action: "the character's expression is confident and informative with slight nods; only the face and body move while the wings holding the card stay still.", mood: "confidently announcing a notable rate" },
    },
    {
      scene: 5,
      key: "s5_situation_base",
      role: "fact",
      video: "owl_v2_ep20_s5_situation_base_motion.mp4",
      narration: "그런데 기본금리는 3.54%고, 나머지 0.5%p는 우대 조건을 채워야 붙어.",
      imageBrief:
        "부엉이가 또렷하고 신중한 표정으로 '기본 3.54%'와 '우대 0.5%p'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄, 카드에 그림·화살표 없이 글자만.",
      overlays: [],
      shot: "medium",
      bg: "B",
      motion: { type: "card2", action: "the character's expression is clear and slightly cautious with a small head tilt, as if revealing the catch; only the face and body move while the wings holding the card stay still.", mood: "clearly revealing how the rate is built up" },
    },
    {
      scene: 6,
      key: "s6_situation_compare",
      role: "fact",
      video: "owl_v2_ep20_s6_situation_compare_motion.mp4",
      narration: "5대 은행 예금은 3.5% 안팎이고, 저축은행은 인터넷 가입 시 최고 4.03%까지 나와.",
      imageBrief:
        "부엉이가 양쪽 날개를 좌우로 펼쳐 두 가지를 견주듯 보여주며 또렷하고 차분하게 설명하는 자세, 소품 없음.",
      overlays: [],
      shot: "wide",
      bg: "B",
      motion: { type: "open", action: "the character spreads both wings outward to either side, as if weighing two options against each other, with a clear and calm explanatory expression; no props are held.", mood: "calmly comparing two kinds of banks" },
    },
    {
      scene: 7,
      key: "s7_core_q",
      role: "core_question",
      video: "owl_v2_ep20_s7_core_q_motion.mp4",
      narration: "그럼 나는 어떻게 해야 할까? 답부터 말하면, 광고 최고금리 말고 기본금리와 우대 조건부터 확인해야 해.",
      imageBrief:
        "부엉이가 갸웃하다 확신에 찬 표정으로 '기본금리'와 '우대 조건부터'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄, 카드에 그림·화살표 없이 글자만.",
      overlays: [],
      shot: "medium",
      bg: "B",
      motion: { type: "card2", action: "the character's expression starts curious with a slight head tilt and turns confident and knowing; only the face and body move while the wings holding the card stay still.", mood: "confidently giving the key answer" },
    },
    {
      scene: 8,
      key: "s8_point1_conditions",
      role: "evidence",
      video: "owl_v2_ep20_s8_point1_conditions_motion.mp4",
      narration: "첫째, 우대 조건을 봐. 쉽게 풀면, 처음 예금하는 고객 우대라서, 아니면 기본금리만 받아.",
      imageBrief:
        "부엉이가 또렷하게 설명하는 표정으로 '우대 조건'과 '처음 예금 고객'이 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄(둘째 줄이 길어도 카드 밖으로 넘치지 않게), 카드에 그림·화살표 없이 글자만.",
      overlays: [],
      shot: "medium",
      bg: "C",
      motion: { type: "card2", action: "the character's expression is clear and friendly with slight nods, as if explaining a small condition; only the face and body move while the wings holding the card stay still.", mood: "clearly explaining the preferential condition" },
    },
    {
      scene: 9,
      key: "s9_point2_intro",
      role: "evidence",
      video: "owl_v2_ep20_s9_point2_intro_motion.mp4",
      narration: "둘째, 계산해 보자. 쉽게 풀면, 5천만 원을 한 해 맡길 때 이자를 비교해 볼게.",
      imageBrief:
        "부엉이가 한쪽 날개로 뒤쪽의 큼직한 놋쇠 천칭 저울을 가리키며 밝고 또렷하게 설명하는 자세, 다른 날개는 자연스럽게 내림, 소품 없음.",
      overlays: [],
      shot: "wide",
      bg: "C",
      motion: { type: "open", action: "the character gestures with one wing toward the large brass balance scale behind it, as if about to compare two amounts, with a bright and clear expression while the other wing hangs naturally; no props are held.", mood: "brightly starting a comparison" },
    },
    {
      scene: 10,
      key: "s10_calc",
      role: "evidence",
      video: "owl_v2_ep20_s10_calc_motion.mp4",
      narration: "5천만 원이면 3.55%는 세전 177만 5천 원, 4.03%는 201만 5천 원이야.",
      imageBrief:
        "부엉이가 밝고 또렷한 표정으로 '5천만 원 한 해'와 '3.55 vs 4.03%'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄(둘째 줄이 길어도 카드 밖으로 넘치지 않게), 카드에 그림·화살표 없이 글자만.",
      overlays: [],
      shot: "medium",
      bg: "C",
      motion: { type: "card2", action: "the character's expression is bright and clear with slight nods, as if working through a simple calculation; only the face and body move while the wings holding the card stay still.", mood: "brightly walking through a calculation example" },
    },
    {
      scene: 11,
      key: "s11_calc_result",
      role: "evidence",
      video: "owl_v2_ep20_s11_calc_result_motion.mp4",
      narration: "차이는 세전 24만 원이고, 이자소득세를 떼도 약 20만 원 차이가 나.",
      imageBrief:
        "부엉이가 눈을 크게 뜨고 눈썹을 올려 놀란 듯 확신하는 표정으로 한쪽 날개를 가슴 앞으로 들어 보이는 자세, 다른 날개는 자연스럽게 내림, 소품 없음.",
      overlays: [],
      shot: "close",
      bg: "C",
      motion: { type: "open", action: "the character widens its eyes and raises its eyebrows in a surprised yet confident look while lifting one wing in front of its chest, as if to say the gap is bigger than expected; the other wing hangs naturally; no props are held.", mood: "conveying that the gap is bigger than expected" },
    },
    {
      scene: 12,
      key: "s12_caution",
      role: "condition",
      video: "owl_v2_ep20_s12_caution_motion.mp4",
      narration: "그렇다고 광고 금리만 보고 큰돈을 옮기면 안 돼. 저축은행도 예금자보호는 금융기관별 1억까지거든.",
      imageBrief:
        "부엉이가 신중하고 단호한 표정으로 '큰돈 옮기기 전'과 '보호 한도 1억'이 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄, 카드에 그림·화살표 없이 글자만.",
      overlays: [],
      shot: "medium",
      bg: "C",
      motion: { type: "card2", action: "the character's expression is careful and firm, eyebrows slightly furrowed; only the face and body move while the wings holding the card stay still.", mood: "carefully noting a limit before moving big money" },
    },
    {
      scene: 13,
      key: "s13_summary",
      role: "action",
      video: "owl_v2_ep20_s13_summary_motion.mp4",
      narration: "콕 집어 정리하면, 예금은 광고 최고금리가 아니라 내가 받을 수 있는 금리로 비교해야 해. 지금 먼저 확인할 건 두 가지야.",
      imageBrief:
        "부엉이가 확신에 찬 표정으로 '광고 말고'와 '내 금리로 비교'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄, 카드에 그림·화살표 없이 글자만.",
      overlays: [],
      shot: "medium",
      bg: "A",
      motion: { type: "card2", action: "the character's expression is confident and knowing with slight nods, and it briefly raises its head as if counting two things; only the face and body move while the wings holding the card stay still.", mood: "confidently delivering the one-line summary" },
    },
    {
      scene: 14,
      key: "s14_check_two",
      role: "action",
      video: "owl_v2_ep20_s14_check_two_motion.mp4",
      narration: "하나는 우대 조건을 뺀 기본금리, 다른 하나는 한 곳에 넣어 둔 돈이 보호 한도를 넘는지 보면 돼.",
      imageBrief:
        "부엉이가 한쪽 날개를 들어 두 가지를 하나씩 짚어 가듯 또렷하고 친근하게 설명하는 자세, 다른 날개는 자연스럽게 내림, 소품 없음.",
      overlays: [],
      shot: "wide",
      bg: "A",
      motion: { type: "open", action: "the character lifts one wing and ticks off two points one after the other with a clear, friendly explanatory expression while the other wing hangs naturally; no props are held.", mood: "clearly pointing out the two things to check" },
    },
    {
      scene: 15,
      key: "s15_save",
      role: "save",
      video: "owl_v2_ep20_s15_save_motion.mp4",
      narration: "이 두 가지는 저장해 두고, 가입하기 전에 다시 확인해. 궁금한 경제 뉴스는 댓글로 남겨줘.",
      imageBrief: "부엉이가 밝은 미소로 한쪽 날개를 가볍게 흔들고 다른 날개는 자연스럽게 내린 마무리 포즈, 소품 없이 빈 날개.",
      overlays: [],
      shot: "wide",
      bg: "A",
      motion: { type: "open", action: "the character smiles brightly and waves one wing lightly in a friendly goodbye while the other wing hangs naturally relaxed; no props are held.", mood: "warmly saying goodbye and inviting comments" },
    },
  ]),
});

/** 장면 키로 스펙을 찾는다. */
export function findOwlEp20Scene(key) {
  return OWL_EP20_ASSEMBLY_SPEC.scenes.find((s) => s.key === key) ?? null;
}
