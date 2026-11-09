/**
 * 스토리형 25편 — 애니팡 — 이름도 낯선 회사가 카카오톡 친구망에 올려 국민 게임이 된 이야기 재연 장면 스펙 (2026-10-11, 기본 베이스 구조).
 *
 * 기준: `_ai/story-script-rules.md` + 확정 대본 `C:/tmp/story-ep25-anipang/scenes-v1.json`. 설계 `C:/tmp/story-ep25-anipang/story-design.json`.
 * TTS `C:/tmp/money-shorts-os/story-ep25-tts/output-v1/tempo-1.2-gap0.25-pre/…tempo1.2-gap0.25-pre.json`.
 * 화풍: 반사실 3D(storysemi). 1~15번 재연 장면 + 16번 부엉박사 진행자 컷.
 * 이미지 규칙(스토리형): 화면에 글자·숫자·로고·브랜드·회사 이름을 넣지 않는다(숫자는 자막이 맡는다). 실존 인물을 닮게 그리지 않는다
 * (얼굴이 크게 보이는 구도 금지, 뒷모습·멀리 있는 작은 모습·손과 소품). 소품은 두 손으로 감싸 쥐거나 탁자·바닥에 거치. 빈 면 금지.
 * 저작권 캐릭터·로고(미키·디즈니 성·마리오 등)는 그리지 않는다.
 *
 * 이미지 생성: ① 1~15번 `ALLOW_CHATGPT_IMAGE=1 node scripts/probe-character-consistency-chatgpt-v1.mjs --character storysemi --scene-spec ./_story-ep25-assembly-spec.mjs --scene-spec-export STORY_EP25_SEMI_SPEC --out-dir C:/tmp/story-ep25-images`
 *            ② 16번(부엉박사) `… --character owl3dv5 --scene-spec ./_story-ep25-assembly-spec.mjs --scene-spec-export STORY_EP25_END_SPEC --out-dir C:/tmp/story-ep25-images`
 */

const NO_TEXT = "화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).";
const motion = (action, mood) => ({ type: "scene", action, mood });

export const STORY_EP25_SEMI_SPEC = Object.freeze({
  specVersion: "story_assembly_spec_v1",
  scriptStructureVersion: "story_format_structure_v3",
  formatProfile: "story_v1",
  episode: 25,
  displayEpisode: 25,
  sourceCandidate: "story-ep25-anipang-kakao-2012",
  title: "애니팡 — 이름도 낯선 회사가 카카오톡 친구망에 올려 국민 게임이 된 이야기",
  channelName: "경제번역소",
  characterDisplayName: "부엉박사",
  imageCharacter: "storysemi",
  imagePrefix: "story_ep25",
  storyStyleOnlyIdentity:
    "2012년 한국의 지하철, 작은 게임 회사 사무실, 카페를 배경으로 한 재연 장면 시리즈의 한 장면이야. 실존 인물(대표·직원)을 닮게 그리지 않고, 실제 게임 캐릭터·메신저 로고와 상표를 흉내 내지 않아(스마트폰 화면은 글자 없는 색 덩어리와 하트 모양만). 화풍: 고품질 반사실 3D CG 렌더링(시네마틱 게임 컷신·CG 다큐 재연 화면 같은 느낌) — 사람의 얼굴·눈·머리·몸 비율은 실제 사람처럼 사실적으로, 피부·옷·재질은 매끈한 CG 질감, 영화 같은 자연광과 부드러운 그림자, 차분하고 진지한 색감. 큰 눈·둥근 얼굴·과장된 만화 비율(픽사풍) 금지, 실제 사진처럼 보이는 실사도 금지. 장면 설명에 나오는 인물 외에는 아무도 그리지 마. 세로 9:16.",
  storySameStyleRule:
    "앞 장면들과 똑같은 반사실 3D CG 화풍(사실적인 사람 비율, 매끈한 CG 질감, 같은 시네마틱 조명·색감)을 유지해. 장면 설명에 없는 인물·글자·숫자·로고는 넣지 마. 얼굴을 크게 보이게 하지 말고 장면 설명대로 뒷모습·작은 모습·손과 소품 위주로 그려. 픽사풍 큰 눈·만화 비율 금지, 실사 사진 금지. 세로 9:16.",

  sceneBackgrounds: Object.freeze({
    A: { label: "지하철에서 스마트폰 퍼즐 게임을 하는 사람들(1번)", image: "2012년 지하철 객차 안에서 사람들이 뒷모습으로 스마트폰을 내려다보며 퍼즐 게임을 하고 있다(얼굴 안 보임). 화면은 색 덩어리만. 글자·로고 없음.", videoStyle: "people seen from behind in a 2012 subway car looking down at smartphones playing a puzzle game, screens showing only colored blocks, no text or logos", videoStatics: "the subway car, the seats, and the lighting" },
    B: { label: "작은 사무실에 모여 모니터를 보는 개발자들(2번)", image: "작은 사무실에서 개발자 서넛이 뒷모습으로 모니터 앞에 모여 있다(얼굴 안 보임). 모니터는 색 덩어리만. 글자·로고 없음. 따뜻한 조명.", videoStyle: "a few developers seen from behind gathered in front of monitors in a small office, monitors showing only colored blocks, no text or logos, warm lighting", videoStatics: "the office, the monitors, and the lighting" },
    C: { label: "작은 사무실 창밖의 큰 도시 풍경(3번)", image: "작은 사무실 창 너머로 높은 건물이 가득한 큰 도시 풍경이 보인다. 사무실 안에는 책상과 모니터만 있고 사람 없음. 글자 없음.", videoStyle: "a small office window looking out over a large city of tall buildings, only desks and monitors inside, no people, no text", videoStatics: "the window, the desks, the city view, and the light" },
    D: { label: "데스크톱에서 모바일로 옮겨 가는 화살표 모형(4번)", image: "책상 위 데스크톱 모니터 모형에서 스마트폰 모형으로 향하는 큰 화살표 모양 소품이 놓여 있다. 사람 없음. 글자·숫자 없음.", videoStyle: "close view of a desk with a desktop monitor model and a smartphone model joined by a large arrow-shaped prop, no people, no text or numerals", videoStatics: "the desk, the two models, the arrow prop, and the lighting" },
    E: { label: "스마트폰 연락처가 말풍선으로 이어지는 모형(5번)", image: "스마트폰 모형의 연락처 목록 칸들이 글자 없는 말풍선 모양으로 서로 이어져 있다. 사람 없음. 글자·로고 없음. 밝은 조명.", videoStyle: "close view of a smartphone model whose contact list rows connect to each other as plain speech-bubble shapes without text, no people, no text or logos, bright lighting", videoStatics: "the phone model and the lighting" },
    F: { label: "카페에서 마주 앉아 노트북을 보는 두 사람(6번)", image: "카페 테이블에 두 사람이 뒷모습으로 마주 앉아 노트북 한 대를 함께 들여다본다(얼굴 안 보임). 화면은 색 덩어리만. 글자 없음.", videoStyle: "two people seen from behind sitting opposite at a cafe table looking together at one laptop showing only colored blocks, no text", videoStatics: "the cafe table, the laptop, and the lighting" },
    G: { label: "닫힌 회의실 문 앞의 서류 봉투(7번)", image: "닫힌 회의실 문 앞 바닥에 서류 봉투 하나가 놓여 있다. 사람 없음. 글자 없음. 낮은 조명.", videoStyle: "close view of one document envelope on the floor in front of a closed meeting-room door, no people, no text, low lighting", videoStatics: "the door, the envelope, and the lighting" },
    H: { label: "복잡한 컨트롤러 옆 단순한 퍼즐 블록(8번)", image: "탁자 위에 단추 많은 복잡한 게임 컨트롤러 모형과 그 옆에 색깔 퍼즐 블록 몇 개가 단순하게 놓여 있다. 사람 없음. 글자 없음.", videoStyle: "close view of a complicated many-button game controller model and beside it a few simple colored puzzle blocks on a table, no people, no text", videoStatics: "the table, the controller, the blocks, and the lighting" },
    I: { label: "사람이 가득 모인 광장과 한쪽의 작은 가게 모형(9번)", image: "사람들이 뒷모습의 작은 모습으로 가득 모인 큰 광장 한쪽에 작은 가게 모형 하나가 서 있다. 글자·로고 없음. 맑은 낮.", videoStyle: "a large plaza filled with small people seen from behind and one small shop model standing at the edge, no text or logos, clear daytime", videoStatics: "the plaza, the shop model, and the sky" },
    J: { label: "개점을 알리는 풍선과 스마트폰(10번)", image: "탁자 위 스마트폰 모형 옆에 개점을 뜻하는 색색의 풍선 장식이 서 있다. 사람 없음. 글자·로고 없음. 환한 조명.", videoStyle: "a table with a smartphone model and colorful grand-opening balloons beside it, no people, no text or logos, bright lighting", videoStatics: "the table, the phone model, the balloons, and the lighting" },
    K: { label: "두 스마트폰 사이로 오가는 하트 아이콘(11번)", image: "두 스마트폰 모형 사이로 하트 모양 아이콘이 오가는 모습. 글자·로고 없음. 사람 없음. 따뜻한 조명.", videoStyle: "close view of heart-shaped icons passing back and forth between two smartphone models, no people, no text or logos, warm lighting", videoStatics: "the two phone models and the lighting" },
    L: { label: "숫자가 올라가는 계기판 모양 막대 그래프(12번)", image: "탁자 위 숫자 없는 계기판 모양 막대 그래프 모형의 막대가 길게 올라가 있다. 사람 없음. 글자·숫자 없음. 환한 조명.", videoStyle: "close view of a gauge-shaped bar chart model without numerals on a table with its bar rising tall, no people, no text or numerals, bright lighting", videoStatics: "the table, the chart model, and the lighting" },
    M: { label: "끝없이 이어지는 설치 막대와 축하 풍선(13번)", image: "스마트폰 모형들이 끝없이 이어진 긴 줄 위로 축하 풍선이 떠 있다. 사람 없음. 글자·숫자·로고 없음. 밝은 햇살.", videoStyle: "a wide view of smartphone models stretching in an endless line with celebration balloons floating above, no people, no text, numerals or logos, bright sun", videoStatics: "the line of phone models and the sky" },
    N: { label: "퍼즐 조각이 딱 맞는 틀에 끼워지는 모습(14번)", image: "탁자 위에서 한 손이 색깔 퍼즐 조각을 딱 맞는 틀에 끼워 넣는다. 손만 보임. 글자 없음. 따뜻한 조명.", videoStyle: "close view of one hand fitting a colored puzzle piece into a perfectly matching frame on a table, hand only, no text, warm lighting", videoStatics: "the table, the frame, and the lighting" },
    O: { label: "번화한 길목의 작은 가게(15번)", image: "사람들이 뒷모습의 작은 모습으로 오가는 번화한 길목 모퉁이에 글자 없는 작은 가게가 있다. 글자·로고 없음. 맑은 낮빛.", videoStyle: "a busy street corner with small people seen from behind passing and a small plain shop without text at the corner, no text or logos, clear daylight", videoStatics: "the street, the shop, and the daylight" },
  }),

  scenes: Object.freeze([
    { scene: 1, key: "s1_hook", role: "hook", video: "story_ep25_s1_hook_motion.mp4",
      narration: "지하철과 버스마다 '팡팡' 소리가 들리던 2012년, 그 게임을 만든 건 이름도 낯선 작은 게임 회사였어.",
      imageBrief: "2012년 지하철 객차 안에서 사람들이 뒷모습으로 스마트폰을 내려다보며 퍼즐 게임을 하고 있다(얼굴 안 보임). 화면은 색 덩어리만. 글자·로고 없음. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만). 구도 규칙(가장 중요): 카메라를 낮게 잡아 인물의 머리는 화면 세로 45%보다 아래(45~85% 구간)에 오게 하고, 화면 위쪽 40%에는 사람·머리가 하나도 없이 벽·창문·천장·조명·하늘 같은 배경만 보이게 해.",
      shot: "medium", bg: "A",
      lock: "the people stay seen from behind with no face ever shown; the screens show no readable text or logos; nobody else enters.",
      motion: motion("the people tap their screens and tilt their heads slightly, the subway car stays completely still", "everyone is playing") },
    { scene: 2, key: "s2_who", role: "evidence", video: "story_ep25_s2_who_motion.mp4",
      narration: "애니팡을 만든 선데이토즈 이야기야.",
      imageBrief: "작은 사무실에서 개발자 서넛이 뒷모습으로 모니터 앞에 모여 있다(얼굴 안 보임). 모니터는 색 덩어리만. 글자·로고 없음. 따뜻한 조명. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만). 구도 규칙(가장 중요): 카메라를 낮게 잡아 인물의 머리는 화면 세로 45%보다 아래(45~85% 구간)에 오게 하고, 화면 위쪽 40%에는 사람·머리가 하나도 없이 벽·창문·천장·조명·하늘 같은 배경만 보이게 해.",
      shot: "medium", bg: "B",
      lock: "the people stay seen from behind with no face ever shown; the monitors show no readable text; nobody else enters.",
      motion: motion("one developer leans in toward the monitor and sits back, the office and the monitors stay completely still", "a small team") },
    { scene: 3, key: "s3_puzzle", role: "core_question", video: "story_ep25_s3_puzzle_motion.mp4",
      narration: "이름도 낯선 회사가 어떻게 국민 게임을 만들었을까?",
      imageBrief: "작은 사무실 창 너머로 높은 건물이 가득한 큰 도시 풍경이 보인다. 사무실 안에는 책상과 모니터만 있고 사람 없음. 글자 없음. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "wide", bg: "C",
      lock: "no people appear; nothing carries text or logos; the window stays fixed.",
      motion: motion("the afternoon light shifts slightly over the city, the window and the desks stay completely still", "small place, big city") },
    { scene: 4, key: "s4_pc", role: "evidence", video: "story_ep25_s4_pc_motion.mp4",
      narration: "이 회사는 PC 소셜게임 '아쿠아 스토리'로 성과를 낸 적이 있었어. 하지만 모바일은 처음이었지.",
      imageBrief: "책상 위 데스크톱 모니터 모형에서 스마트폰 모형으로 향하는 큰 화살표 모양 소품이 놓여 있다. 사람 없음. 글자·숫자 없음. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "close", bg: "D",
      lock: "no people appear; the models keep no text or numerals; the desk stays fixed.",
      motion: motion("a glow travels along the arrow from the monitor to the phone, the desk and the models stay completely still", "moving to mobile") },
    { scene: 5, key: "s5_choice", role: "evidence", video: "story_ep25_s5_choice_motion.mp4",
      narration: "대표는 모바일 시대에 어떤 친구 관계가 힘을 발휘할지 고민했고, 눈에 들어온 게 전화번호부 기반의 카카오톡이었다고 밝혔어.",
      imageBrief: "스마트폰 모형의 연락처 목록 칸들이 글자 없는 말풍선 모양으로 서로 이어져 있다. 사람 없음. 글자·로고 없음. 밝은 조명. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "close", bg: "E",
      lock: "no people appear; the bubbles keep no text or logos; the phone stays fixed.",
      motion: motion("a soft glow runs through the connected bubbles, the phone model stays completely still", "friends connected by numbers") },
    { scene: 6, key: "s6_propose", role: "evidence", video: "story_ep25_s6_propose_motion.mp4",
      narration: "우연히 카카오 대표를 만난 자리에서, 카카오톡으로 게임을 해 보자고 제안했다고 해.",
      imageBrief: "카페 테이블에 두 사람이 뒷모습으로 마주 앉아 노트북 한 대를 함께 들여다본다(얼굴 안 보임). 화면은 색 덩어리만. 글자 없음. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만). 구도 규칙(가장 중요): 카메라를 낮게 잡아 인물의 머리는 화면 세로 45%보다 아래(45~85% 구간)에 오게 하고, 화면 위쪽 40%에는 사람·머리가 하나도 없이 벽·창문·천장·조명·하늘 같은 배경만 보이게 해.",
      shot: "medium", bg: "F",
      lock: "the people stay seen from behind with no face ever shown; the laptop shows no readable text; nobody else enters.",
      motion: motion("one person points at the screen and the other nods, the table and the laptop stay completely still", "a proposal") },
    { scene: 7, key: "s7_acceptq", role: "core_question", video: "story_ep25_s7_acceptq_motion.mp4",
      narration: "카카오는 그 제안을 받아들였을까?",
      imageBrief: "닫힌 회의실 문 앞 바닥에 서류 봉투 하나가 놓여 있다. 사람 없음. 글자 없음. 낮은 조명. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "close", bg: "G",
      lock: "no people appear; the envelope and door keep no text; the envelope stays fixed.",
      motion: motion("a thin line of light under the door brightens slightly, the door and the envelope stay completely still", "waiting for an answer") },
    { scene: 8, key: "s8_casual", role: "evidence", video: "story_ep25_s8_casual_motion.mp4",
      narration: "카카오는 캐주얼 게임을 찾고 있었어. 대표는 카카오톡 이용자가 게이머보다 게임을 안 하던 사람에 가깝다고 보고, 더 쉬운 게임을 내놓기로 했대.",
      imageBrief: "탁자 위에 단추 많은 복잡한 게임 컨트롤러 모형과 그 옆에 색깔 퍼즐 블록 몇 개가 단순하게 놓여 있다. 사람 없음. 글자 없음. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "close", bg: "H",
      lock: "no people appear; nothing carries text or logos; the table stays fixed.",
      motion: motion("a soft light moves from the controller to the blocks and rests, the table stays completely still", "an easier game") },
    { scene: 9, key: "s9_market", role: "evidence", video: "story_ep25_s9_market_motion.mp4",
      narration: "대표가 본 건 이미 전화번호로 이어져 있는 친구 관계였어. 사람을 새로 모을 필요가 없는 시장이었지.",
      imageBrief: "사람들이 뒷모습의 작은 모습으로 가득 모인 큰 광장 한쪽에 작은 가게 모형 하나가 서 있다. 글자·로고 없음. 맑은 낮. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만). 구도 규칙(가장 중요): 카메라를 낮게 잡아 인물의 머리는 화면 세로 45%보다 아래(45~85% 구간)에 오게 하고, 화면 위쪽 40%에는 사람·머리가 하나도 없이 벽·창문·천장·조명·하늘 같은 배경만 보이게 해.",
      shot: "wide", bg: "I",
      lock: "the people stay seen from behind with no face ever shown; the shop keeps no text or logos; nobody else enters.",
      motion: motion("the crowd shifts gently around the plaza, the shop model stays completely still", "a market already gathered") },
    { scene: 10, key: "s10_launch", role: "evidence", video: "story_ep25_s10_launch_motion.mp4",
      narration: "그 해 7월 30일, 카카오톡 게임하기가 열리던 날 애니팡도 같이 나왔어.",
      imageBrief: "탁자 위 스마트폰 모형 옆에 개점을 뜻하는 색색의 풍선 장식이 서 있다. 사람 없음. 글자·로고 없음. 환한 조명. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "medium", bg: "J",
      lock: "no people appear; the phone and balloons keep no text or logos; the table stays fixed.",
      motion: motion("the balloons sway gently, the table and the phone stay completely still", "opening day") },
    { scene: 11, key: "s11_heart", role: "evidence", video: "story_ep25_s11_heart_motion.mp4",
      narration: "게임을 하려면 하트가 필요했는데, 그 하트는 카카오톡 친구끼리 주고받을 수 있었지.",
      imageBrief: "두 스마트폰 모형 사이로 하트 모양 아이콘이 오가는 모습. 글자·로고 없음. 사람 없음. 따뜻한 조명. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "close", bg: "K",
      lock: "no people appear; the phones keep no text or logos; the phones stay fixed.",
      motion: motion("a heart icon floats from one phone to the other, the phones stay completely still", "sharing hearts") },
    { scene: 12, key: "s12_numq", role: "core_question", video: "story_ep25_s12_numq_motion.mp4",
      narration: "하트가 오가자, 설치 숫자는 얼마나 늘었을까?",
      imageBrief: "탁자 위 숫자 없는 계기판 모양 막대 그래프 모형의 막대가 길게 올라가 있다. 사람 없음. 글자·숫자 없음. 환한 조명. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "close", bg: "L",
      lock: "no people appear; the model keeps no text or numerals; the table stays fixed.",
      motion: motion("a glow climbs slowly up the tall bar, the table and the chart stay completely still", "how high will it go") },
    { scene: 13, key: "s13_result", role: "evidence", video: "story_ep25_s13_result_motion.mp4",
      narration: "한 달 남짓 만에 설치가 1천만을 넘었고, 두 달 남짓 만에 2천만을 넘었어.",
      imageBrief: "스마트폰 모형들이 끝없이 이어진 긴 줄 위로 축하 풍선이 떠 있다. 사람 없음. 글자·숫자·로고 없음. 밝은 햇살. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "wide", bg: "M",
      lock: "no people appear; nothing carries text or numerals; the phone line stays fixed.",
      motion: motion("the balloons drift gently in the air, the line of phones stays completely still", "millions of installs") },
    { scene: 14, key: "s14_fit", role: "evidence", video: "story_ep25_s14_fit_motion.mp4",
      narration: "대표는 카카오톡에 기댄 게 아니라, 카카오톡의 성질에 딱 맞는 게임을 만든 거라고 말했지.",
      imageBrief: "탁자 위에서 한 손이 색깔 퍼즐 조각을 딱 맞는 틀에 끼워 넣는다. 손만 보임. 글자 없음. 따뜻한 조명. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "close", bg: "N",
      lock: "no face or body appears — only the hand; the pieces keep no text; the table stays fixed.",
      motion: motion("the hand presses the piece in with a soft click and withdraws, the table and the frame stay completely still", "a perfect fit") },
    { scene: 15, key: "s15_lesson", role: "evidence", video: "story_ep25_s15_lesson_motion.mp4",
      narration: "장사에서 목 좋은 자리는 월세가 비싸도, 손님을 모으는 돈과 수고가 줄어.",
      imageBrief: "사람들이 뒷모습의 작은 모습으로 오가는 번화한 길목 모퉁이에 글자 없는 작은 가게가 있다. 글자·로고 없음. 맑은 낮빛. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만). 구도 규칙(가장 중요): 카메라를 낮게 잡아 인물의 머리는 화면 세로 45%보다 아래(45~85% 구간)에 오게 하고, 화면 위쪽 40%에는 사람·머리가 하나도 없이 벽·창문·천장·조명·하늘 같은 배경만 보이게 해.",
      shot: "wide", bg: "O",
      lock: "the people stay seen from behind with no face ever shown; the shop keeps no text or logos; nobody else enters.",
      motion: motion("the passersby move along the street, the shop and the buildings stay completely still", "a good spot") },
  ]),
});

// ── 16번(부엉박사 마무리) — owl3dv5 스펙으로 따로 생성 ──
export const STORY_EP25_END_SPEC = Object.freeze({
  specVersion: "story_assembly_spec_v1",
  episode: 25,
  imageCharacter: "owl3dv5",
  imagePrefix: "story_ep25",
  sceneBackgrounds: Object.freeze({
    P: { label: "번화한 길목 앞 광장(16번 부엉박사)", image: "밝은 낮 한국 번화한 길목 앞 광장. 부엉박사 뒤로 글자 없는 작은 가게 외벽과 열린 문, 바닥에 놓인 작은 나무 상자 두 개(글자 없음). 바닥은 매끈한 연한 회색 포장, 따뜻한 낮빛.", videoStyle: "bright daytime on a plaza at a busy Korean street corner with a plain small shop wall, an open door, and two small plain wooden boxes on the ground, smooth light gray pavement", videoStatics: "the shop wall, the open door, the two boxes, the smooth light gray pavement, and the warm daylight" },
  }),
  scenes: Object.freeze([
    {
      scene: 16, key: "s16_close", role: "save", video: "story_ep25_s16_close_motion.mp4",
      narration: "작은 곳일수록 사람이 이미 모인 자리에 내 물건을 놓는 게 가장 큰 승부처야. 애니팡의 다음 이야기가 궁금하면 팔로우해 줘.",
      imageBrief: "부엉이가 정면을 보며 한쪽 날개를 가슴 앞에 가볍게 모아 차분히 정리해 주는 듯한 따뜻한 표정으로 시청자에게 말하는 포즈, 다른 날개는 자연스럽게 내리고 소품은 들지 않음. 구도 규칙(가장 중요): 부엉이는 화면 아래쪽 절반(세로 45~95%)에 서 있고 머리·얼굴·선글라스는 세로 45%보다 아래에 오게 하며, 화면 위쪽 40%에는 부엉이 없이 건물·하늘·조명 같은 배경만 보이게 해.",
      shot: "medium", bg: "P",
      lock: "the wall and the boxes stay fixed; the sunglasses stay on top of the head; no props are held.",
      speaks: true,
      motion: motion("the character gestures gently with one wing at chest height while summarizing, then gives a small warm nod to the viewer; no props are held", "warm summary and invitation to follow"),
    },
  ]),
});

// ── 조립 스펙(run-owl-assemble-shorts-v2.mjs) — 제목은 ★임시안(Owner 확정 필요) ──
// 조립: node scripts/run-owl-assemble-shorts-v2.mjs --spec-module ./_story-ep25-assembly-spec.mjs --spec-export STORY_EP25_ASSEMBLE_SPEC --clip-dir C:/tmp/story-ep25-clips-named --audio-summary C:/tmp/money-shorts-os/story-ep25-tts/output-v1/tempo-1.2-gap0.25-pre/elevenlabs-scene-paced-tts-summary.audio-fixed.tempo1.2-gap0.25-pre.json --tts-script C:/tmp/money-shorts-os/story-ep25-tts/story-ep25-tts-script.json --out-dir C:/tmp/story-ep25-assembled
const STORY_RENDER = Object.freeze({
  width: 1080, height: 1920, fps: 24, videoCodec: "libx264", crf: 18, pixFmt: "yuv420p",
  audioCodec: "aac", audioBitrate: "192k", audioSampleRate: 48000, audioChannels: 1,
});

export const STORY_EP25_FULL_SPEC = Object.freeze({
  ...STORY_EP25_SEMI_SPEC,
  sceneBackgrounds: Object.freeze({ ...STORY_EP25_SEMI_SPEC.sceneBackgrounds, ...STORY_EP25_END_SPEC.sceneBackgrounds }),
  scenes: Object.freeze([...STORY_EP25_SEMI_SPEC.scenes, ...STORY_EP25_END_SPEC.scenes]),
});

export const STORY_EP25_ASSEMBLE_SPEC = Object.freeze({
  ...STORY_EP25_FULL_SPEC,
  headerTitle: Object.freeze(["이름 낯선 회사의","국민 게임","애니팡 비결"]),
  videoShiftDownPx: 230,
  videoShiftFadePx: 260,
  headerTopY: 345,
  headerScrimHeight: 780,
  captionFontSize: 102,
  captionY: 1385,
  captionPlanner: "scene_dp_v1",
  footerChannelBar: false,
  captionLayout: "v2",
  emphasisTerms: Object.freeze(["애니팡","카카오톡","하트","1천만","2천만"]),
  emphasisNumberPatterns: Object.freeze(["[0-9,.]+%","[0-9]+배","[0-9]+명","[0-9,.]+억","[0-9,.]+만"]),
  captionEmphasisPop: true,
  captionGapBridgeSec: 0.3,
  captionLastSceneNoMargin: true,
  captionSceneEndMarginSec: 0.1,
  captionLeadSec: 0.12,
  hookType: "story",
  render: STORY_RENDER,
  scenes: Object.freeze(STORY_EP25_FULL_SPEC.scenes.map((s) => Object.freeze({ ...s, overlays: [] }))),
});
