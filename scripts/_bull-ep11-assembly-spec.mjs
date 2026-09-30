/**
 * 황소특보 11편 조립 스펙 — 17장면. 씬 구조 v3 + 성공 공식/엔딩 5박자 네 번째 적용본(새 품질 체계 v2 첫 적용).
 *
 * 전달 메시지 한 줄: 이익은 지난 수주의 성적표이고 주가는 앞으로의 새 주문·환율·원가를 본다 — 그래서 일감이 넘쳐도 주가가 빠질 수 있다.
 * 담당: 황소특보(투자자 입장, 규칙 22). 영역 industrial · 레인 ① 원인 해설 · 유형 구조 · 강도 강 · 특보 근접도 중. 반도체 아님.
 *
 * ★ 소재 선정 경위(2026-09-30)★: 금·테슬라·연비 규제·희토류·K바이오 등 후보를 탐색 러너 7종 전부 실행(SCAN_CHECKLIST)으로 모아
 * 추천순위를 매겼고 Owner가 조선주(후보 1번)를 선택. Owner 지적 반영: 역할 분담(황소=투자자 입장), 특보 근접도, 영역 다양성, 규칙 누락 금지.
 * 금 대본 초안은 _ai/bull-ep11-gold-script-draft.md에 보존(다음 편 후보).
 *
 * ★ 핵심 팩트(2026-09-30 복수 출처 교차 확인)★:
 * - 주가: 대표 조선주 세 곳이 고점 대비 -43.7%·-45.3%·-50.7% [한국경제 9/30 — 단일 출처라 대본은 "44%에서 51%"만].
 * - 이익 전망: 조선 3사 합산 영업이익 올해 9.8조 → 내년 11.8조 → 2028 13.7조 [SK증권]. (한경 요약의 "올해·내년 합산"은 오기)
 * - 수주(클락슨, 뉴스핌 9/4·비즈니스포스트): 1~8월 한국 938만CGT·16%, 중국 76% / 8월 한 달 한국 7%·중국 85% / 8월 말 수주잔량 한국 18%·중국 67%.
 * - 제외한 수치: 한경의 "수주 점유율 20%→14%" — 클락슨 기준(16%)과 불일치, 출처 확인 전.
 * - 환율 상반기 말 1,550원대 → 1,350원대, 원재료(철강재)·파업·중국 경쟁은 한경 원인 분석. 수주→인도 통상 2~3년.
 * 원문의 "저가 매수 기회" 표현은 매수 암시라 쓰지 않는다. 종목 실명 없음("대표 조선주", "조선 3사"). SK증권 전망 1건만 인용(제3자 코멘트 최소).
 *
 * 개념 표기: 수주잔고 = 받아 둔 주문서(아직 인도 전 물량). 리스크 고지: 나레이션에 넣지 않고 오프닝(s2)·마지막(s17) 하단 자막바로만.
 *
 * TTS 실측(2026-09-30, output-v1, API 1회): 17씬 타임라인 130.76초(v3 목표 115~127초보다 약 4초 길지만 CTA 포함 전체 약 139초 = 8편 수준, 재생성 안 함).
 * 씬별 raw: s1 6.1, s2 5.928, s3 6.512, s4 7.493, s5 8.834, s6 7.333, s7 8.253, s8 7.93, s9 6.187, s10 8.16, s11 5.85, s12 6.987, s13 6.26, s14 7.24, s15 8.34, s16 4.6, s17 5.24
 */

export const BULL_EP11_ASSEMBLY_SPEC = Object.freeze({
  specVersion: "bull_assembly_spec_v1",
  scriptStructureVersion: "bull_script_structure_v3",
  endingStructureVersion: "bull_ending_5beat_2026_09_29",
  episode: 11,
  sourceCandidate: "candidate-bull-ep11-shipbuilding-profit-vs-price",
  title: "조선주 반토막 가까이 빠졌는데 이익 전망은 올랐다",
  channelName: "경제번역소",
  characterDisplayName: "황소특보",
  headerTitle: ["조선주 반토막 가까이", "이익 전망은 올랐다"],

  // ── 이미지·영상 연출 필드(품질 체계 v2, 규칙 15) ──
  hookType: "T1",
  imageCharacter: "bull3dv1",
  imagePrefix: "bull_ep11",
  // 소재(조선·수주·환율)에 맞는 공간 3곳. 직전 편(거래소 로비·공시 사무 구역·분석실)·트레이딩 라운지와 겹치지 않는다. 배경에 글자·숫자·로고 없음.
  sceneBackgrounds: Object.freeze({
    A: {
      label: "조선소 도크 전망 데크(도입·마무리·요약)",
      image:
        "대형 조선소가 내려다보이는 탁 트인 전망 데크. 황소특보 뒤로 거대한 골리앗 크레인 두어 기와 건조 중인 큼직한 선체(매끈한 저폴리곤 단순화, 글자·로고·번호 없음)가 넓게 펼쳐지고, 앞쪽에는 밝은 나무 데크 바닥과 둥근 화분 몇 개, 양옆에 낮은 유리 난간. 맑은 하늘과 은은한 골드·스카이블루 조명. 글자가 적힌 간판·표지판·깃발 없음.",
      videoStyle: "shipyard overlook deck",
      videoStatics: "the giant gantry cranes, the ship hull under construction, the wooden deck floor, the glass railings, and the potted plants",
    },
    B: {
      label: "선박 수주 상황실(수주·점유율·주문서)",
      image:
        "선박 수주 상황실. 황소특보 뒤로 천장까지 닿는 큼직한 곡면 스크린 벽(바다 위를 흐르는 작은 배 아이콘 점들과 굵은 파도 줄무늬만 은은하게 흐르는 단순화된 저폴리곤 그래픽, 글자·숫자 없음)이 넓게 펼쳐지고, 앞쪽에 둥근 회의 테이블 하나와 의자 몇 개, 바닥은 매끈한 광택 바닥. 은은한 네이비·민트 조명. 글자가 적힌 표지판·서류·화면 없음.",
      videoStyle: "ship-order situation room",
      videoStatics: "the large curved screen wall with small ship icons and wave stripes, the round meeting table, the chairs, and the glossy floor",
    },
    C: {
      label: "항만 전망 사무실(환율·원가·걱정)",
      image:
        "항만이 내려다보이는 밝은 사무실. 황소특보 뒤로 큼직한 통창(창밖에 컨테이너 더미와 부두 크레인이 있는 매끈한 저폴리곤 항구 풍경)이 넓게 펼쳐지고, 양옆에 둥근 화분과 낮은 책장(책등에 글자 없음), 한쪽에 둥근 지구본, 바닥에 둥근 러그. 큰 빈 벽면 없이 창과 책장으로 채운다. 따뜻한 골드·크림 조명. 글자가 적힌 포스터·칠판·간판 없음.",
      videoStyle: "bright port-view office",
      videoStatics: "the large window with the container yard and dock cranes, the potted plants, the low bookshelves, the globe, and the rug",
    },
  }),

  scenesTimeline:
    "s1 훅 / s2 오프닝 / s3 상황(주가 하락) / s4 상황(이익 전망) / s5 핵심질문 / s6 개념(수주잔고) / s7 근거1 일감 / s8 근거2 새 주문 / s9 근거2 8월 통계 / s10 근거3 환율 / s11 근거3 원가 / s12 균형 / s13 요약 / s14 체크 / s15 엔딩(조건·이득) / s16 당부 / s17 예고+댓글",

  instagramCaptionHook: "조선주가 고점 대비 반토막 가까이 빠졌는데, 이익 전망은 오히려 올랐어, 왜 그럴까?",
  instagramCaptionPoints: [
    "대표 조선주 세 곳이 고점 대비 44%에서 51%까지 빠졌어",
    "그런데 SK증권은 조선 3사 영업이익이 올해 9조 8천억 원에서 내년 11조 8천억 원으로 는다고 봐",
    "이익은 지난 수주의 성적표야, 배 주문을 받고 넘기기까지 보통 2~3년이 걸려서 쌓여 있는 주문서(수주잔고)가 지금 이익이 돼",
    "첫째 일감은 넉넉해, 8월 말 한국 수주잔량은 세계의 18%야",
    "둘째 새 주문이 걱정이야, 올해 1~8월 한국 수주 점유율은 16%, 중국은 76%, 8월 한 달은 한국 7%, 중국 85%였어",
    "셋째 환율이야, 달러로 받아 원화로 쓰는데 1,550원대에서 1,350원대로 내려왔고 철강재 값 상승과 파업 부담도 겹쳤어",
    "👉 한국 수주 점유율이 다시 오르는지, 환율이 1,350원 밑으로 더 내려가는지 확인해봐, 다음 신호는 다음 달 초 나오는 9월 수주 통계야",
  ],
  instagramPriorityTags: [
    "조선주",
    "조선업",
    "수주잔고",
    "수주점유율",
    "환율",
    "SK증권",
    "주식공부",
    "주식투자",
    "경제뉴스",
    "황소특보",
  ],

  emphasisTerms: ["조선주", "수주잔고", "수주 점유율", "환율", "황소특보"],

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
      video: "bull_ep11_s1_motion.mp4",
      narration: "다들, 조선주 반토막 가까이 빠졌어. 그런데 이익 전망은 오히려 올랐어. 왜 그럴까?",
      imageBrief: "황소가 놀라고 궁금하다는 표정으로 '조선주 반토막?'과 '이익은 올랐다'가 두 줄로 크게 적힌 카드를 두 손으로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄, 카드에 그림·화살표 없이 글자만.",
      overlays: [],
      shot: "medium",
      bg: "A",
      motion: { type: "card2", action: "the character's expression is wide-eyed and puzzled, eyebrows raised, as if asking the viewer why profit forecasts rose while the stock price fell; body and face move gently while the hands holding the card stay still.", mood: "posing an intriguing question to the viewer" },
    },
    {
      scene: 2,
      key: "s2_opening",
      role: "opening",
      video: "bull_ep11_s2_motion.mp4",
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
      key: "s3_situation_drop",
      role: "background",
      video: "bull_ep11_s3_motion.mp4",
      narration: "숫자부터 보자. 대표 조선주 세 곳이 고점 대비 44%에서 51%까지 빠졌어.",
      imageBrief: "황소 옆 긴 다리 이젤(바닥에 고정) 위에 올려 세운 보드에 '고점 대비', '44~51%', '하락'이 세 줄로 크게 적혀 있고, 황소가 빈 손으로 보드를 가리키며 설명하는 자세. 구도(반드시): 황소는 화면 정중앙에서 약간 왼쪽(가로 25~55%)에 서고, 보드는 황소 바로 옆에 붙여 작고 아담하게 세운다 — 보드 폭은 이미지 가로의 32% 이하, 높이는 세로의 24% 이하로 황소 키보다 훨씬 낮게. 보드 오른쪽 끝과 화면 오른쪽 가장자리 사이에 바닥과 배경이 넉넉히(가로 15% 이상) 보여야 하고 보드가 잘리거나 가장자리에 닿으면 실패. 보드에는 지정한 굵은 큰 글자 줄만 넣고 그래프·표·작은 라벨은 넣지 않는다. 글자는 세로 28~58% 안. 보드는 이젤 위에 높게 올려 황소 어깨~머리 높이에 오게 한다(보드 윗변 세로 30% 근처, 아랫변 세로 55% 이내).",
      overlays: [],
      shot: "medium",
      bg: "A",
      motion: { type: "board", action: "the character's free hand points toward the board without touching it, with a bright, informative expression, while the other hand rests near its hip.", mood: "calmly presenting the numbers" },
    },
    {
      scene: 4,
      key: "s4_situation_profit",
      role: "background",
      video: "bull_ep11_s4_motion.mp4",
      narration: "그런데 SK증권은 조선 3사 영업이익이 올해 9조 8천억 원에서 내년 11조 8천억 원으로 는다고 봐.",
      imageBrief: "황소 옆 긴 다리 이젤(바닥에 고정) 위에 올려 세운 보드에 '조선 3사 이익', '올해 9.8조', '내년 11.8조'가 세 줄로 크게 적혀 있고, 황소가 빈 손으로 보드를 가리키며 설명하는 자세. (와이드 샷이어도 보드는 크게 — 보드 프레임 전체가 이미지 가로 45%~83% 사이에 들어와야 하고 오른쪽 끝은 절대 83%를 넘지 않는다. 황소는 이미지 왼쪽 15~42%에 서서 보드 쪽을 가리킨다. 보드 오른쪽에 배경 여백을 남길 것) 구도(반드시): 황소는 화면 정중앙에서 약간 왼쪽(가로 25~55%)에 서고, 보드는 황소 바로 옆에 붙여 작고 아담하게 세운다 — 보드 폭은 이미지 가로의 32% 이하, 높이는 세로의 24% 이하로 황소 키보다 훨씬 낮게. 보드 오른쪽 끝과 화면 오른쪽 가장자리 사이에 바닥과 배경이 넉넉히(가로 15% 이상) 보여야 하고 보드가 잘리거나 가장자리에 닿으면 실패. 보드에는 지정한 굵은 큰 글자 줄만 넣고 그래프·표·작은 라벨은 넣지 않는다. 글자는 세로 28~58% 안. 보드는 이젤 위에 높게 올려 황소 어깨~머리 높이에 오게 한다(보드 윗변 세로 30% 근처, 아랫변 세로 55% 이내).",
      overlays: [],
      shot: "wide",
      bg: "B",
      motion: { type: "board", action: "the character's free hand points to the board lines one after another from top to bottom without touching it, explaining with a bright, clear expression, while the other hand rests near its hip.", mood: "clearly explaining a forecast" },
    },
    {
      scene: 5,
      key: "s5_core_q",
      role: "twist",
      video: "bull_ep11_s5_motion.mp4",
      narration: "그럼 이익이 느는데 주가는 왜 빠질까? 한마디로 이익은 지난 수주의 성적표고, 주가는 앞으로의 수주를 보기 때문이야.",
      imageBrief: "황소가 확신에 찬 표정으로 '이익은 과거'와 '주가는 미래'가 두 줄로 크게 적힌 카드를 두 손으로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄, 카드에 그림·화살표 없이 글자만.",
      overlays: [],
      shot: "medium",
      bg: "B",
      motion: { type: "card2", action: "the character's expression is confident and knowing, with slight nods; only the face and body move while the hands holding the card stay still.", mood: "confidently delivering the key answer" },
    },
    {
      scene: 6,
      key: "s6_concept_backlog",
      role: "background",
      video: "bull_ep11_s6_motion.mp4",
      narration: "조선소는 주문을 받고 배를 넘기기까지 보통 이삼 년이 걸려. 그 사이 쌓여 있는 주문서가 수주잔고야.",
      imageBrief: "황소 옆 긴 다리 이젤(바닥에 고정) 위에 올려 세운 보드에 '수주잔고', '= 쌓인 주문서', '인도 2~3년'이 세 줄로 크게 적혀 있고, 황소가 빈 손으로 보드를 톡톡 짚으며 차분히 설명하는 자세. 구도(반드시): 황소는 화면 정중앙에서 약간 왼쪽(가로 25~55%)에 서고, 보드는 황소 바로 옆에 붙여 작고 아담하게 세운다 — 보드 폭은 이미지 가로의 32% 이하, 높이는 세로의 24% 이하로 황소 키보다 훨씬 낮게. 보드 오른쪽 끝과 화면 오른쪽 가장자리 사이에 바닥과 배경이 넉넉히(가로 15% 이상) 보여야 하고 보드가 잘리거나 가장자리에 닿으면 실패. 보드에는 지정한 굵은 큰 글자 줄만 넣고 그래프·표·작은 라벨은 넣지 않는다. 글자는 세로 28~58% 안. 보드는 이젤 위에 높게 올려 황소 어깨~머리 높이에 오게 한다(보드 윗변 세로 30% 근처, 아랫변 세로 55% 이내).",
      overlays: [],
      shot: "medium",
      bg: "B",
      motion: { type: "board", action: "the character's free hand gently taps the air toward each line of the board one after another without touching it, explaining calmly, while the other hand rests near its hip.", mood: "calmly explaining a concept" },
    },
    {
      scene: 7,
      key: "s7_backlog",
      role: "background",
      video: "bull_ep11_s7_motion.mp4",
      narration: "첫째는 일감이야. 8월 말 한국 수주잔량은 세계의 18%로, 앞으로 몇 년 치 매출이 이미 주문서에 있어.",
      imageBrief: "황소 옆 긴 다리 이젤(바닥에 고정) 위에 올려 세운 보드에 '한국 수주잔량'과 '세계 18%'가 두 줄로 크게 적혀 있고, 황소가 빈 손으로 보드를 가리키며 설명하는 자세. 구도(반드시): 황소는 화면 정중앙에서 약간 왼쪽(가로 25~55%)에 서고, 보드는 황소 바로 옆에 붙여 작고 아담하게 세운다 — 보드 폭은 이미지 가로의 32% 이하, 높이는 세로의 24% 이하로 황소 키보다 훨씬 낮게. 보드 오른쪽 끝과 화면 오른쪽 가장자리 사이에 바닥과 배경이 넉넉히(가로 15% 이상) 보여야 하고 보드가 잘리거나 가장자리에 닿으면 실패. 보드에는 지정한 굵은 큰 글자 줄만 넣고 그래프·표·작은 라벨은 넣지 않는다. 글자는 세로 28~58% 안. 보드는 이젤 위에 높게 올려 황소 어깨~머리 높이에 오게 한다(보드 윗변 세로 30% 근처, 아랫변 세로 55% 이내).",
      overlays: [],
      shot: "wide",
      bg: "B",
      motion: { type: "board", action: "the character's free hand points toward the board without touching it, explaining with a clear, reassuring expression, while the other hand rests near its hip.", mood: "clearly explaining a backlog figure" },
    },
    {
      scene: 8,
      key: "s8_share",
      role: "twist",
      video: "bull_ep11_s8_motion.mp4",
      narration: "둘째는 새 주문이야. 올해 1월부터 8월까지 한국 수주 점유율은 16%, 중국은 76%야.",
      imageBrief: "황소 옆 긴 다리 이젤(바닥에 고정) 위에 올려 세운 보드에 '수주 점유율', '한국 16%', '중국 76%'가 세 줄로 크게 적혀 있고, 황소가 빈 손으로 손가락을 펴 보이며 진지하게 설명하는 자세. 구도(반드시): 황소는 화면 정중앙에서 약간 왼쪽(가로 25~55%)에 서고, 보드는 황소 바로 옆에 붙여 작고 아담하게 세운다 — 보드 폭은 이미지 가로의 32% 이하, 높이는 세로의 24% 이하로 황소 키보다 훨씬 낮게. 보드 오른쪽 끝과 화면 오른쪽 가장자리 사이에 바닥과 배경이 넉넉히(가로 15% 이상) 보여야 하고 보드가 잘리거나 가장자리에 닿으면 실패. 보드에는 지정한 굵은 큰 글자 줄만 넣고 그래프·표·작은 라벨은 넣지 않는다. 글자는 세로 28~58% 안. 보드는 이젤 위에 높게 올려 황소 어깨~머리 높이에 오게 한다(보드 윗변 세로 30% 근처, 아랫변 세로 55% 이내).",
      overlays: [],
      shot: "medium",
      bg: "B",
      motion: { type: "board", action: "the character's free hand points toward the board lines without touching it, with a serious, engaged expression, while the other hand rests near its hip.", mood: "seriously presenting a market share comparison" },
    },
    {
      scene: 9,
      key: "s9_august",
      role: "twist",
      video: "bull_ep11_s9_motion.mp4",
      narration: "9월 초 나온 8월 한 달 통계는 더 심해. 한국 7%, 중국 85%야.",
      imageBrief: "황소가 심각하고 놀란 표정으로 '한국 7%'와 '중국 85%'가 두 줄로 크게 적힌 카드를 두 손으로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄, 카드에 그림·화살표 없이 글자만.",
      overlays: [],
      shot: "medium",
      bg: "C",
      motion: { type: "card2", action: "the character's expression is serious and concerned, eyebrows slightly furrowed; only the face and body move while the hands holding the card stay still.", mood: "gravely delivering a worse number" },
    },
    {
      scene: 10,
      key: "s10_fx",
      role: "background",
      video: "bull_ep11_s10_motion.mp4",
      narration: "셋째는 환율이야. 조선사는 달러로 받아 원화로 써. 1,550원대에서 1,350원대로 내리면 덜 남아.",
      imageBrief: "황소 옆 긴 다리 이젤(바닥에 고정) 위에 올려 세운 보드에 '환율', '1,550원대', '1,350원대'가 세 줄로 크게 적혀 있고, 황소가 빈 손으로 보드를 가리키며 설명하는 자세. 구도(반드시): 황소는 화면 정중앙에서 약간 왼쪽(가로 25~55%)에 서고, 보드는 황소 바로 옆에 붙여 작고 아담하게 세운다 — 보드 폭은 이미지 가로의 32% 이하, 높이는 세로의 24% 이하로 황소 키보다 훨씬 낮게. 보드 오른쪽 끝과 화면 오른쪽 가장자리 사이에 바닥과 배경이 넉넉히(가로 15% 이상) 보여야 하고 보드가 잘리거나 가장자리에 닿으면 실패. 보드에는 지정한 굵은 큰 글자 줄만 넣고 그래프·표·작은 라벨은 넣지 않는다. 글자는 세로 28~58% 안. 보드는 이젤 위에 높게 올려 황소 어깨~머리 높이에 오게 한다(보드 윗변 세로 30% 근처, 아랫변 세로 55% 이내).",
      overlays: [],
      shot: "medium",
      bg: "C",
      motion: { type: "board", action: "the character's free hand traces down along the board lines without touching it, explaining with a clear, informative expression, while the other hand rests near its hip.", mood: "clearly explaining an exchange-rate change" },
    },
    {
      scene: 11,
      key: "s11_cost",
      role: "background",
      video: "bull_ep11_s11_motion.mp4",
      narration: "거기에 철강재 값 상승과 파업 부담까지 겹쳐서, 이익 전망이 깎일까 걱정이 커졌어.",
      imageBrief: "황소가 걱정스러운 표정으로 한 손을 턱 근처에 대고 다른 손은 허리에 얹은 포즈, 소품 없음.",
      overlays: [],
      shot: "close",
      bg: "C",
      motion: { type: "open", action: "the character rests one hand near its chin with a worried, thoughtful expression and slight head tilts while the other hand rests on its hip; no props are held.", mood: "worriedly considering rising costs" },
    },
    {
      scene: 12,
      key: "s12_balance",
      role: "counterpoint",
      video: "bull_ep11_s12_motion.mp4",
      narration: "물론 증권가 전망이 틀릴 수도 있어. 그 전망은 수주 점유율과 환율이 버텨준다는 가정 위에 있거든.",
      imageBrief: "황소 옆 긴 다리 이젤(바닥에 고정) 위에 올려 세운 보드에 '전망은 가정'과 '틀릴 수도'가 두 줄로 크게 적혀 있고, 황소가 빈 손을 위로 펴 보이며 신중한 표정을 짓는 자세. 구도(반드시): 황소는 화면 정중앙에서 약간 왼쪽(가로 25~55%)에 서고, 보드는 황소 바로 옆에 붙여 작고 아담하게 세운다 — 보드 폭은 이미지 가로의 32% 이하, 높이는 세로의 24% 이하로 황소 키보다 훨씬 낮게. 보드 오른쪽 끝과 화면 오른쪽 가장자리 사이에 바닥과 배경이 넉넉히(가로 15% 이상) 보여야 하고 보드가 잘리거나 가장자리에 닿으면 실패. 보드에는 지정한 굵은 큰 글자 줄만 넣고 그래프·표·작은 라벨은 넣지 않는다. 글자는 세로 28~58% 안. 보드는 이젤 위에 높게 올려 황소 어깨~머리 높이에 오게 한다(보드 윗변 세로 30% 근처, 아랫변 세로 55% 이내).",
      overlays: [],
      shot: "wide",
      bg: "A",
      motion: { type: "board", action: "the character's free hand is held open, palm up, and tilts gently in the air as if weighing the forecast, with a careful, balanced expression, while the other hand rests near its hip. The board does not move.", mood: "carefully noting a caveat" },
    },
    {
      scene: 13,
      key: "s13_insight",
      role: "insight",
      video: "bull_ep11_s13_motion.mp4",
      narration: "한 줄로 정리하면, 조선주는 일감이 없어서가 아니라 새 주문과 환율이 걱정돼서 빠진 거야.",
      imageBrief: "황소가 확신에 찬 표정으로 '일감 말고'와 '새 주문·환율'이 두 줄로 크게 적힌 카드를 두 손으로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄, 카드에 그림·화살표 없이 글자만.",
      overlays: [],
      shot: "medium",
      bg: "A",
      motion: { type: "card2", action: "the character's expression is confident and knowing, with slight nods; only the face and body move while the hands holding the card stay still.", mood: "confidently delivering the one-line summary" },
    },
    {
      scene: 14,
      key: "s14_check",
      role: "action",
      video: "bull_ep11_s14_motion.mp4",
      narration: "확인할 건 두 가지야. 한국 수주 점유율이 다시 오르는지, 환율이 1,350원 밑으로 더 내려가는지야.",
      imageBrief: "황소 옆 긴 다리 이젤(바닥에 고정) 위에 올려 세운 보드에 '① 점유율'과 '② 환율 1,350원'이 두 줄로 크게 적혀 있고, 황소가 빈 손으로 손가락 두 개를 세워 보이며 설명하는 자세. 구도(반드시): 황소는 화면 정중앙에서 약간 왼쪽(가로 25~55%)에 서고, 보드는 황소 바로 옆에 붙여 작고 아담하게 세운다 — 보드 폭은 이미지 가로의 32% 이하, 높이는 세로의 24% 이하로 황소 키보다 훨씬 낮게. 보드 오른쪽 끝과 화면 오른쪽 가장자리 사이에 바닥과 배경이 넉넉히(가로 15% 이상) 보여야 하고 보드가 잘리거나 가장자리에 닿으면 실패. 보드에는 지정한 굵은 큰 글자 줄만 넣고 그래프·표·작은 라벨은 넣지 않는다. 글자는 세로 28~58% 안. 보드는 이젤 위에 높게 올려 황소 어깨~머리 높이에 오게 한다(보드 윗변 세로 30% 근처, 아랫변 세로 55% 이내).",
      overlays: [],
      shot: "medium",
      bg: "A",
      motion: { type: "board", action: "the character's free hand keeps two fingers raised and gives small emphasizing motions, with a clear, helpful expression, while the other hand rests near its hip.", mood: "clearly listing two things to check" },
    },
    {
      scene: 15,
      key: "s15_frame",
      role: "frame",
      video: "bull_ep11_s15_motion.mp4",
      narration: "둘 다 버텨주면 전망에 힘이 실리고, 흔들리면 깎일 수 있어. 주가를 쫓지 말고 이유를 알아야, 다음 신호가 읽혀.",
      imageBrief: "황소가 따뜻하고 차분한 미소로 '쫓지 말고'와 '이유를 읽어'가 두 줄로 크게 적힌 카드를 두 손으로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄, 카드에 그림·화살표 없이 글자만.",
      overlays: [],
      shot: "medium",
      bg: "C",
      motion: { type: "card2", action: "the character's expression is warm and calm with a gentle smile; only the face and body move while the hands holding the card stay still.", mood: "warmly reassuring the viewer" },
    },
    {
      scene: 16,
      key: "s16_next",
      role: "action",
      video: "bull_ep11_s16_motion.mp4",
      narration: "이것만은 챙겨가. 다음 달 초 나오는 9월 수주 통계가 다음 신호야.",
      imageBrief: "황소 옆 긴 다리 이젤(바닥에 고정) 위에 올려 세운 보드에 '다음 신호'와 '9월 수주 통계'가 두 줄로 크게 적혀 있고, 황소가 빈 손으로 보드를 가리키며 밝게 설명하는 자세. 구도(반드시): 황소는 화면 정중앙에서 약간 왼쪽(가로 25~55%)에 서고, 보드는 황소 바로 옆에 붙여 작고 아담하게 세운다 — 보드 폭은 이미지 가로의 32% 이하, 높이는 세로의 24% 이하로 황소 키보다 훨씬 낮게. 보드 오른쪽 끝과 화면 오른쪽 가장자리 사이에 바닥과 배경이 넉넉히(가로 15% 이상) 보여야 하고 보드가 잘리거나 가장자리에 닿으면 실패. 보드에는 지정한 굵은 큰 글자 줄만 넣고 그래프·표·작은 라벨은 넣지 않는다. 글자는 세로 28~58% 안. 보드는 이젤 위에 높게 올려 황소 어깨~머리 높이에 오게 한다(보드 윗변 세로 30% 근처, 아랫변 세로 55% 이내).",
      overlays: [],
      shot: "medium",
      bg: "A",
      motion: { type: "board", action: "the character's free hand points toward the board without touching it, with a bright, encouraging expression, while the other hand rests near its hip.", mood: "pointing to the next signal" },
    },
    {
      scene: 17,
      key: "s17_cta",
      role: "save",
      video: "bull_ep11_s17_motion.mp4",
      narration: "황소특보가 제일 먼저 들고 올게. 짚어줬으면 하는 이슈는 댓글로 남겨줘.",
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
export function findBullEp11Scene(key) {
  return BULL_EP11_ASSEMBLY_SPEC.scenes.find((s) => s.key === key) ?? null;
}
