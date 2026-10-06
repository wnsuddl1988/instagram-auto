/**
 * 황소특보 21편 조립 스펙 — 16장면(메모리 가격 상승 둔화, 삼성 잠정실적을 앞두고). 씬 구조 v3 + 성공 공식/엔딩 5박자.
 *
 * 번호: 20편(GPU 담보)에 이어 21편(파일 ep21). 게시 예정 2026-10-05(월) 저녁(Owner 지시, 삼성 잠정실적 10/8 예상 전).
 * 전달 메시지 한 줄: 메모리 호황의 신호는 가격 수준보다 오르는 속도의 변화에서 먼저 나온다 — 가격만 보지 말고 속도를 같이 본다.
 * 담당: 황소특보(투자자 입장, 규칙 22). 레인 ③ 이벤트 D-N · 영역 반도체 · 유형 schedule · 특보 근접도 상(삼성 잠정실적 D-N).
 *
 * ★ 소재 선정 경위(2026-10-03~04)★: `C:/tmp/bull-topic-scan-ep19/SCAN_CHECKLIST.md` 11단계 + 후보 36개 → Owner 12개 압축·슬롯 지정 → Claude 3건 제안 → "3건 확정, 1번 진행해" → 대본 확정(2026-10-04).
 * 초안·팩트표·새 독자 읽기 점검(규칙 29): `_ai/bull-ep19-21-scripts-draft.md`(21편).
 *
 * ★ 핵심 팩트(서울경제 2026-10-03 원문, D램익스체인지 가격·트렌드포스 전망 / 이투데이 10/3)★
 * - D램(PC용 범용 DDR4 8Gb) 월 상승률 7월 14.29%→8월 4.17%→9월 4%. 낸드(128Gb MLC) 4월 36.29%→5월 9.73%→6월 8.72%→7월 4.26%→8월 1.42%→9월 "사실상 보합권".
 * - 가격은 "여전히 사상 최고 수준을 경신". 트렌드포스 4분기 일반 D램 계약가격 +10~15%, 낸드 +15~20% 전망.
 * - 마이크론 CEO(산제이 메흐로트라): 2027·2028년 수요가 공급을 넘고 올해보다 수급이 더 빠듯. 마이크론 매출 기준 어닝서프라이즈 폭 약 6%(직전 분기 31%대).
 * - 삼성전자 3분기 영업이익 전망치는 원화 강세 여파로 석 달 전보다 하향(수치는 출처마다 달라 대본에 미사용), 잠정실적 "오는 8일 예상"(공시 전·미확정).
 * - 리스크 고지: 나레이션에 넣지 않고 오프닝(s2)·마지막(s16) 하단 자막바로만.
 *
 * TTS 실측: 16씬 117.80초, API 1/1, 순수 발화 최대 8.49초(s7), 정렬 밀림 최대 -0.06초(보정 불필요) — `C:/tmp/money-shorts-os/bull-ep21-tts/output-v1/`.
 */

const CARD_LAYOUT =
  "구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄, 카드에 그림·화살표 없이 글자만.";
const card2 = (l1, l2, expression) => `황소가 ${expression} '${l1}'와 '${l2}'가 두 줄로 크게 적힌 카드를 두 손으로 감싸 쥐고 보여주는 자세. ${CARD_LAYOUT}`;
const cardMotion = (action, mood) => ({ type: "card2", action: `the character's expression is ${action}; only the face and body move while the hands holding the card stay still.`, mood });

export const BULL_EP21_ASSEMBLY_SPEC = Object.freeze({
  specVersion: "bull_assembly_spec_v1",
  scriptStructureVersion: "bull_script_structure_v3",
  endingStructureVersion: "bull_ending_5beat_2026_09_29",
  episode: 21,
  sourceCandidate: "candidate-bull-ep21-memory-price-slowdown-samsung-prelim-2026-10-04",
  title: "메모리 가격 상승 둔화, 삼성 잠정실적을 앞두고",
  channelName: "경제번역소",
  characterDisplayName: "황소특보",
  headerTitle: ["메모리 값", "오르는 속도가", "꺾였다"],

  hookType: "T1",
  imageCharacter: "bull3dv1",
  imagePrefix: "bull_ep21",
  // 소재(오르는 속도·고속도로·경사)에 맞는 공간 3곳. 직전 편들(20편 칩 창고·감정실·상담 로비, 19편 야경 라운지·서버 복도·계단식 홀, 14편 클린룸 등)과 겹치지 않는다. 배경에 글자·숫자·로고·화면 없음.
  sceneBackgrounds: Object.freeze({
    A: {
      label: "속도 전시관(도입·핵심질문·정리·마무리)",
      image:
        "밝은 속도 전시관. 황소특보 뒤로 큼직한 반원형 속도계 조형물 두 개(눈금·숫자·글자 없이 단색 반원 호와 굵은 바늘 모양만), 매끈한 흰색 광택 바닥, 양옆에 큼직한 화분. 큰 빈 벽면 없이 조형물·식물로 채우고 사람은 없음. 화이트와 연한 하늘색 조명에 골드 포인트, 저폴리곤 단순화. 글자·숫자·눈금·로고·화면 없음.",
      videoStyle: "bright exhibition hall with two large plain semicircular speedometer sculptures without any marks, numbers or text",
      videoStatics: "the two large plain semicircular speedometer sculptures, the large potted plants, and the glossy white floor",
    },
    B: {
      label: "고속도로 전망 카페(가격 숫자·균형 설명)",
      image:
        "통유리 너머로 완만하게 휘어진 고속도로와 맑은 하늘이 보이는 밝은 전망 카페. 황소특보 뒤로 원형 테이블과 의자, 양옆에 큼직한 화분, 바닥은 연한 우드 마루. 도로에는 표지판·글자 없음. 큰 빈 벽면 없이 창·테이블·식물로 채우고 사람은 없음. 따뜻한 햇살 조명에 골드 포인트, 저폴리곤 단순화. 글자·숫자·간판·로고·화면 없음.",
      videoStyle: "bright view cafe with large windows overlooking a gently curving highway without any signs or text",
      videoStatics: "the large windows with the gently curving plain highway, the round tables and chairs, the large potted plants, and the light wooden floor",
    },
    C: {
      label: "경사로 갤러리(근거·삼성 연결·확인할 것)",
      image:
        "밝은 갤러리 홀. 황소특보 뒤로 완만하게 위로 이어지는 넓은 경사로(램프)와 난간, 글자 없는 단색 추상 조형물, 양옆에 큼직한 화분, 바닥은 연한 베이지 광택 바닥. 큰 빈 벽면 없이 경사로·조형물·식물로 채우고 사람은 없음. 따뜻한 크림과 연한 금색 조명, 저폴리곤 단순화. 글자·숫자·간판·로고·화면 없음.",
      videoStyle: "bright gallery hall with a gentle wide ramp rising upward and plain abstract single-color sculptures",
      videoStatics: "the wide gentle ramp with railings, the plain abstract sculptures, the large potted plants, and the light beige glossy floor",
    },
  }),

  scenesTimeline:
    "s1 훅 / s2 오프닝(압축형) / s3 D램 상승률 / s4 낸드 상승률 / s5 가격은 사상 최고·속도만 둔화 / s6 핵심질문 / s7 근거1 트렌드포스 전망 / s8 근거2 마이크론 CEO 수요 / s9 균형(서프라이즈 폭 축소) / s10 균형(PC용 범용 기준) / s11 삼성 연결(전망치 하향) / s12 잠정실적 날짜(미확정) / s13 통찰 / s14 체크 / s15 프레임 / s16 예고+댓글",

  instagramCaptionHook: "삼성전자 실적을 좌우하는 메모리 값, 계속 폭등 중일까? 오르는 속도가 확 꺾였어",
  instagramCaptionPoints: [
    "서울경제 집계(D램익스체인지 가격)로 PC용 D램 월 상승률은 7월 14.29%에서 8월 4.17%, 9월 4%로 낮아졌고, 낸드는 4월 36.29%에서 8월 1.42%로 내려와 9월엔 사실상 보합이었어",
    "가격 자체는 여전히 사상 최고 수준이고, 달라진 건 오르는 속도야",
    "트렌드포스는 4분기 일반 D램 계약가격이 10~15%, 낸드가 15~20% 더 오른다고 봤고, 마이크론 최고경영자는 2027·2028년에 수요가 공급을 넘을 거라고 했어",
    "다만 마이크론 매출이 예상을 넘긴 폭은 약 6%로 직전 분기 31%대에서 줄었고, 이 가격은 PC용 범용 제품 기준이라 서버용은 다르게 움직일 수 있어",
    "삼성전자 3분기 영업이익 전망치는 원화 강세 여파로 석 달 전보다 낮아졌고, 잠정실적은 10월 8일로 예상되지만 공시 전이라 확정은 아니야",
    "👉 삼성전자 잠정실적이 낮아진 전망치를 넘는지, 다음 분기 가격이 전망대로 오르는지 확인해봐",
    "※ 공개된 보도와 가격 자료를 정리한 거고 특정 종목 추천이나 투자 권유가 아니야, 수치와 일정은 달라질 수 있어",
  ],
  instagramPriorityTags: ["삼성전자", "메모리", "D램", "낸드", "마이크론", "잠정실적", "반도체", "슈퍼사이클", "주식공부", "주식투자", "경제뉴스", "황소특보"],

  emphasisTerms: ["메모리", "속도", "D램", "낸드", "삼성전자", "황소특보"],

  captionBoundaryExceptions: Object.freeze([]),
  // TTS가 문장 중간에서 0.2~0.3초 쉴 때 자막이 깜빡 꺼지지 않게 같은 씬 안 짧은 공백을 앞 자막으로 이어 붙인다(조립기 옵션, 황소 20편에서 도입).
  captionGapBridgeSec: 0.3,
  // 첫 3초 시각 변화 실험(CURRENT_STANDARDS A-7 2-2)은 황소 22편부터 — 21편은 현행(none).
  openingMotion: "none",

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
      scene: 1, key: "s1_hook", role: "hook", video: "bull_ep21_s1_motion.mp4",
      narration: "다들, 삼성전자 실적을 좌우하는 메모리 값이 계속 폭등 중이라고 생각했지? 근데 오르는 속도가 확 꺾였어.",
      imageBrief: card2("메모리 값은", "오르는 속도가 꺾임", "놀라고 궁금한 표정으로"),
      overlays: [], shot: "medium", bg: "A",
      motion: cardMotion("wide-eyed and curious, eyebrows raised, as if revealing a surprising turn", "posing a surprising question to the viewer"),
    },
    {
      scene: 2, key: "s2_opening", role: "opening", video: "bull_ep21_s2_motion.mp4",
      narration: "안녕, 투자 소식 정리해주는 황소특보야. 핵심만 짚어줄게.",
      imageBrief: "황소가 정면을 보며 한 손으로 위를 가리키고 다른 손은 허리에 얹은 채 밝고 명랑하게 웃는 포즈, 소품 없음.",
      overlays: [], shot: "wide", bg: "A",
      motion: { type: "open", action: "the character keeps one hand raised with the index finger pointing upward in a confident, friendly gesture while the other hand rests on its hip, smiling brightly and warmly at the viewer.", mood: "warmly greeting the viewer" },
      riskDisclosure: true,
    },
    {
      scene: 3, key: "s3_situation_dram", role: "background", video: "bull_ep21_s3_motion.mp4",
      narration: "숫자부터 보자. D램 월 상승률은 7월 14.29%, 8월 4.17%, 9월 4%였어.",
      imageBrief: card2("D램 월 상승률", "14.29·4.17·4%", "진지하고 또렷하게 알리는 표정으로"),
      overlays: [], shot: "medium", bg: "A",
      motion: cardMotion("serious and clear with slight nods as if reporting a falling series of numbers", "seriously reporting the slowing rates"),
    },
    {
      scene: 4, key: "s4_situation_nand", role: "background", video: "bull_ep21_s4_motion.mp4",
      narration: "낸드는 더 심해. 월 상승률이 4월 36.29%에서 8월 1.42%로 내려오다 9월엔 보합이야.",
      imageBrief: card2("낸드 4월 36.29%", "8월 1.42%, 9월 보합", "차분하고 또렷하게 설명하는 표정으로"),
      overlays: [], shot: "medium", bg: "B",
      motion: cardMotion("calm and clear with slight nods", "calmly explaining the sharper slowdown"),
    },
    {
      scene: 5, key: "s5_situation_level", role: "background", video: "bull_ep21_s5_motion.mp4",
      narration: "가격 자체는 여전히 사상 최고 수준이야. 달라진 건 오르는 속도라는 점이지.",
      imageBrief: card2("가격은 사상 최고", "속도만 둔화", "또렷하고 친절하게 설명하는 표정으로"),
      overlays: [], shot: "medium", bg: "B",
      motion: cardMotion("clear and friendly with slight nods", "clearly separating price level from speed"),
    },
    {
      scene: 6, key: "s6_core_q", role: "twist", video: "bull_ep21_s6_motion.mp4",
      narration: "그럼 메모리 호황이 끝난 걸까? 한마디로 단정은 일러, 속도가 줄었을 뿐 방향이 바뀐 건 아니거든.",
      imageBrief: card2("호황이 끝났나?", "단정은 일러요", "확신에 찬 표정으로"),
      overlays: [], shot: "medium", bg: "C",
      motion: cardMotion("confident and knowing with a slight nod", "confidently delivering the key answer"),
    },
    {
      scene: 7, key: "s7_evidence_forecast", role: "evidence", video: "bull_ep21_s7_motion.mp4",
      narration: "첫째 근거는 전망이야. 트렌드포스는 4분기 D램이 10~15%, 낸드가 15~20% 더 오른다고 봤어.",
      imageBrief: card2("4분기 D램 +10~15%", "낸드 +15~20%", "또렷하고 친절하게 설명하는 표정으로"),
      overlays: [], shot: "medium", bg: "C",
      motion: cardMotion("clear and friendly with slight nods", "clearly giving the forecast"),
    },
    {
      scene: 8, key: "s8_evidence_demand", role: "evidence", video: "bull_ep21_s8_motion.mp4",
      narration: "둘째 근거는 수요야. 마이크론 최고경영자는 2027년과 2028년에 수요가 공급을 넘을 거라고 했지.",
      imageBrief: card2("마이크론 CEO", "27·28년 수요 초과", "또렷하고 친절하게 설명하는 표정으로"),
      overlays: [], shot: "medium", bg: "A",
      motion: cardMotion("clear and friendly with slight nods", "clearly quoting the CEO's outlook"),
    },
    {
      scene: 9, key: "s9_balance_micron", role: "counterpoint", video: "bull_ep21_s9_motion.mp4",
      narration: "물론 조심할 것도 있어. 마이크론이 예상을 넘긴 매출 폭은 약 6%로, 직전 분기 31%대에서 줄었어.",
      imageBrief: "황소가 신중하고 걱정스러운 표정으로 한 손을 턱 근처에 대고 다른 손은 허리에 얹은 포즈, 소품 없음.",
      overlays: [], shot: "close", bg: "A",
      motion: { type: "open", action: "the character rests one hand near its chin with a careful, thoughtful expression and slight head tilts while the other hand rests on its hip", mood: "carefully noting a counter-signal" },
    },
    {
      scene: 10, key: "s10_balance_pc", role: "counterpoint", video: "bull_ep21_s10_motion.mp4",
      narration: "또 이 가격은 PC용 범용 제품 기준이라, 서버용은 다르게 움직일 수 있어.",
      imageBrief: "황소가 한 손바닥을 펴 보이며 신중하게 설명하는 포즈, 다른 손은 허리에 얹음, 소품 없음.",
      overlays: [], shot: "wide", bg: "B",
      motion: { type: "open", action: "the character shows one open palm with a careful explanatory expression while the other hand rests on its hip", mood: "carefully noting the scope of the price data" },
    },
    {
      scene: 11, key: "s11_link_samsung", role: "evidence", video: "bull_ep21_s11_motion.mp4",
      narration: "삼성전자엔 메모리 값이 곧 실적인데, 3분기 영업이익 전망치는 원화 강세 여파로 석 달 전보다 낮아졌어.",
      imageBrief: card2("삼성전자 3분기", "영업이익 전망 하향", "신중하고 또렷한 표정으로"),
      overlays: [], shot: "medium", bg: "B",
      motion: cardMotion("careful and clear with slight nods", "carefully connecting to Samsung's earnings outlook"),
    },
    {
      scene: 12, key: "s12_date", role: "counterpoint", video: "bull_ep21_s12_motion.mp4",
      narration: "삼성전자 잠정실적은 10월 8일로 예상되지만, 공시 전이라 확정은 아니야.",
      imageBrief: card2("잠정실적 예상일", "10월 8일(미확정)", "신중하고 단호한 표정으로"),
      overlays: [], shot: "medium", bg: "B",
      motion: cardMotion("careful and firm, eyebrows slightly furrowed, as if noting an unconfirmed date", "firmly noting the date is unconfirmed"),
    },
    {
      scene: 13, key: "s13_insight", role: "insight", video: "bull_ep21_s13_motion.mp4",
      narration: "한 줄로 정리하면, 메모리 호황의 신호는 가격 수준보다 오르는 속도의 변화에서 먼저 나와.",
      imageBrief: card2("신호는 가격보다", "속도에서 먼저", "확신에 찬 표정으로"),
      overlays: [], shot: "medium", bg: "C",
      motion: cardMotion("confident and knowing with slight nods", "confidently delivering the one-line summary"),
    },
    {
      scene: 14, key: "s14_check", role: "action", video: "bull_ep21_s14_motion.mp4",
      narration: "확인할 건 두 가지, 삼성전자 잠정실적이 낮아진 전망치를 넘는지랑 다음 분기 가격이 전망대로 오르는지야.",
      imageBrief: card2("① 잠정실적 vs 전망", "② 다음 분기 가격", "친절하고 또렷하게 알려주는 표정으로"),
      overlays: [], shot: "medium", bg: "C",
      motion: cardMotion("clear and helpful with slight nods as if listing two things to check", "clearly listing two things to check"),
    },
    {
      scene: 15, key: "s15_frame", role: "frame", video: "bull_ep21_s15_motion.mp4",
      narration: "가격만 보지 말고 속도를 같이 봐야 해. 이유를 알아야 다음 신호가 읽혀. 이것만은 챙겨가.",
      imageBrief: card2("가격 + 속도", "같이 보기", "따뜻하고 차분한 미소로"),
      overlays: [], shot: "medium", bg: "A",
      motion: cardMotion("warm and calm with a gentle smile", "warmly reassuring the viewer"),
    },
    {
      scene: 16, key: "s16_cta", role: "save", video: "bull_ep21_s16_motion.mp4",
      narration: "삼성전자 잠정실적이 나오면 황소특보가 제일 먼저 들고 올게. 짚어줬으면 하는 이슈는 댓글로 남겨줘.",
      imageBrief: "황소가 밝은 미소로 한 손을 가볍게 흔들고 다른 손은 자연스럽게 내린 마무리 포즈, 소품 없이 빈 손.",
      overlays: [], shot: "wide", bg: "A",
      motion: { type: "open", action: "the character smiles brightly and waves one hand lightly in a friendly goodbye while the other hand hangs naturally relaxed", mood: "warmly saying goodbye and inviting comments" },
      riskDisclosure: true,
    },
  ]),
});

/** 장면 키로 스펙을 찾는다. */
export function findBullEp21Scene(key) {
  return BULL_EP21_ASSEMBLY_SPEC.scenes.find((s) => s.key === key) ?? null;
}
