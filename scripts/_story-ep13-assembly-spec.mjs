/**
 * 스토리형 13편 — 쿠쿠 — 남의 이름으로 만들던 공장이 자기 이름을 건 일 재연 장면 스펙 (2026-10-11, 기본 베이스 구조).
 *
 * 기준: `_ai/story-script-rules.md` + 확정 대본 `C:/tmp/story-ep13-cuckoo/scenes-v7.json`. 설계 `C:/tmp/story-ep13-cuckoo/story-design.json`.
 * TTS `C:/tmp/money-shorts-os/story-ep13-tts/output-v1/tempo-1.2-gap0.25-pre/…tempo1.2-gap0.25-pre.json`.
 * 화풍: 반사실 3D(storysemi). 1~15번 재연 장면 + 16번 부엉박사 진행자 컷.
 * 이미지 규칙(스토리형): 화면에 글자·숫자·로고·브랜드·회사 이름을 넣지 않는다(숫자는 자막이 맡는다). 실존 인물을 닮게 그리지 않는다
 * (얼굴이 크게 보이는 구도 금지, 뒷모습·멀리 있는 작은 모습·손과 소품). 소품은 두 손으로 감싸 쥐거나 탁자·바닥에 거치. 빈 면 금지.
 * 저작권 캐릭터·로고(미키·디즈니 성·마리오 등)는 그리지 않는다.
 *
 * 이미지 생성: ① 1~15번 `ALLOW_CHATGPT_IMAGE=1 node scripts/probe-character-consistency-chatgpt-v1.mjs --character storysemi --scene-spec ./_story-ep13-assembly-spec.mjs --scene-spec-export STORY_EP13_SEMI_SPEC --out-dir C:/tmp/story-ep13-images`
 *            ② 16번(부엉박사) `… --character owl3dv5 --scene-spec ./_story-ep13-assembly-spec.mjs --scene-spec-export STORY_EP13_END_SPEC --out-dir C:/tmp/story-ep13-images`
 */

const NO_TEXT = "화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).";
const motion = (action, mood) => ({ type: "scene", action, mood });

export const STORY_EP13_SEMI_SPEC = Object.freeze({
  specVersion: "story_assembly_spec_v1",
  scriptStructureVersion: "story_format_structure_v3",
  formatProfile: "story_v1",
  episode: 13,
  displayEpisode: 13,
  sourceCandidate: "story-ep13-cuckoo-own-brand-1998",
  title: "쿠쿠 — 남의 이름으로 만들던 공장이 자기 이름을 건 일",
  channelName: "경제번역소",
  characterDisplayName: "부엉박사",
  imageCharacter: "storysemi",
  imagePrefix: "story_ep13",
  storyStyleOnlyIdentity:
    "1998년 한국 외환위기 시기의 밥솥 하청 공장과 사무실을 배경으로 한 재연 장면 시리즈의 한 장면이야. 실존 인물(창업자·대기업 인사)을 닮게 그리지 않고, 실제 회사·브랜드 로고와 색을 흉내 내지 않아. 화풍: 고품질 반사실 3D CG 렌더링(시네마틱 게임 컷신·CG 다큐 재연 화면 같은 느낌) — 사람의 얼굴·눈·머리·몸 비율은 실제 사람처럼 사실적으로, 피부·옷·재질은 매끈한 CG 질감, 영화 같은 자연광과 부드러운 그림자, 차분하고 진지한 색감. 큰 눈·둥근 얼굴·과장된 만화 비율(픽사풍) 금지, 실제 사진처럼 보이는 실사도 금지. 장면 설명에 나오는 인물 외에는 아무도 그리지 마. 세로 9:16.",
  storySameStyleRule:
    "앞 장면들과 똑같은 반사실 3D CG 화풍(사실적인 사람 비율, 매끈한 CG 질감, 같은 시네마틱 조명·색감)을 유지해. 장면 설명에 없는 인물·글자·숫자·로고는 넣지 마. 얼굴을 크게 보이게 하지 말고 장면 설명대로 뒷모습·작은 모습·손과 소품 위주로 그려. 픽사풍 큰 눈·만화 비율 금지, 실사 사진 금지. 세로 9:16.",

  sceneBackgrounds: Object.freeze({
    A: { label: "반으로 줄어든 주문서와 돈 봉투(1번)", image: "공장 사무실 벽에 글자 없는 주문서 용지 묶음이 반쯤만 남아 걸려 있고, 그 앞 책상 위에 한 손이 두툼한 돈 봉투를 올려놓는다. 손만 보이고 얼굴은 그리지 마. 따뜻하지만 무거운 조명.", videoStyle: "a factory office wall with a bundle of plain order sheets only half remaining and a hand placing a thick money envelope on the desk in front, hand only, warm but heavy lighting", videoStatics: "the wall with the half-remaining order sheets, the desk, and the lighting" },
    B: { label: "이름표 없는 밥솥 상자가 줄지은 라인(2번)", image: "밥솥 공장 컨베이어 위에 이름표도 글자도 없는 흰 밥솥 상자가 줄지어 천천히 이동한다. 사람 없음. 밝은 공장 조명.", videoStyle: "a rice cooker factory conveyor carrying a line of plain white rice cooker boxes with no labels or text slowly, no people, bright factory lighting", videoStatics: "the conveyor frame, the factory walls, and the bright lighting" },
    C: { label: "낡은 작업장 입구(3번)", image: "오래된 작은 공장 작업장 입구. 낡은 간판 틀이 걸려 있지만 글자는 없다. 사람 없음. 이른 아침 푸른빛.", videoStyle: "the entrance of an old small factory workshop with a worn signboard frame holding no text, no people, early morning blue light", videoStatics: "the entrance, the worn signboard frame, and the early morning light" },
    D: { label: "납품 트럭에 상자를 싣는 작업자들(4번)", image: "공장 하역장에서 작업복을 입은 작업자 서너 명이 로고 없는 흰 납품 트럭에 이름 없는 밥솥 상자를 싣는다(작은 뒷모습). 낮의 햇살.", videoStyle: "a factory loading dock where a few workers in uniforms load plain unlabeled rice cooker boxes onto a plain white delivery truck with no logos, seen small from behind, daylight", videoStatics: "the loading dock, the plain white truck, and the factory wall" },
    E: { label: "통보문을 읽는 공장장(5번)", image: "공장 사무실. 작업복 차림의 공장장이 뒷모습으로 서서 손에 든 종이 한 장을 내려다본다(글자 없음, 얼굴 안 보임). 창밖에 멈춘 트럭 한 대.", videoStyle: "a factory office with a factory manager in a uniform seen from behind looking down at a plain sheet of paper in hand, a stopped truck visible through the window", videoStatics: "the office, the window, and the stopped truck outside" },
    F: { label: "멈춘 조립 라인(6번)", image: "불이 반쯤 꺼진 밥솥 조립 라인. 가운데 구간은 멈춰 있고 작업자 서너 명이 의자에 앉아 기다리는 작은 뒷모습. 글자 없음.", videoStyle: "a rice cooker assembly line with half the lights off, the middle section idle and a few workers sitting on chairs waiting seen small from behind, no text", videoStatics: "the idle line, the half-dark factory, and the chairs" },
    G: { label: "주문서 한 장만 남은 책상(7번)", image: "책상 위에 주문서 한 장만 남아 있고, 창밖으로 불이 꺼진 공장 건물이 보인다. 사람 없음. 해질녘 빛. 글자 없음.", videoStyle: "a desk with only one plain order sheet left and an unlit factory building visible through the window, no people, dusk light, no text", videoStatics: "the desk, the single sheet, the window, and the dark factory outside" },
    H: { label: "이름 없는 상자를 앞에 둔 사람(8번)", image: "작업대 위에 이름도 글자도 없는 흰 밥솥 상자 하나가 놓여 있고, 한 사람이 뒷모습으로 두 팔을 짚고 서서 내려다본다(얼굴 안 보임). 낮은 조명.", videoStyle: "a workbench with one plain white rice cooker box with no name or text and a person seen from behind leaning on both arms looking down at it, low lighting", videoStatics: "the workbench, the plain box, and the low lighting" },
    I: { label: "새 이름이 붙는 첫 밥솥 시제품(9번)", image: "작업대 위에 막 완성된 밥솥 시제품 한 대(글자·로고 없는 둥근 문양 하나만)를 두 손이 감싸 쥐듯 올려놓는다. 손만 보임. 따뜻한 조명.", videoStyle: "close view of a freshly finished rice cooker prototype with only one plain round emblem and no text or logo set on a workbench by two cupping hands, hands only, warm light", videoStatics: "the workbench, the prototype, and the warm light" },
    J: { label: "텅 빈 광고판 틀을 올려다보는 사람들(10번)", image: "한적한 도심 거리의 큰 광고판 틀(안은 비어 있음)을 올려다보는 사람들의 작은 뒷모습. 글자·로고 없음. 낮의 햇살.", videoStyle: "a quiet downtown street with a large empty billboard frame and small people seen from behind looking up, no text or logos, daylight", videoStatics: "the empty billboard frame, the buildings, and the street" },
    K: { label: "텔레비전을 보는 가족(11번)", image: "1990년대 한국 가정 거실. 소파에 앉은 가족 서너 명이 뒷모습으로 텔레비전을 본다(얼굴 안 보임). 화면에는 흰 밥솥 한 대가 나오고 글자·로고는 없다. 저녁 조명.", videoStyle: "a 1990s Korean living room with a few family members seated on a sofa seen from behind watching a television showing a plain white rice cooker with no text or logo, evening light", videoStatics: "the sofa, the television, and the living room walls" },
    L: { label: "주문서와 돈 봉투가 올라간 저울(12번)", image: "탁자 위 저울. 한쪽 접시에 글자 없는 주문서 묶음, 다른 쪽 접시에 두툼한 돈 봉투가 올라가 있고 저울이 살짝 흔들린다. 사람 없음. 따뜻한 조명.", videoStyle: "a scale on a table with a bundle of plain order sheets on one plate and a thick money envelope on the other, gently swaying, no people, warm light", videoStatics: "the table, the scale frame, and the warm light" },
    M: { label: "시상대 가장 높은 곳의 밥솥(13번)", image: "밝은 무대 위 세 단 시상대의 가장 높은 단 위에 글자·로고 없는 흰 밥솥이 놓여 있고, 낮은 두 단에는 다른 모양의 흰 밥솥이 놓여 있다. 사람 없음.", videoStyle: "a bright stage with a three-step podium holding a plain white rice cooker with no text or logo on the highest step and different plain rice cookers on the lower steps, no people", videoStatics: "the podium, the three rice cookers, and the stage" },
    N: { label: "절반 가까이 채워진 점유율 도형(14번)", image: "책상 위에 원형 점유율 도형 모형의 절반 가까이가 밝은 색으로 채워져 있고 옆에 금빛 블록들이 쌓여 있다. 글자·숫자 없음. 사람 없음.", videoStyle: "close view of a round share-diagram model nearly half filled with a bright color on a desk beside stacked gold blocks, no text or numbers, no people", videoStatics: "the desk, the diagram model, and the stacked blocks" },
    O: { label: "대부분 채워진 점유율 도형(15번)", image: "책상 위에 원형 점유율 도형 모형의 대부분이 밝은 색으로 채워져 있다. 글자·숫자 없음. 사람 없음. 환한 빛.", videoStyle: "close view of a round share-diagram model mostly filled with a bright color on a desk, no text or numbers, no people, bright light", videoStatics: "the desk, the diagram model, and the bright light" },
  }),

  scenes: Object.freeze([
    { scene: 1, key: "s1_hook", role: "hook", video: "story_ep13_s1_hook_motion.mp4",
      narration: "주문이 반 토막 난 해에, 하청 공장이 마케팅에 20억 원을 걸었어. 1998년, 외환위기 때였지.",
      imageBrief: "공장 사무실 벽에 글자 없는 주문서 용지 묶음이 반쯤만 남아 걸려 있고, 그 앞 책상 위에 한 손이 두툼한 돈 봉투를 올려놓는다. 손만 보이고 얼굴은 그리지 마. 따뜻하지만 무거운 조명. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "close", bg: "A",
      lock: "no face or body appears — only the hand; the sheets keep no text or numbers; the envelope keeps no logo; the desk stays fixed.",
      motion: motion("the hand slides the envelope forward and withdraws, the wall and the sheets stay completely still", "a bet in a crisis") },
    { scene: 2, key: "s2_why", role: "core_question", video: "story_ep13_s2_why_motion.mp4",
      narration: "남의 이름으로 밥솥을 만들던 공장이 왜 이런 베팅을 했을까?",
      imageBrief: "밥솥 공장 컨베이어 위에 이름표도 글자도 없는 흰 밥솥 상자가 줄지어 천천히 이동한다. 사람 없음. 밝은 공장 조명. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "medium", bg: "B",
      lock: "no people appear; the boxes keep plain white faces with no text, logos or patterns; the conveyor frame stays fixed.",
      motion: motion("the plain boxes glide steadily along the conveyor one after another, the frame and the background stay completely still", "making for others") },
    { scene: 3, key: "s3_company", role: "evidence", video: "story_ep13_s3_company_motion.mp4",
      narration: "지금 우리가 아는 쿠쿠의 시작이야.",
      imageBrief: "오래된 작은 공장 작업장 입구. 낡은 간판 틀이 걸려 있지만 글자는 없다. 사람 없음. 이른 아침 푸른빛. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "wide", bg: "C",
      lock: "no people appear; the signboard keeps no text or logos; the entrance stays the same.",
      motion: motion("the early light brightens slowly on the entrance and a faint steam rises from a vent, the building and the frame stay completely still", "where it began") },
    { scene: 4, key: "s4_oem20", role: "evidence", video: "story_ep13_s4_oem20_motion.mp4",
      narration: "이 회사는 20년 동안 대기업에 밥솥을 납품하던 하청 공장이었어.",
      imageBrief: "공장 하역장에서 작업복을 입은 작업자 서너 명이 로고 없는 흰 납품 트럭에 이름 없는 밥솥 상자를 싣는다(작은 뒷모습). 낮의 햇살. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "wide", bg: "D",
      lock: "the workers stay small and seen from behind with no face shown; the truck and boxes keep no text or logos; nobody else enters.",
      motion: motion("the workers hand boxes up into the truck one after another, the dock and the truck stay completely still", "twenty years of delivering") },
    { scene: 5, key: "s5_stop_order", role: "evidence", video: "story_ep13_s5_stop_order_motion.mp4",
      narration: "그런데 외환위기가 닥치자 대기업들이 납품을 중단하겠다고 통보했지.",
      imageBrief: "공장 사무실. 작업복 차림의 공장장이 뒷모습으로 서서 손에 든 종이 한 장을 내려다본다(글자 없음, 얼굴 안 보임). 창밖에 멈춘 트럭 한 대. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만). 구도 규칙(가장 중요): 카메라를 낮게 잡아 인물의 머리는 화면 세로 45%보다 아래(45~85% 구간)에 오게 하고, 화면 위쪽 40%에는 사람·머리가 하나도 없이 벽·창문·천장·조명·하늘 같은 배경만 보이게 해.",
      shot: "medium", bg: "E",
      lock: "the people stay seen from behind with no face ever shown; the paper keeps no text; nobody else enters.",
      motion: motion("the manager lowers the paper slowly and his shoulders drop, the office and the window stay completely still", "delivery halted") },
    { scene: 6, key: "s6_half_orders", role: "evidence", video: "story_ep13_s6_half_orders_motion.mp4",
      narration: "주문은 절반으로 줄었고, 공장 라인이 멈추는 날이 많아졌어.",
      imageBrief: "불이 반쯤 꺼진 밥솥 조립 라인. 가운데 구간은 멈춰 있고 작업자 서너 명이 의자에 앉아 기다리는 작은 뒷모습. 글자 없음. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "wide", bg: "F",
      lock: "the workers stay small and seen from behind with no face shown; no text or logos; the line arrangement stays the same.",
      motion: motion("one worker shifts on his chair and dust drifts through a shaft of light, the line and the factory stay completely still", "half the orders") },
    { scene: 7, key: "s7_subcontract", role: "evidence", video: "story_ep13_s7_subcontract_motion.mp4",
      narration: "하청은 주문이 끊기면 같이 끊겨. 줄어든 주문만 바라보고 있을 수는 없었지.",
      imageBrief: "책상 위에 주문서 한 장만 남아 있고, 창밖으로 불이 꺼진 공장 건물이 보인다. 사람 없음. 해질녘 빛. 글자 없음. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "medium", bg: "G",
      lock: "no people appear; the sheet keeps no text or numbers; the window view stays the same.",
      motion: motion("the dusk light dims slowly across the lone sheet, the desk and the window stay completely still", "orders end together") },
    { scene: 8, key: "s8_hard_road", role: "evidence", video: "story_ep13_s8_hard_road_motion.mp4",
      narration: "그렇다고 자기 이름을 거는 길이 쉬운 건 아니었어. 팔리는 일까지 내 몫이니까.",
      imageBrief: "작업대 위에 이름도 글자도 없는 흰 밥솥 상자 하나가 놓여 있고, 한 사람이 뒷모습으로 두 팔을 짚고 서서 내려다본다(얼굴 안 보임). 낮은 조명. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만). 구도 규칙(가장 중요): 카메라를 낮게 잡아 인물의 머리는 화면 세로 45%보다 아래(45~85% 구간)에 오게 하고, 화면 위쪽 40%에는 사람·머리가 하나도 없이 벽·창문·천장·조명·하늘 같은 배경만 보이게 해.",
      shot: "medium", bg: "H",
      lock: "the people stay seen from behind with no face ever shown; the box keeps no text or logo; nobody else enters.",
      motion: motion("the person exhales and slowly straightens up, the workbench and the box stay completely still", "the harder road") },
    { scene: 9, key: "s9_launch_may", role: "evidence", video: "story_ep13_s9_launch_may_motion.mp4",
      narration: "그해 5월, 이 회사는 납품만 하던 길을 접고 자기 브랜드 쿠쿠를 내놨어.",
      imageBrief: "작업대 위에 막 완성된 밥솥 시제품 한 대(글자·로고 없는 둥근 문양 하나만)를 두 손이 감싸 쥐듯 올려놓는다. 손만 보임. 따뜻한 조명. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "close", bg: "I",
      lock: "no face or body appears — only the hands; the prototype keeps no text, logo or brand name; the workbench stays fixed.",
      motion: motion("the hands settle the prototype on the bench and slowly withdraw, the bench and the prototype stay completely still", "a name of its own") },
    { scene: 10, key: "s10_name_first", role: "evidence", video: "story_ep13_s10_name_first_motion.mp4",
      narration: "아무도 모르는 이름을 팔려면, 이름부터 알려야 했지.",
      imageBrief: "한적한 도심 거리의 큰 광고판 틀(안은 비어 있음)을 올려다보는 사람들의 작은 뒷모습. 글자·로고 없음. 낮의 햇살. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "wide", bg: "J",
      lock: "the people stay small and seen from behind with no face shown; the frame stays empty with no text or logos.",
      motion: motion("a few passersby slow down to look at the empty frame and walk on, the frame and the buildings stay completely still", "nobody knows the name") },
    { scene: 11, key: "s11_tv_ad", role: "evidence", video: "story_ep13_s11_tv_ad_motion.mp4",
      narration: "그해 11월에는 대대적으로 TV 광고를 시작했어.",
      imageBrief: "1990년대 한국 가정 거실. 소파에 앉은 가족 서너 명이 뒷모습으로 텔레비전을 본다(얼굴 안 보임). 화면에는 흰 밥솥 한 대가 나오고 글자·로고는 없다. 저녁 조명. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만). 구도 규칙(가장 중요): 카메라를 낮게 잡아 인물의 머리는 화면 세로 45%보다 아래(45~85% 구간)에 오게 하고, 화면 위쪽 40%에는 사람·머리가 하나도 없이 벽·창문·천장·조명·하늘 같은 배경만 보이게 해.",
      shot: "medium", bg: "K",
      lock: "the people stay seen from behind with no face ever shown; the television shows only a plain rice cooker with no text or logos; nobody else enters.",
      motion: motion("the family leans slightly forward as the rice cooker shines on the screen, the sofa and the room stay completely still", "on TV") },
    { scene: 12, key: "s12_bet", role: "core_question", video: "story_ep13_s12_bet_motion.mp4",
      narration: "주문이 줄어든 해에 이름을 걸고, 돈까지 쓴 거야. 이 베팅은 맞았을까?",
      imageBrief: "탁자 위 저울. 한쪽 접시에 글자 없는 주문서 묶음, 다른 쪽 접시에 두툼한 돈 봉투가 올라가 있고 저울이 살짝 흔들린다. 사람 없음. 따뜻한 조명. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "close", bg: "L",
      lock: "no people appear; the sheets and the envelope keep no text or logos; the table stays fixed.",
      motion: motion("the scale sways gently and settles level, the table and the frame stay completely still", "was the bet right") },
    { scene: 13, key: "s13_first_place", role: "evidence", video: "story_ep13_s13_first_place_motion.mp4",
      narration: "독자 브랜드를 선보인 지 1년 만에, 밥솥 시장점유율 1위에 올랐어.",
      imageBrief: "밝은 무대 위 세 단 시상대의 가장 높은 단 위에 글자·로고 없는 흰 밥솥이 놓여 있고, 낮은 두 단에는 다른 모양의 흰 밥솥이 놓여 있다. 사람 없음. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "medium", bg: "M",
      lock: "no people appear; the rice cookers keep no text or logos; the podium arrangement stays the same.",
      motion: motion("a soft spotlight brightens on the rice cooker at the top step, the podium and the stage stay completely still", "first place") },
    { scene: 14, key: "s14_share43", role: "evidence", video: "story_ep13_s14_share43_motion.mp4",
      narration: "2001년엔 압력밥솥 시장 점유율이 43%대까지 올랐고, 매출은 1천억 원대가 됐지.",
      imageBrief: "책상 위에 원형 점유율 도형 모형의 절반 가까이가 밝은 색으로 채워져 있고 옆에 금빛 블록들이 쌓여 있다. 글자·숫자 없음. 사람 없음. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "close", bg: "N",
      lock: "no people appear; the diagram keeps no text or numbers; the desk stays fixed.",
      motion: motion("a soft light slides over the filled part of the diagram and the stacked blocks, the desk and the diagram stay completely still", "growing share") },
    { scene: 15, key: "s15_share69", role: "evidence", video: "story_ep13_s15_share69_motion.mp4",
      narration: "2015년 3분기에는 밥솥 시장 점유율이 69%까지 올랐어.",
      imageBrief: "책상 위에 원형 점유율 도형 모형의 대부분이 밝은 색으로 채워져 있다. 글자·숫자 없음. 사람 없음. 환한 빛. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "close", bg: "O",
      lock: "no people appear; the diagram keeps no text or numbers; the desk stays fixed.",
      motion: motion("a gentle glow travels once around the filled ring and fades, the desk and the diagram stay completely still", "most of the market") },
  ]),
});

// ── 16번(부엉박사 마무리) — owl3dv5 스펙으로 따로 생성 ──
export const STORY_EP13_END_SPEC = Object.freeze({
  specVersion: "story_assembly_spec_v1",
  episode: 13,
  imageCharacter: "owl3dv5",
  imagePrefix: "story_ep13",
  sceneBackgrounds: Object.freeze({
    P: { label: "밥솥 공장 정문 앞마당(16번 부엉박사)", image: "밝은 오후 한국 가전 공장 출입구 앞마당. 부엉박사 뒤로 글자 없는 공장 건물 한 동과 열린 출입문, 바닥에 흰 상자를 실은 팔레트 두 개(상자에 글자 없음). 바닥은 매끈한 연한 회색 포장, 따뜻한 오후 햇빛.", videoStyle: "bright afternoon yard in front of a Korean appliance factory gate with a plain factory building, an open gate, and two pallets of plain white boxes on the ground, smooth light gray pavement", videoStatics: "the plain factory building, the open gate, the two pallets of plain white boxes, the smooth light gray pavement, and the warm afternoon light" },
  }),
  scenes: Object.freeze([
    {
      scene: 16, key: "s16_close", role: "save", video: "story_ep13_s16_close_motion.mp4",
      narration: "남의 이름으로 만들면 주문이 끊길 때 같이 끊겨. 자기 이름을 건 회사는 위기에도 길이 열렸지. 하청에서 브랜드가 된 이야기가 더 궁금하면 팔로우해 줘.",
      imageBrief: "부엉이가 정면을 보며 한쪽 날개를 가슴 앞에 가볍게 모아 차분히 정리해 주는 듯한 따뜻한 표정으로 시청자에게 말하는 포즈, 다른 날개는 자연스럽게 내리고 소품은 들지 않음. 구도 규칙(가장 중요): 부엉이는 화면 아래쪽 절반(세로 45~95%)에 서 있고 머리·얼굴·선글라스는 세로 45%보다 아래에 오게 하며, 화면 위쪽 40%에는 부엉이 없이 건물·하늘·조명 같은 배경만 보이게 해.",
      shot: "medium", bg: "P",
      lock: "the factory building and the pallets stay fixed; the sunglasses stay on top of the head; no props are held.",
      speaks: true,
      motion: motion("the character gestures gently with one wing at chest height while summarizing, then gives a small warm nod to the viewer; no props are held", "warm summary and invitation to follow"),
    },
  ]),
});

// ── 조립 스펙(run-owl-assemble-shorts-v2.mjs) — 제목은 ★임시안(Owner 확정 필요) ──
// 조립: node scripts/run-owl-assemble-shorts-v2.mjs --spec-module ./_story-ep13-assembly-spec.mjs --spec-export STORY_EP13_ASSEMBLE_SPEC --clip-dir C:/tmp/story-ep13-clips-named --audio-summary C:/tmp/money-shorts-os/story-ep13-tts/output-v1/tempo-1.2-gap0.25-pre/elevenlabs-scene-paced-tts-summary.audio-fixed.tempo1.2-gap0.25-pre.json --tts-script C:/tmp/money-shorts-os/story-ep13-tts/story-ep13-tts-script.json --out-dir C:/tmp/story-ep13-assembled
const STORY_RENDER = Object.freeze({
  width: 1080, height: 1920, fps: 24, videoCodec: "libx264", crf: 18, pixFmt: "yuv420p",
  audioCodec: "aac", audioBitrate: "192k", audioSampleRate: 48000, audioChannels: 1,
});

export const STORY_EP13_FULL_SPEC = Object.freeze({
  ...STORY_EP13_SEMI_SPEC,
  sceneBackgrounds: Object.freeze({ ...STORY_EP13_SEMI_SPEC.sceneBackgrounds, ...STORY_EP13_END_SPEC.sceneBackgrounds }),
  scenes: Object.freeze([...STORY_EP13_SEMI_SPEC.scenes, ...STORY_EP13_END_SPEC.scenes]),
});

export const STORY_EP13_ASSEMBLE_SPEC = Object.freeze({
  ...STORY_EP13_FULL_SPEC,
  headerTitle: Object.freeze(["남의 이름 대신","자기 이름을 건","쿠쿠"]),
  videoShiftDownPx: 230,
  videoShiftFadePx: 260,
  headerTopY: 345,
  headerScrimHeight: 780,
  captionFontSize: 102,
  captionY: 1385,
  captionPlanner: "scene_dp_v1",
  footerChannelBar: false,
  captionLayout: "v2",
  emphasisTerms: Object.freeze(["쿠쿠","하청","주문","마케팅","외환위기","점유율","1위"]),
  emphasisNumberPatterns: Object.freeze(["[0-9,.]+%","[0-9]+배","[0-9]+명","[0-9,.]+억","[0-9,.]+만"]),
  captionEmphasisPop: true,
  captionGapBridgeSec: 0.3,
  captionLastSceneNoMargin: true,
  captionSceneEndMarginSec: 0.1,
  captionLeadSec: 0.12,
  hookType: "story",
  render: STORY_RENDER,
  scenes: Object.freeze(STORY_EP13_FULL_SPEC.scenes.map((s) => Object.freeze({ ...s, overlays: [] }))),
});
