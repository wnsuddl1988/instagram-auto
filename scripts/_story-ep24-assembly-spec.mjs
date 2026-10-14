/**
 * 스토리형 24편 — 평창 롱패딩 — 14만 9천 원 패딩에 사람들이 밤을 새운 이유 재연 장면 스펙 (2026-10-11, 기본 베이스 구조).
 *
 * 기준: `_ai/story-script-rules.md` + 확정 대본 `C:/tmp/story-ep24-longpadding/scenes-v1.json`. 설계 `C:/tmp/story-ep24-longpadding/story-design.json`.
 * TTS `C:/tmp/money-shorts-os/story-ep24-tts/output-v1/tempo-1.2-gap0.25-pre/…tempo1.2-gap0.25-pre.json`.
 * 화풍: 반사실 3D(storysemi). 1~15번 재연 장면 + 16번 부엉박사 진행자 컷.
 * 이미지 규칙(스토리형): 화면에 글자·숫자·로고·브랜드·회사 이름을 넣지 않는다(숫자는 자막이 맡는다). 실존 인물을 닮게 그리지 않는다
 * (얼굴이 크게 보이는 구도 금지, 뒷모습·멀리 있는 작은 모습·손과 소품). 소품은 두 손으로 감싸 쥐거나 탁자·바닥에 거치. 빈 면 금지.
 * 저작권 캐릭터·로고(미키·디즈니 성·마리오 등)는 그리지 않는다.
 *
 * 이미지 생성: ① 1~15번 `ALLOW_CHATGPT_IMAGE=1 node scripts/probe-character-consistency-chatgpt-v1.mjs --character storysemi --scene-spec ./_story-ep24-assembly-spec.mjs --scene-spec-export STORY_EP24_SEMI_SPEC --out-dir C:/tmp/story-ep24-images`
 *            ② 16번(부엉박사) `… --character owl3dv5 --scene-spec ./_story-ep24-assembly-spec.mjs --scene-spec-export STORY_EP24_END_SPEC --out-dir C:/tmp/story-ep24-images`
 */

const NO_TEXT = "화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).";
const motion = (action, mood) => ({ type: "scene", action, mood });

export const STORY_EP24_SEMI_SPEC = Object.freeze({
  specVersion: "story_assembly_spec_v1",
  scriptStructureVersion: "story_format_structure_v3",
  formatProfile: "story_v1",
  episode: 24,
  displayEpisode: 24,
  sourceCandidate: "story-ep24-pyeongchang-longpadding-2017",
  title: "평창 롱패딩 — 14만 9천 원 패딩에 사람들이 밤을 새운 이유",
  channelName: "경제번역소",
  characterDisplayName: "부엉박사",
  imageCharacter: "storysemi",
  imagePrefix: "story_ep24",
  storyStyleOnlyIdentity:
    "2017년 겨울 한국 백화점 앞 거리와 매장, 창고를 배경으로 한 재연 장면 시리즈의 한 장면이야. 실존 인물을 닮게 그리지 않고, 실제 백화점·올림픽 로고와 상표를 흉내 내지 않아(패딩과 상자는 글자 없는 단색, 안내판은 무늬만 있는 판). 화풍: 고품질 반사실 3D CG 렌더링(시네마틱 게임 컷신·CG 다큐 재연 화면 같은 느낌) — 사람의 얼굴·눈·머리·몸 비율은 실제 사람처럼 사실적으로, 피부·옷·재질은 매끈한 CG 질감, 영화 같은 자연광과 부드러운 그림자, 차분하고 진지한 색감. 큰 눈·둥근 얼굴·과장된 만화 비율(픽사풍) 금지, 실제 사진처럼 보이는 실사도 금지. 장면 설명에 나오는 인물 외에는 아무도 그리지 마. 세로 9:16.",
  storySameStyleRule:
    "앞 장면들과 똑같은 반사실 3D CG 화풍(사실적인 사람 비율, 매끈한 CG 질감, 같은 시네마틱 조명·색감)을 유지해. 장면 설명에 없는 인물·글자·숫자·로고는 넣지 마. 얼굴을 크게 보이게 하지 말고 장면 설명대로 뒷모습·작은 모습·손과 소품 위주로 그려. 픽사풍 큰 눈·만화 비율 금지, 실사 사진 금지. 세로 9:16.",

  sceneBackgrounds: Object.freeze({
    A: { label: "저녁 백화점 입구 앞에 길게 늘어선 줄(1번)", image: "저녁 어스름 백화점 입구 앞에 담요를 두른 사람들이 뒷모습으로 길게 줄을 서 있다(얼굴 안 보임). 글자·로고 없음. 겨울 저녁빛.", videoStyle: "people wrapped in blankets seen from behind standing in a long line in front of a department store entrance at winter dusk, no text or logos", videoStatics: "the store entrance, the line, and the dusk light" },
    B: { label: "겨울 쇼윈도에 걸린 롱패딩 한 벌(2번)", image: "겨울 쇼윈도 안에 단색 롱패딩 한 벌이 걸려 있고 숫자 없는 무늬만 있는 가격표 모양이 달려 있다. 사람 없음. 글자·로고·숫자 없음.", videoStyle: "a winter shop window with one solid-color long padded coat hanging and a tag showing only a pattern without numerals, no people, no text or logos", videoStatics: "the window, the coat, the tag, and the lighting" },
    C: { label: "줄 선 사람들 사이 보온 컵과 접이식 의자(3번)", image: "줄 선 사람들 발치에 김이 나는 보온 컵과 접이식 의자가 놓여 있다. 사람은 발 아래쪽만 살짝 보임. 글자 없음. 차가운 저녁빛.", videoStyle: "close view of a steaming thermos cup and a folding chair at the feet of people in a line, only shoes slightly visible, no text, cold evening light", videoStatics: "the pavement, the cup, the chair, and the light" },
    D: { label: "눈 덮인 경기장 앞에 선 롱패딩 마네킹(4번)", image: "눈 덮인 경기장 풍경 앞에 단색 롱패딩을 입은 마네킹이 서 있다. 사람 없음. 글자·로고·오륜 표시 없음. 맑은 겨울빛.", videoStyle: "a mannequin in a solid-color long padded coat standing in front of a snowy stadium landscape, no people, no text, logos or ring symbols, clear winter light", videoStatics: "the mannequin, the snowy stadium, and the light" },
    E: { label: "창고 선반에 쌓인 롱패딩 상자와 비어 가는 칸(5번)", image: "창고 선반에 글자 없는 상자가 쌓여 있고 몇 칸은 비어 있다. 사람 없음. 글자·숫자 없음. 형광등 조명.", videoStyle: "a warehouse shelf with stacked plain boxes without text and several empty slots, no people, no text or numerals, fluorescent lighting", videoStatics: "the shelves, the boxes, and the lighting" },
    F: { label: "비싼 롱패딩들 옆에 홀로 놓인 롱패딩(6번)", image: "옷걸이 열에 부피 큰 롱패딩들이 걸려 있고 그 끝 옆 마네킹에 단색 롱패딩 한 벌이 홀로 서 있다. 사람 없음. 글자·로고 없음.", videoStyle: "a clothes rack with bulky long padded coats and a mannequin at the end in one solid-color long padded coat standing alone, no people, no text or logos", videoStatics: "the rack, the coats, the mannequin, and the lighting" },
    G: { label: "신문 스크랩과 계산기 모양 소품(7번)", image: "탁자 위에 글자 없는 무늬만 있는 신문 스크랩과 숫자 없는 계산기 모양 소품이 놓여 있다. 사람 없음. 글자·숫자 없음.", videoStyle: "close view of a newspaper clipping showing only a pattern without text and a calculator-shaped prop without numerals on a table, no people", videoStatics: "the table, the clipping, the prop, and the lighting" },
    H: { label: "카운터 위에 한 벌만 올려진 롱패딩과 손가락 하나(8번)", image: "매장 카운터 위에 롱패딩 한 벌만 올려져 있고 한 손이 검지 하나를 펴 보인다. 손만 보임. 글자·숫자 없음. 환한 조명.", videoStyle: "close view of a store counter with only one long padded coat on it and one hand raising a single index finger, hand only, no text or numerals, bright lighting", videoStatics: "the counter, the coat, and the lighting" },
    I: { label: "저녁 백화점 문 앞의 첫 손님과 안내판(9번)", image: "저녁 백화점 문 앞에 첫 손님 한 명이 뒷모습으로 서 있고 옆에는 글자 없는 무늬만 있는 안내판이 세워져 있다(얼굴 안 보임). 글자 없음.", videoStyle: "the first customer seen from behind standing at a department store door in the evening beside a signboard showing only a pattern without text, no text", videoStatics: "the door, the signboard, and the evening light" },
    J: { label: "새벽 줄 끝에서 마감 안내문을 보는 사람들(10번)", image: "새벽 백화점 앞 줄 끝에서 사람들이 뒷모습으로 글자 없는 무늬만 있는 마감 안내판을 바라본다(얼굴 안 보임). 푸른 새벽빛.", videoStyle: "people seen from behind at the end of a long line at dawn looking at a closed-notice board showing only a pattern without text, blue dawn light", videoStatics: "the store, the board, and the dawn light" },
    K: { label: "스마트폰 화면을 보며 돌아서는 사람들(11번)", image: "백화점 앞에서 사람들이 뒷모습으로 스마트폰 화면을 내려다보며 돌아서 걸어간다(얼굴 안 보임). 글자 없음. 아침빛.", videoStyle: "people seen from behind walking away from a department store looking down at their smartphones, no text, morning light", videoStatics: "the store front and the morning light" },
    L: { label: "스마트폰 중고 거래 화면의 롱패딩 사진들(12번)", image: "스마트폰 화면에 같은 단색 롱패딩 사진들이 격자로 올라온 중고 거래 목록 모양이 보인다. 글자·숫자·로고 없음. 사람 없음.", videoStyle: "close view of a smartphone screen showing a grid of photos of the same solid-color long padded coat in a resale listing style, no text, numerals or logos, no people", videoStatics: "the phone, the screen grid, and the lighting" },
    M: { label: "손에 쥔 순번표 한 장과 반대편 손의 지폐(13번)", image: "한 손에 숫자 없는 순번표 한 장이, 다른 손에 지폐 몇 장이 쥐여 서로 마주하고 있다. 손만 보임. 글자·숫자 없음.", videoStyle: "close view of one hand holding a plain ticket without numerals and another hand holding a few banknotes facing each other, hands only, no text or numerals", videoStatics: "the hands and the soft background" },
    N: { label: "새벽빛 속 줄과 손목시계(14번)", image: "새벽빛 속 백화점 앞 줄의 한 사람이 뒷모습으로 손목시계(숫자 없는 시계)를 내려다본다(얼굴 안 보임). 글자 없음.", videoStyle: "a person in a line at dawn seen from behind looking down at a wristwatch without numerals, no text, dawn light", videoStatics: "the line, the store front, and the dawn light" },
    O: { label: "가격표 모양과 큰 모래시계(15번)", image: "탁자 위에 숫자 없는 가격표 모양 소품과 모래가 반쯤 흘러내린 큰 모래시계가 나란히 놓여 있다. 사람 없음. 글자·숫자 없음.", videoStyle: "close view of a tag-shaped prop without numerals and a large hourglass with the sand half run out side by side on a table, no people, no text or numerals", videoStatics: "the table, the tag prop, the hourglass, and the lighting" },
  }),

  scenes: Object.freeze([
    { scene: 1, key: "s1_hook", role: "hook", video: "story_ep24_s1_hook_motion.mp4",
      narration: "패딩 한 벌을 사려고, 사람들이 판매 전날 저녁부터 백화점 앞에 줄을 섰어.",
      imageBrief: "저녁 어스름 백화점 입구 앞에 담요를 두른 사람들이 뒷모습으로 길게 줄을 서 있다(얼굴 안 보임). 글자·로고 없음. 겨울 저녁빛. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만). 구도 규칙(가장 중요): 카메라를 낮게 잡아 인물의 머리는 화면 세로 45%보다 아래(45~85% 구간)에 오게 하고, 화면 위쪽 40%에는 사람·머리가 하나도 없이 벽·창문·천장·조명·하늘 같은 배경만 보이게 해.",
      shot: "wide", bg: "A",
      lock: "the people stay seen from behind with no face ever shown; the store keeps no text or logos; nobody else enters.",
      motion: motion("the line shuffles forward a tiny step and settles, the store entrance stays completely still", "waiting since evening") },
    { scene: 2, key: "s2_price", role: "evidence", video: "story_ep24_s2_price_motion.mp4",
      narration: "2017년 11월, 그 패딩은 14만 9천 원이었지.",
      imageBrief: "겨울 쇼윈도 안에 단색 롱패딩 한 벌이 걸려 있고 숫자 없는 무늬만 있는 가격표 모양이 달려 있다. 사람 없음. 글자·로고·숫자 없음. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "medium", bg: "B",
      lock: "no people appear; the coat and tag keep no text, logos or numerals; the window stays fixed.",
      motion: motion("the window light brightens softly on the coat, the window and the coat stay completely still", "the coat on display") },
    { scene: 3, key: "s3_whyq", role: "core_question", video: "story_ep24_s3_whyq_motion.mp4",
      narration: "14만 9천 원짜리 패딩에 왜 밤을 새웠을까?",
      imageBrief: "줄 선 사람들 발치에 김이 나는 보온 컵과 접이식 의자가 놓여 있다. 사람은 발 아래쪽만 살짝 보임. 글자 없음. 차가운 저녁빛. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "close", bg: "C",
      lock: "no faces appear — only shoes at the edge; nothing carries text; the chair stays fixed.",
      motion: motion("steam rises gently from the cup, the pavement and the chair stay completely still", "why spend the night") },
    { scene: 4, key: "s4_official", role: "evidence", video: "story_ep24_s4_official_motion.mp4",
      narration: "평창동계올림픽 공식 상품으로 나온 '평창 롱패딩'이었어.",
      imageBrief: "눈 덮인 경기장 풍경 앞에 단색 롱패딩을 입은 마네킹이 서 있다. 사람 없음. 글자·로고·오륜 표시 없음. 맑은 겨울빛. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "medium", bg: "D",
      lock: "no people appear; nothing carries text or logos; the mannequin stays fixed.",
      motion: motion("a few snowflakes drift past the mannequin, the stadium and the mannequin stay completely still", "official winter gear") },
    { scene: 5, key: "s5_volume", role: "evidence", video: "story_ep24_s5_volume_motion.mp4",
      narration: "롯데백화점이 처음 기획한 물량은 3만 장이었어. 품절이 난 뒤 남은 물량을 22일부터 다시 풀기로 했지.",
      imageBrief: "창고 선반에 글자 없는 상자가 쌓여 있고 몇 칸은 비어 있다. 사람 없음. 글자·숫자 없음. 형광등 조명. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "wide", bg: "E",
      lock: "no people appear; the boxes keep no text or numerals; the shelves stay fixed.",
      motion: motion("the fluorescent light flickers faintly over the empty slots, the shelves and the boxes stay completely still", "stock running out") },
    { scene: 6, key: "s6_value", role: "evidence", video: "story_ep24_s6_value_motion.mp4",
      narration: "그해 겨울 롱패딩은 대부분 20만 원대 중반에서 30만 원대 초반이었어. 14만 9천 원은 그 절반 안팎이라 가성비 입소문이 났지.",
      imageBrief: "옷걸이 열에 부피 큰 롱패딩들이 걸려 있고 그 끝 옆 마네킹에 단색 롱패딩 한 벌이 홀로 서 있다. 사람 없음. 글자·로고 없음. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "medium", bg: "F",
      lock: "no people appear; the coats keep no text or logos; the rack stays fixed.",
      motion: motion("a soft spotlight brightens slightly on the lone coat, the rack and the mannequin stay completely still", "the bargain coat") },
    { scene: 7, key: "s7_margin", role: "evidence", video: "story_ep24_s7_margin_motion.mp4",
      narration: "경향신문은 마진 없는 싼 가격이 인기의 비결이라는 업계의 말을 전했어.",
      imageBrief: "탁자 위에 글자 없는 무늬만 있는 신문 스크랩과 숫자 없는 계산기 모양 소품이 놓여 있다. 사람 없음. 글자·숫자 없음. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "close", bg: "G",
      lock: "no people appear; nothing carries text or numerals; the table stays fixed.",
      motion: motion("a soft light slides across the clipping and the prop, the table stays completely still", "no margin") },
    { scene: 8, key: "s8_limit", role: "evidence", video: "story_ep24_s8_limit_motion.mp4",
      narration: "그런데 다시 푸는 수량은 많지 않았어. 한 사람이 한 벌만 살 수 있었지.",
      imageBrief: "매장 카운터 위에 롱패딩 한 벌만 올려져 있고 한 손이 검지 하나를 펴 보인다. 손만 보임. 글자·숫자 없음. 환한 조명. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "close", bg: "H",
      lock: "no face or body appears — only the hand; the coat keeps no text or logos; the counter stays fixed.",
      motion: motion("the hand holds up one finger and lowers it, the counter and the coat stay completely still", "one per person") },
    { scene: 9, key: "s9_line", role: "evidence", video: "story_ep24_s9_line_motion.mp4",
      narration: "21일 저녁 7시, 첫 손님이 줄을 섰어. 순번표는 다음 날 아침 9시에 나눠 줄 예정이었지.",
      imageBrief: "저녁 백화점 문 앞에 첫 손님 한 명이 뒷모습으로 서 있고 옆에는 글자 없는 무늬만 있는 안내판이 세워져 있다(얼굴 안 보임). 글자 없음. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만). 구도 규칙(가장 중요): 카메라를 낮게 잡아 인물의 머리는 화면 세로 45%보다 아래(45~85% 구간)에 오게 하고, 화면 위쪽 40%에는 사람·머리가 하나도 없이 벽·창문·천장·조명·하늘 같은 배경만 보이게 해.",
      shot: "medium", bg: "I",
      lock: "the people stay seen from behind with no face ever shown; the signboard keeps no text; nobody else enters.",
      motion: motion("the customer shifts weight slightly and settles, the door and the signboard stay completely still", "the first in line") },
    { scene: 10, key: "s10_soldout", role: "evidence", video: "story_ep24_s10_soldout_motion.mp4",
      narration: "밤새 줄이 늘었고, 판매가 시작되기도 전에 매진됐어.",
      imageBrief: "새벽 백화점 앞 줄 끝에서 사람들이 뒷모습으로 글자 없는 무늬만 있는 마감 안내판을 바라본다(얼굴 안 보임). 푸른 새벽빛. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만). 구도 규칙(가장 중요): 카메라를 낮게 잡아 인물의 머리는 화면 세로 45%보다 아래(45~85% 구간)에 오게 하고, 화면 위쪽 40%에는 사람·머리가 하나도 없이 벽·창문·천장·조명·하늘 같은 배경만 보이게 해.",
      shot: "wide", bg: "J",
      lock: "the people stay seen from behind with no face ever shown; the board keeps no text; nobody else enters.",
      motion: motion("the people lower their shoulders slightly, the store and the board stay completely still", "sold out before opening") },
    { scene: 11, key: "s11_wherenow", role: "core_question", video: "story_ep24_s11_wherenow_motion.mp4",
      narration: "줄 서지 못한 사람들은 어디로 갔을까?",
      imageBrief: "백화점 앞에서 사람들이 뒷모습으로 스마트폰 화면을 내려다보며 돌아서 걸어간다(얼굴 안 보임). 글자 없음. 아침빛. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만). 구도 규칙(가장 중요): 카메라를 낮게 잡아 인물의 머리는 화면 세로 45%보다 아래(45~85% 구간)에 오게 하고, 화면 위쪽 40%에는 사람·머리가 하나도 없이 벽·창문·천장·조명·하늘 같은 배경만 보이게 해.",
      shot: "medium", bg: "K",
      lock: "the people stay seen from behind with no face ever shown; the phone screens show no readable text; nobody else enters.",
      motion: motion("the people walk slowly away while looking at their phones, the store front stays completely still", "where do they go") },
    { scene: 12, key: "s12_premium", role: "evidence", video: "story_ep24_s12_premium_motion.mp4",
      narration: "중고 사이트에는 정가에 파는 글이 거의 없었어. 대부분 5만~10만 원쯤 웃돈이 붙어 있었지.",
      imageBrief: "스마트폰 화면에 같은 단색 롱패딩 사진들이 격자로 올라온 중고 거래 목록 모양이 보인다. 글자·숫자·로고 없음. 사람 없음. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "close", bg: "L",
      lock: "no people appear; the screen keeps no text or numerals; the phone stays fixed.",
      motion: motion("the screen glow pulses softly over the photos, the phone stays completely still", "resale with premium") },
    { scene: 13, key: "s13_waitnum", role: "evidence", video: "story_ep24_s13_waitnum_motion.mp4",
      narration: "연합뉴스는 대기번호를 5만 원에 사겠다는 글까지 올라왔다고 전했어.",
      imageBrief: "한 손에 숫자 없는 순번표 한 장이, 다른 손에 지폐 몇 장이 쥐여 서로 마주하고 있다. 손만 보임. 글자·숫자 없음. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "close", bg: "M",
      lock: "no face or body appears — only the hands; the ticket and notes keep no text or numerals.",
      motion: motion("the hand with the notes inches toward the ticket and stops, the background stays completely still", "buying a place in line") },
    { scene: 14, key: "s14_night", role: "evidence", video: "story_ep24_s14_night_motion.mp4",
      narration: "그날 백화점 앞의 값은 14만 9천 원이었지만, 사람들이 실제로 치른 건 하룻밤이었어.",
      imageBrief: "새벽빛 속 백화점 앞 줄의 한 사람이 뒷모습으로 손목시계(숫자 없는 시계)를 내려다본다(얼굴 안 보임). 글자 없음. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만). 구도 규칙(가장 중요): 카메라를 낮게 잡아 인물의 머리는 화면 세로 45%보다 아래(45~85% 구간)에 오게 하고, 화면 위쪽 40%에는 사람·머리가 하나도 없이 벽·창문·천장·조명·하늘 같은 배경만 보이게 해.",
      shot: "medium", bg: "N",
      lock: "the people stay seen from behind with no face ever shown; the watch keeps no numerals or text; nobody else enters.",
      motion: motion("the person lifts the wrist slightly and lowers it, the line and the store stay completely still", "a whole night spent") },
    { scene: 15, key: "s15_lesson", role: "evidence", video: "story_ep24_s15_lesson_motion.mp4",
      narration: "정가가 싸 보여도 줄 선 시간까지 더하면 실제로 치른 값은 달라져.",
      imageBrief: "탁자 위에 숫자 없는 가격표 모양 소품과 모래가 반쯤 흘러내린 큰 모래시계가 나란히 놓여 있다. 사람 없음. 글자·숫자 없음. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "close", bg: "O",
      lock: "no people appear; nothing carries text or numerals; the table stays fixed.",
      motion: motion("the sand falls slowly through the hourglass, the table and the tag stay completely still", "time is a price too") },
  ]),
});

// ── 16번(부엉박사 마무리) — owl3dv5 스펙으로 따로 생성 ──
export const STORY_EP24_END_SPEC = Object.freeze({
  specVersion: "story_assembly_spec_v1",
  episode: 24,
  imageCharacter: "owl3dv5",
  imagePrefix: "story_ep24",
  sceneBackgrounds: Object.freeze({
    P: { label: "백화점 앞 광장(16번 부엉박사)", image: "밝은 낮 한국 백화점 입구 앞 광장. 부엉박사 뒤로 글자 없는 백화점 외벽과 열린 문, 바닥에 놓인 단색 롱패딩 한 벌(글자 없음). 바닥은 매끈한 연한 회색 포장, 따뜻한 낮빛.", videoStyle: "bright daytime on the plaza in front of a Korean department store with a plain facade, an open door, and one solid-color long padded coat on the ground, smooth light gray pavement", videoStatics: "the facade, the open door, the coat, the smooth light gray pavement, and the warm daylight" },
  }),
  scenes: Object.freeze([
    {
      scene: 16, key: "s16_close", role: "save", video: "story_ep24_s16_close_motion.mp4",
      narration: "내 시간도 값이라는 걸 따져 보면, 싼 물건이 늘 싼 건 아니야. 롱패딩 이야기가 더 궁금하면 팔로우해 줘.",
      imageBrief: "부엉이가 정면을 보며 한쪽 날개를 가슴 앞에 가볍게 모아 차분히 정리해 주는 듯한 따뜻한 표정으로 시청자에게 말하는 포즈, 다른 날개는 자연스럽게 내리고 소품은 들지 않음. 구도 규칙(가장 중요): 부엉이는 화면 아래쪽 절반(세로 45~95%)에 서 있고 머리·얼굴·선글라스는 세로 45%보다 아래에 오게 하며, 화면 위쪽 40%에는 부엉이 없이 건물·하늘·조명 같은 배경만 보이게 해.",
      shot: "medium", bg: "P",
      lock: "the facade and the coat stay fixed; the sunglasses stay on top of the head; no props are held.",
      speaks: true,
      motion: motion("the character gestures gently with one wing at chest height while summarizing, then gives a small warm nod to the viewer; no props are held", "warm summary and invitation to follow"),
    },
  ]),
});

// ── 조립 스펙(run-owl-assemble-shorts-v2.mjs) — 제목은 ★임시안(Owner 확정 필요) ──
// 조립: node scripts/run-owl-assemble-shorts-v2.mjs --spec-module ./_story-ep24-assembly-spec.mjs --spec-export STORY_EP24_ASSEMBLE_SPEC --clip-dir C:/tmp/story-ep24-clips-named --audio-summary C:/tmp/money-shorts-os/story-ep24-tts/output-v1/tempo-1.2-gap0.25-pre/elevenlabs-scene-paced-tts-summary.audio-fixed.tempo1.2-gap0.25-pre.json --tts-script C:/tmp/money-shorts-os/story-ep24-tts/story-ep24-tts-script.json --out-dir C:/tmp/story-ep24-assembled
const STORY_RENDER = Object.freeze({
  width: 1080, height: 1920, fps: 24, videoCodec: "libx264", crf: 18, pixFmt: "yuv420p",
  audioCodec: "aac", audioBitrate: "192k", audioSampleRate: 48000, audioChannels: 1,
});

export const STORY_EP24_FULL_SPEC = Object.freeze({
  ...STORY_EP24_SEMI_SPEC,
  sceneBackgrounds: Object.freeze({ ...STORY_EP24_SEMI_SPEC.sceneBackgrounds, ...STORY_EP24_END_SPEC.sceneBackgrounds }),
  scenes: Object.freeze([...STORY_EP24_SEMI_SPEC.scenes, ...STORY_EP24_END_SPEC.scenes]),
});

export const STORY_EP24_ASSEMBLE_SPEC = Object.freeze({
  ...STORY_EP24_FULL_SPEC,
  headerTitle: Object.freeze(["14만 9천 원","패딩에 밤새","줄 선 이유"]),
  videoShiftDownPx: 230,
  videoShiftFadePx: 260,
  headerTopY: 345,
  headerScrimHeight: 780,
  captionFontSize: 102,
  captionY: 1385,
  captionPlanner: "scene_dp_v1",
  footerChannelBar: false,
  captionLayout: "v2",
  emphasisTerms: Object.freeze(["14만 9천","3만 장","5만~10만","웃돈","7시"]),
  emphasisNumberPatterns: Object.freeze(["[0-9,.]+%","[0-9]+배","[0-9]+명","[0-9,.]+억","[0-9,.]+만"]),
  captionEmphasisPop: true,
  captionGapBridgeSec: 0.3,
  captionLastSceneNoMargin: true,
  captionSceneEndMarginSec: 0.1,
  captionLeadSec: 0.12,
  hookType: "story",
  render: STORY_RENDER,
  scenes: Object.freeze(STORY_EP24_FULL_SPEC.scenes.map((s) => Object.freeze({ ...s, overlays: [] }))),
});
