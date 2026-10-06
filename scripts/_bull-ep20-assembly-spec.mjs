/**
 * 황소특보 20편 조립 스펙 — 16장면(엔비디아 GPU 담보대출, 수명 10년 vs 은행 3~4년). 씬 구조 v3 + 성공 공식/엔딩 5박자.
 *
 * 번호: 19편(S&P500 쏠림)에 이어 20편(파일 ep20). 게시 예정 2026-10-05(월) 오전(Owner 지시).
 * 전달 메시지 한 줄: AI 붐은 칩 성능만이 아니라 칩을 담보로 얼마나 빌릴 수 있느냐로도 갈린다 — 칩 판매뿐 아니라 돈줄도 본다.
 * 담당: 황소특보(투자자 입장, 규칙 22). 레인 ⑤ 신테마 입문(AI 인프라 금융) · 영역 미국 주식·AI · 유형 concept · 특보 근접도 중.
 *
 * ★ 소재 선정 경위(2026-10-03~04)★: `C:/tmp/bull-topic-scan-ep19/SCAN_CHECKLIST.md` 11단계 + 후보 36개 → Owner 12개 압축·슬롯 지정 → Claude 3건 제안 → "3건 확정, 1번 진행해" → 대본 확정(2026-10-04).
 * Owner는 대본의 엔비디아·코어위브·네이버 실명을 확인하고 확정함(허용리스트 밖 실명 — 법적 위험 확인은 Owner 몫).
 * 초안·팩트표·새 독자 읽기 점검(규칙 29): `_ai/bull-ep19-21-scripts-draft.md`(20편).
 *
 * ★ 핵심 팩트(로이터 2026-10-01 인용 — 글로벌이코노믹 10/3, 뉴스핌 10/2 / 파이낸셜뉴스 9/28~29)★
 * - 엔비디아 5,000억 달러 규모 칩(GPU) 담보 대출 구상: AI 개발사가 칩을 직접 사지 않고 칩을 담보로 금융권에서 조달. 코어위브 GPU 담보 대출 85억 달러.
 * - 엔비디아는 GPU 수명 "최대 10년"(젠슨 황 GB300 NVL72 9~10년), 은행은 통상 3~4년(일부 5~6년) 감가상각.
 * - 은행·펀드가 초기안보다 높은 보증 요구, 은행 소식통 3명: 엔비디아가 모든 거래에 보증을 제공해야 할 수 있다.
 * - 한국: 네이버 대규모 GPU 사업을 두고 금융권이 처분가치·교체주기·가동률·고객계약을 따져 대출 가능 규모 산출 중(협의·검토 단계).
 * - 리스크 고지: 나레이션에 넣지 않고 오프닝(s2)·마지막(s16) 하단 자막바로만.
 *
 * TTS 실측: 16씬 112.84초, API 1/1, 순수 발화 최대 8.69초(s15), 정렬 밀림 최대 -0.28초(보정 불필요) — `C:/tmp/money-shorts-os/bull-ep20-tts/output-v1/`.
 */

const CARD_LAYOUT =
  "구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄, 카드에 그림·화살표 없이 글자만.";
const card2 = (l1, l2, expression) => `황소가 ${expression} '${l1}'와 '${l2}'가 두 줄로 크게 적힌 카드를 두 손으로 감싸 쥐고 보여주는 자세. ${CARD_LAYOUT}`;
const cardMotion = (action, mood) => ({ type: "card2", action: `the character's expression is ${action}; only the face and body move while the hands holding the card stay still.`, mood });

export const BULL_EP20_ASSEMBLY_SPEC = Object.freeze({
  specVersion: "bull_assembly_spec_v1",
  scriptStructureVersion: "bull_script_structure_v3",
  endingStructureVersion: "bull_ending_5beat_2026_09_29",
  episode: 20,
  sourceCandidate: "candidate-bull-ep20-nvidia-gpu-collateral-life-10-vs-3-4-2026-10-04",
  title: "엔비디아 GPU가 담보로 잡힌다, 수명 10년 vs 3~4년",
  channelName: "경제번역소",
  characterDisplayName: "황소특보",
  headerTitle: ["엔비디아 칩이", "담보로 잡힌다", "수명 논쟁"],

  hookType: "T1",
  imageCharacter: "bull3dv1",
  imagePrefix: "bull_ep20",
  // 소재(칩 담보·감정·대출)에 맞는 공간 3곳. 직전 편들(19편 야경 라운지·서버 복도·계단식 홀, 18편 심판 홀 등)과 겹치지 않는다. 배경에 글자·숫자·로고·화면 없음.
  sceneBackgrounds: Object.freeze({
    A: {
      label: "칩 보관 창고(도입·구조·정리·마무리)",
      image:
        "밝은 칩 보관 창고. 황소특보 뒤로 흰색·연회색 선반에 글자 없는 단색 파랑·초록 상자와 얇은 칩 케이스가 가지런히 쌓여 있고, 천장에 흰 조명, 바닥은 연한 회색 광택 바닥, 양옆에 큼직한 화분. 큰 빈 벽면 없이 선반·상자·식물로 채우고 사람은 없음. 화이트와 연한 파랑 조명에 골드 포인트, 저폴리곤 단순화. 상자·케이스에 글자·숫자·로고 없음, 화면 없음.",
      videoStyle: "bright chip storage warehouse with plain unmarked blue and green boxes and thin plain chip cases on white shelves",
      videoStatics: "the white shelves with plain unmarked blue and green boxes and thin chip cases, the large potted plants, and the glossy light gray floor",
    },
    B: {
      label: "담보 감정실(수명·보증 설명)",
      image:
        "밝은 담보 감정실. 황소특보 뒤로 둥근 감정 테이블 위에 큼직한 돋보기와 글자 없는 단색 상자들, 유리 진열장, 바닥은 따뜻한 우드 마루, 양옆에 큼직한 화분. 큰 빈 벽면 없이 테이블·진열장·식물로 채우고 사람은 없음. 따뜻한 크림과 금색 조명, 저폴리곤 단순화. 글자·숫자·간판·로고·화면 없음.",
      videoStyle: "bright appraisal room with round appraisal tables, a large magnifying glass and plain unmarked boxes in glass display cases",
      videoStatics: "the round appraisal tables with the large magnifying glass and plain boxes, the glass display cases, the large potted plants, and the warm wooden floor",
    },
    C: {
      label: "대출 상담 로비(핵심질문·한국 연결·확인할 것)",
      image:
        "밝은 대출 상담 로비. 황소특보 뒤로 둥근 상담 데스크와 파스텔 소파, 데스크 위에 글자 없는 서류 더미, 양옆에 큼직한 화분, 바닥은 크림색 대리석. 큰 빈 벽면 없이 데스크·소파·식물로 채우고 사람은 없음. 따뜻한 크림과 연한 금색 조명, 저폴리곤 단순화. 서류에 글자·숫자·로고 없음, 화면 없음.",
      videoStyle: "bright loan consultation lobby with round consultation desks and pastel sofas and plain unmarked document stacks",
      videoStatics: "the round consultation desks with plain document stacks, the pastel sofas, the large potted plants, and the cream marble floor",
    },
  }),

  scenesTimeline:
    "s1 훅 / s2 오프닝(압축형) / s3 숫자(5,000억 달러 구상) / s4 구조(칩 담보) / s5 코어위브 85억 달러 / s6 핵심질문 / s7 근거1 수명 / s8 감가상각 풀이 / s9 후하게 vs 박하게 / s10 근거2 보증 / s11 한국(네이버) / s12 균형(구상 단계) / s13 통찰 / s14 체크 / s15 프레임 / s16 예고+댓글",

  instagramCaptionHook: "GPU는 사서 쓰는 줄 알았는데, 엔비디아 칩이 집처럼 담보로 잡히기 시작했어",
  instagramCaptionPoints: [
    "로이터 보도에 따르면 엔비디아가 월가와 5,000억 달러 규모의 칩 담보 대출 구상을 추진 중이야, AI 회사가 칩을 직접 사는 대신 칩을 담보로 은행과 사모펀드에서 돈을 빌리는 구조야",
    "코어위브는 이미 GPU를 담보로 85억 달러를 빌렸어",
    "걸림돌은 수명이야, 엔비디아는 GPU를 최대 10년까지 쓴다고 보는데 은행은 보통 3~4년에 걸쳐 가치를 깎아서 계산해",
    "은행과 펀드는 처음 구상보다 높은 보증을 요구하고 있고, 은행 소식통들은 엔비디아가 모든 거래에 보증을 서야 할 수도 있다고 전했어",
    "한국에서도 네이버의 대규모 GPU 사업을 두고 금융권이 칩 교체 주기를 따져 대출 규모를 정하고 있어",
    "👉 은행이 칩 수명을 몇 년으로 인정하는지, 엔비디아가 서야 할 보증이 늘어나는지 확인해봐",
    "※ 아직 구상과 협의 단계라 규모와 조건은 바뀔 수 있어, 공개된 보도를 정리한 거고 특정 종목 추천이나 투자 권유가 아니야",
  ],
  instagramPriorityTags: ["엔비디아", "GPU", "코어위브", "AI투자", "담보대출", "감가상각", "AI반도체", "네이버", "주식공부", "주식투자", "경제뉴스", "황소특보"],

  emphasisTerms: ["GPU", "담보", "수명", "보증", "엔비디아", "황소특보"],

  // TTS가 문장 중간에서 0.2~0.3초 쉬는 곳("서야 | 할")에서 자막이 깜빡 꺼지지 않게 같은 씬 안 짧은 공백을 앞 자막으로 이어 붙인다(조립기 옵션, 다른 편은 미사용).
  captionGapBridgeSec: 0.3,
  // "칩이 얼마나 팔리는지뿐 | 아니라": 한 대사 안에서 TTS가 "뿐"과 "아니라" 사이에 호흡을 두어 자막이 시간 순으로 두 블록이 됨 — 한 블록으로 못 합치는 길이(폭 760px 초과).
  captionBoundaryExceptions: Object.freeze([
    { left: "팔리는지뿐", right: "아니라", reason: "한 문장 '뿐 아니라'를 폭 한도(760px) 안에서 한 블록에 못 담음 — TTS 재생성 회피, QA 경고로 기록(2026-10-04 황소 20편)" },
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
      scene: 1, key: "s1_hook", role: "hook", video: "bull_ep20_s1_motion.mp4",
      narration: "다들, GPU는 사서 쓰는 거라고 생각했지? 근데 엔비디아 칩이 집처럼 담보로 잡히기 시작했어.",
      imageBrief: card2("GPU도 담보", "집처럼 잡힌다", "놀라고 궁금한 표정으로"),
      overlays: [], shot: "medium", bg: "A",
      motion: cardMotion("wide-eyed and curious, eyebrows raised, as if revealing a surprising turn", "posing a surprising question to the viewer"),
    },
    {
      scene: 2, key: "s2_opening", role: "opening", video: "bull_ep20_s2_motion.mp4",
      narration: "안녕, 투자 소식 정리해주는 황소특보야. 핵심만 짚어줄게.",
      imageBrief: "황소가 정면을 보며 한 손으로 위를 가리키고 다른 손은 허리에 얹은 채 밝고 명랑하게 웃는 포즈, 소품 없음.",
      overlays: [], shot: "wide", bg: "A",
      motion: { type: "open", action: "the character keeps one hand raised with the index finger pointing upward in a confident, friendly gesture while the other hand rests on its hip, smiling brightly and warmly at the viewer.", mood: "warmly greeting the viewer" },
      riskDisclosure: true,
    },
    {
      scene: 3, key: "s3_situation_plan", role: "background", video: "bull_ep20_s3_motion.mp4",
      narration: "숫자부터 보자. 엔비디아가 월가와 5,000억 달러 규모의 칩 담보 대출 구상을 추진하고 있어.",
      imageBrief: card2("5,000억 달러", "칩 담보 대출 구상", "진지하고 또렷하게 알리는 표정으로"),
      overlays: [], shot: "medium", bg: "A",
      motion: cardMotion("serious and clear with slight nods as if reporting a big number", "seriously reporting the plan size"),
    },
    {
      scene: 4, key: "s4_situation_structure", role: "background", video: "bull_ep20_s4_motion.mp4",
      narration: "AI 회사가 칩을 직접 사는 대신, 칩을 담보로 은행과 사모펀드에서 돈을 빌리는 구조야.",
      imageBrief: card2("칩을 담보로", "돈을 빌리는 구조", "차분하고 또렷하게 설명하는 표정으로"),
      overlays: [], shot: "medium", bg: "B",
      motion: cardMotion("calm and clear with slight nods", "calmly explaining the structure"),
    },
    {
      scene: 5, key: "s5_situation_coreweave", role: "background", video: "bull_ep20_s5_motion.mp4",
      narration: "코어위브는 이미 이런 식으로 85억 달러를 빌렸어.",
      imageBrief: card2("코어위브", "85억 달러 대출", "또렷하고 친절하게 설명하는 표정으로"),
      overlays: [], shot: "medium", bg: "B",
      motion: cardMotion("clear and friendly with slight nods", "clearly giving an example"),
    },
    {
      scene: 6, key: "s6_core_q", role: "twist", video: "bull_ep20_s6_motion.mp4",
      narration: "그럼 뭐가 걸림돌일까? 한마디로 엔비디아와 은행이 칩 수명과 담보 값을 서로 다르게 보고 있어.",
      imageBrief: card2("수명과 담보 값", "서로 다른 시각", "확신에 찬 표정으로"),
      overlays: [], shot: "medium", bg: "C",
      motion: cardMotion("confident and knowing with a slight nod", "confidently delivering the key answer"),
    },
    {
      scene: 7, key: "s7_evidence_life", role: "evidence", video: "bull_ep20_s7_motion.mp4",
      narration: "첫째는 수명이야. 엔비디아는 최대 10년까지 보는데, 은행은 보통 3~4년에 걸쳐 가치를 깎아.",
      imageBrief: card2("첫째 수명", "10년 vs 3~4년", "또렷하고 친절하게 설명하는 표정으로"),
      overlays: [], shot: "medium", bg: "C",
      motion: cardMotion("clear and friendly with slight nods", "clearly contrasting the two views"),
    },
    {
      scene: 8, key: "s8_evidence_depreciation", role: "evidence", video: "bull_ep20_s8_motion.mp4",
      narration: "가치를 깎는다는 건 중고차 값이 해마다 떨어지는 걸 미리 계산하는 거야. 길게 볼수록 담보 값이 커지지.",
      imageBrief: card2("중고차 값처럼", "해마다 가치 하락", "쉽게 풀어주는 친절한 표정으로"),
      overlays: [], shot: "medium", bg: "A",
      motion: cardMotion("friendly and explanatory with slight nods as if giving an easy analogy", "friendly explaining with an analogy"),
    },
    {
      scene: 9, key: "s9_evidence_view", role: "evidence", video: "bull_ep20_s9_motion.mp4",
      narration: "그래서 엔비디아는 후하게 쳐주길 바라고, 은행은 박하게 보는 거야.",
      imageBrief: "황소가 한 손은 크게 펼치고 다른 손은 작게 모아 서로 다른 두 시각을 보여주는 설명 포즈, 소품 없음.",
      overlays: [], shot: "wide", bg: "A",
      motion: { type: "open", action: "the character opens one hand wide and holds the other hand small and closed as if contrasting two views, with a clear explanatory expression", mood: "clearly contrasting generous and strict views" },
    },
    {
      scene: 10, key: "s10_evidence_guarantee", role: "evidence", video: "bull_ep20_s10_motion.mp4",
      narration: "둘째는 보증이야. 은행과 펀드가 처음 구상보다 높은 보증을 요구해서, 엔비디아가 모든 거래에 보증을 설 수도 있대.",
      imageBrief: card2("둘째 보증", "더 높은 보증 요구", "진지하고 또렷하게 알리는 표정으로"),
      overlays: [], shot: "medium", bg: "B",
      motion: cardMotion("serious and clear with slight nods", "seriously reporting the guarantee demand"),
    },
    {
      scene: 11, key: "s11_link_naver", role: "evidence", video: "bull_ep20_s11_motion.mp4",
      narration: "한국도 남 일이 아니야. 네이버의 대규모 GPU 사업도 금융권이 칩 교체 주기를 따져 대출 규모를 정하고 있거든.",
      imageBrief: card2("한국도 남 일 아님", "네이버 GPU 사업", "또렷하고 신중하게 설명하는 표정으로"),
      overlays: [], shot: "medium", bg: "B",
      motion: cardMotion("clear and careful with slight nods", "carefully connecting to Korea"),
    },
    {
      scene: 12, key: "s12_balance", role: "counterpoint", video: "bull_ep20_s12_motion.mp4",
      narration: "물론 조심할 것도 있어. 아직 구상과 협의 단계라 규모와 조건은 바뀔 수 있어.",
      imageBrief: "황소가 신중하고 걱정스러운 표정으로 한 손을 턱 근처에 대고 다른 손은 허리에 얹은 포즈, 소품 없음.",
      overlays: [], shot: "close", bg: "C",
      motion: { type: "open", action: "the character rests one hand near its chin with a careful, thoughtful expression and slight head tilts while the other hand rests on its hip", mood: "carefully noting the caveat" },
    },
    {
      scene: 13, key: "s13_insight", role: "insight", video: "bull_ep20_s13_motion.mp4",
      narration: "한 줄로 정리하면, AI 붐은 칩 성능만이 아니라 칩을 담보로 얼마나 빌릴 수 있느냐로도 갈려.",
      imageBrief: card2("AI 붐은 돈줄도", "칩 성능만이 아님", "확신에 찬 표정으로"),
      overlays: [], shot: "medium", bg: "C",
      motion: cardMotion("confident and knowing with slight nods", "confidently delivering the one-line summary"),
    },
    {
      scene: 14, key: "s14_check", role: "action", video: "bull_ep20_s14_motion.mp4",
      narration: "확인할 건 두 가지, 은행이 칩 수명을 몇 년으로 인정하는지랑 엔비디아가 서야 할 보증이 늘어나는지야.",
      imageBrief: card2("① 인정할 칩 수명", "② 엔비디아 보증", "친절하고 또렷하게 알려주는 표정으로"),
      overlays: [], shot: "medium", bg: "C",
      motion: cardMotion("clear and helpful with slight nods as if listing two things to check", "clearly listing two things to check"),
    },
    {
      scene: 15, key: "s15_frame", role: "frame", video: "bull_ep20_s15_motion.mp4",
      narration: "AI 투자는 칩이 얼마나 팔리는지뿐 아니라 그 돈이 어디서 오는지도 봐야 해. 이유를 알아야 다음 신호가 읽혀. 이것만은 챙겨가.",
      imageBrief: card2("칩 판매뿐 아니라", "돈줄도 본다", "따뜻하고 차분한 미소로"),
      overlays: [], shot: "medium", bg: "A",
      motion: cardMotion("warm and calm with a gentle smile", "warmly reassuring the viewer"),
    },
    {
      scene: 16, key: "s16_cta", role: "save", video: "bull_ep20_s16_motion.mp4",
      narration: "담보 조건이 정해지면 황소특보가 제일 먼저 들고 올게. 짚어줬으면 하는 이슈는 댓글로 남겨줘.",
      imageBrief: "황소가 밝은 미소로 한 손을 가볍게 흔들고 다른 손은 자연스럽게 내린 마무리 포즈, 소품 없이 빈 손.",
      overlays: [], shot: "wide", bg: "A",
      motion: { type: "open", action: "the character smiles brightly and waves one hand lightly in a friendly goodbye while the other hand hangs naturally relaxed", mood: "warmly saying goodbye and inviting comments" },
      riskDisclosure: true,
    },
  ]),
});

/** 장면 키로 스펙을 찾는다. */
export function findBullEp20Scene(key) {
  return BULL_EP20_ASSEMBLY_SPEC.scenes.find((s) => s.key === key) ?? null;
}
