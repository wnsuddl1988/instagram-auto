/**
 * 스토리형 10편 — 유한킴벌리 4조 2교대 재연 장면 스펙 (2026-10-09).
 *
 * 기준: `_ai/story-script-rules.md` + 확정 대본 `C:/tmp/story-ep10-yuhan-kimberly/scenes-v5.json`(16장면 525자, Owner 확정 2026-10-09).
 * 설계 `C:/tmp/story-ep10-yuhan-kimberly/story-design.json`. TTS `C:/tmp/money-shorts-os/story-ep10-tts/output-v1/tempo-1.2-gap0.25-pre/…audio-fixed…json`(79.77초).
 * 화풍: 반사실 3D(storysemi, Owner 확정). 1~15번 재연 장면 + 16번 부엉박사 진행자 컷.
 *
 * 이미지 규칙(CURRENT_STANDARDS 이미지 3대 원칙 + 스토리형, 7·9편과 동일):
 *  - 화면에 글자·숫자·로고·브랜드·회사 이름·제품 이름을 넣지 않는다(숫자는 자막이 맡는다). 티슈 상자·달력·칠판·게시판은 무늬와 색 덩어리만.
 *  - 실제 회사의 색·로고·마크를 흉내 내지 않는다(중립 색, 흰 상자). 실존 인물(사장·노조 위원장)을 닮게 그리지 않는다.
 *  - 소품은 두 손으로 감싸 쥐거나 탁자·바닥에 거치. 빈 면 금지. 핵심 피사체는 세로 15~62%(자막 자리 비움).
 *  - ★ 실존 인물 오인 방지: 얼굴이 크게 보이는 정면·근접 구도를 피하고 인물은 뒷모습·멀리 있는 작은 모습·손과 소품 위주.
 *  - 1990년대 한국 제지·위생용품 공장(작업복·안전모, 대형 롤 설비, 컨베이어).
 *
 * 이미지 생성: ① 1~15번 `ALLOW_CHATGPT_IMAGE=1 node scripts/probe-character-consistency-chatgpt-v1.mjs --character storysemi --scene-spec ./_story-ep10-assembly-spec.mjs --scene-spec-export STORY_EP10_SEMI_SPEC --out-dir C:/tmp/story-ep10-images`
 *            ② 16번(부엉박사) `… --character owl3dv5 --scene-spec ./_story-ep10-assembly-spec.mjs --scene-spec-export STORY_EP10_END_SPEC --out-dir C:/tmp/story-ep10-images`
 */

const NO_TEXT = "화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(상자·달력·칠판·게시판·서류·계기판 모두 무늬와 색 덩어리만).";
const motion = (action, mood) => ({ type: "scene", action, mood });

const FACE_SAFE = " 구도 규칙(가장 중요): 카메라를 낮게 잡아 인물의 머리는 화면 세로 45%보다 아래(45~85% 구간)에 오게 하고, 화면 위쪽 40%에는 사람·머리가 하나도 없이 벽·창문·천장·조명·하늘 같은 배경만 보이게 해.";
const WORKERS = "연한 회색 작업복과 흰 안전모를 쓴 한국 공장 직원";
const BOX = "글자와 로고가 전혀 없는 흰색 티슈 상자";

export const STORY_EP10_SEMI_SPEC = Object.freeze({
  specVersion: "story_assembly_spec_v1",
  scriptStructureVersion: "story_format_structure_v3",
  formatProfile: "story_v1",
  episode: 10,
  displayEpisode: 10,
  sourceCandidate: "story-ep10-yuhan-kimberly-4jo2gyo",
  title: "유한킴벌리 — 한 명도 해고하지 않은 4조 2교대",
  channelName: "경제번역소",
  characterDisplayName: "부엉박사",
  imageCharacter: "storysemi",
  imagePrefix: "story_ep10",
  storyStyleOnlyIdentity:
    "1990년대 한국 공장을 배경으로 한 재연 장면 시리즈의 한 장면이야. 화풍: 고품질 반사실 3D CG 렌더링(시네마틱 게임 컷신·CG 다큐 재연 화면 같은 느낌) — 사람의 얼굴·눈·머리·몸 비율은 실제 사람처럼 사실적으로, " +
    "피부·옷·재질은 매끈한 CG 질감, 영화 같은 자연광과 부드러운 그림자, 차분하고 진지한 색감. 큰 눈·둥근 얼굴·과장된 만화 비율(픽사풍) 금지, 실제 사진처럼 보이는 실사도 금지. " +
    "장면 설명에 나오는 인물 외에는 아무도 그리지 마. 세로 9:16.",
  storySameStyleRule:
    "앞 장면들과 똑같은 반사실 3D CG 화풍(사실적인 사람 비율, 매끈한 CG 질감, 같은 시네마틱 조명·색감)을 유지해. " +
    "장면 설명에 없는 인물·글자·숫자·로고는 넣지 마. 얼굴을 크게 보이게 하지 말고 장면 설명대로 뒷모습·작은 모습·손과 소품 위주로 그려. 픽사풍 큰 눈·만화 비율 금지, 실사 사진 금지. 세로 9:16.",

  sceneBackgrounds: Object.freeze({
    A: {
      label: "절반만 돌아가는 공장(1번)",
      image: `넓은 제지·위생용품 공장 내부. 생산 라인의 왼쪽 절반은 불이 켜지고 설비가 돌아가며 흰 종이 롤이 감기고, 오른쪽 절반은 불이 꺼져 어둡고 멈춰 있다. 앞쪽에 ${WORKERS} 두세 명이 뒷모습으로 서서 불 켜진 쪽을 바라본다(얼굴 안 보임).`,
      videoStyle: "wide paper and hygiene products factory interior, the left half of the production line lit and running with white paper rolls winding, the right half dark and idle, a few workers in light gray uniforms and white helmets seen from behind in front",
      videoStatics: "the dark idle right half of the line, the factory walls, the ceiling lights, and the workers seen from behind",
    },
    B: {
      label: "멈춘 설비를 바라보는 직원(2번)",
      image: `불이 꺼진 설비 앞에서 ${WORKERS} 한 명이 장갑 낀 한 손을 멈춘 기계 위에 올린 채 뒷모습으로 서서 어두운 공장 안쪽을 바라본다(얼굴 안 보임). 먼 곳에만 작은 불빛 몇 개.`,
      videoStyle: "a worker in a light gray uniform and white helmet seen from behind resting a gloved hand on an idle machine, looking into the dark factory with only a few distant small lights",
      videoStatics: "the idle machine, the dark factory interior, and the few distant lights",
    },
    C: {
      label: "흰 상자가 줄지어 가는 컨베이어(3번)",
      image: `밝은 공장 컨베이어 위에 ${BOX}가 줄지어 천천히 이동한다. 상자 면에는 아무 무늬도 글자도 없다. 컨베이어 뒤로 포장 라인이 흐릿하게. 사람 없음. 따뜻한 조명.`,
      videoStyle: "bright factory conveyor belt carrying a line of plain white tissue boxes with no markings, a packing line blurred behind, warm light",
      videoStatics: "the conveyor frame, the blurred packing line behind, and the warm light",
    },
    D: {
      label: "근무표 앞의 노사 회의(4번)",
      image: `회의실. 탁자 한쪽에 양복 입은 사람이 뒷모습으로 서서 벽 화면의 글자 없는 색 블록 근무표를 가리키고, 맞은편에 ${WORKERS}과 노조 조끼를 입은 사람들이 팔짱을 끼고 뒷모습으로 앉아 고개를 젓는다(얼굴 안 보임). 낮의 햇살.`,
      videoStyle: "meeting room with a suited person seen from behind pointing at a wall screen showing a plain colored-block schedule, across the table workers in vests with folded arms seen from behind shaking their heads",
      videoStatics: "the meeting table, the wall screen with the plain schedule blocks, and the daylight window",
    },
    E: {
      label: "먼지 쌓인 멈춘 컨베이어와 쉬는 직원들(5번)",
      image: `멈춘 컨베이어 벨트에 먼지가 얇게 앉아 있고, ${WORKERS} 서너 명이 나무 상자 위에 걸터앉아 할 일 없이 쉬고 있다(작은 모습, 뒷모습, 얼굴 안 보임). 어두운 공장에 창문 빛줄기 하나.`,
      videoStyle: "an idle conveyor belt with a thin layer of dust and a few workers in light gray uniforms sitting on wooden crates with nothing to do seen small from behind, one shaft of window light in the dim factory",
      videoStatics: "the idle dusty conveyor, the wooden crates, the dim factory, and the single shaft of window light",
    },
    F: {
      label: "절반 아래를 가리키는 계기판(6번)",
      image: `공장 벽에 걸린 커다란 둥근 계기판. 글자·숫자 없이 눈금 무늬만 있고 바늘이 절반 아래쪽을 가리킨다. 그 앞에 ${WORKERS} 두 명이 뒷모습으로 서서 올려다본다(얼굴 안 보임). 형광등 불빛.`,
      videoStyle: "a large round gauge on a factory wall with plain tick marks and no numbers, the needle pointing below the halfway mark, two workers in uniforms and helmets seen from behind looking up",
      videoStatics: "the large gauge with its needle below halfway, the factory wall, and the fluorescent light",
    },
    G: {
      label: "공장 복도 게시판 앞의 직원(7번)",
      image: `공장 복도의 코르크 게시판 앞. 글자 없이 줄무늬만 있는 흰 종이 한 장이 새로 압정으로 붙어 있고, ${WORKERS} 한 명이 뒷모습으로 서서 그것을 올려다본다(얼굴 안 보임). 복도 끝에 약한 불빛.`,
      videoStyle: "a factory corridor cork notice board with one newly pinned white paper showing only plain lines, a worker in uniform and helmet seen from behind looking up at it, weak light at the end of the corridor",
      videoStatics: "the cork board, the corridor walls, and the weak light at the end of the corridor",
    },
    H: {
      label: "세 무리에서 네 무리로 그린 칠판(8번)",
      image: `노조 사무실의 칠판. 글자·숫자 없이 사람 모양 동그라미 세 무리가 한 줄로 그려져 있고, 그 아래에 네 무리로 다시 그려진 줄이 있다. ${WORKERS} 서너 명이 칠판 앞에서 뒷모습으로 고개를 끄덕인다(얼굴 안 보임).`,
      videoStyle: "a union office blackboard drawn with a row of three groups of small circles and below it a row of four groups, no text or numbers, a few workers in uniforms seen from behind nodding",
      videoStatics: "the blackboard with the three and four groups of circles, the office walls, and the daylight",
    },
    I: {
      label: "근무 계획표를 내미는 손(9번)",
      image: "탁자 위 근접 장면. 노조 조끼 소매의 한 손이 글자·숫자 없이 두 가지 색 블록이 번갈아 이어지는 근무 계획표 한 장을 맞은편으로 밀어 건네고, 양복 소매의 다른 손이 그 종이를 받으려 한다. 얼굴 없음(손만). 따뜻한 조명.",
      videoStyle: "close view of a hand in a vest sleeve sliding a plain schedule sheet of alternating two-colored blocks across a table toward a hand in a suit sleeve",
      videoStatics: "the table, the schedule sheet with alternating colored blocks, and the warm light",
    },
    J: {
      label: "교육실의 직원들(10번)",
      image: `교육실. 책상에 ${WORKERS} 여러 명이 노트를 펴고 앉아 앞쪽 글자 없는 밝은 화면을 바라보는 뒷모습(얼굴 안 보임). 화면에는 색 도형만. 차분한 오후 빛.`,
      videoStyle: "a training room with several workers in uniforms seated at desks with open notebooks seen from behind looking at a bright screen showing only plain colored shapes",
      videoStatics: "the desks, the bright screen with the colored shapes, and the calm afternoon light",
    },
    K: {
      label: "세 줄 선반과 네 줄 선반(11번)",
      image: "직원 탈의실의 벽. 흰 안전모를 얹은 선반이 왼쪽에 세 줄, 오른쪽에 네 줄 있고, 늘어난 한 줄만 밝은 불빛을 받고 있다. 선반과 안전모에는 글자·번호가 없다. 사람 없음.",
      videoStyle: "a changing room wall with shelves holding white helmets, three rows on the left and four rows on the right, the extra fourth row brightly lit, no markings",
      videoStatics: "the shelves with the white helmets, the changing room wall, and the lighting",
    },
    L: {
      label: "한 작업장만 환한 공장(12번)",
      image: `넓은 공장 안에서 한 작업장만 밝은 불빛을 받아 환하고 ${WORKERS} 서너 명이 그곳에서 일한다(작은 모습, 뒷모습, 얼굴 안 보임). 나머지 공간은 어둡고 조용하다.`,
      videoStyle: "wide factory interior where only one workstation is brightly lit with a few workers in uniforms working there seen small from behind, the rest of the space dark and quiet",
      videoStatics: "the dark surrounding factory space and the factory ceiling",
    },
    M: {
      label: "새벽 공장 세 동(13번)",
      image: "새벽 하늘 아래 공장 건물 세 동과 굴뚝이 서 있는 전경(넓은 구도). 건물마다 창문에 하나둘 불이 켜진다. 건물에 글자·로고 없음. 사람 없음. 주황빛 새벽 노을.",
      videoStyle: "wide dawn view of three factory buildings with chimneys under an orange sunrise sky and windows lighting up one by one, no signs or logos",
      videoStatics: "the three factory buildings, the chimneys, and the orange dawn sky",
    },
    N: {
      label: "두 컨베이어의 상자 수(14번)",
      image: `나란한 두 컨베이어 벨트. 왼쪽 벨트에는 ${BOX}가 드문드문 놓여 있고 오른쪽 벨트에는 같은 상자가 두 배 가까이 빽빽하게 놓여 있다. 상자에는 아무 무늬도 글자도 없다. 사람 없음. 밝은 공장 조명.`,
      videoStyle: "two parallel conveyor belts, the left one with sparse plain white boxes and the right one with nearly twice as many tightly packed, bright factory lighting",
      videoStatics: "the two conveyor frames and the bright factory lighting",
    },
    O2: {
      label: "동전 탑 두 쌍(15번)",
      image: "밝은 책상 위에 금빛 동전 탑이 두 쌍 놓여 있다. 첫 쌍은 낮은 탑 옆에 두 배 높이의 탑, 둘째 쌍은 작은 탑 옆에 여섯 배쯤 높이의 아주 높은 탑이다. 동전에는 글자·숫자가 없다. 사람 없음. 따뜻한 조명.",
      videoStyle: "bright desk with two pairs of gold coin towers, the first pair a low tower beside one twice as tall, the second pair a tiny tower beside one about six times taller, plain coins",
      videoStatics: "the desk and the warm light",
    },
  }),

  scenes: Object.freeze([
    {
      scene: 1, key: "s1_hook", role: "hook", video: "story_ep10_s1_hook_motion.mp4",
      narration: "외환위기 때 공장이 절반쯤밖에 안 돌았는데도, 유한킴벌리는 직원을 한 명도 해고하지 않았어.",
      imageBrief: `넓은 제지·위생용품 공장 내부. 생산 라인의 왼쪽 절반은 불이 켜지고 설비가 돌아가며 흰 종이 롤이 감기고, 오른쪽 절반은 불이 꺼져 어둡고 멈춰 있다. 앞쪽에 ${WORKERS} 두세 명이 뒷모습으로 서서 불 켜진 쪽을 바라본다. ` + NO_TEXT + FACE_SAFE,
      shot: "medium", bg: "A",
      lock: "the workers stay seen from behind with no face ever shown; the left half keeps running and the right half stays dark and idle; the factory has no signs, logos or text; nobody else enters.",
      motion: motion("the paper roll on the lit left half keeps winding while the workers watch, the dark right half and the factory walls stay completely still", "half the factory runs"),
    },
    {
      scene: 2, key: "s2_how", role: "evidence", video: "story_ep10_s2_how_motion.mp4",
      narration: "어떻게 그럴 수 있었을까?",
      imageBrief: `불이 꺼진 설비 앞에서 ${WORKERS} 한 명이 장갑 낀 한 손을 멈춘 기계 위에 올린 채 뒷모습으로 서서 어두운 공장 안쪽을 바라본다. 먼 곳에만 작은 불빛 몇 개. ` + NO_TEXT + FACE_SAFE,
      shot: "medium", bg: "B",
      lock: "the worker stays seen from behind with no face ever shown; the idle machine and the dark factory stay fixed; no text or logos; nobody else enters.",
      motion: motion("the worker slowly lifts his gloved hand off the machine and looks around the dark factory, the machine and the factory stay completely still", "a question hangs"),
    },
    {
      scene: 3, key: "s3_company", role: "evidence", video: "story_ep10_s3_company_motion.mp4",
      narration: "크리넥스를 만드는 회사 이야기야.",
      imageBrief: `밝은 공장 컨베이어 위에 ${BOX}가 줄지어 천천히 이동한다. 상자 면에는 아무 무늬도 글자도 없다. 컨베이어 뒤로 포장 라인이 흐릿하게. 사람 없음. 따뜻한 조명. ` + NO_TEXT,
      shot: "close", bg: "C",
      lock: "the boxes keep plain white faces with no text, logos or patterns; no people appear; the conveyor frame and the blurred line behind stay fixed.",
      motion: motion("the plain white boxes glide steadily along the conveyor one after another, the frame and the background stay completely still", "an everyday product"),
    },
    {
      scene: 4, key: "s4_ceo1995", role: "evidence", video: "story_ep10_s4_ceo1995_motion.mp4",
      narration: "1995년, 새로 사장이 된 문국현이 대전 공장에서 쓰던 근무 방식을 다른 공장에도 들이려 했지만, 노조의 반발로 무산됐지.",
      imageBrief: `회의실. 탁자 한쪽에 양복 입은 사람이 뒷모습으로 서서 벽 화면의 글자 없는 색 블록 근무표를 가리키고, 맞은편에 ${WORKERS}과 노조 조끼를 입은 사람들이 팔짱을 끼고 뒷모습으로 앉아 고개를 젓는다. 낮의 햇살. ` + NO_TEXT + FACE_SAFE,
      shot: "medium", bg: "D",
      lock: "the people stay seen from behind with no face ever shown, and the standing person is not made to resemble any real person; the wall screen keeps only plain colored blocks with no text or numbers; the table and the window stay fixed.",
      motion: motion("the standing person points at the schedule blocks while the seated workers shake their heads slowly, the table and the screen stay completely still", "a proposal refused"),
    },
    {
      scene: 5, key: "s5_slump", role: "evidence", video: "story_ep10_s5_slump_motion.mp4",
      narration: "그 뒤 경기가 나빠지면서 공장이 서고, 일손이 남아돌기 시작했어.",
      imageBrief: `멈춘 컨베이어 벨트에 먼지가 얇게 앉아 있고, ${WORKERS} 서너 명이 나무 상자 위에 걸터앉아 할 일 없이 쉬고 있다(작은 모습, 뒷모습). 어두운 공장에 창문 빛줄기 하나. ` + NO_TEXT,
      shot: "wide", bg: "E",
      lock: "the workers stay small and seen from behind with no face shown; the dusty idle conveyor and the crates stay fixed; no text or logos.",
      motion: motion("dust motes drift in the single shaft of light and one worker shifts on his crate, the conveyor and the factory stay completely still", "idle hands"),
    },
    {
      scene: 6, key: "s6_util50", role: "evidence", video: "story_ep10_s6_util50_motion.mp4",
      narration: "1997년 외환위기가 닥치자 공장 가동률은 50%대까지 떨어졌어. 일감은 줄었는데 일할 사람은 그대로였지.",
      imageBrief: `공장 벽에 걸린 커다란 둥근 계기판. 글자·숫자 없이 눈금 무늬만 있고 바늘이 절반 아래쪽을 가리킨다. 그 앞에 ${WORKERS} 두 명이 뒷모습으로 서서 올려다본다. 형광등 불빛. ` + NO_TEXT + FACE_SAFE,
      shot: "medium", bg: "F",
      lock: "the two workers stay seen from behind with no face ever shown; the gauge keeps only plain tick marks with no numbers or text; the wall and the lights stay fixed.",
      motion: motion("the gauge needle trembles and settles slightly below halfway while the two workers watch, the wall and the lights stay completely still", "falling output"),
    },
    {
      scene: 7, key: "s7_layoff_near", role: "core_question", video: "story_ep10_s7_layoff_near_motion.mp4",
      narration: "정리해고가 눈앞에 와 있었어. 1995년에 반발했던 노조는 이번엔 어떻게 했을까?",
      imageBrief: `공장 복도의 코르크 게시판 앞. 글자 없이 줄무늬만 있는 흰 종이 한 장이 새로 압정으로 붙어 있고, ${WORKERS} 한 명이 뒷모습으로 서서 그것을 올려다본다. 복도 끝에 약한 불빛. ` + NO_TEXT + FACE_SAFE,
      shot: "medium", bg: "G",
      lock: "the worker stays seen from behind with no face ever shown; the paper keeps only plain lines with no text; the board and the corridor stay fixed.",
      motion: motion("the worker lifts a hand toward the pinned paper and then lowers it, the weak corridor light flickers once, the board and the corridor stay completely still", "a notice looms"),
    },
    {
      scene: 8, key: "s8_union_accepts", role: "evidence", video: "story_ep10_s8_union_accepts_motion.mp4",
      narration: "그런데 노조는 반대하지 않았어. 일하는 조를 셋에서 넷으로 늘리자는 안을 받아들였지.",
      imageBrief: `노조 사무실의 칠판. 글자·숫자 없이 사람 모양 동그라미 세 무리가 한 줄로 그려져 있고, 그 아래에 네 무리로 다시 그려진 줄이 있다. ${WORKERS} 서너 명이 칠판 앞에서 뒷모습으로 고개를 끄덕인다. ` + NO_TEXT + FACE_SAFE,
      shot: "medium", bg: "H",
      lock: "the workers stay seen from behind with no face ever shown; the blackboard keeps only plain circles in groups with no text or numbers; the office stays fixed.",
      motion: motion("the workers nod slowly and one raises a hand toward the fourth group of circles, the blackboard and the office stay completely still", "agreement"),
    },
    {
      scene: 9, key: "s9_four_two", role: "evidence", video: "story_ep10_s9_four_two_motion.mp4",
      narration: "거기서 한발 더 나아가, 12시간씩 4일 일하고 4일 쉬는 4조 2교대를 먼저 제안했다고 해.",
      imageBrief: "탁자 위 근접 장면. 노조 조끼 소매의 한 손이 글자·숫자 없이 두 가지 색 블록이 번갈아 이어지는 근무 계획표 한 장을 맞은편으로 밀어 건네고, 양복 소매의 다른 손이 그 종이를 받으려 한다. 얼굴은 그리지 마(손만). " + NO_TEXT,
      shot: "close", bg: "I",
      lock: "no face or body appears — only the two hands and the sleeves; the sheet keeps only plain alternating colored blocks with no text or numbers; the table stays fixed.",
      motion: motion("the vest-sleeved hand pushes the sheet across the table and the suit-sleeved hand takes it, the table and the light stay completely still", "a proposal offered"),
    },
    {
      scene: 10, key: "s10_learning_day", role: "evidence", video: "story_ep10_s10_learning_day_motion.mp4",
      narration: "쉬는 날 중 하루는 회사에 나와 배우는 날이었어.",
      imageBrief: `교육실. 책상에 ${WORKERS} 여러 명이 노트를 펴고 앉아 앞쪽 글자 없는 밝은 화면을 바라보는 뒷모습. 화면에는 색 도형만. 차분한 오후 빛. ` + NO_TEXT + FACE_SAFE,
      shot: "medium", bg: "J",
      lock: "the workers stay seen from behind with no face ever shown; the screen keeps only plain colored shapes with no text; the desks and the room stay fixed.",
      motion: motion("the workers write in their notebooks and a few look up at the screen, the screen shapes shift softly, the desks and the room stay completely still", "learning on a day off"),
    },
    {
      scene: 11, key: "s11_jobs_third", role: "evidence", video: "story_ep10_s11_jobs_third_motion.mp4",
      narration: "조가 셋에서 넷으로 늘면 같은 일을 맡을 사람도 더 필요해져. 일자리가 3분의 1쯤 늘어나는 효과였지.",
      imageBrief: "직원 탈의실의 벽. 흰 안전모를 얹은 선반이 왼쪽에 세 줄, 오른쪽에 네 줄 있고, 늘어난 한 줄만 밝은 불빛을 받고 있다. 선반과 안전모에는 글자·번호가 없다. 사람 없음. " + NO_TEXT,
      shot: "close", bg: "K",
      lock: "the shelves keep three rows on the left and four rows on the right with the same helmets; no text, numbers or logos; no people appear.",
      motion: motion("a soft light brightens on the extra fourth row of helmets and holds, the shelves and the helmets stay completely still", "one more row of jobs"),
    },
    {
      scene: 12, key: "s12_pilot1998", role: "evidence", video: "story_ep10_s12_pilot1998_motion.mp4",
      narration: "1998년, 한 작업장에서 시범이 시작됐어.",
      imageBrief: `넓은 공장 안에서 한 작업장만 밝은 불빛을 받아 환하고 ${WORKERS} 서너 명이 그곳에서 일한다(작은 모습, 뒷모습). 나머지 공간은 어둡고 조용하다. ` + NO_TEXT,
      shot: "wide", bg: "L",
      lock: "the workers stay small and seen from behind with no face shown; only the one workstation stays lit; no text or logos.",
      motion: motion("the few workers move around the lit workstation and a machine there starts up, the dark surroundings stay completely still", "a trial begins"),
    },
    {
      scene: 13, key: "s13_spread1999", role: "evidence", video: "story_ep10_s13_spread1999_motion.mp4",
      narration: "직원들 반응은 좋았고, 1999년엔 다른 공장으로 넓혀졌지.",
      imageBrief: "새벽 하늘 아래 공장 건물 세 동과 굴뚝이 서 있는 전경(넓은 구도). 건물마다 창문에 하나둘 불이 켜진다. 건물에 글자·로고 없음. 사람 없음. 주황빛 새벽 노을. " + NO_TEXT,
      shot: "wide", bg: "M",
      lock: "the three factory buildings keep the same arrangement with no signs, logos or text; no people appear; only the window lights change.",
      motion: motion("the windows of the second and third buildings light up one after another as the sunrise glows, the buildings and the chimneys stay completely still", "it spreads"),
    },
    {
      scene: 14, key: "s14_productivity", role: "evidence", video: "story_ep10_s14_productivity_motion.mp4",
      narration: "한 명도 해고하지 않고도, 1998년과 2003년을 견주면 한 시간에 만드는 양은 4할 넘게 늘었어.",
      imageBrief: `나란한 두 컨베이어 벨트. 왼쪽 벨트에는 ${BOX}가 드문드문 놓여 있고 오른쪽 벨트에는 같은 상자가 두 배 가까이 빽빽하게 놓여 있다. 상자에는 아무 무늬도 글자도 없다. 사람 없음. 밝은 공장 조명. ` + NO_TEXT,
      shot: "medium", bg: "N",
      lock: "the two conveyors keep the sparse left and the packed right arrangement; the boxes keep plain white faces with no text; no people appear.",
      motion: motion("both belts carry their boxes forward at the same steady pace so the packed right belt clearly moves more boxes, the frames stay completely still", "more per hour"),
    },
    {
      scene: 15, key: "s15_profit", role: "evidence", video: "story_ep10_s15_profit_motion.mp4",
      narration: "1996년과 2003년을 견주면, 매출은 두 배쯤, 순이익은 여섯 배쯤 늘었지.",
      imageBrief: "밝은 책상 위에 금빛 동전 탑이 두 쌍 놓여 있다. 첫 쌍은 낮은 탑 옆에 두 배 높이의 탑, 둘째 쌍은 작은 탑 옆에 여섯 배쯤 높이의 아주 높은 탑이다. 동전에는 글자·숫자가 없다. 사람 없음. 따뜻한 조명. " + NO_TEXT,
      shot: "close", bg: "O2",
      lock: "the two pairs of coin towers keep the same heights; the coins keep no text or numbers; no people or hands appear.",
      motion: motion("a warm light rises along the tall coin tower and holds at its top, the towers and the desk stay completely still", "growth"),
    },
  ]),
});

// ── 16번(부엉박사 마무리) — owl3dv5 스펙으로 따로 생성 ──
export const STORY_EP10_END_SPEC = Object.freeze({
  specVersion: "story_assembly_spec_v1",
  episode: 10,
  imageCharacter: "owl3dv5",
  imagePrefix: "story_ep10",
  sceneBackgrounds: Object.freeze({
    P: {
      label: "공장 출입구 앞마당(16번 부엉박사)",
      image: "밝은 오후 한국 공장 출입구 앞마당. 부엉박사 뒤로 글자 없는 공장 건물 한 동과 열린 출입문, 바닥에 흰 상자를 실은 팔레트 두 개(상자에 글자 없음). 바닥은 매끈한 연한 회색 포장, 따뜻한 오후 햇빛.",
      videoStyle: "bright afternoon yard in front of a Korean factory gate with a plain factory building, an open gate, and two pallets of plain white boxes on the ground",
      videoStatics: "the plain factory building, the open gate, the two pallets of plain white boxes, the smooth light gray pavement, and the warm afternoon light",
    },
  }),
  scenes: Object.freeze([
    {
      scene: 16, key: "s16_close", role: "save", video: "story_ep10_s16_close_motion.mp4",
      narration: "일감이 줄었을 때 한 명도 해고하지 않고 일을 나눠 맡았더니, 놀던 기계가 다시 돌고 회사도 커졌어. 위기를 넘긴 회사 이야기가 더 궁금하면 팔로우해 줘.",
      imageBrief: "부엉이가 정면을 보며 한쪽 날개를 가슴 앞에 가볍게 모아 차분히 정리해 주는 듯한 따뜻한 표정으로 시청자에게 말하는 포즈, 다른 날개는 자연스럽게 내리고 소품은 들지 않음. 구도 규칙(가장 중요): 부엉이는 화면 아래쪽 절반(세로 45~95%)에 서 있고 머리·얼굴·선글라스는 세로 45%보다 아래에 오게 하며, 화면 위쪽 40%에는 부엉이 없이 건물·하늘·조명 같은 배경만 보이게 해.",
      shot: "medium", bg: "P",
      lock: "the factory building and the pallets stay fixed; the sunglasses stay on top of the head; no props are held.",
      speaks: true,
      motion: motion("the character gestures gently with one wing at chest height while summarizing, then gives a small warm nod to the viewer; no props are held", "warm summary and invitation to follow"),
    },
  ]),
});

// ── 스토리형 조립 스펙(조립기 run-owl-assemble-shorts-v2.mjs 용) — 5편 STORY_EP5_ASSEMBLE_SPEC과 같은 구성(2026-10-10) ──
// 제목(★임시안 — Owner 확정 필요, 영상 속 제목·커버 문구 동일): 한 명도 안 자른 / 유한킴벌리의 / 4조 2교대
// 조립: node scripts/run-owl-assemble-shorts-v2.mjs --spec-module ./_story-ep10-assembly-spec.mjs --spec-export STORY_EP10_ASSEMBLE_SPEC --clip-dir C:/tmp/story-ep10-clips-named --audio-summary C:/tmp/money-shorts-os/story-ep10-tts/output-v1/tempo-1.2-gap0.25-pre/elevenlabs-scene-paced-tts-summary.audio-fixed.tempo1.2-gap0.25-pre.json --tts-script C:/tmp/money-shorts-os/story-ep10-tts/story-ep10-tts-script.json --out-dir C:/tmp/story-ep10-assembled
const STORY_RENDER = Object.freeze({
  width: 1080, height: 1920, fps: 24, videoCodec: "libx264", crf: 18, pixFmt: "yuv420p",
  audioCodec: "aac", audioBitrate: "192k", audioSampleRate: 48000, audioChannels: 1,
});

export const STORY_EP10_FULL_SPEC = Object.freeze({
  ...STORY_EP10_SEMI_SPEC,
  sceneBackgrounds: Object.freeze({ ...STORY_EP10_SEMI_SPEC.sceneBackgrounds, ...STORY_EP10_END_SPEC.sceneBackgrounds }),
  scenes: Object.freeze([...STORY_EP10_SEMI_SPEC.scenes, ...STORY_EP10_END_SPEC.scenes]),
});

export const STORY_EP10_ASSEMBLE_SPEC = Object.freeze({
  ...STORY_EP10_FULL_SPEC,
  headerTitle: Object.freeze(["한 명도 안 자른","유한킴벌리의","4조 2교대"]),
  videoShiftDownPx: 230,
  videoShiftFadePx: 260,
  headerTopY: 345,
  headerScrimHeight: 780,
  captionFontSize: 102,
  captionY: 1385,
  captionPlanner: "scene_dp_v1",
  footerChannelBar: false,
  captionLayout: "v2",
  emphasisTerms: Object.freeze(["유한킴벌리","정리해고","해고","4조 2교대","가동률","외환위기","노조"]),
  emphasisNumberPatterns: Object.freeze(["[0-9,.]+%","[0-9]+조","[0-9]+배","[0-9]+명"]),
  captionEmphasisPop: true,
  captionGapBridgeSec: 0.3,
  captionLastSceneNoMargin: true,
  captionSceneEndMarginSec: 0.1,
  captionLeadSec: 0.12,
  hookType: "story",
  render: STORY_RENDER,
  scenes: Object.freeze(STORY_EP10_FULL_SPEC.scenes.map((s) => Object.freeze({ ...s, overlays: [] }))),
});
