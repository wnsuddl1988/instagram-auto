/**
 * 스토리형 17편 — 프리챌 — 공짜 커뮤니티가 값을 매기자 비어 간 일 재연 장면 스펙 (2026-10-11, 기본 베이스 구조).
 *
 * 기준: `_ai/story-script-rules.md` + 확정 대본 `C:/tmp/story-ep17-freechal/scenes-v1.json`. 설계 `C:/tmp/story-ep17-freechal/story-design.json`.
 * TTS `C:/tmp/money-shorts-os/story-ep17-tts/output-v1/tempo-1.2-gap0.25-pre/…tempo1.2-gap0.25-pre.json`.
 * 화풍: 반사실 3D(storysemi). 1~14번 재연 장면 + 15번 부엉박사 진행자 컷.
 * 이미지 규칙(스토리형): 화면에 글자·숫자·로고·브랜드·회사 이름을 넣지 않는다(숫자는 자막이 맡는다). 실존 인물을 닮게 그리지 않는다
 * (얼굴이 크게 보이는 구도 금지, 뒷모습·멀리 있는 작은 모습·손과 소품). 소품은 두 손으로 감싸 쥐거나 탁자·바닥에 거치. 빈 면 금지.
 * 저작권 캐릭터·로고(미키·디즈니 성·마리오 등)는 그리지 않는다.
 *
 * 이미지 생성: ① 1~14번 `ALLOW_CHATGPT_IMAGE=1 node scripts/probe-character-consistency-chatgpt-v1.mjs --character storysemi --scene-spec ./_story-ep17-assembly-spec.mjs --scene-spec-export STORY_EP17_SEMI_SPEC --out-dir C:/tmp/story-ep17-images`
 *            ② 15번(부엉박사) `… --character owl3dv5 --scene-spec ./_story-ep17-assembly-spec.mjs --scene-spec-export STORY_EP17_END_SPEC --out-dir C:/tmp/story-ep17-images`
 */

const NO_TEXT = "화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).";
const motion = (action, mood) => ({ type: "scene", action, mood });

export const STORY_EP17_SEMI_SPEC = Object.freeze({
  specVersion: "story_assembly_spec_v1",
  scriptStructureVersion: "story_format_structure_v3",
  formatProfile: "story_v1",
  episode: 17,
  displayEpisode: 17,
  sourceCandidate: "story-ep17-freechal-paid-2002",
  title: "프리챌 — 공짜 커뮤니티가 값을 매기자 비어 간 일",
  channelName: "경제번역소",
  characterDisplayName: "부엉박사",
  imageCharacter: "storysemi",
  imagePrefix: "story_ep17",
  storyStyleOnlyIdentity:
    "2002년 한국 인터넷 커뮤니티 시절의 PC방과 사무실을 배경으로 한 재연 장면 시리즈의 한 장면이야. 실존 인물(대표)을 닮게 그리지 않고, 실제 서비스 이름·로고와 색을 흉내 내지 않아. 화풍: 고품질 반사실 3D CG 렌더링(시네마틱 게임 컷신·CG 다큐 재연 화면 같은 느낌) — 사람의 얼굴·눈·머리·몸 비율은 실제 사람처럼 사실적으로, 피부·옷·재질은 매끈한 CG 질감, 영화 같은 자연광과 부드러운 그림자, 차분하고 진지한 색감. 큰 눈·둥근 얼굴·과장된 만화 비율(픽사풍) 금지, 실제 사진처럼 보이는 실사도 금지. 장면 설명에 나오는 인물 외에는 아무도 그리지 마. 세로 9:16.",
  storySameStyleRule:
    "앞 장면들과 똑같은 반사실 3D CG 화풍(사실적인 사람 비율, 매끈한 CG 질감, 같은 시네마틱 조명·색감)을 유지해. 장면 설명에 없는 인물·글자·숫자·로고는 넣지 마. 얼굴을 크게 보이게 하지 말고 장면 설명대로 뒷모습·작은 모습·손과 소품 위주로 그려. 픽사풍 큰 눈·만화 비율 금지, 실사 사진 금지. 세로 9:16.",

  sceneBackgrounds: Object.freeze({
    A: { label: "사용료 안내만 새로 붙은 화면 앞 사람들(1번)", image: "2000년대 초 PC방. 모니터 앞에 앉은 사람들이 뒷모습으로 화면을 보고 있고, 화면에는 글자 없이 노란 안내 막대 하나만 새로 붙어 있다(얼굴 안 보임). 낮은 조명.", videoStyle: "an early-2000s internet cafe with people seen from behind facing monitors, each screen showing only one new yellow notice bar with no text, low lighting", videoStatics: "the internet cafe, the monitors, and the lighting" },
    B: { label: "수많은 작은 창이 모인 커뮤니티 화면 모형(2번)", image: "벽 하나를 가득 채운 수많은 작은 창이 격자로 모인 화면 모형. 창마다 무늬만 있고 글자·숫자 없음. 사람 없음. 푸른 모니터 불빛.", videoStyle: "a wall-sized grid of many small windows making a screen model, each window holding only patterns with no text or numbers, no people, blue monitor glow", videoStatics: "the grid wall, the small windows, and the blue glow" },
    C: { label: "서버실 앞에서 계산기를 두드리는 사람(3번)", image: "붐비는 서버실 앞에서 한 사람이 뒷모습으로 계산기를 두드리고 있다(얼굴 안 보임). 서버 불빛이 깜빡인다. 글자 없음. 낮은 조명.", videoStyle: "a person seen from behind pressing a calculator in front of a busy server room with blinking lights, no text, low lighting", videoStatics: "the server racks, the calculator, and the lighting" },
    D: { label: "공지 화면을 읽는 사람들(4번)", image: "사무실 모니터 앞에 모여 공지 화면을 읽는 사람 서넛의 작은 뒷모습. 화면에는 글자 없이 안내 막대만 보인다. 글자·로고 없음.", videoStyle: "a few small people seen from behind gathered in front of an office monitor reading a notice screen showing only a bar with no text, no logos", videoStatics: "the office, the monitor, and the lighting" },
    E: { label: "가는 수익 막대 옆의 아바타·광고 화면(5번)", image: "책상 위 모니터에 아바타 아이템과 광고 띠가 걸린 화면 모형이 있고, 그 옆에 가는 막대 하나만 선 수익 그래프 모형이 놓여 있다. 글자·숫자 없음. 사람 없음.", videoStyle: "a desk with a monitor showing a model of avatar items and an ad strip beside a profit chart model with only one thin bar, no text or numbers, no people", videoStatics: "the desk, the monitor, the chart model, and the lighting" },
    F: { label: "쌓여 가는 서버와 제자리의 작은 수익 상자(6번)", image: "점점 높이 쌓여 가는 서버 장비들과, 그 옆 바닥에 제자리에 있는 작은 상자 하나. 사람 없음. 글자 없음. 낮은 조명.", videoStyle: "server equipment stacking higher and higher with one small box staying in place on the floor beside it, no people, no text, low lighting", videoStatics: "the servers, the small box, and the lighting" },
    G: { label: "옆 건물의 무료 안내 간판 틀(7번)", image: "옆 건물 외벽에 크게 걸린 간판 틀에 글자 없이 노란 안내 띠만 붙어 있고, 길을 걷던 사람들의 작은 뒷모습이 그쪽으로 고개를 돌린다. 낮의 햇살.", videoStyle: "a large signboard frame on a neighboring building with only a plain yellow notice strip and no text, small people seen from behind on the street turning their heads toward it, daylight", videoStatics: "the building, the signboard frame, and the street" },
    H: { label: "한 화면의 글 묶음이 다른 화면으로 옮겨 가는 모습(8번)", image: "책상 위 두 모니터가 나란히 있고, 왼쪽 화면의 글 묶음 모양 블록들이 오른쪽 화면으로 하나씩 옮겨 가는 모습. 글자 없음. 사람 없음.", videoStyle: "two monitors side by side on a desk with text-like blocks on the left screen moving one by one to the right screen, no actual text, no people", videoStatics: "the desk, the two monitors, and the lighting" },
    I: { label: "갈림길 표지 앞에 선 운영자(9번)", image: "두 갈래 길 앞에 글자 없는 표지판 두 개가 서 있고, 한 사람이 뒷모습으로 서서 두 길을 번갈아 본다(얼굴 안 보임). 낮의 햇살.", videoStyle: "a fork in a road with two plain signposts holding no text and a person seen from behind standing and looking at each path in turn, daylight", videoStatics: "the fork, the two signposts, and the daylight" },
    J: { label: "클럽 이름 옆에 같은 사용료 표지가 붙은 화면(10번)", image: "화면 모형에 여러 클럽 아이콘이 줄지어 있고 아이콘마다 같은 노란 사용료 표지가 하나씩 붙어 있다. 글자·숫자 없음. 사람 없음.", videoStyle: "a screen model with rows of club icons each tagged with the same yellow fee marker, no text or numbers, no people", videoStatics: "the screen model, the icons, and the lighting" },
    K: { label: "불이 하나둘 꺼지는 창들(11번)", image: "벽 가득한 작은 창 격자 화면 모형에서 창들이 하나둘 어두워지고 있다. 글자·숫자 없음. 사람 없음. 푸른 불빛.", videoStyle: "a wall-sized grid screen model of small windows going dark one by one, no text or numbers, no people, blue glow", videoStatics: "the grid wall, the windows, and the blue glow" },
    L: { label: "절반 이하로 줄어든 창 격자(12번)", image: "빽빽하던 작은 창 격자 화면 모형이 절반 이하만 밝게 남고 나머지는 어둡다. 글자·숫자 없음. 사람 없음.", videoStyle: "the grid screen model of small windows with less than half still lit and the rest dark, no text or numbers, no people", videoStatics: "the grid wall, the lit windows, and the dark windows" },
    M: { label: "사용료 표지를 거두는 손과 비어 있는 화면(13번)", image: "화면 모형 위에서 노란 사용료 표지를 한 손이 거두어 가고, 그 아래 클럽 창들은 이미 비어 있다. 손만 보임. 글자 없음.", videoStyle: "a hand removing a yellow fee marker from a screen model with the club windows underneath already empty, hand only, no text", videoStatics: "the screen model, the empty windows, and the lighting" },
    N: { label: "꺼진 모니터와 닫힌 서비스 화면(14번)", image: "어두운 사무실 책상 위에 꺼진 모니터 한 대와 그 옆에 접어 둔 키보드. 사람 없음. 글자 없음. 푸른 새벽빛.", videoStyle: "a dark office desk with one switched-off monitor and a folded-away keyboard beside it, no people, no text, blue dawn light", videoStatics: "the desk, the dark monitor, the keyboard, and the dawn light" },
  }),

  scenes: Object.freeze([
    { scene: 1, key: "s1_hook", role: "hook", video: "story_ep17_s1_hook_motion.mp4",
      narration: "무료로 쓰던 커뮤니티가 어느 날 클럽 하나당 한 달 3,000원을 받겠다고 했어.",
      imageBrief: "2000년대 초 PC방. 모니터 앞에 앉은 사람들이 뒷모습으로 화면을 보고 있고, 화면에는 글자 없이 노란 안내 막대 하나만 새로 붙어 있다(얼굴 안 보임). 낮은 조명. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만). 구도 규칙(가장 중요): 카메라를 낮게 잡아 인물의 머리는 화면 세로 45%보다 아래(45~85% 구간)에 오게 하고, 화면 위쪽 40%에는 사람·머리가 하나도 없이 벽·창문·천장·조명·하늘 같은 배경만 보이게 해.",
      shot: "medium", bg: "A",
      lock: "the people stay seen from behind with no face ever shown; the screens keep no text or logos; nobody else enters.",
      motion: motion("one person leans forward toward the screen and tilts their head, the cafe and the monitors stay completely still", "something changed") },
    { scene: 2, key: "s2_who", role: "evidence", video: "story_ep17_s2_who_motion.mp4",
      narration: "회원이 1,000만 명대에 이르던 커뮤니티, 프리챌 이야기야.",
      imageBrief: "벽 하나를 가득 채운 수많은 작은 창이 격자로 모인 화면 모형. 창마다 무늬만 있고 글자·숫자 없음. 사람 없음. 푸른 모니터 불빛. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "wide", bg: "B",
      lock: "no people appear; the windows keep no text or numbers; the grid stays fixed.",
      motion: motion("a few windows light up one after another across the grid, the wall and the grid stay completely still", "a huge community") },
    { scene: 3, key: "s3_why", role: "core_question", video: "story_ep17_s3_why_motion.mp4",
      narration: "그만큼 잘 나가던 곳이 왜 갑자기 돈을 받겠다고 나섰을까?",
      imageBrief: "붐비는 서버실 앞에서 한 사람이 뒷모습으로 계산기를 두드리고 있다(얼굴 안 보임). 서버 불빛이 깜빡인다. 글자 없음. 낮은 조명. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만). 구도 규칙(가장 중요): 카메라를 낮게 잡아 인물의 머리는 화면 세로 45%보다 아래(45~85% 구간)에 오게 하고, 화면 위쪽 40%에는 사람·머리가 하나도 없이 벽·창문·천장·조명·하늘 같은 배경만 보이게 해.",
      shot: "medium", bg: "C",
      lock: "the people stay seen from behind with no face ever shown; the calculator and racks keep no text or logos; nobody else enters.",
      motion: motion("the person presses a few keys and pauses, the racks and the room stay completely still", "counting the cost") },
    { scene: 4, key: "s4_announce", role: "evidence", video: "story_ep17_s4_announce_motion.mp4",
      narration: "2002년 10월, 프리챌은 클럽 운영자에게 월 3,000원을 받는다고 알렸어.",
      imageBrief: "사무실 모니터 앞에 모여 공지 화면을 읽는 사람 서넛의 작은 뒷모습. 화면에는 글자 없이 안내 막대만 보인다. 글자·로고 없음. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "wide", bg: "D",
      lock: "the people stay small and seen from behind with no face shown; the screen keeps no text or logos; the office stays the same.",
      motion: motion("the people lean in together and one points at the screen, the office and the monitor stay completely still", "an announcement") },
    { scene: 5, key: "s5_reason", role: "evidence", video: "story_ep17_s5_reason_motion.mp4",
      narration: "회사의 이유는 이랬어. 아바타 판매와 배너 광고로는 늘어나는 이용자와 클럽을 감당하기 어렵다는 거였지.",
      imageBrief: "책상 위 모니터에 아바타 아이템과 광고 띠가 걸린 화면 모형이 있고, 그 옆에 가는 막대 하나만 선 수익 그래프 모형이 놓여 있다. 글자·숫자 없음. 사람 없음. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "close", bg: "E",
      lock: "no people appear; the monitor and chart keep no text or numbers; the desk stays fixed.",
      motion: motion("a soft light slides over the thin bar and fades, the desk and the monitor stay completely still", "thin earnings") },
    { scene: 6, key: "s6_server", role: "evidence", video: "story_ep17_s6_server_motion.mp4",
      narration: "이용자가 늘수록 서버 값은 늘어나는데, 들어오는 돈은 그만큼 늘지 않았던 거야.",
      imageBrief: "점점 높이 쌓여 가는 서버 장비들과, 그 옆 바닥에 제자리에 있는 작은 상자 하나. 사람 없음. 글자 없음. 낮은 조명. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "medium", bg: "F",
      lock: "no people appear; the servers and box keep no text or logos; the box stays in place.",
      motion: motion("the indicator lights on the servers blink faster while the small box stays untouched, the servers and the box stay completely still", "costs piling up") },
    { scene: 7, key: "s7_free", role: "evidence", video: "story_ep17_s7_free_motion.mp4",
      narration: "그런데 다른 커뮤니티들은 '평생 무료'를 내걸고 프리챌 회원을 끌어들이기 시작했어.",
      imageBrief: "옆 건물 외벽에 크게 걸린 간판 틀에 글자 없이 노란 안내 띠만 붙어 있고, 길을 걷던 사람들의 작은 뒷모습이 그쪽으로 고개를 돌린다. 낮의 햇살. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "wide", bg: "G",
      lock: "the people stay small and seen from behind with no face shown; the frame keeps no text or logos; the building stays fixed.",
      motion: motion("a few passersby turn toward the frame and slow down, the building and the frame stay completely still", "free next door") },
    { scene: 8, key: "s8_move", role: "evidence", video: "story_ep17_s8_move_motion.mp4",
      narration: "싸이월드와 드림위즈, 인티즌 같은 경쟁 사이트들은 프리챌 클럽의 글을 옮겨 주는 서비스까지 내놨지.",
      imageBrief: "책상 위 두 모니터가 나란히 있고, 왼쪽 화면의 글 묶음 모양 블록들이 오른쪽 화면으로 하나씩 옮겨 가는 모습. 글자 없음. 사람 없음. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "medium", bg: "H",
      lock: "no people appear; the screens keep no text or logos; the desk stays fixed.",
      motion: motion("the blocks slide across from the left screen to the right screen one after another, the desk and the monitors stay completely still", "moving out") },
    { scene: 9, key: "s9_twoways", role: "evidence", video: "story_ep17_s9_twoways_motion.mp4",
      narration: "운영자들 앞에는 두 길이 놓였어. 값을 내고 남거나, 클럽을 옮겨 가거나.",
      imageBrief: "두 갈래 길 앞에 글자 없는 표지판 두 개가 서 있고, 한 사람이 뒷모습으로 서서 두 길을 번갈아 본다(얼굴 안 보임). 낮의 햇살. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만). 구도 규칙(가장 중요): 카메라를 낮게 잡아 인물의 머리는 화면 세로 45%보다 아래(45~85% 구간)에 오게 하고, 화면 위쪽 40%에는 사람·머리가 하나도 없이 벽·창문·천장·조명·하늘 같은 배경만 보이게 해.",
      shot: "medium", bg: "I",
      lock: "the people stay seen from behind with no face ever shown; the signposts keep no text or logos; nobody else enters.",
      motion: motion("the person turns their head left then right and exhales, the fork and the signposts stay completely still", "which way") },
    { scene: 10, key: "s10_start", role: "evidence", video: "story_ep17_s10_start_motion.mp4",
      narration: "11월 중순부터, 프리챌의 모든 클럽에 월 3,000원이 붙었어.",
      imageBrief: "화면 모형에 여러 클럽 아이콘이 줄지어 있고 아이콘마다 같은 노란 사용료 표지가 하나씩 붙어 있다. 글자·숫자 없음. 사람 없음. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "close", bg: "J",
      lock: "no people appear; the icons and markers keep no text or numbers; the screen stays fixed.",
      motion: motion("the yellow markers light up one after another down the rows, the screen and the icons stay completely still", "the fee begins") },
    { scene: 11, key: "s11_left", role: "core_question", video: "story_ep17_s11_left_motion.mp4",
      narration: "그 뒤 클럽은 얼마나 남았을까?",
      imageBrief: "벽 가득한 작은 창 격자 화면 모형에서 창들이 하나둘 어두워지고 있다. 글자·숫자 없음. 사람 없음. 푸른 불빛. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "wide", bg: "K",
      lock: "no people appear; the windows keep no text or numbers; the grid stays fixed.",
      motion: motion("windows across the grid dim one after another, the wall and the grid stay completely still", "how many remain") },
    { scene: 12, key: "s12_drop", role: "evidence", video: "story_ep17_s12_drop_motion.mp4",
      narration: "110만 개였던 클럽이 40만 개로 줄었어.",
      imageBrief: "빽빽하던 작은 창 격자 화면 모형이 절반 이하만 밝게 남고 나머지는 어둡다. 글자·숫자 없음. 사람 없음. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "wide", bg: "L",
      lock: "no people appear; the windows keep no text or numbers; the grid stays fixed.",
      motion: motion("the remaining lit windows flicker once and steady, the wall and the grid stay completely still", "far fewer") },
    { scene: 13, key: "s13_late", role: "evidence", video: "story_ep17_s13_late_motion.mp4",
      narration: "이듬해 프리챌은 유료화를 번복했지만, 디지털데일리는 회생하기엔 이미 늦은 시기였다고 짚었어.",
      imageBrief: "화면 모형 위에서 노란 사용료 표지를 한 손이 거두어 가고, 그 아래 클럽 창들은 이미 비어 있다. 손만 보임. 글자 없음. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "close", bg: "M",
      lock: "no face or body appears — only the hand; the screen keeps no text or numbers; the model stays fixed.",
      motion: motion("the hand lifts the marker away and withdraws, the screen and the windows stay completely still", "too late") },
    { scene: 14, key: "s14_end", role: "evidence", video: "story_ep17_s14_end_motion.mp4",
      narration: "2013년 2월, 프리챌은 서비스를 끝냈지.",
      imageBrief: "어두운 사무실 책상 위에 꺼진 모니터 한 대와 그 옆에 접어 둔 키보드. 사람 없음. 글자 없음. 푸른 새벽빛. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "medium", bg: "N",
      lock: "no people appear; the monitor keeps no text or logos; the desk stays fixed.",
      motion: motion("the dawn light brightens slowly across the dark screen, the desk and the monitor stay completely still", "the end") },
  ]),
});

// ── 15번(부엉박사 마무리) — owl3dv5 스펙으로 따로 생성 ──
export const STORY_EP17_END_SPEC = Object.freeze({
  specVersion: "story_assembly_spec_v1",
  episode: 17,
  imageCharacter: "owl3dv5",
  imagePrefix: "story_ep17",
  sceneBackgrounds: Object.freeze({
    P: { label: "PC방 앞마당(15번 부엉박사)", image: "밝은 오후 한국 거리의 PC방 입구 앞. 부엉박사 뒤로 글자 없는 건물 외벽과 열린 유리문, 바닥에 놓인 작은 입간판 하나(글자 없음). 바닥은 매끈한 연한 회색 포장, 따뜻한 오후 빛.", videoStyle: "bright afternoon in front of an internet cafe entrance on a Korean street with a plain building facade, an open glass door, and one small standing sign with no text, smooth light gray pavement", videoStatics: "the plain facade, the open glass door, the small sign, the smooth light gray pavement, and the warm afternoon light" },
  }),
  scenes: Object.freeze([
    {
      scene: 15, key: "s15_close", role: "save", video: "story_ep17_s15_close_motion.mp4",
      narration: "공짜 옆에 또 다른 공짜가 있으면, 값을 매긴 쪽이 먼저 비게 돼. 한때 앞서던 곳도 값을 받는 날부터는 이용자를 붙잡을 수 없었지. 프리챌의 다음 이야기가 궁금하면 팔로우해 줘.",
      imageBrief: "부엉이가 정면을 보며 한쪽 날개를 가슴 앞에 가볍게 모아 차분히 정리해 주는 듯한 따뜻한 표정으로 시청자에게 말하는 포즈, 다른 날개는 자연스럽게 내리고 소품은 들지 않음. 구도 규칙(가장 중요): 부엉이는 화면 아래쪽 절반(세로 45~95%)에 서 있고 머리·얼굴·선글라스는 세로 45%보다 아래에 오게 하며, 화면 위쪽 40%에는 부엉이 없이 건물·하늘·조명 같은 배경만 보이게 해.",
      shot: "medium", bg: "P",
      lock: "the facade and the sign stay fixed; the sunglasses stay on top of the head; no props are held.",
      speaks: true,
      motion: motion("the character gestures gently with one wing at chest height while summarizing, then gives a small warm nod to the viewer; no props are held", "warm summary and invitation to follow"),
    },
  ]),
});

// ── 조립 스펙(run-owl-assemble-shorts-v2.mjs) — 제목은 ★임시안(Owner 확정 필요) ──
// 조립: node scripts/run-owl-assemble-shorts-v2.mjs --spec-module ./_story-ep17-assembly-spec.mjs --spec-export STORY_EP17_ASSEMBLE_SPEC --clip-dir C:/tmp/story-ep17-clips-named --audio-summary C:/tmp/money-shorts-os/story-ep17-tts/output-v1/tempo-1.2-gap0.25-pre/elevenlabs-scene-paced-tts-summary.audio-fixed.tempo1.2-gap0.25-pre.json --tts-script C:/tmp/money-shorts-os/story-ep17-tts/story-ep17-tts-script.json --out-dir C:/tmp/story-ep17-assembled
const STORY_RENDER = Object.freeze({
  width: 1080, height: 1920, fps: 24, videoCodec: "libx264", crf: 18, pixFmt: "yuv420p",
  audioCodec: "aac", audioBitrate: "192k", audioSampleRate: 48000, audioChannels: 1,
});

export const STORY_EP17_FULL_SPEC = Object.freeze({
  ...STORY_EP17_SEMI_SPEC,
  sceneBackgrounds: Object.freeze({ ...STORY_EP17_SEMI_SPEC.sceneBackgrounds, ...STORY_EP17_END_SPEC.sceneBackgrounds }),
  scenes: Object.freeze([...STORY_EP17_SEMI_SPEC.scenes, ...STORY_EP17_END_SPEC.scenes]),
});

export const STORY_EP17_ASSEMBLE_SPEC = Object.freeze({
  ...STORY_EP17_FULL_SPEC,
  headerTitle: Object.freeze(["공짜 커뮤니티가","값을 매기자","비어 간 프리챌"]),
  videoShiftDownPx: 230,
  videoShiftFadePx: 260,
  headerTopY: 345,
  headerScrimHeight: 780,
  captionFontSize: 102,
  captionY: 1385,
  captionPlanner: "scene_dp_v1",
  footerChannelBar: false,
  captionLayout: "v2",
  emphasisTerms: Object.freeze(["프리챌","클럽","3,000원","무료","공짜","110만","40만"]),
  emphasisNumberPatterns: Object.freeze(["[0-9,.]+%","[0-9]+배","[0-9]+명","[0-9,.]+억","[0-9,.]+만"]),
  captionEmphasisPop: true,
  captionGapBridgeSec: 0.3,
  captionLastSceneNoMargin: true,
  captionSceneEndMarginSec: 0.1,
  captionLeadSec: 0.12,
  hookType: "story",
  render: STORY_RENDER,
  scenes: Object.freeze(STORY_EP17_FULL_SPEC.scenes.map((s) => Object.freeze({ ...s, overlays: [] }))),
});
