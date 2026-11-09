/**
 * 황소특보 16편 조립 스펙 — 16장면. 씬 구조 v3 + 성공 공식/엔딩 5박자 아홉 번째 적용본(품질 체계 v2 여섯 번째 황소편).
 *
 * 전달 메시지 한 줄: 자사주 종료는 수급 하나가 빠지는 일이고, 그 빈자리는 실적이 채워야 한다 — 누가 사느냐·왜 사느냐·실적을 같이 봐야 다음 신호가 읽힌다.
 * 담당: 황소특보(투자자 입장, 규칙 22). 영역 반도체·수급 · 레인 ③ 이벤트 D-N(종료 10/6·잠정실적 D-5) · 유형 schedule · 특보 근접도 상(종료 임박 + 10/2~3 보도).
 *
 * ★ 소재 선정 경위(2026-10-03)★: 규칙 25 오케스트레이터 11단계 전부(`C:/tmp/bull-topic-scan-ep16/SCAN_CHECKLIST.md`) + 후보 25개 → Owner "1~3번 소재로 3개 편을 만들자"(2026-10-03) →
 * "1번 진행해"(자사주 편 먼저, 10/2 보관 지시 이행). 반도체 쏠림 경고(최근 5편 중 3편)는 Owner 방침으로 표시만. 초안·팩트표·새 독자 읽기 점검(규칙 29, 2회):
 * `_ai/bull-ep16-18-scripts-draft.md`(A).
 *
 * ★ 핵심 팩트(2026-10-02~03, 복수 매체)★
 * - 삼성전자 8/21 이사회: 임직원 주식보상 목적, 보통주 5,328만 5,968주·취득예정금액 15조 원, 8/24~11/21 — 공시 보도(더테크·네이트).
 * - 누적(전날 10/1 기준) 5,380만 주(100.96%)·14조 1,565억 원, 금액 한도가 남아 하루 약 200만 주씩 2~3일 안에 소진, 종료 10/6(당초 11/21) — 파이낸셜뉴스·서울경제·이투데이·시사저널e.
 * - 10/2 마감: 기타법인 순매수 1조 4,886억 원(주로 삼성전자·SK하이닉스 자사주), 개인 -1조 8,125억 원 — 이투데이(요약).
 * - 삼성전자 3분기 잠정실적 컨센서스 9월 초 113.1조 → 109.5조(원화 강세), 발표 "8일" 보도(회사 공시 전, 일정표 10/7 미확정) — 이투데이 주간전망 10/3.
 * - SK하이닉스 신고 2,407만 주 중 1,835만 주(76.24%), 하루 60~65만 주, 10월 중순 종료 전망 — 서울경제·이투데이 10/2.
 * - 제외: 외국인 28.8조 순매도(자사주 시작 시점 불명), 자사주 효과 크기(공식 수치 없음), 잠정실적 날짜(미확정이라 "다음 주"로만).
 * - 리스크 고지: 나레이션에 넣지 않고 오프닝(s2)·마지막(s16) 하단 자막바로만.
 *
 * TTS 실측: 16씬 113.32초, API 1/1, 순수 발화 최대 7.79초, 정렬 밀림 없음(최대 이동 -0.16초, 보정본 불필요) — `C:/tmp/money-shorts-os/bull-ep16-tts/output-v1/`.
 */

// 카드(두 손으로 감싼 납작한 가로형) 구도 문구 — 황소 15편 스펙과 동일(규칙 15, A-4 ④).
const CARD_LAYOUT =
  "구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄, 카드에 그림·화살표 없이 글자만.";
const card2 = (l1, l2, expression) => `황소가 ${expression} '${l1}'와 '${l2}'가 두 줄로 크게 적힌 카드를 두 손으로 감싸 쥐고 보여주는 자세. ${CARD_LAYOUT}`;

export const BULL_EP16_ASSEMBLY_SPEC = Object.freeze({
  specVersion: "bull_assembly_spec_v1",
  scriptStructureVersion: "bull_script_structure_v3",
  endingStructureVersion: "bull_ending_5beat_2026_09_29",
  episode: 16,
  sourceCandidate: "candidate-bull-ep16-samsung-buyback-end-then-earnings-2026-10-03",
  title: "삼성전자 자사주 매입이 끝나면, 진짜 볼 건 실적",
  channelName: "경제번역소",
  characterDisplayName: "황소특보",
  // 3줄, 줄별 실제 글자 108px(QA 게이트: 줄별 100px 이상·최대 3줄, 한 줄 약 8자 이내).
  headerTitle: ["자사주 매입 끝,", "삼성전자 진짜", "볼 건 실적"],

  // ── 이미지·영상 연출 필드(품질 체계 v2, 규칙 15) ──
  hookType: "T1",
  imageCharacter: "bull3dv1",
  imagePrefix: "bull_ep16",
  // 소재(자사주 매입·수급·실적 시즌)에 맞는 공간 3곳. 직전 편들(15편 자동차 쇼룸·충전 허브·공장 아트리움, 14편 데이터센터·클린룸·식물 라운지,
  // 13편 출국 라운지·저울 홀·마켓 홀, 12편 야경 라운지·자금 흐름 상황실·주차장 로비, 11편 조선소·상황실·항만)과 겹치지 않는다. 배경에 글자·숫자·로고·화면·달력 없음.
  sceneBackgrounds: Object.freeze({
    A: {
      label: "주주 환원 금고 로비(도입·상황·정리·마무리)",
      image:
        "밝고 단정한 주주 환원 로비. 황소특보 뒤로 둥근 대형 금고 문(손잡이 바퀴만 있고 숫자·글자·눈금 없음)과 단색 황금 코인 더미를 담은 유리 진열 기둥 두세 개(코인에 글자·숫자 없음), 양옆에 큼직한 화분과 둥근 벤치, 바닥은 따뜻한 베이지 대리석과 둥근 러그. 큰 빈 벽면 없이 금고 문과 유리 진열 기둥, 식물로 채운다. 따뜻한 앰버·크림 조명에 골드 포인트, 저폴리곤 단순화. 글자·숫자·간판·화면 없음.",
      videoStyle: "bright shareholder-return vault lobby with plain gold coin stacks",
      videoStatics: "the large round vault door with a plain wheel handle, the glass display pillars with plain gold coin stacks, the large potted plants, the round benches, and the beige marble floor with a round rug",
    },
    B: {
      label: "수급 저울 광장(수급·자사주 개념 설명)",
      image:
        "탁 트인 수급 저울 광장. 황소특보 뒤로 높이가 다른 둥근 단상 위에 큼직한 놋쇠 천칭 저울 두세 대(저울 접시에는 색색의 둥근 구슬만, 눈금·글자·숫자 없음), 양옆에 큼직한 화분과 낮은 분수대, 바닥은 매끈한 연한 청록 광택 타일. 큰 빈 벽면 없이 저울과 단상, 분수대로 채우고 사람은 없음. 은은한 청록·크림 조명에 골드 포인트, 저폴리곤 단순화. 글자·숫자·눈금·간판·화면 없음.",
      videoStyle: "open supply-and-demand balance-scale plaza with plain round marbles",
      videoStatics: "the large brass balance scales on round podiums with plain colored marbles, the large potted plants, the low fountain, and the glossy light teal tile floor",
    },
    C: {
      label: "실적 시즌 결과 발표장(실적 눈높이·확인할 것)",
      image:
        "밝은 실적 발표장. 황소특보 뒤로 둥근 단상과 길게 이어진 곡선 무대, 단상 뒤 커다란 둥근 막(무늬 없는 단색 파랑, 글자·숫자·그래프 없음), 양옆에 큼직한 화분과 줄지어 놓인 둥근 의자, 바닥은 하얗고 매끈한 광택 바닥. 큰 빈 벽면 없이 단상과 둥근 막, 의자로 채우고 사람은 없음. 화이트·연한 파랑 조명에 골드 포인트, 저폴리곤 단순화. 글자·숫자·그래프·간판·화면·달력 없음.",
      videoStyle: "bright earnings-announcement stage with a plain blue round backdrop",
      videoStatics: "the round podium and long curved stage, the large plain blue round backdrop with no marks, the large potted plants, the rows of round chairs, and the white glossy floor",
    },
  }),

  scenesTimeline:
    "s1 훅 / s2 오프닝(압축형) / s3 상황(5,328만 주 다 샀음) / s4 상황(한도 두 가지·14조 1,565억) / s5 종료 10/6 / s6 10/2 기타법인 1조 4,886억 / s7 개인 팔자 vs 자사주 / s8 핵심질문 / s9 근거1 수급 / s10 목적=임직원 보상 / s11 근거2 실적 눈높이 / s12 균형(하이닉스 76%) / s13 통찰 / s14 체크 / s15 프레임·이득 각인 / s16 당부+예고+댓글",

  instagramCaptionHook: "삼성전자 15조 자사주 매입이 끝나면 주가가 빠질까? 이제 진짜 볼 건 실적이야",
  instagramCaptionPoints: [
    "삼성전자는 8월 임직원 주식 보상을 목적으로 5,328만 주·15조 원 규모 자사주 매입을 공시했는데, 10월 1일까지 5,380만 주(100.96%)를 이미 사고 14조 1,565억 원을 썼어",
    "공시한 한도가 주식 수와 금액 두 가지라 주식 수는 다 채웠지만 금액이 남아 계속 사는 중이고, 2~3일이면 끝나서 종료는 10월 6일(당초 11월 21일)이야",
    "10월 2일 하루 기타법인 순매수는 1조 4,886억 원으로 대부분 삼성전자·SK하이닉스 자사주였고 개인은 팔자가 앞섰어",
    "시장은 개인과 외국인이 내놓는 물량을 받아주던 기업 수요가 사라질까 걱정하지만, 삼성전자의 목적은 주가 방어가 아니라 임직원 주식 보상이야",
    "다음 주 삼성전자 3분기 잠정실적 눈높이는 9월 초 113조 원에서 109조 원대로 낮아졌어(원화 강세 영향), SK하이닉스는 신고 물량의 76%만 채워 아직 매입이 남았어",
    "👉 잠정실적이 눈높이를 넘는지와 SK하이닉스 매입 종료 뒤 수급을 확인해봐",
    "※ 공개된 공시·보도를 정리한 거고 종목 추천이나 투자 권유가 아니야, 수치와 일정은 달라질 수 있어",
  ],
  instagramPriorityTags: [
    "삼성전자",
    "자사주",
    "자사주매입",
    "SK하이닉스",
    "수급",
    "잠정실적",
    "반도체",
    "주식공부",
    "주식투자",
    "경제뉴스",
    "황소특보",
  ],

  emphasisTerms: ["자사주", "수급", "실적", "삼성전자", "황소특보"],

  // 자막 경계 예외(QA가 경고로 남김, 규칙 불변): ① s4 "쓴 돈은 14조 1,565억 원이야" — 숫자 합산 표기가 폭 한도 760px 안에 한 블록으로 못 들어가
  // "14조 / 1,565억 원이야"로 나뉨(황소 14편 "77조 2천억 원이야" 전례). ② s8 "이제 실적이 더 중요해지는 거야" — 두 줄에 안 들어가(3줄 초과) 어절 경계에서
  // "더 / 중요해지는"으로 나뉨, TTS 재생성 회피(20편 "아니라" 전례).
  captionBoundaryExceptions: Object.freeze([
    { left: "14조", right: "1,565억", reason: "숫자 합산 표기(14조 1,565억 원이야)가 폭 한도 760px 안에 한 블록으로 안 들어감(s4)" },
    { left: "더", right: "중요해지는", reason: "'이제 실적이 더 중요해지는 거야'가 두 줄에 안 들어가 어절 경계에서 분할, TTS 재생성 회피(s8)" },
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
      video: "bull_ep16_s1_motion.mp4",
      narration: "다들, 삼성전자 15조 자사주 매입이 끝나면 주가가 빠진다고 생각했지? 근데 이제 진짜 볼 건 실적이야.",
      imageBrief: card2("자사주 매입 끝", "진짜 볼 건 실적", "궁금하고 의미심장한 표정으로"),
      overlays: [],
      shot: "medium",
      bg: "A",
      motion: { type: "card2", action: "the character's expression is intrigued and knowing, eyebrows slightly raised, as if hinting at a twist; body and face move gently while the hands holding the card stay still.", mood: "posing an intriguing question to the viewer" },
    },
    {
      scene: 2,
      key: "s2_opening",
      role: "opening",
      video: "bull_ep16_s2_motion.mp4",
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
      key: "s3_situation_bought",
      role: "background",
      video: "bull_ep16_s3_motion.mp4",
      narration: "숫자부터 보자. 삼성전자는 공시한 5,328만 주를 이미 다 샀어.",
      imageBrief: card2("공시한 5,328만 주", "이미 다 샀어", "또렷하고 밝게 설명하는 표정으로"),
      overlays: [],
      shot: "medium",
      bg: "A",
      motion: { type: "card2", action: "the character's expression is bright and informative with slight nods; only the face and body move while the hands holding the card stay still.", mood: "calmly presenting the first number" },
    },
    {
      scene: 4,
      key: "s4_situation_budget",
      role: "background",
      video: "bull_ep16_s4_motion.mp4",
      narration: "한도가 주식 수와 금액 두 가지라 금액이 남았고, 쓴 돈은 14조 1,565억 원이야.",
      imageBrief: card2("쓴 돈", "14조 1,565억 원", "차분하고 또렷하게 설명하는 표정으로"),
      overlays: [],
      shot: "medium",
      bg: "A",
      motion: { type: "card2", action: "the character's expression is calm and clear with slight nods; only the face and body move while the hands holding the card stay still.", mood: "calmly presenting the spent amount" },
    },
    {
      scene: 5,
      key: "s5_situation_end",
      role: "background",
      video: "bull_ep16_s5_motion.mp4",
      narration: "2~3일이면 끝나고, 종료는 10월 6일이야. 당초 계획은 11월 21일이었어.",
      imageBrief: card2("종료 10월 6일", "당초 11월 21일", "진지하고 또렷하게 알리는 표정으로"),
      overlays: [],
      shot: "medium",
      bg: "B",
      motion: { type: "card2", action: "the character's expression is serious and clear with slight nods as if announcing a deadline; only the face and body move while the hands holding the card stay still.", mood: "seriously announcing the end date" },
    },
    {
      scene: 6,
      key: "s6_situation_flow",
      role: "background",
      video: "bull_ep16_s6_motion.mp4",
      narration: "10월 2일 하루 기타법인 순매수는 1조 4,886억 원, 대부분 삼성전자와 SK하이닉스 자사주야.",
      imageBrief: card2("10/2 기타법인", "1조 4,886억 순매수", "놀랍고 또렷하게 설명하는 표정으로"),
      overlays: [],
      shot: "medium",
      bg: "B",
      motion: { type: "card2", action: "the character's expression is surprised yet clear with slight nods; only the face and body move while the hands holding the card stay still.", mood: "clearly presenting the daily buying amount" },
    },
    {
      scene: 7,
      key: "s7_situation_retail",
      role: "background",
      video: "bull_ep16_s7_motion.mp4",
      narration: "같은 날 개인은 팔자가 앞섰고, 자사주가 그 물량을 받아준 셈이야.",
      imageBrief: "황소가 양손으로 두 접시를 견주는 듯 좌우로 펼쳐 보이며 차분하고 또렷하게 설명하는 포즈, 소품 없음.",
      overlays: [],
      shot: "wide",
      bg: "B",
      motion: { type: "open", action: "the character spreads both hands outward to either side as if weighing two sides, with a calm and clear explanatory expression; no props are held.", mood: "calmly showing who sold and who bought" },
    },
    {
      scene: 8,
      key: "s8_core_q",
      role: "twist",
      video: "bull_ep16_s8_motion.mp4",
      narration: "그럼 이 큰손이 빠지면 뭐가 달라질까? 한마디로 받쳐주던 수급이 줄어서, 이제 실적이 더 중요해지는 거야.",
      imageBrief: card2("수급은 줄고", "실적이 더 중요", "확신에 찬 표정으로"),
      overlays: [],
      shot: "medium",
      bg: "B",
      motion: { type: "card2", action: "the character's expression is confident and knowing with a slight nod; only the face and body move while the hands holding the card stay still.", mood: "confidently delivering the key answer" },
    },
    {
      scene: 9,
      key: "s9_evidence_flow",
      role: "evidence",
      video: "bull_ep16_s9_motion.mp4",
      narration: "첫째는 수급이야. 자사주는 회사가 직접 사는 거라, 개인과 외국인이 내놓는 물량을 받아주는 손이 하나 더 있었던 셈이야.",
      imageBrief: card2("자사주 = 회사가", "직접 사는 물량", "또렷하고 친절하게 설명하는 표정으로"),
      overlays: [],
      shot: "medium",
      bg: "B",
      motion: { type: "card2", action: "the character's expression is clear and friendly with slight nods as if explaining a concept; only the face and body move while the hands holding the card stay still.", mood: "clearly explaining what a buyback is" },
    },
    {
      scene: 10,
      key: "s10_evidence_purpose",
      role: "evidence",
      video: "bull_ep16_s10_motion.mp4",
      narration: "근데 삼성전자가 공시한 목적은 임직원 주식 보상이야. 주가 방어가 목적은 아니었는데, 수급은 받쳐줬던 거지.",
      imageBrief: card2("공시한 목적", "임직원 주식 보상", "알겠다는 듯 또렷하게 설명하는 표정으로"),
      overlays: [],
      shot: "close",
      bg: "B",
      motion: { type: "card2", action: "the character's expression is clear and slightly surprised with slight nods as if revealing the stated purpose; only the face and body move while the hands holding the card stay still.", mood: "clearly revealing the stated purpose" },
    },
    {
      scene: 11,
      key: "s11_evidence_earnings",
      role: "evidence",
      video: "bull_ep16_s11_motion.mp4",
      narration: "둘째는 실적이야. 다음 주 삼성전자 잠정실적 눈높이는 9월 초 113조 원에서 109조 원대로 낮아졌어.",
      imageBrief: card2("눈높이 113조에서", "109조대로 하향", "신중하고 또렷하게 설명하는 표정으로"),
      overlays: [],
      shot: "medium",
      bg: "C",
      motion: { type: "card2", action: "the character's expression is careful and clear with slight nods as if comparing expectations; only the face and body move while the hands holding the card stay still.", mood: "carefully presenting the lowered expectation" },
    },
    {
      scene: 12,
      key: "s12_balance",
      role: "counterpoint",
      video: "bull_ep16_s12_motion.mp4",
      narration: "물론 조심할 것도 있어. 큰손이 다 빠지는 건 아니야. SK하이닉스는 아직 76%만 채웠어.",
      imageBrief: "황소가 신중하고 걱정스러운 표정으로 한 손을 턱 근처에 대고 다른 손은 허리에 얹은 포즈, 소품 없음.",
      overlays: [],
      shot: "wide",
      bg: "C",
      motion: { type: "open", action: "the character rests one hand near its chin with a careful, thoughtful expression and slight head tilts while the other hand rests on its hip; no props are held.", mood: "carefully noting the caveat" },
    },
    {
      scene: 13,
      key: "s13_insight",
      role: "insight",
      video: "bull_ep16_s13_motion.mp4",
      narration: "한 줄로 정리하면, 자사주 종료는 수급 하나가 빠지는 일이고 그 빈자리는 실적이 채워야 해.",
      imageBrief: card2("수급 하나가 빠지고", "빈자리는 실적", "확신에 찬 표정으로"),
      overlays: [],
      shot: "medium",
      bg: "C",
      motion: { type: "card2", action: "the character's expression is confident and knowing with slight nods; only the face and body move while the hands holding the card stay still.", mood: "confidently delivering the one-line summary" },
    },
    {
      scene: 14,
      key: "s14_check",
      role: "action",
      video: "bull_ep16_s14_motion.mp4",
      narration: "확인할 건 두 가지, 삼성전자 잠정실적이 눈높이를 넘는지랑 SK하이닉스 매입 종료 뒤의 수급이야.",
      imageBrief: card2("① 잠정실적 눈높이", "② 하이닉스 종료 뒤", "친절하고 또렷하게 알려주는 표정으로"),
      overlays: [],
      shot: "medium",
      bg: "A",
      motion: { type: "card2", action: "the character's expression is clear and helpful with slight nods as if listing two things to check; only the face and body move while the hands holding the card stay still.", mood: "clearly listing two things to check" },
    },
    {
      scene: 15,
      key: "s15_frame",
      role: "frame",
      video: "bull_ep16_s15_motion.mp4",
      narration: "주가는 누가 사느냐와 왜 사느냐, 그리고 실적을 같이 봐야 해. 이유를 알아야 다음 신호가 읽혀. 이것만은 챙겨가.",
      imageBrief: card2("누가·왜 사는지", "실적까지 같이", "따뜻하고 차분한 미소로"),
      overlays: [],
      shot: "medium",
      bg: "A",
      motion: { type: "card2", action: "the character's expression is warm and calm with a gentle smile; only the face and body move while the hands holding the card stay still.", mood: "warmly reassuring the viewer" },
    },
    {
      scene: 16,
      key: "s16_cta",
      role: "save",
      video: "bull_ep16_s16_motion.mp4",
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
export function findBullEp16Scene(key) {
  return BULL_EP16_ASSEMBLY_SPEC.scenes.find((s) => s.key === key) ?? null;
}
