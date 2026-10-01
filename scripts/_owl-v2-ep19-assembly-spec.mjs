/**
 * 부엉박사 조립 스펙 표시 18편(파일 번호 19, v2 + 품질 체계 v2 첫 부엉 신규편) — 청년미래적금 2차 신청.
 *
 * 파일 이름: 표시 18편 = 파일 번호 19. `_owl-v2-ep18-*`는 전세사기(표시 17편)가 이미 쓰고 있어 충돌하므로 ep19로 만든다.
 * 배포: Owner 확정 2026-10-03(신청 시작 10/7의 4일 전). 훅의 "열흘"·날짜는 절대 날짜라 10/3 게시에 맞다.
 *
 * 기준: _ai/CURRENT_STANDARDS.md §1 부엉 v2, 규칙 14(배경 2~3구역)·15(품질 체계 v2)·17(훅)·26~28. 유형 D형(나는 어떻게 해야 하나).
 * 대본 v12: 14씬·546자(검사기 반드시 수정 0, 확인 권장 1 = 글자 수 추정치 <560). 씬 수는 Owner 규칙이 아니다(규칙 28). 대본 초안 문서: _ai/owl-ep18-youth-savings-script-draft.md.
 * 담당 부엉박사(시민 입장, 규칙 22) · 레인 deadline_benefit · 영역 savings_deposit · 제목 모양 countdown.
 *
 * ★ 핵심 팩트(2026-09-30 교차 확인, 2026-10-01 갈아타기 재확인)★
 * - 기여금: 일반형 = 총급여 6,000만 원 이하 → 납입금의 6%, 우대형 = 총급여 3,600만 원 이하 중소기업 재직자 등 → 12%,
 *   총급여 6,000만 원 초과~7,500만 원 이하는 가입은 되나 기여금 미대상, 월 납입 최대 50만 원, 3년 만기 [금융위원회 보도자료 fsc.go.kr/no010101/86767, 뉴시스 9/30].
 * - 가입 소득 상한 총급여 7,500만 원(또는 연매출 3억 원 이하 소상공인 + 가구 중위소득 200% 이하) [정책브리핑 newsId=148971997].
 * - 2차 신청 10/7~16, 7~8일 출생연도 끝자리 홀짝제(이후 누구나) [정책브리핑·뉴시스].
 * - 유형(일반소득자·중소기업 재직자·소상공인) 직접 선택 = 1차 자격 심사 오류 보완 조치(복수 보도).
 * - 청년도약계좌 갈아타기: 청년미래적금 가입 신청·심사 통과 후 새 계좌 개설 → 그 뒤 기존 계좌를 "청년미래적금 가입 목적 특별중도해지"; 기존 계좌 먼저 해지하면 전환 불가 [뉴시스 9/16, 데일리안, CBC뉴스 — 2026-10-01 WebSearch]. 납입분 정부 기여금·비과세 혜택은 유지(대본엔 미사용).
 * - 계산 예시 1,800만 원·108만 원·216만 원은 비율×월 50만 원×36개월의 산술 결과(공식 예시 아님 → "만기까지 채우면" 조건 표기).
 * - 뺀 것: "연 최고 19.4%", 우대형 15%·지방 중소기업 25% 상향(예산 통과 조건), 1차 가입자 수, 사전 심사·이의신청 일정(잠정안 1건).
 */

export const OWL_EP19_ASSEMBLY_SPEC = Object.freeze({
  specVersion: "owl_assembly_spec_v1",
  scriptStructureVersion: "owl_script_structure_v2",
  episode: 19,
  displayEpisode: 18,
  scriptType: "D_action_guide",
  geumbaksaHandoffTerm: null,
  sourceCandidate: "candidate-owl-ep19-youth-future-savings-2nd-2026-10-07",
  title: "청년미래적금 2차 신청 10월 7일, 유형부터 골라야 한다",
  channelName: "경제번역소",
  characterDisplayName: "부엉박사",
  headerTitle: ["청년미래적금 2차", "10월 7일 신청 시작"],

  // ── 이미지·영상 연출 필드(품질 체계 v2, 규칙 15) ──
  hookType: "T3",
  imageCharacter: "owl3dv5",
  imagePrefix: "owl_ep19",
  // 소재(청년 적금·신청)에 맞는 공간 3곳. 직전 편(법률·주거 상담 창구 등)과 겹치지 않는다. 배경에 글자·숫자·로고 없음.
  sceneBackgrounds: Object.freeze({
    A: {
      label: "청년 금융 라운지(도입·개념·요약·마무리)",
      image:
        "청년들이 쉬어 가는 밝은 금융 라운지. 부엉박사 뒤로 큼직한 곡면 통유리창(창밖에 매끈한 저폴리곤 도시 스카이라인)이 넓게 펼쳐지고, 앞쪽에 둥근 원목 테이블 하나와 푹신한 둥근 의자 몇 개, 양옆에 큼직한 화분, 바닥은 밝은 원목 마루. 큰 빈 벽면 없이 유리창과 화분으로 채운다. 따뜻한 크림·민트 조명. 글자가 적힌 간판·포스터·화면 없음.",
      videoStyle: "bright youth finance lounge",
      videoStatics: "the large curved glass window with the low-poly city skyline, the round wooden table, the round cushioned chairs, the large potted plants, and the light wooden floor",
    },
    B: {
      label: "정책 브리핑 스튜디오(기관 발표·제도 변경·소득 구간)",
      image:
        "정부 정책 브리핑 스튜디오. 부엉박사 뒤로 천장까지 닿는 큼직한 곡면 스크린 벽(작업복 직장인·정장 사무직·앞치마 가게 주인 세 사람의 단순한 실루엣 아이콘만 은은하게 떠 있는 저폴리곤 그래픽, 글자·숫자 없음)이 넓게 펼쳐지고, 앞쪽에 낮은 원형 연단 하나와 둥근 의자 몇 개, 바닥은 매끈한 광택 바닥. 은은한 네이비·스카이블루 조명. 스크린 벽 안에는 세 사람 아이콘 외에 건물·랜드마크·국회의사당·도시 풍경·지구본 그림을 넣지 않고 천장도 단순한 원형 조명만. 글자가 적힌 표지판·깃발·서류 없음.",
      videoStyle: "government policy briefing studio",
      videoStatics: "the large curved screen wall with three simple silhouette icons, the low round podium, the round chairs, and the glossy floor",
    },
    C: {
      label: "은행 앱 신청 구역(신청 방법·갈아타기·주의)",
      image:
        "밝은 은행 신청 구역. 부엉박사 뒤로 길게 굽은 상담 카운터와 큼직한 유리 칸막이(칸막이에 글자 없음)가 넓게 펼쳐지고, 카운터 위에 화면이 꺼진 둥근 태블릿 거치대 몇 개, 양옆에 둥근 화분, 바닥에 둥근 러그. 큰 빈 벽면 없이 카운터와 유리 칸막이로 채운다. 따뜻한 민트·골드 조명. 글자가 적힌 창구 표지·포스터·화면 없음.",
      videoStyle: "bright bank application counter area",
      videoStatics: "the long curved service counter, the large glass partitions, the dark tablet stands, the round potted plants, and the round rug",
    },
  }),

  scenesTimeline:
    "s1 훅 / s2 오프닝 / s3 개념 / s4 상황(기관·날짜) / s5 상황(기존 vs 변경) / s6 핵심질문 / s7 첫째 대상 / s8 둘째 기여금 / s9 계산 예시 / s10 셋째 방법 / s11 넷째 갈아타기 / s12 주의 / s13 정리+확인 / s14 저장+댓글",

  instagramCaptionHook: "적금 없는 만 34세 이하라면, 열흘 안에 신청 못 하면 정부 돈을 놓쳐",
  instagramCaptionPoints: [
    "청년미래적금 2차 신청이 10월 7일부터 16일까지야, 금융위원회가 발표했어",
    "1차 때 심사 오류가 있어서 이번부터는 일반소득자, 중소기업 재직자, 소상공인 중에서 유형을 직접 골라",
    "만 19세 이상 총급여 7,500만 원 이하면 가입할 수 있어",
    "정부 기여금은 일반형이 낸 돈의 6%, 중소기업 재직자 같은 우대형이 12%야",
    "월 50만 원씩 만기까지 채우면 원금 1,800만 원, 기여금은 일반형 108만 원, 우대형 216만 원 정도야(단순 계산)",
    "첫 이틀(10월 7~8일)은 출생연도 끝자리 홀짝제로 받아",
    "청년도약계좌를 갖고 있다면 갈아타기도 돼, 새 계좌부터 열어야 하니까 기존 계좌 해지부터 하면 안 돼",
    "총급여가 6,000만 원을 넘으면 가입은 돼도 기여금은 없어",
    "👉 신청하기 전에 내 총급여 구간이랑 내가 고를 유형부터 확인해봐",
  ],
  instagramPriorityTags: [
    "청년미래적금",
    "청년미래적금2차",
    "청년적금",
    "청년도약계좌",
    "적금",
    "정부지원",
    "청년정책",
    "금융위원회",
    "재테크",
    "경제공부",
    "경제뉴스",
    "경제상식",
    "부엉박사",
  ],

  emphasisTerms: ["청년미래적금", "기여금", "유형", "부엉박사"],

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
      video: "owl_v2_ep19_s1_hook_motion.mp4",
      narration: "이번에 바뀐 청년미래적금, 적금 없는 만 34세 이하는 알고 있었어? 열흘 안에 신청 못 하면 정부 돈을 놓쳐.",
      imageBrief:
        "부엉이가 놀라고 궁금하다는 표정으로 '청년미래적금'과 '신청 열흘 전'이 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄, 카드에 그림·화살표 없이 글자만.",
      overlays: [],
      shot: "medium",
      bg: "A",
      motion: { type: "card2", action: "the character's expression is wide-eyed and curious, eyebrows raised, as if asking the viewer whether they knew about the change; body and face move gently while the wings holding the card stay still.", mood: "posing an intriguing question to the viewer" },
    },
    {
      scene: 2,
      key: "s2_opening",
      role: "opening",
      video: "owl_v2_ep19_s2_opening_motion.mp4",
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
      video: "owl_v2_ep19_s3_concept_motion.mp4",
      narration: "청년미래적금은 청년이 넣은 돈에 정부가 기여금을 얹어주고, 이자엔 세금도 안 붙는 3년짜리 적금이거든.",
      imageBrief:
        "부엉이가 담담하게 설명하는 표정으로 '기여금 + 비과세'가 한 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 한 줄, 카드에 그림·화살표 없이 글자만.",
      overlays: [],
      shot: "medium",
      bg: "A",
      motion: { type: "card1", action: "the character's expression is calm and explanatory with slight nods; only the face and body move while the wings holding the card stay still.", mood: "calmly explaining what the product is" },
    },
    {
      scene: 4,
      key: "s4_situation_agency",
      role: "fact",
      video: "owl_v2_ep19_s4_situation_agency_motion.mp4",
      narration: "금융위원회가 2차 신청을 10월 7일부터 16일까지 받는다고 발표했어, 은행 앱에서 하면 돼.",
      imageBrief:
        "부엉이가 확신에 찬 표정으로 '10월 7일부터'와 '16일까지'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄, 카드에 그림·화살표 없이 글자만.",
      overlays: [],
      shot: "medium",
      bg: "B",
      motion: { type: "card2", action: "the character's expression is confident and informative with slight nods; only the face and body move while the wings holding the card stay still.", mood: "confidently announcing the application dates" },
    },
    {
      scene: 5,
      key: "s5_situation_change",
      role: "fact",
      video: "owl_v2_ep19_s5_situation_change_motion.mp4",
      narration: "1차 때 심사 오류가 있어서, 이번부터는 일반소득자, 중소기업 재직자, 소상공인 중에서 유형을 직접 골라.",
      imageBrief:
        "부엉이가 한쪽 날개로 뒤쪽 스크린 벽의 세 사람 실루엣 아이콘(직장인·사무직·가게 주인)을 가리키며 차분하고 또렷하게 설명하는 자세, 다른 날개는 자연스럽게 내림, 소품 없음.",
      overlays: [],
      shot: "wide",
      bg: "B",
      motion: { type: "open", action: "the character gestures with one wing toward the large screen wall behind it, as if pointing out three different types, with a clear, explanatory expression while the other wing hangs naturally; no props are held.", mood: "clearly explaining that people now choose their own type" },
    },
    {
      scene: 6,
      key: "s6_core_q",
      role: "core_question",
      video: "owl_v2_ep19_s6_core_q_motion.mp4",
      narration: "그럼 나는 어떻게 해야 할까? 답부터 말하면, 내 소득 구간과 가구 소득부터 알고 유형을 고르면 돼.",
      imageBrief:
        "부엉이가 갸웃하다 확신에 찬 표정으로 '내 소득 구간'과 '유형 고르기'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄, 카드에 그림·화살표 없이 글자만.",
      overlays: [],
      shot: "medium",
      bg: "B",
      motion: { type: "card2", action: "the character's expression starts curious with a slight head tilt and turns confident and knowing; only the face and body move while the wings holding the card stay still.", mood: "confidently giving the key answer" },
    },
    {
      scene: 7,
      key: "s7_point1_target",
      role: "evidence",
      video: "owl_v2_ep19_s7_point1_target_motion.mp4",
      narration: "첫째, 대상이야. 만 19세 이상에 총급여 7,500만 원 이하, 쉽게 풀면 대학생도 직장인도 들어와.",
      imageBrief:
        "부엉이가 또렷하게 설명하는 표정으로 '만 19세 이상'과 '7,500만 원 이하'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄(둘째 줄이 길어도 카드 밖으로 넘치지 않게), 카드에 그림·화살표 없이 글자만.",
      overlays: [],
      shot: "medium",
      bg: "B",
      motion: { type: "card2", action: "the character's expression is clear and friendly with slight nods, as if reassuring that many people qualify; only the face and body move while the wings holding the card stay still.", mood: "clearly explaining who qualifies" },
    },
    {
      scene: 8,
      key: "s8_point2_bonus",
      role: "evidence",
      video: "owl_v2_ep19_s8_point2_bonus_motion.mp4",
      narration: "둘째, 얹어주는 돈이야. 일반형은 낸 돈의 6퍼센트를, 중소기업 재직자 같은 우대형은 12퍼센트를 줘.",
      imageBrief:
        "부엉이가 확신에 찬 표정으로 '일반형 6%'와 '우대형 12%'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄, 카드에 그림·화살표 없이 글자만.",
      overlays: [],
      shot: "medium",
      bg: "C",
      motion: { type: "card2", action: "the character's expression is confident and informative with slight nods; only the face and body move while the wings holding the card stay still.", mood: "confidently presenting the two rates" },
    },
    {
      scene: 9,
      key: "s9_calc",
      role: "evidence",
      video: "owl_v2_ep19_s9_calc_motion.mp4",
      narration: "월 50만 원씩 만기까지 채우면 1,800만 원, 쉽게 풀면 일반형 108만 원, 우대형 216만 원을 더 받아.",
      imageBrief:
        "부엉이가 밝고 또렷한 표정으로 '월 50만 원'과 '만기 1,800만'이 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄, 카드에 그림·화살표 없이 글자만.",
      overlays: [],
      shot: "medium",
      bg: "C",
      motion: { type: "card2", action: "the character's expression is bright and clear with slight nods, as if working through a simple calculation; only the face and body move while the wings holding the card stay still.", mood: "brightly walking through a calculation example" },
    },
    {
      scene: 10,
      key: "s10_point3_method",
      role: "evidence",
      video: "owl_v2_ep19_s10_point3_method_motion.mp4",
      narration: "셋째, 방법이야. 첫 이틀은 출생연도 끝자리 홀짝제로 받아, 쉽게 풀면 이틀만 줄을 나눠 세우는 거지.",
      imageBrief:
        "부엉이가 양쪽 날개를 펼쳐 두 갈래로 나뉜 길을 안내하듯 보여주며 밝고 친근하게 설명하는 자세, 소품 없음.",
      overlays: [],
      shot: "wide",
      bg: "C",
      motion: { type: "open", action: "the character spreads both wings outward to either side, as if showing two separate lines, with a bright, friendly explanatory expression; no props are held.", mood: "brightly explaining that people are split into two groups" },
    },
    {
      scene: 11,
      key: "s11_point4_switch",
      role: "evidence",
      video: "owl_v2_ep19_s11_point4_switch_motion.mp4",
      narration: "넷째, 청년도약계좌가 있다면 갈아타기도 돼, 새 계좌부터 열어야 하니까 기존 계좌 해지부터 하면 안 돼.",
      imageBrief:
        "부엉이가 한쪽 날개를 들어 멈추라는 듯 손짓하며 걱정스럽고 단호한 표정을 짓는 포즈, 다른 날개는 자연스럽게 내림, 소품 없음.",
      overlays: [],
      shot: "close",
      bg: "C",
      motion: { type: "open", action: "the character raises one wing in a gentle stop gesture with a worried yet firm expression, slightly shaking its head, while the other wing hangs naturally; no props are held.", mood: "firmly warning not to cancel the old account first" },
    },
    {
      scene: 12,
      key: "s12_caution",
      role: "condition",
      video: "owl_v2_ep19_s12_caution_motion.mp4",
      narration: "다만 무작정 골라서 넣으면 안 돼, 총급여가 6천만 원을 넘으면 가입은 돼도 기여금이 사라지거든.",
      imageBrief:
        "부엉이가 신중하고 단호한 표정으로 '총급여 6천만 원'과 '넘으면 기여금 0'이 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄, 카드에 그림·화살표 없이 글자만.",
      overlays: [],
      shot: "medium",
      bg: "B",
      motion: { type: "card2", action: "the character's expression is careful and firm, eyebrows slightly furrowed; only the face and body move while the wings holding the card stay still.", mood: "carefully noting a condition that removes the benefit" },
    },
    {
      scene: 13,
      key: "s13_summary",
      role: "action",
      video: "owl_v2_ep19_s13_summary_motion.mp4",
      narration: "콕 집어 정리하면, 소득 구간마다 정부가 주는 돈이 달라져. 먼저 확인할 건 두 가지야, 내 총급여 구간이랑 고를 유형이야.",
      imageBrief:
        "부엉이가 확신에 찬 표정으로 '소득 구간마다'와 '기여금이 달라'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄, 카드에 그림·화살표 없이 글자만.",
      overlays: [],
      shot: "medium",
      bg: "A",
      motion: { type: "card2", action: "the character's expression is confident and knowing with slight nods, and it briefly raises its head as if counting two things; only the face and body move while the wings holding the card stay still.", mood: "confidently delivering the one-line summary" },
    },
    {
      scene: 14,
      key: "s14_save",
      role: "save",
      video: "owl_v2_ep19_s14_save_motion.mp4",
      narration: "이 두 가지는 저장해 두고, 신청하기 전에 다시 확인해. 궁금한 제도는 댓글로 남겨줘.",
      imageBrief: "부엉이가 밝은 미소로 한쪽 날개를 가볍게 흔들고 다른 날개는 자연스럽게 내린 마무리 포즈, 소품 없이 빈 날개.",
      overlays: [],
      shot: "wide",
      bg: "A",
      motion: { type: "open", action: "the character smiles brightly and waves one wing lightly in a friendly goodbye while the other wing hangs naturally relaxed; no props are held.", mood: "warmly saying goodbye and inviting comments" },
    },
  ]),
});

/** 장면 키로 스펙을 찾는다. */
export function findOwlEp19Scene(key) {
  return OWL_EP19_ASSEMBLY_SPEC.scenes.find((s) => s.key === key) ?? null;
}
