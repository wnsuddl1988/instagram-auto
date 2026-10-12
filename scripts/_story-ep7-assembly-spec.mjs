/**
 * 스토리형 7편 — 배달의민족(우아한형제들) 재연 장면 스펙 (2026-10-08).
 *
 * 기준: `_ai/story-script-rules.md` + 확정 대본 `C:/tmp/story-ep8-baemin/scenes-v9.json`(14장면 555자, Owner 확정 2026-10-08).
 * 설계 `C:/tmp/story-ep8-baemin/story-design.json`. TTS `C:/tmp/money-shorts-os/story-ep7-tts/output-v1/tempo-1.2-gap0.25-pre/…audio-fixed…json`(85.4초).
 * 화풍: 반사실 3D(storysemi, Owner 확정). 1~13번 재연 장면 + 14번 부엉박사 진행자 컷.
 *
 * 이미지 규칙(CURRENT_STANDARDS 이미지 3대 원칙 + 스토리형):
 *  - 화면에 글자·숫자·로고·브랜드·앱 이름을 넣지 않는다(숫자는 자막이 맡는다). 전단지·앱 화면·차트는 무늬와 음식 사진 느낌의 색 덩어리만, 글자 없음.
 *  - 실제 앱·회사의 색·로고·마크를 흉내 내지 않는다(중립 색). 실존 인물(창업자 등)을 닮게 그리지 않는다.
 *  - 소품은 두 손으로 감싸 쥐거나 탁자·바닥에 거치. 빈 면 금지. 핵심 피사체는 세로 15~62%(자막 자리 비움).
 *  - ★ 실존 인물 오인 방지(4편 11번 영상 거부 사례, 2026-10-08): 얼굴이 크게 보이는 정면·근접 구도를 피하고, 인물은 뒷모습·멀리 있는 작은 모습·손과 소품 위주로 그린다. 직업명(조사원·수사관 등)·실제 인물명·닮음 지시 없음.
 *  - 2010년대 한국 배경(아파트 단지 분리수거장, 작은 사무실, 스마트폰, 골목 상권).
 *
 * 이미지 생성: ① 1~13번 `ALLOW_CHATGPT_IMAGE=1 node scripts/probe-character-consistency-chatgpt-v1.mjs --character storysemi --scene-spec ./_story-ep7-assembly-spec.mjs --scene-spec-export STORY_EP7_SEMI_SPEC --out-dir C:/tmp/story-ep7-images`
 *            ② 14번(부엉박사) `… --character owl3dv5 --scene-spec ./_story-ep7-assembly-spec.mjs --scene-spec-export STORY_EP7_END_SPEC --out-dir C:/tmp/story-ep7-images`
 */

const NO_TEXT = "화면 안에 글자·숫자·로고·브랜드 이름·앱 이름은 하나도 넣지 마(전단지·앱 화면·서류·차트·간판 모두 무늬와 색 덩어리만).";
const motion = (action, mood) => ({ type: "scene", action, mood });

const FACE_SAFE = " 구도 규칙(가장 중요): 카메라를 낮게 잡아 인물의 머리는 화면 세로 45%보다 아래(45~85% 구간)에 오게 하고, 화면 위쪽 40%에는 사람·머리가 하나도 없이 벽·창문·천장·조명·하늘 같은 배경만 보이게 해.";
const FLYER = "글자가 전혀 없고 음식 사진 느낌의 색 덩어리와 무늬만 있는 컬러 음식점 전단지";

export const STORY_EP7_SEMI_SPEC = Object.freeze({
  specVersion: "story_assembly_spec_v1",
  scriptStructureVersion: "story_format_structure_v3",
  formatProfile: "story_v1",
  episode: 7,
  displayEpisode: 7,
  sourceCandidate: "story-ep7-baemin-2019",
  title: "배달의민족 — 분리수거함 전단지에서 4조 원의 값까지",
  channelName: "경제번역소",
  characterDisplayName: "부엉박사",
  imageCharacter: "storysemi",
  imagePrefix: "story_ep7",
  storyStyleOnlyIdentity:
    "2010년대 한국을 배경으로 한 재연 장면 시리즈의 한 장면이야. 화풍: 고품질 반사실 3D CG 렌더링(시네마틱 게임 컷신·CG 다큐 재연 화면 같은 느낌) — 사람의 얼굴·눈·머리·몸 비율은 실제 사람처럼 사실적으로, " +
    "피부·옷·재질은 매끈한 CG 질감, 영화 같은 자연광과 부드러운 그림자, 차분하고 진지한 색감. 큰 눈·둥근 얼굴·과장된 만화 비율(픽사풍) 금지, 실제 사진처럼 보이는 실사도 금지. " +
    "장면 설명에 나오는 인물 외에는 아무도 그리지 마. 세로 9:16.",
  storySameStyleRule:
    "앞 장면들과 똑같은 반사실 3D CG 화풍(사실적인 사람 비율, 매끈한 CG 질감, 같은 시네마틱 조명·색감)을 유지해. " +
    "장면 설명에 없는 인물·글자·숫자·로고는 넣지 마. 얼굴을 크게 보이게 하지 말고 장면 설명대로 뒷모습·작은 모습·손과 소품 위주로 그려. 픽사풍 큰 눈·만화 비율 금지, 실사 사진 금지. 세로 9:16.",

  sceneBackgrounds: Object.freeze({
    A: {
      label: "아파트 단지 분리수거장(1번)",
      image: "해 질 무렵 한국 아파트 단지 분리수거장. 종이·플라스틱 수거함이 줄지어 서 있고, 한쪽 종이 수거함에서 20~30대 한국 남성 두 명이 허리를 숙여 뒷모습으로 전단지를 꺼내고 있다(얼굴 안 보임). 바닥에 컬러 전단지 몇 장, 뒤로 높은 아파트 건물들과 주황빛 노을.",
      videoStyle: "dusk Korean apartment complex recycling area with two young men seen from behind bending over a paper bin pulling out flyers",
      videoStatics: "the row of recycling bins, the tall apartment buildings, the orange dusk sky, and the few colorful flyers on the ground",
    },
    B: {
      label: "전단지 더미 근접(2번)",
      image: "밝은 책상 위에 쌓인 컬러 음식점 전단지 더미 근접 장면. 전단지는 글자 없이 음식 사진 느낌의 색 덩어리와 무늬만 있고, 한 손이 전단지 한 장을 더미 위에 가볍게 올려놓는다. 얼굴·몸 없음(손만). 따뜻한 스탠드 조명.",
      videoStyle: "close view of a tall stack of plain colorful flyers on a bright desk with one hand laying another flyer on top under a warm lamp",
      videoStatics: "the tall stack of plain colorful flyers, the desk, and the warm lamp light",
    },
    C: {
      label: "스마트폰 배달 앱 화면(3번)",
      image: "아늑한 저녁 거실 소파 위에서 두 손이 스마트폰을 쥐고 있는 근접 장면. 화면에는 글자 없이 음식 사진 느낌의 색 덩어리 격자(둥근 사각형 여러 개)만 보인다. 얼굴 없음(손과 폰만). 뒤로 따뜻한 조명의 거실이 흐릿하게.",
      videoStyle: "close view of two hands holding a smartphone showing a plain grid of food-colored blocks in a cozy evening living room",
      videoStatics: "the smartphone with the plain colorful grid, the sofa, and the warm living room light",
    },
    D: {
      label: "작은 사무실 노트북(4번)",
      image: "2010년 한국 작은 스타트업 사무실. 책상 위 노트북 화면에 글자·숫자 없이 칸 무늬만 있는 표가 떠 있고, 두 손이 키보드를 치며, 옆에 컬러 전단지 더미가 쌓여 있다. 얼굴 없음(손만). 창밖은 낮의 도시.",
      videoStyle: "2010 small Korean startup office desk with a laptop showing a plain grid table, hands typing, and a pile of colorful flyers beside it",
      videoStatics: "the laptop with the plain grid table, the pile of colorful flyers, the desk, and the daytime city window",
    },
    E: {
      label: "흩어진 전단지와 스마트폰(5번)",
      image: "넓은 책상 위에 컬러 전단지 수십 장이 제각각 흩어져 있고, 그 한가운데에 스마트폰 한 대가 세워져 있다. 폰 화면에는 글자 없이 음식 사진 느낌의 색 덩어리 격자가 깔끔하게 모여 있다. 사람 없음. 위에서 내려다보는 약간 높은 각도, 밝은 조명.",
      videoStyle: "bright desk with dozens of scattered plain colorful flyers and one smartphone standing in the middle showing a tidy plain grid of food-colored blocks",
      videoStatics: "the scattered colorful flyers, the smartphone with the tidy grid, and the bright desk",
    },
    F: {
      label: "골목 상권과 손님들(6번)",
      image: "2011년 한국 동네 음식점 골목 전경(넓은 구도). 길 양쪽에 간판 글자 없는 작은 음식점들이 늘어서 있고, 길 가운데 많은 사람들이 아주 작게 스마트폰을 들여다보며 걷고 있다. 저녁 조명이 켜지는 시간.",
      videoStyle: "2011 Korean neighborhood restaurant alley at evening with small shops with blank signs on both sides and many tiny people walking while looking at phones",
      videoStatics: "the small shops with blank signs on both sides, the alley road, the evening lights, and the tiny people walking",
    },
    G: {
      label: "협약 악수 회의 탁자(7번)",
      image: "2019년 현대적인 회의실 탁자 위 근접 장면. 양복 소매의 두 손이 서로 악수하고 있고, 탁자 위에 글자 없는 서류철 두 권이 나란히 놓여 있다. 탁자 뒤에 양복 입은 여러 명이 뒷모습으로 서 있다(얼굴 안 보임). 큰 창밖에 도시.",
      videoStyle: "2019 modern meeting room table close view of two suited hands shaking with two plain folders beside, suited people seen from behind",
      videoStatics: "the meeting table, the two plain folders, the suited people seen from behind, and the large window with the city view",
    },
    H: {
      label: "저울 위 휴대폰 모형(8번)",
      image: "밝은 사무실 책상 위 놋쇠 저울. 한쪽 접시에 작은 스마트폰 모형과 작은 오토바이 모형이 올라가 있고, 반대쪽 접시에는 금화 더미가 수북이 쌓여 저울이 금화 쪽으로 기울어 있다. 사람 없음. 모형에 글자·로고 없음. 따뜻한 조명.",
      videoStyle: "bright office desk with a brass scale holding a small phone model and a small scooter model on one pan and a heap of gold coins on the other pan",
      videoStatics: "the brass scale, the small phone model and scooter model, the heap of gold coins, and the warm light",
    },
    I: {
      label: "재무 서류와 붉은 펜(9번)",
      image: "책상 위에 펼쳐진 재무 서류들과 계산기. 서류에는 글자·숫자 없이 줄과 칸 무늬만 있고, 정장 소매의 한 손이 붉은 펜으로 한 칸을 크게 동그라미 치고 있다. 얼굴 없음(손만). 스탠드 불빛, 밤 사무실.",
      videoStyle: "night office desk with spread financial papers of plain ruled boxes, a calculator, and a suited hand circling one box with a red pen",
      videoStatics: "the spread papers with plain ruled boxes, the calculator, the desk lamp, and the dark office behind",
    },
    J: {
      label: "먼 곳을 보는 망원경(10번)",
      image: "높은 사무실 창가에서 정장 입은 사람이 뒷모습으로 서서 망원경으로 먼 지평선 너머 해 뜨는 도시를 바라본다(얼굴 안 보임). 창밖에 새벽 도시와 번지는 금빛 햇살. 사무실 안은 어둡고 조용하다.",
      videoStyle: "high office window with a suited person seen from behind looking through a telescope at a sunrise city on the far horizon",
      videoStatics: "the large window, the sunrise city on the horizon, the golden light, and the dark quiet office",
    },
    K: {
      label: "나란히 놓인 두 스마트폰(11번)",
      image: "책상 위에 스마트폰 두 대가 나란히 세워져 있다. 한 대는 따뜻한 주황 계열, 다른 한 대는 선명한 붉은 계열의 색 덩어리 격자 화면(글자·로고 없음)이고, 두 폰 사이에 한 손이 가볍게 놓여 있다. 얼굴 없음. 밝은 조명.",
      videoStyle: "two smartphones standing side by side on a desk, one with a warm orange plain grid and one with a vivid red plain grid, a hand resting between them",
      videoStatics: "the two smartphones with their plain colorful grids, the desk, and the bright light",
    },
    L: {
      label: "거의 꽉 찬 원형 차트(12번)",
      image: "큰 모니터에 떠 있는 원형 차트 근접 장면. 원의 거의 전부가 한 가지 색으로 꽉 차 있고 아주 작은 조각 하나만 다른 연한 색으로 남아 있다. 글자·숫자 없음. 모니터 앞 책상에 정장 소매의 한 손이 놓여 있다. 얼굴 없음.",
      videoStyle: "close view of a large monitor showing a pie chart almost entirely one color with one tiny pale slice, a suited hand resting on the desk in front",
      videoStatics: "the large monitor, the nearly full single-color pie chart with one tiny pale slice, and the desk",
    },
    M: {
      label: "서류에 도장 찍는 손(13번)",
      image: "깔끔한 사무실 책상 위 글자 없는 공문서 한 장에 정장 소매의 한 손이 도장을 두 손이 아니라 한 손으로 단단히 쥐고 붉은 원 하나를 찍으려는 순간 멈춰 있다. 서류에는 줄무늬만. 얼굴 없음(손과 소품만). 밝은 오전 햇살.",
      videoStyle: "tidy office desk with a suited hand firmly gripping a seal about to press a red circle on a plain official document in bright morning light",
      videoStatics: "the plain official document, the desk, the pen holder, and the bright morning light",
    },
  }),

  scenes: Object.freeze([
    {
      scene: 1, key: "s1_hook", role: "hook", video: "story_ep7_s1_hook_motion.mp4",
      narration: "동네 분리수거함을 뒤져 음식점 전단지를 모으는 사람들이 있었어. 쓰레기가 아니라 전단지를 모으는 거였지.",
      imageBrief: `해 질 무렵 한국 아파트 단지 분리수거장에서 20~30대 한국 남성 두 명이 종이 수거함 쪽으로 허리를 숙인 뒷모습으로 ${FLYER}를 꺼내 한 아름 안는다. 바닥에도 전단지 몇 장이 떨어져 있다. ` + NO_TEXT + FACE_SAFE,
      shot: "medium", bg: "A",
      lock: "the two men stay seen from behind with no face ever shown; the flyers keep plain colorful patterns with no text; the recycling bins and the apartment buildings stay fixed; nobody else enters.",
      motion: motion("the two men pull more flyers out of the paper bin and hold them in their arms while the dusk light glows, the bins and the buildings stay completely still", "an odd collecting"),
    },
    {
      scene: 2, key: "s2_value", role: "evidence", video: "story_ep7_s2_value_motion.mp4",
      narration: "그렇게 모은 전단지는 10년도 안 돼, 수조 원이라는 값이 붙은 회사의 시작이 됐어.",
      imageBrief: `밝은 책상 위에 쌓인 ${FLYER} 더미 근접 장면. 한 손이 전단지 한 장을 더미 위에 가볍게 올려놓는다. 얼굴·몸은 그리지 마(손만). 따뜻한 스탠드 조명. ` + NO_TEXT,
      shot: "close", bg: "B",
      lock: "no face or body ever appears — only the one hand; the stack keeps plain colorful patterns with no text; the lamp and the desk stay fixed.",
      motion: motion("the hand lays one more flyer on the top of the stack and squares the pile with a light tap, the warm lamp light glows steadily, the desk stays completely still", "something small begins"),
    },
    {
      scene: 3, key: "s3_name", role: "evidence", video: "story_ep7_s3_name_motion.mp4",
      narration: "그 회사가 우리가 매일 쓰는 배달의민족이야.",
      imageBrief: "아늑한 저녁 거실 소파 위에서 두 손이 스마트폰을 쥐고 엄지로 화면을 넘기는 근접 장면. 화면에는 글자 없이 음식 사진 느낌의 색 덩어리 격자(둥근 사각형 여러 개)만 보인다. 얼굴은 그리지 마(손과 폰만). " + NO_TEXT,
      shot: "close", bg: "C",
      lock: "no face or body appears — only the two hands and the phone; the phone screen keeps only a plain colorful grid with no text, logos or app names; the sofa and the room light stay fixed.",
      motion: motion("the thumb scrolls the plain grid on the screen and pauses on one block, the warm room light glows steadily, the sofa stays completely still", "an everyday habit"),
    },
    {
      scene: 4, key: "s4_origin", role: "evidence", video: "story_ep7_s4_origin_motion.mp4",
      narration: "시작은 전단지였어. 전국 음식점의 전단지를 모아 데이터베이스를 만들었고, 그걸 휴대폰으로 볼 수 있게 한 앱이 2010년에 나왔지.",
      imageBrief: `작은 사무실 책상 위 노트북 화면에 글자·숫자 없이 칸 무늬만 있는 표가 떠 있고, 두 손이 키보드를 치며, 옆에 ${FLYER} 더미가 쌓여 있다. 얼굴은 그리지 마(손만). ` + NO_TEXT,
      shot: "close", bg: "D",
      lock: "no face or body appears — only the two hands; the laptop screen keeps only a plain grid table with no text or numbers; the flyers keep plain patterns with no text; the window and the desk stay fixed.",
      motion: motion("the hands type steadily on the keyboard and one hand slides a flyer closer, the plain table on the screen stays unchanged, the desk and the window stay completely still", "building something"),
    },
    {
      scene: 5, key: "s5_scatter", role: "evidence", video: "story_ep7_s5_scatter_motion.mp4",
      narration: "전단지는 가게마다 따로 흩어져 있었어. 앱은 그걸 한 화면에 모은 거야.",
      imageBrief: `넓은 책상 위에 ${FLYER} 수십 장이 제각각 흩어져 있고, 그 한가운데에 스마트폰 한 대가 세워져 있다. 폰 화면에는 글자 없이 음식 사진 느낌의 색 덩어리 격자가 깔끔하게 모여 있다. 사람 없음. 약간 높은 각도에서 내려다본다. ` + NO_TEXT,
      shot: "medium", bg: "E",
      lock: "the scattered flyers keep plain colorful patterns with no text and stay in the same arrangement; the phone keeps only a plain tidy grid with no text or logos; no people or hands ever appear.",
      motion: motion("a soft light sweeps across the scattered flyers and settles on the glowing phone screen, the flyers and the phone stay completely still", "scattered to gathered"),
    },
    {
      scene: 6, key: "s6_scale", role: "evidence", video: "story_ep7_s6_scale_motion.mp4",
      narration: "2011년엔 앱에 등록된 가게가 10만여 곳, 이용자는 200만 명이 넘었어. 한쪽엔 가게가, 한쪽엔 먹을 사람이 모인 거지.",
      imageBrief: "저녁 동네 음식점 골목 전경(넓은 구도). 길 양쪽에 간판 글자 없는 작은 음식점들이 늘어서 있고, 길 가운데 많은 사람들이 아주 작게 스마트폰을 들여다보며 걷고 있다. 저녁 조명이 켜지는 시간. " + NO_TEXT,
      shot: "wide", bg: "F",
      lock: "the shops keep blank signs with no text or logos and stay in the same arrangement; the people stay tiny and no one becomes large; the alley road and the lights stay fixed.",
      motion: motion("the tiny people walk along the alley looking at their phones and a few shop lights flicker on, the shops and the road stay completely still", "everyone gathered"),
    },
    {
      scene: 7, key: "s7_deal", role: "evidence", video: "story_ep7_s7_deal_motion.mp4",
      narration: "그리고 2019년 12월 13일, 독일 딜리버리히어로가 우아한형제들의 지분을 인수하겠다고 발표했어.",
      imageBrief: "현대적인 회의실 탁자 위 근접 장면. 양복 소매의 두 손이 서로 악수하고 있고, 탁자 위에 글자 없는 서류철 두 권이 나란히 놓여 있다. 탁자 뒤에 양복 입은 여러 명이 뒷모습으로 서 있다(얼굴 안 보임). 큰 창밖에 도시. " + NO_TEXT,
      shot: "close", bg: "G",
      lock: "no face ever appears — only the hands and the suit sleeves, and the people behind stay seen from behind; the folders keep plain covers with no text; the table and the window stay fixed; nobody new enters.",
      motion: motion("the two hands shake firmly and hold the grip a moment before releasing, the suited people behind stay completely still", "a deal is announced"),
    },
    {
      scene: 8, key: "s8_valuation", role: "evidence", video: "story_ep7_s8_valuation_motion.mp4",
      narration: "우아한형제들 전체의 기업가치는 40억 달러, 약 4조 7,500억 원으로 평가받았지.",
      imageBrief: "밝은 사무실 책상 위 놋쇠 저울. 한쪽 접시에 작은 스마트폰 모형과 작은 오토바이 모형이 올라가 있고, 반대쪽 접시에는 금화 더미가 수북이 쌓여 저울이 금화 쪽으로 기울어 있다. 사람 없음. 모형에 글자·로고 없음. " + NO_TEXT,
      shot: "close", bg: "H",
      lock: "the scale, the phone model, the scooter model and the coins stay in the same arrangement with no text or logos; no people or hands ever appear; only the warm light shifts.",
      motion: motion("the scale beam sways gently and settles tilted toward the coins, the warm light shifts across the brass, the models and the coins stay completely still", "a price is set"),
    },
    {
      scene: 9, key: "s9_results", role: "core_question", video: "story_ep7_s9_results_motion.mp4",
      narration: "그런데 그해 성적은 매출 5,654억 원에 영업손실 364억 원이었어. 적자를 낸 회사에 4조 원이 넘는 값이 붙은 거야.",
      imageBrief: "밤 사무실 책상 위에 펼쳐진 재무 서류들과 계산기. 서류에는 글자·숫자 없이 줄과 칸 무늬만 있고, 정장 소매의 한 손이 붉은 펜으로 한 칸을 크게 동그라미 치고 있다. 얼굴은 그리지 마(손만). " + NO_TEXT,
      shot: "close", bg: "I",
      lock: "no face or body appears — only the one hand and the suit sleeve; the papers keep only plain ruled boxes with no text or numbers; the calculator and the lamp stay fixed.",
      motion: motion("the red pen draws a firm circle around one box and then taps it, the lamp light stays steady, the papers and the calculator stay completely still", "a worrying number"),
    },
    {
      scene: 10, key: "s10_meaning_value", role: "evidence", video: "story_ep7_s10_meaning_value_motion.mp4",
      narration: "기업가치는 한 해 번 돈이 아니라, 미래 성장 가능성을 보고 남이 매기는 값이거든.",
      imageBrief: "높은 사무실 창가에서 정장 입은 사람이 뒷모습으로 서서 망원경으로 먼 지평선 너머 해 뜨는 도시를 바라본다(얼굴 안 보임). 창밖에 새벽 도시와 번지는 금빛 햇살. 사무실 안은 어둡고 조용하다. " + NO_TEXT + FACE_SAFE,
      shot: "medium", bg: "J",
      lock: "the person stays seen from behind with no face ever shown; the telescope stays at his eye; the window and the city skyline stay fixed; nobody else enters.",
      motion: motion("the person adjusts the telescope slightly and keeps looking toward the sunrise, the golden light grows slowly, the window and the city stay completely still", "looking toward the future"),
    },
    {
      scene: 11, key: "s11_yogiyo", role: "core_question", video: "story_ep7_s11_yogiyo_motion.mp4",
      narration: "그런데 이 독일 회사는 이미 한국에서 요기요라는 배달앱을 갖고 있었어.",
      imageBrief: "책상 위에 스마트폰 두 대가 나란히 세워져 있다. 한 대는 따뜻한 주황 계열, 다른 한 대는 선명한 붉은 계열의 색 덩어리 격자 화면(글자·로고 없음)이고, 두 폰 사이에 한 손이 가볍게 놓여 있다. 얼굴은 그리지 마(손만). " + NO_TEXT,
      shot: "close", bg: "K",
      lock: "no face or body appears — only the one hand; both phone screens keep only plain colorful grids with no text, logos or app names; the desk and the light stay fixed.",
      motion: motion("the hand slides slowly from the orange phone to the red phone and rests beside it, the screens glow steadily, the desk stays completely still", "a second app already there"),
    },
    {
      scene: 12, key: "s12_share", role: "evidence", video: "story_ep7_s12_share_motion.mp4",
      narration: "배민과 요기요의 점유율을 합치면 2019년 거래금액 기준으로 99.2%였지.",
      imageBrief: "큰 모니터에 떠 있는 원형 차트 근접 장면. 원의 거의 전부가 한 가지 색으로 꽉 차 있고 아주 작은 조각 하나만 다른 연한 색으로 남아 있다. 글자·숫자 없음. 모니터 앞 책상에 정장 소매의 한 손이 놓여 있다. 얼굴은 그리지 마. " + NO_TEXT,
      shot: "close", bg: "L",
      lock: "no face or body appears — only the one hand and the suit sleeve; the pie chart keeps nearly all one color with one tiny pale slice and no text or numbers; the monitor and the desk stay fixed.",
      motion: motion("the cursor-like soft glow moves along the edge of the almost full chart and stops at the tiny pale slice, the monitor and the hand stay completely still", "almost everything"),
    },
    {
      scene: 13, key: "s13_approval", role: "evidence", video: "story_ep7_s13_approval_motion.mp4",
      narration: "공정거래위원회는 1년 뒤인 2020년 12월 28일, 이 인수를 조건부로 승인했어. 요기요를 6개월 안에 팔라는 조건이었지.",
      imageBrief: "깔끔한 사무실 책상 위 글자 없는 공문서 한 장에 정장 소매의 한 손이 도장을 단단히 쥐고 붉은 원 하나를 찍으려는 순간 멈춰 있다. 서류에는 줄무늬만. 얼굴은 그리지 마(손과 소품만). 밝은 오전 햇살. " + NO_TEXT,
      shot: "close", bg: "M",
      lock: "no face or body appears — only the one hand and the suit sleeve; the seal stays gripped in the hand and the mark it leaves stays a plain red circle with no text; the document keeps plain lines with no text; the desk stays fixed.",
      motion: motion("the hand presses the seal down onto the document and lifts it to leave a plain red circle, the morning light stays steady, the desk stays completely still", "a conditional approval"),
    },
  ]),
});

// ── 14번(부엉박사 마무리) — owl3dv5 스펙으로 따로 생성(참조 이미지 첨부·부엉박사 프레임 규칙은 owl3dv5 경로가 처리) ──
export const STORY_EP7_END_SPEC = Object.freeze({
  specVersion: "story_assembly_spec_v1",
  episode: 7,
  imageCharacter: "owl3dv5",
  imagePrefix: "story_ep7",
  sceneBackgrounds: Object.freeze({
    O: {
      label: "동네 골목 분리수거장(14번 부엉박사)",
      image: "밝은 오후 한국 동네 골목. 부엉박사 뒤로 글자 없는 작은 음식점 두 곳과 분리수거함 한 칸, 수거함 옆 바닥에 컬러 전단지 몇 장(글자 없음). 바닥은 매끈한 연한 회색 포장, 따뜻한 오후 햇빛.",
      videoStyle: "bright afternoon Korean neighborhood alley with two small shops with blank signs and a recycling bin station with a few plain flyers on the ground",
      videoStatics: "the two small shops with blank signs, the recycling bin station, the few plain flyers on the ground, the smooth light gray pavement, and the warm afternoon light",
    },
  }),
  scenes: Object.freeze([
    {
      scene: 14, key: "s14_close", role: "save", video: "story_ep7_s14_close_motion.mp4",
      narration: "분리수거함에서 전단지를 모으던 작은 아이디어가, 10년도 안 돼 4조 원이 넘는 값이 붙은 회사가 됐어. 다음 일화가 궁금하면 팔로우해 둬.",
      imageBrief: "부엉이가 정면을 보며 한쪽 날개를 가슴 앞에 가볍게 모아 차분히 정리해 주는 듯한 따뜻한 표정으로 시청자에게 말하는 포즈, 다른 날개는 자연스럽게 내리고 소품은 들지 않음. 구도 규칙(가장 중요): 부엉이는 화면 아래쪽 절반(세로 45~95%)에 서 있고 머리·얼굴·선글라스는 세로 45%보다 아래에 오게 하며, 화면 위쪽 40%에는 부엉이 없이 건물·하늘·조명 같은 배경만 보이게 해.",
      shot: "medium", bg: "O",
      lock: "the shops keep blank signs with no text; the recycling bins and the flyers on the ground stay fixed; the sunglasses stay on top of the head; no props are held.",
      speaks: true,
      motion: motion("the character gestures gently with one wing at chest height while summarizing, then gives a small warm nod to the viewer; no props are held", "warm summary and invitation to follow"),
    },
  ]),
});

// ── 스토리형 조립 스펙(조립기 run-owl-assemble-shorts-v2.mjs 용) — 5편 STORY_EP5_ASSEMBLE_SPEC과 같은 구성(2026-10-10) ──
// 제목(★임시안 — Owner 확정 필요, 영상 속 제목·커버 문구 동일): 분리수거함의 / 전단지가 / 4조 원 됐다
// 조립: node scripts/run-owl-assemble-shorts-v2.mjs --spec-module ./_story-ep7-assembly-spec.mjs --spec-export STORY_EP7_ASSEMBLE_SPEC --clip-dir C:/tmp/story-ep7-clips-named --audio-summary C:/tmp/money-shorts-os/story-ep7-tts/output-v1/tempo-1.2-gap0.25-pre/elevenlabs-scene-paced-tts-summary.audio-fixed.tempo1.2-gap0.25-pre.json --tts-script C:/tmp/money-shorts-os/story-ep7-tts/story-ep7-tts-script.json --out-dir C:/tmp/story-ep7-assembled
const STORY_RENDER = Object.freeze({
  width: 1080, height: 1920, fps: 24, videoCodec: "libx264", crf: 18, pixFmt: "yuv420p",
  audioCodec: "aac", audioBitrate: "192k", audioSampleRate: 48000, audioChannels: 1,
});

export const STORY_EP7_FULL_SPEC = Object.freeze({
  ...STORY_EP7_SEMI_SPEC,
  sceneBackgrounds: Object.freeze({ ...STORY_EP7_SEMI_SPEC.sceneBackgrounds, ...STORY_EP7_END_SPEC.sceneBackgrounds }),
  scenes: Object.freeze([...STORY_EP7_SEMI_SPEC.scenes, ...STORY_EP7_END_SPEC.scenes]),
});

export const STORY_EP7_ASSEMBLE_SPEC = Object.freeze({
  ...STORY_EP7_FULL_SPEC,
  headerTitle: Object.freeze(["분리수거함의","전단지가","4조 원 됐다"]),
  videoShiftDownPx: 230,
  videoShiftFadePx: 260,
  headerTopY: 345,
  headerScrimHeight: 780,
  captionFontSize: 102,
  captionY: 1385,
  captionPlanner: "scene_dp_v1",
  footerChannelBar: false,
  captionLayout: "v2",
  emphasisTerms: Object.freeze(["배달의민족","배민","전단지","우아한형제들","딜리버리히어로","요기요","기업가치"]),
  emphasisNumberPatterns: Object.freeze(["[0-9,.]+(?:억|만|조)","[0-9,.]+%","[0-9]+곳"]),
  captionEmphasisPop: true,
  captionGapBridgeSec: 0.3,
  captionLastSceneNoMargin: true,
  captionSceneEndMarginSec: 0.1,
  captionLeadSec: 0.12,
  hookType: "story",
  // 날짜·숫자 덩어리가 한 줄 한도(760px)에 안 들어가 가를 자리가 금지 경계뿐인 곳 — 사유와 함께 승인(2026-10-10).
  captionBoundaryExceptions: Object.freeze([
    { left: "2019년", right: "12월", reason: "'2019년 12월 13일' 날짜 덩어리가 한 줄에 안 들어가 연·월 사이에서 갈림(s7), TTS 재생성(유료) 회피(2026-10-10)" },
    { left: "7,500억", right: "원으로", reason: "'약 4조 7,500억 원으로' 금액 덩어리가 한 줄에 안 들어가 '7,500억 / 원으로'로 갈림(s8), TTS 재생성(유료) 회피(2026-10-10)" },
    { left: "364억", right: "원이었어", reason: "'영업손실 364억 원이었어'가 한 줄에 안 들어가 '364억 / 원이었어'로 갈림(s9), TTS 재생성(유료) 회피(2026-10-10)" },
    { left: "2020년", right: "12월", reason: "'2020년 12월 28일' 날짜 덩어리가 한 줄에 안 들어가 연·월 사이에서 갈림(s13), TTS 재생성(유료) 회피(2026-10-10)" },
  ]),
  // 한 어절 자체가 폭 한도(760px)를 넘는 줄(2026-10-10): 줄바꿈으로 못 풀어 TTS 재생성(유료) 없이 안전폭 864px 이내에서 사유와 함께 승인.
  captionWidthExceptions: Object.freeze([
    { line: "딜리버리히어로가", reason: "한 어절 8자 816px — 줄바꿈으로 못 품(안전폭 864 이내, 글자 크기 102px 유지)" },
    { line: "공정거래위원회는", reason: "한 어절 8자 816px — 줄바꿈으로 못 품(안전폭 864 이내, 글자 크기 102px 유지)" },
  ]),
  render: STORY_RENDER,
  scenes: Object.freeze(STORY_EP7_FULL_SPEC.scenes.map((s) => Object.freeze({ ...s, overlays: [] }))),
});
