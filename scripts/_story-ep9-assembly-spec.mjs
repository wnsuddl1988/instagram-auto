/**
 * 스토리형 9편 — 하나로통신 ADSL 재연 장면 스펙 (2026-10-09).
 *
 * 기준: `_ai/story-script-rules.md` + 확정 대본 `C:/tmp/story-ep9-hanaro/scenes-v3.json`(15장면 520자, Owner 확정 2026-10-09).
 * 설계 `C:/tmp/story-ep9-hanaro/story-design.json`. TTS `C:/tmp/money-shorts-os/story-ep9-tts/output-v1/tempo-1.2-gap0.25-pre/…audio-fixed…json`(78.26초).
 * 화풍: 반사실 3D(storysemi, Owner 확정). 1~14번 재연 장면 + 15번 부엉박사 진행자 컷.
 *
 * 이미지 규칙(CURRENT_STANDARDS 이미지 3대 원칙 + 스토리형, 7편과 동일):
 *  - 화면에 글자·숫자·로고·브랜드·회사 이름을 넣지 않는다(숫자는 자막이 맡는다). 지폐·화면·서류는 무늬와 색 덩어리만.
 *  - 실제 회사의 색·로고·마크를 흉내 내지 않는다(중립 색). 실존 인물(사장 등)을 닮게 그리지 않는다.
 *  - 소품은 두 손으로 감싸 쥐거나 탁자·바닥에 거치. 빈 면 금지. 핵심 피사체는 세로 15~62%(자막 자리 비움).
 *  - ★ 실존 인물 오인 방지: 얼굴이 크게 보이는 정면·근접 구도를 피하고 인물은 뒷모습·멀리 있는 작은 모습·손과 소품 위주.
 *  - 1990년대 말~2000년대 초 한국 배경(CRT 모니터, 전화선, 아파트 단지, 작은 사무실).
 *
 * 이미지 생성: ① 1~14번 `ALLOW_CHATGPT_IMAGE=1 node scripts/probe-character-consistency-chatgpt-v1.mjs --character storysemi --scene-spec ./_story-ep9-assembly-spec.mjs --scene-spec-export STORY_EP9_SEMI_SPEC --out-dir C:/tmp/story-ep9-images`
 *            ② 15번(부엉박사) `… --character owl3dv5 --scene-spec ./_story-ep9-assembly-spec.mjs --scene-spec-export STORY_EP9_END_SPEC --out-dir C:/tmp/story-ep9-images`
 */

const NO_TEXT = "화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(상자·서류·지폐·모니터·간판·차트 모두 무늬와 색 덩어리만).";
const motion = (action, mood) => ({ type: "scene", action, mood });

const FACE_SAFE = " 구도 규칙(가장 중요): 카메라를 낮게 잡아 인물의 머리는 화면 세로 45%보다 아래(45~85% 구간)에 오게 하고, 화면 위쪽 40%에는 사람·머리가 하나도 없이 벽·창문·천장·조명·하늘 같은 배경만 보이게 해.";
const MODEM = "글자와 로고가 전혀 없는 작은 회색 직사각형 모뎀 상자(전화선 연결 단자만 보임)";
const BILLS = "글자·숫자가 전혀 없고 연한 녹색 무늬만 있는 지폐 다발";

export const STORY_EP9_SEMI_SPEC = Object.freeze({
  specVersion: "story_assembly_spec_v1",
  scriptStructureVersion: "story_format_structure_v3",
  formatProfile: "story_v1",
  episode: 9,
  displayEpisode: 9,
  sourceCandidate: "story-ep9-hanaro-adsl-1999",
  title: "하나로통신 — 값이 비싸도 먼저 쓴 ADSL",
  channelName: "경제번역소",
  characterDisplayName: "부엉박사",
  imageCharacter: "storysemi",
  imagePrefix: "story_ep9",
  storyStyleOnlyIdentity:
    "1990년대 말~2000년대 초 한국을 배경으로 한 재연 장면 시리즈의 한 장면이야. 화풍: 고품질 반사실 3D CG 렌더링(시네마틱 게임 컷신·CG 다큐 재연 화면 같은 느낌) — 사람의 얼굴·눈·머리·몸 비율은 실제 사람처럼 사실적으로, " +
    "피부·옷·재질은 매끈한 CG 질감, 영화 같은 자연광과 부드러운 그림자, 차분하고 진지한 색감. 큰 눈·둥근 얼굴·과장된 만화 비율(픽사풍) 금지, 실제 사진처럼 보이는 실사도 금지. " +
    "장면 설명에 나오는 인물 외에는 아무도 그리지 마. 세로 9:16.",
  storySameStyleRule:
    "앞 장면들과 똑같은 반사실 3D CG 화풍(사실적인 사람 비율, 매끈한 CG 질감, 같은 시네마틱 조명·색감)을 유지해. " +
    "장면 설명에 없는 인물·글자·숫자·로고는 넣지 마. 얼굴을 크게 보이게 하지 말고 장면 설명대로 뒷모습·작은 모습·손과 소품 위주로 그려. 픽사풍 큰 눈·만화 비율 금지, 실사 사진 금지. 세로 9:16.",

  sceneBackgrounds: Object.freeze({
    A: {
      label: "회의실 탁자 위 모뎀 상자(1번)",
      image: "1999년 한국 회사 회의실. 긴 탁자 한가운데에 작은 회색 모뎀 상자 하나가 놓여 있고, 양복 입은 사람 서너 명이 탁자 양쪽에 앉아 뒷모습·옆모습으로 그 상자를 내려다본다(얼굴 안 보임). 탁자 옆에 지폐 다발이 쌓여 있다. 창밖에 낮의 도시.",
      videoStyle: "1999 Korean meeting room with a small gray modem box at the center of a long table, suited people seen from behind and the side looking down at it, a stack of plain bills beside it",
      videoStatics: "the long table, the small gray modem box, the stack of plain bills, the suited people seen from behind, and the daytime city window",
    },
    B: {
      label: "모뎀 상자를 든 손(2번)",
      image: "책상 위 근접 장면. 한 손이 작은 회색 모뎀 상자를 조심스럽게 들어 올려 살펴보고, 책상에는 연한 녹색 무늬만 있는 지폐 다발이 놓여 있다. 얼굴·몸 없음(손만). 따뜻한 스탠드 조명.",
      videoStyle: "close view of one hand carefully lifting a small gray modem box above a desk with a stack of plain bills under a warm lamp",
      videoStatics: "the desk, the stack of plain bills, and the warm lamp light",
    },
    C: {
      label: "신생 통신사 사무실(3번)",
      image: "1997년 문을 연 작은 통신 회사 사무실 전경(넓은 구도). 새 책상과 전화기들이 줄지어 놓여 있고 직원 몇 명이 작게 앉아 일하고 있다(얼굴 안 보임). 유리문에는 글자 없는 불투명 스티커만 있다. 밝은 오전 햇살.",
      videoStyle: "1997 small new telecom company office wide view with new desks and rows of phones and a few tiny staff working, a glass door with a blank frosted sticker, bright morning light",
      videoStatics: "the new desks, the rows of phones, the glass door with the blank sticker, and the bright morning light",
    },
    D: {
      label: "전화기와 낮은 막대 그래프(4번)",
      image: "책상 위에 구식 유선 전화기 한 대가 놓여 있고, 그 옆에 글자·숫자 없이 막대 두 개짜리 그래프가 세워져 있다. 한 막대는 아주 높고 다른 막대는 아주 낮다. 정장 소매의 한 손이 낮은 막대를 짚고 있다. 얼굴 없음(손만). 차분한 오후 빛.",
      videoStyle: "a desk with an old landline phone and a plain two-bar chart, one bar very tall and one very short, a suited hand touching the short bar",
      videoStatics: "the old landline phone, the plain two-bar chart, the desk, and the calm afternoon light",
    },
    E: {
      label: "공항 출국장 두 팀(5번)",
      image: "공항 출국장. 양복 입은 사람들이 서류 가방을 들고 두 무리로 나뉘어 서로 다른 게이트 쪽으로 걸어가는 뒷모습(얼굴 안 보임). 게이트 위 표시는 글자 없이 빛 무늬만. 큰 유리창 밖에 비행기 한 대.",
      videoStyle: "airport departure hall with suited people carrying briefcases split into two groups walking away toward different gates seen from behind, a plane outside the big window",
      videoStatics: "the departure hall, the gate lights without text, the big window with the plane, and the polished floor",
    },
    F: {
      label: "전화선과 모뎀을 연결하는 손(6번)",
      image: "1990년대 말 한국 가정 거실의 책상 위. 두꺼운 CRT 모니터와 본체 옆에서, 한 손이 전화선 끝을 작은 회색 모뎀 상자 단자에 꽂고 있다. 모니터 화면은 글자 없이 연한 푸른빛만. 얼굴 없음(손만). 저녁 따뜻한 조명.",
      videoStyle: "late 1990s Korean living room desk with a thick CRT monitor and a hand plugging a phone cable into a small gray modem box, monitor showing only a pale blue glow",
      videoStatics: "the thick CRT monitor with the pale blue glow, the computer case, the desk, and the warm evening light",
    },
    G: {
      label: "지폐 다발 위의 모뎀 상자(7번)",
      image: "밝은 책상 위 근접 장면. 작은 회색 모뎀 상자 한 개가 높이 쌓인 지폐 다발 위에 올라가 있다. 지폐에는 글자·숫자가 없고 무늬만 있다. 옆에 같은 모뎀 상자 몇 개가 줄지어 서 있다. 사람 없음. 따뜻한 조명.",
      videoStyle: "bright desk close view of one small gray modem box on a tall stack of plain bills with a few more identical modem boxes lined up beside it",
      videoStatics: "the tall stack of plain bills, the row of gray modem boxes, the desk, and the warm light",
    },
    H: {
      label: "하락 곡선을 그린 화이트보드(8번)",
      image: "회의실 화이트보드에 글자·숫자 없이 오른쪽 아래로 내려가는 굵은 곡선이 그려져 있다. 양복 입은 한 사람이 뒷모습으로 보드 곁에 서서 곡선을 가리키고, 앞쪽 탁자에 임원들이 팔짱을 낀 채 뒷모습으로 앉아 있다(얼굴 안 보임). 낮의 햇살.",
      videoStyle: "meeting room whiteboard with a thick downward-sloping curve and no text, a suited person seen from behind pointing at it while executives with folded arms sit at the table seen from behind",
      videoStatics: "the whiteboard with the downward curve, the meeting table, the executives seen from behind, and the daylight window",
    },
    I: {
      label: "아파트 단지와 통신함(9번)",
      image: "1999년 한국 아파트 단지 전경(해 질 무렵). 같은 모양의 아파트 여러 동이 줄지어 서 있고, 한 동 앞 통신함 앞에서 작업복 입은 기술자가 사다리에 올라 뒷모습으로 선을 연결하고 있다(얼굴 안 보임). 창문 몇 곳에 불이 켜지기 시작한다.",
      videoStyle: "1999 Korean apartment complex at dusk with identical apartment blocks and a technician in work clothes on a ladder seen from behind connecting cables at a utility box, a few windows lighting up",
      videoStatics: "the row of identical apartment blocks, the utility box, the ladder, and the dusk sky",
    },
    J: {
      label: "신청서를 든 줄 선 사람들(10번)",
      image: "통신 회사 접수 창구 앞. 사람들이 종이 신청서를 손에 들고 길게 줄을 서서 뒷모습으로 기다리고 있다(얼굴 안 보임). 창구 안쪽 선반은 거의 비어 있다. 서류에는 줄무늬만. 밝은 실내 조명.",
      videoStyle: "telecom service counter with a long line of people seen from behind holding paper application forms, an almost empty shelf behind the counter",
      videoStatics: "the service counter, the almost empty shelf behind it, the long queue seen from behind, and the bright indoor light",
    },
    K: {
      label: "거의 빈 선반의 마지막 모뎀 상자(11번)",
      image: "창고 선반 근접 장면. 선반이 거의 비어 있고 작은 회색 모뎀 상자 한두 개만 남아 있으며, 그 앞 바닥과 선반 위에 신청서 더미가 수북이 쌓여 있다. 서류에는 줄무늬만. 사람 없음. 형광등 불빛.",
      videoStyle: "warehouse shelf almost empty with one or two small gray modem boxes left and big piles of plain application forms stacked in front",
      videoStatics: "the almost empty shelf, the last gray modem boxes, the piles of plain application forms, and the fluorescent light",
    },
    L: {
      label: "작은 팔레트와 큰 팔레트(12번)",
      image: "넓은 물류 창고 바닥에 모뎀 상자를 쌓은 팔레트 두 개가 나란히 놓여 있다. 왼쪽은 낮은 한 더미이고 오른쪽은 두 배가 훨씬 넘게 높이 쌓여 있다. 상자에는 글자·로고가 없다. 지게차 한 대가 뒤에 멈춰 있다(운전자 안 보임). 사람 없음.",
      videoStyle: "wide logistics warehouse floor with two pallets of plain gray modem boxes side by side, the left one low and the right one more than twice as tall, a forklift parked behind",
      videoStatics: "the two pallets, the plain gray boxes, the parked forklift, and the warehouse floor",
    },
    M: {
      label: "불 켜진 창이 가득한 밤 아파트(13번)",
      image: "밤의 한국 아파트 단지 전경(넓은 구도). 수많은 창문마다 푸르스름한 모니터 불빛이 켜져 있고, 단지 사이 길은 조용하다. 사람 없음. 하늘은 짙은 남색.",
      videoStyle: "wide night view of a Korean apartment complex with countless windows glowing with bluish monitor light, quiet roads between the blocks",
      videoStatics: "the apartment blocks, the countless lit windows, the quiet roads, and the deep navy night sky",
    },
    N: {
      label: "하나만 빛나는 세계지도(14번)",
      image: "어두운 전시 벽면의 큰 세계지도. 글자 없이 대륙 윤곽만 있고, 동아시아의 작은 반도 한 곳만 밝은 금빛으로 빛나며 나머지는 어둡다. 지도 앞 빈 연단 하나. 사람 없음.",
      videoStyle: "large dark exhibition wall world map with only continent outlines and no text, one small peninsula in East Asia glowing bright gold, an empty podium in front",
      videoStatics: "the dark world map wall, the glowing peninsula, the empty podium, and the dim hall",
    },
  }),

  scenes: Object.freeze([
    {
      scene: 1, key: "s1_hook", role: "hook", video: "story_ep9_s1_hook_motion.mp4",
      narration: "1999년, 하나로통신은 모뎀 한 개가 60만 원이 넘는데도 그 장비로 인터넷 사업을 시작했어.",
      imageBrief: `1999년 한국 회사 회의실. 긴 탁자 한가운데에 ${MODEM} 하나가 놓여 있고, 양복 입은 사람 서너 명이 탁자 양쪽에서 뒷모습·옆모습으로 그 상자를 내려다본다. 탁자 옆에 ${BILLS}가 쌓여 있다. ` + NO_TEXT + FACE_SAFE,
      shot: "medium", bg: "A",
      lock: "the people stay seen from behind or the side with no face ever shown; the modem box and the stack of bills stay fixed on the table; the box keeps no text or logos; nobody else enters.",
      motion: motion("one of the suited people leans slightly forward to study the modem box and another folds his arms, the table and the window stay completely still", "a costly device"),
    },
    {
      scene: 2, key: "s2_why", role: "evidence", video: "story_ep9_s2_why_motion.mp4",
      narration: "왜 그렇게 값비싼 장비를 먼저 쓰려 했을까?",
      imageBrief: `책상 위 근접 장면. 한 손이 ${MODEM}를 조심스럽게 들어 올려 살펴보고, 책상에는 ${BILLS}가 놓여 있다. 얼굴·몸은 그리지 마(손만). 따뜻한 스탠드 조명. ` + NO_TEXT,
      shot: "close", bg: "B",
      lock: "no face or body ever appears — only the one hand; the modem box keeps no text or logos; the stack of bills and the lamp stay fixed.",
      motion: motion("the hand lifts the modem box a little, turns it over once and sets it down again, the lamp light stays steady, the desk stays completely still", "a hesitant question"),
    },
    {
      scene: 3, key: "s3_company", role: "evidence", video: "story_ep9_s3_company_motion.mp4",
      narration: "이 회사는 1997년에 문을 연 통신 회사야.",
      imageBrief: "1997년 문을 연 작은 통신 회사 사무실 전경(넓은 구도). 새 책상과 전화기들이 줄지어 놓여 있고 직원 몇 명이 작게 앉아 일하고 있다. 유리문에는 글자 없는 불투명 스티커만 있다. 밝은 오전 햇살. " + NO_TEXT,
      shot: "wide", bg: "C",
      lock: "the desks and phones stay in the same arrangement; the staff stay tiny and seen from behind with no face shown; the glass door keeps only a blank frosted sticker; nobody large enters.",
      motion: motion("a few tiny staff pick up phones and write at their desks while the morning light brightens, the desks and the door stay completely still", "a new company opens"),
    },
    {
      scene: 4, key: "s4_landline", role: "evidence", video: "story_ep9_s4_landline_motion.mp4",
      narration: "그런데 시내전화만으로는 먹고살기 어려웠지.",
      imageBrief: "책상 위에 구식 유선 전화기 한 대가 놓여 있고, 그 옆에 글자·숫자 없이 막대 두 개짜리 그래프가 세워져 있다. 한 막대는 아주 높고 다른 막대는 아주 낮다. 정장 소매의 한 손이 낮은 막대를 짚고 있다. 얼굴은 그리지 마(손만). " + NO_TEXT,
      shot: "close", bg: "D",
      lock: "no face or body appears — only the one hand and the suit sleeve; the chart keeps only two plain bars with no text or numbers; the phone and the desk stay fixed.",
      motion: motion("the hand taps the short bar twice and then rests beside it, the afternoon light stays steady, the phone and the chart stay completely still", "not enough"),
    },
    {
      scene: 5, key: "s5_scout", role: "evidence", video: "story_ep9_s5_scout_motion.mp4",
      narration: "그래서 사장은 미국, 유럽, 일본에 사람을 보내 살펴보게 했어.",
      imageBrief: "공항 출국장. 양복 입은 사람들이 서류 가방을 들고 두 무리로 나뉘어 서로 다른 게이트 쪽으로 걸어가는 뒷모습. 게이트 위 표시는 글자 없이 빛 무늬만. 큰 유리창 밖에 비행기 한 대. " + NO_TEXT + FACE_SAFE,
      shot: "wide", bg: "E",
      lock: "the people stay seen from behind with no face ever shown; the gates keep only light patterns with no text; the big window and the plane stay fixed.",
      motion: motion("the two groups walk away in different directions with their briefcases and the plane outside slowly taxis, the hall and the window stay completely still", "scouting abroad"),
    },
    {
      scene: 6, key: "s6_adsl", role: "evidence", video: "story_ep9_s6_adsl_motion.mp4",
      narration: "그 끝에 전화선으로 인터넷을 빠르게 쓰는 ADSL을 하기로 정했지.",
      imageBrief: `1990년대 말 한국 가정 거실의 책상 위. 두꺼운 CRT 모니터와 본체 옆에서, 한 손이 전화선 끝을 ${MODEM}의 단자에 꽂고 있다. 모니터 화면은 글자 없이 연한 푸른빛만. 얼굴은 그리지 마(손만). ` + NO_TEXT,
      shot: "close", bg: "F",
      lock: "no face or body appears — only the one hand; the monitor keeps only a pale blue glow with no text; the modem box keeps no text or logos; the desk stays fixed.",
      motion: motion("the hand pushes the phone cable into the modem until it clicks and the monitor glow brightens a little, the desk and the monitor stay completely still", "the choice is made"),
    },
    {
      scene: 7, key: "s7_modem", role: "core_question", video: "story_ep9_s7_modem_motion.mp4",
      narration: "그런데 ADSL 모뎀은 한 개에 60만 원이 넘었어. 가입자가 한 명 늘 때마다 모뎀도 하나씩 필요하니, 값이 안 내려가면 버티기 어려웠지.",
      imageBrief: `밝은 책상 위 근접 장면. ${MODEM} 한 개가 높이 쌓인 ${BILLS} 위에 올라가 있고, 옆에 같은 모뎀 상자 몇 개가 줄지어 서 있다. 사람 없음. ` + NO_TEXT,
      shot: "close", bg: "G",
      lock: "the modem boxes and the stack of bills stay in the same arrangement with no text or logos; no people or hands ever appear; only the warm light shifts.",
      motion: motion("a soft warm light slides slowly across the row of boxes and pauses on the one resting on the tall stack, the boxes and the bills stay completely still", "a heavy cost"),
    },
    {
      scene: 8, key: "s8_bet", role: "evidence", video: "story_ep9_s8_bet_motion.mp4",
      narration: "그래도 사장은 모뎀값이 곧 크게 떨어질 거라 보고 주위를 설득했어. 2년 안에 20만 원 아래로 내릴 수 있다고 말했지.",
      imageBrief: "회의실 화이트보드에 글자·숫자 없이 오른쪽 아래로 내려가는 굵은 곡선이 그려져 있다. 양복 입은 한 사람이 뒷모습으로 보드 곁에 서서 곡선을 가리키고, 앞쪽 탁자에 임원들이 팔짱을 낀 채 뒷모습으로 앉아 있다. 낮의 햇살. " + NO_TEXT + FACE_SAFE,
      shot: "medium", bg: "H",
      lock: "the people stay seen from behind with no face ever shown; the whiteboard keeps only the plain downward curve with no text or numbers; the table and the window stay fixed; nobody else enters.",
      motion: motion("the standing person traces the downward curve with a marker and the seated executives shift slightly, the board and the table stay completely still", "persuading with a bet"),
    },
    {
      scene: 9, key: "s9_launch", role: "evidence", video: "story_ep9_s9_launch_motion.mp4",
      narration: "1999년 4월, 하나로통신이 ADSL 서비스를 시작했어. 아파트 같은 큰 주택 단지를 위주로 열었지.",
      imageBrief: "1999년 한국 아파트 단지 전경(해 질 무렵). 같은 모양의 아파트 여러 동이 줄지어 서 있고, 한 동 앞 통신함 앞에서 작업복 입은 기술자가 사다리에 올라 뒷모습으로 선을 연결하고 있다. 창문 몇 곳에 불이 켜지기 시작한다. " + NO_TEXT,
      shot: "wide", bg: "I",
      lock: "the technician stays seen from behind with no face shown; the apartment blocks keep the same arrangement with no signs or text; the utility box and the ladder stay fixed.",
      motion: motion("the technician connects the last cable and a few more apartment windows light up one by one, the blocks and the ladder stay completely still", "the service begins"),
    },
    {
      scene: 10, key: "s10_queue", role: "evidence", video: "story_ep9_s10_queue_motion.mp4",
      narration: "시작하자마자 개통을 기다리는 사람이 몰렸어. 장비가 모자라 가입자를 다 받지 못할 정도였지.",
      imageBrief: "통신 회사 접수 창구 앞. 사람들이 종이 신청서를 손에 들고 길게 줄을 서서 뒷모습으로 기다리고 있다. 창구 안쪽 선반은 거의 비어 있다. 서류에는 줄무늬만. 밝은 실내 조명. " + NO_TEXT + FACE_SAFE,
      shot: "medium", bg: "J",
      lock: "the people stay seen from behind with no face ever shown; the forms keep only plain lines with no text; the almost empty shelf and the counter stay fixed.",
      motion: motion("the line shuffles forward one step and people shift their application forms in their hands, the counter and the shelf stay completely still", "a crowd waiting"),
    },
    {
      scene: 11, key: "s11_shortage", role: "core_question", video: "story_ep9_s11_shortage_motion.mp4",
      narration: "값이 비싸서 걱정하던 장비였는데, 이제는 모자라서 못 깔 만큼 찾는 사람이 많았던 거야.",
      imageBrief: `창고 선반 근접 장면. 선반이 거의 비어 있고 ${MODEM}가 한두 개만 남아 있으며, 그 앞 바닥과 선반 위에 종이 신청서 더미가 수북이 쌓여 있다. 서류에는 줄무늬만. 사람 없음. ` + NO_TEXT,
      shot: "close", bg: "K",
      lock: "the shelf, the last modem boxes and the piles of forms stay in the same arrangement with no text or logos; no people or hands ever appear; only the light flickers.",
      motion: motion("the fluorescent light flickers once and settles on the last modem boxes and the tall piles of forms, everything on the shelf stays completely still", "more demand than supply"),
    },
    {
      scene: 12, key: "s12_kt_supply", role: "evidence", video: "story_ep9_s12_kt_supply_motion.mp4",
      narration: "2000년엔 한국통신도 신청이 밀리자, 상반기 장비 공급 계획을 24만 회선에서 58만 회선으로 늘려 잡았어.",
      imageBrief: `넓은 물류 창고 바닥에 ${MODEM}를 쌓은 팔레트 두 개가 나란히 놓여 있다. 왼쪽은 낮은 한 더미이고 오른쪽은 두 배가 훨씬 넘게 높이 쌓여 있다. 지게차 한 대가 뒤에 멈춰 있다(운전자는 보이지 않음). 사람 없음. ` + NO_TEXT,
      shot: "wide", bg: "L",
      lock: "the two pallets stay in the same arrangement with the right one much taller; the boxes keep no text or logos; no people appear; the forklift stays parked.",
      motion: motion("a soft light sweeps from the low pallet up to the tall pallet and settles on the top, the pallets and the forklift stay completely still", "supply doubled"),
    },
    {
      scene: 13, key: "s13_ten_million", role: "evidence", video: "story_ep9_s13_ten_million_motion.mp4",
      narration: "2002년, 한국의 초고속인터넷 가입자는 1,000만을 넘었지.",
      imageBrief: "밤의 한국 아파트 단지 전경(넓은 구도). 수많은 창문마다 푸르스름한 모니터 불빛이 켜져 있고, 단지 사이 길은 조용하다. 사람 없음. 하늘은 짙은 남색. " + NO_TEXT,
      shot: "wide", bg: "M",
      lock: "the apartment blocks keep the same arrangement with no signs or text; no people appear; only the window lights change.",
      motion: motion("more apartment windows glow with the bluish light one after another across the blocks, the buildings and the sky stay completely still", "millions online"),
    },
    {
      scene: 14, key: "s14_oecd", role: "evidence", video: "story_ep9_s14_oecd_motion.mp4",
      narration: "OECD는 한국을 초고속인터넷 보급 1위 국가로 발표했어.",
      imageBrief: "어두운 전시 벽면의 큰 세계지도. 글자 없이 대륙 윤곽만 있고, 동아시아의 작은 반도 한 곳만 밝은 금빛으로 빛나며 나머지는 어둡다. 지도 앞 빈 연단 하나. 사람 없음. " + NO_TEXT,
      shot: "medium", bg: "N",
      lock: "the map keeps only continent outlines with no text or labels; only the one small peninsula glows; the empty podium stays fixed; no people appear.",
      motion: motion("the golden glow on the small peninsula pulses gently and brightens, the rest of the map and the podium stay completely still", "first place"),
    },
  ]),
});

// ── 15번(부엉박사 마무리) — owl3dv5 스펙으로 따로 생성 ──
export const STORY_EP9_END_SPEC = Object.freeze({
  specVersion: "story_assembly_spec_v1",
  episode: 9,
  imageCharacter: "owl3dv5",
  imagePrefix: "story_ep9",
  sceneBackgrounds: Object.freeze({
    O: {
      label: "아파트 단지 앞 저녁(15번 부엉박사)",
      image: "해 질 무렵 한국 아파트 단지 앞 보행로. 부엉박사 뒤로 같은 모양의 아파트 두세 동과 불이 켜지기 시작한 창문들, 길가에 글자 없는 전봇대 하나. 바닥은 매끈한 연한 회색 포장, 따뜻한 저녁 햇빛.",
      videoStyle: "dusk walkway in front of a Korean apartment complex with two or three identical apartment blocks with windows starting to light up and a plain utility pole beside the path",
      videoStatics: "the identical apartment blocks, the lit windows, the plain utility pole, the smooth light gray pavement, and the warm evening light",
    },
  }),
  scenes: Object.freeze([
    {
      scene: 15, key: "s15_close", role: "save", video: "story_ep9_s15_close_motion.mp4",
      narration: "값이 비싸도 먼저 쓰기로 한 하나로통신은, 한국이 초고속인터넷 1위가 되는 첫걸음에 있었어. 시장을 먼저 연 회사 이야기가 더 궁금하면 팔로우해 줘.",
      imageBrief: "부엉이가 정면을 보며 한쪽 날개를 가슴 앞에 가볍게 모아 차분히 정리해 주는 듯한 따뜻한 표정으로 시청자에게 말하는 포즈, 다른 날개는 자연스럽게 내리고 소품은 들지 않음. 구도 규칙(가장 중요): 부엉이는 화면 아래쪽 절반(세로 45~95%)에 서 있고 머리·얼굴·선글라스는 세로 45%보다 아래에 오게 하며, 화면 위쪽 40%에는 부엉이 없이 건물·하늘·조명 같은 배경만 보이게 해.",
      shot: "medium", bg: "O",
      lock: "the apartment blocks and the utility pole stay fixed; the sunglasses stay on top of the head; no props are held.",
      speaks: true,
      motion: motion("the character gestures gently with one wing at chest height while summarizing, then gives a small warm nod to the viewer; no props are held", "warm summary and invitation to follow"),
    },
  ]),
});

// ── 스토리형 조립 스펙(조립기 run-owl-assemble-shorts-v2.mjs 용) — 5편 STORY_EP5_ASSEMBLE_SPEC과 같은 구성(2026-10-10) ──
// 제목(★임시안 — Owner 확정 필요, 영상 속 제목·커버 문구 동일): 60만 원 모뎀을 / 먼저 쓴 / 하나로통신
// 조립: node scripts/run-owl-assemble-shorts-v2.mjs --spec-module ./_story-ep9-assembly-spec.mjs --spec-export STORY_EP9_ASSEMBLE_SPEC --clip-dir C:/tmp/story-ep9-clips-named --audio-summary C:/tmp/money-shorts-os/story-ep9-tts/output-v1/tempo-1.2-gap0.25-pre/elevenlabs-scene-paced-tts-summary.audio-fixed.tempo1.2-gap0.25-pre.json --tts-script C:/tmp/money-shorts-os/story-ep9-tts/story-ep9-tts-script.json --out-dir C:/tmp/story-ep9-assembled
const STORY_RENDER = Object.freeze({
  width: 1080, height: 1920, fps: 24, videoCodec: "libx264", crf: 18, pixFmt: "yuv420p",
  audioCodec: "aac", audioBitrate: "192k", audioSampleRate: 48000, audioChannels: 1,
});

export const STORY_EP9_FULL_SPEC = Object.freeze({
  ...STORY_EP9_SEMI_SPEC,
  sceneBackgrounds: Object.freeze({ ...STORY_EP9_SEMI_SPEC.sceneBackgrounds, ...STORY_EP9_END_SPEC.sceneBackgrounds }),
  scenes: Object.freeze([...STORY_EP9_SEMI_SPEC.scenes, ...STORY_EP9_END_SPEC.scenes]),
});

export const STORY_EP9_ASSEMBLE_SPEC = Object.freeze({
  ...STORY_EP9_FULL_SPEC,
  headerTitle: Object.freeze(["60만 원 모뎀을","먼저 쓴","하나로통신"]),
  videoShiftDownPx: 230,
  videoShiftFadePx: 260,
  headerTopY: 345,
  headerScrimHeight: 780,
  captionFontSize: 102,
  captionY: 1385,
  captionPlanner: "scene_dp_v1",
  footerChannelBar: false,
  captionLayout: "v2",
  emphasisTerms: Object.freeze(["하나로통신","ADSL","모뎀","초고속인터넷","60만 원","OECD"]),
  emphasisNumberPatterns: Object.freeze(["[0-9,.]+(?:만|억)","[0-9]+회선","[0-9]+위"]),
  captionEmphasisPop: true,
  captionGapBridgeSec: 0.3,
  captionLastSceneNoMargin: true,
  captionSceneEndMarginSec: 0.1,
  captionLeadSec: 0.12,
  hookType: "story",
  // 날짜·숫자 덩어리가 한 줄 한도(760px)에 안 들어가 가를 자리가 금지 경계뿐인 곳 — 사유와 함께 승인(2026-10-10).
  captionBoundaryExceptions: Object.freeze([
    { left: "한", right: "하나로통신은", reason: "'하나로통신은'(한 어절 8자)이 앞말과 한 줄에 안 들어가 '먼저 쓰기로 한 / 하나로통신은'으로 갈림(s15), TTS 재생성(유료) 회피(2026-10-10)" },
  ]),
  // 한 어절 자체가 폭 한도(760px)를 넘는 줄(2026-10-10): 줄바꿈으로 못 풀어 TTS 재생성(유료) 없이 안전폭 864px 이내에서 사유와 함께 승인.
  captionWidthExceptions: Object.freeze([
    { line: "시내전화만으로는", reason: "한 어절 8자 816px — 줄바꿈으로 못 품(안전폭 864 이내, 글자 크기 102px 유지)" },
  ]),
  render: STORY_RENDER,
  scenes: Object.freeze(STORY_EP9_FULL_SPEC.scenes.map((s) => Object.freeze({ ...s, overlays: [] }))),
});
