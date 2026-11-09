/**
 * 부엉박사 조립 스펙 표시 20편(파일 번호 21, v2 + 품질 체계 v2) — 시중은행 정보 유출, 내 정보 지키는 법(금융사기 예방).
 *
 * 파일 이름: 표시 20편 = 파일 번호 21(표시 19편 예금이 파일 ep20). 배포: Owner 지시 시점(2026-10-05 월 예정, 제안 금지).
 * 기준: _ai/CURRENT_STANDARDS.md §1 부엉 v2, 규칙 14(배경 2~3구역)·15(품질 체계 v2)·17(훅)·26~29. 유형 D형(나는 어떻게 해야 하나).
 * 대본 v5: 16씬·598자(검사기 반드시 수정 0, 확인 권장 4, 최대 씬 8.7초 추정/TTS 실측 8.45초). 새 독자 읽기 점검 통과(_ai/owl-ep21-cold-read.md).
 * 대본 초안 문서: _ai/owl-ep21-leak-script-draft.md. 담당 부엉박사(시민 입장, 규칙 22) · 레인 fraud_prevention · 영역 other · 제목 모양 question.
 *
 * ★ 핵심 팩트(2026-10-02 원문·복수 매체 확인, 진행형 사건 — 게시 직전 재확인)★
 * - 신한은행: 약 2만 5천 명(이름·전화번호·연소득·산출한도 등, 주민번호 66건·CI 97건 포함). 외부 비인가자가 대출모집인용 서비스의 인증 절차를 우회. 뱅킹 로그인 서비스는 대상 아님. 홈페이지 고객센터 '고객정보 유출 조회' 메뉴에서 확인, 피해 전액 보상 [파이낸셜뉴스 10/1, 한국일보·세계일보·서울경제].
 * - 국민은행 119명(직원용 모바일 업무 지원 시스템에 비정상 외부 접근), 하나은행 89명(영업지원시스템 외부 접근, 주민번호·성명·주소·이메일·전화·휴대전화·직장명 7항목), 부산은행 외주 개발직원 11명 [아시아경제·이투데이·SBS Biz 10/2]. 우리·농협은 공격 시도만 있고 유출은 확인되지 않음(대사에 안 씀).
 * - 경찰 10/2 내사(수사 전 조사) 착수, 금융위 긴급 회의·은행·카드업권 자체 보안 점검 지시 [이투데이·아시아경제·조선 10/2].
 * - 스미싱 링크 클릭 금지·지급정지 요청·경찰·금감원 신고는 금감원의 일반 소비자 안내 기반(이번 사건 발언 아님).
 * - 대사에는 은행 실명을 쓴다(은행이 직접 발표한 피해 사실, Owner 2026-10-02 "문제 없으면 공개" 위임 — 공개 발표 사실이라 공개). 단 21편(대환)은 비공개.
 */

const CARD_COMPOSITION =
  "구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄, 카드에 그림·화살표 없이 글자만.";

const card = (look, line1, line2, longSecond = false) =>
  `부엉이가 ${look} '${line1}'와 '${line2}'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. ${CARD_COMPOSITION.replace("굵고 크게 두 줄,", longSecond ? "굵고 크게 두 줄(둘째 줄이 길어도 카드 밖으로 넘치지 않게)," : "굵고 크게 두 줄,")}`;

const cardMotion = (action, mood) => ({
  type: "card2",
  action: `${action}; only the face and body move while the wings holding the card stay still.`,
  mood,
});
const openMotion = (action, mood) => ({
  type: "open",
  action: `${action}; no props are held.`,
  mood,
});

export const OWL_EP21_ASSEMBLY_SPEC = Object.freeze({
  specVersion: "owl_assembly_spec_v1",
  scriptStructureVersion: "owl_script_structure_v2",
  episode: 21,
  displayEpisode: 20,
  scriptType: "D_action_guide",
  geumbaksaHandoffTerm: null,
  sourceCandidate: "candidate-owl-ep21-bank-leak-protect-info-2026-10-05",
  title: "시중은행 정보 유출, 내 정보 지키는 법",
  channelName: "경제번역소",
  characterDisplayName: "부엉박사",
  headerTitle: ["은행 정보 유출,", "내 정보", "지키는 법"],

  // ── 이미지·영상 연출 필드(품질 체계 v2, 규칙 15) ──
  hookType: "T2",
  imageCharacter: "owl3dv5",
  imagePrefix: "owl_ep21",
  // 소재(은행 보안·정보 유출)에 맞는 공간 3곳. 직전 편들(금리 관측소·저울 작업실·황금 저금통 정원 등)과 겹치지 않는다.
  // 배경에 글자·숫자·눈금·로고 없음, 큰 빈 벽면 없음.
  sceneBackgrounds: Object.freeze({
    A: {
      label: "보안 금고 홀(도입·정리·마무리)",
      image:
        "밝은 은행 금고 홀. 부엉박사 뒤로 둥근 대형 금고 문(손잡이 바퀴만 있고 숫자·글자·눈금 없음)과 열쇠 모양만 걸린 열쇠 걸이판, 양옆에 큼직한 화분과 둥근 벤치가 넓게 펼쳐지고, 바닥은 따뜻한 베이지 대리석과 둥근 러그. 큰 빈 벽면 없이 금고 문과 열쇠판, 식물로 채운다. 따뜻한 앰버·크림 조명, 저폴리곤 단순화. 글자·숫자·간판·화면 없음.",
      videoStyle: "bright bank vault hall",
      videoStatics: "the large round vault door with a plain wheel handle, the key rack with plain key shapes, the large potted plants, the round benches, and the beige marble floor with a round rug",
    },
    B: {
      label: "방범 관제실(사건 상황 설명)",
      image:
        "둥근 방범 관제실. 부엉박사 뒤로 둥근 대형 모니터 여러 대(화면은 글자·숫자·그래프 없는 단색 파랑 물결 무늬만), 눈금 없는 레이더 모양 둥근 판, 둥근 경광등 램프 두세 개가 넓게 펼쳐지고, 양옆 둥근 의자, 바닥은 매끈한 남색 광택 바닥. 큰 빈 벽면 없이 모니터와 장비로 채운다. 은은한 네이비·청록 조명, 저폴리곤 단순화. 화면 속 글자·숫자·지도·그래프 없음.",
      videoStyle: "round security monitoring room",
      videoStatics: "the large round monitors showing only plain blue wave patterns, the blank round radar plates, the round beacon lamps, the round chairs, and the glossy navy floor",
    },
    C: {
      label: "자물쇠 공방(대처법·주의)",
      image:
        "밝은 자물쇠 공방. 부엉박사 뒤로 큼직한 놋쇠 자물쇠와 열쇠 모형이 걸린 선반, 무늬만 있는 둥근 방패 장식판 두 개, 둥근 작업대가 넓게 펼쳐지고, 양옆에 둥근 화분, 바닥은 따뜻한 원목 마루와 둥근 러그. 큰 빈 벽면 없이 선반과 방패, 작업대로 채운다. 따뜻한 골드·민트 조명, 저폴리곤 단순화. 글자·숫자·간판·화면 없음.",
      videoStyle: "bright padlock workshop",
      videoStatics: "the shelves with large brass padlocks and plain key models, the two round shield plaques with plain patterns, the round work table, the round potted plants, and the warm wooden floor with a round rug",
    },
  }),

  scenesTimeline:
    "s1 훅 / s2 오프닝 / s3 상황(신한 유출 항목) / s4 상황(신한·국민·하나 규모) / s5 상황(하나 경위·항목) / s6 상황(경찰·부산은행) / s7 상황(금융위 점검) / s8 핵심질문 / s9 첫째 은행 안내 / s10 둘째 사칭 의심 / s11 셋째 비밀번호·이중 인증 / s12 주의(링크) / s13 신고·지급정지 / s14 정리+확인 / s15 확인 두 가지 / s16 저장+댓글",

  instagramCaptionHook: "은행 네 곳에서 고객 정보가 털렸어, 내 정보는 괜찮을까?",
  instagramCaptionPoints: [
    "신한은행은 약 2만 5천 명의 이름·전화번호·연소득·산출한도 등이 유출됐다고 발표했어, 대출모집인용 서비스 인증을 외부에서 우회했고 은행 앱 로그인 서비스는 대상이 아니라고 해",
    "국민은행 119명, 하나은행 89명(주민번호·주소·이메일 등), 부산은행은 외주 직원 11명의 정보가 나왔어",
    "경찰은 10월 2일 수사 전 조사(내사)에 들어갔고, 금융위원회는 은행·카드사에 자체 보안 점검을 지시했어",
    "해당 고객에게는 은행이 따로 알려주고, 신한은행은 홈페이지 고객센터에서 유출 여부를 직접 조회할 수 있어",
    "유출 확인을 내세운 문자 링크는 누르지 말고 은행 앱에서 직접 들어가, 이상한 결제나 대출이 생기면 은행에 지급정지를 요청하고 경찰·금감원에 신고해",
    "👉 먼저 은행 안내로 내 정보를 확인하고, 비밀번호 돌려쓰기를 멈추고 이중 인증을 켜 둬",
    "※ 10월 2일 기준 보도 내용이고 진행 중인 사건이라 새로운 사실이 나올 수 있어, 스미싱·신고 요령은 금융당국의 일반 안내를 풀어 쓴 거야",
  ],
  instagramPriorityTags: [
    "은행정보유출",
    "개인정보유출",
    "신한은행",
    "국민은행",
    "하나은행",
    "스미싱",
    "보이스피싱",
    "금융사기예방",
    "이중인증",
    "경제공부",
    "경제뉴스",
    "부엉박사",
  ],

  emphasisTerms: ["유출", "사칭", "이중 인증", "부엉박사"],

  // 자막 경계 예외: 없음(조립·QA에서 필요하면 추가).
  captionBoundaryExceptions: Object.freeze([]),
  // TTS가 문장 중간에서 0.2~0.3초 쉴 때 자막이 깜빡 꺼지지 않게 같은 씬 안 짧은 공백을 앞 자막으로 이어 붙인다(조립기 옵션, 황소 20편에서 도입).
  captionGapBridgeSec: 0.3,

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
      video: "owl_v2_ep21_s1_hook_motion.mp4",
      narration: "은행 앱 쓰는 사람, 내 정보 괜찮을까? 며칠 새 은행 네 곳에서 고객 정보가 털렸어.",
      imageBrief: card("놀라고 걱정스러운 표정으로", "은행 네 곳", "고객 정보 유출"),
      overlays: [],
      shot: "medium",
      bg: "A",
      motion: cardMotion("the character's expression is wide-eyed and worried, eyebrows raised, as if asking whether your own data is safe", "posing a worried question to the viewer"),
    },
    {
      scene: 2,
      key: "s2_opening",
      role: "opening",
      video: "owl_v2_ep21_s2_opening_motion.mp4",
      narration: "안녕, 매일 경제 뉴스를 콕 집어 전해주는 부엉박사야.",
      imageBrief: "부엉이가 정면을 보며 한쪽 날개를 살짝 들어 인사하고 다른 날개는 자연스럽게 내린 채 담담하게 미소 짓는 포즈, 소품 없음.",
      overlays: [],
      shot: "wide",
      bg: "A",
      motion: openMotion("the character raises one wing slightly in a friendly greeting while the other wing hangs naturally, smiling calmly and warmly at the viewer", "warmly greeting the viewer"),
    },
    {
      scene: 3,
      key: "s3_situation_shinhan",
      role: "fact",
      video: "owl_v2_ep21_s3_situation_shinhan_motion.mp4",
      narration: "신한은행은 은행 앱 로그인이 아니라, 대출을 알아본 고객의 이름과 전화번호, 연소득이 빠져나갔어.",
      imageBrief: card("진지하고 또렷한 표정으로", "신한은행", "이름·전화·연소득", true),
      overlays: [],
      shot: "medium",
      bg: "B",
      motion: cardMotion("the character's expression is serious and clear with slight nods, as if reporting what exactly leaked", "seriously reporting what leaked"),
    },
    {
      scene: 4,
      key: "s4_situation_counts",
      role: "fact",
      video: "owl_v2_ep21_s4_situation_counts_motion.mp4",
      narration: "신한은행은 약 2만 5천 명, 국민은행 119명, 하나은행 89명이라고 발표했어.",
      imageBrief: card("진지하고 또렷한 표정으로", "신한 약 2.5만 명", "국민 119 · 하나 89", true),
      overlays: [],
      shot: "medium",
      bg: "B",
      motion: cardMotion("the character's expression is serious and informative with slight nods; it glances down at the card then back at the viewer", "seriously stating the numbers"),
    },
    {
      scene: 5,
      key: "s5_situation_hana",
      role: "fact",
      video: "owl_v2_ep21_s5_situation_hana_motion.mp4",
      narration: "하나은행은 외부에서 영업지원시스템에 몰래 접근해, 주민번호와 주소, 이메일까지 나갔어.",
      imageBrief: "부엉이가 한쪽 날개를 들어 뒤쪽의 둥근 모니터를 가리키며 진지하고 경계하는 표정으로 설명하는 자세, 다른 날개는 자연스럽게 내림, 소품 없음.",
      overlays: [],
      shot: "wide",
      bg: "B",
      motion: openMotion("the character points one wing toward the round monitors behind it with a serious, alert expression while the other wing hangs naturally", "gravely pointing out the breach"),
    },
    {
      scene: 6,
      key: "s6_situation_police",
      role: "fact",
      video: "owl_v2_ep21_s6_situation_police_motion.mp4",
      narration: "경찰은 10월 2일 수사 전 조사에 들어갔고, 부산은행도 외주 직원 11명의 정보가 나왔어.",
      imageBrief: card("진지하고 단호한 표정으로", "경찰 수사 전 조사", "부산은행 11명", true),
      overlays: [],
      shot: "medium",
      bg: "B",
      motion: cardMotion("the character's expression is serious and firm with slight nods, as if announcing an investigation", "firmly announcing the investigation"),
    },
    {
      scene: 7,
      key: "s7_situation_fsc",
      role: "fact",
      video: "owl_v2_ep21_s7_situation_fsc_motion.mp4",
      narration: "금융위원회는 은행과 카드사에 자체 보안 점검을 지시했어.",
      imageBrief: "부엉이가 양쪽 날개를 가슴 앞에서 가볍게 모아 진지하고 차분하게 설명하는 자세, 소품 없음.",
      overlays: [],
      shot: "wide",
      bg: "B",
      motion: openMotion("the character brings both wings together lightly in front of its chest with a serious, calm explanatory expression", "calmly explaining the regulator's order"),
    },
    {
      scene: 8,
      key: "s8_core_q",
      role: "core_question",
      video: "owl_v2_ep21_s8_core_q_motion.mp4",
      narration: "그럼 나는 어떻게 해야 할까? 답부터 말하면, 유출 여부를 확인하고 내 정보를 노린 사칭 연락을 조심하는 거야.",
      imageBrief: "부엉이가 갸웃하다 확신에 찬 표정으로 한쪽 날개를 들어 손짓하며 설명하는 자세, 다른 날개는 자연스럽게 내림, 소품 없음.",
      overlays: [],
      shot: "wide",
      bg: "C",
      motion: openMotion("the character's expression starts curious with a slight head tilt and turns confident while one wing lifts in an explaining gesture and the other hangs naturally", "confidently giving the key answer"),
    },
    {
      scene: 9,
      key: "s9_point1_notice",
      role: "evidence",
      video: "owl_v2_ep21_s9_point1_notice_motion.mp4",
      narration: "첫째, 은행 안내부터 봐. 쉽게 풀면, 해당 고객에게는 은행이 따로 알려주고, 신한은행은 홈페이지에서 직접 확인할 수 있어.",
      imageBrief: card("또렷하고 친근한 표정으로", "은행 안내부터", "신한은 홈페이지에서"),
      overlays: [],
      shot: "medium",
      bg: "C",
      motion: cardMotion("the character's expression is clear and friendly with slight nods, as if explaining where to check", "clearly explaining where to check"),
    },
    {
      scene: 10,
      key: "s10_point2_impersonation",
      role: "evidence",
      video: "owl_v2_ep21_s10_point2_impersonation_motion.mp4",
      narration: "둘째, 은행이라며 오는 전화와 문자는 의심해. 쉽게 풀면, 내 이름과 소득을 아는 척하면 진짜처럼 들리거든.",
      imageBrief: card("신중하고 의심스러운 표정으로", "은행이라며 온", "전화·문자 의심", true),
      overlays: [],
      shot: "medium",
      bg: "C",
      motion: cardMotion("the character's expression is cautious and suspicious, one eyebrow slightly raised, as if doubting an unknown caller", "cautiously warning about impersonation"),
    },
    {
      scene: 11,
      key: "s11_point3_password",
      role: "evidence",
      video: "owl_v2_ep21_s11_point3_password_motion.mp4",
      narration: "셋째, 비밀번호를 돌려쓰지 말고 이중 인증을 켜 둬. 쉽게 풀면, 열쇠 하나로 여러 문이 안 열리게 하는 거야.",
      imageBrief: "부엉이가 한쪽 날개를 들어 뒤쪽의 큼직한 놋쇠 자물쇠 선반을 가리키며 또렷하고 친근하게 설명하는 자세, 다른 날개는 자연스럽게 내림, 소품 없음.",
      overlays: [],
      shot: "wide",
      bg: "C",
      motion: openMotion("the character gestures with one wing toward the shelves of large brass padlocks behind it with a clear, friendly explanatory expression while the other wing hangs naturally", "clearly explaining the lock-and-key idea"),
    },
    {
      scene: 12,
      key: "s12_caution_link",
      role: "condition",
      video: "owl_v2_ep21_s12_caution_link_motion.mp4",
      narration: "확인한다고 문자 속 링크를 누르면 안 돼. 유출 확인을 내세운 스미싱이 따라붙거든. 은행 앱에서 직접 들어가.",
      imageBrief: card("단호하고 신중한 표정으로", "문자 속 링크", "누르지 마세요"),
      overlays: [],
      shot: "medium",
      bg: "C",
      motion: cardMotion("the character's expression is firm and careful, eyebrows slightly furrowed, as if warning against clicking a link", "firmly warning against clicking links"),
    },
    {
      scene: 13,
      key: "s13_report",
      role: "condition",
      video: "owl_v2_ep21_s13_report_motion.mp4",
      narration: "이상한 결제나 대출이 생기면 은행에 지급정지, 곧 계좌 거래 막기를 요청하고 경찰과 금감원에도 신고해.",
      imageBrief: "부엉이가 눈을 크게 뜨고 단호한 표정으로 한쪽 날개를 가슴 앞으로 들어 멈추라는 듯 보이는 자세, 다른 날개는 자연스럽게 내림, 소품 없음.",
      overlays: [],
      shot: "close",
      bg: "C",
      motion: openMotion("the character widens its eyes in a firm look while lifting one wing in front of its chest like a stop gesture, the other wing hanging naturally", "firmly urging immediate action"),
    },
    {
      scene: 14,
      key: "s14_summary",
      role: "action",
      video: "owl_v2_ep21_s14_summary_motion.mp4",
      narration: "콕 집어 정리하면, 이번엔 대출 관련 정보가 새서 확인과 사칭 조심이 먼저야. 지금 먼저 할 건 두 가지야.",
      imageBrief: card("확신에 찬 표정으로", "먼저 할 일", "딱 두 가지"),
      overlays: [],
      shot: "medium",
      bg: "A",
      motion: cardMotion("the character's expression is confident and knowing with slight nods, and it briefly raises its head as if counting two things", "confidently delivering the one-line summary"),
    },
    {
      scene: 15,
      key: "s15_check_two",
      role: "action",
      video: "owl_v2_ep21_s15_check_two_motion.mp4",
      narration: "하나는 은행 안내로 내 정보를 확인하는 것, 다른 하나는 비밀번호와 이중 인증을 점검하는 거야.",
      imageBrief: "부엉이가 한쪽 날개를 들어 두 가지를 하나씩 짚어 가듯 또렷하고 친근하게 설명하는 자세, 다른 날개는 자연스럽게 내림, 소품 없음.",
      overlays: [],
      shot: "wide",
      bg: "A",
      motion: openMotion("the character lifts one wing and ticks off two points one after the other with a clear, friendly explanatory expression while the other wing hangs naturally", "clearly pointing out the two things to check"),
    },
    {
      scene: 16,
      key: "s16_save",
      role: "save",
      video: "owl_v2_ep21_s16_save_motion.mp4",
      narration: "이 두 가지는 저장해 두고, 은행 소식이 더 나오면 다시 확인해. 궁금한 경제 뉴스는 댓글로 남겨줘.",
      imageBrief: "부엉이가 밝은 미소로 한쪽 날개를 가볍게 흔들고 다른 날개는 자연스럽게 내린 마무리 포즈, 소품 없이 빈 날개.",
      overlays: [],
      shot: "wide",
      bg: "A",
      motion: openMotion("the character smiles brightly and waves one wing lightly in a friendly goodbye while the other wing hangs naturally relaxed", "warmly saying goodbye and inviting comments"),
    },
  ]),
});

/** 장면 키로 스펙을 찾는다. */
export function findOwlEp21Scene(key) {
  return OWL_EP21_ASSEMBLY_SPEC.scenes.find((s) => s.key === key) ?? null;
}
