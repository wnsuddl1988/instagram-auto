/**
 * 황소특보 23편 조립 스펙 — 17장면(삼성전자 3분기 잠정실적: 영업이익 107.4조인데 증권가 예상과 거의 같았다). 씬 구조 v3 + 성공 공식/엔딩 5박자.
 *
 * 번호: 22편(8일 ETF 리밸런싱)에 이은 23편(파일 ep23). 22편 마지막 약속("삼성전자 잠정실적이 나오면 제일 먼저 들고 올게") 회수.
 * 전달 메시지 한 줄: 실적은 숫자가 얼마나 컸는지보다 기대(컨센서스)와 얼마나 달랐는지로 읽는다 — 107조는 기대에 이미 들어 있던 숫자라 다음 신호는 숫자 밖에서 나온다.
 * 담당: 황소특보(투자자 입장, 규칙 22). 소재는 22편 CTA 예고로 이미 정해져 있어 러너 풀스캔은 하지 않았다(Owner 2026-10-08 "이미 주제 정해져 있는 거 아니야?"). 쏠림 점검은 반도체 4/5편으로 경고(참고 표시만, 규칙 11 ★★).
 * 대본: `C:/tmp/bull-ep23-draft/scenes-v4.json`(검사기 반드시 수정 0), 사실 원본 `C:/tmp/bull-ep23-sources/`(DART 공정공시 2026.10.08).
 *
 * ★ 핵심 팩트(DART 연결 영업(잠정)실적 공정공시 2026.10.08 원본 직접 확인)★
 * - 3분기 매출 195.00조·영업이익 107.40조, 전기(2분기) 171.50조·89.49조(+13.70%·+20.01%), 전년 동기 86.06조·12.17조(+126.59%·+782.50%).
 * - 누계(1~9월) 매출 500.37조·영업이익 254.13조(전년 누계 239.77조·23.53조, 영업이익 +980.03%). 순이익 항목 없음, 이사회 승인 시점 재공시 예정, 감사 전 잠정치.
 * - 컨센서스(에프앤가이드): 영업이익 108.13조(머니투데이 10/5)·108.68조(뉴시스 10/8 05:01), 매출 201.7조(머니투데이)·200조(뉴시스). 9월 중순 영업이익 114조 안팎(tf뉴스 9/17). 연합인포맥스 8곳 집계는 약 107.0조(검색 요약, 대본 미사용).
 * - 8일 ETF 매물 약 2,098억 원: 22편 팩트(서울경제 10/6 삼성증권 추산, 아시아경제 10/1 교차).
 * - 리스크 고지: 나레이션에 넣지 않고 오프닝(s2)·마지막(s17) 하단 자막바로만.
 *
 * TTS 실측: 17씬 114.12초, API 1/1, 순수 발화 최대 7.53초(s1), 정렬 밀림 최대 -0.1초 → 보정 씬 없음 — `C:/tmp/money-shorts-os/bull-ep23-tts/output-v1/`.
 */

const CARD_LAYOUT =
  "구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄, 카드에 그림·화살표 없이 글자만.";
const card2 = (l1, l2, expression) => `황소가 ${expression} '${l1}'와 '${l2}'가 두 줄로 크게 적힌 카드를 두 손으로 감싸 쥐고 보여주는 자세. ${CARD_LAYOUT}`;
const cardMotion = (action, mood) => ({ type: "card2", action: `the character's expression is ${action}; only the face and body move while the hands holding the card stay still.`, mood });

export const BULL_EP23_ASSEMBLY_SPEC = Object.freeze({
  specVersion: "bull_assembly_spec_v1",
  scriptStructureVersion: "bull_script_structure_v3",
  endingStructureVersion: "bull_ending_5beat_2026_09_29",
  episode: 23,
  sourceCandidate: "candidate-bull-ep23-samsung-q3-preliminary-oct8-2026-10-08",
  title: "삼성전자 107조, 근데 왜 안 놀랍지?",
  channelName: "경제번역소",
  characterDisplayName: "황소특보",
  // 제목(2026-10-08 Owner "후킹 있게 네가 지어봐" → 확정): 영업이익이 작년의 8.8배인데 시장 기대와 거의 같았다는 반전을 질문으로. 커버 헤드라인은 규칙 30으로 이 문구 그대로 쓴다(커버는 4줄).
  headerTitle: ["삼성전자 107조,", "근데 왜", "안 놀랍지?"],

  hookType: "T1",
  imageCharacter: "bull3dv1",
  imagePrefix: "bull_ep23",
  // 소재(기대·과녁·막대·예보)에 맞는 공간 3곳. 직전 편들(22편 균형 조형물 홀·상자 물류 홀·조각 원형 홀, 21편 속도 전시관·고속도로 카페·경사로 갤러리, 20편 칩 창고·감정실·상담 로비)과 겹치지 않는다. 배경에 글자·숫자·로고·화면 없음.
  sceneBackgrounds: Object.freeze({
    A: {
      label: "과녁 조형물 홀(도입·핵심질문·정리·마무리)",
      image:
        "밝은 전시 홀. 황소특보 뒤로 큼직한 단색 동심원 과녁 조형물 두 개(눈금·숫자·글자 없이 색만 다른 둥근 고리 모양, 한가운데 금색 원), 매끈한 흰색 광택 바닥, 양옆에 큼직한 화분. 큰 빈 벽면 없이 조형물·식물로 채우고 사람은 없음. 화이트와 연한 코랄 조명에 골드 포인트, 저폴리곤 단순화. 글자·숫자·눈금·로고·화면 없음.",
      videoStyle: "bright exhibition hall with two large plain concentric-ring target sculptures without any marks, numbers or text",
      videoStatics: "the two large plain concentric-ring target sculptures, the large potted plants, and the glossy white floor",
    },
    B: {
      label: "막대 기둥 전시관(숫자·비교·누계)",
      image:
        "밝고 깨끗한 전시관. 황소특보 뒤로 높이가 서로 다른 단색 막대 기둥 조형물 여러 개가 줄지어 서 있고(눈금·숫자·글자 없이 색만 다른 굵은 직육면체), 양옆에 큼직한 화분, 바닥은 연한 회색 광택 바닥. 큰 빈 벽면 없이 기둥·식물로 채우고 사람은 없음. 따뜻한 햇살 조명에 골드 포인트, 저폴리곤 단순화. 글자·숫자·간판·로고·화면 없음.",
      videoStyle: "bright clean gallery with several plain single-color rectangular bar pillars of different heights without any marks or numbers",
      videoStatics: "the plain single-color rectangular bar pillars of different heights, the large potted plants, and the light gray glossy floor",
    },
    C: {
      label: "예보 구름 라운지(컨센서스·근거·확인할 것)",
      image:
        "밝은 원형 라운지. 황소특보 뒤로 큼직한 단색 지구본 조형물(대륙 모양만, 글자·눈금 없음)과 구름 모양 부드러운 조명 몇 개가 천장에 떠 있고, 둥근 큰 창, 양옆에 큼직한 화분, 바닥은 연한 베이지 광택 바닥. 큰 빈 벽면 없이 지구본·구름 조명·식물로 채우고 사람은 없음. 따뜻한 크림과 연한 금색 조명, 저폴리곤 단순화. 글자·숫자·간판·로고·화면 없음.",
      videoStyle: "bright round lounge with a large plain solid-color globe sculpture without any text and soft cloud-shaped ceiling lights",
      videoStatics: "the large plain globe sculpture, the soft cloud-shaped ceiling lights, the round large window, the large potted plants, and the light beige glossy floor",
    },
  }),

  scenesTimeline:
    "s1 훅 / s2 오프닝(압축형) / s3 영업이익·매출 / s4 전기·전년 비교 / s5 9개월 누계 / s6 핵심질문(왜 놀랍지 않나) / s7 컨센서스 개념 / s8 108조대 / s9 근거1 눈높이 하락 / s10 근거1 결과(1% 차이) / s11 근거2 매출 / s12 22편 연결 / s13 균형 / s14 통찰 / s15 체크 / s16 프레임 / s17 예고+댓글",

  instagramCaptionHook: "영업이익이 1년 만에 9배 가까이 뛰었는데 증권가 예상과 거의 같았다고?",
  instagramCaptionPoints: [
    "삼성전자 3분기 영업이익은 107.4조 원, 매출은 195조 원이야(DART 공정공시, 감사 전 잠정치)",
    "직전 분기 89.5조 원보다 20% 늘었고, 작년 같은 분기 12.2조 원보다는 8.8배야",
    "에프앤가이드 컨센서스는 발표 직전 108조 원대였고, 9월 중순엔 114조 안팎이었어",
    "그래서 영업이익은 기대와 1% 안팎 차이였고, 매출은 컨센서스 200조 안팎보다 3% 안팎 낮았어",
    "8일엔 ETF 비중 조정으로 나오는 삼성전자 매물(증권사 추산 약 2,098억 원)도 겹쳐서 주가 움직임을 실적 하나로 읽기 어려워",
    "👉 확정 실적에서 숫자가 바뀌는지, 다음 분기 전망이 기대를 올리는지 확인해봐",
    "※ 공개된 공시와 보도를 정리한 거고 특정 종목 추천이나 투자 권유가 아니야, 잠정치라 확정치와 다를 수 있어",
  ],
  instagramPriorityTags: ["삼성전자", "삼성전자실적", "잠정실적", "영업이익", "컨센서스", "어닝서프라이즈", "반도체", "에프앤가이드", "주식공부", "주식투자", "경제뉴스", "황소특보"],

  emphasisTerms: ["삼성전자", "107.4조", "컨센서스", "기대", "황소특보"],

  captionBoundaryExceptions: Object.freeze([]),
  captionGapBridgeSec: 0.3,
  // 클로즈에 가깝게 나온 카드 씬(s1 카드 아래 모서리에 자막 붙음, s7 자막 윗줄이 카드 둘째 줄을 덮음 — 2026-10-08 caption-card 시트 육안) 두 씬만 자막 28px 내림(아래 끝 ≤1499px, QA 한계 1500).
  captionYShiftByScene: Object.freeze({ 1: 28, 7: 28 }),
  // 첫 3초 시각 변화 실험: 22편은 impact였으므로 23편은 pushin(직전 신작과 다른 값).
  openingMotion: "pushin",

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
      scene: 1, key: "s1_hook", role: "hook", video: "bull_ep23_s1_motion.mp4",
      narration: "다들, 영업이익이 1년 만에 9배 가까이 뛰면 놀라야 정상이지? 근데 이 숫자, 증권가 예상과 거의 같았어.",
      imageBrief: card2("영업이익 9배", "근데 예상 그대로", "놀라고 궁금한 표정으로"),
      overlays: [], shot: "medium", bg: "A",
      motion: cardMotion("wide-eyed and curious, eyebrows raised, as if revealing a surprising turn", "posing a surprising question to the viewer"),
    },
    {
      scene: 2, key: "s2_opening", role: "opening", video: "bull_ep23_s2_motion.mp4",
      narration: "안녕, 투자 소식 정리해주는 황소특보야. 핵심만 짚어줄게.",
      imageBrief: "황소가 정면을 보며 한 손으로 위를 가리키고 다른 손은 허리에 얹은 채 밝고 명랑하게 웃는 포즈, 소품 없음.",
      overlays: [], shot: "wide", bg: "A",
      motion: { type: "open", action: "the character keeps one hand raised with the index finger pointing upward in a confident, friendly gesture while the other hand rests on its hip, smiling brightly and warmly at the viewer.", mood: "warmly greeting the viewer" },
      riskDisclosure: true,
    },
    {
      scene: 3, key: "s3_situation_numbers", role: "background", video: "bull_ep23_s3_motion.mp4",
      narration: "숫자부터 보자. 삼성전자 3분기 영업이익은 107.4조 원, 매출은 195조 원이었어.",
      imageBrief: card2("영업이익 107.4조", "매출 195조", "진지하고 또렷하게 알리는 표정으로"),
      overlays: [], shot: "medium", bg: "B",
      motion: cardMotion("serious and clear with slight nods as if reporting large totals", "seriously reporting the headline numbers"),
    },
    {
      scene: 4, key: "s4_situation_compare", role: "background", video: "bull_ep23_s4_motion.mp4",
      narration: "직전 분기 89.5조 원보다 20% 늘었고, 작년 같은 분기 12.2조 원보다는 8.8배야.",
      imageBrief: card2("직전 분기보다 +20%", "작년보다 8.8배", "차분하고 또렷하게 설명하는 표정으로"),
      overlays: [], shot: "medium", bg: "B",
      motion: cardMotion("calm and clear with slight nods", "calmly comparing with the previous period"),
    },
    {
      scene: 5, key: "s5_situation_ytd", role: "background", video: "bull_ep23_s5_motion.mp4",
      narration: "올해 9개월 누적 영업이익은 254조 원이 넘어. 작년 같은 기간의 10배가 넘는 규모야.",
      imageBrief: card2("9개월 누적", "영업이익 254조", "또렷하고 친절하게 설명하는 표정으로"),
      overlays: [], shot: "close", bg: "B",
      motion: cardMotion("clear and friendly with slight nods", "clearly stating the cumulative scale"),
    },
    {
      scene: 6, key: "s6_core_q", role: "twist", video: "bull_ep23_s6_motion.mp4",
      narration: "그럼 왜 놀랍지 않을까? 한마디로 기대치가 이미 100조를 넘어 있었거든.",
      imageBrief: card2("왜 안 놀랄까?", "기대가 이미 100조", "확신에 찬 표정으로"),
      overlays: [], shot: "medium", bg: "A",
      motion: cardMotion("confident and knowing with a slight nod", "confidently delivering the key answer"),
    },
    {
      scene: 7, key: "s7_concept_consensus", role: "background", video: "bull_ep23_s7_motion.mp4",
      narration: "컨센서스는 증권사들이 발표 전에 내놓은 실적 예상치의 평균이야.",
      imageBrief: card2("컨센서스란", "증권사 예상 평균", "또렷하고 친절하게 설명하는 표정으로"),
      overlays: [], shot: "close", bg: "C",
      motion: cardMotion("clear and friendly with slight nods", "clearly explaining the concept"),
    },
    {
      scene: 8, key: "s8_consensus_level", role: "background", video: "bull_ep23_s8_motion.mp4",
      narration: "에프앤가이드 기준 영업이익 컨센서스는 발표 직전 108조 원대였어.",
      imageBrief: card2("컨센서스", "영업이익 108조대", "또렷하고 친절하게 설명하는 표정으로"),
      // 2026-10-08: 지구본(실제 대륙 지도) 배경 이미지가 Veo에서 "동영상을 생성할 수 없습니다"로 반복 실패 → 과녁 홀(A)로 교체해 재생성.
      overlays: [], shot: "medium", bg: "A",
      motion: cardMotion("clear and friendly with slight nods", "clearly giving the expectation level"),
    },
    {
      scene: 9, key: "s9_evidence1_expectation", role: "evidence", video: "bull_ep23_s9_motion.mp4",
      narration: "첫째, 눈높이가 내려와 있었어. 9월 중순엔 114조 안팎이었는데 5조 원 넘게 낮아졌지.",
      imageBrief: card2("9월 중순 114조 안팎", "5조 넘게 낮아짐", "진지하고 또렷하게 알리는 표정으로"),
      overlays: [], shot: "medium", bg: "B",
      motion: cardMotion("serious and clear with slight nods", "seriously noting that expectations came down"),
    },
    {
      scene: 10, key: "s10_evidence1_result", role: "evidence", video: "bull_ep23_s10_motion.mp4",
      narration: "그래서 이번 숫자는 기대와 1% 안팎 차이야. 실망도 서프라이즈도 아닌 숫자인 거지.",
      imageBrief: card2("기대와 1% 안팎", "서프라이즈 아님", "확신에 찬 표정으로"),
      overlays: [], shot: "close", bg: "A",
      motion: cardMotion("confident and knowing with a slight nod", "confidently noting it was neither a shock nor a surprise"),
    },
    {
      scene: 11, key: "s11_evidence2_revenue", role: "evidence", video: "bull_ep23_s11_motion.mp4",
      narration: "둘째, 매출은 달랐어. 컨센서스 200조 안팎보다 3% 안팎 낮았지. 이익만 맞춘 셈이야.",
      imageBrief: card2("매출은 기대 밑", "이익만 맞췄다", "또렷하고 친절하게 설명하는 표정으로"),
      overlays: [], shot: "medium", bg: "B",
      motion: cardMotion("clear and friendly with slight nods", "clearly giving the second reason"),
    },
    {
      scene: 12, key: "s12_link_ep22", role: "counterpoint", video: "bull_ep23_s12_motion.mp4",
      narration: "어제 말한 8일 ETF 매물 약 2,098억 원 추산도 겹쳤어. 주가 움직임은 실적 하나로 못 읽어.",
      imageBrief: card2("8일 ETF 매물도", "겹친 날", "신중하고 단호한 표정으로"),
      overlays: [], shot: "medium", bg: "C",
      motion: cardMotion("careful and firm, eyebrows slightly furrowed, as if noting an overlapping factor", "firmly noting a second factor"),
    },
    {
      scene: 13, key: "s13_balance", role: "counterpoint", video: "bull_ep23_s13_motion.mp4",
      narration: "물론 조심할 것도 있어. 감사 전 잠정치라 확정치와 다를 수 있고, 순이익은 이번 공시에 없어.",
      imageBrief: "황소가 신중하고 걱정스러운 표정으로 한 손을 턱 근처에 대고 다른 손은 허리에 얹은 포즈, 소품 없음.",
      overlays: [], shot: "close", bg: "A",
      motion: { type: "open", action: "the character rests one hand near its chin with a careful, thoughtful expression and slight head tilts while the other hand rests on its hip", mood: "carefully noting a counter-signal" },
    },
    {
      scene: 14, key: "s14_insight", role: "insight", video: "bull_ep23_s14_motion.mp4",
      narration: "한 줄로 정리하면, 실적은 얼마나 컸는지보다 기대와 얼마나 달랐는지로 읽어.",
      imageBrief: card2("실적은 크기보다", "기대와의 차이", "확신에 찬 표정으로"),
      overlays: [], shot: "medium", bg: "A",
      motion: cardMotion("confident and knowing with slight nods", "confidently delivering the one-line summary"),
    },
    {
      scene: 15, key: "s15_check", role: "action", video: "bull_ep23_s15_motion.mp4",
      narration: "확인할 건 두 가지, 확정 실적에서 숫자가 바뀌는지랑 다음 분기 전망이 기대를 올리는지야.",
      imageBrief: card2("① 확정 실적 숫자", "② 다음 분기 전망", "친절하고 또렷하게 알려주는 표정으로"),
      overlays: [], shot: "medium", bg: "C",
      motion: cardMotion("clear and helpful with slight nods as if listing two things to check", "clearly listing two things to check"),
    },
    {
      scene: 16, key: "s16_frame", role: "frame", video: "bull_ep23_s16_motion.mp4",
      narration: "쫓지 말고 기대와 비교해서 읽어. 그래야 다음 신호가 읽혀. 이것만은 챙겨가.",
      imageBrief: card2("쫓지 말고", "기대와 비교", "따뜻하고 차분한 미소로"),
      overlays: [], shot: "medium", bg: "A",
      motion: cardMotion("warm and calm with a gentle smile", "warmly reassuring the viewer"),
    },
    {
      scene: 17, key: "s17_cta", role: "save", video: "bull_ep23_s17_motion.mp4",
      narration: "확정 실적이 공시되면 황소특보가 제일 먼저 들고 올게. 짚어줬으면 하는 이슈는 댓글로 남겨줘.",
      imageBrief: "황소가 밝은 미소로 한 손을 가볍게 흔들고 다른 손은 자연스럽게 내린 마무리 포즈, 소품 없이 빈 손.",
      overlays: [], shot: "wide", bg: "A",
      motion: { type: "open", action: "the character smiles brightly and waves one hand lightly in a friendly goodbye while the other hand hangs naturally relaxed", mood: "warmly saying goodbye and inviting comments" },
      riskDisclosure: true,
    },
  ]),
});

/** 장면 키로 스펙을 찾는다. */
export function findBullEp23Scene(key) {
  return BULL_EP23_ASSEMBLY_SPEC.scenes.find((s) => s.key === key) ?? null;
}
