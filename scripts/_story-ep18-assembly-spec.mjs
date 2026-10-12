/**
 * 스토리형 18편 — 포켓몬빵 — 빵이 아니라 기억을 사려고 줄을 선 일 재연 장면 스펙 (2026-10-11, 기본 베이스 구조).
 *
 * 기준: `_ai/story-script-rules.md` + 확정 대본 `C:/tmp/story-ep18-pokemon/scenes-v1.json`. 설계 `C:/tmp/story-ep18-pokemon/story-design.json`.
 * TTS `C:/tmp/money-shorts-os/story-ep18-tts/output-v1/tempo-1.2-gap0.25-pre/…tempo1.2-gap0.25-pre.json`.
 * 화풍: 반사실 3D(storysemi). 1~15번 재연 장면 + 16번 부엉박사 진행자 컷.
 * 이미지 규칙(스토리형): 화면에 글자·숫자·로고·브랜드·회사 이름을 넣지 않는다(숫자는 자막이 맡는다). 실존 인물을 닮게 그리지 않는다
 * (얼굴이 크게 보이는 구도 금지, 뒷모습·멀리 있는 작은 모습·손과 소품). 소품은 두 손으로 감싸 쥐거나 탁자·바닥에 거치. 빈 면 금지.
 * 저작권 캐릭터·로고(미키·디즈니 성·마리오 등)는 그리지 않는다.
 *
 * 이미지 생성: ① 1~15번 `ALLOW_CHATGPT_IMAGE=1 node scripts/probe-character-consistency-chatgpt-v1.mjs --character storysemi --scene-spec ./_story-ep18-assembly-spec.mjs --scene-spec-export STORY_EP18_SEMI_SPEC --out-dir C:/tmp/story-ep18-images`
 *            ② 16번(부엉박사) `… --character owl3dv5 --scene-spec ./_story-ep18-assembly-spec.mjs --scene-spec-export STORY_EP18_END_SPEC --out-dir C:/tmp/story-ep18-images`
 */

const NO_TEXT = "화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).";
const motion = (action, mood) => ({ type: "scene", action, mood });

export const STORY_EP18_SEMI_SPEC = Object.freeze({
  specVersion: "story_assembly_spec_v1",
  scriptStructureVersion: "story_format_structure_v3",
  formatProfile: "story_v1",
  episode: 18,
  displayEpisode: 18,
  sourceCandidate: "story-ep18-pokemon-bread-2022",
  title: "포켓몬빵 — 빵이 아니라 기억을 사려고 줄을 선 일",
  channelName: "경제번역소",
  characterDisplayName: "부엉박사",
  imageCharacter: "storysemi",
  imagePrefix: "story_ep18",
  storyStyleOnlyIdentity:
    "2022년 한국의 이른 새벽 대형마트 앞과 편의점 선반을 배경으로 한 재연 장면 시리즈의 한 장면이야. 실존 인물을 닮게 그리지 않고, 실제 캐릭터·브랜드 로고와 색을 흉내 내지 않아(포켓몬 캐릭터는 그리지 않고 무늬 없는 빵 봉지만 그려). 화풍: 고품질 반사실 3D CG 렌더링(시네마틱 게임 컷신·CG 다큐 재연 화면 같은 느낌) — 사람의 얼굴·눈·머리·몸 비율은 실제 사람처럼 사실적으로, 피부·옷·재질은 매끈한 CG 질감, 영화 같은 자연광과 부드러운 그림자, 차분하고 진지한 색감. 큰 눈·둥근 얼굴·과장된 만화 비율(픽사풍) 금지, 실제 사진처럼 보이는 실사도 금지. 장면 설명에 나오는 인물 외에는 아무도 그리지 마. 세로 9:16.",
  storySameStyleRule:
    "앞 장면들과 똑같은 반사실 3D CG 화풍(사실적인 사람 비율, 매끈한 CG 질감, 같은 시네마틱 조명·색감)을 유지해. 장면 설명에 없는 인물·글자·숫자·로고는 넣지 마. 얼굴을 크게 보이게 하지 말고 장면 설명대로 뒷모습·작은 모습·손과 소품 위주로 그려. 픽사풍 큰 눈·만화 비율 금지, 실사 사진 금지. 세로 9:16.",

  sceneBackgrounds: Object.freeze({
    A: { label: "문 열기 전 대형마트 앞에 늘어선 어른들(1번)", image: "푸른 새벽빛 속 아직 닫힌 대형마트 유리문 앞에 어른들이 길게 늘어선 작은 뒷모습. 글자·로고 없음.", videoStyle: "adults seen small from behind lined up in a long queue in front of the still-closed glass doors of a large supermarket in blue dawn light, no text or logos", videoStatics: "the supermarket facade, the glass doors, and the dawn light" },
    B: { label: "오래된 빵 봉지가 놓인 매대(2번)", image: "매대 위에 무늬만 있는 빵 봉지 몇 개(캐릭터·글자 없음, 노랗고 둥근 무늬 하나)가 놓여 있다. 사람 없음. 밝은 조명.", videoStyle: "a store shelf with a few bread bags holding only a round yellow pattern with no characters or text, no people, bright lighting", videoStatics: "the shelf, the bread bags, and the lighting" },
    C: { label: "줄 맨 끝에서 앞을 올려다보는 어른(3번)", image: "새벽의 대형마트 앞 줄 맨 끝에서 한 어른이 뒷모습으로 서서 길게 이어진 줄의 앞쪽을 올려다본다(얼굴 안 보임). 글자 없음. 푸른 새벽빛.", videoStyle: "at dawn an adult seen from behind standing at the end of a long queue in front of a supermarket looking up toward the front, no text, blue dawn light", videoStatics: "the queue, the supermarket facade, and the dawn light" },
    D: { label: "공장에서 포장되어 나오는 빵 봉지(4번)", image: "제과 공장 컨베이어 위에 무늬만 있는 빵 봉지들(글자·캐릭터 없음)이 줄지어 포장되어 나온다. 사람 없음. 밝은 공장 조명.", videoStyle: "a bakery factory conveyor carrying plain bread bags with only a round pattern and no text or characters, no people, bright factory lighting", videoStatics: "the conveyor frame, the factory walls, and the bright lighting" },
    E: { label: "오래된 스티커 앨범을 펼치는 손(5번)", image: "책상 위에 오래된 스티커 앨범이 펼쳐져 있고 한 손이 빈 칸 하나를 짚는다(글자·캐릭터 없음, 무늬만). 손만 보임. 따뜻한 조명.", videoStyle: "close view of an old sticker album open on a desk with one hand touching an empty slot, only patterns and no text or characters, hand only, warm lighting", videoStatics: "the desk, the album, and the warm light" },
    F: { label: "비어 가는 편의점 빵 선반(6번)", image: "편의점 빵 선반의 칸들이 대부분 비어 있고 한쪽 칸에 글자 없는 종이 한 장만 세워져 있다. 사람 없음. 밝은 형광등 조명.", videoStyle: "a convenience store bread shelf mostly empty with one slot holding a standing plain paper with no text, no people, bright fluorescent lighting", videoStatics: "the shelf, the empty slots, the paper, and the lighting" },
    G: { label: "새벽 대형마트 문 앞 줄과 편의점 앞 작은 줄(7번)", image: "새벽의 푸른빛 속 대형마트 문 앞에 길게 늘어선 사람들과 그 옆 골목 편의점 앞의 작은 줄. 사람들은 작은 뒷모습. 글자·로고 없음.", videoStyle: "in blue dawn light a long queue in front of a supermarket door and a small queue in front of a convenience store in the alley beside it, small people seen from behind, no text or logos", videoStatics: "the supermarket door, the convenience store, and the dawn light" },
    H: { label: "구매 제한 표지만 세워진 계산대(8번)", image: "대형마트 계산대 위에 글자 없이 손바닥 모양 정지 무늬만 있는 작은 표지가 세워져 있고 옆에 빵 봉지 몇 개가 놓여 있다. 사람 없음.", videoStyle: "a supermarket checkout counter with a small standing sign holding only a plain stop-hand pattern and no text, with a few plain bread bags beside it, no people", videoStatics: "the counter, the sign, the bread bags, and the lighting" },
    I: { label: "대기표를 쥔 채 서 있는 사람들(9번)", image: "새벽 대형마트 문 앞에서 사람들이 뒷모습으로 서서 손에 글자 없는 종이표를 한 장씩 쥐고 있다(얼굴 안 보임). 푸른 새벽빛.", videoStyle: "people seen from behind at dawn in front of a supermarket door each holding one plain paper ticket with no text, blue dawn light", videoStatics: "the door, the queue, and the dawn light" },
    J: { label: "스티커만 따로 모은 투명 봉투와 뜯긴 빵 봉지(10번)", image: "탁자 위에 스티커만 따로 모아 담은 작은 투명 봉투 묶음과 그 옆에 스티커가 빠진 빵 봉지 하나가 놓여 있다(글자·캐릭터 없음, 무늬만). 사람 없음.", videoStyle: "a table with a bundle of small clear bags holding only stickers and one bread bag with its sticker missing beside it, only patterns, no text or characters, no people", videoStatics: "the table, the clear bags, the bread bag, and the lighting" },
    K: { label: "밤에도 불이 켜진 제과 공장 라인(11번)", image: "밤에도 환하게 불이 켜진 제과 공장 라인. 컨베이어 위에 무늬만 있는 빵 봉지들이 쉴 새 없이 지나간다. 사람 없음. 글자 없음.", videoStyle: "a bakery factory line brightly lit at night with plain patterned bread bags passing nonstop on the conveyor, no people, no text", videoStatics: "the factory line, the conveyor frame, and the bright lighting" },
    L: { label: "오래된 사진첩과 교복 소품이 놓인 책상(12번)", image: "책상 위에 오래된 사진첩 한 권과 접힌 교복 윗옷, 낡은 필통이 놓여 있다. 사람 없음. 글자 없음. 따뜻한 오후 빛.", videoStyle: "a desk with an old photo album, a folded school uniform top, and a worn pencil case, no people, no text, warm afternoon light", videoStatics: "the desk, the album, the uniform, the pencil case, and the warm light" },
    M: { label: "빵 봉지를 쥐고 창밖을 보는 사람(13번)", image: "창가에서 한 사람이 뒷모습으로 서서 두 손으로 빵 봉지(무늬만, 글자 없음)를 감싸 쥐고 창밖을 바라본다(얼굴 안 보임). 따뜻한 조명.", videoStyle: "a person seen from behind at a window holding a plain patterned bread bag with both hands and looking outside, no text, warm lighting", videoStatics: "the window, the person, and the warm light" },
    N: { label: "쌓여 가는 빈 빵 상자와 비어 가는 선반(14번)", image: "한쪽에는 빈 빵 상자가 높이 쌓여 가고 다른 쪽에는 선반이 텅 비어 있는 대비. 사람 없음. 글자 없음.", videoStyle: "a contrast of empty bread crates stacking high on one side and a completely empty shelf on the other, no people, no text", videoStatics: "the crates, the empty shelf, and the lighting" },
    O: { label: "벽처럼 높이 쌓인 빈 빵 상자 창고(15번)", image: "물류 창고에 빈 빵 상자들이 벽처럼 높이 쌓여 있다. 사람 없음. 글자 없음. 밝은 창고 조명.", videoStyle: "a logistics warehouse with empty bread crates stacked high like a wall, no people, no text, bright warehouse lighting", videoStatics: "the wall of crates, the warehouse, and the lighting" },
  }),

  scenes: Object.freeze([
    { scene: 1, key: "s1_hook", role: "hook", video: "story_ep18_s1_hook_motion.mp4",
      narration: "어른들이 빵 하나를 사려고 새벽부터 대형마트 앞에 줄을 섰고, 가게들은 한 사람이 살 수 있는 개수까지 정해야 했어.",
      imageBrief: "푸른 새벽빛 속 아직 닫힌 대형마트 유리문 앞에 어른들이 길게 늘어선 작은 뒷모습. 글자·로고 없음. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "wide", bg: "A",
      lock: "the people stay small and seen from behind with no face shown; no text or logos; the facade stays fixed.",
      motion: motion("the queue shifts slightly as someone at the back stamps their feet against the cold, the facade and the doors stay completely still", "waiting before dawn") },
    { scene: 2, key: "s2_what", role: "evidence", video: "story_ep18_s2_what_motion.mp4",
      narration: "그 빵은 예전에 나왔다가 사라졌던 포켓몬빵이었어.",
      imageBrief: "매대 위에 무늬만 있는 빵 봉지 몇 개(캐릭터·글자 없음, 노랗고 둥근 무늬 하나)가 놓여 있다. 사람 없음. 밝은 조명. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "close", bg: "B",
      lock: "no people appear; the bags keep no text, characters or logos; the shelf stays fixed.",
      motion: motion("a soft glint of light slides over the bags once, the shelf and the bags stay completely still", "a familiar bread") },
    { scene: 3, key: "s3_why", role: "core_question", video: "story_ep18_s3_why_motion.mp4",
      narration: "빵 하나가 어른들을 새벽부터 줄 세운 이유가 뭘까?",
      imageBrief: "새벽의 대형마트 앞 줄 맨 끝에서 한 어른이 뒷모습으로 서서 길게 이어진 줄의 앞쪽을 올려다본다(얼굴 안 보임). 글자 없음. 푸른 새벽빛. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만). 구도 규칙(가장 중요): 카메라를 낮게 잡아 인물의 머리는 화면 세로 45%보다 아래(45~85% 구간)에 오게 하고, 화면 위쪽 40%에는 사람·머리가 하나도 없이 벽·창문·천장·조명·하늘 같은 배경만 보이게 해.",
      shot: "medium", bg: "C",
      lock: "the people stay seen from behind with no face ever shown; no text or logos; nobody else enters.",
      motion: motion("the person steps on tiptoe to see the front of the line then settles back, the queue and the facade stay completely still", "why this queue") },
    { scene: 4, key: "s4_relaunch", role: "evidence", video: "story_ep18_s4_relaunch_motion.mp4",
      narration: "2022년 2월, SPC삼립이 이 빵을 다시 내놨어. 회사는 소비자들의 요청이 꾸준했다고 설명했지.",
      imageBrief: "제과 공장 컨베이어 위에 무늬만 있는 빵 봉지들(글자·캐릭터 없음)이 줄지어 포장되어 나온다. 사람 없음. 밝은 공장 조명. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "medium", bg: "D",
      lock: "no people appear; the bags keep no text, characters or logos; the conveyor frame stays fixed.",
      motion: motion("the bags glide steadily along the conveyor one after another, the frame and the background stay completely still", "back on the line") },
    { scene: 5, key: "s5_memory", role: "evidence", video: "story_ep18_s5_memory_motion.mp4",
      narration: "회사가 내세운 건 '그때 그 추억'이었어.",
      imageBrief: "책상 위에 오래된 스티커 앨범이 펼쳐져 있고 한 손이 빈 칸 하나를 짚는다(글자·캐릭터 없음, 무늬만). 손만 보임. 따뜻한 조명. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "close", bg: "E",
      lock: "no face or body appears — only the hand; the album keeps no text or characters; the desk stays fixed.",
      motion: motion("the hand traces along the empty slot slowly and rests, the desk and the album stay completely still", "that memory") },
    { scene: 6, key: "s6_empty", role: "evidence", video: "story_ep18_s6_empty_motion.mp4",
      narration: "그런데 편의점 선반은 금세 비어 버렸어.",
      imageBrief: "편의점 빵 선반의 칸들이 대부분 비어 있고 한쪽 칸에 글자 없는 종이 한 장만 세워져 있다. 사람 없음. 밝은 형광등 조명. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "medium", bg: "F",
      lock: "no people appear; the paper keeps no text; the shelf stays fixed.",
      motion: motion("the fluorescent light flickers once over the empty slots, the shelf and the paper stay completely still", "gone already") },
    { scene: 7, key: "s7_line", role: "evidence", video: "story_ep18_s7_line_motion.mp4",
      narration: "대형마트 앞에는 새벽부터 줄이 늘어섰고, 편의점 앞에서도 오픈런이 벌어졌지.",
      imageBrief: "새벽의 푸른빛 속 대형마트 문 앞에 길게 늘어선 사람들과 그 옆 골목 편의점 앞의 작은 줄. 사람들은 작은 뒷모습. 글자·로고 없음. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "wide", bg: "G",
      lock: "the people stay small and seen from behind with no face shown; no text or logos; the buildings stay fixed.",
      motion: motion("both queues shuffle forward a step together, the buildings and the street stay completely still", "two queues") },
    { scene: 8, key: "s8_limit", role: "evidence", video: "story_ep18_s8_limit_motion.mp4",
      narration: "물건이 모자라자 대형마트들은 한 사람이 살 수 있는 개수를 정했어.",
      imageBrief: "대형마트 계산대 위에 글자 없이 손바닥 모양 정지 무늬만 있는 작은 표지가 세워져 있고 옆에 빵 봉지 몇 개가 놓여 있다. 사람 없음. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "close", bg: "H",
      lock: "no people appear; the sign and bags keep no text or characters; the counter stays fixed.",
      motion: motion("a soft light moves across the sign and the bags once, the counter and the sign stay completely still", "a limit on each person") },
    { scene: 9, key: "s9_whohas", role: "core_question", video: "story_ep18_s9_whohas_motion.mp4",
      narration: "그럼 이 빵은 누구 손에 들어갔을까? 먼저 선 순서와 개수 제한이 가르는 셈이었지.",
      imageBrief: "새벽 대형마트 문 앞에서 사람들이 뒷모습으로 서서 손에 글자 없는 종이표를 한 장씩 쥐고 있다(얼굴 안 보임). 푸른 새벽빛. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만). 구도 규칙(가장 중요): 카메라를 낮게 잡아 인물의 머리는 화면 세로 45%보다 아래(45~85% 구간)에 오게 하고, 화면 위쪽 40%에는 사람·머리가 하나도 없이 벽·창문·천장·조명·하늘 같은 배경만 보이게 해.",
      shot: "medium", bg: "I",
      lock: "the people stay seen from behind with no face ever shown; the tickets keep no text; nobody else enters.",
      motion: motion("one person raises the ticket slightly to check it then lowers it, the door and the queue stay completely still", "who gets one") },
    { scene: 10, key: "s10_seal", role: "evidence", video: "story_ep18_s10_seal_motion.mp4",
      narration: "그런데 빵과 띠부씰이 따로 팔리기 시작했어. 씰이 없는 빵이 중고 시장에 올라왔지.",
      imageBrief: "탁자 위에 스티커만 따로 모아 담은 작은 투명 봉투 묶음과 그 옆에 스티커가 빠진 빵 봉지 하나가 놓여 있다(글자·캐릭터 없음, 무늬만). 사람 없음. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "close", bg: "J",
      lock: "no people appear; the stickers and bag keep no text or characters; the table stays fixed.",
      motion: motion("a soft light slides over the clear bags once, the table and the bags stay completely still", "sold apart") },
    { scene: 11, key: "s11_apology", role: "evidence", video: "story_ep18_s11_apology_motion.mp4",
      narration: "SPC삼립은 생산설비를 24시간 돌리고 있는데도 모든 분께 공급하기 어렵다며 사과문을 올렸어.",
      imageBrief: "밤에도 환하게 불이 켜진 제과 공장 라인. 컨베이어 위에 무늬만 있는 빵 봉지들이 쉴 새 없이 지나간다. 사람 없음. 글자 없음. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "wide", bg: "K",
      lock: "no people appear; the bags keep no text or characters; the line stays fixed.",
      motion: motion("the bags stream along the conveyor without pause, the frame and the factory stay completely still", "running all night") },
    { scene: 12, key: "s12_nostalgia", role: "evidence", video: "story_ep18_s12_nostalgia_motion.mp4",
      narration: "여러 보도는 이 빵이 이렇게 팔린 이유로 향수를 꼽았어.",
      imageBrief: "책상 위에 오래된 사진첩 한 권과 접힌 교복 윗옷, 낡은 필통이 놓여 있다. 사람 없음. 글자 없음. 따뜻한 오후 빛. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "medium", bg: "L",
      lock: "no people appear; the items keep no text or logos; the desk stays fixed.",
      motion: motion("the warm light shifts slowly across the album, the desk and the items stay completely still", "school days") },
    { scene: 13, key: "s13_past", role: "evidence", video: "story_ep18_s13_past_motion.mp4",
      narration: "이 빵을 먹어 본 사람에게 이 맛은 곧 지난 기억이라는 거였지.",
      imageBrief: "창가에서 한 사람이 뒷모습으로 서서 두 손으로 빵 봉지(무늬만, 글자 없음)를 감싸 쥐고 창밖을 바라본다(얼굴 안 보임). 따뜻한 조명. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만). 구도 규칙(가장 중요): 카메라를 낮게 잡아 인물의 머리는 화면 세로 45%보다 아래(45~85% 구간)에 오게 하고, 화면 위쪽 40%에는 사람·머리가 하나도 없이 벽·창문·천장·조명·하늘 같은 배경만 보이게 해.",
      shot: "medium", bg: "M",
      lock: "the people stay seen from behind with no face ever shown; the bag keeps no text or characters; nobody else enters.",
      motion: motion("the person exhales slowly and looks down at the bag, the window and the room stay completely still", "remembering") },
    { scene: 14, key: "s14_howmany", role: "core_question", video: "story_ep18_s14_howmany_motion.mp4",
      narration: "그렇게 사 간 빵은 얼마나 됐을까?",
      imageBrief: "한쪽에는 빈 빵 상자가 높이 쌓여 가고 다른 쪽에는 선반이 텅 비어 있는 대비. 사람 없음. 글자 없음. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "wide", bg: "N",
      lock: "no people appear; the crates keep no text or logos; the shelf stays empty.",
      motion: motion("one more crate settles onto the stack, the shelf and the stack stay completely still", "how many were sold") },
    { scene: 15, key: "s15_ten", role: "evidence", video: "story_ep18_s15_ten_motion.mp4",
      narration: "40여 일 만에 약 1,000만 개가 팔렸어.",
      imageBrief: "물류 창고에 빈 빵 상자들이 벽처럼 높이 쌓여 있다. 사람 없음. 글자 없음. 밝은 창고 조명. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "wide", bg: "O",
      lock: "no people appear; the crates keep no text or logos; the stack stays fixed.",
      motion: motion("a soft light travels along the top of the stacked crates and fades, the stack and the warehouse stay completely still", "ten million") },
  ]),
});

// ── 16번(부엉박사 마무리) — owl3dv5 스펙으로 따로 생성 ──
export const STORY_EP18_END_SPEC = Object.freeze({
  specVersion: "story_assembly_spec_v1",
  episode: 18,
  imageCharacter: "owl3dv5",
  imagePrefix: "story_ep18",
  sceneBackgrounds: Object.freeze({
    P: { label: "빵 매대 앞(16번 부엉박사)", image: "밝은 오후 한국 마트 빵 코너 앞. 부엉박사 뒤로 글자 없는 빵 매대와 열린 진열대, 바닥에 놓인 빵 상자 두 개(글자 없음). 바닥은 매끈한 연한 회색, 따뜻한 오후 빛.", videoStyle: "bright afternoon in front of a Korean supermarket bakery corner with a plain bread display, an open shelf, and two plain bread boxes on the ground, smooth light gray floor", videoStatics: "the bread display, the open shelf, the two boxes, the smooth light gray floor, and the warm afternoon light" },
  }),
  scenes: Object.freeze([
    {
      scene: 16, key: "s16_close", role: "save", video: "story_ep18_s16_close_motion.mp4",
      narration: "사람들이 줄을 서서 산 건 빵의 맛이 아니라 기억이었어. 모자란 건 빵이 아니라, 그 기억을 손에 쥘 수 있는 개수였지. 포켓몬빵의 다음 이야기가 궁금하면 팔로우해 줘.",
      imageBrief: "부엉이가 정면을 보며 한쪽 날개를 가슴 앞에 가볍게 모아 차분히 정리해 주는 듯한 따뜻한 표정으로 시청자에게 말하는 포즈, 다른 날개는 자연스럽게 내리고 소품은 들지 않음. 구도 규칙(가장 중요): 부엉이는 화면 아래쪽 절반(세로 45~95%)에 서 있고 머리·얼굴·선글라스는 세로 45%보다 아래에 오게 하며, 화면 위쪽 40%에는 부엉이 없이 건물·하늘·조명 같은 배경만 보이게 해.",
      shot: "medium", bg: "P",
      lock: "the display and the boxes stay fixed; the sunglasses stay on top of the head; no props are held.",
      speaks: true,
      motion: motion("the character gestures gently with one wing at chest height while summarizing, then gives a small warm nod to the viewer; no props are held", "warm summary and invitation to follow"),
    },
  ]),
});

// ── 조립 스펙(run-owl-assemble-shorts-v2.mjs) — 제목은 ★임시안(Owner 확정 필요) ──
// 조립: node scripts/run-owl-assemble-shorts-v2.mjs --spec-module ./_story-ep18-assembly-spec.mjs --spec-export STORY_EP18_ASSEMBLE_SPEC --clip-dir C:/tmp/story-ep18-clips-named --audio-summary C:/tmp/money-shorts-os/story-ep18-tts/output-v1/tempo-1.2-gap0.25-pre/elevenlabs-scene-paced-tts-summary.audio-fixed.tempo1.2-gap0.25-pre.json --tts-script C:/tmp/money-shorts-os/story-ep18-tts/story-ep18-tts-script.json --out-dir C:/tmp/story-ep18-assembled
const STORY_RENDER = Object.freeze({
  width: 1080, height: 1920, fps: 24, videoCodec: "libx264", crf: 18, pixFmt: "yuv420p",
  audioCodec: "aac", audioBitrate: "192k", audioSampleRate: 48000, audioChannels: 1,
});

export const STORY_EP18_FULL_SPEC = Object.freeze({
  ...STORY_EP18_SEMI_SPEC,
  sceneBackgrounds: Object.freeze({ ...STORY_EP18_SEMI_SPEC.sceneBackgrounds, ...STORY_EP18_END_SPEC.sceneBackgrounds }),
  scenes: Object.freeze([...STORY_EP18_SEMI_SPEC.scenes, ...STORY_EP18_END_SPEC.scenes]),
});

export const STORY_EP18_ASSEMBLE_SPEC = Object.freeze({
  ...STORY_EP18_FULL_SPEC,
  headerTitle: Object.freeze(["줄 서서 산 건","빵이 아니라","포켓몬빵의 기억"]),
  videoShiftDownPx: 230,
  videoShiftFadePx: 260,
  headerTopY: 345,
  headerScrimHeight: 780,
  captionFontSize: 102,
  captionY: 1385,
  captionPlanner: "scene_dp_v1",
  footerChannelBar: false,
  captionLayout: "v2",
  emphasisTerms: Object.freeze(["포켓몬빵","새벽","개수","띠부씰","24시간","1,000만"]),
  emphasisNumberPatterns: Object.freeze(["[0-9,.]+%","[0-9]+배","[0-9]+명","[0-9,.]+억","[0-9,.]+만"]),
  captionEmphasisPop: true,
  captionGapBridgeSec: 0.3,
  captionLastSceneNoMargin: true,
  captionSceneEndMarginSec: 0.1,
  captionLeadSec: 0.12,
  hookType: "story",
  render: STORY_RENDER,
  scenes: Object.freeze(STORY_EP18_FULL_SPEC.scenes.map((s) => Object.freeze({ ...s, overlays: [] }))),
});
