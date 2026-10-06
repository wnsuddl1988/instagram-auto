/**
 * 황소특보 18편 조립 스펙 — 15장면(법원이 시가총액 미달 상장폐지 규정에 제동). 씬 구조 v3 + 성공 공식/엔딩 5박자 열한 번째 적용본.
 *
 * 번호 주의: 소재 후보 3번(C)이 외국인 편(17편) 다음 순서라 18편(파일 ep18)이다. 배포 순서가 바뀌면 번호를 다시 받는다.
 * 전달 메시지 한 줄: 법원이 시총 퇴출 규정에 제동을 걸었지만 임시 판단이라 퇴출 제도가 없어진 건 아니다 — 내 종목의 상태는 공시로 확인한다.
 * 담당: 황소특보(투자자 입장, 규칙 22). 영역 시장 제도(기타) · 레인 ④ 시장 제도·정책 · 유형 schedule · 특보 근접도 상(10/2 결정).
 *
 * ★ 소재 선정 경위(2026-10-03)★: `C:/tmp/bull-topic-scan-ep16/SCAN_CHECKLIST.md` 11단계 + 후보 25개 → Owner "1~3번 소재로 3개 편"(2026-10-03) → "상폐 편은 원문 확인 후 확정"
 * (2026-10-03, 회사 공시 원문 + 법률신문으로 확인) → "차례로 이어서". Owner "종목 실명은 허용하고" → 회사 자율공시 사실로 주연테크·케이엠제약 실명 기재.
 * 초안·팩트표·새 독자 읽기 점검(규칙 29): `_ai/bull-ep16-18-scripts-draft.md`(C).
 *
 * ★ 핵심 팩트(2026-10-03, 회사 공시 원문 + 법률신문·뉴스핌·서울경제)★
 * - 서울남부지법(민사51부) 2026-10-02 가처분 인용: 주연테크(코스피, 사건 2026카합1541) "본안판결 확정시까지 2026.9.28 상장폐지결정의 효력을 정지", "정리매매절차를 진행하여서는 아니 된다", 나머지 신청 기각.
 * - 케이엠제약(코스닥, 사건 2026카합1532) 9/14 상장폐지결정 효력을 본안판결 확정시까지 정지·정리매매 안 함, 회사 공시는 "가처분 결정이고 본안 확정 판결이 아니다".
 * - 법원이 위법·무효로 본 것: 시총 미달 상폐 요건 조항(코스닥시장 상장규정 54조 1항 12호)과 기준 적용 시기를 2027.1→2026.7로 앞당긴 부칙(2조 1항). 시총 하나로 이의신청·소명 기회를 배제한 건 비례원칙 위반.
 * - 거래소는 "가처분이 인용되면 자본시장 개혁이 지연되고 유사 신청이 잇따를 수 있다"고 주장. 같은 소송: 골드앤에스(9/9)·유틸렉스·핀텔(10/1) 등 신청.
 * - 금융위 상장폐지 개혁 방안(2/12): 시총 기준 단계적 상향, 동전주 신설(대사엔 "단계적으로 올려 왔어"만). 대사에서 뺀 것: 금액, 9/4 정부의 6개월 연기(시점 혼동 방지).
 * - 리스크 고지: 나레이션에 넣지 않고 오프닝(s2)·마지막(s15) 하단 자막바로만.
 *
 * TTS 실측: 15씬 103.40초, API 1/1, 순수 발화 최대 8.36초, 정렬 밀림 없음(최대 -0.14초) — `C:/tmp/money-shorts-os/bull-ep18-tts/output-v1/`. 본편이 짧다(권고 115~127초 아래, 흐름 우선).
 */

const CARD_LAYOUT =
  "구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄, 카드에 그림·화살표 없이 글자만.";
const card2 = (l1, l2, expression) => `황소가 ${expression} '${l1}'와 '${l2}'가 두 줄로 크게 적힌 카드를 두 손으로 감싸 쥐고 보여주는 자세. ${CARD_LAYOUT}`;

export const BULL_EP18_ASSEMBLY_SPEC = Object.freeze({
  specVersion: "bull_assembly_spec_v1",
  scriptStructureVersion: "bull_script_structure_v3",
  endingStructureVersion: "bull_ending_5beat_2026_09_29",
  episode: 18,
  sourceCandidate: "candidate-bull-ep18-court-halts-market-cap-delisting-2026-10-03",
  title: "시가총액 미달 상장폐지, 법원이 제동 건 이유",
  channelName: "경제번역소",
  characterDisplayName: "황소특보",
  headerTitle: ["시총 상장폐지", "법원이 제동", "임시 판단"],

  // ── 이미지·영상 연출 필드(품질 체계 v2, 규칙 15) ──
  hookType: "T1",
  imageCharacter: "bull3dv1",
  imagePrefix: "bull_ep18",
  // 소재(법원 결정·상장 심사·공시 확인)에 맞는 공간 3곳. 직전 편들(17편 백화점·물류 홀·공항 라운지, 16편 금고 로비·저울 광장·발표장 등)과 겹치지 않는다.
  // 배경에 글자·숫자·로고·간판·화면·달력 없음.
  sceneBackgrounds: Object.freeze({
    A: {
      label: "원목 심판 홀(도입·상황·정리·마무리)",
      image:
        "밝고 단정한 원목 심판 홀. 황소특보 뒤로 둥근 목재 단상과 큼직한 목재 망치 조형물(글자 없음), 양옆 높은 책장에 글자 없는 단색 두꺼운 책 더미, 큼직한 화분, 바닥은 따뜻한 원목 마루와 둥근 러그. 큰 빈 벽면 없이 단상·책장·식물로 채우고 사람은 없음. 따뜻한 앰버·크림 조명에 골드 포인트, 저폴리곤 단순화. 글자·숫자·간판·로고·화면 없음, 책 표지에도 글자 없음.",
      videoStyle: "bright wooden judgment hall with a round wooden podium and a large plain wooden gavel sculpture",
      videoStatics: "the round wooden podium, the large plain wooden gavel sculpture, the tall bookshelves with plain single-color thick books, the large potted plants, and the warm wooden floor with a round rug",
    },
    B: {
      label: "상장 심사 사무실(규정·소명 설명)",
      image:
        "밝은 상장 심사 사무실. 황소특보 뒤로 둥근 책상 몇 개와 글자 없는 단색 서류 더미, 단색 파랑·초록 바인더가 꽂힌 서류함 선반, 양옆에 큼직한 화분, 바닥은 매끈한 연한 하늘색 광택 바닥. 큰 빈 벽면 없이 책상·서류함·식물로 채우고 사람은 없음. 화이트·연한 하늘색 조명에 골드 포인트, 저폴리곤 단순화. 서류·바인더에 글자·숫자·로고 없음, 시계·달력·화면 없음.",
      videoStyle: "bright listing review office with plain unmarked document stacks and plain colored binders",
      videoStatics: "the round desks, the stacks of plain blank documents, the filing shelves with plain single-color blue and green binders, the large potted plants, and the glossy light sky-blue floor",
    },
    C: {
      label: "공시 열람 홀(본안 판결·확인할 것)",
      image:
        "탁 트인 공시 열람 홀. 황소특보 뒤로 둥근 대형 패널 세 개(패널에는 무늬 없는 단색 파랑·민트 면만, 글자·숫자·그래프 없음)와 낮은 열람 테이블 몇 개, 양옆에 큼직한 화분, 바닥은 매끈한 남색 광택 바닥. 큰 빈 벽면 없이 패널·테이블·식물로 채우고 사람은 없음. 은은한 네이비·민트 조명에 골드 포인트, 저폴리곤 단순화. 글자·숫자·그래프·간판·로고·화면 없음.",
      videoStyle: "open disclosure reading hall with plain blue and mint round panels",
      videoStatics: "the three large round panels with plain single-color blue and mint surfaces, the low reading tables, the large potted plants, and the glossy navy floor",
    },
  }),

  scenesTimeline:
    "s1 훅 / s2 오프닝(압축형) / s3 상황(10/2 서울남부지법·두 회사) / s4 상황(기준 적용 앞당긴 규정) / s5 법원 판단(소명 기회·비례원칙) / s6 금융위 단계적 상향 / s7 핵심질문(임시 판단·본안 남음) / s8 근거1 효력 범위 / s9 근거2 확산(같은 소송) / s10 균형(본안에서 이기면) / s11 정리매매 멈춰도 안전 아님 / s12 통찰 / s13 체크(공시·본안) / s14 프레임·이득 각인 / s15 당부+예고+댓글",

  instagramCaptionHook: "시가총액만 모자라도 상장폐지될까? 법원이 이 규정에 제동을 걸었어",
  instagramCaptionPoints: [
    "서울남부지법은 10월 2일 주연테크(코스피)와 케이엠제약(코스닥)의 상장폐지 결정 효력을 본안 판결 확정 때까지 멈추고 정리매매도 막았어",
    "문제가 된 건 시가총액 미달 상장폐지 요건과, 그 기준 적용 시기를 내년 1월에서 올해 7월로 앞당긴 규정이야, 법원은 시가총액 하나로 이의신청과 소명 기회도 없이 퇴출하는 건 비례원칙에 어긋난다고 봤어",
    "다만 가처분(임시 결정)이라 본안 판결이 남아 있고, 거래소는 가처분이 인용되면 자본시장 개혁이 지연되고 유사 신청이 잇따를 수 있다고 주장했어, 골드앤에스·유틸렉스·핀텔 등도 같은 취지로 신청했어",
    "본안에서 거래소가 이기면 상장폐지 절차가 다시 이어질 수 있어서, 정리매매가 멈췄다고 회사가 안전해졌다는 뜻은 아니야",
    "👉 내 종목의 시가총액과 관리종목 지정 여부는 거래소 공시로 확인하고, 본안 판결과 거래소 대응을 지켜봐",
    "※ 회사 공시와 보도를 정리한 거고 특정 종목 추천이나 투자 권유가 아니야, 법원 결정은 임시 판단이라 달라질 수 있어",
  ],
  instagramPriorityTags: [
    "상장폐지",
    "시가총액",
    "관리종목",
    "정리매매",
    "한국거래소",
    "서울남부지법",
    "주연테크",
    "케이엠제약",
    "주식공부",
    "주식투자",
    "경제뉴스",
    "황소특보",
  ],

  emphasisTerms: ["상장폐지", "시총", "본안", "공시", "황소특보"],

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
      scene: 1, key: "s1_hook", role: "hook", video: "bull_ep18_s1_motion.mp4",
      narration: "다들, 시가총액만 모자라도 상장폐지된다고 생각했지? 근데 법원이 이 규정에 제동을 걸었어.",
      imageBrief: card2("시총만 모자라도", "상장폐지?", "놀라고 궁금한 표정으로"),
      overlays: [], shot: "medium", bg: "A",
      motion: { type: "card2", action: "the character's expression is wide-eyed and curious, eyebrows raised, as if revealing a surprising turn; body and face move gently while the hands holding the card stay still.", mood: "posing a surprising question to the viewer" },
    },
    {
      scene: 2, key: "s2_opening", role: "opening", video: "bull_ep18_s2_motion.mp4",
      narration: "안녕, 투자 소식 정리해주는 황소특보야. 핵심만 짚어줄게.",
      imageBrief: "황소가 정면을 보며 한 손으로 위를 가리키고 다른 손은 허리에 얹은 채 밝고 명랑하게 웃는 포즈, 소품 없음.",
      overlays: [], shot: "wide", bg: "A",
      motion: { type: "open", action: "the character keeps one hand raised with the index finger pointing upward in a confident, friendly gesture while the other hand rests on its hip, smiling brightly and warmly at the viewer.", mood: "warmly greeting the viewer" },
      riskDisclosure: true,
    },
    {
      scene: 3, key: "s3_situation_court", role: "background", video: "bull_ep18_s3_motion.mp4",
      narration: "숫자부터 보자. 10월 2일 서울남부지법이 주연테크와 케이엠제약의 상장폐지 효력과 정리매매를 멈췄어.",
      imageBrief: card2("10/2 서울남부지법", "주연테크·케이엠제약", "진지하고 또렷하게 알리는 표정으로"),
      overlays: [], shot: "medium", bg: "A",
      motion: { type: "card2", action: "the character's expression is serious and clear with slight nods as if reporting a court decision; only the face and body move while the hands holding the card stay still.", mood: "seriously reporting the court decision" },
    },
    {
      scene: 4, key: "s4_situation_rule", role: "background", video: "bull_ep18_s4_motion.mp4",
      narration: "문제가 된 건 시가총액 퇴출 기준을 내년 1월에서 올해 7월로 앞당긴 규정이야.",
      imageBrief: card2("시총 퇴출 기준", "6개월 앞당긴 규정", "차분하고 또렷하게 설명하는 표정으로"),
      overlays: [], shot: "medium", bg: "B",
      motion: { type: "card2", action: "the character's expression is calm and clear with slight nods; only the face and body move while the hands holding the card stay still.", mood: "calmly explaining the problem rule" },
    },
    {
      scene: 5, key: "s5_situation_reason", role: "background", video: "bull_ep18_s5_motion.mp4",
      narration: "법원은 시가총액 하나로, 이의신청과 소명 기회도 없이 퇴출하는 건 비례원칙에 어긋난다고 봤어.",
      imageBrief: card2("소명 기회 없는 퇴출", "비례원칙 위반", "단호하고 또렷하게 설명하는 표정으로"),
      overlays: [], shot: "medium", bg: "B",
      motion: { type: "card2", action: "the character's expression is firm and clear with slight nods; only the face and body move while the hands holding the card stay still.", mood: "firmly explaining the court's reasoning" },
    },
    {
      scene: 6, key: "s6_situation_fsc", role: "background", video: "bull_ep18_s6_motion.mp4",
      narration: "금융위는 올해 부실기업 퇴출 기준을 단계적으로 올려 왔어.",
      imageBrief: "황소가 한 손으로 뒤쪽의 서류함 선반을 가리키며 또렷하고 차분하게 설명하는 포즈, 다른 손은 허리에 얹음, 소품 없음.",
      overlays: [], shot: "wide", bg: "B",
      motion: { type: "open", action: "the character points one hand toward the filing shelves behind it with a clear, calm explanatory expression while the other hand rests on its hip", mood: "calmly noting the policy background" },
    },
    {
      scene: 7, key: "s7_core_q", role: "twist", video: "bull_ep18_s7_motion.mp4",
      narration: "그럼 시총 미달 퇴출은 이제 끝난 걸까? 한마디로 아니야, 이번 결정은 임시 판단이라 본안 판결이 남아 있거든.",
      imageBrief: card2("끝난 게 아니야", "본안 판결이 남음", "확신에 찬 표정으로"),
      overlays: [], shot: "medium", bg: "C",
      motion: { type: "card2", action: "the character's expression is confident and knowing with a slight nod; only the face and body move while the hands holding the card stay still.", mood: "confidently delivering the key answer" },
    },
    {
      scene: 8, key: "s8_evidence_effect", role: "evidence", video: "bull_ep18_s8_motion.mp4",
      narration: "첫째는 효력이야. 본안 판결이 확정될 때까지 상장폐지 결정과 정리매매만 멈춘 거야.",
      imageBrief: card2("본안 확정까지", "폐지·정리매매 정지", "또렷하고 친절하게 설명하는 표정으로"),
      overlays: [], shot: "medium", bg: "C",
      motion: { type: "card2", action: "the character's expression is clear and friendly with slight nods as if explaining the scope; only the face and body move while the hands holding the card stay still.", mood: "clearly explaining the scope of the order" },
    },
    {
      scene: 9, key: "s9_evidence_spread", role: "evidence", video: "bull_ep18_s9_motion.mp4",
      narration: "둘째는 확산이야. 같은 소송을 낸 회사들이 줄을 잇고 있어서, 비슷한 신청이 더 나올 수 있어.",
      imageBrief: card2("같은 소송 신청이", "줄을 잇고 있다", "또렷하고 신중하게 설명하는 표정으로"),
      overlays: [], shot: "medium", bg: "A",
      motion: { type: "card2", action: "the character's expression is clear and careful with slight nods; only the face and body move while the hands holding the card stay still.", mood: "carefully noting that similar cases are piling up" },
    },
    {
      scene: 10, key: "s10_balance", role: "counterpoint", video: "bull_ep18_s10_motion.mp4",
      narration: "물론 조심할 것도 있어. 본안에서 거래소가 이기면 상장폐지 절차가 다시 이어질 수도 있지.",
      imageBrief: "황소가 신중하고 걱정스러운 표정으로 한 손을 턱 근처에 대고 다른 손은 허리에 얹은 포즈, 소품 없음.",
      overlays: [], shot: "close", bg: "A",
      motion: { type: "open", action: "the character rests one hand near its chin with a careful, thoughtful expression and slight head tilts while the other hand rests on its hip", mood: "carefully noting the caveat" },
    },
    {
      scene: 11, key: "s11_balance_safe", role: "counterpoint", video: "bull_ep18_s11_motion.mp4",
      narration: "그러니 정리매매가 멈춘 종목이 있어도, 그게 회사가 안전해졌다는 뜻은 아니야.",
      imageBrief: card2("정리매매 멈춰도", "안전해진 건 아님", "신중하고 단호한 표정으로"),
      overlays: [], shot: "medium", bg: "A",
      motion: { type: "card2", action: "the character's expression is careful and firm, eyebrows slightly furrowed, as if warning against a misreading; only the face and body move while the hands holding the card stay still.", mood: "firmly cautioning against a misreading" },
    },
    {
      scene: 12, key: "s12_insight", role: "insight", video: "bull_ep18_s12_motion.mp4",
      narration: "한 줄로 정리하면, 시총 퇴출 규정에 절차 흠이 있다는 임시 판단이지 퇴출 제도가 없어진 건 아니야.",
      imageBrief: card2("절차 흠이 있다는", "임시 판단", "확신에 찬 표정으로"),
      overlays: [], shot: "medium", bg: "A",
      motion: { type: "card2", action: "the character's expression is confident and knowing with slight nods; only the face and body move while the hands holding the card stay still.", mood: "confidently delivering the one-line summary" },
    },
    {
      scene: 13, key: "s13_check", role: "action", video: "bull_ep18_s13_motion.mp4",
      narration: "확인할 건 두 가지, 내 종목의 시총과 관리종목 지정 여부는 거래소 공시로 보고, 본안 판결과 거래소 대응을 지켜보면 돼.",
      imageBrief: card2("① 시총·관리종목", "② 본안·거래소 대응", "친절하고 또렷하게 알려주는 표정으로"),
      overlays: [], shot: "medium", bg: "B",
      motion: { type: "card2", action: "the character's expression is clear and helpful with slight nods as if listing two things to check; only the face and body move while the hands holding the card stay still.", mood: "clearly listing two things to check" },
    },
    {
      scene: 14, key: "s14_frame", role: "frame", video: "bull_ep18_s14_motion.mp4",
      narration: "규정이 흔들려도 내 종목의 상태는 공시로 확인해야 해. 이유를 알아야 다음 신호가 읽혀. 이것만은 챙겨가.",
      imageBrief: card2("규정이 흔들려도", "공시로 확인", "따뜻하고 차분한 미소로"),
      overlays: [], shot: "medium", bg: "B",
      motion: { type: "card2", action: "the character's expression is warm and calm with a gentle smile; only the face and body move while the hands holding the card stay still.", mood: "warmly reassuring the viewer" },
    },
    {
      scene: 15, key: "s15_cta", role: "save", video: "bull_ep18_s15_motion.mp4",
      narration: "본안 판결이나 거래소 대응이 나오면 황소특보가 제일 먼저 들고 올게. 짚어줬으면 하는 이슈는 댓글로 남겨줘.",
      imageBrief: "황소가 밝은 미소로 한 손을 가볍게 흔들고 다른 손은 자연스럽게 내린 마무리 포즈, 소품 없이 빈 손.",
      overlays: [], shot: "wide", bg: "A",
      motion: { type: "open", action: "the character smiles brightly and waves one hand lightly in a friendly goodbye while the other hand hangs naturally relaxed", mood: "warmly saying goodbye and inviting comments" },
      riskDisclosure: true,
    },
  ]),
});

/** 장면 키로 스펙을 찾는다. */
export function findBullEp18Scene(key) {
  return BULL_EP18_ASSEMBLY_SPEC.scenes.find((s) => s.key === key) ?? null;
}
