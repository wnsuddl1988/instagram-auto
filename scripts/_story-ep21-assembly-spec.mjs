/**
 * 스토리형 21편 — 설향 딸기 — 일본 품종이 86%이던 밭을 바꾼 국산 품종 이야기 재연 장면 스펙 (2026-10-11, 기본 베이스 구조).
 *
 * 기준: `_ai/story-script-rules.md` + 확정 대본 `C:/tmp/story-ep21-seolhyang/scenes-v1.json`. 설계 `C:/tmp/story-ep21-seolhyang/story-design.json`.
 * TTS `C:/tmp/money-shorts-os/story-ep21-tts/output-v1/tempo-1.2-gap0.25-pre/…tempo1.2-gap0.25-pre.json`.
 * 화풍: 반사실 3D(storysemi). 1~16번 재연 장면 + 17번 부엉박사 진행자 컷.
 * 이미지 규칙(스토리형): 화면에 글자·숫자·로고·브랜드·회사 이름을 넣지 않는다(숫자는 자막이 맡는다). 실존 인물을 닮게 그리지 않는다
 * (얼굴이 크게 보이는 구도 금지, 뒷모습·멀리 있는 작은 모습·손과 소품). 소품은 두 손으로 감싸 쥐거나 탁자·바닥에 거치. 빈 면 금지.
 * 저작권 캐릭터·로고(미키·디즈니 성·마리오 등)는 그리지 않는다.
 *
 * 이미지 생성: ① 1~16번 `ALLOW_CHATGPT_IMAGE=1 node scripts/probe-character-consistency-chatgpt-v1.mjs --character storysemi --scene-spec ./_story-ep21-assembly-spec.mjs --scene-spec-export STORY_EP21_SEMI_SPEC --out-dir C:/tmp/story-ep21-images`
 *            ② 17번(부엉박사) `… --character owl3dv5 --scene-spec ./_story-ep21-assembly-spec.mjs --scene-spec-export STORY_EP21_END_SPEC --out-dir C:/tmp/story-ep21-images`
 */

const NO_TEXT = "화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).";
const motion = (action, mood) => ({ type: "scene", action, mood });

export const STORY_EP21_SEMI_SPEC = Object.freeze({
  specVersion: "story_assembly_spec_v1",
  scriptStructureVersion: "story_format_structure_v3",
  formatProfile: "story_v1",
  episode: 21,
  displayEpisode: 21,
  sourceCandidate: "story-ep21-seolhyang-2005",
  title: "설향 딸기 — 일본 품종이 86%이던 밭을 바꾼 국산 품종 이야기",
  channelName: "경제번역소",
  characterDisplayName: "부엉박사",
  imageCharacter: "storysemi",
  imagePrefix: "story_ep21",
  storyStyleOnlyIdentity:
    "한국의 딸기 비닐하우스 농가와 논산의 딸기 시험장 온실을 배경으로 한 재연 장면 시리즈의 한 장면이야. 실존 인물(연구자·농부)을 닮게 그리지 않고, 실제 회사·기관 로고와 상표를 흉내 내지 않아(상자와 이름표는 글자 없는 색 덩어리). 화풍: 고품질 반사실 3D CG 렌더링(시네마틱 게임 컷신·CG 다큐 재연 화면 같은 느낌) — 사람의 얼굴·눈·머리·몸 비율은 실제 사람처럼 사실적으로, 피부·옷·재질은 매끈한 CG 질감, 영화 같은 자연광과 부드러운 그림자, 차분하고 진지한 색감. 큰 눈·둥근 얼굴·과장된 만화 비율(픽사풍) 금지, 실제 사진처럼 보이는 실사도 금지. 장면 설명에 나오는 인물 외에는 아무도 그리지 마. 세로 9:16.",
  storySameStyleRule:
    "앞 장면들과 똑같은 반사실 3D CG 화풍(사실적인 사람 비율, 매끈한 CG 질감, 같은 시네마틱 조명·색감)을 유지해. 장면 설명에 없는 인물·글자·숫자·로고는 넣지 마. 얼굴을 크게 보이게 하지 말고 장면 설명대로 뒷모습·작은 모습·손과 소품 위주로 그려. 픽사풍 큰 눈·만화 비율 금지, 실사 사진 금지. 세로 9:16.",

  sceneBackgrounds: Object.freeze({
    A: { label: "딸기밭 끝에 놓인 큰 청구서 봉투(1번)", image: "붉은 딸기가 가득 열린 비닐하우스 고랑 끝 흙길에 두툼한 서류 봉투 하나가 놓여 있다. 사람 없음. 글자·숫자 없음. 맑은 아침 햇살.", videoStyle: "a strawberry greenhouse with rows of red strawberries and one thick envelope on the dirt path at the end, no people, no text, clear morning sun", videoStatics: "the greenhouse rows, the envelope, and the sunlight" },
    B: { label: "하우스 안 딸기밭을 바라보는 농부의 뒷모습(2번)", image: "비닐하우스 안 고랑 사이에 농부 한 명이 뒷모습으로 서서 딸기밭을 바라본다(얼굴 안 보임). 글자 없음. 부드러운 빛.", videoStyle: "a farmer seen from behind standing between rows inside a strawberry greenhouse looking over the plants, no text, soft light", videoStatics: "the greenhouse, the rows, and the soft light" },
    C: { label: "서류 위 도장 옆 딸기 한 송이(3번)", image: "책상 위 두툼한 서류 위에 도장과 딸기 한 송이가 나란히 놓여 있다. 사람 없음. 글자·숫자 없음. 환한 조명.", videoStyle: "close view of a stamp and a single strawberry side by side on a thick stack of papers on a desk, no people, no text, bright lighting", videoStatics: "the desk, the papers, the stamp, the strawberry, and the lighting" },
    D: { label: "고랑마다 줄지어 선 모종과 이름표(4번)", image: "하우스 고랑마다 딸기 모종이 줄지어 있고 모종 옆에 글자 없는 색 말뚝 이름표가 꽂혀 있다. 사람 없음. 환한 빛.", videoStyle: "a greenhouse with strawberry seedlings in rows and plain colored stake labels without text beside each, no people, bright light", videoStatics: "the rows, the seedlings, the stake labels, and the light" },
    E: { label: "딸기 바구니와 서류가 놓인 협상 테이블(5번)", image: "긴 협상 테이블 한쪽에 딸기 바구니와 서류 한 묶음이 놓여 있고 맞은편에 의자 두 개가 비어 있다. 사람 없음. 글자·숫자 없음. 낮은 조명.", videoStyle: "a long negotiation table with a basket of strawberries and a bundle of papers on one side and two empty chairs opposite, no people, no text, low lighting", videoStatics: "the table, the basket, the papers, the chairs, and the lighting" },
    F: { label: "시험장 온실의 모종 트레이와 옮겨 가는 빛(6번)", image: "시험장 온실 선반에 모종 트레이가 줄지어 있고 창으로 들어온 빛이 선반 위를 천천히 옮겨 간다. 사람 없음. 글자 없음.", videoStyle: "a research greenhouse shelf lined with seedling trays and sunlight shifting slowly across them, no people, no text", videoStatics: "the shelves, the trays, and the window frame" },
    G: { label: "닫힌 문 앞의 모래시계(7번)", image: "닫힌 문 앞 바닥에 모래시계 하나가 놓여 있고 모래가 거의 반쯤 흘러내렸다. 사람 없음. 글자 없음. 낮은 조명.", videoStyle: "a single hourglass on the floor in front of a closed door with the sand half run out, no people, no text, low lighting", videoStatics: "the door, the hourglass, and the lighting" },
    H: { label: "온실 선반의 새 품종 딸기 트레이(8번)", image: "시험장 온실 선반에 새 품종 딸기가 열린 트레이 하나가 놓여 있고 붉은 열매가 반짝인다. 사람 없음. 글자·숫자 없음. 밝은 빛.", videoStyle: "close view of one tray of a new strawberry variety with glossy red fruit on a research greenhouse shelf, no people, no text, bright light", videoStatics: "the shelf, the tray, and the lighting" },
    I: { label: "딸기를 들고 고개를 젓는 농부들의 뒷모습(9번)", image: "하우스 앞에서 농부 서넛이 뒷모습으로 딸기를 손에 들고 서로 고개를 젓는다(얼굴 안 보임). 글자 없음. 낮의 햇살.", videoStyle: "a few farmers seen from behind in front of a greenhouse holding strawberries and shaking their heads, no text, daylight", videoStatics: "the greenhouse, the strawberries, and the daylight" },
    J: { label: "비어 있는 고랑과 놓인 새 모종 상자(10번)", image: "텅 빈 하우스 고랑 한쪽에 새 모종 상자가 놓여 있고 심은 흔적이 없다. 사람 없음. 글자 없음. 차분한 빛.", videoStyle: "an empty greenhouse bed with one box of new seedlings set at the side and nothing planted, no people, no text, calm light", videoStatics: "the empty bed, the seedling box, and the light" },
    K: { label: "수많은 하우스 가운데 한 곳만 불이 켜진 밤(11번)", image: "밤의 하우스 단지에서 수많은 하우스가 어두운 가운데 한 곳만 따뜻한 불이 켜져 있다. 사람 없음. 글자 없음.", videoStyle: "a night view of a greenhouse complex with many dark greenhouses and only one glowing warmly, no people, no text", videoStatics: "the greenhouse complex and the night sky" },
    L: { label: "수확 상자에 가득 담긴 설향 딸기(12번)", image: "수확 상자에 붉은 딸기가 가득 담겨 있고 장갑 낀 손 하나가 상자를 받쳐 든다. 손만 보임. 글자·숫자 없음. 따뜻한 빛.", videoStyle: "close view of a harvest crate full of red strawberries held up by one gloved hand, hand only, no text or numbers, warm light", videoStatics: "the crate, the strawberries, and the warm light" },
    M: { label: "하우스 사이 길에서 이웃 밭을 둘러보는 농부들(13번)", image: "하우스 사이 길을 농부들이 뒷모습으로 걸으며 이웃 밭을 둘러본다(얼굴 안 보임). 글자 없음. 맑은 아침.", videoStyle: "farmers seen from behind walking along the path between greenhouses looking over neighboring plots, no text, clear morning", videoStatics: "the greenhouses, the path, and the morning light" },
    N: { label: "설향이 가득한 드넓은 하우스 단지 전경(14번)", image: "맑은 낮의 드넓은 딸기 하우스 단지 전경. 하우스마다 붉은 딸기가 가득하다. 사람 없음. 글자 없음. 밝은 햇살.", videoStyle: "a wide daytime view of a large strawberry greenhouse complex with red strawberries in every greenhouse, no people, no text, bright sun", videoStatics: "the greenhouse complex and the sky" },
    O: { label: "치워진 봉투와 딸기를 담는 손(15번)", image: "깨끗해진 책상 위에서 한 손이 딸기를 바구니에 담는다. 두툼했던 봉투는 보이지 않는다. 손만 보임. 글자 없음. 밝은 조명.", videoStyle: "close view of one hand placing strawberries into a basket on a clear desk with no envelope in sight, hand only, no text, bright lighting", videoStatics: "the desk, the basket, and the lighting" },
    Q: { label: "편한 의자 앞 탁자 위 닫힌 봉투(16번)", image: "거실의 편안한 의자에 한 사람이 뒷모습으로 앉아 있고 앞 탁자에 딸기 접시와 닫힌 봉투 하나가 놓여 있다(얼굴 안 보임). 글자 없음. 따뜻한 저녁빛.", videoStyle: "a person seen from behind sitting in a comfortable chair with a plate of strawberries and one closed envelope on the table in front, no text, warm evening light", videoStatics: "the chair, the table, the plate, the envelope, and the light" },
  }),

  scenes: Object.freeze([
    { scene: 1, key: "s1_hook", role: "hook", video: "story_ep21_s1_hook_motion.mp4",
      narration: "딸기밭의 86%가 일본 품종이던 한국에, 일본이 해마다 값을 내라는 요구를 들고 왔어.",
      imageBrief: "붉은 딸기가 가득 열린 비닐하우스 고랑 끝 흙길에 두툼한 서류 봉투 하나가 놓여 있다. 사람 없음. 글자·숫자 없음. 맑은 아침 햇살. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "wide", bg: "A",
      lock: "no people appear; the envelope keeps no text or logos; the rows stay fixed.",
      motion: motion("a soft breeze moves the strawberry leaves lightly, the envelope and the greenhouse stay completely still", "an unexpected demand") },
    { scene: 2, key: "s2_puzzle", role: "core_question", video: "story_ep21_s2_puzzle_motion.mp4",
      narration: "남의 품종이 가득한 밭을, 한국은 무엇으로 바꿀 수 있었을까?",
      imageBrief: "비닐하우스 안 고랑 사이에 농부 한 명이 뒷모습으로 서서 딸기밭을 바라본다(얼굴 안 보임). 글자 없음. 부드러운 빛. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만). 구도 규칙(가장 중요): 카메라를 낮게 잡아 인물의 머리는 화면 세로 45%보다 아래(45~85% 구간)에 오게 하고, 화면 위쪽 40%에는 사람·머리가 하나도 없이 벽·창문·천장·조명·하늘 같은 배경만 보이게 해.",
      shot: "medium", bg: "B",
      lock: "the people stay seen from behind with no face ever shown; nothing in the greenhouse carries text; nobody else enters.",
      motion: motion("the farmer slowly turns his head to look along the rows and stops, the greenhouse and the plants stay completely still", "what can replace all this") },
    { scene: 3, key: "s3_treaty", role: "evidence", video: "story_ep21_s3_treaty_motion.mp4",
      narration: "한국이 품종 보호 협약에 들어간 뒤로, 남이 만든 품종을 심으면 해마다 값을 내야 했어.",
      imageBrief: "책상 위 두툼한 서류 위에 도장과 딸기 한 송이가 나란히 놓여 있다. 사람 없음. 글자·숫자 없음. 환한 조명. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "close", bg: "C",
      lock: "no people appear; the papers keep no text or numbers; the desk stays fixed.",
      motion: motion("a soft light moves slowly across the stamp and the strawberry, the desk and the papers stay completely still", "a new rule") },
    { scene: 4, key: "s4_varieties", role: "evidence", video: "story_ep21_s4_varieties_motion.mp4",
      narration: "농가가 심던 건 육보와 장희, 일본에서 만든 품종들이었지.",
      imageBrief: "하우스 고랑마다 딸기 모종이 줄지어 있고 모종 옆에 글자 없는 색 말뚝 이름표가 꽂혀 있다. 사람 없음. 환한 빛. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "medium", bg: "D",
      lock: "no people appear; the labels keep no text; the rows stay fixed.",
      motion: motion("a gentle breeze sways the seedling leaves, the rows and the stakes stay completely still", "borrowed varieties") },
    { scene: 5, key: "s5_talks", role: "evidence", video: "story_ep21_s5_talks_motion.mp4",
      narration: "2006년 협상에서 일본은 이 품종들의 값을 매년 내라고 했어. 농촌진흥청은 해마다 30억 원 안팎으로 봤지.",
      imageBrief: "긴 협상 테이블 한쪽에 딸기 바구니와 서류 한 묶음이 놓여 있고 맞은편에 의자 두 개가 비어 있다. 사람 없음. 글자·숫자 없음. 낮은 조명. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "medium", bg: "E",
      lock: "no people appear; the papers keep no text or numbers; the chairs stay empty.",
      motion: motion("a soft light slides slowly across the basket and the papers, the table and the chairs stay completely still", "a demand on the table") },
    { scene: 6, key: "s6_years", role: "evidence", video: "story_ep21_s6_years_motion.mp4",
      narration: "값을 안 내려면 우리 품종이 있어야 해. 그런데 품종 하나를 만드는 데는 짧아도 7년이 걸렸어.",
      imageBrief: "시험장 온실 선반에 모종 트레이가 줄지어 있고 창으로 들어온 빛이 선반 위를 천천히 옮겨 간다. 사람 없음. 글자 없음. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "medium", bg: "F",
      lock: "no people appear; the trays keep no text or labels; the shelves stay fixed.",
      motion: motion("the window light shifts slowly across the trays, the shelves and the trays stay completely still", "years needed") },
    { scene: 7, key: "s7_timeq", role: "core_question", video: "story_ep21_s7_timeq_motion.mp4",
      narration: "협상은 이미 시작됐는데, 그 시간을 어디서 구할 수 있었을까?",
      imageBrief: "닫힌 문 앞 바닥에 모래시계 하나가 놓여 있고 모래가 거의 반쯤 흘러내렸다. 사람 없음. 글자 없음. 낮은 조명. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "close", bg: "G",
      lock: "no people appear; the door keeps no text; the hourglass stays fixed.",
      motion: motion("the sand falls slowly through the hourglass, the door and the floor stay completely still", "no time to spare") },
    { scene: 8, key: "s8_seolhyang", role: "evidence", video: "story_ep21_s8_seolhyang_motion.mp4",
      narration: "답은 한 해 전에 있었어. 2005년, 논산의 딸기시험장이 새 품종 설향을 내놓은 거야.",
      imageBrief: "시험장 온실 선반에 새 품종 딸기가 열린 트레이 하나가 놓여 있고 붉은 열매가 반짝인다. 사람 없음. 글자·숫자 없음. 밝은 빛. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "close", bg: "H",
      lock: "no people appear; the tray keeps no text or labels; the shelf stays fixed.",
      motion: motion("a soft light glints on the red strawberries, the shelf and the tray stay completely still", "the new variety") },
    { scene: 9, key: "s9_refused", role: "evidence", video: "story_ep21_s9_refused_motion.mp4",
      narration: "그런데 농가들은 외면했어. '이것도 딸기냐, 너무 무르다'는 말이 많았지.",
      imageBrief: "하우스 앞에서 농부 서넛이 뒷모습으로 딸기를 손에 들고 서로 고개를 젓는다(얼굴 안 보임). 글자 없음. 낮의 햇살. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만). 구도 규칙(가장 중요): 카메라를 낮게 잡아 인물의 머리는 화면 세로 45%보다 아래(45~85% 구간)에 오게 하고, 화면 위쪽 40%에는 사람·머리가 하나도 없이 벽·창문·천장·조명·하늘 같은 배경만 보이게 해.",
      shot: "medium", bg: "I",
      lock: "the people stay seen from behind with no face ever shown; nothing carries text; nobody else enters.",
      motion: motion("the farmers shake their heads and set the strawberries down, the greenhouse behind them stays completely still", "turned away") },
    { scene: 10, key: "s10_plant", role: "evidence", video: "story_ep21_s10_plant_motion.mp4",
      narration: "새 품종은 만들어도 농가가 심어야 밭이 바뀌어.",
      imageBrief: "텅 빈 하우스 고랑 한쪽에 새 모종 상자가 놓여 있고 심은 흔적이 없다. 사람 없음. 글자 없음. 차분한 빛. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "wide", bg: "J",
      lock: "no people appear; the box keeps no text or labels; the bed stays fixed.",
      motion: motion("a soft light slowly crosses the empty bed and the box, everything stays completely still", "nobody planting") },
    { scene: 11, key: "s11_oneFarm", role: "evidence", video: "story_ep21_s11_oneFarm_motion.mp4",
      narration: "수많은 농가 가운데 설향을 제대로 키운 곳은 단 한 곳이었어.",
      imageBrief: "밤의 하우스 단지에서 수많은 하우스가 어두운 가운데 한 곳만 따뜻한 불이 켜져 있다. 사람 없음. 글자 없음. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "wide", bg: "K",
      lock: "no people appear; nothing carries text; the greenhouses stay fixed.",
      motion: motion("the warm glow of the one greenhouse brightens gently, the other greenhouses stay completely still", "only one farm") },
    { scene: 12, key: "s12_proven", role: "evidence", video: "story_ep21_s12_proven_motion.mp4",
      narration: "그 농가가 키워 보니, 병에 강하고 수확량도 많았지.",
      imageBrief: "수확 상자에 붉은 딸기가 가득 담겨 있고 장갑 낀 손 하나가 상자를 받쳐 든다. 손만 보임. 글자·숫자 없음. 따뜻한 빛. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "close", bg: "L",
      lock: "no face or body appears — only the hand; the crate keeps no text or labels; the crate stays fixed.",
      motion: motion("the gloved hand gently steadies the crate, the strawberries and the crate stay completely still", "it worked") },
    { scene: 13, key: "s13_spread", role: "core_question", video: "story_ep21_s13_spread_motion.mp4",
      narration: "그 뒤 농가들은 어디로 움직였을까?",
      imageBrief: "하우스 사이 길을 농부들이 뒷모습으로 걸으며 이웃 밭을 둘러본다(얼굴 안 보임). 글자 없음. 맑은 아침. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만). 구도 규칙(가장 중요): 카메라를 낮게 잡아 인물의 머리는 화면 세로 45%보다 아래(45~85% 구간)에 오게 하고, 화면 위쪽 40%에는 사람·머리가 하나도 없이 벽·창문·천장·조명·하늘 같은 배경만 보이게 해.",
      shot: "wide", bg: "M",
      lock: "the people stay seen from behind with no face ever shown; nothing carries text; nobody else enters.",
      motion: motion("the farmers walk slowly along the path and pause to look in, the greenhouses stay completely still", "what will they do") },
    { scene: 14, key: "s14_result", role: "evidence", video: "story_ep21_s14_result_motion.mp4",
      narration: "2015년, 설향은 한국 딸기 재배면적의 81%를 차지했어.",
      imageBrief: "맑은 낮의 드넓은 딸기 하우스 단지 전경. 하우스마다 붉은 딸기가 가득하다. 사람 없음. 글자 없음. 밝은 햇살. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "wide", bg: "N",
      lock: "no people appear; nothing carries text; the greenhouses stay fixed.",
      motion: motion("a soft breeze ripples across the greenhouse plastic, the complex stays completely still", "a field transformed") },
    { scene: 15, key: "s15_relief", role: "evidence", video: "story_ep21_s15_relief_motion.mp4",
      narration: "해마다 물어야 했을 값의 부담도 크게 덜었지.",
      imageBrief: "깨끗해진 책상 위에서 한 손이 딸기를 바구니에 담는다. 두툼했던 봉투는 보이지 않는다. 손만 보임. 글자 없음. 밝은 조명. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "close", bg: "O",
      lock: "no face or body appears — only the hand; the basket keeps no text; the desk stays fixed.",
      motion: motion("the hand places a last strawberry and withdraws, the desk and the basket stay completely still", "a lighter load") },
    { scene: 16, key: "s16_lesson", role: "evidence", video: "story_ep21_s16_lesson_motion.mp4",
      narration: "남의 것에 기대 사는 건 편하지만, 그 값은 언젠가 청구돼.",
      imageBrief: "거실의 편안한 의자에 한 사람이 뒷모습으로 앉아 있고 앞 탁자에 딸기 접시와 닫힌 봉투 하나가 놓여 있다(얼굴 안 보임). 글자 없음. 따뜻한 저녁빛. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만). 구도 규칙(가장 중요): 카메라를 낮게 잡아 인물의 머리는 화면 세로 45%보다 아래(45~85% 구간)에 오게 하고, 화면 위쪽 40%에는 사람·머리가 하나도 없이 벽·창문·천장·조명·하늘 같은 배경만 보이게 해.",
      shot: "medium", bg: "Q",
      lock: "the people stay seen from behind with no face ever shown; the envelope keeps no text; nobody else enters.",
      motion: motion("the person leans back slowly and the warm light settles, the table and the envelope stay completely still", "comfort with a bill waiting") },
  ]),
});

// ── 17번(부엉박사 마무리) — owl3dv5 스펙으로 따로 생성 ──
export const STORY_EP21_END_SPEC = Object.freeze({
  specVersion: "story_assembly_spec_v1",
  episode: 21,
  imageCharacter: "owl3dv5",
  imagePrefix: "story_ep21",
  sceneBackgrounds: Object.freeze({
    P: { label: "딸기 하우스 앞 광장(17번 부엉박사)", image: "밝은 오후 한국 시골 딸기 하우스 앞 마당. 부엉박사 뒤로 글자 없는 하우스 한 동과 딸기 모종이 놓인 나무 상자 두 개. 바닥은 매끈한 연한 회색 포장, 따뜻한 오후 빛.", videoStyle: "bright afternoon in front of a Korean strawberry greenhouse with a plain greenhouse and two wooden seedling crates, smooth light gray pavement", videoStatics: "the greenhouse, the two crates, the smooth light gray pavement, and the warm afternoon light" },
  }),
  scenes: Object.freeze([
    {
      scene: 17, key: "s17_close", role: "save", video: "story_ep21_s17_close_motion.mp4",
      narration: "일하는 우리도 내 기술 하나를 미리 쌓아 두면 협상할 때 든든해. 딸기 이야기가 더 궁금하면 팔로우해 줘.",
      imageBrief: "부엉이가 정면을 보며 한쪽 날개를 가슴 앞에 가볍게 모아 차분히 정리해 주는 듯한 따뜻한 표정으로 시청자에게 말하는 포즈, 다른 날개는 자연스럽게 내리고 소품은 들지 않음. 구도 규칙(가장 중요): 부엉이는 화면 아래쪽 절반(세로 45~95%)에 서 있고 머리·얼굴·선글라스는 세로 45%보다 아래에 오게 하며, 화면 위쪽 40%에는 부엉이 없이 건물·하늘·조명 같은 배경만 보이게 해.",
      shot: "medium", bg: "P",
      lock: "the greenhouse and the crates stay fixed; the sunglasses stay on top of the head; no props are held.",
      speaks: true,
      motion: motion("the character gestures gently with one wing at chest height while summarizing, then gives a small warm nod to the viewer; no props are held", "warm summary and invitation to follow"),
    },
  ]),
});

// ── 조립 스펙(run-owl-assemble-shorts-v2.mjs) — 제목은 ★임시안(Owner 확정 필요) ──
// 조립: node scripts/run-owl-assemble-shorts-v2.mjs --spec-module ./_story-ep21-assembly-spec.mjs --spec-export STORY_EP21_ASSEMBLE_SPEC --clip-dir C:/tmp/story-ep21-clips-named --audio-summary C:/tmp/money-shorts-os/story-ep21-tts/output-v1/tempo-1.2-gap0.25-pre/elevenlabs-scene-paced-tts-summary.audio-fixed.tempo1.2-gap0.25-pre.json --tts-script C:/tmp/money-shorts-os/story-ep21-tts/story-ep21-tts-script.json --out-dir C:/tmp/story-ep21-assembled
const STORY_RENDER = Object.freeze({
  width: 1080, height: 1920, fps: 24, videoCodec: "libx264", crf: 18, pixFmt: "yuv420p",
  audioCodec: "aac", audioBitrate: "192k", audioSampleRate: 48000, audioChannels: 1,
});

export const STORY_EP21_FULL_SPEC = Object.freeze({
  ...STORY_EP21_SEMI_SPEC,
  sceneBackgrounds: Object.freeze({ ...STORY_EP21_SEMI_SPEC.sceneBackgrounds, ...STORY_EP21_END_SPEC.sceneBackgrounds }),
  scenes: Object.freeze([...STORY_EP21_SEMI_SPEC.scenes, ...STORY_EP21_END_SPEC.scenes]),
});

export const STORY_EP21_ASSEMBLE_SPEC = Object.freeze({
  ...STORY_EP21_FULL_SPEC,
  headerTitle: Object.freeze(["일본 품종 86%","국산으로 바꾼","설향 딸기"]),
  videoShiftDownPx: 230,
  videoShiftFadePx: 260,
  headerTopY: 345,
  headerScrimHeight: 780,
  captionFontSize: 102,
  captionY: 1385,
  captionPlanner: "scene_dp_v1",
  footerChannelBar: false,
  captionLayout: "v2",
  emphasisTerms: Object.freeze(["86%","설향","7년","81%","30억"]),
  emphasisNumberPatterns: Object.freeze(["[0-9,.]+%","[0-9]+배","[0-9]+명","[0-9,.]+억","[0-9,.]+만"]),
  captionEmphasisPop: true,
  captionGapBridgeSec: 0.3,
  captionLastSceneNoMargin: true,
  captionSceneEndMarginSec: 0.1,
  captionLeadSec: 0.12,
  hookType: "story",
  render: STORY_RENDER,
  scenes: Object.freeze(STORY_EP21_FULL_SPEC.scenes.map((s) => Object.freeze({ ...s, overlays: [] }))),
});
