/**
 * 스토리형 12편 — 디즈니 — 이름을 숨기고 사 모은 땅 재연 장면 스펙 (2026-10-11, 기본 베이스 구조).
 *
 * 기준: `_ai/story-script-rules.md` + 확정 대본 `C:/tmp/story-ep12-disney-florida/scenes-v5.json`. 설계 `C:/tmp/story-ep12-disney-florida/story-design.json`.
 * TTS `C:/tmp/money-shorts-os/story-ep12-tts/output-v1/tempo-1.2-gap0.25-pre/…tempo1.2-gap0.25-pre.json`.
 * 화풍: 반사실 3D(storysemi). 1~15번 재연 장면 + 16번 부엉박사 진행자 컷.
 * 이미지 규칙(스토리형): 화면에 글자·숫자·로고·브랜드·회사 이름을 넣지 않는다(숫자는 자막이 맡는다). 실존 인물을 닮게 그리지 않는다
 * (얼굴이 크게 보이는 구도 금지, 뒷모습·멀리 있는 작은 모습·손과 소품). 소품은 두 손으로 감싸 쥐거나 탁자·바닥에 거치. 빈 면 금지.
 * 저작권 캐릭터·로고(미키·디즈니 성·마리오 등)는 그리지 않는다.
 *
 * 이미지 생성: ① 1~15번 `ALLOW_CHATGPT_IMAGE=1 node scripts/probe-character-consistency-chatgpt-v1.mjs --character storysemi --scene-spec ./_story-ep12-assembly-spec.mjs --scene-spec-export STORY_EP12_SEMI_SPEC --out-dir C:/tmp/story-ep12-images`
 *            ② 16번(부엉박사) `… --character owl3dv5 --scene-spec ./_story-ep12-assembly-spec.mjs --scene-spec-export STORY_EP12_END_SPEC --out-dir C:/tmp/story-ep12-images`
 */

const NO_TEXT = "화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).";
const motion = (action, mood) => ({ type: "scene", action, mood });

export const STORY_EP12_SEMI_SPEC = Object.freeze({
  specVersion: "story_assembly_spec_v1",
  scriptStructureVersion: "story_format_structure_v3",
  formatProfile: "story_v1",
  episode: 12,
  displayEpisode: 12,
  sourceCandidate: "story-ep12-disney-florida-land",
  title: "디즈니 — 이름을 숨기고 사 모은 땅",
  channelName: "경제번역소",
  characterDisplayName: "부엉박사",
  imageCharacter: "storysemi",
  imagePrefix: "story_ep12",
  storyStyleOnlyIdentity:
    "1960년대 미국 플로리다 올랜도 일대와 신문사·사무실을 배경으로 한 재연 장면 시리즈의 한 장면이야. 실존 인물(월트 디즈니·에밀리 바바르·주지사)을 닮게 그리지 않고, 디즈니 캐릭터·성·로고는 그리지 않아. 화풍: 고품질 반사실 3D CG 렌더링(시네마틱 게임 컷신·CG 다큐 재연 화면 같은 느낌) — 사람의 얼굴·눈·머리·몸 비율은 실제 사람처럼 사실적으로, 피부·옷·재질은 매끈한 CG 질감, 영화 같은 자연광과 부드러운 그림자, 차분하고 진지한 색감. 큰 눈·둥근 얼굴·과장된 만화 비율(픽사풍) 금지, 실제 사진처럼 보이는 실사도 금지. 장면 설명에 나오는 인물 외에는 아무도 그리지 마. 세로 9:16.",
  storySameStyleRule:
    "앞 장면들과 똑같은 반사실 3D CG 화풍(사실적인 사람 비율, 매끈한 CG 질감, 같은 시네마틱 조명·색감)을 유지해. 장면 설명에 없는 인물·글자·숫자·로고는 넣지 마. 얼굴을 크게 보이게 하지 말고 장면 설명대로 뒷모습·작은 모습·손과 소품 위주로 그려. 픽사풍 큰 눈·만화 비율 금지, 실사 사진 금지. 세로 9:16.",

  sceneBackgrounds: Object.freeze({
    A: { label: "신문을 펼친 식당 탁자(1번)", image: "1960년대 올랜도의 아침 식당 탁자 위에 글자 없는 신문 한 부가 펼쳐져 있고, 한 사람이 뒷모습으로 앉아 1면을 내려다본다(얼굴 안 보임). 신문 1면에는 땅 지도 모양 무늬만 있다. 창으로 아침 햇살.", videoStyle: "a 1960s Orlando morning diner table with an opened plain newspaper and one person seen from behind looking down at the front page showing only a map-like pattern, morning sunlight through the window", videoStatics: "the table, the opened newspaper, and the diner window" },
    B: { label: "늪지와 목장 평원 전경(2번)", image: "넓은 늪지와 목장 평원을 높은 곳에서 내려다본 전경. 사람 없음. 멀리 고속도로 한 줄이 가로지른다. 새벽 안개. 간판·글자 없음.", videoStyle: "wide high view over wide wetlands and ranch plains, no people, one distant highway line crossing, dawn mist, no signs or text", videoStatics: "the wetlands, the ranch plains, the distant highway line, and the dawn mist" },
    C: { label: "도장을 찍는 등기 서류(3번)", image: "등기 사무실 책상 위에 서류 몇 장과 인주가 놓여 있고, 한 손이 글자 없는 서류 위에 둥근 도장을 찍는다. 손만 보이고 얼굴은 그리지 마. 따뜻한 조명.", videoStyle: "close view of a registry office desk with a few plain documents and an ink pad, one hand pressing a round stamp onto a plain document, hand only, warm light", videoStatics: "the desk, the documents, the ink pad, and the warm light" },
    D: { label: "맨해튼 두 배 땅 윤곽 지도(4번)", image: "큰 책상 위 지도. 작은 섬 모양 윤곽 위에 그보다 두 배쯤 큰 땅 윤곽이 반투명하게 겹쳐 놓여 있다. 글자·숫자·지명 없음. 사람 없음.", videoStyle: "close view of a large desk map with a small island outline and a translucent land outline about twice as big laid over it, no text, numbers or place names, no people", videoStatics: "the desk, the map, and the two outlines" },
    E: { label: "물음표로 흩어진 핀(5번)", image: "벽에 붙은 넓은 지도에 핀들이 물음표 모양으로 흩어져 꽂혀 있고, 한 사람이 뒷모습으로 서서 올려다본다(얼굴 안 보임). 지도에 글자 없음.", videoStyle: "a wide wall map with pins scattered in a question-mark shape and one person seen from behind looking up at it, no text on the map", videoStatics: "the wall map with the pins and the wall" },
    F: { label: "사무실에서 마주 앉은 두 사람(6번)", image: "스튜디오 사무실. 마주 앉은 두 사람의 뒷모습(한 사람은 수첩을 든 정장 차림 여성, 맞은편은 중년 남성). 탁자 위에 연필과 수첩. 따뜻한 낮빛. 얼굴 안 보임.", videoStyle: "a studio office with two people seated facing each other seen from behind, one in a suit holding a notebook and the other a middle-aged man, a pencil and notebook on the table, warm daylight", videoStatics: "the table, the notebook, the pencil, and the office walls" },
    G: { label: "작은 놀이공원 모형을 가리키는 손(7번)", image: "책상 위 근접 장면. 글자·로고 없는 작은 놀이공원 모형(놀이기구 몇 개와 나무)을 한 손이 가리키며 반쯤 웃는 손짓을 한다. 손만. 따뜻한 조명.", videoStyle: "close view of a small plain amusement park model with a few rides and trees on a desk and one hand pointing at it with a half-smiling gesture, hand only, warm light", videoStatics: "the desk, the small model, and the warm light" },
    H: { label: "토지 등기부를 넘기는 손(8번)", image: "토지 등기부를 한 장씩 넘기는 손과 옆에 놓인 글자 없는 지도 위의 핀 하나. 손만 보임. 차분한 조명.", videoStyle: "close view of a hand turning pages of a land ledger beside a plain map with one pin on it, hand only, calm light", videoStatics: "the desk, the ledger, the plain map, and the calm light" },
    I: { label: "기사를 치는 타자기(9번)", image: "타자기 위 손가락이 기사를 치고 있고 종이에는 글자처럼 보이는 선이 아니라 무늬만 있다. 손만 보임. 늦은 오후 빛.", videoStyle: "close view of fingers typing on a typewriter with a sheet showing only plain marks, hands only, late afternoon light", videoStatics: "the typewriter, the sheet, and the late afternoon light" },
    J: { label: "1면을 바꾸는 편집실(10번)", image: "신문사 편집실. 여러 사람이 큰 탁자 위의 1면 레이아웃(글자 없는 큰 사각형들)을 내려다보며 뒷모습으로 조판을 바꾼다(얼굴 안 보임). 형광등.", videoStyle: "a newspaper editing room with several people seen from behind rearranging a front page layout of plain large rectangles on a big table, fluorescent light", videoStatics: "the big table, the layout rectangles, and the editing room walls" },
    K: { label: "가격 푯말을 높이 올려 세우는 실루엣(11번)", image: "넓은 목장 울타리 앞에서 한 사람이 빈 나무 가격 푯말을 높이 올려 세우는 실루엣(뒷모습, 푯말에 글자 없음). 저녁 노을.", videoStyle: "in front of a wide ranch fence a person seen from behind in silhouette raising a plain blank wooden price board higher, evening glow, no text", videoStatics: "the ranch fence, the open land, and the evening sky" },
    L: { label: "서류에 서명하는 손(12번)", image: "큰 책상 위 서류에 한 손이 서명하고 옆에 만년필 뚜껑이 놓여 있다. 서류에 글자 없음. 손만. 따뜻한 조명.", videoStyle: "close view of a hand signing a plain document on a large desk with a pen cap beside it, hand only, warm light", videoStatics: "the large desk, the document, the pen cap, and the warm light" },
    M: { label: "기자회견 연단과 계획 모형(13번)", image: "기자회견장. 연단 앞에 선 사람들의 뒷모습과 탁자 위의 글자 없는 대형 계획 모형(호수·도로·건물 블록). 카메라 플래시 같은 하얀 빛이 한 번 터진다. 얼굴 안 보임.", videoStyle: "a press conference hall with people standing at a podium seen from behind and a large plain planning model of a lake, roads and building blocks on a table, a white flash like cameras once", videoStatics: "the podium, the planning model, and the hall walls" },
    N: { label: "한쪽만 높이 솟은 빈 푯말들(14번)", image: "들판에 빈 나무 가격 푯말들이 줄지어 서 있고 오른쪽 한 푯말만 훨씬 높게 솟아 있다. 글자·숫자 없음. 사람 없음. 낮의 햇살.", videoStyle: "a field with a row of blank wooden price boards and the rightmost one standing far taller, no text or numbers, no people, daylight", videoStatics: "the field, the row of blank boards, and the daylight" },
    O: { label: "넓은 리조트 단지 전경(15번)", image: "넓은 호수와 리조트 단지 전경. 놀이기구 레일과 큰 광장, 잔디, 멀리 열기구 하나. 성·캐릭터·로고·글자 없음. 사람 없음. 환한 낮빛.", videoStyle: "wide view of a large lake and resort complex with ride tracks, a big plaza, lawns and one distant hot air balloon, no castle, characters, logos or text, no people, bright daylight", videoStatics: "the lake, the resort buildings, the ride tracks, and the plaza" },
  }),

  scenes: Object.freeze([
    { scene: 1, key: "s1_hook", role: "hook", video: "story_ep12_s1_hook_motion.mp4",
      narration: "1965년 10월, 플로리다 올랜도의 신문에 이상한 기사가 실렸어.",
      imageBrief: "1960년대 올랜도의 아침 식당 탁자 위에 글자 없는 신문 한 부가 펼쳐져 있고, 한 사람이 뒷모습으로 앉아 1면을 내려다본다(얼굴 안 보임). 신문 1면에는 땅 지도 모양 무늬만 있다. 창으로 아침 햇살. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만). 구도 규칙(가장 중요): 카메라를 낮게 잡아 인물의 머리는 화면 세로 45%보다 아래(45~85% 구간)에 오게 하고, 화면 위쪽 40%에는 사람·머리가 하나도 없이 벽·창문·천장·조명·하늘 같은 배경만 보이게 해.",
      shot: "medium", bg: "A",
      lock: "the people stay seen from behind with no face ever shown and do not resemble any real person; the newspaper keeps only plain map patterns with no text or numbers; nobody else enters.",
      motion: motion("the person smooths the newspaper with one hand and leans a little closer, the table and the window stay completely still", "a strange article") },
    { scene: 2, key: "s2_mystery", role: "evidence", video: "story_ep12_s2_mystery_motion.mp4",
      narration: "3만 에이커 땅을 누군가 조용히 사들였는데, 누구인지 아무도 모른다는 거였지.",
      imageBrief: "넓은 늪지와 목장 평원을 높은 곳에서 내려다본 전경. 사람 없음. 멀리 고속도로 한 줄이 가로지른다. 새벽 안개. 간판·글자 없음. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "wide", bg: "B",
      lock: "no people appear; no signs, text or logos; the landscape layout stays the same.",
      motion: motion("the dawn mist drifts slowly across the plains and a faint light spreads, the wetlands and the highway line stay completely still", "someone quietly bought it") },
    { scene: 3, key: "s3_company", role: "evidence", video: "story_ep12_s3_company_motion.mp4",
      narration: "산 쪽은 사람 이름이 아니라 '에이포 회사' 같은 회사 이름뿐이었어.",
      imageBrief: "등기 사무실 책상 위에 서류 몇 장과 인주가 놓여 있고, 한 손이 글자 없는 서류 위에 둥근 도장을 찍는다. 손만 보이고 얼굴은 그리지 마. 따뜻한 조명. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "close", bg: "C",
      lock: "no face or body appears — only the hand; the documents keep no text or numbers; the desk stays fixed.",
      motion: motion("the hand lifts the stamp and presses it down again on the next document, the desk and the documents stay completely still", "names on paper only") },
    { scene: 4, key: "s4_cheap", role: "evidence", video: "story_ep12_s4_cheap_motion.mp4",
      narration: "거의 2년 동안, 맨해튼의 두 배쯤 되는 땅이 평당 1달러도 안 되는 값에 팔렸지.",
      imageBrief: "큰 책상 위 지도. 작은 섬 모양 윤곽 위에 그보다 두 배쯤 큰 땅 윤곽이 반투명하게 겹쳐 놓여 있다. 글자·숫자·지명 없음. 사람 없음. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "close", bg: "D",
      lock: "no people appear; the map keeps only plain outlines with no text or numbers; the desk stays fixed.",
      motion: motion("a soft light sweeps once across the larger outline and settles, the desk and the map stay completely still", "twice the island") },
    { scene: 5, key: "s5_who_question", role: "core_question", video: "story_ep12_s5_who_question_motion.mp4",
      narration: "도대체 누가 이 땅을 사고 있었을까?",
      imageBrief: "벽에 붙은 넓은 지도에 핀들이 물음표 모양으로 흩어져 꽂혀 있고, 한 사람이 뒷모습으로 서서 올려다본다(얼굴 안 보임). 지도에 글자 없음. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만). 구도 규칙(가장 중요): 카메라를 낮게 잡아 인물의 머리는 화면 세로 45%보다 아래(45~85% 구간)에 오게 하고, 화면 위쪽 40%에는 사람·머리가 하나도 없이 벽·창문·천장·조명·하늘 같은 배경만 보이게 해.",
      shot: "medium", bg: "E",
      lock: "the people stay seen from behind with no face ever shown and do not resemble any real person; the map keeps only plain lines with no text; nobody else enters.",
      motion: motion("the person lifts a hand and taps one pin then lowers it, the map and the wall stay completely still", "who is buying") },
    { scene: 6, key: "s6_bavar", role: "evidence", video: "story_ep12_s6_bavar_motion.mp4",
      narration: "그걸 파고든 신문사 편집자 에밀리 바바르는 캘리포니아까지 날아가 월트 디즈니를 만났어. 디즈니는 인정도 부인도 하지 않았지.",
      imageBrief: "스튜디오 사무실. 마주 앉은 두 사람의 뒷모습(한 사람은 수첩을 든 정장 차림 여성, 맞은편은 중년 남성). 탁자 위에 연필과 수첩. 따뜻한 낮빛. 얼굴 안 보임. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만). 구도 규칙(가장 중요): 카메라를 낮게 잡아 인물의 머리는 화면 세로 45%보다 아래(45~85% 구간)에 오게 하고, 화면 위쪽 40%에는 사람·머리가 하나도 없이 벽·창문·천장·조명·하늘 같은 배경만 보이게 해.",
      shot: "medium", bg: "F",
      lock: "the people stay seen from behind with no face ever shown and do not resemble any real person; the notebook keeps no text; nobody else enters.",
      motion: motion("the person with the notebook tilts her head as the man opposite leans back slightly, the table and the office stay completely still", "neither yes nor no") },
    { scene: 7, key: "s7_only_one", role: "evidence", video: "story_ep12_s7_only_one_motion.mp4",
      narration: "자기가 샀다는 소문까지 들었다고만 했어. 그러고는 덧붙였지. 디즈니랜드는 하나뿐이라고. \"그 자체로는.\"",
      imageBrief: "책상 위 근접 장면. 글자·로고 없는 작은 놀이공원 모형(놀이기구 몇 개와 나무)을 한 손이 가리키며 반쯤 웃는 손짓을 한다. 손만. 따뜻한 조명. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "close", bg: "G",
      lock: "no face or body appears — only the hand; the model keeps no text, logos or characters; the desk stays fixed.",
      motion: motion("the hand lifts a finger once as if making a point and then rests on the desk, the model and the desk stay completely still", "a hint without a yes") },
    { scene: 8, key: "s8_anaheim", role: "evidence", video: "story_ep12_s8_anaheim_motion.mp4",
      narration: "돌아온 바바르는 땅 기록을 뒤졌어. 이웃한 땅을 산 돈은 디즈니랜드가 있는 애너하임에서 온 돈이었지.",
      imageBrief: "토지 등기부를 한 장씩 넘기는 손과 옆에 놓인 글자 없는 지도 위의 핀 하나. 손만 보임. 차분한 조명. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "close", bg: "H",
      lock: "no face or body appears — only the hand; the ledger and the map keep no text or numbers; the desk stays fixed.",
      motion: motion("the hand turns one page and stops with a fingertip pointing at a line, the desk and the map stay completely still", "a clue in the records") },
    { scene: 9, key: "s9_oct21", role: "evidence", video: "story_ep12_s9_oct21_motion.mp4",
      narration: "10월 21일, 그는 신문에 썼어. 미스터리 산업 부지는 디즈니의 사업이라고 믿는다고.",
      imageBrief: "타자기 위 손가락이 기사를 치고 있고 종이에는 글자처럼 보이는 선이 아니라 무늬만 있다. 손만 보임. 늦은 오후 빛. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "close", bg: "I",
      lock: "no face or body appears — only the fingers; the sheet keeps only abstract marks with no readable text; the desk stays fixed.",
      motion: motion("the fingers type a few keys steadily and the carriage returns once, the typewriter and the desk stay completely still", "writing the guess") },
    { scene: 10, key: "s10_underplayed", role: "evidence", video: "story_ep12_s10_underplayed_motion.mp4",
      narration: "편집부는 처음엔 그 기사를 작게 다뤘어. 사흘 뒤에야 1면에 '미스터리 산업은 디즈니'라고 썼지.",
      imageBrief: "신문사 편집실. 여러 사람이 큰 탁자 위의 1면 레이아웃(글자 없는 큰 사각형들)을 내려다보며 뒷모습으로 조판을 바꾼다(얼굴 안 보임). 형광등. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만). 구도 규칙(가장 중요): 카메라를 낮게 잡아 인물의 머리는 화면 세로 45%보다 아래(45~85% 구간)에 오게 하고, 화면 위쪽 40%에는 사람·머리가 하나도 없이 벽·창문·천장·조명·하늘 같은 배경만 보이게 해.",
      shot: "medium", bg: "J",
      lock: "the people stay seen from behind with no face ever shown and do not resemble any real person; the layout keeps only plain rectangles with no text; nobody else enters.",
      motion: motion("one person slides the large rectangle to the top of the layout while the others watch, the table and the room stay completely still", "from small to front page") },
    { scene: 11, key: "s11_why_hide", role: "evidence", video: "story_ep12_s11_why_hide_motion.mp4",
      narration: "디즈니가 이름을 숨긴 이유는 하나였어. 땅 주인들이 알면 값부터 올릴 테니까.",
      imageBrief: "넓은 목장 울타리 앞에서 한 사람이 빈 나무 가격 푯말을 높이 올려 세우는 실루엣(뒷모습, 푯말에 글자 없음). 저녁 노을. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만). 구도 규칙(가장 중요): 카메라를 낮게 잡아 인물의 머리는 화면 세로 45%보다 아래(45~85% 구간)에 오게 하고, 화면 위쪽 40%에는 사람·머리가 하나도 없이 벽·창문·천장·조명·하늘 같은 배경만 보이게 해.",
      shot: "medium", bg: "K",
      lock: "the people stay seen from behind with no face ever shown and do not resemble any real person; the board stays blank with no text or numbers; nobody else enters.",
      motion: motion("the person lifts the blank board a little higher and steadies it, the fence and the land stay completely still", "price goes up when they know") },
    { scene: 12, key: "s12_governor", role: "core_question", video: "story_ep12_s12_governor_motion.mp4",
      narration: "비밀이 새자 디즈니는 어떻게 했을까? 주지사가 사실을 확인해도 된다고 허락했지.",
      imageBrief: "큰 책상 위 서류에 한 손이 서명하고 옆에 만년필 뚜껑이 놓여 있다. 서류에 글자 없음. 손만. 따뜻한 조명. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "close", bg: "L",
      lock: "no face or body appears — only the hand; the document keeps no readable text; the desk stays fixed.",
      motion: motion("the hand finishes the signature and lifts the pen, the desk and the document stay completely still", "permission to confirm") },
    { scene: 13, key: "s13_nov15", role: "evidence", video: "story_ep12_s13_nov15_motion.mp4",
      narration: "11월 15일, 월트와 형 로이는 주지사와 함께 공식 발표를 했어. 계획의 이름은 '플로리다 프로젝트'.",
      imageBrief: "기자회견장. 연단 앞에 선 사람들의 뒷모습과 탁자 위의 글자 없는 대형 계획 모형(호수·도로·건물 블록). 카메라 플래시 같은 하얀 빛이 한 번 터진다. 얼굴 안 보임. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만). 구도 규칙(가장 중요): 카메라를 낮게 잡아 인물의 머리는 화면 세로 45%보다 아래(45~85% 구간)에 오게 하고, 화면 위쪽 40%에는 사람·머리가 하나도 없이 벽·창문·천장·조명·하늘 같은 배경만 보이게 해.",
      shot: "medium", bg: "M",
      lock: "the people stay seen from behind with no face ever shown and do not resemble any real person; the model keeps no text, logos or characters; nobody else enters.",
      motion: motion("a white flash lights the model once and the people lean slightly forward, the podium and the model stay completely still", "the announcement") },
    { scene: 14, key: "s14_mult650", role: "evidence", video: "story_ep12_s14_mult650_motion.mp4",
      narration: "공식 글에 따르면 발표 직후 근처 땅은 에이커당 13만 1천 달러에 팔렸어. 디즈니가 낸 값의 650배가 넘었지.",
      imageBrief: "들판에 빈 나무 가격 푯말들이 줄지어 서 있고 오른쪽 한 푯말만 훨씬 높게 솟아 있다. 글자·숫자 없음. 사람 없음. 낮의 햇살. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "medium", bg: "N",
      lock: "no people appear; the boards stay blank with no text or numbers; the row arrangement stays the same.",
      motion: motion("a soft light travels along the row and rests on the tallest board, the field and the boards stay completely still", "price jumped") },
    { scene: 15, key: "s15_disneyworld", role: "evidence", video: "story_ep12_s15_disneyworld_motion.mp4",
      narration: "평당 1달러도 안 되는 값에 모은 2만 7천 에이커 위에, 훗날 디즈니월드가 들어섰어.",
      imageBrief: "넓은 호수와 리조트 단지 전경. 놀이기구 레일과 큰 광장, 잔디, 멀리 열기구 하나. 성·캐릭터·로고·글자 없음. 사람 없음. 환한 낮빛. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "wide", bg: "O",
      lock: "no people appear; no castle, character, logo or text appears; the layout stays the same.",
      motion: motion("the hot air balloon drifts slowly and sunlight glitters on the lake, the buildings and the tracks stay completely still", "what rose on that land") },
  ]),
});

// ── 16번(부엉박사 마무리) — owl3dv5 스펙으로 따로 생성 ──
export const STORY_EP12_END_SPEC = Object.freeze({
  specVersion: "story_assembly_spec_v1",
  episode: 12,
  imageCharacter: "owl3dv5",
  imagePrefix: "story_ep12",
  sceneBackgrounds: Object.freeze({
    P: { label: "리조트 입구 광장(16번 부엉박사)", image: "밝은 오후 넓은 잔디 광장. 부엉박사 뒤로 둥근 분수대와 낮은 화단, 멀리 놀이기구 레일과 열기구 하나. 성·탑·깃발·지도 패널·캐릭터·글자 없음. 바닥은 매끈한 연한 회색 포장, 따뜻한 오후 햇빛.", videoStyle: "bright afternoon on a wide lawn plaza with a round fountain, low flower beds, distant ride tracks and one hot air balloon, no castle, towers, flags, map panels, characters or text, smooth light gray pavement, warm afternoon light", videoStatics: "the round fountain, the flower beds, the distant ride tracks, the smooth light gray pavement, and the warm afternoon light" },
  }),
  scenes: Object.freeze([
    {
      scene: 16, key: "s16_close", role: "save", video: "story_ep12_s16_close_motion.mp4",
      narration: "값이 오르기 전에 이름을 숨기고 사 모은 쪽이, 가격을 정한 거야. 더 궁금하면 팔로우해 줘.",
      imageBrief: "부엉이가 정면을 보며 한쪽 날개를 가슴 앞에 가볍게 모아 차분히 정리해 주는 듯한 따뜻한 표정으로 시청자에게 말하는 포즈, 다른 날개는 자연스럽게 내리고 소품은 들지 않음. 구도 규칙(가장 중요): 부엉이는 화면 아래쪽 절반(세로 45~95%)에 서 있고 머리·얼굴·선글라스는 세로 45%보다 아래에 오게 하며, 화면 위쪽 40%에는 부엉이 없이 건물·하늘·조명 같은 배경만 보이게 해.",
      shot: "medium", bg: "P",
      lock: "the fountain and the tracks stay fixed; no castle, tower, flag or text appears; the sunglasses stay on top of the head; no props are held.",
      speaks: true,
      motion: motion("the character gestures gently with one wing at chest height while summarizing, then gives a small warm nod to the viewer; no props are held", "warm summary and invitation to follow"),
    },
  ]),
});

// ── 조립 스펙(run-owl-assemble-shorts-v2.mjs) — 제목은 ★임시안(Owner 확정 필요) ──
// 조립: node scripts/run-owl-assemble-shorts-v2.mjs --spec-module ./_story-ep12-assembly-spec.mjs --spec-export STORY_EP12_ASSEMBLE_SPEC --clip-dir C:/tmp/story-ep12-clips-named --audio-summary C:/tmp/money-shorts-os/story-ep12-tts/output-v1/tempo-1.2-gap0.25-pre/elevenlabs-scene-paced-tts-summary.audio-fixed.tempo1.2-gap0.25-pre.json --tts-script C:/tmp/money-shorts-os/story-ep12-tts/story-ep12-tts-script.json --out-dir C:/tmp/story-ep12-assembled
const STORY_RENDER = Object.freeze({
  width: 1080, height: 1920, fps: 24, videoCodec: "libx264", crf: 18, pixFmt: "yuv420p",
  audioCodec: "aac", audioBitrate: "192k", audioSampleRate: 48000, audioChannels: 1,
});

export const STORY_EP12_FULL_SPEC = Object.freeze({
  ...STORY_EP12_SEMI_SPEC,
  sceneBackgrounds: Object.freeze({ ...STORY_EP12_SEMI_SPEC.sceneBackgrounds, ...STORY_EP12_END_SPEC.sceneBackgrounds }),
  scenes: Object.freeze([...STORY_EP12_SEMI_SPEC.scenes, ...STORY_EP12_END_SPEC.scenes]),
});

export const STORY_EP12_ASSEMBLE_SPEC = Object.freeze({
  ...STORY_EP12_FULL_SPEC,
  headerTitle: Object.freeze(["이름을 숨기고","사 모은 땅","디즈니월드"]),
  videoShiftDownPx: 230,
  videoShiftFadePx: 260,
  headerTopY: 345,
  headerScrimHeight: 780,
  captionFontSize: 102,
  captionY: 1385,
  captionPlanner: "scene_dp_v1",
  footerChannelBar: false,
  captionLayout: "v2",
  emphasisTerms: Object.freeze(["디즈니","에이커","신문","바바르","애너하임","주지사","플로리다"]),
  emphasisNumberPatterns: Object.freeze(["[0-9,.]+%","[0-9]+배","[0-9]+명","[0-9,.]+억","[0-9,.]+만"]),
  captionEmphasisPop: true,
  captionGapBridgeSec: 0.3,
  captionLastSceneNoMargin: true,
  captionSceneEndMarginSec: 0.1,
  captionLeadSec: 0.12,
  hookType: "story",
  render: STORY_RENDER,
  scenes: Object.freeze(STORY_EP12_FULL_SPEC.scenes.map((s) => Object.freeze({ ...s, overlays: [] }))),
});
